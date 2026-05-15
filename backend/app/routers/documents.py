import json

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth_utils import get_current_user_email
from app.database import get_db
from app.models import Document, User

router = APIRouter()

_DOC_NAMES = {
    "mutual_nda": "Mutual NDA",
    "csa": "Cloud Service Agreement",
    "design_partner": "Design Partner Agreement",
    "sla": "Service Level Agreement",
    "psa": "Professional Services Agreement",
    "dpa": "Data Processing Agreement",
    "software_license": "Software License Agreement",
    "partnership": "Partnership Agreement",
    "pilot": "Pilot Agreement",
    "baa": "Business Associate Agreement",
    "ai_addendum": "AI Addendum",
}


def _make_title(doc_type: str, fields: dict) -> str:
    base = _DOC_NAMES.get(doc_type, doc_type)
    p1 = fields.get("party1") or {}
    p2 = fields.get("party2") or {}
    n1 = p1.get("companyName") or p1.get("clientName") or p1.get("vendorName") or ""
    n2 = p2.get("companyName") or p2.get("clientName") or p2.get("vendorName") or ""
    if n1 and n2:
        return f"{base} — {n1} & {n2}"
    if n1:
        return f"{base} — {n1}"
    return base


class SaveDocumentRequest(BaseModel):
    doc_type: str
    fields: dict
    rendered_html: str


@router.post("", status_code=status.HTTP_201_CREATED)
async def save_document(
    request: SaveDocumentRequest,
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user_email),
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    doc = Document(
        user_id=user.id,
        doc_type=request.doc_type,
        title=_make_title(request.doc_type, request.fields),
        fields_json=json.dumps(request.fields),
        rendered_html=request.rendered_html,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "title": doc.title,
        "doc_type": doc.doc_type,
        "created_at": doc.created_at.isoformat(),
    }


@router.get("")
async def list_documents(
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user_email),
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    docs = (
        db.query(Document)
        .filter(Document.user_id == user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [
        {
            "id": doc.id,
            "title": doc.title,
            "doc_type": doc.doc_type,
            "created_at": doc.created_at.isoformat(),
        }
        for doc in docs
    ]


@router.get("/{document_id}")
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user_email),
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "id": doc.id,
        "title": doc.title,
        "doc_type": doc.doc_type,
        "fields": json.loads(doc.fields_json),
        "rendered_html": doc.rendered_html,
        "created_at": doc.created_at.isoformat(),
    }
