package com.example.app1.data

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

/**
 * AGRILION — AuthManager
 *
 * Gestor centralizado de autenticación y datos de Firebase.
 *
 * Responsabilidades:
 * - Login/Registro con email+password
 * - Manejo del estado de sesión (user logueado o no)
 * - Obtención del Firebase ID Token (para enviar al backend)
 * - CRUD de silos del usuario actual en Firestore
 * - Listener en tiempo real para alertas
 *
 * Uso:
 *     val authManager = AuthManager()
 *     authManager.signIn("user@example.com", "password123")
 *     val silos = authManager.getUserSilos()
 */
class AuthManager {

    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance()

    companion object {
        private const val TAG = "AuthManager"

        @Volatile
        private var INSTANCE: AuthManager? = null

        fun getInstance(): AuthManager =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: AuthManager().also { INSTANCE = it }
            }
    }

    // ─── AUTH STATE ────────────────────────────────────────────────────────

    /**
     * Flow reactivo del usuario actual.
     * Emitirá el usuario logueado o null cuando se desloguee.
     */
    val authState: Flow<FirebaseUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
            trySend(firebaseAuth.currentUser)
        }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    /** Usuario actualmente logueado (o null) */
    val currentUser: FirebaseUser? get() = auth.currentUser

    /** ¿Hay un usuario logueado? */
    val isLoggedIn: Boolean get() = auth.currentUser != null

    // ─── SIGN IN / SIGN UP ─────────────────────────────────────────────────

    /**
     * Inicia sesión con email y password.
     *
     * @throws Exception si las credenciales son incorrectas
     */
    suspend fun signIn(email: String, password: String): FirebaseUser {
        Log.d(TAG, "Intentando login: $email")
        val result = auth.signInWithEmailAndPassword(email, password).await()
        Log.d(TAG, "Login exitoso: ${result.user?.uid}")
        return result.user ?: throw IllegalStateException("Usuario nulo tras login")
    }

    /**
     * Registra un nuevo usuario y crea su perfil en Firestore.
     *
     * @throws Exception si el email ya está registrado o hay error
     */
    suspend fun signUp(
        email: String,
        password: String,
        name: String,
        phone: String = "",
        company: String = "",
    ): FirebaseUser {
        Log.d(TAG, "Intentando registro: $email")
        val result = auth.createUserWithEmailAndPassword(email, password).await()
        val user = result.user ?: throw IllegalStateException("Usuario nulo tras registro")

        // Enviar email de verificación (opcional)
        try {
            user.sendEmailVerification().await()
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo enviar email de verificación: ${e.message}")
        }

        // Crear perfil en Firestore
        val profile = hashMapOf(
            "email" to email,
            "name" to name,
            "phone" to phone,
            "company" to company,
            "createdAt" to com.google.firebase.firestore.FieldValue.serverTimestamp(),
            "role" to "user",
        )
        db.collection("users").document(user.uid).set(profile).await()

        Log.d(TAG, "Registro exitoso: ${user.uid}")
        return user
    }

    /** Cierra la sesión actual */
    fun signOut() {
        auth.signOut()
        Log.d(TAG, "Sesión cerrada")
    }

    /**
     * Obtiene el Firebase ID Token actual (válido ~1 hora).
     * Se usa como Authorization header para el backend.
     *
     * @param forceRefresh true para forzar renovación (si expiró)
     */
    suspend fun getIdToken(forceRefresh: Boolean = false): String? {
        return try {
            val tokenResult = auth.currentUser?.getIdToken(forceRefresh)?.await()
            tokenResult?.token
        } catch (e: Exception) {
            Log.e(TAG, "Error obteniendo ID token: ${e.message}")
            null
        }
    }

    // ─── SILOS (Firestore) ─────────────────────────────────────────────────

    /**
     * Obtiene todos los silos del usuario actual.
     */
    suspend fun getUserSilos(): List<Map<String, Any>> {
        val uid = currentUser?.uid ?: return emptyList()
        val snapshot = db.collection("users")
            .document(uid)
            .collection("silos")
            .get()
            .await()

        return snapshot.documents.map { doc ->
            doc.data?.plus("siloId" to doc.id) ?: emptyMap()
        }
    }

    /**
     * Crea un nuevo silo para el usuario actual.
     * Devuelve el siloId generado.
     */
    suspend fun createSilo(
        name: String,
        grainType: String,
        location: String = "",
        tons: Double = 0.0,
    ): String {
        val uid = currentUser?.uid ?: throw IllegalStateException("No hay usuario logueado")

        val siloData = hashMapOf(
            "name" to name,
            "grainType" to grainType,
            "location" to location,
            "tons" to tons,
            "ownerId" to uid,
            "createdAt" to com.google.firebase.firestore.FieldValue.serverTimestamp(),
        )

        val docRef = db.collection("users")
            .document(uid)
            .collection("silos")
            .document()
        docRef.set(siloData).await()

        Log.d(TAG, "Silo creado: ${docRef.id}")
        return docRef.id
    }

    /**
     * Listener en tiempo real para las alertas del usuario.
     * Emitirá la lista actualizada cada vez que cambie algo en Firestore.
     */
    fun listenToAlerts(): Flow<List<Map<String, Any>>> = callbackFlow {
        val uid = currentUser?.uid
        if (uid == null) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }

        var registration: ListenerRegistration? = null
        try {
            registration = db.collection("users")
                .document(uid)
                .collection("alerts")
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.e(TAG, "Error escuchando alertas: ${error.message}")
                        trySend(emptyList())
                        return@addSnapshotListener
                    }

                    val alerts = snapshot?.documents?.map { doc ->
                        doc.data?.plus("alertId" to doc.id) ?: emptyMap()
                    } ?: emptyList()

                    trySend(alerts)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Error configurando listener de alertas: ${e.message}")
            trySend(emptyList())
        }

        awaitClose { registration?.remove() }
    }

    // ─── PROFILE ───────────────────────────────────────────────────────────

    /**
     * Obtiene el perfil del usuario desde Firestore.
     */
    suspend fun getUserProfile(): Map<String, Any>? {
        val uid = currentUser?.uid ?: return null
        val doc = db.collection("users").document(uid).get().await()
        return if (doc.exists()) doc.data else null
    }
}
