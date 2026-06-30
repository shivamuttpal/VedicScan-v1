import React from "react";
import {
  AbsoluteFill,
  Img,
  Video,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const MaharishiScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Enter / exit
  const enterOpacity = interpolate(frame, [0, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitOpacity = interpolate(frame, [158, 185], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(enterOpacity, exitOpacity);

  // Character image enters from below
  const charEnter = spring({ frame: frame - 8, fps, config: { damping: 20, stiffness: 45 } });
  const charY = (1 - charEnter) * 90;

  // Text reveals
  const badgeEnter = spring({ frame: frame - 55, fps, config: { damping: 16, stiffness: 70 } });
  const titleEnter = spring({ frame: frame - 78, fps, config: { damping: 14, stiffness: 60 } });
  const subtitleEnter = spring({ frame: frame - 105, fps, config: { damping: 14, stiffness: 60 } });
  const pillsEnter = spring({ frame: frame - 130, fps, config: { damping: 14, stiffness: 60 } });

  // Aura pulse
  const auraSize = 460 + Math.sin(frame * 0.07) * 22;
  const auraOpacity = 0.22 + Math.sin(frame * 0.09) * 0.08;
  const glowOpacity = 0.38 + Math.sin(frame * 0.11) * 0.12;

  // Pill stagger
  const pills = [
    { label: "Kundali Charts", delay: 130 },
    { label: "Rashifal", delay: 142 },
    { label: "Predictions", delay: 154 },
    { label: "Remedies", delay: 166 },
  ];

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: "#160410" }}>
      {/* ── Radial golden aura ── */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: auraSize,
          height: auraSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(200,164,90,${auraOpacity}) 0%, rgba(180,120,40,0.06) 55%, transparent 78%)`,
          pointerEvents: "none",
        }}
      />

      {/* ── Maharishi character ── */}
      <div
        style={{
          position: "absolute",
          top: "3%",
          left: "50%",
          transform: `translateX(-50%) translateY(${charY}px)`,
          width: 760,
          height: 760,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer decorative ring */}
        <div
          style={{
            position: "absolute",
            width: 780,
            height: 780,
            borderRadius: "50%",
            border: `1px solid rgba(200,164,90,${glowOpacity * 0.5})`,
            boxShadow: `0 0 80px rgba(200,164,90,${glowOpacity * 0.3})`,
          }}
        />
        {/* Inner ring */}
        <div
          style={{
            position: "absolute",
            width: 736,
            height: 736,
            borderRadius: "50%",
            border: "1px solid rgba(200,164,90,0.25)",
          }}
        />

        {/* Character image — crisp, full figure */}
        <Img
          src={staticFile("MaharishiCharImg.png")}
          style={{
            width: 720,
            height: 720,
            borderRadius: "50%",
            objectFit: "cover",
            objectPosition: "center top",
            border: "3px solid rgba(200,164,90,0.55)",
            boxShadow: `0 24px 100px rgba(0,0,0,0.85), 0 0 60px rgba(200,164,90,${glowOpacity * 0.4})`,
          }}
        />
      </div>

      {/* Gradient that fades char into dark background */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, transparent 38%, rgba(22,4,16,0.55) 58%, rgba(22,4,16,1) 78%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Text content ── */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 0,
          right: 0,
          padding: "0 56px",
          textAlign: "center",
        }}
      >
        {/* AI status badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 26,
            opacity: badgeEnter,
            transform: `scale(${0.75 + badgeEnter * 0.25})`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 32px",
              background: "linear-gradient(135deg, rgba(200,164,90,0.18), rgba(200,164,90,0.08))",
              border: "1px solid rgba(200,164,90,0.45)",
              borderRadius: 50,
            }}
          >
            {/* Live dot */}
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#4ADE80",
                boxShadow: "0 0 10px #4ADE80, 0 0 20px rgba(74,222,128,0.4)",
              }}
            />
            <span
              style={{
                fontSize: 24,
                color: "#C8A45A",
                fontFamily: "Helvetica, Arial, sans-serif",
                letterSpacing: 4,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              MAHARISHI AI
            </span>
          </div>
        </div>

        {/* Main heading */}
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: "#FDF8EF",
            fontFamily: "Georgia, 'Times New Roman', serif",
            lineHeight: 1.1,
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 35}px)`,
            marginBottom: 18,
            textShadow: "0 4px 30px rgba(0,0,0,0.6)",
          }}
        >
          Your Personal<br />
          <span style={{ color: "#C8A45A" }}>Vedic Astrologer</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: "rgba(253,248,239,0.65)",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            opacity: subtitleEnter,
            transform: `translateY(${(1 - subtitleEnter) * 22}px)`,
            marginBottom: 38,
            lineHeight: 1.4,
          }}
        >
          Powered by 5,000 years of Vedic wisdom,<br />guided by AI precision
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          {pills.map(({ label, delay }) => {
            const pillOp = interpolate(frame, [delay, delay + 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const pillY = interpolate(frame, [delay, delay + 18], [16, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={label}
                style={{
                  padding: "12px 28px",
                  background: "rgba(200,164,90,0.1)",
                  border: "1px solid rgba(200,164,90,0.32)",
                  borderRadius: 34,
                  color: "#E6CE94",
                  fontSize: 24,
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontWeight: 400,
                  opacity: pillOp,
                  transform: `translateY(${pillY}px)`,
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
