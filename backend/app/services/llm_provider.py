"""LLM synthesis provider abstraction for the RAG pipeline.

The retrieval pipeline (hybrid vector + BM25 + rerank) never talks to an LLM
directly — it only ever calls `LLMProvider.generate_json(...)`. This means
switching providers (Groq today, anything else tomorrow) never touches
retrieval code, per the team's explicit requirement.

Default provider is Groq (OpenAI-compatible API). If GROQ_API_KEY is not
set, `get_llm_provider()` returns `None` and callers must fall back to
templated (non-LLM) answer synthesis from retrieved evidence — mirroring
the original server.ts's optional-Gemini/deterministic-fallback pattern.
"""

import json
from abc import ABC, abstractmethod
from functools import lru_cache

from openai import AsyncOpenAI

from app.config import get_settings


class LLMProvider(ABC):
    @abstractmethod
    async def generate_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> dict:
        """Generate a JSON object from the model. Raises on failure/timeout;
        callers are responsible for falling back to deterministic synthesis."""
        raise NotImplementedError


class GroqProvider(LLMProvider):
    def __init__(self, api_key: str, base_url: str, model: str):
        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self._model = model

    async def generate_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> dict:
        response = await self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        return json.loads(content)


@lru_cache
def get_llm_provider() -> LLMProvider | None:
    settings = get_settings()
    if not settings.GROQ_API_KEY:
        return None
    return GroqProvider(
        api_key=settings.GROQ_API_KEY,
        base_url=settings.GROQ_BASE_URL,
        model=settings.GROQ_MODEL,
    )
