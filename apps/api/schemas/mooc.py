from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MOOCModuleCourseCreate(BaseModel):
    course_id: str
    position: int


class MOOCModuleCreate(BaseModel):
    title: str
    position: int
    courses: list[MOOCModuleCourseCreate] = []


class MOOCCreate(BaseModel):
    title: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    school: Optional[str] = None
    is_linear: bool = True
    modules: list[MOOCModuleCreate] = []


class MOOCUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    school: Optional[str] = None
    status: Optional[str] = None
    is_linear: Optional[bool] = None


class MOOCModuleCourseResponse(BaseModel):
    id: str
    module_id: str
    course_id: str
    position: int

    model_config = {"from_attributes": True}


class MOOCModuleResponse(BaseModel):
    id: str
    mooc_id: str
    title: str
    position: int
    courses: list[MOOCModuleCourseResponse] = []

    model_config = {"from_attributes": True}


class MOOCResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    cover_url: Optional[str]
    school: Optional[str]
    status: str
    is_linear: bool
    created_by: str
    created_at: datetime
    updated_at: datetime
    modules: list[MOOCModuleResponse] = []
    enrolled_count: int = 0

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        data = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
        data["modules"] = [MOOCModuleResponse.model_validate(m) for m in obj.modules]
        data["enrolled_count"] = len(obj.enrollments)
        return cls(**data)


class EnrollmentResponse(BaseModel):
    id: str
    user_id: str
    mooc_id: str
    enrolled_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}
