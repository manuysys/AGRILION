"""
AGRILION — Verificador de variables de entorno
==============================================

Comprueba que los archivos .env / .env.local tengan los valores requeridos
y marca los que siguen en placeholder ("COMPLETAR").

Uso (desde cualquier carpeta):
    python scripts/check_env.py
"""

import sys
from pathlib import Path

# Consola Windows (cp1252) no soporta emojis: forzar UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent

TARGETS = {
    "Backend_Arduino/.env": {
        "label": "Backend IoT",
        "required": [
            "TTN_BROKER",
            "TTN_PORT",
            "TTN_USER",
            "TTN_PASS",
            "TTN_APP_ID",
            "HIVEMQ_BROKER",
            "HIVEMQ_PORT",
            "HIVEMQ_USER",
            "HIVEMQ_PASS",
            "INFLUX_URL",
            "INFLUX_TOKEN",
            "INFLUX_DATABASE",
            "AI_API_URL",
        ],
    },
    "Inteligencia_Artificial/.env": {
        "label": "AI API",
        "required": [
            "INFLUX_URL",
            "INFLUX_TOKEN",
            "INFLUX_DATABASE",
        ],
    },
    "paginaweb/.env.local": {
        "label": "Frontend",
        "required": [
            "NEXT_PUBLIC_MOCK_MODE",
            "AI_API_URL",
        ],
    },
}

PLACEHOLDER_MARKERS = ("COMPLETAR", "tu_", "tu-", "gsk_tu", "sk-or-v1-tu")


def parse_env(path: Path) -> dict:
    values = {}
    if not path.exists():
        return values
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip()
    return values


def is_placeholder(value: str) -> bool:
    if not value:
        return True
    return any(marker in value for marker in PLACEHOLDER_MARKERS)


def main() -> int:
    print("=" * 64)
    print("AGRILION — Verificación de entorno")
    print("=" * 64)

    has_errors = False

    for rel_path, spec in TARGETS.items():
        path = ROOT / rel_path
        values = parse_env(path)

        print(f"\n[{spec['label']}] {rel_path}")
        if not path.exists():
            print("  ❌ No existe el archivo (copiar el .env.example)")
            has_errors = True
            continue

        missing = []
        for key in spec["required"]:
            value = values.get(key)
            if value is None:
                missing.append(key)
                print(f"  ❌ {key}: falta")
            elif is_placeholder(value):
                missing.append(key)
                print(f"  ⚠️  {key}: sigue en placeholder")
            else:
                print(f"  ✅ {key}")

        if missing:
            has_errors = True

    print("\n" + "=" * 64)
    if has_errors:
        print("Resultado: hay valores pendientes (ver arriba).")
        return 1
    print("Resultado: TODO OK ✅")
    return 0


if __name__ == "__main__":
    sys.exit(main())
