"""
Tests de la couche LLM-agnostique (services/llm.py — P1).
Vérifie la sélection du provider par configuration, sans appel réseau
(l'instanciation du client SDK ne déclenche aucune requête).
"""
import pytest

from core.config import settings
from services import llm
from services.llm import (
    AnthropicProvider,
    OpenAIProvider,
    MistralProvider,
    get_llm_provider,
)


@pytest.fixture(autouse=True)
def _reset_provider_cache():
    """Vide le cache singleton avant et après chaque test (config qui varie)."""
    get_llm_provider.cache_clear()
    yield
    get_llm_provider.cache_clear()


def test_no_key_returns_none(monkeypatch):
    """Sans clé API, le provider est None → l'appelant bascule en démo."""
    monkeypatch.setattr(settings, "LLM_PROVIDER", "anthropic")
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
    assert get_llm_provider() is None


def test_anthropic_selected_with_key(monkeypatch):
    monkeypatch.setattr(settings, "LLM_PROVIDER", "anthropic")
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setattr(settings, "LLM_MODEL", "")
    provider = get_llm_provider()
    assert isinstance(provider, AnthropicProvider)
    assert provider.model == AnthropicProvider.DEFAULT_MODEL


def test_openai_selected_with_key(monkeypatch):
    monkeypatch.setattr(settings, "LLM_PROVIDER", "openai")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "sk-test")
    monkeypatch.setattr(settings, "LLM_MODEL", "gpt-4o")
    provider = get_llm_provider()
    assert isinstance(provider, OpenAIProvider)
    assert provider.model == "gpt-4o"  # surcharge LLM_MODEL respectée


def test_mistral_selected_with_key(monkeypatch):
    monkeypatch.setattr(settings, "LLM_PROVIDER", "mistral")
    monkeypatch.setattr(settings, "MISTRAL_API_KEY", "mistral-test")
    monkeypatch.setattr(settings, "LLM_MODEL", "")
    provider = get_llm_provider()
    assert isinstance(provider, MistralProvider)
    assert provider.model == MistralProvider.DEFAULT_MODEL
    # Mistral hérite des embeddings d'OpenAIProvider (prêt pour le RAG)
    assert provider.EMBED_MODEL == "mistral-embed"


def test_unknown_provider_returns_none(monkeypatch):
    monkeypatch.setattr(settings, "LLM_PROVIDER", "does-not-exist")
    assert get_llm_provider() is None


def test_anthropic_provider_has_no_embed(monkeypatch):
    """Anthropic ne supporte pas embed() → NotImplementedError (préparé pour le RAG)."""
    monkeypatch.setattr(settings, "LLM_PROVIDER", "anthropic")
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "sk-ant-test")
    provider = get_llm_provider()
    with pytest.raises(NotImplementedError):
        provider.embed(["texte"])
