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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://agrilion.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Agrilion+ | Monitoreo Inteligente de Silobolsas",
    template: "%s | Agrilion+",
  },
  description:
    "Sistema IoT para monitoreo en tiempo real de granos almacenados en silobolsas. Detectá deterioro antes de que ocurran pérdidas con sensores inteligentes y predicción por IA.",
  keywords: [
    "agrilion",
    "silobolsa",
    "monitoreo",
    "IoT",
    "granos",
    "agricultura",
    "sensores",
    "alertas",
    "inteligencia artificial",
    "LoRaWAN",
    "agro",
    "campo",
    "acopio",
    "agtech",
  ],
  authors: [{ name: 'Agrilion Team' }],
  creator: 'Agrilion',
  publisher: 'Agrilion',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: baseUrl,
    siteName: 'Agrilion+',
    title: 'Agrilion+ | Monitoreo Inteligente de Silobolsas',
    description: 'Sistema IoT para monitoreo en tiempo real de granos almacenados. Detectá deterioro antes de que ocurran pérdidas.',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Agrilion+ Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agrilion+ | Monitoreo Inteligente de Silobolsas',
    description: 'Sistema IoT para monitoreo en tiempo real de granos almacenados. Detectá deterioro antes de que ocurran pérdidas.',
    images: ['/api/og'],
    creator: '@agrilion',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: baseUrl,
    languages: {
      'es-AR': baseUrl,
    },
  },
  category: 'technology',
};

import { SmoothScroll } from '@/components/ui/smooth-scroll';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-surface-0 text-foreground antialiased">
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
