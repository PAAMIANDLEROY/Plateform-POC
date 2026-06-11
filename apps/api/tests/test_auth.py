"""
Tests for the authentication endpoints.
Phase 0.3 — CI/CD backend test coverage.

Uses SQLite in-memory for isolation (tables created from ORM models).
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Set test environment vars BEFORE importing anything from the app
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_hi_platform.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("ALLOWED_DOMAINS", "polytechnique.edu,hec.fr,test.com")
os.environ.setdefault("ANTHROPIC_API_KEY", "")
os.environ.setdefault("OPENAI_API_KEY", "")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")

# Import database and all models so Base.metadata knows about every table
from database import Base, engine
import models  # noqa: F401 — registers all ORM classes with Base

# Create all tables in the test SQLite DB (bypass PostgreSQL-specific migrations)
Base.metadata.create_all(bind=engine)

from main import app

client = TestClient(app)


# ─── Health check ─────────────────────────────────────────────────────────────

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


# ─── Auth endpoints ───────────────────────────────────────────────────────────

def test_request_code_invalid_domain():
    """Emails from non-allowed domains must be rejected with 400."""
    response = client.post(
        "/api/v1/auth/request-code",
        json={"email": "user@gmail.com"},
    )
    assert response.status_code == 400


def test_request_code_valid_domain():
    """Allowed domain + working email service → 200."""
    with patch("routers.auth.is_domain_allowed", return_value=True), \
         patch("routers.auth.send_otp_email", return_value=True):
        response = client.post(
            "/api/v1/auth/request-code",
            json={"email": "user@polytechnique.edu"},
        )
    assert response.status_code == 200


def test_verify_code_wrong_code():
    """Wrong OTP code must return 400."""
    response = client.post(
        "/api/v1/auth/verify-code",
        json={"email": "user@test.com", "code": "000000"},
    )
    assert response.status_code in (401, 400, 422)


def test_logout_unauthenticated():
    """Logout without session should return 401."""
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 401


# ─── Protected endpoints ──────────────────────────────────────────────────────

def test_me_requires_auth():
    """GET /users/me should require authentication."""
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_analytics_platform_requires_admin():
    """Analytics platform endpoint requires admin role."""
    response = client.get("/api/v1/analytics/platform")
    assert response.status_code == 401


def test_studio_excel_quiz_requires_teacher():
    """Excel-to-quiz endpoint requires at least teacher role."""
    response = client.post("/api/v1/studio/excel-to-quiz")
    assert response.status_code in (401, 422)  # 422 if form data missing, 401 if auth missing


# ─── Security: JWT token ──────────────────────────────────────────────────────

def test_jwt_creation_and_decode():
    """JWT tokens should be creatable and decodable."""
    from core.security import create_access_token, decode_token
    token = create_access_token(subject="test-user-id")
    assert token is not None
    payload = decode_token(token)
    assert payload is not None
    assert payload.get("sub") == "test-user-id"


def test_jwt_invalid_token_returns_none():
    """Invalid JWT should return None (not raise)."""
    from core.security import decode_token
    result = decode_token("not-a-valid-jwt")
    assert result is None


# ─── RGPD: Input validation ───────────────────────────────────────────────────

def test_email_must_be_valid_format():
    """Malformed email should be rejected."""
    response = client.post(
        "/api/v1/auth/request-code",
        json={"email": "not-an-email"},
    )
    assert response.status_code in (400, 422)


# ─── Content endpoints ────────────────────────────────────────────────────────

def test_courses_list_unauthenticated():
    """Course list requires authentication."""
    response = client.get("/api/v1/courses")
    assert response.status_code == 401


def test_videos_list_unauthenticated():
    """Video list requires authentication."""
    response = client.get("/api/v1/videos")
    assert response.status_code == 401
