import json
import logging
import os
from datetime import datetime, timezone

import litellm
from fastapi import APIRouter, Depends, HTTPException

logger = logging.getLogger(__name__)
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ChatSession
from app.routers.doc_registry import (
    DOC_REGISTRY,
    SELECTION_GREETING,
    SELECTION_SCHEMA,
    SELECTION_SYSTEM_PROMPT,
    render_document,
)

router = APIRouter()


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _parse_session_messages(raw: str) -> list[dict]:
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError) as exc:
        raise HTTPException(status_code=500, detail="Corrupted session state") from exc


async def _llm(messages: list[dict], schema: dict) -> dict:
    # Inject JSON schema instruction into the system message so models that
    # ignore response_format still return structured JSON.
    schema_instruction = (
        f"\n\nYou MUST respond with ONLY valid JSON. No prose, no markdown, no code fences. "
        f"Your response must match this JSON schema exactly:\n{json.dumps(schema, indent=2)}"
    )
    patched = []
    injected = False
    for msg in messages:
        if msg["role"] == "system" and not injected:
            patched.append({"role": "system", "content": msg["content"] + schema_instruction})
            injected = True
        else:
            patched.append(msg)
    if not injected:
        patched.insert(0, {"role": "system", "content": schema_instruction})

    try:
        response = await litellm.acompletion(
            model="openrouter/openai/gpt-oss-120b:free",
            messages=patched,
            response_format={"type": "json_object"},
            extra_body={"provider": {"order": ["Cerebras"], "allow_fallbacks": True}},
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )
    except Exception as exc:
        logger.error("LLM call failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail=f"LLM call failed: {exc}") from exc
    content = response.choices[0].message.content
    logger.info("LLM raw response: %s", content[:500] if content else "<empty>")
    if not content:
        raise HTTPException(status_code=502, detail="LLM returned empty response")
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        logger.error("LLM returned invalid JSON: %s", content[:500])
        raise HTTPException(status_code=502, detail="LLM returned invalid JSON") from exc


class MessageRequest(BaseModel):
    content: str


@router.post("/sessions")
async def create_session(db: Session = Depends(get_db)):
    session = ChatSession()
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": session.id, "greeting": SELECTION_GREETING}


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: int,
    request: MessageRequest,
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_msg = {"role": "user", "content": request.content}
    history_for_llm = _parse_session_messages(session.messages) + [user_msg]

    if session.document_type is None:
        system_prompt = SELECTION_SYSTEM_PROMPT
        schema = SELECTION_SCHEMA
    else:
        doc = DOC_REGISTRY[session.document_type]
        system_prompt = doc["system_prompt"]
        schema = doc["msg_schema"]

    llm_messages = [{"role": "system", "content": system_prompt}] + history_for_llm
    result = await _llm(llm_messages, schema)

    db.refresh(session)
    updated = _parse_session_messages(session.messages)
    updated.append(user_msg)
    updated.append({"role": "assistant", "content": result["message"]})
    session.messages = json.dumps(updated)

    doc_type = result.get("document_type")
    if session.document_type is None and doc_type and doc_type in DOC_REGISTRY:
        session.document_type = doc_type

    db.commit()

    partial_data = result.get("partial_data") if session.document_type is not None else None

    return {
        "message": result["message"],
        "document_type": session.document_type,
        "partial_data": partial_data,
    }


@router.post("/sessions/{session_id}/generate")
async def generate_document(
    session_id: int,
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.document_type:
        raise HTTPException(status_code=400, detail="Document type not yet determined")

    if session.document_type not in DOC_REGISTRY:
        raise HTTPException(status_code=400, detail=f"Unknown document type: {session.document_type}")

    doc = DOC_REGISTRY[session.document_type]
    history = _parse_session_messages(session.messages)
    today = _today()
    generate_prompt = (
        f"Based on the conversation, produce a complete {doc['display_name']} data object. "
        f"Fill all fields. Use today {today} for unspecified dates. "
        f"Every field is required and non-null."
    )
    llm_messages = [
        {"role": "system", "content": generate_prompt},
        *history,
        {"role": "user", "content": f"Generate the complete {doc['display_name']} data now."},
    ]
    result = await _llm(llm_messages, doc["gen_schema"])

    if session.document_type == "mutual_nda":
        result["mndaTermYears"] = result.get("mndaTermYears") or 1
        result["confidentialityYears"] = result.get("confidentialityYears") or 1

    rendered_html = render_document(session.document_type, result)

    return {"fields": result, "rendered_html": rendered_html, "doc_type": session.document_type}
