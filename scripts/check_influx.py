"""
AGRILION — Verificador de InfluxDB 3 Core
==========================================

Lee las credenciales de Backend_Arduino/.env, escribe un punto de prueba
y lo vuelve a leer. Sirve para confirmar que InfluxDB responde antes de
conectar la lanza.

Uso (desde la raíz del repo):
    python scripts/check_influx.py
"""

import sys
from pathlib import Path

# Consola Windows (cp1252) no soporta emojis: forzar UTF-8
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


def main() -> int:
    print("=" * 64)
    print("AGRILION — Verificación de InfluxDB 3")
    print("=" * 64)

    env = parse_env(ENV_PATH)
    host = env.get("INFLUX_HOST") or env.get("INFLUX_URL")
    token = env.get("INFLUX_TOKEN")
    database = env.get("INFLUX_DATABASE") or env.get("INFLUX_BUCKET", "silobolsas")

    if not host or not token:
        print(f"\n❌ Faltan INFLUX_HOST/INFLUX_URL o INFLUX_TOKEN en {ENV_PATH.name}")
        return 1

    print(f"\nHost:      {host}")
    print(f"Database:  {database}")

    try:
        from influxdb_client_3 import InfluxDBClient3, Point
    except ImportError:
        print("\n❌ influxdb3-python no está instalado. Ejecutá:")
        print("   pip install influxdb3-python")
        return 1

    try:
        client = InfluxDBClient3(host=host, token=token, database=database)

        point = (
            Point("_healthcheck")
            .tag("origen", "check_influx")
            .field("ok", 1)
        )
        client.write(record=point)

        table = client.query(
            'SELECT origen, ok FROM "_healthcheck" '
            "WHERE origen = 'check_influx' ORDER BY time DESC LIMIT 1"
        )
        df = table.to_pandas()
        if df.empty:
            print("\n❌ Se escribió el punto pero no se pudo leer de vuelta")
            return 1

        print("\n✅ Escritura OK")
        print("✅ Lectura OK")
        client.close()
    except Exception as e:
        print(f"\n❌ Error de conexión: {e}")
        print(
            "   Verificá que el contenedor esté corriendo:\n"
            "   docker compose up -d influxdb influxdb-ui\n"
            "   (UI: http://localhost:8888)"
        )
        return 1

    print("\n" + "=" * 64)
    print("InfluxDB listo para Agrilion ✅")
    return 0


if __name__ == "__main__":
    sys.exit(main())
