"use client";

import { ArrowUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-[#0a1a10] border-t border-emerald-950/40 text-emerald-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/icon.png" alt="AGRILION" width={32} height={32} className="rounded-lg bg-emerald-900/20 p-1" />
              <span className="text-lg font-extrabold text-white tracking-tight">AGRILION</span>
            </Link>
            <p className="text-sm text-emerald-100/40 leading-relaxed max-w-xs font-medium">Monitoreo inteligente de silobolsas con sensores IoT, LoRa y análisis con inteligencia artificial.</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Producto</h4>
            <ul className="space-y-3 font-semibold text-sm">
              {[
                { label: "Cómo funciona", href: "#como-funciona" },
                { label: "Dashboard", href: "#dashboard-preview" },
                { label: "App móvil", href: "#app" }
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="hover:text-white transition-colors duration-200">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Empresa</h4>
            <ul className="space-y-3 font-semibold text-sm">
              <li><a href="#nosotros" className="hover:text-white transition-colors duration-200">Nosotros</a></li>
              <li><a href="#contacto" className="hover:text-white transition-colors duration-200">Contacto</a></li>
              <li><Link href="/login" className="hover:text-white transition-colors duration-200">Ingresar</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Conectar</h4>
            <div className="flex gap-2.5">
              {[{ icon: ExternalLink, href: "#", label: "LinkedIn" }].map((s, i) => (
                <a key={i} href={s.href} title={s.label} className="w-9 h-9 bg-emerald-950/40 border border-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-100/60 hover:bg-[#0B4D2C] hover:text-white transition-all duration-300">
                  <s.icon size={15} />
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-emerald-950/60 flex flex-col sm:flex-row items-center justify-between gap-4 font-semibold text-xs">
          <p className="text-emerald-100/30">&copy; {new Date().getFullYear()} AGRILION. Todos los derechos reservados.</p>
          <p className="text-emerald-100/30 italic font-medium">&ldquo;Tecnología que protege su cosecha&rdquo;</p>
          <button onClick={scrollToTop} aria-label="Volver arriba" className="w-8 h-8 bg-emerald-950/40 border border-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-100/60 hover:bg-[#0B4D2C] hover:text-white transition-all duration-300">
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
}
