"use client";

import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Complete todos los campos");
      return;
    }

    if (email === "demo@agrilion.com" && password === "demo2026") {
      router.push("/dashboard");
    } else {
      setError("Credenciales incorrectas. Pruebe: demo@agrilion.com / demo2026");
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#f0f7f3] via-white to-[#e8f0fe]">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a5c3a] to-[#0f3d25] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#1e7fb0]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center max-w-md">
          <Image
            src="/icon.png"
            alt="AGRILION"
            width={64}
            height={64}
            className="mx-auto mb-6 rounded-2xl"
          />
          <h2 className="text-3xl font-bold text-white mb-4">
            Monitoreo inteligente de silobolsas
          </h2>
          <p className="text-white/60 text-lg">
            Acceda a su panel de control para visualizar el estado de sus
            silobolsas en tiempo real.
          </p>

          <div className="mt-12 space-y-4">
            {[
              "Alertas en tiempo real",
              "Gráficos de temperatura y humedad",
              "Análisis predictivo con IA",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/70">
                <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a5c3a] mb-10 transition-colors"
          >
            ← Volver al inicio
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Iniciar sesión
            </h1>
            <p className="text-sm text-gray-500">
              Ingrese sus credenciales para acceder al dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c3a]/20 focus:border-[#1a5c3a] transition-all"
                placeholder="demo@agrilion.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c3a]/20 focus:border-[#1a5c3a] transition-all pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm text-[#1e7fb0] hover:text-[#1a5c3a] transition-colors"
              >
                ¿Olvidó su contraseña?
              </button>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a5c3a] text-white font-semibold rounded-xl hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5c3a]/20 active:scale-[0.98]"
            >
              <LogIn size={18} />
              Ingresar
            </button>
          </form>

          <p className="mt-8 text-xs text-center text-gray-400">
            Demo: demo@agrilion.com / demo2026
          </p>
        </div>
      </div>
    </div>
  );
}
