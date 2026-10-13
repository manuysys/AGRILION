"""
AGRILION — Listener de eventos de TTN (NS/JS/AS)
=================================================

Se suscribe al stream de eventos del dispositivo y resume qué eventos llegan
(joins recibidos, uplinks, etc.). Útil para diagnosticar el join.

Uso (desde la raíz del repo):
    python scripts/ttn_events.py            # 180 segundos
    python scripts/ttn_events.py --seconds 300

Requiere el CLI ttn-lw-cli en la ruta indicada abajo (o ajustar TTN_CLI).
"""

import argparse
import subprocess
import sys
import tempfile
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / "Backend_Arduino" / ".env"

TTN_CLI = Path(r"C:\Windows\TEMP\opencode\ttn-cli\lorawan-stack-cli_3.36.2_windows_amd64\ttn-lw-cli.exe")
CFG = Path(r"C:\Windows\TEMP\opencode\ttn-cli\config.yml")


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


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seconds", type=int, default=180)
    args = parser.parse_args()

    env = parse_env(ENV_PATH)
    app_id = env.get("TTN_APP_ID", "")

    if not TTN_CLI.exists():
        print(f"❌ No se encontró el CLI en {TTN_CLI}")
        return 1

    out = Path(tempfile.gettempdir()) / "agrilion_ttn_events.json"
    argv = [
        str(TTN_CLI), "-c", str(CFG), "--allow-unknown-hosts",
        "events",
        "--application-id", app_id,
        "--device-id", "smisia-cubecellab02s",
        "--identity-server-grpc-address", "eu1.cloud.thethings.network:8884",
        "--application-server-grpc-address", "nam1.cloud.thethings.network:8884",
        "--network-server-grpc-address", "nam1.cloud.thethings.network:8884",
        "--join-server-grpc-address", "nam1.cloud.thethings.network:8884",
        "--gateway-server-grpc-address", "nam1.cloud.thethings.network:8884",
        "--device-claiming-server-grpc-address", "nam1.cloud.thethings.network:8884",
        "--device-template-converter-grpc-address", "nam1.cloud.thethings.network:8884",
        "--packet-broker-agent-grpc-address", "nam1.cloud.thethings.network:8884",
        "--qr-code-generator-grpc-address", "nam1.cloud.thethings.network:8884",
    ]

    print(f"Escuchando eventos de {app_id} por {args.seconds}s...")
    with open(out, "w", encoding="utf-8") as fh:
        proc = subprocess.Popen(argv, stdout=fh, stderr=subprocess.DEVNULL)
        time.sleep(args.seconds)
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()

    names: dict[str, int] = {}
    for line in out.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if '"name"' in line:
            try:
                import json
                obj = json.loads(line.rstrip(","))
                name = obj.get("name", "?")
            except Exception:
                name = line
            names[name] = names.get(name, 0) + 1

    print("\nEventos recibidos:")
    for name, count in sorted(names.items(), key=lambda kv: -kv[1]):
        print(f"  {count:4d}  {name}")
    if not names:
        print("  (ninguno)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
