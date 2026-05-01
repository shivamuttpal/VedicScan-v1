import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { CheckCircle2, ArrowRight, Star, Sparkles, Crown } from 'lucide-react';
import { Mandala } from '../components/VedicUI';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import confetti from 'canvas-confetti';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Launch fireworks/confetti on success
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-vedic-bg font-outfit overflow-hidden relative">
      <Navbar />
      
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-[-100px] opacity-10">
        <Mandala size={400} color="#7B1A38" />
      </div>
      <div className="absolute bottom-[-100px] right-[-100px] opacity-10">
        <Mandala size={400} color="#D4760A" />
      </div>

      <main className="pt-32 pb-20 px-4 flex items-center justify-center relative z-10">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-vborder text-center">
          <div className="mb-8 relative inline-block">
            <div className="absolute inset-0 bg-vgreen/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
            <div className="relative bg-vgreen rounded-full p-4 text-white shadow-lg shadow-vgreen/30">
              <CheckCircle2 size={48} strokeWidth={2.5} />
            </div>
            <div className="absolute -top-2 -right-2 text-saffron animate-bounce">
              <Sparkles size={24} />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-vtext font-playfair mb-4">Payment Confirmed!</h1>
          <p className="text-lg text-vtext-muted mb-8">
            Your cosmic journey just got an upgrade. Your premium plan is now active.
          </p>

          <div className="bg-vedic-bg-warm rounded-2xl p-6 mb-10 border border-vborder/50 text-left">
            <h3 className="text-sm font-semibold text-vtext-muted uppercase tracking-wider mb-4 flex items-center">
              <Crown size={16} className="text-saffron mr-2" />
              Your New Benefits
            </h3>
            <ul className="space-y-3">
              {[
                'Unlimited Daily Questions',
                'Priority AI Response Time',
                'Advanced Compatibility Reports',
                'Exclusive Monthly Insights'
              ].map((benefit, i) => (
                <li key={i} className="flex items-center text-vtext text-sm">
                  <div className="w-5 h-5 bg-vgreen/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-vgreen rounded-full"></div>
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/chat')}
              className="w-full bg-gradient-to-r from-saffron to-maroon text-white font-bold py-7 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
            >
              Start Asking Questions
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              onClick={() => navigate('/subscription')}
              variant="ghost"
              className="w-full text-vtext-muted hover:text-vtext hover:bg-black/5 rounded-2xl py-6"
            >
              View My Subscription
            </Button>

            <div className="pt-4 border-t border-vborder/30">
              <a 
                href="vedicscan://payment-success"
                className="inline-flex items-center text-saffron font-semibold hover:underline text-sm"
              >
                <Sparkles size={16} className="mr-2" />
                Return to Mobile App
              </a>
            </div>
          </div>

          <p className="mt-8 text-xs text-vtext-muted italic">
            A confirmation email has been sent to your inbox.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
