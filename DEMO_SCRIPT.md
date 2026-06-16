# Guión Demo AGRILION — 5 minutos

## Objetivo
Mostrar el flujo completo: sensor → backend → IA → dashboard → decisión.

---

## 1. Portada / Contexto (30s)

- "Somos AGRILION, monitoreo inteligente de silobolsas con IoT e IA."
- "El problema: 5-10% de pérdida post-cosecha por falta de monitoreo."
- "La solución: sensores dentro de la bolsa, LoRaWAN, IA predictiva, dashboard en tiempo real."

---

## 2. Dashboard — Vista general (1 min)

**Abrir:** `http://localhost:3000/login` → credenciales demo → dashboard

- Señalar el **indicador de riesgo global** (0-100) — respuesta inmediata a "¿cómo estoy?"
- Tarjetas de resumen: silobolsas, alertas, sensores online, batería promedio
- "En un vistazo sé qué lotes necesitan atención."

---

## 3. Silobolsa en detalle (1 min 30s)

**Clic en** "Lote Sur A" (rojo, riesgo alto)

- Tarjeta de estado con score 32/100 + sensor readings
- **Gráficos de temperatura y humedad** (últimas 24h, tendencias)
- **Análisis IA en lenguaje humano:** "Se detecta tendencia ascendente... probabilidad estimada de deterioro: alta (>60%)"
- **Línea de tiempo de eventos:** cuándo se tomaron lecturas, cuándo la IA analizó
- "La IA no solo da números, explica en español qué está pasando."

---

## 4. Panel AGRILION AI (1 min)

**Navegar a** "Análisis IA"

- "Cada silobolsa tiene su propio análisis generado por IA."
- "No es solo un semáforo — es texto explicativo con tendencias, probabilidades y recomendaciones específicas."
- Señalar las tarjetas individuales con click para detalle.

---

## 5. Chatbot + Cierre (1 min)

**Abrir** chat widget (esquina inferior derecha)

- Preguntar: *"¿Qué silobolsa está en riesgo?"*
- "Responde en lenguaje natural basado en los datos actuales."

**Cierre:**
- "Todo este demo corre con datos simulados, pero la arquitectura está lista para datos reales."
- Roadmap: MVP → Campo → Piloto → Comercial
- "¿Preguntas?"

---

## Notas técnicas

| Componente | Puerto | Estado |
|---|---|---|
| Web (Next.js) | 3000 | ✅ Listo |
| Backend Arduino | 8000 | ⏸ Mock |
| ML API | 8001 | ⏸ Mock |
| Mock mode | `.env` | `NEXT_PUBLIC_MOCK_MODE=true` |
| DEMO badge | Header | Visible en dashboard |

## Enlaces rápidos

- Landing: `http://localhost:3000/`
- Dashboard: `http://localhost:3000/login` (click "Ver dashboard")
- Silo detail: `http://localhost:3000/dashboard/silo/SB-005`
