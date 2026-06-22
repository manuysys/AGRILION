# Agrilion+ — Propuesta de Rediseño Completo

> Producto: monitoreo IoT de silobolsas (temperatura / humedad / CO₂) sobre LoRa.
> Foco: **decisión rápida en campo, mobile-first, claridad ante dato crítico**.

---

## 1. Sistema de diseño

### 1.1 Principios

1. **Decisión en 5 segundos** — el estado del sistema completo se lee sin scroll.
2. **Color = semántica, no decoración** — verde/amarillo/rojo SOLO para estado de salud.
3. **Jerarquía extrema** — la única métrica crítica (alerta crítica) ocupa el 40% del viewport.
4. **Mobile-first real** — todo lo que se ve en desktop cabe en mobile con reordenamiento, no con overflow horizontal.
5. **Interpretar antes que mostrar** — la UI dice "riesgo de fermentación", no "humedad 18%".

### 1.2 Paleta de color (semántica)

| Token            | Valor     | Uso                                        |
| ---------------- | --------- | ------------------------------------------ |
| `state.ok`       | `#16a34a` | Silo estable, sin alertas                  |
| `state.warn`     | `#f59e0b` | Atención, monitoreo reforzado              |
| `state.critical` | `#dc2626` | Riesgo alto, intervención requerida        |
| `state.offline`  | `#6b7280` | Sensor sin datos / batería agotada         |
| `brand.primary`  | `#0B4D2C` | CTAs, identidad, navegación                |
| `brand.accent`   | `#2563eb` | Estados neutros del sistema, links         |
| `surface.0`      | `#ffffff` | Fondo app                                  |
| `surface.1`      | `#f5f7f6` | Fondo secciones, sidebar                   |
| `surface.dark`   | `#0a1a10` | Hero, login, secciones de impacto          |
| `border`         | `#e5e7eb` | Bordes suaves                              |
| `text.primary`   | `#111827` | Texto principal                            |
| `text.muted`     | `#6b7280` | Texto secundario, timestamps               |

**Regla dura:** ningún componente fuera del sistema de alertas usa rojo/amarillo/verde.

### 1.3 Tipografía

- **Sans:** `Inter` (UI general, números).
- **Mono:** `Geist Mono` (timestamps, IDs de silo, lecturas de sensor).
- Escala: `text-xs / sm / base / lg / xl / 2xl / 3xl / 4xl / 5xl`.
- Los números críticos (temperatura, humedad, score de riesgo) se renderizan a `font-mono` con `tabular-nums` para evitar saltos al actualizar.

### 1.4 Componentes base (design system)

| Componente           | Variantes                                         | Notas                                                  |
| -------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| `StatusPill`         | `ok` / `warn` / `critical` / `offline`            | Único lugar donde se usan los 4 colores semánticos     |
| `MetricCard`         | icono + label + valor grande + delta + sparkline  | Para temp/humedad/CO₂                                  |
| `SiloCard`           | estado + métricas + última lectura + tap target   | Mínimo 96px de alto, tap target ≥ 44px²                |
| `AlertCard`          | severidad + silo + explicación humana + acciones  | La explicación es 1 línea, no un párrafo              |
| `RiskGauge`          | semicircular 0–100 con bandas semánticas          | Para score de riesgo IA                                |
| `TimelineChart`      | línea con bandas de umbral y eventos marcados     | Recharts con `ReferenceLine` por umbral                |
| `AnomalyBadge`       | texto corto ("Fermentación", "Condensación")      | Sin jerga ("Z-score > 2")                              |
| `EmptyState`         | ilustración + acción                              | Sensor offline, sin alertas                            |
| `BottomSheet`        | swipe-down dismiss                                | Solo mobile, usado para detalle de silo                |
| `CommandBar`         | búsqueda global por silo / alerta / comando       | Cmd+K desktop, FAB mobile                              |

### 1.5 Estados UI obligatorios

Todo componente interactivo debe tener: `default` · `hover` · `active` · `disabled` · `loading` · `error`. Sin loading skeletons: usar el último dato conocido + indicador "actualizando…".

---

## 2. Arquitectura de pantallas

### 2.1 Inventario de rutas

| Ruta                              | Pantalla              | Propósito                                     |
| --------------------------------- | --------------------- | --------------------------------------------- |
| `/`                               | Landing               | Marketing, captura                            |
| `/login`                          | Login demo            | Acceso simulado (1 click)                     |
| `/dashboard`                      | **Vista general**     | Estado de toda la operación en una pantalla   |
| `/dashboard/silo/[id]`            | **Detalle de silobolsa** | Drill-down de un silo                     |
| `/dashboard/alerts`               | **Bandeja de alertas** | Cola priorizada por severidad              |
| `/dashboard/history`              | Histórico             | Series temporales largas, comparativas        |
| `/dashboard/map`                  | Mapa de campo         | Localización física de silobolsas             |
| `/dashboard/ia`                   | Centro de IA          | Análisis completo, recomendaciones           |
| `/dashboard/settings`             | Configuración         | Umbrales, notificaciones, equipos             |

### 2.2 Jerarquía de información (en `/dashboard`)

```
┌────────────────────────────────────────────────────────────┐
│  HEADER  · sistema OK · búsqueda · usuario                  │ 56px
├────────────────────────────────────────────────────────────┤
│  HERO STATUS (40% viewport)                                 │
│  ─────────────────────────                                   │
│  1 silobolsa en estado CRÍTICO                              │
│  SB-005 "Lote Sur A" · Humedad 18.2% · Temp 31.4°C          │
│  [Ir a la alerta →]                                         │
│                                                             │
│  + 3 alertas activas · 11/12 sensores online · 78% batería  │
├────────────────────────────────────────────────────────────┤
│  RANKING DE RIESGO (lista vertical, 1 card por silo)        │
│  ─────────────────────────────                              │
│  1. 🔴 SB-005  Crítico     · 18.2% / 31.4°C                │
│  2. 🟡 SB-003  Atención    · 15.8% / 27.2°C                │
│  3. 🟡 SB-010  Atención    · 17.0% / 28.1°C                │
│  4. 🟢 SB-001  Estable     · 12.3% / 24.5°C                │
│  …                                                          │
├────────────────────────────────────────────────────────────┤
│  BOTTOM NAV (solo mobile) · Resumen / Silobolsas / Alertas / IA │
└────────────────────────────────────────────────────────────┘
```

### 2.3 Vista de silobolsa (`/dashboard/silo/[id]`)

```
┌────────────────────────────────────────────┐
│ ← Volver     SB-005 "Lote Sur A"     ⋮      │
├────────────────────────────────────────────┤
│ RiskGauge 87/100  · Crítico                │
│ Explicación IA: "Posible fermentación..."  │
│ Recomendación: "Inspección presencial YA"  │
├────────────────────────────────────────────┤
│ Temperatura      Humedad        CO₂         │
│ 31.4°C ↑↑        18.2% ↑↑       820 ppm ↑   │
│ sparkline        sparkline      sparkline   │
├────────────────────────────────────────────┤
│ TimelineChart (24h, 3 series, eventos ▲)   │
│ Bandas de umbral: verde / amarillo / rojo   │
├────────────────────────────────────────────┤
│ Historial de alertas (3 items)              │
│ Estado sensor: ✓ online · batería 34% ⚠    │
└────────────────────────────────────────────┘
```

### 2.4 Bandeja de alertas

- **Agrupadas por severidad**, no por fecha.
- Cada alerta: silo afectado + explicación de 1 línea + acción sugerida + botones `Marcar vista` / `Ir al silo`.
- Filtros rápidos: `Críticas` / `Atención` / `Info` / `Resueltas`.
- Búsqueda libre por silo o tipo de alerta.

---

## 3. Mobile UX (reglas duras)

- **Tap targets ≥ 44×44 px.**
- **Bottom navigation 4 ítems** + FAB de acción rápida (buscar/crear alerta).
- **Sin tablas** — todo se renderiza como cards apiladas.
- **Sin hover** — todo lo que dependa de hover debe tener equivalente en tap largo o estado expanded.
- **Pull-to-refresh** explícito, sin auto-refresh en mobile (ahorra batería y datos).
- **Gráficos simplificados:** en `<640px` mostrar solo la serie más relevante + valor final + delta. El detalle va al drill-down.
- **Conectividad débil:** la última lectura conocida se muestra siempre; el timestamp distingue "hace 2 min" vs "hace 6 h" con código de color (gris → rojo).

---

## 4. Data visualization (criterios)

- **Un gráfico = una pregunta.** Nunca tres métricas superpuestas sin contexto.
- **Umbrales visuales siempre visibles** (`ReferenceLine` en Recharts) con etiqueta de valor.
- **Eventos marcados** con triángulos sobre la línea temporal; tap revela el evento.
- **Anomalías con fondo sutil** (banda translúcida) en el período afectado.
- **No usar donut charts para >5 categorías.** Riesgo por silo → barra horizontal ordenada.
- **Loading = último valor + animación "actualizando…"**, no spinner a pantalla completa.
- **Empty states ilustrados** cuando no hay datos ("Aún no se recibieron lecturas del sensor SB-011").

---

## 5. Componentes frontend (Propuesta React)

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx                    # Vista general
│   │   ├── silo/[id]/page.tsx
│   │   ├── alerts/page.tsx
│   │   ├── history/page.tsx
│   │   ├── map/page.tsx
│   │   ├── ia/page.tsx
│   │   └── settings/page.tsx
│   └── (vistas auxiliares)
├── components/
│   ├── ui/                             # Primitivas (shadcn-style)
│   │   ├── status-pill.tsx
│   │   ├── metric-card.tsx
│   │   ├── risk-gauge.tsx
│   │   ├── alert-card.tsx
│   │   ├── timeline-chart.tsx
│   │   ├── bottom-sheet.tsx
│   │   └── command-bar.tsx
│   ├── dashboard/                      # Compuestos del dominio
│   │   ├── DashboardHero.tsx           # Estado crítico arriba
│   │   ├── RiskRanking.tsx             # Lista priorizada
│   │   ├── SiloCard.tsx
│   │   ├── SiloDetailHeader.tsx
│   │   ├── AnomalyBadge.tsx
│   │   ├── AlertQueue.tsx
│   │   └── AIInterpretationPanel.tsx
│   └── layout/                         # AppShell, BottomNav, etc.
├── lib/
│   ├── data-service.ts
│   ├── interpretation.ts               # "humedad 18% + temp 31°C" → "fermentación"
│   ├── thresholds.ts                   # Constantes de umbrales
│   └── formatters.ts                   # "hace 2 min", "18.2 %"
└── types/
    └── index.ts                        # SiloBag, Alert, Reading, RiskScore
```

---

## 6. User flows

### 6.1 Detección de una alerta crítica (caso feliz)

```
Productor abre la app
   ↓ (3 seg)
Ve en HERO STATUS: "SB-005 crítico · Humedad 18.2%"
   ↓ (1 tap, 1 seg)
Tap → push a /dashboard/silo/SB-005
   ↓ (5 seg)
Lee explicación IA: "Posible fermentación"
Ve recomendación: "Inspección presencial YA"
   ↓ (1 tap)
Tap "Llamar a técnico" / "Marcar en curso"
```

Tiempo total: **<15 segundos** desde "abrí la app" hasta "acción tomada".

### 6.2 Revisión matutina de campo

```
Productor abre la app
   ↓
Ve ranking de 12 silos ordenado por riesgo
   ↓
Scroll rápido: los 3 amarillos/rojos saltan a la vista
   ↓
Tap en SB-003 (amarillo) → confirma tendencia, no requiere acción
   ↓
Vuelve → tap SB-005 (rojo) → llama al técnico
   ↓
Chat con IA: "¿qué silos tienen batería baja?"
   ↓
Recibe: "SB-005 (34%) y SB-010 (45%)"
```

### 6.3 Silo con sensor offline

```
Usuario ve SB-011 con pill `offline` (gris)
   ↓
Tap → pantalla detalle muestra:
   "Última lectura hace 14 h. Posible batería agotada o pérdida de señal."
   ↓
CTA: "Marcar para revisión" + "Ver en mapa"
```

---

## 7. Capa de IA / interpretación (cómo convertir datos en decisiones)

### 7.1 Principio

> La UI **nunca** muestra un valor crudo sin una interpretación al lado.

### 7.2 Ejemplos de mapeo dato → explicación

| Lecturas                                  | Etiqueta mostrada      | Acción sugerida                  |
| ----------------------------------------- | ---------------------- | -------------------------------- |
| Humedad > 17% y Temp > 28°C               | **Fermentación probable** | Inspección presencial           |
| Humedad > 16% con Temp estable            | **Condensación**       | Monitoreo reforzado              |
| CO₂ > 800 ppm + Temp ↑                    | **Actividad biológica**| Preparar aireación               |
| Batería < 20%                             | **Batería crítica**    | Reemplazo de sensor              |
| Sin datos > 6h                            | **Sensor sin señal**   | Revisar in situ                  |
| ΔTemp > 3°C en 6h                         | **Pico térmico**       | Inspección zona del sensor       |
| 3+ alertas warning en 24h                 | **Tendencia adversa**  | Plan de contingencia             |

### 7.3 Chat IA

- Comandos naturales: "¿qué silos están en riesgo?", "resumen de la última semana", "explicá la alerta de SB-005".
- Respuestas en español, máximo 3 oraciones, siempre con CTA: `[Ver silo]`.
- Si no entiende: muestra 3 sugerencias de comandos.

### 7.4 Score de riesgo (0–100)

- Calculado en backend (ya existe en `Inteligencia_Artificial/src/risk_engine.py`).
- Render: `RiskGauge` con bandas `0–30` verde · `30–35` amarillo · `>35` rojo.
- Bandas vienen de la convención ya documentada en `Inteligencia_Artificial/README.md` (≤30 normal, 30–35 warning, >35 danger).
- **Nunca mostrar el score sin la etiqueta de banda al lado.**

---

## 8. Mejoras inteligentes (AI UX) adicionales

1. **Predicción de riesgo a 24h** — banda de incertidumbre en el `TimelineChart` (mock hoy, real cuando el LSTM esté en producción).
2. **Comparación con silos vecinos** — "SB-005 está 2°C por encima de la media de la zona".
3. **Detección de silencio** — alerta proactiva si un sensor deja de reportar (no solo esperar a que el dato falte).
4. **Resumen diario push** — "Hoy: 1 silo crítico, 2 en atención, todos los demás estables."
5. **Modo campo** — alto contraste, tipografía 1.2×, sin animaciones (toggle en settings).
6. **Modo offline-first** — cache de últimas 24h en `IndexedDB`, lectura instantánea sin red.
7. **Reconocimiento por voz** (futuro) — "¿cómo está el lote sur?" devuelve respuesta hablada.

---

## 9. Métricas de éxito del rediseño

| Métrica                                     | Baseline actual | Meta              |
| ------------------------------------------- | --------------- | ----------------- |
| Tiempo medio desde abrir app → primera decisión | ~25 s       | **<5 s**          |
| % de alertas críticas accionadas < 15 min   | desconocido     | **>90%**          |
| Errores de interpretación de estado         | frecuentes      | **<5%**           |
| Uso en mobile (sesiones iniciadas)          | bajo            | **>60%**          |
| NPS productor                               | n/a             | **>50**           |

---

## 10. Roadmap de implementación

**Fase 1 — fundaciones (1 sprint)**
- Design tokens centralizados (`tailwind.config.ts` extensions).
- `StatusPill`, `MetricCard`, `SiloCard`, `AlertCard` primitivos.
- Reemplazar colores hardcodeados en componentes existentes.

**Fase 2 — dashboard rediseñado (1 sprint)**
- `DashboardHero` con alerta crítica destacada.
- `RiskRanking` ordenado por score.
- `SiloDetailHeader` con `RiskGauge` + interpretación IA.
- `TimelineChart` con `ReferenceLine` de umbrales y eventos.

**Fase 3 — mobile-first (1 sprint)**
- `BottomNav`, `BottomSheet`, pull-to-refresh.
- Gráficos simplificados en breakpoints `<sm`.
- PWA manifest + service worker (offline cache).

**Fase 4 — capa IA UX (1 sprint)**
- `lib/interpretation.ts` con todas las reglas de mapeo.
- `AIInterpretationPanel` en detalle de silo.
- Chat widget con comandos sugeridos.

**Fase 5 — pulido (continuo)**
- Modo campo, accesibilidad (WCAG AA), animaciones solo cuando aportan.

---

## 11. Decisiones de product designer (registro)

- **Bottom nav > sidebar en mobile:** la operación principal es "ver silos", no "configurar". La nav refleja esa jerarquía.
- **Hero status en dashboard > lista de silos:** la pregunta más frecuente del productor es "¿hay algo roto?", no "¿cómo está el silo 7?". Lo urgente gana el prime real estate.
- **Una sola vista para alertas, no popups:** las alertas son el producto, no una notificación. merecen una ruta propia.
- **No mostrar lecturas "raw" sin interpretación:** rompe el principio de "decisión en 5 s". Si el productor tiene que pensar, perdimos.
- **Sin dark mode por ahora:** el uso primario es diurno en campo. Si se justifica, se agrega en fase 5.

---

## 12. Accesibilidad

- Contraste mínimo AA en todos los textos (4.5:1).
- Estados no comunicados solo por color: siempre un icono + texto junto al pill de estado.
- `aria-live="polite"` en actualizaciones de métricas.
- Navegación completa por teclado en desktop.
- Soporte de `prefers-reduced-motion` (ya implementado en `globals.css`).
- Tamaño mínimo de texto: 14px en mobile, 16px en desktop.

---

## 13. Cómo se integra con lo existente

- **Mock mode** sigue funcionando: el rediseño consume la misma capa `data-service.ts` que ya existe. Los nuevos componentes se renderizan con los mismos `mockSilobags` / `mockAlerts`.
- **Backend Arduino** sin cambios: `Inteligencia_Artificial/src/risk_engine.py` ya calcula el score; la nueva UI lo consume desde `data-service.ts` como hoy.
- **Tipos** se extienden en `src/types/index.ts` sin romper los actuales (solo se agregan campos opcionales).
- **Componentes UI nuevos** viven en `src/components/ui/` siguiendo la convención shadcn, sin tocar los `src/components/dashboard/*` existentes hasta la fase de migración.
