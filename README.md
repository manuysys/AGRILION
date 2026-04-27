🌾 Agrilion
Sistema inteligente de monitoreo para silobolsas

Agrilion es un sistema IoT diseñado para monitorear en tiempo real el estado de granos almacenados en silobolsas, permitiendo detectar condiciones de riesgo antes de que ocurran pérdidas económicas.

Combina sensores internos, comunicación LoRa de bajo consumo y análisis de datos para ofrecer alertas tempranas y decisiones inteligentes.

🚀 Características principales
📡 Comunicación LoRa de largo alcance y bajo consumo
🔋 Batería de larga duración (hasta toda la campaña: 6–12 meses)
🌡️ Monitoreo ambiental interno:
Temperatura
Humedad
Gases (ej. CO₂)
⏱️ Envío de datos optimizado (cada 1–2 horas)
🌐 Visualización web (Firebase + Flutter)
🤖 Preparado para análisis inteligente con IA
⚠️ Sistema de alertas tempranas ante riesgos
🧠 Problema que resuelve

Las silobolsas son altamente sensibles a variaciones internas de:

Humedad
Temperatura
Actividad biológica

Sin monitoreo constante, estas condiciones pueden generar:

Deterioro del grano
Pérdidas económicas significativas

Agrilion permite detectar estos problemas antes de que sean visibles externamente.

🏗️ Arquitectura del sistema
[Sensores dentro de la silobolsa]
        ↓
[Dispositivo IoT - CubeCell]
        ↓ (LoRa)
[Gateway / Red]
        ↓
[Backend / Firebase]
        ↓
[Dashboard Web]
⚙️ Tecnologías utilizadas
Hardware
CubeCell (LoRa)
Sensores ambientales (temperatura, humedad, gases)
Comunicación
LoRa / TTN (The Things Network)
MQTT
Backend
Firebase
Frontend
Flutter Web
Procesamiento de datos
Python (análisis y lógica de alertas)
🔋 Optimización energética

El sistema está diseñado para maximizar la autonomía:

Envío de datos cada 1–2 horas
Uso de modos de bajo consumo (deep sleep)
Minimización de transmisiones innecesarias
⚠️ Sistema de alertas (en desarrollo)

Agrilion incorpora lógica para detectar condiciones de riesgo:

Ejemplos:

Aumento rápido de humedad → posible filtración
Temperatura interna elevada → actividad microbiana
Incremento de CO₂ → deterioro del grano

Estados:

🟢 Normal
🟡 Advertencia
🔴 Riesgo
📊 Estado del proyecto
✅ Comunicación LoRa funcional
✅ Integración con backend
✅ Visualización básica
🔄 Sistema de alertas en desarrollo
🔄 Integración de IA en progreso
🎯 Objetivo

Desarrollar una solución escalable que permita:

Reducir pérdidas en almacenamiento agrícola
Mejorar la toma de decisiones
Digitalizar el monitoreo de silobolsas
📌 Roadmap
 Implementar sistema de alertas completo
 Integrar modelos de IA (detección de anomalías)
 Mejorar dashboard (UX/UI)
 Optimizar consumo energético
 Validación en campo
🤝 Contribuciones

Actualmente el proyecto está en desarrollo activo.
Si querés contribuir o tenés ideas, podés abrir un issue o pull request.

📄 Licencia

Este proyecto se encuentra bajo licencia MIT (o la que elijas).

👨‍💻 Autor

Juan Manuel Iglesias
Proyecto Agrilion — 2026
