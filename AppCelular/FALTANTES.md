# Reporte de Features Faltantes y Tareas Pendientes (Agrilion+ Android vs Web)

Este documento detalla la comparativa pantalla por pantalla entre la aplicación web **Agrilion+** (`paginaweb/`) y la aplicación móvil **Android** (`app/`), especificando tanto features funcionales pendientes como modernizaciones arquitectónicas programadas para corridas futuras.

---

## -1. Endpoints de Autenticación y Credenciales OAuth Pendientes en Backend

### A. Endpoints REST de Autenticación Real en Servidor
* **Rutas requeridas:**
  1. `POST /api/v1/auth/login` (body: `email`, `password`) -> devuelve `token` JWT y datos del usuario (`nombre`, `email`, `empresa`).
  2. `POST /api/v1/auth/register` (body: `firstName`, `lastName`, `email`, `password`, `phone`) -> crea la cuenta en la base de datos real.
  3. `POST /api/v1/auth/forgot-password` (body: `email`) -> envía el correo electrónico real de restablecimiento de contraseña.
  4. `POST /api/v1/auth/google` (body: `idToken`) -> realiza el intercambio del token de Google con la sesión del backend.
* **Estado actual:** La app realiza las llamadas mediante Retrofit (`ApiConfig`). Cuando el servidor responda a estos endpoints, la autenticación remota se completará sin tocar el código Android.
* **Callbacks reservados:** `onLoginSuccess` y `onRegisterSuccess` en `LoginRegisterScreen.kt` están listos para invocarse tras la respuesta exitosa del servidor.

### B. Configuración de Credenciales Google Sign-In / Firebase
* **Archivos y claves requeridos:**
  1. Archivo `google-services.json` configurado dentro de `app/`.
  2. Fingerprint SHA-1 del certificado de firma Android vinculado en Firebase / Google Cloud Console.
  3. Web Client ID de OAuth 2.0.
* **Estado actual:** El botón de *"Iniciar sesión con Google"* incluye la interfaz nativa e informa honestamente el estado del servidor cuando falta la configuración del proyecto.

---

## 0. Piezas Arquitectónicas Definidas sin Conectar (Sistemas de Reserva)

Las siguientes estructuras de datos e interfaces están definidas en el código Kotlin como arquitectura reservada para la sincronización con el servidor remoto:

1. **`SilosApiService.kt`**:
   - `getOverview()`
   - `getHistory()`
   - `getPrediction()`
   - `getCotizaciones()`
   - `create()`
2. **Modelos del Dominio**:
   - `DistribucionGranoBaseDeDatos`
   - `NotificacionBaseDeDatos`
   - `TipoNotificacion.CRITICA_IA`
   - `ChatManagerBaseDeDatos.getAIResponse`

---

## 1. Modernización de Dependencias para Corrida Dedicada

La versión actual utiliza la cadena de herramientas estable verificada. La actualización en masa de las siguientes dependencias está reservada para una corrida exclusiva con pruebas de regresión completas:

* **Android Gradle Plugin (AGP):** `8.7.3` $\rightarrow$ `9.2.1`
* **Gradle Wrapper:** `9.4.1` $\rightarrow$ `9.9.1`
* **Kotlin Compiler:** `2.1.0` $\rightarrow$ `2.4.21`
* **Compose BOM:** `2025.01.01` $\rightarrow$ `2026.09.00`
* **Compile SDK / Target SDK:** `35` $\rightarrow` `37`
* **Retrofit:** `2.9.0` $\rightarrow` `3.0.0` (incluye migración de breaking changes)
* **Coroutines Android:** `1.7.3` $\rightarrow$ `1.11.0`
* **Navigation Compose:** `2.8.5` $\rightarrow$ `2.10.2`
* **Lifecycle Compose:** `2.8.7` $\rightarrow$ `2.11.0`
* **Core-KTX:** `1.15.0` $\rightarrow$ `1.19.1`
* **Activity Compose:** `1.9.3` $\rightarrow$ `1.13.0`
* **Espresso Core:** `3.6.1` $\rightarrow$ `3.7.0`

---

## 2. Internacionalización y Accesibilidad (i18n & a11y)

1. **Extracción de Strings a `strings.xml`**:
   - La aplicación maneja actualmente traducción dinámica en memoria via `AppStateBaseDeDatos.t()`. La migración a recursos Android `strings.xml` con calificadores `values-en/` y `values-pt/` se realizará en una corrida dedicada.
2. **Descripciones de Accesibilidad (`contentDescription`)**:
   - Incorporación masiva de etiquetas de accesibilidad en los componentes de interfaz para lectores de pantalla TalkBack.

---

## 3. Ajustes de Notificaciones y Telemetría Pendientes en Backend

### A. Campo de Porcentaje de Batería en Sensores (`SensorReadingBaseDeDatos`)
* **Ubicación en el Backend/Base de Datos:** Modelo `SensorReadingBaseDeDatos`
* **Descripción:** La preferencia de notificación *"Batería Baja"* se guarda correctamente en `SettingsManager` (dispositivo), pero el modelo de datos de lectura de sensores del backend aún no expone el campo de porcentaje de batería (`batteryLevel`).
* **Esfuerzo estimado:** 1.5 horas (requiere agregar el campo `batteryLevel` en el esquema de sensores del servidor).

### B. Edición de Horario de Resumen Diario
* **Ubicación en la App:** `SettingsScreen.kt` (Sección Notificaciones)
* **Descripción:** La notificación *"Resumen Diario"* está configurada a las 08:00 hs fija. Si se requiere un selector de hora dinámico editable por el usuario, se implementará al conectar el programador de tareas del servidor.
* **Esfuerzo estimado:** 2 horas.

---

## 4. Dashboard Principal

### A. Componente "Ranking de Riesgo" (`RiskRanking`)
* **Ubicación en la Web:** `paginaweb/src/components/dashboard/risk-ranking.tsx` (Página `/dashboard`)
* **Descripción:** Lista ordenada de silobolsas priorizadas por nivel de peligro (Crítico -> Alerta -> Bueno), mostrando medidores visuales de Temperatura y Humedad, días almacenados e indicador de nivel de riesgo.
* **Esfuerzo estimado:** 3 horas

### B. Tarjetas Resumen KPI de Sensores (`DashboardStats`)
* **Ubicación en la Web:** `paginaweb/src/components/dashboard/dashboard-stats.tsx` (Página `/dashboard`)
* **Descripción:** Tarjetas KPI superiores que muestran métricas consolidadas de la planta o campo.
* **Esfuerzo estimado:** 2 horas

---

> [!NOTE]
> Conforme a la regla estricta de alcance, ninguno de estos componentes ni dependencias reservadas se modifica en la app sin aprobación previa.
