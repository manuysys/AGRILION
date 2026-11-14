"""
AGRILION — Indexación de documentación en el RAG del chatbot
=============================================================

Indexa (chunk + embeddings locales + persistencia) los .md de `docs/`
más README.md, ARCHITECTURE.md, DEPLOY.md y MOBILE_INTEGRATION.md de la
raíz del repositorio en el índice RAG del chatbot (data/rag_index.npz).

Uso:
    python scripts/index_docs.py
    python scripts/index_docs.py --rebuild   # vacía el índice primero

Nota de seguridad: los .md con posibles credenciales (CREDENCIALES.md,
ROTACION_CREDENCIALES.md) se excluyen por defecto para que su contenido
nunca se filtre a través de las respuestas del chat.
"""

import sys
from pathlib import Path

IA_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = IA_ROOT.parent
sys.path.insert(0, str(IA_ROOT))

from src.chatbot.rag import RAGIndex, RAGUnavailable, INDEX_PATH, META_PATH  # noqa: E402

ROOT_DOCS = ["README.md", "ARCHITECTURE.md", "DEPLOY.md", "MOBILE_INTEGRATION.md"]

# Excluidos por seguridad: pueden contener secretos o instrucciones de rotación.
EXCLUDED = {"CREDENCIALES.md", "ROTACION_CREDENCIALES.md"}


def main() -> int:
    rebuild = "--rebuild" in sys.argv

    docs_dir = REPO_ROOT / "docs"
    files: list[Path] = []
    if docs_dir.is_dir():
        files.extend(sorted(docs_dir.glob("*.md")))
    files.extend(
        REPO_ROOT / name for name in ROOT_DOCS if (REPO_ROOT / name).is_file()
    )
    files = [f for f in files if f.name not in EXCLUDED]

    if not files:
        print("No se encontraron documentos para indexar.")
        return 1

    if rebuild and (INDEX_PATH.exists() or META_PATH.exists()):
        INDEX_PATH.unlink(missing_ok=True)
        META_PATH.unlink(missing_ok=True)
        print("[rebuild] índice previo eliminado")

    index = RAGIndex()
    print(f"Documentos a indexar: {len(files)} (chunks previos en índice: {len(index)})")

    indexed, skipped = 0, 0
    for path in files:
        rel = path.relative_to(REPO_ROOT).as_posix()
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except OSError as e:
            print(f"  [skip] {rel}: no se pudo leer ({e})")
            skipped += 1
            continue
        if not content.strip():
            print(f"  [skip] {rel}: vacío")
            skipped += 1
            continue
        try:
            info = index.add_document(name=rel, content=content)
        except RAGUnavailable as e:
            print(f"  [ERROR] {rel}: embeddings no disponibles ({e})")
            skipped += 1
            continue
        except ValueError as e:
            print(f"  [skip] {rel}: {e}")
            skipped += 1
            continue
        estado = "actualizado" if info.get("reindexed") else "sin cambios"
        print(f"  [ok] {rel}: {info['chunks']} chunks ({estado})")
        indexed += 1

    print()
    print(f"Resumen: {indexed} documento(s) indexado(s), {skipped} omitido(s)")
    print(f"Chunks totales en el índice: {len(index)}")
    print(f"Índice: {index.index_path}")
    print(f"Meta:   {index.meta_path}")
    return 0 if indexed else 1


if __name__ == "__main__":
    raise SystemExit(main())
