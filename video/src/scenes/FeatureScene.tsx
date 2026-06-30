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

interface Props {
  image: string;
  badge: string;
  title: string;
  description: string;
  accentColor: string;
  darkBg: string;
}

export const FeatureScene: React.FC<Props> = ({
  image,
  badge,
  title,
  description,
  accentColor,
  darkBg,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Duration varies by prop — figure from interpolation clamps
  const enterOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitOpacity = interpolate(frame, [100, 125], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(enterOpacity, exitOpacity);

  // Ken Burns on feature image
  const imgScale = interpolate(frame, [0, 125], [1.1, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const imgX = interpolate(frame, [0, 125], [2, -2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Card slide up
  const cardEnter = spring({ frame: frame - 12, fps, config: { damping: 18, stiffness: 55 } });

  // Badge
  const badgeEnter = spring({ frame: frame - 28, fps, config: { damping: 16, stiffness: 72 } });
  const badgeOpacity = interpolate(frame, [25, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Title
  const titleEnter = spring({ frame: frame - 48, fps, config: { damping: 15, stiffness: 62 } });
  const titleOpacity = interpolate(frame, [45, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Description
  const descEnter = spring({ frame: frame - 72, fps, config: { damping: 14, stiffness: 58 } });
  const descOpacity = interpolate(frame, [70, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Accent line width
  const accentLineW = interpolate(frame, [30, 60], [0, 90], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: darkBg }}>
      {/* ── Feature image — top 60% ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "63%",
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            transform: `scale(${imgScale}) translateX(${imgX}%)`,
          }}
        />
        {/* Bottom fade to dark */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.1) 35%, ${darkBg}BB 70%, ${darkBg} 100%)`,
          }}
        />
        {/* Side vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, transparent 60%, ${darkBg}55 100%)`,
          }}
        />
      </div>

      {/* Accent horizontal rule */}
      <div
        style={{
          position: "absolute",
          top: "59%",
          left: 60,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: accentLineW,
            height: 2,
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
            borderRadius: 1,
          }}
        />
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: accentColor,
            opacity: badgeOpacity,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        />
      </div>

      {/* ── Text content — bottom 45% ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "46%",
          padding: "32px 60px 90px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          transform: `translateY(${(1 - cardEnter) * 55}px)`,
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            marginBottom: 22,
            opacity: badgeOpacity,
            transform: `scale(${0.82 + badgeEnter * 0.18})`,
          }}
        >
          <div
            style={{
              padding: "9px 22px",
              background: `${accentColor}1A`,
              border: `1px solid ${accentColor}55`,
              borderRadius: 32,
              color: accentColor,
              fontSize: 21,
              fontFamily: "Helvetica, Arial, sans-serif",
              letterSpacing: 3,
              textTransform: "uppercase" as const,
              fontWeight: 700,
            }}
          >
            {badge}
          </div>
        </div>

        {/* Title — supports \n line breaks */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: "#FDF8EF",
            fontFamily: "Georgia, 'Times New Roman', serif",
            lineHeight: 1.05,
            marginBottom: 20,
            opacity: titleOpacity,
            transform: `translateY(${(1 - titleEnter) * 32}px)`,
            whiteSpace: "pre-line",
          }}
        >
          {title}
        </div>

        {/* Gold accent divider */}
        <div
          style={{
            width: 72,
            height: 2,
            background: `linear-gradient(90deg, #C8A45A, transparent)`,
            marginBottom: 22,
            opacity: titleOpacity,
          }}
        />

        {/* Description */}
        <div
          style={{
            fontSize: 30,
            color: "rgba(253,248,239,0.68)",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            lineHeight: 1.55,
            opacity: descOpacity,
            transform: `translateY(${(1 - descEnter) * 22}px)`,
          }}
        >
          {description}
        </div>
      </div>
    </AbsoluteFill>
  );
};
