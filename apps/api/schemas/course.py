from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any
import json


class BlockContent(BaseModel):
    type: str
    content: Any


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    level: str = "beginner"
    school: Optional[str] = None
    estimated_duration_minutes: int = 0


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    level: Optional[str] = None
    school: Optional[str] = None
    status: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None


class CourseBlockCreate(BaseModel):
    position: int
    type: str
    content: dict


class CourseBlockResponse(BaseModel):
    id: str
    course_id: str
    position: int
    type: str
    content: dict

    model_config = {"from_attributes": True}


class CourseResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    cover_url: Optional[str]
    category: Optional[str]
    tags: list[str]
    level: str
    school: Optional[str]
    status: str
    estimated_duration_minutes: int
    created_by: str
    created_at: datetime
    updated_at: datetime
    blocks: list[CourseBlockResponse] = []

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
        data["blocks"] = [CourseBlockResponse.model_validate(b) for b in obj.blocks]
        return cls(**data)


class ProgressUpdate(BaseModel):
    completed_block_id: str
