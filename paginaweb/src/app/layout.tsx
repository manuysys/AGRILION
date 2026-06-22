import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agrilion+ | Monitoreo Inteligente de Silobolsas",
  description:
    "Sistema IoT para monitoreo en tiempo real de granos almacenados en silobolsas. Detectá deterioro antes de que ocurran pérdidas.",
  keywords: [
    "agrilion",
    "silobolsa",
    "monitoreo",
    "IoT",
    "granos",
    "agricultura",
    "sensores",
    "alertas",
  ],
};

import { SmoothScroll } from '@/components/ui/smooth-scroll';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-surface-0 text-foreground antialiased">
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
