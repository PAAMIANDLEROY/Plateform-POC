"""
Tests du Lot 3 — cohortes (ROLES-ET-DROITS.md §5).

Couvre : CRUD, périmètre owner (teacher ne voit que les siennes), membres,
accès aux cours. SQLite + override de get_current_user (cf. test_users_admin.py).
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


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _mk_user(role: UserRole = UserRole.student, email: str | None = None) -> str:
    db = SessionLocal()
    try:
        u = User(
            id=str(uuid.uuid4()),
            email=email or f"{uuid.uuid4().hex[:8]}@test.com",
            first_name="T", last_name="U",
            hashed_password="", role=role, is_active=True, is_verified=True,
        )
        db.add(u)
        db.commit()
        return u.id
    finally:
        db.close()


def _mk_course(owner_id: str) -> str:
    db = SessionLocal()
    try:
        c = Course(id=str(uuid.uuid4()), title="Cours test", created_by=owner_id)
        db.add(c)
        db.commit()
        return c.id
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


def _create_cohort(name="Cohorte A") -> str:
    r = client.post("/api/v1/cohorts", json={"name": name, "school": "Polytechnique", "status": "active"})
    assert r.status_code == 201, r.text
    return r.json()["id"]


# ─── Auth ─────────────────────────────────────────────────────────────────────

def test_list_cohorts_requires_auth():
    r = client.get("/api/v1/cohorts")
    assert r.status_code == 401


def test_student_cannot_access_cohorts():
    _act("student", _mk_user(UserRole.student))
    r = client.get("/api/v1/cohorts")
    assert r.status_code == 403


# ─── CRUD + périmètre owner ───────────────────────────────────────────────────

def test_teacher_creates_and_sees_own_cohort():
    tid = _mk_user(UserRole.teacher)
    _act("teacher", tid)
    cid = _create_cohort("Master IA")
    r = client.get("/api/v1/cohorts")
    assert r.status_code == 200
    ids = [c["id"] for c in r.json()]
    assert cid in ids


def test_teacher_does_not_see_other_teachers_cohort():
    owner = _mk_user(UserRole.teacher)
    _act("teacher", owner)
    cid = _create_cohort("Privée A")

    other = _mk_user(UserRole.teacher)
    _act("teacher", other)
    r = client.get("/api/v1/cohorts")
    assert cid not in [c["id"] for c in r.json()]

    # ... et ne peut pas y accéder directement
    r2 = client.get(f"/api/v1/cohorts/{cid}")
    assert r2.status_code == 403


def test_admin_sees_all_cohorts():
    owner = _mk_user(UserRole.teacher)
    _act("teacher", owner)
    cid = _create_cohort("Vue admin")

    _act("admin", _mk_user(UserRole.admin))
    r = client.get("/api/v1/cohorts")
    assert cid in [c["id"] for c in r.json()]


def test_update_and_delete_cohort():
    tid = _mk_user(UserRole.teacher)
    _act("teacher", tid)
    cid = _create_cohort("À modifier")

    r = client.patch(f"/api/v1/cohorts/{cid}", json={"status": "archived", "name": "Renommée"})
    assert r.status_code == 200
    assert r.json()["status"] == "archived"
    assert r.json()["name"] == "Renommée"

    r = client.delete(f"/api/v1/cohorts/{cid}")
    assert r.status_code == 204
    assert client.get(f"/api/v1/cohorts/{cid}").status_code == 404


def test_create_cohort_invalid_status():
    _act("teacher", _mk_user(UserRole.teacher))
    r = client.post("/api/v1/cohorts", json={"name": "X", "status": "bogus"})
    assert r.status_code == 400


# ─── Membres ──────────────────────────────────────────────────────────────────

def test_add_list_and_remove_member():
    tid = _mk_user(UserRole.teacher)
    _act("teacher", tid)
    cid = _create_cohort()
    student = _mk_user(UserRole.student)

    r = client.post(f"/api/v1/cohorts/{cid}/members", json={"user_id": student})
    assert r.status_code == 201
    assert r.json()["user_id"] == student

    r = client.get(f"/api/v1/cohorts/{cid}/members")
    assert r.status_code == 200
    assert student in [m["user_id"] for m in r.json()]

    # doublon → 409
    r = client.post(f"/api/v1/cohorts/{cid}/members", json={"user_id": student})
    assert r.status_code == 409

    r = client.delete(f"/api/v1/cohorts/{cid}/members/{student}")
    assert r.status_code == 204
    r = client.get(f"/api/v1/cohorts/{cid}/members")
    assert student not in [m["user_id"] for m in r.json()]


def test_non_owner_teacher_cannot_add_member():
    owner = _mk_user(UserRole.teacher)
    _act("teacher", owner)
    cid = _create_cohort()

    _act("teacher", _mk_user(UserRole.teacher))
    r = client.post(f"/api/v1/cohorts/{cid}/members", json={"user_id": _mk_user(UserRole.student)})
    assert r.status_code == 403


def test_add_member_unknown_user():
    _act("teacher", _mk_user(UserRole.teacher))
    cid = _create_cohort()
    r = client.post(f"/api/v1/cohorts/{cid}/members", json={"user_id": "nope"})
    assert r.status_code == 404


# ─── Accès aux cours ──────────────────────────────────────────────────────────

def test_grant_and_revoke_course():
    tid = _mk_user(UserRole.teacher)
    _act("teacher", tid)
    cid = _create_cohort()
    course_id = _mk_course(tid)

    r = client.post(f"/api/v1/cohorts/{cid}/courses", json={"course_id": course_id})
    assert r.status_code == 201

    # reflété dans le détail de la cohorte
    detail = client.get(f"/api/v1/cohorts/{cid}").json()
    assert course_id in detail["assigned_course_ids"]

    # doublon → 409
    r = client.post(f"/api/v1/cohorts/{cid}/courses", json={"course_id": course_id})
    assert r.status_code == 409

    r = client.delete(f"/api/v1/cohorts/{cid}/courses/{course_id}")
    assert r.status_code == 204
    detail = client.get(f"/api/v1/cohorts/{cid}").json()
    assert course_id not in detail["assigned_course_ids"]


def test_grant_unknown_course():
    _act("teacher", _mk_user(UserRole.teacher))
    cid = _create_cohort()
    r = client.post(f"/api/v1/cohorts/{cid}/courses", json={"course_id": "nope"})
    assert r.status_code == 404
