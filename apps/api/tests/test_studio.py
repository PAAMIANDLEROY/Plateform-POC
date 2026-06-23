"""
Tests des pipelines Studio IA (génération de contenu).
- Niveau service : le fallback démo fonctionne sans clé LLM (déterministe).
- Niveau endpoint : les routes exigent le rôle enseignant.
"""
import asyncio

from fastapi.testclient import TestClient

from database import Base, engine
import models  # noqa: F401 — enregistre les modèles ORM
from services.ai import (
    generate_flashcards_from_content,
    generate_mindmap_from_content,
)
from services.llm import get_llm_provider

Base.metadata.create_all(bind=engine)

from main import app

client = TestClient(app)


# ── Service : fallback démo (sans clé LLM) ────────────────────────────────────

def test_flashcards_demo_fallback():
    get_llm_provider.cache_clear()  # garantit le chemin démo (pas de clé en test)
    data = asyncio.run(generate_flashcards_from_content("contenu de cours", n_cards=3))
    assert data["cards"]
    assert len(data["cards"]) <= 3
    card = data["cards"][0]
    assert card["front"] and card["back"]


def test_flashcards_demo_respects_title():
    get_llm_provider.cache_clear()
    data = asyncio.run(
        generate_flashcards_from_content("contenu", n_cards=2, title="Mon paquet")
    )
    assert data["title"] == "Mon paquet"


def test_mindmap_demo_fallback():
    get_llm_provider.cache_clear()
    data = asyncio.run(generate_mindmap_from_content("contenu de cours"))
    assert data["root"]["label"]
    assert data["root"]["children"]  # au moins une branche


# ── Endpoint : auth requise ───────────────────────────────────────────────────

def test_flashcards_endpoint_requires_teacher():
    response = client.post("/api/v1/studio/flashcards", json={"content": "x"})
    assert response.status_code in (401, 422)


def test_mindmap_endpoint_requires_teacher():
    response = client.post("/api/v1/studio/mindmap", json={"content": "x"})
    assert response.status_code in (401, 422)


def test_studio_health_lists_pipelines():
    response = client.get("/api/v1/studio/health")
    assert response.status_code == 200
    pipelines = response.json()["pipelines"]
    assert "flashcards" in pipelines
    assert "mindmap" in pipelines
