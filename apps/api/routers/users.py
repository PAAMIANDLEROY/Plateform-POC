from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from core.store import store, CurrentUser
from core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class UserOut(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_verified: bool
    school: str
    bio: str
    avatar_url: Optional[str]
    linkedin: str
    github: str
    is_profile_complete: bool


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    school: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None


def _to_out(cu: CurrentUser) -> UserOut:
    return UserOut(
        id=cu.id,
        email=cu.email,
        first_name=cu.first_name,
        last_name=cu.last_name,
        role=cu.role,
        is_verified=cu.is_verified,
        school=cu.school,
        bio=cu.bio,
        avatar_url=cu.avatar_url,
        linkedin=cu.linkedin,
        github=cu.github,
        is_profile_complete=cu.is_profile_complete,
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: CurrentUser = Depends(get_current_user)):
    return _to_out(current_user)


@router.put("/me", response_model=UserOut)
def update_me(body: UpdateProfileRequest, current_user: CurrentUser = Depends(get_current_user)):
    updated = store.update(current_user.id, body.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_out(CurrentUser(updated))
