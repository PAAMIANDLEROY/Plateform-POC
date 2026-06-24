"""
Tests du module Insights (articles éditoriaux).
- Sérialisation du modèle → réponse API (sans DB).
- Les endpoints exigent une authentification.
"""
import json
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from database import Base, engine
import models  # noqa: F401 — enregistre les modèles ORM (dont Insight)

Base.metadata.create_all(bind=engine)

from main import app

client = TestClient(app)


def test_insight_response_serialization():
    from models.insight import Insight, InsightStatus
    from schemas.insight import InsightResponse

    article = Insight(
        id="x", title="T", abstract="A",
        authors=json.dumps(["Auteur 1", "Auteur 2"]),
        tags=json.dumps(["LLM", "Vision"]),
        school="Polytechnique", category="IA", cover_url="http://img/cover.jpg",
        read_time=8, published_at="2026-01-01", status=InsightStatus.published,
        blocks=[{"type": "text", "content": "Bonjour"}], created_by="u1",
        created_at=datetime.now(timezone.utc),
    )
    resp = InsightResponse.model_validate(article)
    assert resp.authors == ["Auteur 1", "Auteur 2"]
    assert resp.tags == ["LLM", "Vision"]
    assert resp.cover == "http://img/cover.jpg"   # cover_url → cover
    assert resp.status == "published"
    assert resp.blocks[0]["type"] == "text"


def test_list_insights_requires_auth():
    assert client.get("/api/v1/insights").status_code == 401


def test_get_insight_requires_auth():
    assert client.get("/api/v1/insights/1").status_code == 401


def test_create_insight_requires_auth():
    assert client.post("/api/v1/insights", json={"title": "Nouvel article"}).status_code in (401, 422)
