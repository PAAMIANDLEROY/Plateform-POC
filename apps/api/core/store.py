"""
In-memory store — OTP codes + user profiles + RGPD consents + learning data.
No database. Reset on server restart. Will be replaced by DB in a future step.
"""
import uuid
import random
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

# ── Badge definitions ──────────────────────────────────────────────────────────

BADGE_CATALOG = [
    {"id": "first_step",  "name": "Premier pas",  "icon": "🎯", "description": "Compléter son premier cours",          "threshold": 1, "metric": "courses_completed"},
    {"id": "on_fire",     "name": "En feu",        "icon": "🔥", "description": "Compléter 3 cours",                    "threshold": 3, "metric": "courses_completed"},
    {"id": "bookworm",    "name": "Bibliophile",   "icon": "📚", "description": "Compléter 5 cours",                    "threshold": 5, "metric": "courses_completed"},
    {"id": "graduate",    "name": "Diplômé",       "icon": "🎓", "description": "Compléter un MOOC complet",            "threshold": 1, "metric": "moocs_completed"},
    {"id": "expert",      "name": "Expert",        "icon": "⭐", "description": "Compléter 10 cours",                   "threshold": 10, "metric": "courses_completed"},
    {"id": "perfectionist","name": "Perfectionniste","icon": "💎","description": "Obtenir 100% sur un quiz",            "threshold": 1, "metric": "perfect_quizzes"},
]


class CurrentUser:
    def __init__(self, data: dict):
        self.id: str = data["id"]
        self.email: str = data["email"]
        self.first_name: str = data.get("first_name", "")
        self.last_name: str = data.get("last_name", "")
        self.role: str = data.get("role", "student")
        self.is_verified: bool = data.get("is_verified", True)
        self.school: str = data.get("school", "")
        self.bio: str = data.get("bio", "")
        self.avatar_url: Optional[str] = data.get("avatar_url")
        self.linkedin: str = data.get("linkedin", "")
        self.github: str = data.get("github", "")
        self.is_profile_complete: bool = bool(data.get("first_name") and data.get("last_name"))
        self.consent: dict = data.get("consent", {"analytics": False, "tracking": False, "updated_at": None})


class InMemoryStore:
    def __init__(self):
        self._users: dict[str, dict] = {}
        self._otps: dict[str, dict] = {}
        self._connection_logs: list[dict] = []
        # Learning data
        self._progress: dict[str, dict] = {}       # user_id -> course_id -> progress dict
        self._mooc_progress: dict[str, dict] = {}  # user_id -> mooc_id -> progress dict
        self._badges: dict[str, list] = {}          # user_id -> list of badge dicts
        self._certificates: dict[str, dict] = {}   # cert_id -> cert dict

    # ── OTP ──────────────────────────────────────────────────────────────────

    def create_otp(self, email: str) -> str:
        code = str(random.randint(100_000, 999_999))
        self._otps[email] = {"code": code, "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10)}
        return code

    def verify_otp(self, email: str, code: str) -> bool:
        entry = self._otps.get(email)
        if not entry:
            return False
        if entry["expires_at"] < datetime.now(timezone.utc):
            self._otps.pop(email, None)
            return False
        if entry["code"] != code:
            return False
        self._otps.pop(email, None)
        return True

    # ── Users ─────────────────────────────────────────────────────────────────

    def get_or_create(self, email: str) -> tuple[dict, bool]:
        if email in self._users:
            return self._users[email], False
        user = {
            "id": str(uuid.uuid4()), "email": email,
            "first_name": "", "last_name": "", "role": "student",
            "is_verified": True, "school": "", "bio": "",
            "avatar_url": None, "linkedin": "", "github": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "consent": {"analytics": False, "tracking": False, "updated_at": None},
            "is_anonymized": False,
        }
        self._users[email] = user
        return user, True

    def get_by_id(self, user_id: str) -> Optional[dict]:
        for u in self._users.values():
            if u["id"] == user_id:
                return u
        return None

    def get_by_email(self, email: str) -> Optional[dict]:
        return self._users.get(email)

    def update(self, user_id: str, data: dict) -> Optional[dict]:
        user = self.get_by_id(user_id)
        if not user:
            return None
        user.update({k: v for k, v in data.items() if v is not None})
        return user

    def update_consent(self, user_id: str, analytics: bool, tracking: bool) -> Optional[dict]:
        user = self.get_by_id(user_id)
        if not user:
            return None
        user["consent"] = {"analytics": analytics, "tracking": tracking, "updated_at": datetime.now(timezone.utc).isoformat()}
        return user

    def anonymize(self, user_id: str) -> bool:
        user = self.get_by_id(user_id)
        if not user:
            return False
        anon_id = f"deleted_{uuid.uuid4().hex[:8]}"
        user.update({
            "email": f"{anon_id}@deleted.invalid",
            "first_name": "[supprimé]", "last_name": "[supprimé]",
            "school": "", "bio": "", "avatar_url": None,
            "linkedin": "", "github": "", "refresh_token": None,
            "is_anonymized": True, "anonymized_at": datetime.now(timezone.utc).isoformat(),
        })
        return True

    def export_user_data(self, user_id: str) -> Optional[dict]:
        user = self.get_by_id(user_id)
        if not user:
            return None
        safe = {k: v for k, v in user.items() if k not in ("refresh_token", "hashed_password")}
        safe["_export_date"] = datetime.now(timezone.utc).isoformat()
        safe["_platform"] = "Hi! Platform — Hi! PARIS"
        safe["learning_progress"] = self.get_all_progress(user_id)
        safe["badges"] = self.get_badges(user_id)
        safe["certificates"] = self.get_certificates(user_id)
        return safe

    def get_all_users(self) -> list[dict]:
        return list(self._users.values())

    def log_connection(self, user_id: str) -> None:
        self._connection_logs.append({"user_id": user_id, "at": datetime.now(timezone.utc).isoformat()})
        if len(self._connection_logs) > 10_000:
            self._connection_logs = self._connection_logs[-10_000:]

    # ── Learning progress ─────────────────────────────────────────────────────

    def update_course_progress(self, user_id: str, course_id: str, progress_pct: int, score: Optional[int] = None) -> dict:
        if user_id not in self._progress:
            self._progress[user_id] = {}

        existing = self._progress[user_id].get(course_id, {})
        now = datetime.now(timezone.utc).isoformat()

        updated = {
            **existing,
            "course_id": course_id,
            "progress_pct": max(existing.get("progress_pct", 0), progress_pct),
            "last_activity": now,
            "started_at": existing.get("started_at", now),
            "completed": False,
            "completed_at": None,
        }
        if score is not None:
            updated["score"] = score
            if score == 100:
                self._award_badge_if_needed(user_id, "perfect_quizzes", 1)

        if progress_pct >= 100:
            updated["completed"] = True
            updated["completed_at"] = updated["completed_at"] or now
            self._on_course_complete(user_id, course_id)

        self._progress[user_id][course_id] = updated
        return updated

    def get_course_progress(self, user_id: str, course_id: str) -> Optional[dict]:
        return self._progress.get(user_id, {}).get(course_id)

    def get_all_progress(self, user_id: str) -> list[dict]:
        return list(self._progress.get(user_id, {}).values())

    def _on_course_complete(self, user_id: str, course_id: str) -> None:
        """Appelé quand un cours est 100% complété : badges + certificat."""
        completed_count = sum(1 for p in self._progress.get(user_id, {}).values() if p.get("completed"))
        self._award_badge_if_needed(user_id, "first_step", completed_count)
        self._award_badge_if_needed(user_id, "on_fire", completed_count)
        self._award_badge_if_needed(user_id, "bookworm", completed_count)
        self._award_badge_if_needed(user_id, "expert", completed_count)

    def _award_badge_if_needed(self, user_id: str, badge_id: str, current_value: int) -> None:
        badge_def = next((b for b in BADGE_CATALOG if b["id"] == badge_id), None)
        if not badge_def:
            return
        if current_value < badge_def["threshold"]:
            return
        existing = self._badges.get(user_id, [])
        if any(b["id"] == badge_id for b in existing):
            return
        if user_id not in self._badges:
            self._badges[user_id] = []
        self._badges[user_id].append({
            **badge_def,
            "awarded_at": datetime.now(timezone.utc).isoformat(),
        })

    # ── Badges ────────────────────────────────────────────────────────────────

    def get_badges(self, user_id: str) -> list[dict]:
        return self._badges.get(user_id, [])

    def award_badge(self, user_id: str, badge_id: str) -> bool:
        """Attribution manuelle (admin)."""
        badge_def = next((b for b in BADGE_CATALOG if b["id"] == badge_id), None)
        if not badge_def:
            return False
        self._award_badge_if_needed(user_id, badge_id, badge_def["threshold"])
        return True

    # ── Certificates ──────────────────────────────────────────────────────────

    def issue_certificate(self, user_id: str, course_id: str, course_title: str, user_name: str) -> dict:
        progress = self.get_course_progress(user_id, course_id)
        if not progress or not progress.get("completed"):
            raise ValueError("Le cours n'est pas encore complété")

        # Check if already issued
        for cert in self._certificates.values():
            if cert["user_id"] == user_id and cert["course_id"] == course_id:
                return cert

        cert_id = str(uuid.uuid4())
        verification_token = secrets.token_urlsafe(16)
        cert = {
            "id": cert_id,
            "user_id": user_id,
            "course_id": course_id,
            "course_title": course_title,
            "user_name": user_name,
            "issued_at": datetime.now(timezone.utc).isoformat(),
            "verification_token": verification_token,
            "verification_url": f"/api/v1/learning/certificates/{cert_id}/verify",
        }
        self._certificates[cert_id] = cert
        return cert

    def get_certificates(self, user_id: str) -> list[dict]:
        return [c for c in self._certificates.values() if c["user_id"] == user_id]

    def get_certificate(self, cert_id: str) -> Optional[dict]:
        return self._certificates.get(cert_id)

    # ── MOOC progress ─────────────────────────────────────────────────────────

    def enroll_mooc(self, user_id: str, mooc_id: str) -> dict:
        key = f"{user_id}:{mooc_id}"
        if key not in self._mooc_progress:
            self._mooc_progress[key] = {
                "user_id": user_id, "mooc_id": mooc_id,
                "enrolled_at": datetime.now(timezone.utc).isoformat(),
                "completed_modules": [],
                "completed_at": None,
            }
        return self._mooc_progress[key]

    def complete_mooc_module(self, user_id: str, mooc_id: str, module_id: str) -> dict:
        entry = self.enroll_mooc(user_id, mooc_id)
        if module_id not in entry["completed_modules"]:
            entry["completed_modules"].append(module_id)
        return entry

    def get_mooc_progress(self, user_id: str, mooc_id: str) -> Optional[dict]:
        return self._mooc_progress.get(f"{user_id}:{mooc_id}")

    # ── Dashboard summary ─────────────────────────────────────────────────────

    def get_learning_dashboard(self, user_id: str) -> dict:
        all_progress = self.get_all_progress(user_id)
        completed = [p for p in all_progress if p.get("completed")]
        in_progress = [p for p in all_progress if not p.get("completed") and p.get("progress_pct", 0) > 0]
        badges = self.get_badges(user_id)
        certificates = self.get_certificates(user_id)

        return {
            "total_courses_started": len(all_progress),
            "total_courses_completed": len(completed),
            "total_badges": len(badges),
            "total_certificates": len(certificates),
            "progress": all_progress,
            "badges": badges,
            "certificates": certificates,
            "in_progress": in_progress,
            "completed": completed,
        }


store = InMemoryStore()
