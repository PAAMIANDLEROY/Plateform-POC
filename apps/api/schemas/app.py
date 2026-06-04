from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import json


class AppCreate(BaseModel):
    title: str
    description: Optional[str] = None
    url: str
    thumbnail_url: Optional[str] = None
    tags: Optional[list[str]] = None
    school: Optional[str] = None
    visibility: str = "enrolled"


class AppUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    tags: Optional[list[str]] = None
    school: Optional[str] = None
    visibility: Optional[str] = None


class AppResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    url: str
    thumbnail_url: Optional[str]
    tags: list[str]
    school: Optional[str]
    visibility: str
    created_by: str
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        data = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
        if data.get("tags") and isinstance(data["tags"], str):
            try:
                data["tags"] = json.loads(data["tags"])
            except Exception:
                data["tags"] = []
        if not data.get("tags"):
            data["tags"] = []
        return cls(**data)
