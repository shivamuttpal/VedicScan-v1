import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import {
  Crown, CreditCard, Calendar, CheckCircle2, AlertCircle,
  Zap, TrendingUp, Mail, MailX, ArrowRight, Sparkles, RefreshCw,
  Clock, ShieldCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BetaBanner from '../components/BetaBanner';
import { GoldCard, Mandala } from '../components/VedicUI';
import VedicLoader from '../components/VedicLoader';
import api from '../utils/api';
import { toast } from 'sonner';

/**
 * Visual styling per plan code. There is intentionally NO 'premium' entry —
 * the plan set is Free, Standard Monthly, Standard Yearly and the Add-on Pack.
 * The display NAME always comes from the API (and therefore MongoDB); this map
 * only carries colours and icons.
 */
const PLAN_META = {
  free:             { color: 'text-vtext-mid', bg: 'bg-vborder/30',   border: 'border-vborder',    icon: Sparkles },
  standard_monthly: { color: 'text-saffron',   bg: 'bg-saffron-pale', border: 'border-saffron/40', icon: Crown },
  standard_yearly:  { color: 'text-saffron',   bg: 'bg-saffron-pale', border: 'border-saffron/40', icon: Crown },
};

/**
 * Friendly names for feature keys. Falls back to a de-underscored key, so a
 * newly added feature still renders sensibly before this map is updated.
 */
const FEATURE_LABELS = {
  ai_chat: 'AI Chat Sessions',
  kundali_report: 'Detailed Kundali Reports',
  kundali_basic: 'Basic Kundali',
  compatibility_report: 'Detailed Compatibility Reports',
  compatibility_basic: 'Basic Compatibility Match',
  baby_naming: 'Baby Naming',
  rashifal_notification: 'Daily Rashifal',
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

/** Renders one feature quota. `limit === null` means unlimited. */
const UsageBar = ({ label, used, limit }) => {
  const isUnlimited = limit === null || limit === undefined;
  const pct = isUnlimited || !limit ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const barColor = pct >= 90 ? 'bg-vred' : pct >= 70 ? 'bg-saffron' : 'bg-vgreen';
  return (
    <div>
      <div className="flex justify-between text-xs text-vtext-mid mb-1.5">
        <span className="font-medium">{label}</span>
        <span>{isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}</span>
      </div>
      <div className="h-2 rounded-full bg-vborder/30 overflow-hidden">
        {isUnlimited ? (
          <div className="h-full rounded-full bg-vgreen/50 w-full" />
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
};

const Subscription = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailUnsubscribed, setEmailUnsubscribed] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Billing state comes from the entitlement engine. Email preference still
      // lives on the legacy subscription endpoints, so it is fetched separately.
      const [billing, legacy] = await Promise.allSettled([
        api.get('/api/billing/status'),
        api.get('/api/subscription/status'),
      ]);

      if (billing.status === 'fulfilled' && billing.value.data?.success) {
        setStatus(billing.value.data.data);
      } else {
        throw new Error('billing status unavailable');
      }

      if (legacy.status === 'fulfilled') {
        setEmailUnsubscribed(legacy.value.data?.emailUnsubscribed ?? true);
      }
    } catch (err) {
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleEmailToggle = async () => {
    setEmailLoading(true);
    try {
      if (emailUnsubscribed) {
        await api.post('/api/subscription/resubscribe-emails');
        setEmailUnsubscribed(false);
        toast.success('You are now subscribed to email updates.');
      } else {
        await api.post('/api/subscription/unsubscribe-emails');
        setEmailUnsubscribed(true);
        toast.success('You have unsubscribed from email notifications.');
      }
    } catch {
      toast.error('Could not update email preference.');
    } finally {
      setEmailLoading(false);
    }
  };

  const plan = status?.plan?.code || 'free';
  const planLabel = status?.plan?.displayName || 'Free';
  const meta = PLAN_META[plan] || PLAN_META.free;
  const PlanIcon = meta.icon;
  const subscription = status?.subscription;
  const daysLeft = daysUntil(subscription?.expiresAt);
  const isActive = Boolean(status?.isPremium);
  const expiringSoon = isActive && daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  // Quotas are rendered generically from the API, so a new premium feature
  // appears here automatically with no frontend change.
  const quotas = status?.quotas || [];
  const chatQuota = quotas.find((q) => q.feature === 'ai_chat');
  const addons = status?.addons || [];

  // Access continues after cancellation until the paid period ends — say so
  // rather than showing a bare "Active" badge that hides the pending end.
  const isCancelled = subscription?.status === 'cancelled';
  const inGracePeriod = subscription?.isInGracePeriod;

  if (loading) {
    return (
      <div className="min-h-screen bg-vedic-bg font-outfit">
        <BetaBanner /><Navbar />
        <div className="pt-40 flex justify-center">
          <VedicLoader message="Loading your subscription details..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vedic-bg font-outfit">
      <BetaBanner />
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-20 right-[-60px] pointer-events-none">
          <Mandala size={260} opacity={0.03} color="#7B1A38" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-vtext font-playfair">
                My <span className="text-saffron">Subscription</span>
              </h1>
              <p className="text-vtext-muted text-sm mt-1">Manage your plan, usage, and notifications</p>
            </div>
            <button
              onClick={fetchStatus}
              className="flex items-center gap-1.5 text-xs text-vtext-muted hover:text-saffron transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {/* Current Plan */}
          <GoldCard className={`border-2 ${meta.border} shadow-lg overflow-hidden`}>
            <div className={`${meta.bg} px-6 py-5 border-b border-vborder flex items-center justify-between flex-wrap gap-3`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/70 shadow-sm">
                  <PlanIcon className={`w-5 h-5 ${meta.color}`} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-vtext-muted font-bold">Current Plan</p>
                  <h2 className={`text-2xl font-bold font-playfair ${meta.color}`}>{planLabel}</h2>
                </div>
              </div>

              {isActive ? (
                isCancelled ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-saffron-pale text-saffron border border-saffron/20">
                    <AlertCircle className="w-3.5 h-3.5" /> Cancelled · access until expiry
                  </span>
                ) : inGracePeriod ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-saffron-pale text-saffron border border-saffron/20">
                    <AlertCircle className="w-3.5 h-3.5" /> Payment issue · retrying
                  </span>
                ) : expiringSoon ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-saffron-pale text-saffron border border-saffron/20">
                    <AlertCircle className="w-3.5 h-3.5" /> Expiring Soon
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-vgreen/10 text-vgreen border border-vgreen/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                )
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-vborder/30 text-vtext-muted border border-vborder">
                  Free Tier
                </span>
              )}
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-saffron-pale">
                  <CreditCard className="w-4 h-4 text-saffron" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-vtext-muted font-bold">Billing</p>
                  <p className="font-semibold text-vtext capitalize">
                    {status?.plan?.billingInterval && status.plan.billingInterval !== 'none'
                      ? status.plan.billingInterval
                      : 'N/A'}
                  </p>
                  {subscription?.platform && subscription.platform !== 'unknown' && (
                    <p className="text-xs text-vtext-muted mt-0.5">
                      via {subscription.platform.replace(/_/g, ' ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-saffron-pale">
                  <Calendar className="w-4 h-4 text-saffron" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-vtext-muted font-bold">
                    {isActive ? 'Renews / Expires' : 'Plan'}
                  </p>
                  <p className="font-semibold text-vtext">
                    {subscription?.expiresAt ? formatDate(subscription.expiresAt) : 'No expiry'}
                  </p>
                  {isActive && daysLeft !== null && (
                    <p className={`text-xs mt-0.5 font-medium ${expiringSoon ? 'text-saffron' : 'text-vtext-muted'}`}>
                      {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 'Expired'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-saffron-pale">
                  <Clock className="w-4 h-4 text-saffron" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-vtext-muted font-bold">Daily Reset</p>
                  <p className="font-semibold text-vtext">
                    {chatQuota?.resetAt
                      ? new Date(chatQuota.resetAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '12:00 AM'}
                  </p>
                  <p className="text-xs text-vtext-muted mt-0.5">IST midnight</p>
                </div>
              </div>
            </div>

            {expiringSoon && (
              <div className="mx-6 mb-6 p-4 rounded-xl bg-saffron-pale border border-saffron/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-saffron flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-saffron">Plan expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-vtext-muted mt-1">Renew now to keep your Standard access uninterrupted.</p>
                </div>
                <Button
                  onClick={() => navigate('/pricing')}
                  size="sm"
                  className="bg-saffron text-white hover:bg-saffron-600 rounded-lg flex-shrink-0"
                >
                  Renew
                </Button>
              </div>
            )}
          </GoldCard>

          {/* Usage Stats */}
          <GoldCard className="shadow-md">
            <div className="px-6 py-4 border-b border-vborder">
              <h3 className="flex items-center gap-2 font-semibold text-vtext">
                <TrendingUp className="w-4 h-4 text-saffron" />
                Usage This Period
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Rendered generically from the API, so adding a premium feature
                  to a plan in MongoDB surfaces it here with no frontend change. */}
              {quotas.length === 0 && (
                <p className="text-sm text-vtext-muted">No usage data available yet.</p>
              )}

              {quotas.map((q) => (
                <UsageBar
                  key={q.feature}
                  label={FEATURE_LABELS[q.feature] || q.feature.replace(/_/g, ' ')}
                  used={q.used}
                  limit={q.limit}
                />
              ))}

              {chatQuota && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-5 rounded-xl bg-vedic-bg border border-vborder/50 text-center shadow-sm">
                    <p className="text-3xl font-bold text-vtext font-playfair">
                      {chatQuota.unlimited ? '∞' : chatQuota.remaining}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-vtext-muted mt-2 font-semibold">
                      Chats left today
                    </p>
                  </div>
                  {chatQuota.addonLimit > 0 && (
                    <div className="p-5 rounded-xl bg-saffron-pale border border-saffron/30 text-center shadow-sm">
                      <p className="text-3xl font-bold text-saffron font-playfair">
                        +{chatQuota.addonLimit}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-vtext-muted mt-2 font-semibold">
                        From add-on pack
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </GoldCard>

          {/* Active add-on packs */}
          {addons.length > 0 && (
            <GoldCard className="shadow-md">
              <div className="px-6 py-4 border-b border-vborder">
                <h3 className="flex items-center gap-2 font-semibold text-vtext">
                  <Zap className="w-4 h-4 text-saffron" />
                  Active Add-ons
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {addons.map((addon, i) => (
                  <div
                    key={`${addon.planCode}-${i}`}
                    className="p-4 rounded-xl bg-vedic-bg border border-vborder/50"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="font-semibold text-vtext text-sm">Add-on Pack</p>
                      <span className="text-xs text-vtext-muted">
                        Expires {new Date(addon.expiresAt).toLocaleString('en-IN', {
                          hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
                        })}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {addon.grants.map((g) => (
                        <span key={g.feature} className="text-xs text-vtext-mid">
                          {FEATURE_LABELS[g.feature] || g.feature.replace(/_/g, ' ')}:{' '}
                          <strong className="text-saffron">{g.remaining}</strong> / {g.granted} left
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GoldCard>
          )}

          {/* Email Preferences */}
          <GoldCard className="shadow-md">
            <div className="px-6 py-4 border-b border-vborder">
              <h3 className="flex items-center gap-2 font-semibold text-vtext">
                <Mail className="w-4 h-4 text-saffron" />
                Email Notifications
              </h3>
            </div>
            <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-saffron-pale mt-0.5">
                  {emailUnsubscribed ? (
                    <MailX className="w-4 h-4 text-saffron" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-saffron" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-vtext text-sm">
                    {emailUnsubscribed ? 'Notifications off' : 'Notifications on'}
                  </p>
                  <p className="text-xs text-vtext-muted mt-0.5">
                    {emailUnsubscribed
                      ? 'You will not receive renewal reminders or expiry alerts.'
                      : 'Receive renewal reminders, expiry alerts, and cosmic insights.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={emailLoading}
                onClick={handleEmailToggle}
                className={`rounded-xl flex-shrink-0 ${
                  emailUnsubscribed
                    ? 'border-vgreen/30 text-vgreen hover:bg-vgreen/10'
                    : 'border-vred/30 text-vred hover:bg-vred/10'
                }`}
              >
                {emailLoading ? '...' : emailUnsubscribed ? 'Re-subscribe' : 'Unsubscribe'}
              </Button>
            </div>
          </GoldCard>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {plan === 'free' ? (
              <Button
                onClick={() => navigate('/pricing')}
                className="flex-1 bg-gradient-to-r from-saffron to-maroon text-white font-bold py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
              >
                <Zap className="w-5 h-5" />
                Upgrade to Standard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/pricing')}
                variant="outline"
                className="flex-1 border-vborder text-vtext-mid hover:border-saffron hover:text-saffron rounded-2xl py-6 font-semibold"
              >
                View All Plans
              </Button>
            )}
            <Button
              onClick={() => navigate('/chat')}
              variant="outline"
              className="flex-1 border-vborder text-vtext-mid hover:border-saffron hover:text-saffron rounded-2xl py-6 font-semibold"
            >
              Ask Maharishi
            </Button>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Subscription;
