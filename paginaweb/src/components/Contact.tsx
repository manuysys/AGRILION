"use client";

import { type FormEvent, useState } from "react";
import { Mail, MapPin, Send } from "lucide-react";
import BackgroundLayer from "@/components/BackgroundLayer";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      setSent(true);
      setForm({ name: "", email: "", message: "" });
      setTimeout(() => setSent(false), 3000);
    }, 1200);
  };

  return (
    <section id="contacto" className="relative py-24 sm:py-32 overflow-hidden bg-[#0a1a10]">
      <BackgroundLayer variant="dark" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold text-emerald-300 tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full font-sans">Contacto</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-4 mb-4 text-balance">Hablemos de su proyecto</h2>
          <p className="text-lg text-gray-300">Cuéntenos sus necesidades y le mostraremos cómo AGRILION puede proteger su cosecha.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 max-w-5xl mx-auto">
          {/* Contact details */}
          <div className="lg:col-span-2 space-y-6 flex flex-col justify-center">
            <div className="rounded-2xl p-6 border border-white/10 backdrop-blur-sm bg-white/[0.05]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Email</h3>
                  <p className="text-sm font-semibold text-gray-300">contacto@agrilion.com</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-6 border border-white/10 backdrop-blur-sm bg-white/[0.05]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-400/20 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Ubicación</h3>
                  <p className="text-sm font-semibold text-gray-300">Córdoba, Argentina</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-2xl p-8 border border-gray-200/60 shadow-md space-y-6">
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre completo</label>
              <input 
                id="name"
                type="text" 
                placeholder="Juan Pérez" 
                value={form.name} 
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                required 
                className="w-full py-2 bg-transparent border-b border-gray-200 text-gray-950 text-sm placeholder-gray-400 focus:outline-none focus:border-[#0B4D2C] transition-colors" 
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Correo electrónico</label>
              <input 
                id="email"
                type="email" 
                placeholder="juan@ejemplo.com" 
                value={form.email} 
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} 
                required 
                className="w-full py-2 bg-transparent border-b border-gray-200 text-gray-955 text-sm placeholder-gray-400 focus:outline-none focus:border-[#0B4D2C] transition-colors" 
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="message" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mensaje / Consulta</label>
              <textarea 
                id="message"
                placeholder="Cuéntenos sobre sus campos o silobolsas..." 
                rows={4} 
                value={form.message} 
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} 
                required 
                className="w-full py-2 bg-transparent border-b border-gray-200 text-gray-955 text-sm placeholder-gray-400 focus:outline-none focus:border-[#0B4D2C] transition-colors resize-none" 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isPending || sent}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0B4D2C] text-white font-bold rounded-xl hover:bg-[#166534] disabled:bg-emerald-900/50 transition-all shadow-sm"
            >
              {sent ? (
                <>
                  <span>¡Mensaje enviado!</span>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : isPending ? (
                <>
                  <span>Enviando...</span>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </>
              ) : (
                <>
                  <span>Enviar mensaje</span>
                  <Send size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
