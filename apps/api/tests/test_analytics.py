"""
Tests for the analytics router (Phase 6).
"""
import os
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("ALLOWED_DOMAINS", "test.com")
os.environ.setdefault("ANTHROPIC_API_KEY", "")
os.environ.setdefault("OPENAI_API_KEY", "")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_at_risk_endpoint_requires_auth():
    response = client.get("/api/v1/analytics/at-risk")
    assert response.status_code == 401


def test_platform_kpis_requires_auth():
    response = client.get("/api/v1/analytics/platform")
    assert response.status_code == 401


def test_export_users_requires_auth():
    response = client.get("/api/v1/analytics/export/users")
    assert response.status_code == 401


def test_export_courses_requires_auth():
    response = client.get("/api/v1/analytics/export/courses")
    assert response.status_code == 401


def test_at_risk_threshold_params():
    """Endpoint accepts inactivity_days and score_threshold query params."""
    # Without auth, should still return 401 (not 422 for bad params)
    response = client.get("/api/v1/analytics/at-risk?inactivity_days=14&score_threshold=50")
    assert response.status_code == 401
