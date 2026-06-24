from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any
import json


class InsightCreate(BaseModel):
    title: str
    abstract: Optional[str] = None
    authors: list[str] = []
    tags: list[str] = []
    school: Optional[str] = None
    category: Optional[str] = None
    cover: Optional[str] = None
    read_time: int = 5
    published_at: Optional[str] = None  # "YYYY-MM-DD" ; défaut = aujourd'hui si absent
    blocks: list[Any] = []


class InsightResponse(BaseModel):
    id: str
    title: str
    abstract: Optional[str]
    authors: list[str]
    tags: list[str]
    school: Optional[str]
    category: Optional[str]
    cover: Optional[str]
    read_time: int
    published_at: Optional[str]
    status: str
    blocks: list[Any]
    created_by: str
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        data = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
        # authors / tags : colonnes Text JSON-encodées → listes
        for key in ("authors", "tags"):
            v = data.get(key)
            if isinstance(v, str):
                try:
                    data[key] = json.loads(v)
                except Exception:
                    data[key] = []
            if not data.get(key):
                data[key] = []
        # cover_url (DB) → cover (front)
        data["cover"] = data.pop("cover_url", None)
        if data.get("blocks") is None:
            data["blocks"] = []
        # enum → str
        if hasattr(data.get("status"), "value"):
            data["status"] = data["status"].value
        return cls(**data)
