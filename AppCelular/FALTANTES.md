> [!NOTE]
> Reporte histórico de brechas. Algunas funcionalidades de la app y de la web
> cambiaron desde su redacción. El estado vigente de la app está en
> `../docs/ANDROID_INTEGRACION.md`.

# Reporte de Features Faltantes (Comparativa Web Agrilion+ vs. App Android)

Este documento compara pantalla por pantalla la aplicación web **Agrilion+** (`paginaweb/` / `paginaweb-seven-mu.vercel.app`) con la aplicación móvil **Android** (`app/`), identificando componentes, secciones y pantallas presentes en la web pero ausentes en la app móvil.

---

## 1. Dashboard Principal

### A. Componente "Ranking de Riesgo" (`RiskRanking`)
* **Ubicación en la Web:** `paginaweb/src/components/dashboard/risk-ranking.tsx` (Página `/dashboard`)
* **Descripción:** Lista ordenada de silobolsas priorizadas por nivel de peligro (Crítico -> Alerta -> Bueno), mostrando medidores visuales de Temperatura y Humedad, días almacenados e indicador de nivel de riesgo.
* **Esfuerzo estimado:** 3 horas
* **Qué se pierde si no se agrega:** El productor no tiene una lista priorizada rápida de cuáles silos requieren atención inmediata en la pantalla de inicio.

### B. Tarjetas Resumen KPI de Sensores (`DashboardStats`)
* **Ubicación en la Web:** `paginaweb/src/components/dashboard/dashboard-stats.tsx` (Página `/dashboard`)
* **Descripción:** Tarjetas KPI superiores que muestran:
  1. Silos en estado crítico (ej. "2 silos").
  2. Alertas de CO2 alto.
  3. Humedad elevada.
  4. Temperatura promedio general.
* **Esfuerzo estimado:** 2 horas
* **Qué se pierde si no se agrega:** Métricas globales consolidadas de la planta o campo al abrir la app.

---

## 2. Historial de Telemetría y Series Temporales

### A. Selector de Rangos Temporales y Gráficos Interactivos (`HistoryClient`)
* **Ubicación en la Web:** `paginaweb/src/app/dashboard/history/page.tsx` y `components/dashboard/history-client.tsx`
* **Descripción:** Pantalla dedicada con selector de rango de tiempo (24 horas, 7 días, 30 días, 90 días) y gráficos de líneas continuos para Temperatura, CO2, Humedad y Presión con exportación de datos (CSV/PDF).
* **Esfuerzo estimado:** 5 horas
* **Qué se pierde si no se agrega:** Imposibilidad de analizar tendencias históricas de deterioro o comportamiento del grano en periodos prolongados.

---

## 3. Gestión y Configuración de Umbrales

### A. Configuración de Umbrales de Alerta (`SettingsToggles`)
* **Ubicación en la Web:** `paginaweb/src/app/dashboard/settings/page.tsx` y `components/dashboard/settings-toggles.tsx`
* **Descripción:** Tabla interactiva para ajustar los valores límite (umbrales) de Temperatura Máxima (°C), CO2 Máximo (ppm) y Humedad Máxima (%), que disparan las alertas automáticas.
* **Esfuerzo estimado:** 2.5 horas
* **Qué se pierde si no se agrega:** El usuario no puede personalizar los límites de tolerancia según el tipo de grano o condición climática local.

---

## 4. Estado de Conexión de Dispositivos e IoT

### B. Vinculación de Gateways y Nodos LoRaWAN (`DeviceSetup`)
* **Ubicación en la Web:** `paginaweb/src/components/dashboard/device-setup.tsx`
* **Descripción:** Panel de estado del Gateway LoRaWAN, fuerza de señal RSSI/SNR y estado de batería de las lanzas CubeCell.
* **Esfuerzo estimado:** 4 horas
* **Qué se pierde si no se agrega:** Monitoreo del estado de salud de la red de sensores hardware.

---

> [!NOTE]
> Conforme a la regla estricta de alcance, ninguno de estos componentes faltantes ha sido modificado o agregado en el comportamiento de la app; solo se listan aquí para tu revisión y aprobación explícita.
