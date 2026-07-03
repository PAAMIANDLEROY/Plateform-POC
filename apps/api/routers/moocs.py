from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from database import get_db
from models.mooc import MOOC, MOOCModule, MOOCModuleCourse, UserMOOCEnrollment
from models.user import User
from schemas.mooc import MOOCCreate, MOOCUpdate, MOOCResponse, EnrollmentResponse
from core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/v1/moocs", tags=["moocs"])

TEACHER_ROLES = ("teacher", "admin", "super_admin")


def _serialize(mooc: MOOC) -> MOOCResponse:
    return MOOCResponse.model_validate(mooc)


@router.get("", response_model=list[MOOCResponse])
def list_moocs(
    school: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(MOOC).filter(MOOC.status == "published")
    if school:
        q = q.filter(MOOC.school == school)
    if search:
        q = q.filter(MOOC.title.ilike(f"%{search}%"))
    moocs = q.order_by(MOOC.created_at.desc()).offset(offset).limit(limit).all()
    return [_serialize(m) for m in moocs]


@router.get("/{mooc_id}", response_model=MOOCResponse)
def get_mooc(mooc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mooc = db.query(MOOC).filter(MOOC.id == mooc_id).first()
    if not mooc:
        raise HTTPException(status_code=404, detail="MOOC not found")
    return _serialize(mooc)


@router.post("", response_model=MOOCResponse, status_code=status.HTTP_201_CREATED)
def create_mooc(
    body: MOOCCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*TEACHER_ROLES)),
):
    mooc = MOOC(
        title=body.title,
        description=body.description,
        cover_url=body.cover_url,
        school=body.school,
        is_linear=body.is_linear,
        created_by=current_user.id,
    )
    db.add(mooc)
    db.flush()

    for mod_data in body.modules:
        module = MOOCModule(mooc_id=mooc.id, title=mod_data.title, position=mod_data.position)
        db.add(module)
        db.flush()
        for c in mod_data.courses:
            db.add(MOOCModuleCourse(module_id=module.id, course_id=c.course_id, position=c.position))

    db.commit()
    db.refresh(mooc)
    return _serialize(mooc)


@router.put("/{mooc_id}", response_model=MOOCResponse)
def update_mooc(
    mooc_id: str,
    body: MOOCUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mooc = db.query(MOOC).filter(MOOC.id == mooc_id).first()
    if not mooc:
        raise HTTPException(status_code=404, detail="MOOC not found")
    if mooc.created_by != current_user.id and current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(mooc, key, val)
    db.commit()
    db.refresh(mooc)
    return _serialize(mooc)


@router.post("/{mooc_id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll(mooc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mooc = db.query(MOOC).filter(MOOC.id == mooc_id, MOOC.status == "published").first()
    if not mooc:
        raise HTTPException(status_code=404, detail="MOOC not found")

    existing = db.query(UserMOOCEnrollment).filter(
        UserMOOCEnrollment.user_id == current_user.id,
        UserMOOCEnrollment.mooc_id == mooc_id,
    ).first()
    if existing:
        return existing

    enrollment = UserMOOCEnrollment(user_id=current_user.id, mooc_id=mooc_id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/{mooc_id}/progress")
def get_progress(mooc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    enrollment = db.query(UserMOOCEnrollment).filter(
        UserMOOCEnrollment.user_id == current_user.id,
        UserMOOCEnrollment.mooc_id == mooc_id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Not enrolled")
    return {
        "enrolled_at": enrollment.enrolled_at,
        "completed_at": enrollment.completed_at,
    }
