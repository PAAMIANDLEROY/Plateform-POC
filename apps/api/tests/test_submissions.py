"""
Tests des soumissions NeuriPP (projet EdTech + pièce jointe optionnelle).
Supabase Storage mocké — aucun réseau.
"""
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_hi_platform.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("ALLOWED_DOMAINS", "polytechnique.edu,hec.fr,test.com")
os.environ.setdefault("ANTHROPIC_API_KEY", "")
os.environ.setdefault("OPENAI_API_KEY", "")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")

import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from database import Base, engine, SessionLocal
import models  # noqa: F401
Base.metadata.create_all(bind=engine)

from main import app
from core.deps import get_current_user
from core.store import CurrentUser
from models.user import User, UserRole

client = TestClient(app)


def _mk_user(role: UserRole = UserRole.student) -> str:
    db = SessionLocal()
    try:
        u = User(id=str(uuid.uuid4()), email=f"{uuid.uuid4().hex[:8]}@test.com",
                 first_name="T", last_name="U", hashed_password="", role=role,
                 is_active=True, is_verified=True)
        db.add(u); db.commit(); return u.id
    finally:
        db.close()


def _act(role: str, user_id: str) -> None:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        {"id": user_id, "email": f"{user_id}@test.com", "role": role, "is_verified": True}
    )


@pytest.fixture(autouse=True)
def _reset():
    app.dependency_overrides.pop(get_current_user, None)
    yield
    app.dependency_overrides.pop(get_current_user, None)


def _valid() -> dict:
    return {
        "project_name": "Mon Tuteur IA",
        "repo_url": "https://github.com/moi/mon-tuteur",
        "usage_category": "revision",
        "domain_scope": "all",
        "model_type": "open",
        "rules_consent": "true",
    }


def test_submit_requires_auth():
    assert client.post("/api/v1/submissions", data=_valid()).status_code == 401


def test_public_role_cannot_submit():
    _act("public", _mk_user(UserRole.public))
    assert client.post("/api/v1/submissions", data=_valid()).status_code == 403


def test_student_submits_without_file():
    _act("student", _mk_user(UserRole.student))
    r = client.post("/api/v1/submissions", data=_valid())
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["project_name"] == "Mon Tuteur IA"
    assert body["usage_category"] == "revision"
    assert body["rules_consent"] is True
    assert body["filename"] is None


def test_consent_required():
    _act("student", _mk_user(UserRole.student))
    data = _valid(); data["rules_consent"] = "false"
    r = client.post("/api/v1/submissions", data=data)
    assert r.status_code == 400


def test_invalid_usage_category():
    _act("student", _mk_user(UserRole.student))
    data = _valid(); data["usage_category"] = "bricolage"
    r = client.post("/api/v1/submissions", data=data)
    assert r.status_code == 400


def test_submit_with_attachment():
    _act("student", _mk_user(UserRole.student))
    with patch("services.storage.upload_file", return_value="path/x") as up:
        r = client.post("/api/v1/submissions", data=_valid(),
                        files={"file": ("poster.pdf", b"%PDF data", "application/pdf")})
    assert r.status_code == 201, r.text
    assert r.json()["filename"] == "poster.pdf"
    up.assert_called_once()


def test_oversized_attachment_rejected():
    _act("student", _mk_user(UserRole.student))
    big = b"x" * (1 * 1024 * 1024 + 1)
    with patch("services.storage.upload_file", return_value="p"):
        r = client.post("/api/v1/submissions", data=_valid(),
                        files={"file": ("big.bin", big, "application/octet-stream")})
    assert r.status_code == 413


def test_list_requires_admin():
    _act("student", _mk_user(UserRole.student))
    assert client.get("/api/v1/submissions").status_code == 403


def test_admin_lists_submissions():
    _act("student", _mk_user(UserRole.student))
    created = client.post("/api/v1/submissions", data=_valid()).json()

    _act("admin", _mk_user(UserRole.admin))
    r = client.get("/api/v1/submissions")
    assert r.status_code == 200
    assert created["id"] in [s["id"] for s in r.json()]
