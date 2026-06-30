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

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance fade
  const enterOpacity = interpolate(frame, [0, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Background Ken Burns — pan upward slowly
  const bgScale = interpolate(frame, [0, 180], [1.12, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgY = interpolate(frame, [0, 180], [0, -3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Reveal springs
  const logoSpring = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 65 } });
  const starsSpring = spring({ frame: frame - 38, fps, config: { damping: 14, stiffness: 70 } });
  const headingSpring = spring({ frame: frame - 55, fps, config: { damping: 14, stiffness: 58 } });
  const taglineSpring = spring({ frame: frame - 85, fps, config: { damping: 14, stiffness: 58 } });
  const ctaSpring = spring({ frame: frame - 108, fps, config: { damping: 16, stiffness: 72 } });
  const badgesSpring = spring({ frame: frame - 132, fps, config: { damping: 16, stiffness: 70 } });
  const bottomSpring = spring({ frame: frame - 155, fps, config: { damping: 14, stiffness: 65 } });

  // Shimmer on gold elements
  const shimmer = (Math.sin(frame * 0.13) + 1) / 2;
  const glowPulse = 0.3 + shimmer * 0.18;

  const logoOpacity = interpolate(frame, [12, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: enterOpacity }}>
      {/* ── Golden banner background ── */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile("banner.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            transform: `scale(${bgScale}) translateY(${bgY}%)`,
          }}
        />
        {/* Deep maroon overlay — preserve gold tones, darken for text */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg,
              rgba(45,7,22,0.45) 0%,
              rgba(45,7,22,0.72) 30%,
              rgba(45,7,22,0.90) 60%,
              rgba(45,7,22,0.97) 100%
            )`,
          }}
        />
      </AbsoluteFill>

      {/* ── Content ── */}
      <AbsoluteFill>
        {/* Logo at top */}
        <div
          style={{
            position: "absolute",
            top: 130,
            left: "50%",
            transform: `translateX(-50%) scale(${0.45 + logoSpring * 0.55})`,
            opacity: logoOpacity,
          }}
        >
          {/* Glow behind logo */}
          <div
            style={{
              position: "absolute",
              inset: -30,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(200,164,90,${glowPulse}) 0%, transparent 70%)`,
            }}
          />
          <Img
            src={staticFile("logo.jpeg")}
            style={{
              width: 200,
              height: 200,
              borderRadius: "50%",
              border: "2px solid #C8A45A",
              objectFit: "cover",
              boxShadow: `0 8px 50px rgba(0,0,0,0.7), 0 0 40px rgba(200,164,90,${glowPulse * 0.6})`,
            }}
          />
        </div>

        {/* 5-star rating row */}
        <div
          style={{
            position: "absolute",
            top: 360,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: starsSpring,
            transform: `scale(${0.7 + starsSpring * 0.3})`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 28px",
              background: "rgba(200,164,90,0.1)",
              border: "1px solid rgba(200,164,90,0.28)",
              borderRadius: 40,
            }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  fontSize: 28,
                  color: "#C8A45A",
                  opacity: interpolate(frame, [38 + i * 6, 52 + i * 6], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                *
              </div>
            ))}
            <div
              style={{
                marginLeft: 8,
                fontSize: 22,
                color: "rgba(253,248,239,0.55)",
                fontFamily: "Helvetica, Arial, sans-serif",
                fontWeight: 300,
                letterSpacing: 1,
              }}
            >
              4.9 / 5.0
            </div>
          </div>
        </div>

        {/* Main heading block */}
        <div
          style={{
            position: "absolute",
            top: "32%",
            left: 0,
            right: 0,
            textAlign: "center",
            padding: "0 50px",
            opacity: headingSpring,
            transform: `translateY(${(1 - headingSpring) * 44}px)`,
          }}
        >
          <div
            style={{
              fontSize: 34,
              color: "rgba(253,248,239,0.5)",
              fontFamily: "Helvetica, Arial, sans-serif",
              letterSpacing: 9,
              textTransform: "uppercase",
              fontWeight: 300,
              marginBottom: 8,
            }}
          >
            Experience The
          </div>
          <div
            style={{
              fontSize: 98,
              fontWeight: 900,
              color: "#FDF8EF",
              fontFamily: "Georgia, 'Times New Roman', serif",
              lineHeight: 1.0,
              textShadow: `0 6px 50px rgba(200,164,90,${0.38 + shimmer * 0.18})`,
            }}
          >
            Vedic<span style={{ color: "#C8A45A" }}>Scan</span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            position: "absolute",
            top: "55%",
            left: 0,
            right: 0,
            textAlign: "center",
            padding: "0 60px",
            opacity: taglineSpring,
            transform: `translateY(${(1 - taglineSpring) * 28}px)`,
          }}
        >
          <div
            style={{
              fontSize: 36,
              color: "#E6CE94",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              letterSpacing: 0.5,
              marginBottom: 28,
            }}
          >
            Ancient Wisdom for Modern Life
          </div>

          {/* Gold divider */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{ width: 140, height: 1, background: "linear-gradient(90deg, transparent, #C8A45A)" }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8A45A" }} />
            <div style={{ width: 140, height: 1, background: "linear-gradient(90deg, #C8A45A, transparent)" }} />
          </div>
        </div>

        {/* CTA button */}
        <div
          style={{
            position: "absolute",
            top: "66%",
            left: "50%",
            transform: `translateX(-50%) scale(${0.78 + ctaSpring * 0.22})`,
            opacity: ctaSpring,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              padding: "30px 90px",
              background: `linear-gradient(135deg, #C8A45A 0%, #A07C32 60%, #C8A45A 100%)`,
              backgroundSize: "200% 100%",
              borderRadius: 70,
              color: "#2D0716",
              fontSize: 40,
              fontWeight: 900,
              fontFamily: "Helvetica, Arial, sans-serif",
              letterSpacing: 2,
              boxShadow: `0 10px 50px rgba(200,164,90,${0.45 + shimmer * 0.18}), 0 2px 0 rgba(255,255,255,0.15) inset`,
            }}
          >
            Download Free
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 24,
              color: "rgba(253,248,239,0.45)",
              fontFamily: "Helvetica, Arial, sans-serif",
              letterSpacing: 2,
              fontWeight: 300,
            }}
          >
            iOS & Android
          </div>
        </div>

        {/* App store badges */}
        <div
          style={{
            position: "absolute",
            bottom: 180,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 26,
            opacity: badgesSpring,
            transform: `translateY(${(1 - badgesSpring) * 32}px)`,
          }}
        >
          {[
            { platform: "iOS", store: "App Store" },
            { platform: "Android", store: "Google Play" },
          ].map(({ platform, store }) => (
            <div
              key={store}
              style={{
                padding: "18px 36px",
                background: "rgba(253,248,239,0.06)",
                border: "1px solid rgba(200,164,90,0.35)",
                borderRadius: 18,
                textAlign: "center",
                minWidth: 230,
              }}
            >
              <div
                style={{
                  fontSize: 19,
                  color: "#C8A45A",
                  fontFamily: "Helvetica, Arial, sans-serif",
                  letterSpacing: 3,
                  fontWeight: 500,
                  marginBottom: 4,
                  textTransform: "uppercase" as const,
                }}
              >
                {platform}
              </div>
              <div
                style={{
                  fontSize: 26,
                  color: "#FDF8EF",
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontWeight: 600,
                  letterSpacing: 0.5,
                }}
              >
                {store}
              </div>
            </div>
          ))}
        </div>

        {/* Website URL at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: bottomSpring * 0.45,
            fontSize: 23,
            color: "#C8A45A",
            fontFamily: "Helvetica, Arial, sans-serif",
            letterSpacing: 5,
            fontWeight: 300,
            textTransform: "uppercase" as const,
          }}
        >
          vedicscan.app
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
