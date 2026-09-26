"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { RiveLogo } from "@/components/ui/rive-logo";
import { AnimatedShaderBackground } from "@/components/ui/animated-shader-hero";
import { motion } from "framer-motion";
import { isFirebaseConfigured, FIREBASE_NOT_CONFIGURED_MESSAGE } from "@/lib/firebase";
import { signInWithEmail, signInWithGoogle, sendPasswordReset } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Ingresá tu email y volvé a tocar “¿Olvidaste tu contraseña?”.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setInfo("Te enviamos un correo para restablecer la contraseña.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el correo");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar con Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Column: Form */}
      <div className="flex-1 flex flex-col relative z-10">
        
        {/* Top bar */}
        <div className="p-8">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-8">
              <RiveLogo className="w-14 h-14" />
              <span className="font-black tracking-tighter text-3xl">AGRILION</span>
            </div>

            <h1 className="text-3xl font-bold mb-2">Bienvenido de vuelta</h1>
            <p className="text-zinc-400 mb-8">
              Ingresá tus credenciales para acceder a tu panel de control.
            </p>

            {!isFirebaseConfigured && (
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300">
                {FIREBASE_NOT_CONFIGURED_MESSAGE}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Email Profesional</label>
                <input 
                  type="email" 
                  placeholder="ejemplo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-300">Contraseña</label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading || !isFirebaseConfigured}
                    className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors disabled:opacity-50"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-300">
                  {error}
                </div>
              )}

              {info && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-300">
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isFirebaseConfigured}
                className="flex items-center justify-center gap-2 w-full bg-emerald-500 text-black font-bold rounded-xl px-4 py-3 hover:bg-emerald-400 hover:scale-[1.02] transition-all mt-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Iniciar Sesión
              </button>
            </form>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-black px-4 text-zinc-500">O continuar con</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading || !isFirebaseConfigured}
                className="flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 opacity-40 cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 21 21">
                  <path fill="#f25022" d="M0 0h10v10H0z"/>
                  <path fill="#7fba00" d="M11 0h10v10H11z"/>
                  <path fill="#00a4ef" d="M0 11h10v10H0z"/>
                  <path fill="#ffb900" d="M11 11h10v10H11z"/>
                </svg>
                Microsoft
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-zinc-500">
              ¿No tienes una cuenta?{" "}
              <Link href="/registro" className="text-white hover:text-emerald-400 font-medium transition-colors">
                Crear cuenta
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-zinc-950 border-l border-white/5 items-center justify-center">
        <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen">
          <AnimatedShaderBackground />
        </div>
        
        {/* Glass panel over shader */}
        <div className="relative z-10 max-w-lg w-full p-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl m-8">
          <div className="flex gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">El estándar en monitoreo de granos.</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500 w-5 h-5" />
              <span className="text-zinc-300">Más de 10,000 silobolsas monitoreadas</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500 w-5 h-5" />
              <span className="text-zinc-300">Precisión del 99.9% con Sensores IoT</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500 w-5 h-5" />
              <span className="text-zinc-300">Predicción de anomalías impulsada por IA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
