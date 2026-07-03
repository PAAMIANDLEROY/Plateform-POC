"""
Tests de l'upload « About us » (Supabase Storage mocké — aucun réseau).
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


def test_upload_requires_auth():
    r = client.post("/api/v1/submissions", files={"file": ("t.txt", b"hi", "text/plain")})
    assert r.status_code == 401


def test_public_role_cannot_upload():
    _act("public", _mk_user(UserRole.public))
    r = client.post("/api/v1/submissions", files={"file": ("t.txt", b"hi", "text/plain")})
    assert r.status_code == 403


def test_student_can_upload():
    _act("student", _mk_user(UserRole.student))
    with patch("services.storage.upload_file", return_value="path/x") as up:
        r = client.post("/api/v1/submissions", files={"file": ("devoir.pdf", b"%PDF-1.4 data", "application/pdf")})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["filename"] == "devoir.pdf"
    assert body["size"] == len(b"%PDF-1.4 data")
    up.assert_called_once()


def test_empty_file_rejected():
    _act("student", _mk_user(UserRole.student))
    with patch("services.storage.upload_file", return_value="p"):
        r = client.post("/api/v1/submissions", files={"file": ("empty.txt", b"", "text/plain")})
    assert r.status_code == 400


def test_oversized_file_rejected():
    _act("student", _mk_user(UserRole.student))
    big = b"x" * (10 * 1024 * 1024 + 1)
    with patch("services.storage.upload_file", return_value="p"):
        r = client.post("/api/v1/submissions", files={"file": ("big.bin", big, "application/octet-stream")})
    assert r.status_code == 413


def test_filename_is_sanitized():
    _act("student", _mk_user(UserRole.student))
    with patch("services.storage.upload_file", return_value="p"):
        r = client.post("/api/v1/submissions", files={"file": ("mon dossier/rapport final!.pdf", b"data", "application/pdf")})
    assert r.status_code == 201
    assert "/" not in r.json()["filename"] and " " not in r.json()["filename"]


def test_list_requires_admin():
    _act("student", _mk_user(UserRole.student))
    assert client.get("/api/v1/submissions").status_code == 403


def test_admin_lists_submissions():
    _act("student", _mk_user(UserRole.student))
    with patch("services.storage.upload_file", return_value="path/y"):
        created = client.post("/api/v1/submissions", files={"file": ("a.txt", b"hello", "text/plain")}).json()

    _act("admin", _mk_user(UserRole.admin))
    r = client.get("/api/v1/submissions")
    assert r.status_code == 200
    assert created["id"] in [s["id"] for s in r.json()]
