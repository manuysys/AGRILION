'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Heavy components loaded dynamically
const SilobolsaHero = dynamic(() => import('@/components/ui/silobolsa-hero').then(m => m.SilobolsaHero), { ssr: false });
const ContainerScroll = dynamic(() => import('@/components/ui/container-scroll-animation').then(m => m.ContainerScroll), { ssr: false });
const SplineScene = dynamic(() => import('@/components/ui/splite').then(m => m.SplineScene), { ssr: false });
const OrbitingCirclesGlobe = dynamic(() => import('@/components/ui/orbiting-circles-02'), { ssr: false });
const FlowFieldShader = dynamic(() => import('@/components/ui/flow-field-shader').then(m => m.ShaderBackground), { ssr: false });

// Lighter components
import { RiveLogo } from '@/components/ui/rive-logo';
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { FeaturesBento } from "@/components/ui/features-bento";
import { DashboardPreview } from "@/components/ui/dashboard-preview";
import { ProblemSection } from "@/components/ui/problem-section";
import { AiSection } from "@/components/ui/ai-section";
import { BenefitsSection } from "@/components/ui/benefits-section";
import { TestimonialsSection } from "@/components/ui/testimonials-section";
import { PricingSection } from "@/components/ui/pricing-section";
import { CtaSection } from "@/components/ui/cta-section";

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '#features', label: 'Características' },
  { href: '#tecnologia', label: 'Tecnología' },
  { href: '#dashboard', label: 'Dashboard' },
  { href: '#planes', label: 'Planes' },
  { href: '#contacto', label: 'Contacto' },
];

function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      setMobileMenuOpen(false);
      const target = document.querySelector(href);
      if (target) {
        const offset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 px-4 pt-4 pointer-events-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 shadow-lg">
        <Link href="/" className="flex items-center gap-2 group">
          <RiveLogo className="w-10 h-10 group-hover:scale-110 transition-transform" />
          <span className="font-black tracking-tighter text-xl text-white uppercase">AGRILION</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex gap-8 text-sm font-medium text-zinc-400">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex gap-3 items-center">
          <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/registro" className="bg-white text-zinc-900 px-5 py-2 rounded-full font-semibold text-sm hover:bg-zinc-200 transition-all">
            Solicitar Demo
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden gap-2 items-center">
          <Link href="/registro" className="bg-emerald-500 text-black px-4 py-2 rounded-full font-bold text-xs hover:bg-emerald-400 transition-all">
            Demo
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div key="close" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden absolute top-full left-4 right-4 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-4 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl text-white font-medium hover:bg-white/5 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {link.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/10"
              >
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-3 px-4 rounded-xl text-white font-semibold border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-3 px-4 rounded-full bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-all"
                >
                  Solicitar Demo Gratuita
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default function Home() {
  return (
    <div className="bg-zinc-950 text-white min-h-screen selection:bg-emerald-500/30">
      
      <Navigation />

      {/* HERO */}
      <SilobolsaHero />

      {/* DASHBOARD PREVIEW with scroll animation */}
      <section id="dashboard" className="relative py-20 bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-60">
          <FlowFieldShader className="h-full w-full" />
        </div>
        <div className="flex flex-col overflow-hidden relative z-10">
          <ContainerScroll
            titleComponent={
              <div className="pt-20 md:pt-28 mb-4 md:mb-8 px-6 text-center">
                <span className="text-emerald-500 font-semibold tracking-widest uppercase text-sm mb-4 block">Visibilidad Total</span>
                <h2 className="text-4xl md:text-6xl font-bold text-white">
                  Un solo panel para{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    todas tus cosechas
                  </span>
                </h2>
                <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
                  Controlá temperatura, humedad y CO₂ de cada silobolsa en tiempo real desde cualquier dispositivo.
                </p>
              </div>
            }
          >
            <div className="w-full h-full bg-zinc-900 rounded-2xl overflow-hidden relative border border-zinc-800">
              <DashboardPreview />
            </div>
          </ContainerScroll>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section id="features">
        <FeaturesBento />
      </section>

      {/* THE PROBLEM */}
      <ProblemSection />

      {/* AI ASSISTANT */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <Card className="w-full min-h-[500px] md:min-h-[560px] bg-zinc-900 border-zinc-800 relative overflow-hidden rounded-3xl">
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            fill="rgba(16,185,129,0.3)"
          />
          
          <div className="flex flex-col md:flex-row h-full">
            {/* Left content */}
            <div className="flex-1 p-8 md:p-16 relative z-10 flex flex-col justify-center">
              <span className="text-emerald-500 font-semibold tracking-widest uppercase text-xs mb-4 block">IA Conversacional</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Tu asistente granjero con IA
              </h2>
              <p className="mt-4 text-zinc-400 max-w-lg text-lg leading-relaxed">
                Hablá con nuestro asistente virtual para analizar los datos de tus silobolsas. Preguntale sobre riesgos de fermentación, predicciones climáticas y estado general de tus granos.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard/ia" className="inline-flex items-center justify-center px-6 py-3 bg-white text-zinc-900 font-bold rounded-full hover:scale-105 transition-transform">
                  Iniciar Chat
                </Link>
                <Link href="#tecnologia" className="inline-flex items-center justify-center px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all">
                  Ver Tecnología
                </Link>
              </div>
            </div>

            {/* Right content (Spline Scene) */}
            <div className="flex-1 relative min-h-[300px]">
              <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full scale-[1.2] translate-y-10"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* TECHNOLOGY STACK — Orbiting Circles Globe */}
      <section id="tecnologia" className="relative bg-black border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-0 relative z-10 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
          >
            Stack Tecnológico <span className="text-emerald-500">Completo</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12"
          >
            Hardware robusto + software inteligente. Una solución End-to-End diseñada para el entorno rural.
          </motion.p>
        </div>
        <OrbitingCirclesGlobe />
      </section>

      {/* AI ENGINE */}
      <AiSection />

      {/* BENEFITS */}
      <BenefitsSection />

      {/* TESTIMONIALS */}
      <TestimonialsSection />

      {/* PRICING */}
      <section id="planes">
        <PricingSection />
      </section>

      {/* CALL TO ACTION */}
      <section id="contacto">
        <CtaSection />
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-zinc-950 py-20 border-t border-white/5 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <RiveLogo className="w-16 h-16 mb-4 opacity-60" />
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Agrilion</h2>
          <p className="text-zinc-500 mb-8 max-w-md text-sm">
            Sistema inteligente de monitoreo de granos. Prevení pérdidas antes de que ocurran.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/dashboard" className="px-8 py-3 bg-emerald-500 text-black font-bold rounded-full hover:bg-emerald-400 hover:scale-105 transition-all">
              Probar Demo
            </Link>
            <Link href="/registro" className="px-8 py-3 bg-white/5 text-white border border-white/10 font-bold rounded-full hover:bg-white/10 transition-all">
              Solicitar Info
            </Link>
          </div>
          <div className="w-full border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-zinc-600">
            <span>&copy; {new Date().getFullYear()} Agrilion. Todos los derechos reservados.</span>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-emerald-500 transition-colors">Términos</a>
              <a href="#" className="hover:text-emerald-500 transition-colors">Privacidad</a>
              <a href="#" className="hover:text-emerald-500 transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
