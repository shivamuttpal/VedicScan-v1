import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background slow Ken Burns zoom out
  const bgScale = interpolate(frame, [0, 155], [1.12, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Overlay darkens progressively
  const overlayOpacity = interpolate(frame, [0, 80], [0.35, 0.78], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Logo entrance
  const logoEnter = spring({ frame: frame - 18, fps, config: { damping: 14, stiffness: 75 } });
  const logoOpacity = interpolate(frame, [15, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Title entrance
  const titleEnter = spring({ frame: frame - 55, fps, config: { damping: 14, stiffness: 60 } });
  const titleOpacity = interpolate(frame, [52, 82], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Tagline entrance
  const tagEnter = spring({ frame: frame - 88, fps, config: { damping: 14, stiffness: 60 } });
  const tagOpacity = interpolate(frame, [85, 112], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Sub text
  const subOpacity = interpolate(frame, [108, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Scene exit fade
  const exitOpacity = interpolate(frame, [135, 155], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Pulsing glow on logo
  const glowPulse = 0.35 + Math.sin(frame * 0.12) * 0.12;
  const ringPulse = 0.4 + Math.sin(frame * 0.08) * 0.15;

  // Ornament line width animation
  const ornamentW = interpolate(frame, [5, 35], [0, 110], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      {/* ── Background: celestial zodiac wheel ── */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile("home/banner.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${bgScale})`,
            transformOrigin: "60% 45%",
          }}
        />
        {/* Gradient overlay — maroon vignette bottom-heavy */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg,
              rgba(74,12,31,${overlayOpacity * 0.45}) 0%,
              rgba(45,7,22,${overlayOpacity * 0.55}) 35%,
              rgba(45,7,22,${overlayOpacity * 0.85}) 65%,
              rgba(45,7,22,1) 100%
            )`,
          }}
        />
      </AbsoluteFill>

      {/* ── Top ornament bar ── */}
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: ornamentW,
            height: 1,
            background: "linear-gradient(90deg, transparent, #C8A45A)",
          }}
        />
        <div
          style={{
            fontSize: 28,
            color: "#C8A45A",
            opacity: interpolate(frame, [10, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            lineHeight: 1,
          }}
        >
          *
        </div>
        <div
          style={{
            width: ornamentW,
            height: 1,
            background: "linear-gradient(90deg, #C8A45A, transparent)",
          }}
        />
      </div>

      {/* VEDICSCAN wordmark above logo */}
      <div
        style={{
          position: "absolute",
          top: 156,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [5, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          fontSize: 24,
          letterSpacing: 14,
          color: "rgba(230,206,148,0.6)",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 300,
          textTransform: "uppercase",
        }}
      >
        VEDICSCAN
      </div>

      {/* ── Logo ── */}
      <div
        style={{
          position: "absolute",
          top: "26%",
          left: "50%",
          transform: `translateX(-50%) translateY(-50%) scale(${0.25 + logoEnter * 0.75})`,
          opacity: logoOpacity,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Outer pulse ring */}
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: "50%",
            border: `1px solid rgba(200,164,90,${ringPulse * 0.5})`,
          }}
        />
        {/* Inner glow ring */}
        <div
          style={{
            position: "absolute",
            width: 310,
            height: 310,
            borderRadius: "50%",
            border: "1px solid rgba(200,164,90,0.35)",
            boxShadow: `0 0 70px rgba(200,164,90,${glowPulse}), 0 0 140px rgba(200,164,90,${glowPulse * 0.4})`,
          }}
        />
        {/* Radial glow behind */}
        <div
          style={{
            position: "absolute",
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(200,164,90,${glowPulse * 0.28}) 0%, transparent 70%)`,
          }}
        />
        <Img
          src={staticFile("logo.jpeg")}
          style={{
            width: 284,
            height: 284,
            borderRadius: "50%",
            border: "3px solid #C8A45A",
            objectFit: "cover",
            boxShadow: `0 8px 60px rgba(0,0,0,0.7), 0 0 50px rgba(200,164,90,0.45)`,
          }}
        />
      </div>

      {/* ── VedicScan title ── */}
      <div
        style={{
          position: "absolute",
          top: "58%",
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 44px",
          opacity: titleOpacity,
          transform: `translateY(${(1 - titleEnter) * 55}px)`,
        }}
      >
        <div
          style={{
            fontSize: 102,
            fontWeight: 900,
            fontFamily: "Georgia, 'Times New Roman', serif",
            color: "#FDF8EF",
            letterSpacing: 2,
            lineHeight: 1.0,
            textShadow: "0 6px 40px rgba(200,164,90,0.45)",
          }}
        >
          Vedic<span style={{ color: "#C8A45A" }}>Scan</span>
        </div>

        {/* Triple dot divider */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            marginTop: 26,
            opacity: titleOpacity,
          }}
        >
          <div style={{ flex: 1, maxWidth: 155, height: 1, background: "linear-gradient(90deg, transparent, #C8A45A)" }} />
          {[1, 0.5, 1].map((op, i) => (
            <div
              key={i}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8A45A", opacity: op }}
            />
          ))}
          <div style={{ flex: 1, maxWidth: 155, height: 1, background: "linear-gradient(90deg, #C8A45A, transparent)" }} />
        </div>
      </div>

      {/* ── Tagline ── */}
      <div
        style={{
          position: "absolute",
          top: "77%",
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 64px",
          opacity: tagOpacity,
          transform: `translateY(${(1 - tagEnter) * 38}px)`,
        }}
      >
        <div
          style={{
            fontSize: 40,
            color: "#E6CE94",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            letterSpacing: 1,
            marginBottom: 22,
            lineHeight: 1.3,
          }}
        >
          Ancient Wisdom for Modern Life
        </div>
        <div
          style={{
            fontSize: 24,
            color: "rgba(253,248,239,0.5)",
            fontFamily: "Helvetica, Arial, sans-serif",
            letterSpacing: 6,
            textTransform: "uppercase",
            fontWeight: 300,
            opacity: subOpacity,
          }}
        >
          Vedic Astrology  •  AI Powered
        </div>
      </div>

      {/* Bottom "Since the Vedas" */}
      <div
        style={{
          position: "absolute",
          bottom: 88,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: subOpacity * 0.45,
          fontSize: 20,
          color: "#A07C32",
          letterSpacing: 8,
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 300,
          textTransform: "uppercase",
        }}
      >
        Since the Vedas
      </div>
    </AbsoluteFill>
  );
};
