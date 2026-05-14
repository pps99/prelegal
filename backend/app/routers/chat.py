import json
import os
from datetime import datetime, timezone

import litellm
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ChatSession

router = APIRouter()

GREETING = (
    "Hello! I'm here to help you draft a Mutual Non-Disclosure Agreement. "
    "Let's start — what are the names of the two companies entering into this agreement?"
)

CHAT_SYSTEM_PROMPT = """\
You are a friendly legal assistant helping a user complete a Mutual Non-Disclosure Agreement (MNDA).

Your job is to have a natural conversation to collect all required information, asking one or two items at a time.

Fields to collect:
- Party 1: company name, contact person's full name, their title/role, notice address (email or postal), signature date
- Party 2: same fields as Party 1
- Purpose: how confidential information may be used
- Effective Date: when the agreement starts (YYYY-MM-DD format; default to today if not specified)
- MNDA Term: "one_year" (ask how many years) or "until_terminated"
- Term of Confidentiality: "one_year" (ask how many years) or "in_perpetuity"
- Governing Law: US state name (e.g. "Delaware")
- Jurisdiction: city/county and state (e.g. "New Castle, DE")

Keep track of all information shared so far and include it in partial_nda_data.
Use null for fields not yet collected. Use YYYY-MM-DD for all dates.
For mndaTerm, use exactly "one_year" or "until_terminated".
For termOfConfidentiality, use exactly "one_year" or "in_perpetuity".
"""


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _null_str():
    return {"anyOf": [{"type": "string"}, {"type": "null"}]}


def _null_int():
    return {"anyOf": [{"type": "integer"}, {"type": "null"}]}


def _null_enum(*values: str):
    return {"anyOf": [{"type": "string", "enum": list(values)}, {"type": "null"}]}


def _party_schema(nullable: bool):
    str_type = _null_str() if nullable else {"type": "string"}
    return {
        "type": "object",
        "properties": {
            "companyName": str_type,
            "contactName": str_type,
            "title": str_type,
            "noticeAddress": str_type,
            "signatureDate": str_type,
        },
        "required": ["companyName", "contactName", "title", "noticeAddress", "signatureDate"],
        "additionalProperties": False,
    }


MESSAGE_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "partial_nda_data": {
            "type": "object",
            "properties": {
                "party1": _party_schema(nullable=True),
                "party2": _party_schema(nullable=True),
                "purpose": _null_str(),
                "effectiveDate": _null_str(),
                "mndaTerm": _null_enum("one_year", "until_terminated"),
                "mndaTermYears": _null_int(),
                "termOfConfidentiality": _null_enum("one_year", "in_perpetuity"),
                "confidentialityYears": _null_int(),
                "governingLaw": _null_str(),
                "jurisdiction": _null_str(),
            },
            "required": [
                "party1", "party2", "purpose", "effectiveDate",
                "mndaTerm", "mndaTermYears", "termOfConfidentiality",
                "confidentialityYears", "governingLaw", "jurisdiction",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["message", "partial_nda_data"],
    "additionalProperties": False,
}

GENERATE_SCHEMA = {
    "type": "object",
    "properties": {
        "party1": _party_schema(nullable=False),
        "party2": _party_schema(nullable=False),
        "purpose": {"type": "string"},
        "effectiveDate": {"type": "string"},
        "mndaTerm": {"type": "string", "enum": ["one_year", "until_terminated"]},
        "mndaTermYears": _null_int(),
        "termOfConfidentiality": {"type": "string", "enum": ["one_year", "in_perpetuity"]},
        "confidentialityYears": _null_int(),
        "governingLaw": {"type": "string"},
        "jurisdiction": {"type": "string"},
    },
    "required": [
        "party1", "party2", "purpose", "effectiveDate",
        "mndaTerm", "mndaTermYears", "termOfConfidentiality",
        "confidentialityYears", "governingLaw", "jurisdiction",
    ],
    "additionalProperties": False,
}


def _parse_session_messages(raw: str) -> list[dict]:
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError) as exc:
        raise HTTPException(status_code=500, detail="Corrupted session state") from exc


async def _llm(messages: list[dict], schema: dict) -> dict:
    response = await litellm.acompletion(
        model="openrouter/openai/gpt-oss-120b:free",
        messages=messages,
        response_format={
            "type": "json_schema",
            "json_schema": {"name": "nda_response", "schema": schema},
        },
        extra_body={"provider": {"order": ["Cerebras"], "allow_fallbacks": True}},
        api_key=os.getenv("OPENROUTER_API_KEY"),
    )
    content = response.choices[0].message.content
    if not content:
        raise HTTPException(status_code=502, detail="LLM returned empty response")
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="LLM returned invalid JSON") from exc


class MessageRequest(BaseModel):
    content: str


@router.post("/sessions")
async def create_session(db: Session = Depends(get_db)):
    session = ChatSession()
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": session.id, "greeting": GREETING}


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

    llm_messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}] + history_for_llm
    result = await _llm(llm_messages, MESSAGE_RESPONSE_SCHEMA)

    # Re-fetch latest DB state before writing to minimise concurrent-update data loss
    db.refresh(session)
    updated = _parse_session_messages(session.messages)
    updated.append(user_msg)
    updated.append({"role": "assistant", "content": result["message"]})
    session.messages = json.dumps(updated)
    db.commit()

    return {
        "message": result["message"],
        "partial_nda_data": result["partial_nda_data"],
    }


@router.post("/sessions/{session_id}/generate")
async def generate_document(
    session_id: int,
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    history = _parse_session_messages(session.messages)
    today = _today()
    generate_prompt = (
        f"Based on our conversation, produce a complete NDA data object with all fields filled in. "
        f"For any fields not explicitly discussed use these defaults: "
        f"dates={today}, mndaTerm='one_year', mndaTermYears=1, "
        f"termOfConfidentiality='one_year', confidentialityYears=1, "
        f"purpose='Evaluating whether to enter into a business relationship with the other party.' "
        f"Use empty string for any names or addresses not provided. Every field is required and must be non-null."
    )
    llm_messages = [
        {"role": "system", "content": generate_prompt},
        *history,
        {"role": "user", "content": "Generate the complete NDA data now."},
    ]
    result = await _llm(llm_messages, GENERATE_SCHEMA)
    result["mndaTermYears"] = result.get("mndaTermYears") or 1
    result["confidentialityYears"] = result.get("confidentialityYears") or 1
    return {"nda_data": result}
