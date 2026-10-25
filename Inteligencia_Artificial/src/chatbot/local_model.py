import httpx
import logging
import re

logger = logging.getLogger(__name__)


class LocalLLMClient:
    """
    Cliente local usando Ollama.

    Usa /api/chat (formato de mensajes) en lugar de /api/generate para que
    los modelos instruct (qwen3, llama3, etc.) respeten el system prompt.
    """

    def __init__(self, model: str = "qwen3:8b", base_url: str = "http://localhost:11434"):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = 120.0

    def complete(self, messages: list[dict], **kwargs) -> str:
        try:
            payload = {
                "model": self.model,
                "messages": messages,
                "stream": False,
                "think": False,          # qwen3: evita el bloque de razonamiento
                "keep_alive": "1h",      # mantiene el modelo cargado en memoria
                "options": {
                    "temperature": kwargs.get("temperature", 0.1),
                    "num_predict": kwargs.get("max_tokens", 350),
                },
            }

            with httpx.Client(timeout=self.timeout) as client:
                r = client.post(f"{self.base_url}/api/chat", json=payload)

                if r.status_code != 200:
                    logger.warning(f"[Ollama] HTTP {r.status_code}: {r.text[:200]}")
                    return ""

                data = r.json()
                content = (data.get("message") or {}).get("content", "").strip()
                return self._clean(content)

        except Exception as e:
            logger.warning(f"[Ollama] error: {e}")
            return ""

    @staticmethod
    def _clean(text: str) -> str:
        """Quita bloques de razonamiento de modelos tipo qwen3."""
        if not text:
            return ""
        text = re.sub(r"<think(?:ing)?>.*?</think(?:ing)?>", "", text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"^\s*Thinking\.\.\..*?\n\n", "", text, flags=re.DOTALL)
        return text.strip()
