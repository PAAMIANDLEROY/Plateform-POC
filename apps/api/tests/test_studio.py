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
    generate_study_sheet_from_content,
    generate_faq_from_content,
)
from services.llm import get_llm_provider
from services.transcription import transcribe_audio, fetch_youtube_transcript, MOCK_TRANSCRIPTION

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


def test_study_sheet_demo_fallback():
    get_llm_provider.cache_clear()
    data = asyncio.run(generate_study_sheet_from_content("contenu de cours"))
    assert data["summary"]
    assert data["key_concepts"] and data["key_concepts"][0]["term"]
    assert data["key_points"]


def test_faq_demo_fallback():
    get_llm_provider.cache_clear()
    data = asyncio.run(generate_faq_from_content("contenu de cours", n_items=2))
    assert len(data["items"]) <= 2
    assert data["items"][0]["question"] and data["items"][0]["answer"]


# ── Endpoint : auth requise ───────────────────────────────────────────────────

def test_flashcards_endpoint_requires_teacher():
    response = client.post("/api/v1/studio/flashcards", json={"content": "x"})
    assert response.status_code in (401, 422)


def test_mindmap_endpoint_requires_teacher():
    response = client.post("/api/v1/studio/mindmap", json={"content": "x"})
    assert response.status_code in (401, 422)


def test_study_sheet_endpoint_requires_teacher():
    response = client.post("/api/v1/studio/study-sheet", json={"content": "x"})
    assert response.status_code in (401, 422)


def test_faq_endpoint_requires_teacher():
    response = client.post("/api/v1/studio/faq", json={"content": "x"})
    assert response.status_code in (401, 422)


def test_studio_health_lists_pipelines():
    response = client.get("/api/v1/studio/health")
    assert response.status_code == 200
    pipelines = response.json()["pipelines"]
    for p in ("flashcards", "mindmap", "study-sheet", "faq"):
        assert p in pipelines


def test_transcription_falls_back_to_mock_without_keys():
    # En environnement de test, aucune clé MISTRAL/OPENAI → transcription mock,
    # sans appel réseau (les branches Mistral/Whisper ne sont pas atteintes).
    text = asyncio.run(transcribe_audio(b"fake-bytes", "video.mp4"))
    assert text == MOCK_TRANSCRIPTION


def test_fetch_youtube_transcript_empty_returns_none():
    # Entrée vide → None sans appel réseau (garde-fou avant l'API YouTube).
    assert fetch_youtube_transcript("") is None
