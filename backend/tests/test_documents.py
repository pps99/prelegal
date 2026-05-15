import pytest
from fastapi.testclient import TestClient

from app.database import init_db
from main import app

RENDERED_HTML = "<html><body>Test document</body></html>"
FIELDS = {
    "party1": {"companyName": "Acme", "contactName": "Jane"},
    "party2": {"companyName": "Globex", "contactName": "John"},
}


@pytest.fixture(autouse=True)
def fresh_db():
    init_db()
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    resp = client.post("/api/auth/register", json={"email": "user@example.com", "password": "password123"})
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}


class TestSaveDocument:
    def test_saves_document_and_returns_metadata(self, client, auth_headers):
        resp = client.post(
            "/api/documents",
            json={"doc_type": "mutual_nda", "fields": FIELDS, "rendered_html": RENDERED_HTML},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert "Mutual NDA" in data["title"]
        assert "Acme" in data["title"]

    def test_requires_auth(self, client):
        resp = client.post(
            "/api/documents",
            json={"doc_type": "mutual_nda", "fields": FIELDS, "rendered_html": RENDERED_HTML},
        )
        assert resp.status_code in (401, 403)


class TestListDocuments:
    def test_returns_empty_list_initially(self, client, auth_headers):
        resp = client.get("/api/documents", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_saved_documents(self, client, auth_headers):
        client.post(
            "/api/documents",
            json={"doc_type": "mutual_nda", "fields": FIELDS, "rendered_html": RENDERED_HTML},
            headers=auth_headers,
        )
        resp = client.get("/api/documents", headers=auth_headers)
        assert resp.status_code == 200
        docs = resp.json()
        assert len(docs) == 1
        assert docs[0]["doc_type"] == "mutual_nda"

    def test_only_returns_own_documents(self, client, auth_headers):
        client.post(
            "/api/documents",
            json={"doc_type": "mutual_nda", "fields": FIELDS, "rendered_html": RENDERED_HTML},
            headers=auth_headers,
        )
        other_resp = client.post("/api/auth/register", json={"email": "other@example.com", "password": "password123"})
        other_headers = {"Authorization": f"Bearer {other_resp.json()['token']}"}
        resp = client.get("/api/documents", headers=other_headers)
        assert resp.json() == []

    def test_requires_auth(self, client):
        resp = client.get("/api/documents")
        assert resp.status_code in (401, 403)


class TestGetDocument:
    def test_returns_document_with_html_and_fields(self, client, auth_headers):
        saved = client.post(
            "/api/documents",
            json={"doc_type": "mutual_nda", "fields": FIELDS, "rendered_html": RENDERED_HTML},
            headers=auth_headers,
        ).json()
        resp = client.get(f"/api/documents/{saved['id']}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["rendered_html"] == RENDERED_HTML
        assert data["fields"]["party1"]["companyName"] == "Acme"

    def test_returns_404_for_unknown(self, client, auth_headers):
        resp = client.get("/api/documents/9999", headers=auth_headers)
        assert resp.status_code == 404

    def test_cannot_access_other_users_document(self, client, auth_headers):
        saved = client.post(
            "/api/documents",
            json={"doc_type": "mutual_nda", "fields": FIELDS, "rendered_html": RENDERED_HTML},
            headers=auth_headers,
        ).json()
        other_resp = client.post("/api/auth/register", json={"email": "other@example.com", "password": "password123"})
        other_headers = {"Authorization": f"Bearer {other_resp.json()['token']}"}
        resp = client.get(f"/api/documents/{saved['id']}", headers=other_headers)
        assert resp.status_code == 404

    def test_requires_auth(self, client):
        resp = client.get("/api/documents/1")
        assert resp.status_code in (401, 403)
