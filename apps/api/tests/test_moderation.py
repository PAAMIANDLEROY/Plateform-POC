"""
Tests du Lot 5 — modération & audit (ROLES-ET-DROITS.md §7).

Vérifie : journalisation d'une action sensible (changement de rôle), consultation
du journal (admin+), cycle de vie d'un signalement, masquage d'un cours.
"""
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_hi_platform.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("ALLOWED_DOMAINS", "polytechnique.edu,hec.fr,test.com")
os.environ.setdefault("ANTHROPIC_API_KEY", "")
os.environ.setdefault("OPENAI_API_KEY", "")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")

import uuid
import pytest
from fastapi.testclient import TestClient

from database import Base, engine, SessionLocal
import models  # noqa: F401
Base.metadata.create_all(bind=engine)

from main import app
from core.deps import get_current_user
from core.store import CurrentUser
from models.user import User, UserRole
from models.course import Course

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


def _mk_course() -> str:
    db = SessionLocal()
    try:
        c = Course(id=str(uuid.uuid4()), title="Cours signalé", created_by=str(uuid.uuid4()),
                   status="published", access_level="public")
        db.add(c); db.commit(); return c.id
    finally:
        db.close()


def _course_status(course_id: str) -> str:
    db = SessionLocal()
    try:
        c = db.query(Course).filter(Course.id == course_id).first()
        return c.status.value if hasattr(c.status, "value") else str(c.status)
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


# ─── Audit log ────────────────────────────────────────────────────────────────

def test_audit_logs_require_admin():
    assert client.get("/api/v1/audit-logs").status_code == 401
    _act("teacher", _mk_user(UserRole.teacher))
    assert client.get("/api/v1/audit-logs").status_code == 403


def test_role_change_is_audited():
    actor = _mk_user(UserRole.super_admin)
    target = _mk_user(UserRole.student)
    _act("super_admin", actor)
    assert client.patch(f"/api/v1/users/{target}/role", json={"role": "teacher"}).status_code == 200

    r = client.get("/api/v1/audit-logs?action=role_change")
    assert r.status_code == 200
    entries = r.json()["items"]
    assert any(e["target_id"] == target and e["action"] == "role_change" for e in entries)


# ─── Signalements ─────────────────────────────────────────────────────────────

def test_create_report_any_user():
    _act("student", _mk_user(UserRole.student))
    r = client.post("/api/v1/reports", json={"target_type": "course", "target_id": "c1", "reason": "spam"})
    assert r.status_code == 201
    assert r.json()["status"] == "open"


def test_create_report_invalid_target():
    _act("student", _mk_user(UserRole.student))
    r = client.post("/api/v1/reports", json={"target_type": "bogus", "target_id": "x", "reason": "y"})
    assert r.status_code == 400


def test_list_reports_requires_admin():
    _act("student", _mk_user(UserRole.student))
    assert client.get("/api/v1/reports").status_code == 403


def test_resolve_report_and_hide_course():
    course_id = _mk_course()

    _act("student", _mk_user(UserRole.student))
    created = client.post("/api/v1/reports", json={
        "target_type": "course", "target_id": course_id, "reason": "contenu inapproprié",
    }).json()

    _act("admin", _mk_user(UserRole.admin))
    r = client.patch(f"/api/v1/reports/{created['id']}", json={
        "status": "resolved", "resolution": "retiré", "hide": True,
    })
    assert r.status_code == 200
    assert r.json()["status"] == "resolved"
    assert r.json()["resolved_by"] is not None
    # le cours a été dépublié (archivé)
    assert _course_status(course_id) == "archived"


def test_resolve_report_invalid_status():
    _act("student", _mk_user(UserRole.student))
    created = client.post("/api/v1/reports", json={
        "target_type": "video", "target_id": "v1", "reason": "x",
    }).json()
    _act("admin", _mk_user(UserRole.admin))
    r = client.patch(f"/api/v1/reports/{created['id']}", json={"status": "bogus"})
    assert r.status_code == 400
