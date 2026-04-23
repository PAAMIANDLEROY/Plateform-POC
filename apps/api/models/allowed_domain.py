from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed


class AllowedDomain(Document):
    domain: Indexed(str, unique=True)
    school_name: Optional[str] = None
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "allowed_domains"
