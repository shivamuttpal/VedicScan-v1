import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Check, Crown, Sparkles, Star, CheckCircle2, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BetaBanner from '../components/BetaBanner';
import api from '../utils/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { GoldCard, Mandala } from '../components/VedicUI';

const Pricing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [processingPlan, setProcessingPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currency, setCurrency] = useState('INR');
  const [currentPlan, setCurrentPlan] = useState('free'); // user's active plan
  const [planEnd, setPlanEnd] = useState(null);

  // Detect location on mount + fetch current subscription
  React.useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code !== 'IN') setCurrency('USD');
      } catch (error) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz !== 'Asia/Kolkata') setCurrency('USD');
      }
    };
    detectLocation();

    // Fetch subscription status if authenticated
    if (isAuthenticated) {
      api.get('/api/subscription/status')
        .then(({ data }) => {
          setCurrentPlan(data.plan || 'free');
          setPlanEnd(data.planEndDate || null);
        })
        .catch(() => {}); // silent fail
    }
  }, [isAuthenticated]);

  const prices = {
    INR: {
      standard: { monthly: 50, annual: 2999 },
      premium: { monthly: 50, annual: 9999 },
      symbol: '₹'
    },
    USD: {
      standard: { monthly: 29, annual: 290 },
      premium: { monthly: 99, annual: 990 },
      symbol: '$'
    }
  };

  const currentPrices = prices[currency];

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Block if user already has this plan active
    if (currentPlan === plan) {
      toast.info('You already have this plan active!');
      navigate('/subscription');
      return;
    }

    setProcessingPlan(plan);
    try {
      const { data: orderData } = await api.post('/api/subscription/create-checkout-session', {
        plan,
        billingCycle,
        currency,
        successUrl: window.location.origin + '/payment-success',
        cancelUrl: window.location.origin + '/pricing?payment=cancelled'
      });

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      if (orderData.url) {
        window.location.href = orderData.url;
      } else {
        throw new Error('Stripe session URL not found');
      }

    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to initiate subscription');
      setProcessingPlan(null);
    }
  };

  // Helper: determine button state for a plan card
  const getPlanButtonProps = (planKey) => {
    const isCurrentPlan = currentPlan === planKey;
    const isProcessing = processingPlan === planKey;
    const hasActivePlan = currentPlan !== 'free';

    if (isCurrentPlan) {
      return {
        label: '✓ Current Plan',
        disabled: true,
        className: 'w-full bg-vgreen/10 border border-vgreen/30 text-vgreen font-bold py-6 rounded-xl cursor-default',
        onClick: () => navigate('/subscription'),
      };
    }
    if (isProcessing) {
      return { label: 'Processing...', disabled: true, className: 'w-full font-bold py-6 rounded-xl opacity-70' };
    }
    return null; // use default
  };

  return (
    <div className="min-h-screen bg-vedic-bg font-outfit">
      <BetaBanner />
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-20 left-[-60px]">
          <Mandala size={240} opacity={0.03} color="#7B1A38" />
        </div>
        <div className="absolute bottom-40 right-[-60px]">
          <Mandala size={200} opacity={0.03} color="#D4760A" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-3 text-vtext font-playfair">Choose Your <span className="text-saffron">Plan</span></h1>
            <p className="text-lg text-vtext-muted mb-8">Unlock unlimited cosmic insights</p>
            
            {/* Pricing Toggles */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              {/* Billing Toggle */}
              <div className="inline-flex items-center bg-vedic-bg-warm rounded-xl p-1 border border-vborder">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-vtext shadow-sm'
                      : 'text-vtext-muted hover:text-vtext'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    billingCycle === 'annual'
                      ? 'bg-white text-vtext shadow-sm'
                      : 'text-vtext-muted hover:text-vtext'
                  }`}
                >
                  Annual
                  <span className="ml-1 text-xs text-vgreen font-semibold">Save 16%</span>
                </button>
              </div>

              {/* Currency Toggle */}
              <div className="inline-flex items-center bg-vedic-bg-warm rounded-xl p-1 border border-vborder">
                <button
                  onClick={() => setCurrency('INR')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currency === 'INR'
                      ? 'bg-white text-vtext shadow-sm'
                      : 'text-vtext-muted hover:text-vtext'
                  }`}
                >
                  🇮🇳 INR
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currency === 'USD'
                      ? 'bg-white text-vtext shadow-sm'
                      : 'text-vtext-muted hover:text-vtext'
                  }`}
                >
                  🌐 USD
                </button>
              </div>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Free Plan */}
            <GoldCard className="border-vborder">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-vtext font-playfair">Free</h3>
                <p className="text-vtext-muted text-sm mt-1">Get started with basics</p>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-vtext">{currentPrices.symbol}0</span>
                  <span className="text-vtext-muted">/month</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                    <span className="text-vtext-mid text-sm">3 questions per day</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                    <span className="text-vtext-mid text-sm">Basic profile management</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                    <span className="text-vtext-mid text-sm">Daily insights</span>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  variant="outline" 
                  className="w-full rounded-xl border-vborder text-vtext-mid hover:bg-saffron-pale hover:text-saffron"
                  disabled={!!processingPlan}
                >
                  Current Plan
                </Button>
              </div>
            </GoldCard>

            {/* Standard Plan */}
            <div className="relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-saffron to-maroon text-white px-4 py-1 rounded-lg text-sm font-bold flex items-center shadow-lg">
                  <Sparkles className="w-4 h-4 mr-1" />
                  BEST VALUE
                </span>
              </div>
              <GoldCard className="border-2 border-saffron shadow-2xl transform md:scale-105">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-vtext font-playfair flex items-center">
                    <Crown className="w-6 h-6 text-saffron mr-2" />
                    Standard Plan
                  </h3>
                  <p className="text-vtext-muted text-sm mt-1">Perfect for regular users</p>
                  <div className="mt-4 mb-6">
                    {billingCycle === 'monthly' ? (
                      <>
                        <span className="text-4xl font-bold text-saffron">{currentPrices.symbol}{currentPrices.standard.monthly}</span>
                        <span className="text-vtext-muted">/month</span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-saffron">{currentPrices.symbol}{currentPrices.standard.annual}</span>
                        <span className="text-vtext-muted">/year</span>
                        <p className="text-sm text-vgreen mt-1">Save {currentPrices.symbol}{Math.round(currentPrices.standard.monthly * 12 - currentPrices.standard.annual)}/year</p>
                      </>
                    )}
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                      <span className="text-vtext font-semibold text-sm">11 questions per day</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                      <span className="text-vtext-mid text-sm">Priority support</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                      <span className="text-vtext-mid text-sm">Advanced predictions</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                      <span className="text-vtext-mid text-sm">Chat history saved</span>
                    </div>
                  </div>
                  <Button 
                    onClick={getPlanButtonProps('standard')?.onClick || (() => handleSubscribe('standard'))}
                    className={getPlanButtonProps('standard')?.className || 'w-full bg-gradient-to-r from-saffron to-maroon hover:from-saffron-600 hover:to-maroon-600 text-white font-bold py-6 rounded-xl shadow-md hover:shadow-lg transition-all'}
                    disabled={getPlanButtonProps('standard')?.disabled || !!processingPlan}
                  >
                    {getPlanButtonProps('standard')?.label ||
                      (processingPlan === 'standard' ? 'Processing...' : 'Get Standard Plan')}
                  </Button>
                </div>
              </GoldCard>
            </div>

            {/* Premium Plan */}
            <div className="relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-vpurple to-vpurple-600 text-white px-4 py-1 rounded-lg text-sm font-bold flex items-center shadow-lg">
                  <Star className="w-4 h-4 mr-1" />
                  PREMIUM
                </span>
              </div>
              <GoldCard className="border-2 border-vpurple/30">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-vtext font-playfair flex items-center">
                    <Crown className="w-6 h-6 text-vpurple mr-2" />
                    Premium Plan
                  </h3>
                  <p className="text-vtext-muted text-sm mt-1">For serious seekers</p>
                  <div className="mt-4 mb-6">
                    {billingCycle === 'monthly' ? (
                      <>
                        <span className="text-4xl font-bold text-vpurple">{currentPrices.symbol}{currentPrices.premium.monthly}</span>
                        <span className="text-vtext-muted">/month</span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-vpurple">{currentPrices.symbol}{currentPrices.premium.annual}</span>
                        <span className="text-vtext-muted">/year</span>
                        <p className="text-sm text-vgreen mt-1">Save {currentPrices.symbol}{Math.round(currentPrices.premium.monthly * 12 - currentPrices.premium.annual)}/year</p>
                      </>
                    )}
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                      <span className="text-vpurple font-semibold text-sm">All standard features</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                      <span className="text-vtext font-semibold text-sm">51 questions per day</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                      <span className="text-vpurple font-semibold text-sm">Monthly prediction report</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                      <span className="text-vpurple font-semibold text-sm">5 answers vetted by real-life astrologer</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                      <span className="text-vtext-mid text-sm">Priority support</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0" />
                      <span className="text-vtext-mid text-sm">Advanced predictions</span>
                    </div>
                  </div>
                  <Button 
                    onClick={getPlanButtonProps('premium')?.onClick || (() => handleSubscribe('premium'))}
                    className={getPlanButtonProps('premium')?.className || 'w-full bg-gradient-to-r from-vpurple to-vpurple-600 hover:from-vpurple-600 hover:to-vpurple text-white font-bold py-6 rounded-xl shadow-md hover:shadow-lg transition-all'}
                    disabled={getPlanButtonProps('premium')?.disabled || !!processingPlan}
                  >
                    {getPlanButtonProps('premium')?.label ||
                      (processingPlan === 'premium' ? 'Processing...' : 'Get Premium Plan')}
                  </Button>
                </div>
              </GoldCard>
            </div>
          </div>

          {/* One-Time Services */}
          <div>
            <h2 className="text-2xl font-bold text-center mb-8 text-vtext font-playfair">One-Time <span className="text-saffron">Services</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GoldCard>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-vtext font-playfair">Compatibility Report</h3>
                  <p className="text-sm text-vtext-muted mb-4">Detailed Kundli Milan analysis</p>
                  <div className="text-3xl font-bold text-maroon mb-4">{currentPrices.symbol}{currency === 'INR' ? '999' : '9'}</div>
                  <Button 
                    onClick={() => navigate('/compatibility')}
                    className="w-full bg-gradient-to-r from-maroon to-maroon-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Get Report
                  </Button>
                </div>
              </GoldCard>

              <GoldCard>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-vtext font-playfair">Baby Naming</h3>
                  <p className="text-sm text-vtext-muted mb-4">Auspicious name suggestions</p>
                  <div className="text-3xl font-bold text-vteal mb-4">{currentPrices.symbol}{currency === 'INR' ? '999' : '9'}</div>
                  <Button 
                    onClick={() => navigate('/baby-naming')}
                    className="w-full bg-gradient-to-r from-vteal to-vteal-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Get Names
                  </Button>
                </div>
              </GoldCard>

              <GoldCard>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-vtext font-playfair">Muhurta Finder</h3>
                  <p className="text-sm text-vtext-muted mb-4">Find auspicious timings</p>
                  <div className="text-3xl font-bold text-vpurple mb-4">₹999</div>
                  <Button 
                    className="w-full bg-vpurple-soft text-vpurple rounded-xl cursor-not-allowed"
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>
              </GoldCard>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
