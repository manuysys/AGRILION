/**
 * AGRILION — Helpers de autenticación y datos del usuario (cliente)
 * ==================================================================
 *
 * - Registro / login con Firebase Auth (email+password y Google)
 * - Perfil del usuario en Firestore: users/{uid}
 * - Silobolsas del usuario: users/{uid}/silos/{silo_id}
 * - Registro del sensor (device TTN) vía AI API → crea sensors/{device_id}
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db, isFirebaseConfigured, FIREBASE_NOT_CONFIGURED_MESSAGE } from "./firebase";

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  lastName?: string;
  company?: string;
  silosEstimate?: string;
}

export interface SiloData {
  name: string;
  grainType: string;
  location?: string;
  tons?: number;
}

function ensureFirebase() {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error(FIREBASE_NOT_CONFIGURED_MESSAGE);
  }
  return { auth, db };
}

export function generateSiloId(): string {
  // ID único tipo SB-XXXXX (evita colisiones del timestamp)
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 5).toUpperCase();
  return `SB-${random}`;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { auth } = ensureFirebase();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  const { auth } = ensureFirebase();
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  await ensureUserProfile(credential.user);
  return credential.user;
}

export async function registerWithEmail(data: RegisterData): Promise<User> {
  const { auth } = ensureFirebase();
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const user = credential.user;

  const displayName = [data.name, data.lastName].filter(Boolean).join(" ").trim();
  if (displayName) {
    await updateProfile(user, { displayName });
  }

  await ensureUserProfile(user, {
    name: displayName,
    company: data.company ?? "",
    silosEstimate: data.silosEstimate ?? "",
  });

  return user;
}

export async function ensureUserProfile(
  user: User,
  extra: { name?: string; company?: string; silosEstimate?: string } = {}
): Promise<void> {
  const { db } = ensureFirebase();
  await setDoc(
    doc(db, "users", user.uid),
    {
      email: user.email ?? "",
      name: extra.name ?? user.displayName ?? "",
      company: extra.company ?? "",
      silosEstimate: extra.silosEstimate ?? "",
      role: "user",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function signOutUser(): Promise<void> {
  const { auth } = ensureFirebase();
  await signOut(auth);
}

/**
 * Envía un correo de restablecimiento de contraseña.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const { auth } = ensureFirebase();
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Crea una silobolsa para el usuario en Firestore.
 * El backend (MQTT_INFLUXDB_FIREBASE.py) lee users/{uid}/silos/{silo_id}
 * para actualizar estado/score/alerta.
 */
export async function createSiloForUser(uid: string, data: SiloData): Promise<string> {
  const { db } = ensureFirebase();
  const siloId = generateSiloId();

  await setDoc(doc(db, "users", uid, "silos", siloId), {
    name: data.name,
    grainType: data.grainType,
    location: data.location ?? "",
    tons: Number(data.tons ?? 0),
    ownerId: uid,
    createdAt: serverTimestamp(),
  });

  return siloId;
}

/**
 * Asocia un device de TTN a un silo. Se hace vía AI API porque escribe la
 * colección global `sensors/{device_id}` (solo el backend admin puede).
 */
export async function registerSensorViaApi(
  uid: string,
  siloId: string,
  deviceId: string,
  battery = 100
): Promise<void> {
  const res = await fetch(`/api/ai/users/${uid}/silos/${siloId}/sensors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId, battery }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI API ${res.status}: ${text.slice(0, 200)}`);
  }
}
