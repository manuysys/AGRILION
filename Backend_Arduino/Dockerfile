# =============================================================================
# AGRILION Backend — Dockerfile
# =============================================================================
# Construye el contenedor de los scripts de backend (MQTT → InfluxDB + Firebase)
#
# Este contenedor ejecuta 3 scripts en paralelo usando supervisord:
#   - TTN_MQTT.py (republish de TTN a HiveMQ)
#   - MQTT_INFLUXDB_FIREBASE.py (lecturas → InfluxDB + estado → Firebase)
#   - mqtt_to_ai_bridge.py (lecturas → AI API)
#
# Build:   docker build -t agrilion-backend .
# Run:     docker run --env-file .env agrilion-backend
# =============================================================================

FROM python:3.11-slim

# Instalar supervisord y dependencias del sistema
RUN apt-get update && apt-get install -y \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /app

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Crear directorio para credenciales Firebase
RUN mkdir -p /app/firebase

# Copiar configuración de supervisord
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Comando de inicio (supervisord maneja los 3 scripts)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
