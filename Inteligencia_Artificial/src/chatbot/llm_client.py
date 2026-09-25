"""
AGRILION — LLM Client v4 (PRODUCTION)
======================================
3-layer fallback con Groq como proveedor principal:

    Layer 1 → Groq (inference rápida, free tier generoso, sin GPU)
    Layer 2 → OpenRouter (multi-model, free tier)
    Layer 3 → Rule-based engine (offline, sin internet, 0 costo)

Groq Free Tier (2026):
    - 30 requests/minuto (RPM) → renueva cada minuto
    - 14,400 requests/día (RPD) → renueva diariamente
    - 6,000 tokens/minuto (TPM)
    - Sin tarjeta de crédito
    - Modelos disponibles: llama-3.3-70b-versatile, llama-3.1-8b-instant, gemma2-9b-it
    - API compatible con OpenAI → base URL: https://api.groq.com/openai/v1

Producción (justificación de modelo pago):
    Cuando el sistema pase a producción, se justifica migrar a:
    - GPT-4o-mini (~$2.25/mes por 30K consultas): mejor razonamiento + function calling
    - Claude Haiku (~$3.75/mes): excelente en español, respuestas naturales
    - GPT-4o (~$37.50/mes): análisis complejos multi-silo
    Razones: SLA garantizado, sin rate limits estrictos, streaming nativo,
    function calling (ej: "enviar alerta al técnico"), contexto de 128K tokens,
    sin sorpresas de disponibilidad.
"""

import os
import time
import unicodedata
import logging
import httpx
from abc import ABC, abstractmethod
from typing import Optional, List
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


# ─── Config ──────────────────────────────────────────────────────────────────

@dataclass
class LLMConfig:
    provider: str = "groq"

    # Layer 1: Groq (primario, recomendado)
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_models: List[str] = field(default_factory=lambda: [
        "llama-3.3-70b-versatile",    # mejor calidad, 70B params
        "llama-3.1-8b-instant",       # más rápido, 8B params
    ])

    # Layer 2: OpenRouter (fallback)
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_models: List[str] = field(default_factory=lambda: [
        "meta-llama/llama-3.1-8b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "google/gemma-2-9b-it:free",
    ])

    max_tokens: int = 600
    temperature: float = 0.3
    timeout: float = 15.0

    max_retries: int = 1
    retry_delay: float = 0.5

    @classmethod
    def from_env(cls) -> "LLMConfig":
        return cls(
            groq_api_key=os.getenv("GROQ_API_KEY", ""),
            openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
        )


# ─── Sanitizer ───────────────────────────────────────────────────────────────

def sanitize(text: str) -> str:
    if not text:
        return ""

    text = unicodedata.normalize("NFC", text)
    text = text.replace("\ufffd", "").replace("\x00", "")

    replacements = {
        "Â°": "°",
        "Ã¡": "á",
        "Ã©": "é",
        "Ã³": "ó",
        "Ãº": "ú",
        "Ã±": "ñ",
    }

    for k, v in replacements.items():
        text = text.replace(k, v)

    return text.strip()


# ─── Base ────────────────────────────────────────────────────────────────────

class BaseLLMClient(ABC):
    def __init__(self, config: LLMConfig):
        self.config = config

    @abstractmethod
    def complete(self, messages: list[dict], **kwargs) -> str:
        pass

    def _retry(self, fn, *args, **kwargs):
        last_err = None

        for attempt in range(self.config.max_retries + 1):
            try:
                result = fn(*args, **kwargs)
                return sanitize(result)

            except httpx.HTTPStatusError as e:
                status = e.response.status_code

                # NO retry en errores de cliente (API key inválida, etc.)
                if status in (401, 403, 404):
                    raise

                last_err = e

            except Exception as e:
                last_err = e

            if attempt < self.config.max_retries:
                time.sleep(self.config.retry_delay)

        raise last_err


# ─── Layer 1: Groq (recomendado para prototipo y producción económica) ──────

class GroqClient(BaseLLMClient):
    """
    Cliente para Groq. Usa la API compatible con OpenAI.

    Free tier 2026:
        - 30 RPM (renueva cada minuto)
        - 14,400 RPD (renueva diariamente)
        - Suficiente para prototipo y uso moderado
    """

    def complete(self, messages: list[dict], **kwargs) -> str:
        return self._retry(self._call, messages, **kwargs)

    def _call(self, messages: list[dict], **kwargs) -> str:
        if not self.config.groq_api_key:
            raise ValueError("GROQ_API_KEY not set")

        headers = {
            "Authorization": f"Bearer {self.config.groq_api_key}",
            "Content-Type": "application/json",
        }

        last_error = None

        for model in self.config.groq_models:
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": kwargs.get("max_tokens", self.config.max_tokens),
                "temperature": kwargs.get("temperature", self.config.temperature),
                "stream": False,
            }

            try:
                with httpx.Client(timeout=self.config.timeout) as client:
                    r = client.post(
                        f"{self.config.groq_base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )

                    r.raise_for_status()

                    content = r.json()["choices"][0]["message"]["content"]

                    logger.info(f"[LLM] Groq SUCCESS → {model}")
                    return content

            except httpx.HTTPStatusError as e:
                status = e.response.status_code
                # Rate limit (429) → probar siguiente modelo o propagar
                if status == 429:
                    logger.warning(f"[Groq] Rate limit on {model}, trying next model")
                    last_error = e
                    continue
                # Errores de cliente → no continuar
                if status in (401, 403, 404):
                    raise
                last_error = e
                logger.warning(f"[Groq] {model} failed ({status}): {e}")
                continue
            except Exception as e:
                logger.warning(f"[Groq] {model} error: {e}")
                last_error = e
                continue

        raise last_error


# ─── Layer 2: OpenRouter (multi-model fallback) ─────────────────────────────

class OpenRouterClient(BaseLLMClient):

    def complete(self, messages: list[dict], **kwargs) -> str:
        return self._retry(self._call, messages, **kwargs)

    def _call(self, messages: list[dict], **kwargs) -> str:
        if not self.config.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY not set")

        headers = {
            "Authorization": f"Bearer {self.config.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://agrilion.app",
            "X-Title": "Agrilion",
        }

        last_error = None

        for model in self.config.openrouter_models:
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": kwargs.get("max_tokens", self.config.max_tokens),
                "temperature": kwargs.get("temperature", self.config.temperature),
            }

            try:
                with httpx.Client(timeout=self.config.timeout) as client:
                    r = client.post(
                        f"{self.config.openrouter_base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )

                    r.raise_for_status()

                    content = r.json()["choices"][0]["message"]["content"]

                    logger.info(f"[LLM] OpenRouter SUCCESS → {model}")
                    return content

            except Exception as e:
                logger.warning(f"[OpenRouter] {model} failed: {e}")
                last_error = e
                continue

        raise last_error


# ─── Fallback Orquestator ────────────────────────────────────────────────────

class FallbackLLMClient(BaseLLMClient):
    """
    Orquestador de 3 capas:
        1. Groq (primario — rápido, gratis, buena calidad)
        2. OpenRouter (fallback — modelos gratuitos)
        3. Rule Engine (emergencia — offline, determinístico)
    """

    def __init__(self, config: LLMConfig, rule_engine=None):
        super().__init__(config)
        self.groq = GroqClient(config)
        self.openrouter = OpenRouterClient(config)
        self.rule_engine = rule_engine

    def complete(self, messages: list[dict], context: dict = None, **kwargs) -> str:

        # ── LAYER 1: Groq (primario) ──
        if self.config.groq_api_key:
            try:
                result = self.groq.complete(messages, **kwargs)
                logger.info("[Fallback] Layer 1 (Groq) used")
                return result
            except Exception as e:
                logger.warning(f"[Fallback] Groq failed: {e}")
        else:
            logger.info("[Fallback] Groq skipped (no GROQ_API_KEY)")

        # ── LAYER 2: OpenRouter (fallback) ──
        if self.config.openrouter_api_key:
            try:
                result = self.openrouter.complete(messages, **kwargs)
                logger.info("[Fallback] Layer 2 (OpenRouter) used")
                return result
            except Exception as e:
                logger.warning(f"[Fallback] OpenRouter failed: {e}")
        else:
            logger.info("[Fallback] OpenRouter skipped (no OPENROUTER_API_KEY)")

        # ── LAYER 3: Rule Engine (emergencia) ──
        if self.rule_engine and context:
            logger.info("[Fallback] Layer 3 (Rule Engine) used")

            from src.chatbot.rule_based_engine import RuleBasedEngine

            engine, state = RuleBasedEngine.from_context(context)

            user_msg = next(
                (m["content"] for m in reversed(messages) if m["role"] == "user"),
                ""
            )

            return engine.respond(state, user_msg)

        return "Sistema temporalmente no disponible. Revisá el panel de control."


# ─── Factory ─────────────────────────────────────────────────────────────────

def create_llm_client(config: Optional[LLMConfig] = None, rule_engine=None):
    cfg = config or LLMConfig.from_env()

    providers = []
    if cfg.groq_api_key:
        providers.append("Groq")
    if cfg.openrouter_api_key:
        providers.append("OpenRouter")
    providers.append("RuleEngine")

    logger.info(f"LLM INIT → fallback chain: {' → '.join(providers)}")

    return FallbackLLMClient(cfg, rule_engine=rule_engine)


# ─── Compatibilidad ──────────────────────────────────────────────────────────

class FallbackClient(FallbackLLMClient):
    pass
