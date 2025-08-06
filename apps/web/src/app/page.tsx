"use client";
import { useQuery } from "convex/react";
// Note: Update this path once Convex is properly set up
// import { api } from "@isis-chat/backend/convex/_generated/api";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CTASection } from "@/components/landing/cta-section";
import { TombBackground } from "@/components/landing/tomb-background";
import { HieroglyphicAnimations } from "@/components/landing/hieroglyphic-animations";
import { DustParticles } from "@/components/landing/dust-particles";

export default function Home() {
  // TODO: Re-enable once Convex is properly configured
  // const healthCheck = useQuery(api.healthCheck.get);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ancient Egyptian Tomb Background */}
      <TombBackground />
      
      {/* Hieroglyphic Animations */}
      <HieroglyphicAnimations />
      
      {/* Dust Particle Effects */}
      <DustParticles />
      
      {/* API Status Check - Theme-aware (disabled until Convex setup) */}
      <div className="absolute top-4 right-4 z-50">
        <div className="rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm p-3 transition-all duration-300">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-xs text-muted-foreground">
              Development Mode
            </span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <CTASection />
      </div>
    </div>
  );
}
