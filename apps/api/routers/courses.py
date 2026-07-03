import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from database import get_db
from models.course import Course, CourseBlock, UserCourseProgress
from models.user import User
from schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseBlockCreate, CourseBlockResponse, ProgressUpdate
from core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/v1/courses", tags=["courses"])

TEACHER_ROLES = ("teacher", "admin", "super_admin")


def _serialize(course: Course) -> CourseResponse:
    return CourseResponse.model_validate(course)


@router.get("", response_model=list[CourseResponse])
def list_courses(
    category: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    school: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Course).filter(Course.status == "published")
    if category:
        q = q.filter(Course.category == category)
    if level:
        q = q.filter(Course.level == level)
    if school:
        q = q.filter(Course.school == school)
    if search:
        q = q.filter(Course.title.ilike(f"%{search}%"))
    courses = q.order_by(Course.created_at.desc()).offset(offset).limit(limit).all()
    return [_serialize(c) for c in courses]


@router.get("/mine", response_model=list[CourseResponse])
def list_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*TEACHER_ROLES)),
):
    courses = db.query(Course).filter(Course.created_by == current_user.id).order_by(Course.updated_at.desc()).all()
    return [_serialize(c) for c in courses]


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.status != "published" and course.created_by != current_user.id and current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Course not available")
    return _serialize(course)


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    body: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*TEACHER_ROLES)),
):
    course = Course(
        **body.model_dump(exclude={"tags"}),
        tags=json.dumps(body.tags or []),
        created_by=current_user.id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return _serialize(course)


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: str,
    body: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.created_by != current_user.id and current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    data = body.model_dump(exclude_unset=True)
    if "tags" in data:
        data["tags"] = json.dumps(data["tags"] or [])
    for key, val in data.items():
        setattr(course, key, val)
    db.commit()
    db.refresh(course)
    return _serialize(course)


@router.put("/{course_id}/blocks", response_model=list[CourseBlockResponse])
def update_blocks(
    course_id: str,
    blocks: list[CourseBlockCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.created_by != current_user.id and current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db.query(CourseBlock).filter(CourseBlock.course_id == course_id).delete()
    new_blocks = [CourseBlock(course_id=course_id, **b.model_dump()) for b in blocks]
    db.add_all(new_blocks)
    db.commit()
    for b in new_blocks:
        db.refresh(b)
    return new_blocks


@router.post("/{course_id}/progress", status_code=status.HTTP_200_OK)
def update_progress(
    course_id: str,
    body: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == current_user.id,
        UserCourseProgress.course_id == course_id,
    ).first()

    if not progress:
        progress = UserCourseProgress(user_id=current_user.id, course_id=course_id, completed_blocks=[])
        db.add(progress)

    completed = progress.completed_blocks or []
    if body.completed_block_id not in completed:
        completed.append(body.completed_block_id)
        progress.completed_blocks = completed

    block_ids = [b.id for b in course.blocks]
    if block_ids and all(bid in completed for bid in block_ids):
        progress.completed_at = datetime.now(timezone.utc)

    db.commit()
    return {"completed_blocks": progress.completed_blocks, "completed_at": progress.completed_at}
