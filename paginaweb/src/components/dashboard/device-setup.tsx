"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth, isFirebaseConfigured, FIREBASE_NOT_CONFIGURED_MESSAGE } from "@/lib/firebase";
import {
  createSiloForUser,
  registerSensorViaApi,
  type SiloData,
} from "@/lib/auth-client";

const GRAINS = ["soja", "maiz", "trigo", "girasol", "cebada"];
const DEFAULT_DEVICE = "smisia-cubecellab02s";

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "ok"; siloId: string; sensorOk: boolean; warning?: string }
  | { kind: "error"; message: string };

export function DeviceSetup() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(Boolean(auth));
  const [siloName, setSiloName] = useState("Lanza de prueba");
  const [grainType, setGrainType] = useState("soja");
  const [location, setLocation] = useState("Campo demo");
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    if (!auth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setStatus({ kind: "saving" });
    try {
      const data: SiloData = { name: siloName, grainType, location };
      const siloId = await createSiloForUser(user.uid, data);

      let sensorOk = true;
      let warning: string | undefined;
      try {
        await registerSensorViaApi(user.uid, siloId, deviceId.trim());
      } catch (err) {
        sensorOk = false;
        warning =
          "La silobolsa se creó, pero no se pudo asociar el sensor. " +
          "Verificá que la AI API esté corriendo y que Firebase Admin " +
          "(serviceAccountKey.json) esté configurado. " +
          (err instanceof Error ? err.message : String(err));
      }

      setStatus({ kind: "ok", siloId, sensorOk, warning });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="rounded-2xl glass-dark border border-amber-500/30 bg-amber-500/5 p-6">
        <h3 className="text-lg font-semibold text-amber-300 mb-2">
          Firebase sin configurar
        </h3>
        <p className="text-sm text-zinc-400">{FIREBASE_NOT_CONFIGURED_MESSAGE}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-dark border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-1">
        Registrar lanza / silobolsa de prueba
      </h3>
      <p className="text-sm text-zinc-500 mb-5">
        Crea la silobolsa en Firestore y asocia el sensor LoRaWAN que envía los datos.
      </p>

      {loadingUser ? (
        <p className="text-sm text-zinc-500">Verificando sesión…</p>
      ) : !user ? (
        <p className="text-sm text-amber-300">
          Iniciá sesión para registrar una silobolsa.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-zinc-500">
            Usuario: <span className="text-zinc-300">{user.email}</span>
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Nombre de la silobolsa</label>
            <input
              type="text"
              value={siloName}
              onChange={(e) => setSiloName(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Tipo de grano</label>
              <select
                value={grainType}
                onChange={(e) => setGrainType(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              >
                {GRAINS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Ubicación</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Device ID de TTN</label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-data placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={status.kind === "saving"}
            className="w-full bg-emerald-500 text-black font-bold rounded-xl px-4 py-3 hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.kind === "saving" ? "Guardando…" : "Crear y asociar sensor"}
          </button>

          {status.kind === "ok" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-300 space-y-1">
              <p>
                Silobolsa <span className="font-semibold">{status.siloId}</span> creada.
              </p>
              <p>
                {status.sensorOk
                  ? `Sensor ${deviceId} asociado correctamente.`
                  : "Sensor pendiente de asociar."}
              </p>
              {status.warning && <p className="text-amber-300">{status.warning}</p>}
            </div>
          )}

          {status.kind === "error" && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-300">
              {status.message}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
