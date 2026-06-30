import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Intro } from "./scenes/Intro";
import { MaharishiScene } from "./scenes/Maharishi";
import { FeatureScene } from "./scenes/FeatureScene";
import { CTAScene } from "./scenes/CTA";

// ─── Frame timing at 30fps ────────────────────────────────────────────────────
// Scene 1 — Intro:            0–150   (5s)   Celestial bg + logo reveal
// Scene 2 — Maharishi AI:   150–330   (6s)   Sage with AI character video
// Scene 3 — Kundali:        330–480   (5s)   Kundali chart feature
// Scene 4 — Matching:       480–600   (4s)   Ashta Koota compatibility
// Scene 5 — Baby Naming:    600–720   (4s)   Nakshatra baby names
// Scene 6 — CTA:            720–900   (6s)   Download CTA + app stores
// Total:                    0–900     (30s)

export const VedicScanAd: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#2D0716" }}>
      <Sequence from={0} durationInFrames={155}>
        <Intro />
      </Sequence>

      <Sequence from={150} durationInFrames={185}>
        <MaharishiScene />
      </Sequence>

      <Sequence from={330} durationInFrames={155}>
        <FeatureScene
          image="home/kundali.jpg"
          badge="JYOTISH SHASTRA"
          title={"Personalised\nKundali"}
          description="Your complete birth chart — 9 planets, 12 houses, Lagna & Dasha — decoded by 5,000 years of Vedic science."
          accentColor="#8B5CF6"
          darkBg="#0F0A1F"
        />
      </Sequence>

      <Sequence from={480} durationInFrames={125}>
        <FeatureScene
          image="home/matching.jpg"
          badge="36 GUNAS  •  ASHTA KOOTA"
          title={"Kundali\nMatching"}
          description="Full Ashta Koota compatibility analysis with PDF report. Know if the stars align before you say yes."
          accentColor="#EC4899"
          darkBg="#1F0A15"
        />
      </Sequence>

      <Sequence from={600} durationInFrames={125}>
        <FeatureScene
          image="home/baby-naming.jpg"
          badge="NAKSHATRA BASED"
          title={"Sacred Baby\nNaming"}
          description="Discover auspicious Vedic names aligned with your newborn's Nakshatra, Rashi & birth star energy."
          accentColor="#10B981"
          darkBg="#061812"
        />
      </Sequence>

      <Sequence from={720} durationInFrames={180}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
