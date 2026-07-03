import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.app import App
from models.user import User
from schemas.app import AppCreate, AppUpdate, AppResponse
from core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/v1/apps", tags=["apps"])

TEACHER_ROLES = ("teacher", "admin", "super_admin")


def _serialize(app: App) -> AppResponse:
    return AppResponse.model_validate(app)


@router.get("", response_model=list[AppResponse])
def list_apps(
    school: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(App).filter(App.visibility.in_(["public", "enrolled"]))
    if school:
        q = q.filter(App.school == school)
    if search:
        q = q.filter(App.title.ilike(f"%{search}%"))
    apps = q.order_by(App.created_at.desc()).offset(offset).limit(limit).all()
    return [_serialize(a) for a in apps]


@router.get("/{app_id}", response_model=AppResponse)
def get_app(app_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return _serialize(app)


@router.post("", response_model=AppResponse, status_code=status.HTTP_201_CREATED)
def create_app(
    body: AppCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*TEACHER_ROLES)),
):
    app = App(
        **body.model_dump(exclude={"tags"}),
        tags=json.dumps(body.tags or []),
        created_by=current_user.id,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return _serialize(app)


@router.put("/{app_id}", response_model=AppResponse)
def update_app(
    app_id: str,
    body: AppUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    if app.created_by != current_user.id and current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    data = body.model_dump(exclude_unset=True)
    if "tags" in data:
        data["tags"] = json.dumps(data["tags"] or [])
    for key, val in data.items():
        setattr(app, key, val)
    db.commit()
    db.refresh(app)
    return _serialize(app)


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_app(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    if app.created_by != current_user.id and current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    db.delete(app)
    db.commit()
