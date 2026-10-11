"""
AGRILION — Rotación de AppKey del end device en TTN
====================================================

Actualiza la AppKey (OTAA) de un end device vía la API de The Things Stack.
Requiere una API key de aplicación con el permiso "edit device keys in application".

Uso (desde la raíz del repo):
    python scripts/rotate_appkey.py --new-key A19225CDF4505F3BDF1A29D89EB935EB
    python scripts/rotate_appkey.py            # genera una AppKey nueva al azar

Toma el broker y la API key de Backend_Arduino/.env (TTN_BROKER / TTN_PASS),
o se pueden pasar con --api-key / --broker.

Al final imprime la AppKey en formato C para pegar en secrets.h.
"""

import argparse
import secrets as py_secrets
import sys
from pathlib import Path

import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / "Backend_Arduino" / ".env"


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


def to_c_array(hex_key: str) -> str:
    return ", ".join(f"0x{hex_key[i:i+2]}" for i in range(0, 32, 2))


def main() -> int:
    parser = argparse.ArgumentParser(description="Rotar AppKey de un end device en TTN")
    parser.add_argument("--new-key", help="AppKey nueva en hex (32 chars). Si falta, se genera")
    parser.add_argument("--device", default="smisia-cubecellab02s")
    parser.add_argument("--broker", help="Host TTN (default: TTN_BROKER del .env)")
    parser.add_argument("--api-key", help="API key TTN (default: TTN_PASS del .env)")
    args = parser.parse_args()

    env = parse_env(ENV_PATH)
    broker = args.broker or env.get("TTN_BROKER", "")
    api_key = args.api_key or env.get("TTN_PASS", "")
    app_id = env.get("TTN_APP_ID", "")

    if not broker or not api_key or not app_id:
        print("❌ Faltan TTN_BROKER / TTN_PASS / TTN_APP_ID (revisar Backend_Arduino/.env)")
        return 1

    new_key = (args.new_key or py_secrets.token_hex(16)).upper().replace(" ", "")
    if len(new_key) != 32:
        print(f"❌ La AppKey debe tener 32 caracteres hex (recibidos {len(new_key)})")
        return 1

    base = f"https://{broker}/api/v3"
    auth = {"Authorization": f"Bearer {api_key}"}
    dev_url = f"{base}/applications/{app_id}/devices/{args.device}"

    print(f"Broker:  {broker}")
    print(f"App:     {app_id}")
    print(f"Device:  {args.device}")
    print(f"AppKey nueva: {new_key}")
    print()

    # 1. Ver el device (confirma permisos de lectura)
    r = requests.get(dev_url, headers=auth, timeout=20)
    print(f"[GET device] HTTP {r.status_code}")
    if r.status_code != 200:
        try:
            print(f"  {r.json().get('message', r.text[:200])}")
        except Exception:
            print(f"  {r.text[:200]}")
        print("\n👉 La API key necesita el permiso 'view devices in application'")
        return 1

    dev = r.json()
    current_keys = dev.get("root_keys", {}).get("app_key")
    print(f"  AppKey actual (según API): {'presente' if current_keys else 'sin root_keys'}")
    print(f"  Sesión: {'activa' if dev.get('session') else 'sin sesión'}")

    # 2. Actualizar solo la AppKey
    body = {
        "end_device": {
            "ids": {
                "application_ids": {"application_id": app_id},
                "device_id": args.device,
            },
            "root_keys": {
                "app_key": {"key": new_key},
            },
        },
        "field_mask": {"paths": ["root_keys.app_key.key"]},
    }
    r2 = requests.put(dev_url, headers=auth, json=body, timeout=20)
    print(f"\n[PUT device root_keys.app_key.key] HTTP {r2.status_code}")
    if r2.status_code not in (200, 201):
        try:
            print(f"  {r2.json().get('message', r2.text[:200])}")
        except Exception:
            print(f"  {r2.text[:200]}")
        print("\n👉 La API key necesita el permiso 'edit device keys in application'")
        return 1

    print("✅ AppKey rotada en TTN")
    print()
    print("Para secrets.h:")
    print(f"uint8_t appKey[] = {{ {to_c_array(new_key)} }};")
    print()
    print("IMPORTANTE: reflashear el dispositivo para que se una con la AppKey nueva.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
