"""
In-memory store — OTP codes + user profiles + RGPD consents.
No database. Reset on server restart. Will be replaced by DB in a future step.
"""
import uuid
import random
from datetime import datetime, timedelta, timezone
from typing import Optional


class CurrentUser:
    """Lightweight user object returned by get_current_user."""
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
        self.consent: dict = data.get("consent", {
            "analytics": False,
            "tracking": False,
            "updated_at": None,
        })


class InMemoryStore:
    def __init__(self):
        self._users: dict[str, dict] = {}          # email -> user dict
        self._otps: dict[str, dict] = {}           # email -> {code, expires_at}
        self._connection_logs: list[dict] = []     # audit log (no PII in values)

    # ── OTP ──────────────────────────────────────────────────────────────────

    def create_otp(self, email: str) -> str:
        code = str(random.randint(100_000, 999_999))
        self._otps[email] = {
            "code": code,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
        }
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
            "id": str(uuid.uuid4()),
            "email": email,
            "first_name": "",
            "last_name": "",
            "role": "student",
            "is_verified": True,
            "school": "",
            "bio": "",
            "avatar_url": None,
            "linkedin": "",
            "github": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "consent": {
                "analytics": False,
                "tracking": False,
                "updated_at": None,
            },
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
        user["consent"] = {
            "analytics": analytics,
            "tracking": tracking,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        return user

    def anonymize(self, user_id: str) -> bool:
        """RGPD Art. 17 — right to erasure. Anonymizes PII, keeps aggregate data."""
        user = self.get_by_id(user_id)
        if not user:
            return False
        anon_id = f"deleted_{uuid.uuid4().hex[:8]}"
        user.update({
            "email": f"{anon_id}@deleted.invalid",
            "first_name": "[supprimé]",
            "last_name": "[supprimé]",
            "school": "",
            "bio": "",
            "avatar_url": None,
            "linkedin": "",
            "github": "",
            "refresh_token": None,
            "is_anonymized": True,
            "anonymized_at": datetime.now(timezone.utc).isoformat(),
        })
        return True

    def export_user_data(self, user_id: str) -> Optional[dict]:
        """RGPD Art. 15 & 20 — data access + portability."""
        user = self.get_by_id(user_id)
        if not user:
            return None
        safe = {k: v for k, v in user.items() if k not in ("refresh_token", "hashed_password")}
        safe["_export_date"] = datetime.now(timezone.utc).isoformat()
        safe["_platform"] = "Hi! Platform — Hi! PARIS"
        return safe

    def get_all_users(self) -> list[dict]:
        return list(self._users.values())

    def log_connection(self, user_id: str) -> None:
        """Audit log — stocke l'ID, pas le contenu."""
        self._connection_logs.append({
            "user_id": user_id,
            "at": datetime.now(timezone.utc).isoformat(),
        })
        # Keep only 12 months (in-memory: keep last 10k)
        if len(self._connection_logs) > 10_000:
            self._connection_logs = self._connection_logs[-10_000:]


store = InMemoryStore()
