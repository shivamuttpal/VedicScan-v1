import React from 'react';
import { Calendar, TrendingUp, Heart, Briefcase } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BetaBanner from '../components/BetaBanner';
import { GoldCard, Mandala } from '../components/VedicUI';

const Insights = () => {
  const dailyPredictions = [
    {
      zodiac: 'Aries',
      icon: '🐏',
      prediction: 'Today is favorable for new beginnings. Jupiter\'s influence brings opportunities in career.',
      lucky: { number: 7, color: 'Red', time: '10:00 AM - 12:00 PM' }
    },
    {
      zodiac: 'Taurus',
      icon: '🐂',
      prediction: 'Focus on financial planning. Venus transit suggests gains through partnerships.',
      lucky: { number: 6, color: 'White', time: '2:00 PM - 4:00 PM' }
    },
    {
      zodiac: 'Gemini',
      icon: '👯',
      prediction: 'Communication planet Mercury favors you. Great day for important conversations.',
      lucky: { number: 5, color: 'Green', time: '9:00 AM - 11:00 AM' }
    },
    {
      zodiac: 'Cancer',
      icon: '🦀',
      prediction: 'Moon\'s position enhances emotional well-being. Spend time with family.',
      lucky: { number: 2, color: 'Pearl White', time: '6:00 PM - 8:00 PM' }
    },
    {
      zodiac: 'Leo',
      icon: '🦁',
      prediction: 'Sun\'s energy gives you confidence. Perfect time for leadership roles.',
      lucky: { number: 1, color: 'Golden', time: '11:00 AM - 1:00 PM' }
    },
    {
      zodiac: 'Virgo',
      icon: '👧',
      prediction: 'Mercury\'s analytical energy helps in detailed work. Focus on organization.',
      lucky: { number: 5, color: 'Green', time: '3:00 PM - 5:00 PM' }
    }
  ];

  const cosmicEvents = [
    {
      title: 'Full Moon in Scorpio',
      date: 'December 15, 2025',
      description: 'Powerful time for transformation and letting go of old patterns. Scorpio full moon brings intensity and deep emotional healing.',
      impact: 'High'
    },
    {
      title: 'Jupiter Transit',
      date: 'January 2026',
      description: 'Jupiter moves into Taurus bringing expansion in material matters and stability in finances for fixed signs.',
      impact: 'Medium'
    },
    {
      title: 'Mercury Retrograde',
      date: 'February 10 - March 3, 2026',
      description: 'Communication planet goes retrograde. Time to review, revise, and reflect rather than starting new projects.',
      impact: 'Medium'
    }
  ];

  const vedicTips = [
    {
      category: 'Morning Ritual',
      icon: TrendingUp,
      tip: 'Wake up during Brahma Muhurta (1.5 hours before sunrise) for maximum spiritual and mental benefits.'
    },
    {
      category: 'Career Success',
      icon: Briefcase,
      tip: 'Chant Gayatri Mantra 108 times for clarity and success in professional endeavors.'
    },
    {
      category: 'Relationships',
      icon: Heart,
      tip: 'Offer water to Sun during sunrise on Sundays to strengthen relationships and remove obstacles.'
    },
    {
      category: 'Auspicious Timing',
      icon: Calendar,
      tip: 'Avoid important decisions during Rahu Kaal. Check daily Panchang for favorable timings.'
    }
  ];

  return (
    <div className="min-h-screen bg-vedic-bg font-outfit">
      <BetaBanner />
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-20 right-[-60px]">
          <Mandala size={240} opacity={0.03} color="#D4760A" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl lg:text-4xl font-bold mb-3 text-vtext font-playfair">Daily Insights & <span className="text-saffron">Predictions</span></h1>
            <p className="text-base text-vtext-muted">Your guide to cosmic energies and Vedic wisdom</p>
          </div>

          {/* Daily Horoscopes */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-vtext font-playfair">Today's Horoscope</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dailyPredictions.map((item, index) => (
                <GoldCard key={index} className="hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-vtext font-playfair">{item.zodiac}</h3>
                      <span className="text-3xl">{item.icon}</span>
                    </div>
                    <p className="text-vtext-mid mb-4 text-sm leading-relaxed">{item.prediction}</p>
                    <div className="bg-saffron-pale/50 p-4 rounded-xl border border-saffron/10">
                      <p className="text-xs font-semibold text-saffron mb-2">Lucky Details:</p>
                      <div className="space-y-1 text-xs text-vtext-mid">
                        <p><span className="font-semibold">Number:</span> {item.lucky.number}</p>
                        <p><span className="font-semibold">Color:</span> {item.lucky.color}</p>
                        <p><span className="font-semibold">Time:</span> {item.lucky.time}</p>
                      </div>
                    </div>
                  </div>
                </GoldCard>
              ))}
            </div>
          </section>

          {/* Cosmic Events */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-vtext font-playfair">Upcoming Cosmic Events</h2>
            <div className="space-y-4">
              {cosmicEvents.map((event, index) => (
                <GoldCard key={index} className="border-l-4 border-l-saffron">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-vtext font-playfair mb-1">{event.title}</h3>
                        <p className="text-sm text-saffron font-semibold">{event.date}</p>
                      </div>
                      <span className={`inline-block px-4 py-1 rounded-lg text-xs font-semibold mt-2 md:mt-0 ${
                        event.impact === 'High' ? 'bg-maroon-pale text-maroon' : 'bg-saffron-pale text-saffron'
                      }`}>
                        {event.impact} Impact
                      </span>
                    </div>
                    <p className="text-vtext-mid text-sm">{event.description}</p>
                  </div>
                </GoldCard>
              ))}
            </div>
          </section>

          {/* Vedic Tips */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-vtext font-playfair">Vedic Wisdom for <span className="text-saffron">Daily Life</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vedicTips.map((item, index) => {
                const Icon = item.icon;
                return (
                  <GoldCard key={index}>
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-saffron to-maroon rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-vtext mb-1">{item.category}</h3>
                          <p className="text-vtext-mid text-sm">{item.tip}</p>
                        </div>
                      </div>
                    </div>
                  </GoldCard>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Insights;
