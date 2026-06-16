"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { gsap, prefersReducedMotion } from "@/lib/animations";

const navLinks = [
  { href: "#inicio", label: "Inicio" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#beneficios", label: "Beneficios" },
  { href: "#dashboard-preview", label: "Dashboard" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#testimonios", label: "Testimonios" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#contacto", label: "Contacto" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("#inicio");
  const headerRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileContentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  // Scroll-based glassy compact effect with GSAP
  useEffect(() => {
    if (prefersReducedMotion() || !headerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(headerRef.current, {
        paddingTop: 0,
        paddingBottom: 0,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top -20px",
          end: "top -60px",
          scrub: 0.3,
          onUpdate: (self) => setScrolled(self.progress > 0.5),
        },
      });
    }, headerRef);
    return () => ctx.revert();
  }, []);

  // Mobile menu animation with GSAP
  useEffect(() => {
    if (!mobileMenuRef.current || !mobileContentRef.current) return;
    if (mobileOpen) {
      gsap.set(mobileMenuRef.current, { display: "block" });
      gsap.fromTo(mobileMenuRef.current, { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
      gsap.fromTo(Array.from(mobileContentRef.current.children),
        { x: -12, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.04, duration: 0.3, ease: "power2.out" }
      );
    } else {
      gsap.to(mobileMenuRef.current, {
        opacity: 0, y: -8, duration: 0.2, ease: "power2.in",
        onComplete: () => { if (mobileMenuRef.current) gsap.set(mobileMenuRef.current, { display: "none" }); },
      });
    }
  }, [mobileOpen]);

  // Active section tracking
  useEffect(() => {
    const ids = navLinks.map((l) => l.href.replace("#", ""));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] py-2"
          : "bg-white/80 backdrop-blur-sm py-3"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/icon.png" alt="AGRILION" width={28} height={28} className="rounded-md" style={{ width: 28, height: 28 }} />
            <span className={`font-bold tracking-tight text-gray-900 transition-all duration-300 ${scrolled ? "text-base" : "text-lg"}`}>
              AGRILION
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`relative whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeSection === link.href
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {link.label}
                {activeSection === link.href && (
                  <span ref={indicatorRef} className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-[#15803d]" />
                )}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all"
            >
              Ingresar
            </Link>
            <a
              href="#contacto"
              className="px-5 py-1.5 text-sm font-semibold rounded-lg bg-[#15803d] text-white hover:bg-[#166534] transition-all shadow-sm"
            >
              Solicitar demo
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Menú"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        ref={mobileMenuRef}
        className="lg:hidden"
        style={{ display: "none" }}
      >
        <div className="bg-white border-t border-gray-200/60 shadow-lg">
          <div ref={mobileContentRef} className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === link.href
                    ? "text-[#15803d] bg-green-50/60"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </a>
            ))}
            <hr className="my-2 border-gray-100" />
            <Link
              href="/login"
              onClick={closeMobile}
              className="block w-full text-center px-4 py-3 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all"
            >
              Ingresar
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
