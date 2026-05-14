import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app
from app.database import init_db


@pytest.fixture(autouse=True)
def fresh_db():
    init_db()
    yield


@pytest.fixture
def client():
    return TestClient(app)


def _mock_llm(content: dict):
    msg = MagicMock()
    msg.content = json.dumps(content)
    choice = MagicMock()
    choice.message = msg
    response = MagicMock()
    response.choices = [choice]
    return AsyncMock(return_value=response)


EMPTY_PARTIAL = {
    "party1": {"companyName": None, "contactName": None, "title": None, "noticeAddress": None, "signatureDate": None},
    "party2": {"companyName": None, "contactName": None, "title": None, "noticeAddress": None, "signatureDate": None},
    "purpose": None,
    "effectiveDate": None,
    "mndaTerm": None,
    "mndaTermYears": None,
    "termOfConfidentiality": None,
    "confidentialityYears": None,
    "governingLaw": None,
    "jurisdiction": None,
}

FULL_NDA = {
    "party1": {"companyName": "Acme", "contactName": "Jane", "title": "CEO", "noticeAddress": "123 Main", "signatureDate": "2026-01-01"},
    "party2": {"companyName": "Globex", "contactName": "John", "title": "CTO", "noticeAddress": "456 Oak", "signatureDate": "2026-01-01"},
    "purpose": "Evaluating partnership.",
    "effectiveDate": "2026-01-01",
    "mndaTerm": "one_year",
    "mndaTermYears": 1,
    "termOfConfidentiality": "one_year",
    "confidentialityYears": 1,
    "governingLaw": "Delaware",
    "jurisdiction": "New Castle, DE",
}


def _set_session_doc_type(client, session_id: int, doc_type: str):
    from app.database import SessionLocal
    from app.models import ChatSession
    db = SessionLocal()
    try:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        session.document_type = doc_type
        db.commit()
    finally:
        db.close()


class TestCreateSession:
    def test_creates_session(self, client):
        resp = client.post("/api/chat/sessions")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data["session_id"], int)

    def test_returns_greeting(self, client):
        resp = client.post("/api/chat/sessions")
        assert len(resp.json()["greeting"]) > 0

    def test_each_call_creates_unique_session(self, client):
        id1 = client.post("/api/chat/sessions").json()["session_id"]
        id2 = client.post("/api/chat/sessions").json()["session_id"]
        assert id1 != id2


class TestSendMessageSelectionPhase:
    @patch("app.routers.chat.litellm.acompletion")
    def test_selection_returns_message_and_null_partial(self, mock_llm, client):
        mock_llm.side_effect = _mock_llm({"message": "Which document?", "document_type": None})
        session_id = client.post("/api/chat/sessions").json()["session_id"]

        resp = client.post(f"/api/chat/sessions/{session_id}/messages", json={"content": "Hello"})

        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "Which document?"
        assert data["document_type"] is None
        assert data["partial_data"] is None

    @patch("app.routers.chat.litellm.acompletion")
    def test_selection_stores_document_type_when_identified(self, mock_llm, client):
        mock_llm.side_effect = _mock_llm({"message": "Great, let's create an NDA.", "document_type": "mutual_nda"})
        session_id = client.post("/api/chat/sessions").json()["session_id"]

        resp = client.post(f"/api/chat/sessions/{session_id}/messages", json={"content": "I need an NDA"})

        assert resp.status_code == 200
        data = resp.json()
        assert data["document_type"] == "mutual_nda"

    def test_returns_404_for_unknown_session(self, client):
        resp = client.post("/api/chat/sessions/9999/messages", json={"content": "Hello"})
        assert resp.status_code == 404


class TestSendMessageCollectionPhase:
    @patch("app.routers.chat.litellm.acompletion")
    def test_returns_message_and_partial_data(self, mock_llm, client):
        mock_llm.side_effect = _mock_llm({"message": "What companies?", "partial_data": EMPTY_PARTIAL})
        session_id = client.post("/api/chat/sessions").json()["session_id"]
        _set_session_doc_type(client, session_id, "mutual_nda")

        resp = client.post(f"/api/chat/sessions/{session_id}/messages", json={"content": "Hello"})

        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "What companies?"
        assert data["document_type"] == "mutual_nda"
        assert "partial_data" in data
        assert data["partial_data"] is not None

    @patch("app.routers.chat.litellm.acompletion")
    def test_persists_conversation_in_history(self, mock_llm, client):
        mock_llm.side_effect = _mock_llm({"message": "Reply 1", "partial_data": EMPTY_PARTIAL})
        session_id = client.post("/api/chat/sessions").json()["session_id"]
        _set_session_doc_type(client, session_id, "mutual_nda")
        client.post(f"/api/chat/sessions/{session_id}/messages", json={"content": "Message 1"})

        mock_llm.side_effect = _mock_llm({"message": "Reply 2", "partial_data": EMPTY_PARTIAL})
        resp = client.post(f"/api/chat/sessions/{session_id}/messages", json={"content": "Message 2"})
        assert resp.status_code == 200

        messages = mock_llm.call_args.kwargs["messages"]
        contents = [m["content"] for m in messages]
        assert "Message 1" in contents


class TestGenerateDocument:
    @patch("app.routers.chat.render_document")
    @patch("app.routers.chat.litellm.acompletion")
    def test_returns_fields_and_rendered_html(self, mock_llm, mock_render, client):
        mock_llm.side_effect = _mock_llm(FULL_NDA)
        mock_render.return_value = "<html>Test</html>"
        session_id = client.post("/api/chat/sessions").json()["session_id"]
        _set_session_doc_type(client, session_id, "mutual_nda")

        resp = client.post(f"/api/chat/sessions/{session_id}/generate")

        assert resp.status_code == 200
        data = resp.json()
        assert "fields" in data
        assert "rendered_html" in data
        assert data["fields"]["party1"]["companyName"] == "Acme"
        assert data["fields"]["governingLaw"] == "Delaware"
        assert data["rendered_html"] == "<html>Test</html>"

    def test_returns_400_when_no_document_type(self, client):
        session_id = client.post("/api/chat/sessions").json()["session_id"]
        resp = client.post(f"/api/chat/sessions/{session_id}/generate")
        assert resp.status_code == 400

    def test_returns_404_for_unknown_session(self, client):
        resp = client.post("/api/chat/sessions/9999/generate")
        assert resp.status_code == 404
