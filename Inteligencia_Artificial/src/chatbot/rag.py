"""
AGRILION — RAG local con embeddings de Ollama
=============================================

Recuperación de documentación del proyecto para el chatbot:

    texto → chunking (~800 chars, solapamiento ~150)
          → embeddings vía Ollama /api/embed (qwen3-embedding, local)
          → índice persistente en data/rag_index.npz (vectores float32)
                              + data/rag_meta.json (metadatos por chunk)
          → búsqueda top-k por similitud coseno (numpy puro)

Sin dependencias nuevas: usa httpx, numpy, json y la stdlib.

Diseño:
- Índice GLOBAL del proyecto (un solo archivo); no es multi-tenant.
- Idempotencia: si se vuelve a indexar el mismo `name` con el mismo
  contenido (mismo sha256), no se re-embeddea. Si cambia el contenido,
  se reemplazan los chunks del documento.
- Todos los métodos toleran fallos de Ollama lanzando `RAGUnavailable`;
  el chatbot los captura y NUNCA rompe la conversación por esto.
"""

import hashlib
import json
import logging
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import httpx
import numpy as np

logger = logging.getLogger(__name__)

# ─── Configuración ───────────────────────────────────────────────────────────

CHUNK_SIZE = 800
CHUNK_OVERLAP = 150
EMBED_BATCH = 32          # textos por request a /api/embed
EMBED_TIMEOUT = 60.0
SEARCH_BATCH_LIMIT = 2000  # límite defensivo de chunks

DEFAULT_BASE_URL = "http://localhost:11434"
DEFAULT_EMBED_MODEL = "qwen3-embedding:0.6b"

_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
INDEX_PATH = _DATA_DIR / "rag_index.npz"
META_PATH = _DATA_DIR / "rag_meta.json"


class RAGUnavailable(RuntimeError):
    """Ollama no responde o los embeddings fallaron."""


def _base_url() -> str:
    return (os.getenv("OLLAMA_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")


def _embed_model() -> str:
    return os.getenv("OLLAMA_EMBED_MODEL") or DEFAULT_EMBED_MODEL


# ─── Chunking ────────────────────────────────────────────────────────────────

def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """
    Divide texto en fragmentos de ~`size` caracteres con ~`overlap` de
    solapamiento, cortando preferentemente en fin de línea, punto o espacio
    para no partir palabras a la mitad.
    """
    text = (text or "").strip()
    if not text:
        return []
    if len(text) <= size:
        return [text]

    chunks: List[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + size, n)
        if end < n:
            window = text[start:end]
            cut = max(window.rfind("\n"), window.rfind(". "), window.rfind(" "))
            # Solo retroceder si no dejamos el fragmento demasiado corto.
            if cut > size // 3:
                end = start + cut + 1
        piece = text[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= n:
            break
        start = max(end - overlap, start + 1)
    return chunks[:SEARCH_BATCH_LIMIT]


# ─── Embeddings ──────────────────────────────────────────────────────────────

def embed_texts(
    texts: List[str],
    base_url: Optional[str] = None,
    model: Optional[str] = None,
) -> np.ndarray:
    """
    Embeddings vía Ollama /api/embed.

    Body: {"model": <model>, "input": [...]}
    Respuesta real verificada: {"embeddings": [[float, ...], ...]}
    con 1024 dimensiones para qwen3-embedding:0.6b.

    Devuelve array (n, dim) float32. Lanza RAGUnavailable si Ollama falla.
    """
    if not texts:
        return np.zeros((0, 0), dtype=np.float32)

    base = (base_url or _base_url()).rstrip("/")
    mdl = model or _embed_model()
    all_vecs: List[List[float]] = []

    try:
        with httpx.Client(timeout=EMBED_TIMEOUT) as client:
            for i in range(0, len(texts), EMBED_BATCH):
                batch = texts[i:i + EMBED_BATCH]
                r = client.post(f"{base}/api/embed", json={"model": mdl, "input": batch})
                r.raise_for_status()
                embs = (r.json() or {}).get("embeddings") or []
                if len(embs) != len(batch):
                    raise RAGUnavailable(
                        f"/api/embed devolvió {len(embs)} embeddings para {len(batch)} inputs"
                    )
                all_vecs.extend(embs)
    except RAGUnavailable:
        raise
    except Exception as e:
        raise RAGUnavailable(f"Embeddings no disponibles ({mdl}): {e}") from e

    arr = np.asarray(all_vecs, dtype=np.float32)
    if arr.ndim != 2 or arr.shape[0] != len(texts):
        raise RAGUnavailable(f"Shape inesperado de embeddings: {arr.shape}")
    return arr


# ─── Índice persistente ──────────────────────────────────────────────────────

class RAGIndex:
    """
    Índice de chunks + embeddings persistido en disco:

        rag_index.npz → campo "embeddings": matriz (N, D) float32
        rag_meta.json → {"chunks": [{doc_id, name, text, indexed_at}],
                         "documents": {doc_id: {name, sha256, chunks, indexed_at}}}
    """

    def __init__(self, index_path: Path = INDEX_PATH, meta_path: Path = META_PATH):
        self.index_path = Path(index_path)
        self.meta_path = Path(meta_path)
        self._lock = threading.RLock()
        self._emb = np.zeros((0, 0), dtype=np.float32)
        self._chunks: List[Dict] = []
        self._documents: Dict[str, Dict] = {}
        self.load()

    # ── persistencia ──

    def load(self) -> None:
        with self._lock:
            try:
                if self.index_path.exists():
                    data = np.load(self.index_path, allow_pickle=False)
                    self._emb = np.asarray(data["embeddings"], dtype=np.float32)
                else:
                    self._emb = np.zeros((0, 0), dtype=np.float32)
            except Exception as e:
                logger.warning(f"RAG: no se pudo leer {self.index_path}: {e}")
                self._emb = np.zeros((0, 0), dtype=np.float32)

            try:
                if self.meta_path.exists():
                    meta = json.loads(self.meta_path.read_text(encoding="utf-8"))
                    self._chunks = meta.get("chunks") or []
                    self._documents = meta.get("documents") or {}
                else:
                    self._chunks, self._documents = [], {}
            except Exception as e:
                logger.warning(f"RAG: no se pudo leer {self.meta_path}: {e}")
                self._chunks, self._documents = [], {}

            # Coherencia: si difieren, nos quedamos con el mínimo común.
            n = min(len(self._chunks), self._emb.shape[0])
            self._chunks = self._chunks[:n]
            self._emb = self._emb[:n]

    def save(self) -> None:
        with self._lock:
            self.index_path.parent.mkdir(parents=True, exist_ok=True)
            # Nota: el archivo temporal DEBE terminar en .npz, porque
            # np.savez añade esa extensión si el nombre no la tiene.
            tmp_npz = self.index_path.with_suffix(".tmp.npz")
            np.savez(tmp_npz, embeddings=self._emb)
            os.replace(tmp_npz, self.index_path)

            tmp_json = self.meta_path.with_suffix(".json.tmp")
            meta = {"chunks": self._chunks, "documents": self._documents}
            tmp_json.write_text(
                json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            os.replace(tmp_json, self.meta_path)

    # ── helpers ──

    @staticmethod
    def doc_id_for(name: str) -> str:
        return hashlib.md5(name.strip().lower().encode("utf-8")).hexdigest()[:12]

    @property
    def is_empty(self) -> bool:
        return not self._chunks

    def __len__(self) -> int:
        return len(self._chunks)

    def _remove_doc_locked(self, doc_id: str) -> None:
        keep = [i for i, ch in enumerate(self._chunks) if ch.get("doc_id") != doc_id]
        if len(keep) != len(self._chunks):
            self._emb = self._emb[keep] if len(keep) else np.zeros((0, self._emb.shape[1] or 0), dtype=np.float32)
            self._chunks = [self._chunks[i] for i in keep]
        self._documents.pop(doc_id, None)

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    # ── API pública ──

    def add_document(
        self,
        name: str,
        content: str,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict:
        """
        Chunk + embed + persistir. Idempotente por (name, sha256 del contenido):
        mismo documento → no-op; contenido distinto con mismo nombre → reemplazo.
        """
        name = (name or "").strip()
        if not name:
            raise ValueError("El documento necesita un nombre")
        if not (content or "").strip():
            raise ValueError("El documento está vacío")

        doc_id = self.doc_id_for(name)
        sha256 = hashlib.sha256(content.encode("utf-8")).hexdigest()

        with self._lock:
            existing = self._documents.get(doc_id)
            if existing and existing.get("sha256") == sha256:
                # Idempotente: nada que hacer.
                return {
                    "doc_id": doc_id,
                    "name": name,
                    "chunks": existing.get("chunks", 0),
                    "indexed_at": existing.get("indexed_at", ""),
                    "sha256": sha256,
                    "reindexed": False,
                }

            chunks = chunk_text(content)
            if not chunks:
                raise ValueError("El contenido no produjo chunks")

            vecs = embed_texts(chunks, base_url=base_url, model=model)
            dim = int(vecs.shape[1])

            with self._lock:
                if self._emb.shape[0] > 0 and self._emb.shape[1] != dim:
                    raise RAGUnavailable(
                        "Dimensión de embeddings incompatible: el índice existente tiene "
                        f"{self._emb.shape[1]} dims y el modelo actual produce {dim}. "
                        "Borrá el índice (data/rag_index.npz) o cambiá OLLAMA_EMBED_MODEL."
                    )

                # Reemplazo por nombre: fuera los chunks del doc anterior.
                self._remove_doc_locked(doc_id)

                now = self._now_iso()
                for text in chunks:
                    self._chunks.append({
                        "doc_id": doc_id,
                        "name": name,
                        "text": text,
                        "indexed_at": now,
                    })
                self._emb = vecs if self._emb.shape[0] == 0 else np.vstack([self._emb, vecs])
                self._documents[doc_id] = {
                    "name": name,
                    "sha256": sha256,
                    "chunks": len(chunks),
                    "indexed_at": now,
                }
                self.save()

        logger.info(f"RAG: documento '{name}' indexado ({len(chunks)} chunks, dim={dim})")
        return {
            "doc_id": doc_id,
            "name": name,
            "chunks": len(chunks),
            "indexed_at": now,
            "sha256": sha256,
            "reindexed": True,
        }

    def delete_document(self, doc_id: str) -> bool:
        with self._lock:
            if doc_id not in self._documents:
                return False
            self._remove_doc_locked(doc_id)
            self.save()
        logger.info(f"RAG: documento {doc_id} eliminado")
        return True

    def list_documents(self) -> List[Dict]:
        with self._lock:
            return [
                {
                    "doc_id": did,
                    "name": info.get("name", did),
                    "chunks": info.get("chunks", 0),
                    "indexed_at": info.get("indexed_at", ""),
                    "sha256": info.get("sha256", ""),
                }
                for did, info in self._documents.items()
            ]

    def search(
        self,
        query: str,
        k: int = 3,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ) -> List[Dict]:
        """
        Top-k por similitud coseno. Devuelve [{score, doc_id, name, text}].
        Lanza RAGUnavailable si el embedding del query falla o la dimensión
        del modelo no coincide con el índice.
        """
        if not (query or "").strip() or self.is_empty:
            return []
        k = max(1, min(int(k), len(self._chunks)))

        qvec = embed_texts([query.strip()], base_url=base_url, model=model)
        dim = int(qvec.shape[1])
        with self._lock:
            if self._emb.shape[1] != dim:
                raise RAGUnavailable(
                    f"Dimensión del query ({dim}) no coincide con el índice ({self._emb.shape[1]})"
                )
            emb = self._emb

        # Similitud coseno con numpy puro.
        emb_norm = emb / (np.linalg.norm(emb, axis=1, keepdims=True) + 1e-12)
        q_norm = qvec[0] / (np.linalg.norm(qvec[0]) + 1e-12)
        scores = emb_norm @ q_norm

        top_idx = np.argsort(scores)[::-1][:k]
        results = []
        for i in top_idx:
            ch = self._chunks[int(i)]
            results.append({
                "score": round(float(scores[int(i)]), 4),
                "doc_id": ch.get("doc_id", ""),
                "name": ch.get("name", ""),
                "text": ch.get("text", ""),
            })
        return results


# ─── Singleton ───────────────────────────────────────────────────────────────

_rag_index: Optional[RAGIndex] = None
_rag_lock = threading.Lock()


def get_rag_index() -> RAGIndex:
    """Singleton del índice RAG (carga el estado persistido la primera vez)."""
    global _rag_index
    if _rag_index is None:
        with _rag_lock:
            if _rag_index is None:
                _rag_index = RAGIndex()
    return _rag_index
