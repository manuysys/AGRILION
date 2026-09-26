"""
AGRILION — Verificador de Firebase Admin + Firestore
=====================================================

Comprueba que:
    1. Exista el serviceAccountKey.json en Backend_Arduino/firebase/ o
       Inteligencia_Artificial/firebase/
    2. Las credenciales sean válidas (Auth).
    3. Firestore esté habilitado (lectura de la colección `sensors`).

Uso (desde la raíz del repo):
    python scripts/check_firebase.py
"""

import sys
from pathlib import Path

# Consola Windows (cp1252) no soporta emojis: forzar UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent

CANDIDATES = [
    ROOT / "Backend_Arduino" / "firebase" / "serviceAccountKey.json",
    ROOT / "Inteligencia_Artificial" / "firebase" / "serviceAccountKey.json",
]


def main() -> int:
    print("=" * 64)
    print("AGRILION — Verificación de Firebase")
    print("=" * 64)

    found = [p for p in CANDIDATES if p.exists()]
    if not found:
        print("\n❌ No se encontró serviceAccountKey.json en:")
        for p in CANDIDATES:
            print(f"   - {p.relative_to(ROOT)}")
        print(
            "\n👉 Firebase Console → Project settings → Service accounts → "
            "Generate new private key, y guardalo en ambas carpetas."
        )
        return 1

    for p in found:
        print(f"\n✅ Credencial encontrada: {p.relative_to(ROOT)}")

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore, auth
    except ImportError:
        print("\n❌ firebase-admin no está instalado. Ejecutá:")
        print("   pip install firebase-admin")
        return 1

    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(str(found[0]))
            firebase_admin.initialize_app(cred)
        print("✅ firebase_admin inicializado con las credenciales")
    except Exception as e:
        print(f"\n❌ Credenciales inválidas: {e}")
        return 1

    try:
        users = auth.list_users().users
        print(f"✅ Firebase Auth OK (usuarios registrados: {len(users)})")
    except Exception as e:
        print(f"⚠️  No se pudo listar usuarios de Auth: {e}")

    try:
        db = firestore.client()
        docs = list(db.collection("sensors").limit(1).stream())
        if docs:
            data = docs[0].to_dict() or {}
            print(
                "✅ Firestore OK — colección `sensors` encontrada "
                f"(ejemplo: {docs[0].id} → silo={data.get('siloId', '?')})"
            )
        else:
            print(
                "✅ Firestore OK — sin documentos en `sensors` todavía. "
                "Registrá la lanza desde la web (Configuración → Registrar lanza)."
            )
    except Exception as e:
        print(f"\n❌ Firestore no accesible: {e}")
        print("   Verificá que Firestore esté creado en la consola de Firebase.")
        return 1

    print("\n" + "=" * 64)
    print("Firebase listo para Agrilion ✅")
    return 0


if __name__ == "__main__":
    sys.exit(main())
