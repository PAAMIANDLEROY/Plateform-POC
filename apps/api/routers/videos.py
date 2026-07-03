import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.video import Video, VideoComment
from models.user import User
from schemas.video import VideoCreate, VideoUpdate, VideoResponse, CommentCreate, CommentResponse
from core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/v1/videos", tags=["videos"])

TEACHER_ROLES = ("teacher", "admin", "super_admin")


def _serialize(video: Video) -> VideoResponse:
    return VideoResponse.model_validate(video)


@router.get("", response_model=list[VideoResponse])
def list_videos(
    category: Optional[str] = Query(None),
    school: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Video).filter(Video.visibility.in_(["public", "enrolled"]))
    if category:
        q = q.filter(Video.category == category)
    if school:
        q = q.filter(Video.school == school)
    if search:
        q = q.filter(Video.title.ilike(f"%{search}%"))
    videos = q.order_by(Video.created_at.desc()).offset(offset).limit(limit).all()
    return [_serialize(v) for v in videos]


@router.get("/{video_id}", response_model=VideoResponse)
def get_video(video_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    video.view_count += 1
    db.commit()
    return _serialize(video)


@router.post("", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
def create_video(
    body: VideoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*TEACHER_ROLES)),
):
    video = Video(
        **body.model_dump(exclude={"tags"}),
        tags=json.dumps(body.tags or []),
        created_by=current_user.id,
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return _serialize(video)


@router.put("/{video_id}", response_model=VideoResponse)
def update_video(
    video_id: str,
    body: VideoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.created_by != current_user.id and current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    data = body.model_dump(exclude_unset=True)
    if "tags" in data:
        data["tags"] = json.dumps(data["tags"] or [])
    for key, val in data.items():
        setattr(video, key, val)
    db.commit()
    db.refresh(video)
    return _serialize(video)


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.created_by != current_user.id and current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    db.delete(video)
    db.commit()


@router.post("/{video_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    video_id: str,
    body: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    comment = VideoComment(video_id=video_id, user_id=current_user.id, content=body.content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.get("/{video_id}/comments", response_model=list[CommentResponse])
def list_comments(video_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(VideoComment).filter(VideoComment.video_id == video_id).order_by(VideoComment.created_at).all()
