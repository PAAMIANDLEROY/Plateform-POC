"""
Tests du Lot 2 — gestion des droits déléguée (ROLES-ET-DROITS.md §6).

Deux couches :
  1. Unitaire pur sur core/roles.py (délégation, sans DB).
  2. Endpoints /api/v1/users (role/status) avec override de get_current_user.

SQLite (create_all), même pattern que test_auth.py.
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
import models  # noqa: F401 — enregistre tous les modèles
Base.metadata.create_all(bind=engine)

from main import app
from core.deps import get_current_user
from core.store import CurrentUser
from core.roles import can_manage_role, can_manage_user, role_at_least
from models.user import User, UserRole

client = TestClient(app)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _mk_user(role: UserRole = UserRole.student, email: str | None = None, is_active: bool = True) -> str:
    db = SessionLocal()
    try:
        u = User(
            id=str(uuid.uuid4()),
            email=email or f"{uuid.uuid4().hex[:8]}@test.com",
            first_name="T", last_name="U",
            hashed_password="", role=role,
            is_active=is_active, is_verified=True,
        )
        db.add(u)
        db.commit()
        return u.id
    finally:
        db.close()


def _delete_super_admins() -> None:
    db = SessionLocal()
    try:
        db.query(User).filter(User.role == UserRole.super_admin).delete()
        db.commit()
    finally:
        db.close()


def _act_as(role_value: str, user_id: str = "actor-id", email: str = "actor@test.com") -> None:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        {"id": user_id, "email": email, "role": role_value, "is_verified": True}
    )


@pytest.fixture(autouse=True)
def _reset_overrides():
    app.dependency_overrides.pop(get_current_user, None)
    yield
    app.dependency_overrides.pop(get_current_user, None)


# ─── 1. Unitaire : délégation (core/roles.py) ─────────────────────────────────

def test_admin_can_promote_up_to_teacher():
    assert can_manage_role("admin", "student", "teacher") is True
    assert can_manage_role("admin", "public", "student") is True


def test_admin_cannot_create_admin():
    assert can_manage_role("admin", "student", "admin") is False


def test_admin_cannot_modify_an_admin():
    assert can_manage_role("admin", "admin", "teacher") is False


def test_admin_cannot_touch_super_admin():
    assert can_manage_user("admin", "super_admin") is False


def test_super_admin_creates_admin():
    assert can_manage_role("super_admin", "teacher", "admin") is True


def test_super_admin_manages_super_admin():
    assert can_manage_user("super_admin", "super_admin") is True


def test_invalid_new_role_rejected():
    assert can_manage_role("super_admin", "student", "root") is False


def test_role_at_least():
    assert role_at_least("admin", "teacher") is True
    assert role_at_least("student", "teacher") is False
    assert role_at_least("super_admin", "super_admin") is True


# ─── 2. Endpoints — liste ─────────────────────────────────────────────────────

def test_list_users_requires_auth():
    r = client.get("/api/v1/users")
    assert r.status_code == 401


def test_admin_can_list_users():
    _act_as("admin")
    r = client.get("/api/v1/users")
    assert r.status_code == 200
    assert "items" in r.json() and "total" in r.json()


def test_student_cannot_list_users():
    _act_as("student")
    r = client.get("/api/v1/users")
    assert r.status_code == 403


# ─── 2. Endpoints — changement de rôle ────────────────────────────────────────

def test_admin_promotes_student_to_teacher():
    uid = _mk_user(UserRole.student)
    _act_as("admin")
    r = client.patch(f"/api/v1/users/{uid}/role", json={"role": "teacher"})
    assert r.status_code == 200
    assert r.json()["role"] == "teacher"


def test_admin_cannot_promote_to_admin():
    uid = _mk_user(UserRole.student)
    _act_as("admin")
    r = client.patch(f"/api/v1/users/{uid}/role", json={"role": "admin"})
    assert r.status_code == 403


def test_admin_cannot_modify_admin_via_endpoint():
    uid = _mk_user(UserRole.admin)
    _act_as("admin")
    r = client.patch(f"/api/v1/users/{uid}/role", json={"role": "teacher"})
    assert r.status_code == 403


def test_change_role_invalid_role():
    uid = _mk_user(UserRole.student)
    _act_as("super_admin")
    r = client.patch(f"/api/v1/users/{uid}/role", json={"role": "root"})
    assert r.status_code == 400


def test_change_role_user_not_found():
    _act_as("super_admin")
    r = client.patch("/api/v1/users/does-not-exist/role", json={"role": "teacher"})
    assert r.status_code == 404


def test_last_super_admin_cannot_be_demoted():
    _delete_super_admins()
    uid = _mk_user(UserRole.super_admin)
    _act_as("super_admin")
    r = client.patch(f"/api/v1/users/{uid}/role", json={"role": "admin"})
    assert r.status_code == 400


def test_super_admin_demotable_when_not_last():
    _delete_super_admins()
    _mk_user(UserRole.super_admin)          # on en garde un
    uid = _mk_user(UserRole.super_admin)    # celui-ci est rétrogradable
    _act_as("super_admin")
    r = client.patch(f"/api/v1/users/{uid}/role", json={"role": "admin"})
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


# ─── 2. Endpoints — suspension ────────────────────────────────────────────────

def test_admin_can_suspend_student():
    uid = _mk_user(UserRole.student)
    _act_as("admin")
    r = client.patch(f"/api/v1/users/{uid}/status", json={"is_active": False})
    assert r.status_code == 200
    assert r.json()["is_active"] is False


def test_admin_cannot_suspend_admin():
    uid = _mk_user(UserRole.admin)
    _act_as("admin")
    r = client.patch(f"/api/v1/users/{uid}/status", json={"is_active": False})
    assert r.status_code == 403


def test_cannot_suspend_self():
    uid = _mk_user(UserRole.admin, email="self@test.com")
    _act_as("admin", user_id=uid, email="self@test.com")
    r = client.patch(f"/api/v1/users/{uid}/status", json={"is_active": False})
    assert r.status_code == 400
