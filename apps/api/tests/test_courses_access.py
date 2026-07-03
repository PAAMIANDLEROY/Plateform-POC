"""
Tests du Lot 4 — niveaux d'accès aux cours (ROLES-ET-DROITS.md §4).

Vérifie le filtrage des catalogues et l'accès unitaire selon public / hiparis / cohort.
SQLite + override de get_current_user.
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
from core.access import can_view_course, allowed_access_levels
from models.user import User, UserRole
from models.course import Course
from models.cohort import Cohort, CohortMember, CohortCourse

client = TestClient(app)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _mk_user(role: UserRole = UserRole.student) -> str:
    db = SessionLocal()
    try:
        u = User(id=str(uuid.uuid4()), email=f"{uuid.uuid4().hex[:8]}@test.com",
                 first_name="T", last_name="U", hashed_password="", role=role,
                 is_active=True, is_verified=True)
        db.add(u); db.commit(); return u.id
    finally:
        db.close()


def _mk_course(access_level: str = "public", status: str = "published", owner: str | None = None) -> str:
    db = SessionLocal()
    try:
        c = Course(id=str(uuid.uuid4()), title=f"Cours {access_level}",
                   created_by=owner or str(uuid.uuid4()), status=status, access_level=access_level)
        db.add(c); db.commit(); return c.id
    finally:
        db.close()


def _mk_cohort_with(owner_id: str, member_id: str, course_id: str) -> str:
    db = SessionLocal()
    try:
        cohort = Cohort(id=str(uuid.uuid4()), name="Cohorte", owner_id=owner_id, status="active")
        db.add(cohort); db.flush()
        db.add(CohortMember(id=str(uuid.uuid4()), cohort_id=cohort.id, user_id=member_id))
        db.add(CohortCourse(id=str(uuid.uuid4()), cohort_id=cohort.id, course_id=course_id, granted_by=owner_id))
        db.commit()
        return cohort.id
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


def _list_ids() -> list[str]:
    r = client.get("/api/v1/courses?limit=100")
    assert r.status_code == 200
    return [c["id"] for c in r.json()]


# ─── Unitaire : allowed_access_levels ─────────────────────────────────────────

def test_allowed_levels_by_role():
    assert allowed_access_levels("public") == ["public"]
    assert "hiparis" in allowed_access_levels("student")


# ─── Catalogue : filtrage ─────────────────────────────────────────────────────

def test_public_user_sees_only_public():
    pub = _mk_course("public")
    hip = _mk_course("hiparis")
    _act("public", _mk_user(UserRole.public))
    ids = _list_ids()
    assert pub in ids
    assert hip not in ids


def test_student_sees_public_and_hiparis_not_cohort():
    pub = _mk_course("public")
    hip = _mk_course("hiparis")
    coh = _mk_course("cohort")
    _act("student", _mk_user(UserRole.student))
    ids = _list_ids()
    assert pub in ids and hip in ids
    assert coh not in ids


def test_teacher_sees_all_published():
    coh = _mk_course("cohort")
    hip = _mk_course("hiparis")
    _act("teacher", _mk_user(UserRole.teacher))
    ids = _list_ids()
    assert coh in ids and hip in ids


def test_student_member_sees_cohort_course():
    owner = _mk_user(UserRole.teacher)
    student = _mk_user(UserRole.student)
    coh_course = _mk_course("cohort", owner=owner)
    _mk_cohort_with(owner, student, coh_course)

    _act("student", student)
    assert coh_course in _list_ids()
    assert client.get(f"/api/v1/courses/{coh_course}").status_code == 200


# ─── Accès unitaire (GET) ─────────────────────────────────────────────────────

def test_public_user_403_on_hiparis_course():
    hip = _mk_course("hiparis")
    _act("public", _mk_user(UserRole.public))
    assert client.get(f"/api/v1/courses/{hip}").status_code == 403


def test_student_200_on_hiparis_course():
    hip = _mk_course("hiparis")
    _act("student", _mk_user(UserRole.student))
    assert client.get(f"/api/v1/courses/{hip}").status_code == 200


def test_student_non_member_403_on_cohort_course():
    coh = _mk_course("cohort")
    _act("student", _mk_user(UserRole.student))
    assert client.get(f"/api/v1/courses/{coh}").status_code == 403


def test_response_exposes_access_level():
    pub = _mk_course("hiparis")
    _act("teacher", _mk_user(UserRole.teacher))
    r = client.get(f"/api/v1/courses/{pub}")
    assert r.status_code == 200
    assert r.json()["access_level"] == "hiparis"
