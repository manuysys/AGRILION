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
  title: "AGRILION | Monitoreo Inteligente de Silobolsas",
  description:
    "Sistema de monitoreo inteligente para silobolsas con sensores IoT, comunicación LoRa y análisis con inteligencia artificial. Detecte riesgos antes de que generen pérdidas.",
  keywords: ["silobolsas", "monitoreo", "IoT", "LoRa", "inteligencia artificial", "agricultura", "sensores", "agtech"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
