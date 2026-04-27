import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Sparkles, Star, Heart, TrendingUp, Calendar, Users, ChevronRight, Bell, User, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BetaBanner from '../components/BetaBanner';
import { Mandala, GoldCard, GoldBar, RashiChip, SIGNS, C } from '../components/VedicUI';
import { sampleQuestions } from '../mock';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, getToken, hasProfile } = useAuth();

  // State for dynamic Rashifal
  const [selectedSignName, setSelectedSignName] = useState('Mesh');
  const [predictions, setPredictions] = useState({});
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [defaultProfile, setDefaultProfile] = useState(null);

  // Helper: Get Current Date Formatted (e.g., Sunday, 19 April)
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Helper: Determine Rashi based on DOB (Sun sign ranges)
  const determineRashi = (dateStr) => {
    if (!dateStr) return 'Mesh';
    const date = new Date(dateStr);
    const m = date.getMonth() + 1;
    const d = date.getDate();

    if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return 'Mesh';
    if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return 'Vrishabh';
    if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return 'Mithun';
    if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return 'Kark';
    if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return 'Simha';
    if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return 'Kanya';
    if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return 'Tula';
    if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return 'Vrishchik';
    if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return 'Dhanu';
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return 'Makar';
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return 'Kumbh';
    if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) return 'Meen';
    return 'Mesh';
  };

  // Fetch daily predictions
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoadingPredictions(true);
        const res = await axios.get(`${BACKEND_URL}/api/rashifal`);
        if (res.data?.success) {
          const predMap = {};
          res.data.data.forEach(p => { predMap[p.sign] = p.prediction; });
          setPredictions(predMap);
        }
      } catch (err) {
        console.error('Failed to fetch daily rashifal:', err);
      } finally {
        setLoadingPredictions(false);
      }
    };
    fetchPredictions();
  }, []);

  // Update selected sign if user is logged in and has a profile
  useEffect(() => {
    const fetchDefaultProfile = async () => {
      if (!isAuthenticated) return;
      const authToken = getToken();
      if (!authToken) return;

      try {
        const res = await axios.get(`${BACKEND_URL}/api/profiles/default`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.data) {
          setDefaultProfile(res.data);
          const rashi = determineRashi(res.data.dateOfBirth);
          setSelectedSignName(rashi);
        }
      } catch (err) {
        console.error('Failed to fetch default profile:', err);
      }
    };
    fetchDefaultProfile();
  }, [isAuthenticated, getToken]);

  const selectedSign = SIGNS.find(s => s.rashi === selectedSignName) || SIGNS[0];

  const features = [
    {
      icon: Sparkles,
      title: "AI Vedic Astrologer",
      description: "Chat with our AI for personalized Vedic readings, transit analysis, and remedies",
      link: "/chat",
      color: "text-saffron",
      bg: "bg-saffron-pale",
      borderColor: "border-saffron/20",
      tag: "AI Powered",
      tagBg: "bg-saffron-pale",
      tagColor: "text-saffron"
    },
    {
      icon: Star,
      title: "Baby Name Finder",
      description: "Discover auspicious names based on Nakshatra, Rashi, numerology, and meaning",
      link: "/baby-naming",
      color: "text-vteal",
      bg: "bg-vteal-soft",
      borderColor: "border-vteal/20",
      tag: "Vedic + Modern",
      tagBg: "bg-vteal-soft",
      tagColor: "text-vteal"
    },
    {
      icon: Heart,
      title: "Kundali Matching",
      description: "Check compatibility with Ashtakoot Gun Milan — the traditional 36-point system",
      link: "/compatibility",
      color: "text-maroon",
      bg: "bg-maroon-soft",
      borderColor: "border-maroon/20",
      tag: "36 Gunas",
      tagBg: "bg-maroon-pale",
      tagColor: "text-maroon"
    },
    {
      icon: TrendingUp,
      title: "Future Predictions",
      description: "Personalized forecasts based on planetary transits and dasha systems",
      link: "/chat",
      color: "text-vpurple",
      bg: "bg-vpurple-soft",
      borderColor: "border-vpurple/20",
      tag: "Dasha Analysis",
      tagBg: "bg-vpurple-soft",
      tagColor: "text-vpurple"
    },
    {
      icon: Calendar,
      title: "Muhurta Finder",
      description: "Find auspicious dates and times for important events and decisions",
      link: "/chat",
      color: "text-gold",
      bg: "bg-gold-pale",
      borderColor: "border-gold/20",
      tag: "Coming Soon",
      tagBg: "bg-gold-pale",
      tagColor: "text-gold"
    },
  ];

  const testimonials = [
    {
      name: "Priya M.",
      text: "VedicScan helped me find the perfect muhurta for my wedding. The predictions were spot-on!",
      rating: 5
    },
    {
      name: "Rajesh K.",
      text: "The compatibility report gave us deep insights about our relationship. Highly recommended!",
      rating: 5
    },
    {
      name: "Anjali S.",
      text: "Finally, an astrology app that gives actionable advice instead of vague predictions.",
      rating: 5
    }
  ];

  const userSign = SIGNS[0]; // Default to Mesh/Aries

  return (
    <div className="min-h-screen bg-vedic-bg font-outfit">
      <BetaBanner />
      <Navbar />

      {/* Hero Section with Maroon Gradient */}
      <section className="pt-16">
        <div className="relative overflow-hidden bg-gradient-to-br from-maroon to-maroon-600">
          {/* Mandala decoration */}
          <div className="absolute top-[-40px] right-[-60px]">
            <Mandala size={280} opacity={0.07} color="#B8860B" />
          </div>
          <div className="absolute bottom-[-60px] left-[-40px]">
            <Mandala size={200} opacity={0.04} color="#B8860B" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div>
                <p className="text-maroon-soft/80 text-sm mb-1">{getCurrentDate()}</p>
                <div className="flex items-center gap-2">
                  <p className="text-maroon-soft/60 text-sm">Welcome back,</p>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white font-playfair">
                  {defaultProfile?.name || user?.firstName || (isAuthenticated ? '...' : 'Explorer')}
                </h1>
                {isAuthenticated && !hasProfile && (
                  <p className="text-gold-soft text-xs font-semibold mt-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-gold/30">
                    ⚠️ Profile Setup Required
                  </p>
                )}
                
                {/* Maharishi AI Hero Button */}
                <div className="mt-8">
                  <button
                    onClick={() => navigate('/chat')}
                    className="group relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-2xl group bg-gradient-to-br from-saffron to-maroon hover:text-white focus:ring-4 focus:outline-none focus:ring-saffron/30 shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="relative px-8 py-4 transition-all ease-in duration-75 bg-white rounded-2xl group-hover:bg-opacity-0 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <img src="https://customer-assets.emergentagent.com/job_vedicscan/artifacts/fyeynkm9_image.png" alt="Maharishi AI" className="w-8 h-8 object-contain animate-pulse" />
                      </div>
                      <div className="text-left">
                        <span className="block text-[10px] font-black text-saffron group-hover:text-gold-pale uppercase tracking-[0.2em] leading-none mb-1">Divine Guidance</span>
                        <span className="text-xl font-bold tracking-tight text-maroon group-hover:text-white transition-colors font-playfair">ASK MAHARISHI AI</span>
                      </div>
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform text-maroon group-hover:text-white" />
                    </span>
                  </button>
                </div>
                {!isAuthenticated ? (
                  <p className="text-maroon-soft/60 text-sm mt-2">✨ Ancient wisdom for modern life</p>
                ) : !hasProfile ? (
                  <p className="text-maroon-soft/60 text-sm mt-2">Create your primary profile to unlock all features</p>
                ) : (
                  <p className="text-maroon-soft/60 text-sm mt-2">✨ Ancient wisdom for modern life</p>
                )}
              </div>
              {isAuthenticated && (
                <div className="flex gap-3">
                  <button className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Bell className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-gold/40"
                  >
                    <User className="w-5 h-5 text-gold" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rashi Card (overlapping hero) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <GoldCard className="p-5 lg:p-6">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-saffron-pale flex items-center justify-center border-2 border-gold-border flex-shrink-0 animate-in fade-in zoom-in duration-300">
                <span className="text-3xl">{selectedSign.sym}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-maroon font-playfair">{selectedSign.rashi}</span>
                  <span className="text-sm text-vtext-muted">· {selectedSign.zodiac}</span>
                </div>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-saffron-pale text-saffron font-semibold">Lord: {selectedSign.lord}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-gold-pale text-gold font-semibold">{selectedSign.el} {selectedSign.icon}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-maroon-pale text-maroon font-semibold font-devanagari">{selectedSign.rashiDev}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3.5 bg-saffron-pale rounded-xl border-l-[3px] border-saffron min-h-[80px] flex flex-col justify-center">
              <p className="text-[11px] text-saffron font-bold uppercase tracking-wider mb-1">Today's insight</p>
              {loadingPredictions ? (
                <div className="flex items-center gap-2 text-saffron/60">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs italic">Consulting the stars...</span>
                </div>
              ) : (
                <p className="text-sm text-vtext leading-relaxed animate-in slide-in-from-left-2 duration-500">
                  {predictions[selectedSign.rashi] || `The alignment of the planets favors a balanced approach for ${selectedSign.rashi} today. Trust your intuition.`}
                </p>
              )}
            </div>
          </GoldCard>
        </div>
      </section>

      {/* Daily Rashifal Scroll */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-vtext-mid font-bold tracking-wider uppercase">Daily Rashifal</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {SIGNS.map((s) => (
            <RashiChip
              key={s.rashi}
              sign={s}
              active={selectedSignName === s.rashi}
              onClick={() => setSelectedSignName(s.rashi)}
            />
          ))}
        </div>
      </section>

      {/* Quick Question Cards */}
      {isAuthenticated && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-saffron animate-pulse" />
            <p className="text-sm text-vtext-mid font-black tracking-[0.2em] uppercase">Ask Maharishi AI</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sampleQuestions.slice(0, 6).map((question, index) => (
              <div
                key={index}
                className="bg-white border border-vborder rounded-2xl p-4 hover:border-gold-border hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate('/chat', { state: { question } })}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-saffron to-maroon flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-vtext-mid font-medium text-left leading-relaxed">{question}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Explore Features */}
      <section className="py-12 bg-vedic-bg-warm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3 font-playfair text-vtext">
              Your constant companion for <span className="text-saffron">Vedic insights</span>
            </h2>
            <p className="text-lg text-vtext-muted max-w-2xl mx-auto">
              All-in-one platform for authentic, scripture-based astrology guidance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  onClick={() => navigate(feature.link)}
                  className="bg-white rounded-2xl p-5 border border-vborder hover:border-gold-border hover:shadow-lg transition-all cursor-pointer group flex gap-4 items-start"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-base font-bold text-vtext">{feature.title}</h3>
                      <span className={`text-[9px] px-2 py-0.5 rounded-md ${feature.tagBg} ${feature.tagColor} font-semibold`}>{feature.tag}</span>
                    </div>
                    <p className="text-sm text-vtext-muted leading-relaxed">{feature.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-vtext-dim flex-shrink-0 mt-1 group-hover:text-saffron transition-colors" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gradient-to-br from-maroon to-maroon-600 relative overflow-hidden">
        <div className="absolute top-[-30px] right-[-30px]">
          <Mandala size={200} opacity={0.06} color="#B8860B" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <p className="text-gold font-semibold mb-2 text-sm">Daily predictions to keep you informed</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white font-playfair">
              Trusted by <span className="text-gold">thousands</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-7 border border-white/10">
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gold fill-current" />
                  ))}
                </div>
                <p className="text-white/80 mb-5 italic text-sm leading-relaxed">"{testimonial.text}"</p>
                <p className="text-white font-semibold text-sm">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-saffron-pale via-vedic-bg to-gold-pale relative overflow-hidden">
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2">
          <Mandala size={400} opacity={0.03} color="#7B1A38" />
        </div>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-playfair text-vtext">
            Ready to unlock your cosmic potential?
          </h2>
          <p className="text-lg text-vtext-muted mb-8">
            Join thousands who trust VedicScan for authentic Vedic guidance
          </p>
          <GoldBar />
          <div className="flex justify-center gap-3 mt-6 mb-4 flex-wrap">
            {SIGNS.map(s => (
              <span key={s.rashi} className="text-sm w-8 h-8 inline-flex items-center justify-center bg-white rounded-lg border border-vborder text-saffron">
                {s.sym}
              </span>
            ))}
          </div>
          <Button
            onClick={() => {
              if (!isAuthenticated) navigate('/login');
              else if (!hasProfile) navigate('/profile');
              else navigate('/chat');
            }}
            className="bg-gradient-to-r from-saffron to-maroon hover:from-saffron-600 hover:to-maroon-600 text-white font-semibold px-10 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {!isAuthenticated ? 'Get Started Free' : !hasProfile ? 'Complete Your Profile' : 'Chat with Maharshi'}
          </Button>
        </div>
      </section>

      <Footer />

      {/* Floating Maharishi AI Assistant Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <button
          onClick={() => navigate('/chat')}
          className="group relative flex items-center gap-3 bg-white p-2 pr-6 rounded-full shadow-[0_10px_40px_rgba(123,26,56,0.25)] hover:shadow-[0_15px_50px_rgba(123,26,56,0.4)] transition-all duration-500 hover:-translate-y-2 active:scale-95 border border-gold/30 hover:border-gold animate-bounce-subtle"
        >
          {/* Animated Background Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-saffron/20 to-maroon/20 blur-xl group-hover:opacity-100 opacity-0 transition-opacity duration-500"></div>
          
          <div className="relative w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:rotate-[360deg] transition-transform duration-1000 overflow-hidden border border-gold/20">
            <img src="https://customer-assets.emergentagent.com/job_vedicscan/artifacts/fyeynkm9_image.png" alt="Maharishi AI" className="w-9 h-9 object-contain" />
          </div>
          <div className="relative flex flex-col items-start">
            <span className="text-[10px] font-black text-saffron uppercase tracking-widest leading-none mb-1">AI Guru</span>
            <span className="text-sm font-bold text-maroon leading-none">Chat with Maharishi</span>
          </div>
          
          {/* Notification Dot */}
          <div className="absolute top-0 left-0 w-4 h-4 bg-gold rounded-full border-2 border-white animate-pulse"></div>
        </button>
      </div>
    </div>
  );
};

export default Home;
