from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.user import User, UserRole
from schemas.auth import UserResponse
from core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class UpdateProfileRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None


class UpdateRoleRequest(BaseModel):
    role: UserRole


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    body: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.first_name is not None:
        current_user.first_name = body.first_name.strip()
    if body.last_name is not None:
        current_user.last_name = body.last_name.strip()
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_role("admin", "superuser"))])
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/{user_id}/role", response_model=UserResponse, dependencies=[Depends(require_role("admin", "superuser"))])
def update_role(user_id: str, body: UpdateRoleRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = body.role
    db.commit()
    db.refresh(user)
    return user
