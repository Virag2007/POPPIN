"use client";

import React from "react";
import { BlurpleAtmosphere } from "@/components/landing/BlurpleAtmosphere";
import { LandingNavbarBlurple } from "@/components/landing/LandingNavbarBlurple";
import { HeroBlurple } from "@/components/landing/HeroBlurple";
import { CommunityDiscoverySection } from "@/components/landing/CommunityDiscoverySection";
import { MessagingShowcaseSection } from "@/components/landing/MessagingShowcaseSection";
import { CommunityCreationSection } from "@/components/landing/CommunityCreationSection";
import { ProfilesShowcaseSection } from "@/components/landing/ProfilesShowcaseSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { FooterBlurple } from "@/components/landing/FooterBlurple";

export default function HomePage() {
  return (
    <BlurpleAtmosphere className="min-h-screen">
      {/* 1. Atmospheric Sticky Navbar with 4 Mega Menus */}
      <LandingNavbarBlurple />

      {/* 2. Master Hero Section with 3D / Stylized Illustrated World */}
      <HeroBlurple />

      {/* 3. Community Discovery Showcase (Asymmetrical Frame) */}
      <CommunityDiscoverySection />

      {/* 4. Real-time Messaging Showcase (Sub-100ms Socket Demonstration) */}
      <MessagingShowcaseSection />

      {/* 5. Community Creation Showcase (Channels, Permissions & Blueprints) */}
      <CommunityCreationSection />

      {/* 6. Authentic Builder Profiles & Creator Identities */}
      <ProfilesShowcaseSection />

      {/* 7. Final Atmospheric Call to Action */}
      <FinalCtaSection />

      {/* 8. Full-Width Deep Midnight to Blurple Footer */}
      <FooterBlurple />
    </BlurpleAtmosphere>
  );
}
