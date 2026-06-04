from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import json


class VideoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    youtube_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    school: Optional[str] = None
    tags: Optional[list[str]] = None
    visibility: str = "enrolled"
    duration_seconds: int = 0


class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    youtube_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    school: Optional[str] = None
    tags: Optional[list[str]] = None
    visibility: Optional[str] = None
    duration_seconds: Optional[int] = None


class VideoResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    url: Optional[str]
    youtube_id: Optional[str]
    thumbnail_url: Optional[str]
    category: Optional[str]
    school: Optional[str]
    tags: list[str]
    visibility: str
    duration_seconds: int
    view_count: int
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


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: str
    video_id: str
    user_id: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
