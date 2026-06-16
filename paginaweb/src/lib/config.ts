export const config = {
  // Backend Arduino via Next.js rewrites (/api/backend → http://localhost:8000)
  backendBaseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "/api/backend",

  // ML/AI Backend via Next.js rewrites (/api/ml → http://localhost:8001/api/v1)
  mlBaseUrl: process.env.NEXT_PUBLIC_ML_URL || "/api/ml",

  endpoints: {
    // Backend Arduino
    backend: {
      health: "/",
      sensorData: "/sensor-data",
      siloStatus: (id: string) => `/silos/${id}/status`,
    },

    // ML/AI Backend (paths relative to /api/ml, rewrites add /api/v1 prefix)
    ml: {
      health: "/health",
      ingest: "/ingest",
      chat: "/chat",
    },
  },

  fallbackToMock: true,
  requestTimeout: 5000,
};
