import { config } from "./config";

class TimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "TimeoutError";
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = config.requestTimeout
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

async function safeFetch<T>(
  fetchFn: () => Promise<Response>,
  fallback: T
): Promise<T> {
  try {
    const res = await fetchFn();
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

// =========== Backend Arduino API ===========

export const backendApi = {
  async health() {
    return safeFetch<{ message: string }>(
      () => fetchWithTimeout(`${config.backendBaseUrl}${config.endpoints.backend.health}`),
      { message: "offline" }
    );
  },

  async getSensorData() {
    return safeFetch<Record<string, unknown>[]>(
      () => fetchWithTimeout(`${config.backendBaseUrl}${config.endpoints.backend.sensorData}`),
      []
    );
  },

  async getSiloStatus(siloId: string) {
    return safeFetch<Record<string, unknown>>(
      () =>
        fetchWithTimeout(
          `${config.backendBaseUrl}${config.endpoints.backend.siloStatus(siloId)}`
        ),
      { error: "offline" }
    );
  },

};

// =========== ML/AI Backend API ===========

export const mlApi = {
  async health() {
    return safeFetch<{ status: string; model_loaded: boolean }>(
      () => fetchWithTimeout(`${config.mlBaseUrl}${config.endpoints.ml.health}`),
      { status: "offline", model_loaded: false }
    );
  },

  async ingest(
    siloId: string,
    values: { temperature: number; humidity: number; co2: number }
  ) {
    return safeFetch<{
      status: string;
      risk_score: number;
      risk_level: string;
      alerts: Record<string, unknown>[];
    }>(
      () =>
        fetchWithTimeout(`${config.mlBaseUrl}${config.endpoints.ml.ingest}`, {
          method: "POST",
          body: JSON.stringify({ silo_id: siloId, ...values }),
        }),
      { status: "offline", risk_score: 0, risk_level: "unknown", alerts: [] }
    );
  },

  async chat(message: string, siloId = "SILO_001", sessionId = "web") {
    return safeFetch<{ response: string; session_id: string }>(
      () =>
        fetchWithTimeout(`${config.mlBaseUrl}${config.endpoints.ml.chat}`, {
          method: "POST",
          body: JSON.stringify({ message, silo_id: siloId, session_id: sessionId }),
        }),
      { response: "", session_id: sessionId }
    );
  },
};
