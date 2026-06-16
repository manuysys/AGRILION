import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Benefits from "@/components/Benefits";
import DashboardPreview from "@/components/DashboardPreview";
import AppPromo from "@/components/AppPromo";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import Roadmap from "@/components/Roadmap";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import BackgroundDecorations from "@/components/BackgroundDecorations";
import ChatWidget from "@/components/ChatWidget";

function SectionDivider({ variant = "default" }: { variant?: "default" | "dark" | "fade-down" | "fade-up" }) {
  if (variant === "dark") {
    return (
      <div className="relative h-16 sm:h-20 overflow-hidden bg-[#0a1a10]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-8 sm:h-10 bg-gradient-to-b from-transparent via-emerald-400/12 to-transparent" />
        </div>
      </div>
    );
  }
  if (variant === "fade-down") {
    return (
      <div className="relative h-16 sm:h-20 overflow-hidden bg-gradient-to-b from-[#0a1a10] to-transparent">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-8 sm:h-10 bg-gradient-to-b from-transparent via-emerald-400/12 to-transparent" />
        </div>
      </div>
    );
  }
  if (variant === "fade-up") {
    return (
      <div className="relative h-16 sm:h-20 overflow-hidden bg-gradient-to-b from-transparent to-[#0a1a10]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-8 sm:h-10 bg-gradient-to-b from-transparent via-emerald-400/12 to-transparent" />
        </div>
      </div>
    );
  }
  return <div className="relative h-12 sm:h-16 overflow-hidden" />;
}

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <BackgroundDecorations />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <SectionDivider variant="dark" />
        <HowItWorks />
        <SectionDivider variant="fade-down" />
        <Benefits />
        <SectionDivider variant="fade-up" />
        <DashboardPreview />
        <SectionDivider variant="fade-down" />
        <AppPromo />
        <SectionDivider variant="default" />
        <About />
        <SectionDivider variant="default" />
        <Testimonials />
        <SectionDivider variant="default" />
        <Roadmap />
        <SectionDivider variant="fade-up" />
        <Contact />
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
