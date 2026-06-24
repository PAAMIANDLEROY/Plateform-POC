"""
Router Hi! Insights — articles éditoriaux.

CRUD minimal pour le MVP : liste, détail, création. La création est ouverte à
tout utilisateur authentifié pour l'instant ; le workflow de review et les
restrictions par rôle seront ajoutés plus tard.
"""
import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.insight import Insight, InsightStatus
from models.user import User
from schemas.insight import InsightCreate, InsightResponse
from core.deps import get_current_user

router = APIRouter(prefix="/api/v1/insights", tags=["insights"])


def _serialize(article: Insight) -> InsightResponse:
    return InsightResponse.model_validate(article)


@router.get("", response_model=list[InsightResponse])
def list_insights(
    category: Optional[str] = Query(None),
    school: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Insight)
    if category:
        q = q.filter(Insight.category == category)
    if school:
        q = q.filter(Insight.school == school)
    if search:
        q = q.filter(Insight.title.ilike(f"%{search}%"))
    articles = q.order_by(Insight.created_at.desc()).offset(offset).limit(limit).all()
    return [_serialize(a) for a in articles]


@router.get("/{insight_id}", response_model=InsightResponse)
def get_insight(insight_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    article = db.query(Insight).filter(Insight.id == insight_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Insight not found")
    return _serialize(article)


@router.post("", response_model=InsightResponse, status_code=status.HTTP_201_CREATED)
def create_insight(
    body: InsightCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = Insight(
        title=body.title,
        abstract=body.abstract,
        authors=json.dumps(body.authors or []),
        tags=json.dumps(body.tags or []),
        school=body.school,
        category=body.category,
        cover_url=body.cover,
        read_time=body.read_time,
        published_at=body.published_at or date.today().isoformat(),
        status=InsightStatus.published,
        blocks=body.blocks or [],
        created_by=current_user.id,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return _serialize(article)
