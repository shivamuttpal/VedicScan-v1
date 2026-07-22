/**
 * Pricing Page
 *
 * Fully data-driven from `GET /api/billing/plans`. Plan names, prices,
 * currencies and feature lists all come from MongoDB, so changing pricing or
 * adding a plan requires NO frontend change or redeploy.
 *
 * This is why there is no hardcoded price table here any more: the previous
 * version carried its own `DEFAULT_PRICES` constant that had silently drifted
 * out of sync with the backend — it still advertised ₹149 Standard and a
 * Premium tier that no longer exists.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BetaBanner from '../components/BetaBanner';
import api from '../utils/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { GoldCard, Mandala } from '../components/VedicUI';

/** Human-readable allowance for a feature entitlement. */
const describeFeature = (feature) => {
  if (feature.unlimited) return `Unlimited ${feature.displayName}`;
  const cadence =
    feature.period === 'daily' ? 'per day' : feature.period === 'monthly' ? 'per month' : 'total';
  return `${feature.limit} ${feature.displayName} ${cadence}`;
};

const Pricing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [region, setRegion] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [planEnd, setPlanEnd] = useState(null);

  // Region selects which price the backend returns. Display concern only — the
  // amount actually charged is read server-side from the plan document, so a
  // spoofed region cannot produce a cheaper charge.
  useEffect(() => {
    const detectRegion = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        setRegion(data.country_code || 'DEFAULT');
      } catch {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setRegion(tz === 'Asia/Kolkata' ? 'IN' : 'DEFAULT');
      }
    };
    detectRegion();
  }, []);

  const loadPlans = useCallback(async () => {
    if (!region) return;
    try {
      const { data } = await api.get('/api/billing/plans', { params: { region } });
      if (data.success) setPlans(data.data.plans || []);
    } catch {
      toast.error('Could not load plans. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get('/api/billing/status')
      .then(({ data }) => {
        if (!data.success) return;
        setCurrentPlan(data.data.plan?.code || 'free');
        setPlanEnd(data.data.subscription?.expiresAt || null);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleSubscribe = async (planCode) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (currentPlan === planCode) {
      toast.info('You already have this plan active!');
      navigate('/subscription');
      return;
    }

    setProcessingPlan(planCode);
    try {
      // Sends only a plan code — never a price. The server reads the amount from
      // the plan document.
      const { data } = await api.post('/api/billing/checkout', {
        planCode,
        region,
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/pricing?payment=cancelled`,
      });

      if (!data.success || !data.data?.url) {
        throw new Error(data.message || 'Could not start checkout');
      }
      window.location.href = data.data.url;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to start checkout');
      setProcessingPlan(null);
    }
  };

  // ── Split the catalogue by role ──
  const freePlan = plans.find((p) => p.code === 'free');
  const subscriptionPlans = plans.filter((p) => p.kind === 'subscription' && p.code !== 'free');
  const addonPlans = plans.filter((p) => p.kind === 'one_time');

  const monthlyPlan = subscriptionPlans.find((p) => p.billingInterval === 'monthly');
  const yearlyPlan = subscriptionPlans.find((p) => p.billingInterval === 'yearly');

  // The toggle picks between the monthly and yearly variants.
  const activePlan = (billingCycle === 'monthly' ? monthlyPlan : yearlyPlan) || subscriptionPlans[0];

  // Yearly saving computed from live prices, not a hardcoded "Save 16%".
  const yearlySaving =
    monthlyPlan?.price && yearlyPlan?.price
      ? Math.round(monthlyPlan.price.amount * 12 - yearlyPlan.price.amount)
      : 0;

  const symbolOf = (plan) => (plan?.price?.displayPrice || '').replace(/[\d.,]/g, '');

  const buttonPropsFor = (planCode) => {
    if (currentPlan === planCode) {
      return {
        label: '✓ Current Plan',
        disabled: true,
        onClick: () => navigate('/subscription'),
        className:
          'w-full bg-vgreen/10 border border-vgreen/30 text-vgreen font-bold py-6 rounded-xl cursor-default',
      };
    }
    if (processingPlan === planCode) {
      return {
        label: 'Processing...',
        disabled: true,
        className: 'w-full font-bold py-6 rounded-xl opacity-70',
      };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vedic-bg font-outfit">
        <BetaBanner />
        <Navbar />
        <div className="pt-32 pb-32 text-center text-vtext-muted">Loading plans…</div>
        <Footer />
      </div>
    );
  }

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

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-3 text-vtext font-playfair">
              Choose Your <span className="text-saffron">Plan</span>
            </h1>
            <p className="text-lg text-vtext-muted mb-8">Unlock unlimited cosmic insights</p>

            {monthlyPlan && yearlyPlan && (
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
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-vtext shadow-sm'
                      : 'text-vtext-muted hover:text-vtext'
                  }`}
                >
                  Yearly
                  {yearlySaving > 0 && (
                    <span className="ml-1 text-xs text-vgreen font-semibold">
                      Save {symbolOf(yearlyPlan)}
                      {yearlySaving}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ── Subscription plans ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
            {freePlan && (
              <GoldCard className="border-vborder">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-vtext font-playfair">
                    {freePlan.displayName}
                  </h3>
                  <p className="text-vtext-muted text-sm mt-1">{freePlan.description}</p>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold text-vtext">
                      {freePlan.price?.displayPrice || '0'}
                    </span>
                    <span className="text-vtext-muted"> forever</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    {freePlan.features.map((f) => (
                      <div key={f.featureKey} className="flex items-start">
                        <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-vtext-mid text-sm">{describeFeature(f)}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="outline"
                    className="w-full rounded-xl border-vborder text-vtext-mid hover:bg-saffron-pale hover:text-saffron"
                    disabled={!!processingPlan}
                  >
                    {currentPlan === 'free' ? 'Current Plan' : 'Free Forever'}
                  </Button>
                </div>
              </GoldCard>
            )}

            {activePlan && (
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
                      {activePlan.displayName}
                    </h3>
                    <p className="text-vtext-muted text-sm mt-1">{activePlan.description}</p>
                    <div className="mt-4 mb-6">
                      <span className="text-4xl font-bold text-saffron">
                        {activePlan.price?.displayPrice}
                      </span>
                      <span className="text-vtext-muted">
                        /{activePlan.billingInterval === 'yearly' ? 'year' : 'month'}
                      </span>
                      {activePlan.billingInterval === 'yearly' && yearlySaving > 0 && (
                        <p className="text-sm text-vgreen mt-1">
                          Save {symbolOf(activePlan)}
                          {yearlySaving}/year · limits refresh every month
                        </p>
                      )}
                    </div>
                    <div className="space-y-3 mb-6">
                      {activePlan.features.map((f) => (
                        <div key={f.featureKey} className="flex items-start">
                          <Check className="w-5 h-5 text-vgreen mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-vtext-mid text-sm">{describeFeature(f)}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={
                        buttonPropsFor(activePlan.code)?.onClick ||
                        (() => handleSubscribe(activePlan.code))
                      }
                      className={
                        buttonPropsFor(activePlan.code)?.className ||
                        'w-full bg-gradient-to-r from-saffron to-maroon hover:from-saffron-600 hover:to-maroon-600 text-white font-bold py-6 rounded-xl shadow-md hover:shadow-lg transition-all'
                      }
                      disabled={buttonPropsFor(activePlan.code)?.disabled || !!processingPlan}
                    >
                      {buttonPropsFor(activePlan.code)?.label || `Get ${activePlan.displayName}`}
                    </Button>
                  </div>
                </GoldCard>
              </div>
            )}
          </div>

          {/* ── Add-on packs ── */}
          {addonPlans.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-center mb-2 text-vtext font-playfair">
                Need a <span className="text-saffron">Top-Up</span>?
              </h2>
              <p className="text-center text-vtext-muted text-sm mb-8">
                One-time boosts — valid for the day of purchase.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {addonPlans.map((addon) => (
                  <GoldCard key={addon.code}>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-vtext font-playfair flex items-center">
                        <Zap className="w-5 h-5 text-saffron mr-2" />
                        {addon.displayName}
                      </h3>
                      <p className="text-sm text-vtext-muted mb-4">{addon.description}</p>
                      <div className="text-3xl font-bold text-maroon mb-4">
                        {addon.price?.displayPrice}
                      </div>
                      <div className="space-y-2 mb-6">
                        {addon.features.map((f) => (
                          <div key={f.featureKey} className="flex items-start">
                            <Check className="w-4 h-4 text-vgreen mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-vtext-mid text-sm">
                              +{f.limit} {f.displayName}
                            </span>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => handleSubscribe(addon.code)}
                        disabled={!!processingPlan}
                        className="w-full bg-gradient-to-r from-maroon to-maroon-600 text-white rounded-xl hover:shadow-lg transition-all"
                      >
                        {processingPlan === addon.code
                          ? 'Processing...'
                          : `Buy ${addon.displayName}`}
                      </Button>
                    </div>
                  </GoldCard>
                ))}
              </div>
            </div>
          )}

          {planEnd && currentPlan !== 'free' && (
            <p className="text-center text-sm text-vtext-muted mt-10">
              Your plan is active until {new Date(planEnd).toLocaleDateString()}.
            </p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
