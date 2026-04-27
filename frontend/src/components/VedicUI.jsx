import React from 'react';

// ── Vedic Design System Colors (for reference / inline fallbacks) ──
export const C = {
  bg: "#FDFAF6", bgWarm: "#F9F3EB", card: "#FFFFFF", input: "#F5F0E8",
  saffron: "#D4760A", saffronSoft: "#F5DFC5", saffronPale: "#FFF7ED",
  maroon: "#7B1A38", maroonSoft: "#F2D8E0", maroonPale: "#FDF2F5",
  gold: "#B8860B", goldSoft: "#F5E6C8", goldPale: "#FFFBF0",
  red: "#C0392B", redSoft: "#FADBD8",
  green: "#1A7D4E", greenSoft: "#D4EFDF",
  teal: "#0C7C6B", tealSoft: "#D0F0EA",
  purple: "#6C3FA0", purpleSoft: "#EDE3F7",
  text: "#2C1E12", textMid: "#6B5040", textMuted: "#9A8878", textDim: "#C4B8AC",
  border: "#E8DFD2", borderGold: "#D4BA80", white: "#FFFFFF",
};

// ── 12 Zodiac Signs Data ──
export const SIGNS = [
  { rashi:"Mesh", rashiDev:"मेष", zodiac:"Aries", sym:"♈", icon:"🔥", lord:"Mars", el:"Fire", date:"Mar 21 – Apr 19" },
  { rashi:"Vrishabh", rashiDev:"वृषभ", zodiac:"Taurus", sym:"♉", icon:"🌍", lord:"Venus", el:"Earth", date:"Apr 20 – May 20" },
  { rashi:"Mithun", rashiDev:"मिथुन", zodiac:"Gemini", sym:"♊", icon:"💨", lord:"Mercury", el:"Air", date:"May 21 – Jun 20" },
  { rashi:"Kark", rashiDev:"कर्क", zodiac:"Cancer", sym:"♋", icon:"🌊", lord:"Moon", el:"Water", date:"Jun 21 – Jul 22" },
  { rashi:"Simha", rashiDev:"सिंह", zodiac:"Leo", sym:"♌", icon:"🔥", lord:"Sun", el:"Fire", date:"Jul 23 – Aug 22" },
  { rashi:"Kanya", rashiDev:"कन्या", zodiac:"Virgo", sym:"♍", icon:"🌍", lord:"Mercury", el:"Earth", date:"Aug 23 – Sep 22" },
  { rashi:"Tula", rashiDev:"तुला", zodiac:"Libra", sym:"♎", icon:"💨", lord:"Venus", el:"Air", date:"Sep 23 – Oct 22" },
  { rashi:"Vrishchik", rashiDev:"वृश्चिक", zodiac:"Scorpio", sym:"♏", icon:"🌊", lord:"Mars", el:"Water", date:"Oct 23 – Nov 21" },
  { rashi:"Dhanu", rashiDev:"धनु", zodiac:"Sagittarius", sym:"♐", icon:"🔥", lord:"Jupiter", el:"Fire", date:"Nov 22 – Dec 21" },
  { rashi:"Makar", rashiDev:"मकर", zodiac:"Capricorn", sym:"♑", icon:"🌍", lord:"Saturn", el:"Earth", date:"Dec 22 – Jan 19" },
  { rashi:"Kumbh", rashiDev:"कुंभ", zodiac:"Aquarius", sym:"♒", icon:"💨", lord:"Saturn", el:"Air", date:"Jan 20 – Feb 18" },
  { rashi:"Meen", rashiDev:"मीन", zodiac:"Pisces", sym:"♓", icon:"🌊", lord:"Jupiter", el:"Water", date:"Feb 19 – Mar 20" },
];

// ── Mandala SVG Component ──
export const Mandala = ({ size = 200, opacity = 0.04, color = C.saffron, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" className={`pointer-events-none ${className}`} style={{ opacity }}>
    <circle cx="100" cy="100" r="92" fill="none" stroke={color} strokeWidth="0.4"/>
    <circle cx="100" cy="100" r="72" fill="none" stroke={color} strokeWidth="0.4"/>
    <circle cx="100" cy="100" r="52" fill="none" stroke={color} strokeWidth="0.3"/>
    <circle cx="100" cy="100" r="32" fill="none" stroke={color} strokeWidth="0.2"/>
    {Array.from({length:12}).map((_,i)=>{
      const a=(i*30)*Math.PI/180;
      return <line key={i} x1={100+32*Math.cos(a)} y1={100+32*Math.sin(a)} x2={100+92*Math.cos(a)} y2={100+92*Math.sin(a)} stroke={color} strokeWidth="0.2"/>;
    })}
    {Array.from({length:8}).map((_,i)=>{
      const a=(i*45+22.5)*Math.PI/180;
      const r=62;
      return <path key={`p${i}`} d={`M${100+r*Math.cos(a-0.18)} ${100+r*Math.sin(a-0.18)} Q${100+(r+18)*Math.cos(a)} ${100+(r+18)*Math.sin(a)} ${100+r*Math.cos(a+0.18)} ${100+r*Math.sin(a+0.18)}`} fill="none" stroke={color} strokeWidth="0.35"/>;
    })}
  </svg>
);

// ── Gold Bar Divider ──
export const GoldBar = ({ className = '' }) => (
  <div className={`gold-bar ${className}`} />
);

// ── Gold Card — card with gold gradient top border ──
export const GoldCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-vborder relative ${className.includes('overflow-') ? '' : 'overflow-visible'} ${className}`}>
    <div className="absolute top-0 left-0 right-0 h-[2.5px]" style={{
      background: 'linear-gradient(90deg, transparent, #B8860B90, #D4760A, #B8860B90, transparent)'
    }} />
    {children}
  </div>
);

// ── Rashi Chip ──
export const RashiChip = ({ sign, active = false, onClick, className = '' }) => (
  <div
    onClick={onClick}
    className={`min-w-[76px] py-2.5 px-2 rounded-xl text-center cursor-pointer flex-shrink-0 transition-all duration-150 border-[1.5px] ${
      active
        ? 'bg-saffron-pale border-saffron'
        : 'bg-white border-vborder hover:border-saffron/40'
    } ${className}`}
  >
    <span className="text-[22px] block mb-0.5">{sign.sym}</span>
    <span className={`text-xs font-semibold block ${active ? 'text-saffron' : 'text-vtext'}`}>{sign.rashi}</span>
    <span className="text-[10px] text-vtext-dim block">{sign.zodiac}</span>
  </div>
);

// ── Vedic Tag ──
export const VedicTag = ({ children, active = false, color = '#D4760A', bg = '#FFF7ED', onClick, className = '' }) => (
  <span
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-[13px] cursor-pointer transition-all duration-150 inline-block ${className}`}
    style={{
      background: active ? bg : '#F5F0E8',
      color: active ? color : '#9A8878',
      border: `1px solid ${active ? color + '40' : '#E8DFD2'}`,
      fontWeight: active ? 600 : 400,
    }}
  >
    {children}
  </span>
);

// ── Google Icon ──
export const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
