import pytest
from fastapi.testclient import TestClient

from app.database import init_db
from main import app


@pytest.fixture(autouse=True)
def fresh_db():
    init_db()
    yield


@pytest.fixture
def client():
    return TestClient(app)


class TestRegister:
    def test_creates_user_and_returns_token(self, client):
        resp = client.post("/api/auth/register", json={"email": "user@example.com", "password": "password123"})
        assert resp.status_code == 201
        data = resp.json()
        assert "token" in data
        assert data["user"]["email"] == "user@example.com"

    def test_duplicate_email_returns_409(self, client):
        client.post("/api/auth/register", json={"email": "user@example.com", "password": "password123"})
        resp = client.post("/api/auth/register", json={"email": "user@example.com", "password": "password123"})
        assert resp.status_code == 409

    def test_short_password_returns_400(self, client):
        resp = client.post("/api/auth/register", json={"email": "user@example.com", "password": "short"})
        assert resp.status_code == 400


class TestLogin:
    def test_valid_credentials_returns_token(self, client):
        client.post("/api/auth/register", json={"email": "user@example.com", "password": "password123"})
        resp = client.post("/api/auth/login", json={"email": "user@example.com", "password": "password123"})
        assert resp.status_code == 200
        assert "token" in resp.json()

    def test_wrong_password_returns_401(self, client):
        client.post("/api/auth/register", json={"email": "user@example.com", "password": "password123"})
        resp = client.post("/api/auth/login", json={"email": "user@example.com", "password": "wrongpassword"})
        assert resp.status_code == 401

    def test_unknown_email_returns_401(self, client):
        resp = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "password123"})
        assert resp.status_code == 401
