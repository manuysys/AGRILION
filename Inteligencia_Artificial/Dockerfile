# =============================================================================
# AGRILION AI API — Dockerfile
# =============================================================================
# Construye el contenedor del servicio de IA (FastAPI + TensorFlow + Firebase)
#
# Build:   docker build -t agrilion-ai-api .
# Run:     docker run -p 8000:8000 --env-file .env agrilion-ai-api
# =============================================================================

FROM python:3.11-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /app

# Copiar requirements primero (para aprovechar cache de Docker)
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Crear directorio para modelos si no existe
RUN mkdir -p /app/models /app/firebase

# Exponer puerto
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Comando de inicio
# Primero entrena el modelo si no existe, luego arranca la API
CMD ["sh", "-c", "python main.py || true && uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload"]
