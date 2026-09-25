# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Agrilion** is an IoT system for real-time monitoring of grain stored in silobolsas (agricultural silo bags). It detects deterioration risk (humidity, temperature, CO₂) before economic loss occurs. The repo holds multiple independent subsystems that together form the demo described in `DEMO_SCRIPT.md`:

- Hardware sensors (BME280) → LoRa → TTN MQTT → Arduino/Python backend
- Python ML pipeline (LSTM forecasting, anomaly detection, risk engine) exposed as FastAPI
- Next.js web app (landing page + dashboard) with mock-data mode

The root is **not** a single project — each subsystem has its own toolchain. Run them from their own directories.

## Repository layout

```
paginaweb/                  Next.js 16 app (landing + dashboard)
Backend_Arduino/            Python MQTT→InfluxDB→Firebase bridge + Arduino sketches
Inteligencia_Artificial/    Python ML pipeline + FastAPI service
AppCelular/                 Android app (Kotlin)
Modelo3D_PCB*/              Fusion 360 PCB / 3D model assets
PCB_*.pdf, ESTACA*.f3d      Hardware design files
```

## Common commands

### paginaweb/ (Next.js dashboard, port 3000)

```bash
cd paginaweb
npm install
npm run dev          # dev server on http://localhost:3000
npm run build        # production build
npm run start        # run production build
npm run lint         # eslint
```

Landing at `/`, demo login at `/login`, dashboard at `/dashboard`, silo detail at `/dashboard/silo/[id]`. Tailwind v4 + Framer Motion + GSAP + react-three-fiber (3D decor). Charts via Recharts.

### Inteligencia_Artificial/ (ML pipeline + API)

```bash
cd Inteligencia_Artificial
pip install -r requirements.txt

# End-to-end pipeline (data → train → predict → analyze → plots)
python main.py                              # uses synthetic data if none
python main.py --data path/to/sensors.csv
python main.py --skip-training --no-plots
python main.py --epochs 100 --batch-size 64

# FastAPI on http://localhost:8001 (note: 8001, not 8000)
uvicorn api.app:app --reload --port 8001
# Docs at /docs
```

Tests:

```bash
python -m pytest tests/ -v
python -m pytest tests/test_pipeline.py::TestRiskEngine -v
```

Endpoints (all under `/api/v1`): `GET /health`, `GET /model/status`, `POST /predict`, `POST /analyze`, `POST /ingest`, `POST /chat`. Input CSV must include `timestamp, temperature, humidity, co2, silo_id`.

### Backend_Arduino/ (telemetry bridge, port 8000)

```bash
cd Backend_Arduino
pip install -r requirements.txt
python main.py
```

`main.py` runs the TTN→InfluxDB→Firebase bridge. `MQTT_INFLUXDB_FIREBASE.py` and `TTN_MQTT.py` are the long-running MQTT consumers. InfluxDB tokens live in local untracked files (`Backend_Arduino/APIToken_InfluxDB.txt`, `INFLUXDB_TOKEN.txt`) — never commit them. `TTN_Payload_Formatter.js` is the The Things Network decoder.

## Architecture (big picture)

**Data flow:** Sensor → CubeCell/LoRa → TTN MQTT → `Backend_Arduino/` (Python) → InfluxDB + Firebase → `Inteligencia_Artificial/` (LSTM + risk engine) → `paginaweb/` dashboard.

**Front-end data layer** (`paginaweb/src/lib/`):
- `ai-api.ts` — typed client for the Python AI API (via Next.js rewrites).
- `data-service.ts` — domain functions (`fetchDashboardStats`, `fetchSilobags`, `fetchSiloDetail`, `fetchAlerts`) consumed by pages. `NEXT_PUBLIC_MOCK_MODE=false` calls the API, then falls back to mock on any failure.
- `mock-data.ts` — static demo dataset used as fallback.

**ML pipeline** (`Inteligencia_Artificial/src/`): `data_loader` → `preprocessing` (24-step window) → `lstm_model` (2-layer LSTM, 3-feature output) → `predictor`. `anomaly_detection.py` runs Z-Score + Moving Average + Isolation Forest and requires ≥2/3 consensus. `risk_engine.py` scores 0–100 with weights humidity+temp 30%, CO₂ 25%, anomalies 20%, LSTM deviation 25%. `alerts.py` produces Spanish-language messages.

**API routing** in `paginaweb`: Next.js rewrites in `next.config.ts` map `/api/backend/*` → `BACKEND_URL` (default `http://localhost:8000`) and `/api/ml/*` → `ML_URL/api/v1/*` (default `http://localhost:8001`). The ML path uses the `/api/v1` prefix on the FastAPI side; the backend Arduino service does not. `.env.local` ships with `NEXT_PUBLIC_MOCK_MODE=true` so the dashboard works without any backend running.

**Demo mode** is the default state of this repo: with `NEXT_PUBLIC_MOCK_MODE=true`, the Next.js app uses `mock-data.ts` and the Arduino/ML services are not required. The "DEMO" badge in the dashboard header signals this state.

## Conventions

- Language: project docs and UI copy are in **Spanish**; code identifiers in English. AI-generated alert/analysis strings in `mock-data.ts` and `Inteligencia_Artificial/src/alerts.py` are in Spanish.
- Status semantics are consistent across layers: `normal` (≤30) / `warning` (30–35) / `danger` (>35) for both temperature thresholds and risk score buckets. See `Inteligencia_Artificial/README.md` and `paginaweb/src/lib/data-service.ts`.
- All three subsystems have their own `requirements.txt` / `package.json`; install per-directory.
- Demo / production toggle lives in `paginaweb/.env.local` (`NEXT_PUBLIC_MOCK_MODE`).

## Useful entry points

- Web dashboard home: `paginaweb/src/app/dashboard/page.tsx`
- Per-silo view: `paginaweb/src/app/dashboard/silo/[id]/page.tsx`
- AI analysis panel: `paginaweb/src/components/dashboard/ia-client.tsx`
- Risk rules: `Inteligencia_Artificial/src/risk_engine.py`
- Alert text: `Inteligencia_Artificial/src/alerts.py` and `Inteligencia_Artificial/src/chatbot/`
- ML API routes: `Inteligencia_Artificial/api/routes.py`
- Telemetry bridge entry: `Backend_Arduino/main.py`
