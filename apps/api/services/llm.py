"""
Couche d'abstraction LLM (P1 — pipelines LLM-agnostiques).

Objectif : découpler le code métier (Studio, futur RAG/tuteur) du fournisseur de
modèle. Le provider concret est choisi par configuration (`LLM_PROVIDER`,
`LLM_MODEL`) et exposé via `get_llm_provider()`. Pour changer de modèle —
ce qui arrive tous les ~3 mois — on modifie la config, jamais le code appelant.

Usage :
    from services.llm import get_llm_provider

    provider = get_llm_provider()        # None si aucun LLM configuré
    if provider is None:
        ...                              # fallback démo
    text = provider.complete(prompt, max_tokens=4096)

Ajouter un fournisseur = implémenter `LLMProvider` + un cas dans `get_llm_provider`.
La méthode `embed()` est définie ici mais n'est implémentée que par les providers
qui le supportent (préparé pour le socle RAG — P2).
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from functools import lru_cache
from typing import Optional

from core.config import settings

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """Interface commune à tous les fournisseurs de LLM."""

    #: Identifiant du modèle effectivement utilisé (pour logs / comptage de coûts).
    model: str

    @abstractmethod
    def complete(
        self,
        prompt: str,
        *,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        system: Optional[str] = None,
    ) -> str:
        """Génère une complétion texte à partir d'un prompt (single-turn)."""
        raise NotImplementedError

    def embed(self, texts: list[str]) -> list[list[float]]:
        """
        Calcule les embeddings d'une liste de textes (socle RAG — P2).
        Non supporté par défaut ; surchargé par les providers compatibles.
        """
        raise NotImplementedError(
            f"{type(self).__name__} ne supporte pas embed()."
        )


class AnthropicProvider(LLMProvider):
    """Fournisseur Claude (Anthropic)."""

    DEFAULT_MODEL = "claude-sonnet-4-6"

    def __init__(self, api_key: str, model: str = ""):
        import anthropic  # import local : lib optionnelle selon le provider actif

        self.model = model or self.DEFAULT_MODEL
        self._client = anthropic.Anthropic(api_key=api_key)

    def complete(
        self,
        prompt: str,
        *,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        system: Optional[str] = None,
    ) -> str:
        kwargs: dict = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system:
            kwargs["system"] = system
        message = self._client.messages.create(**kwargs)
        return message.content[0].text.strip()


class OpenAIProvider(LLMProvider):
    """Fournisseur OpenAI (GPT). Supporte aussi les embeddings (RAG)."""

    DEFAULT_MODEL = "gpt-4o-mini"
    EMBED_MODEL = "text-embedding-3-small"

    def __init__(self, api_key: str, model: str = ""):
        from openai import OpenAI  # import local

        self.model = model or self.DEFAULT_MODEL
        self._client = OpenAI(api_key=api_key)

    def complete(
        self,
        prompt: str,
        *,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        system: Optional[str] = None,
    ) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = self._client.chat.completions.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=messages,
        )
        return (resp.choices[0].message.content or "").strip()

    def embed(self, texts: list[str]) -> list[list[float]]:
        resp = self._client.embeddings.create(model=self.EMBED_MODEL, input=texts)
        return [item.embedding for item in resp.data]


@lru_cache(maxsize=1)
def get_llm_provider() -> Optional[LLMProvider]:
    """
    Construit le provider LLM selon la configuration (singleton par process).
    Retourne None si le provider sélectionné n'a pas de clé API → l'appelant
    bascule alors sur son contenu de démonstration.
    """
    provider = (settings.LLM_PROVIDER or "anthropic").lower()
    model = settings.LLM_MODEL

    if provider == "anthropic":
        if not settings.ANTHROPIC_API_KEY:
            logger.warning("LLM_PROVIDER=anthropic mais ANTHROPIC_API_KEY absent")
            return None
        return AnthropicProvider(settings.ANTHROPIC_API_KEY, model)

    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            logger.warning("LLM_PROVIDER=openai mais OPENAI_API_KEY absent")
            return None
        return OpenAIProvider(settings.OPENAI_API_KEY, model)

    logger.error("LLM_PROVIDER inconnu : %r — aucun provider chargé", provider)
    return None
