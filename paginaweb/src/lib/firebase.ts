/**
 * AGRILION — Firebase Web SDK (cliente)
 * ======================================
 *
 * Inicializa Firebase (Auth + Firestore) con las variables públicas del .env.local.
 * Si las variables no están completas, `isFirebaseConfigured` es false y las
 * pantallas muestran un aviso en vez de romper el build.
 *
 * Config: Firebase Console → Project settings → General → Your apps → Web app
 * Copiar los valores a paginaweb/.env.local (NEXT_PUBLIC_FIREBASE_*).
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function isComplete(value: string | undefined): boolean {
  return typeof value === "string" && value.length > 0 && !value.startsWith("COMPLETAR");
}

export const isFirebaseConfigured: boolean =
  isComplete(firebaseConfig.apiKey) &&
  isComplete(firebaseConfig.authDomain) &&
  isComplete(firebaseConfig.projectId) &&
  isComplete(firebaseConfig.appId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };

export const FIREBASE_NOT_CONFIGURED_MESSAGE =
  "Firebase no está configurado. Completá NEXT_PUBLIC_FIREBASE_* en paginaweb/.env.local " +
  "y reiniciá el servidor (npm run dev).";
