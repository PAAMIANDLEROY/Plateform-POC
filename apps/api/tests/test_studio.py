"""
Tests des pipelines Studio IA (génération de contenu).
- Niveau service : sans clé LLM, la génération lève une erreur (plus de fallback démo).
- Niveau endpoint : les routes exigent le rôle enseignant.
"""
import asyncio

import pytest

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

def test_flashcards_no_provider_raises():
    get_llm_provider.cache_clear()  # pas de clé LLM en test → pas de provider
    with pytest.raises(ValueError):
        asyncio.run(generate_flashcards_from_content("contenu de cours", n_cards=3))


def test_mindmap_no_provider_raises():
    get_llm_provider.cache_clear()
    with pytest.raises(ValueError):
        asyncio.run(generate_mindmap_from_content("contenu de cours"))


def test_study_sheet_no_provider_raises():
    get_llm_provider.cache_clear()
    with pytest.raises(ValueError):
        asyncio.run(generate_study_sheet_from_content("contenu de cours"))


def test_faq_no_provider_raises():
    get_llm_provider.cache_clear()
    with pytest.raises(ValueError):
        asyncio.run(generate_faq_from_content("contenu de cours", n_items=2))


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
