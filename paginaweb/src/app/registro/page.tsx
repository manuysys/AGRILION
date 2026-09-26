"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { RiveLogo } from "@/components/ui/rive-logo";
import { AnimatedShaderBackground } from "@/components/ui/animated-shader-hero";
import { motion } from "framer-motion";
import { isFirebaseConfigured, FIREBASE_NOT_CONFIGURED_MESSAGE } from "@/lib/firebase";
import { registerWithEmail } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [silosEstimate, setSilosEstimate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail({
        email: email.trim(),
        password,
        name,
        lastName,
        company,
        silosEstimate,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Column: Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-zinc-950 border-r border-white/5 items-center justify-center">
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
          <h2 className="text-3xl font-bold text-white mb-4">Empieza a optimizar tu acopio.</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
              <span className="text-zinc-300">Configuración rápida en 48hs</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
              <span className="text-zinc-300">Hardware en comodato o venta</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
              <span className="text-zinc-300">Soporte técnico y agronómico incluido</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex-1 flex flex-col relative z-10">
        
        {/* Top bar */}
        <div className="p-8 flex justify-end">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            Volver al inicio <ArrowLeft className="w-4 h-4 rotate-180" />
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

            <h1 className="text-3xl font-bold mb-2">Crear cuenta</h1>
            <p className="text-zinc-400 mb-8">
              Registrate para monitorear tus silobolsas en tiempo real.
            </p>

            {!isFirebaseConfigured && (
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300">
                {FIREBASE_NOT_CONFIGURED_MESSAGE}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Nombre</label>
                  <input 
                    type="text" 
                    placeholder="Juan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Apellido</label>
                  <input 
                    type="text" 
                    placeholder="Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Email Profesional</label>
                <input 
                  type="email" 
                  placeholder="juan@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Empresa / Campo</label>
                <input 
                  type="text" 
                  placeholder="Estancia El Sol"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Silobolsas estimadas por año</label>
                <select
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors appearance-none text-white cursor-pointer"
                  value={silosEstimate}
                  onChange={(e) => setSilosEstimate(e.target.value)}
                >
                  <option value="" disabled>Seleccioná un rango</option>
                  <option value="1-10">1 - 10 silobolsas</option>
                  <option value="11-50">11 - 50 silobolsas</option>
                  <option value="51-200">51 - 200 silobolsas</option>
                  <option value="200+">Más de 200 silobolsas</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Contraseña</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Repetir contraseña</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isFirebaseConfigured}
                className="flex items-center justify-center gap-2 w-full bg-emerald-500 text-black font-bold rounded-xl px-4 py-3 hover:bg-emerald-400 hover:scale-[1.02] transition-all mt-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear cuenta
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-zinc-500">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-white hover:text-emerald-400 font-medium transition-colors">
                Iniciar Sesión
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
