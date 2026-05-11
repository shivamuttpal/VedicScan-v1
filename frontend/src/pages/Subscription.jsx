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

const PLAN_META = {
  free:     { label: 'Free',     color: 'text-vtext-mid', bg: 'bg-vborder/30',       border: 'border-vborder',     icon: Sparkles  },
  standard: { label: 'Standard', color: 'text-saffron',   bg: 'bg-saffron-pale',     border: 'border-saffron/40',  icon: Crown     },
  premium:  { label: 'Premium',  color: 'text-vpurple',   bg: 'bg-vpurple-soft',     border: 'border-vpurple/40',  icon: Crown     },
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

const UsageBar = ({ label, used, limit }) => {
  const isUnlimited = limit >= 99999;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
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
      const { data } = await api.get('/api/subscription/status');
      setStatus(data);
      setEmailUnsubscribed(data?.emailUnsubscribed ?? true);
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

  const plan = status?.plan || 'free';
  const meta = PLAN_META[plan] || PLAN_META.free;
  const PlanIcon = meta.icon;
  const daysLeft = daysUntil(status?.planEndDate);
  const isActive = plan !== 'free';
  const expiringSoon = isActive && daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

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
                  <h2 className={`text-2xl font-bold font-playfair ${meta.color}`}>{meta.label}</h2>
                </div>
              </div>

              {isActive ? (
                expiringSoon ? (
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
                    {status?.billingCycle && status.billingCycle !== 'none' ? status.billingCycle : 'N/A'}
                  </p>
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
                    {status?.planEndDate ? formatDate(status.planEndDate) : 'No expiry'}
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
                    {status?.next_daily_reset
                      ? new Date(status.next_daily_reset).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
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
                  <p className="text-xs text-vtext-muted mt-1">Renew now to keep your premium access uninterrupted.</p>
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
              <UsageBar
                label="Daily Questions"
                used={status?.usage?.daily?.used ?? 0}
                limit={status?.limits?.daily_questions ?? 3}
              />
              {/* Monthly question limit tracking disabled
              <UsageBar
                label="Monthly Questions"
                used={status?.usage?.monthly?.used ?? 0}
                limit={status?.limits?.monthly_questions ?? 90}
              /> */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-xl bg-vedic-bg border border-vborder/50 text-center shadow-sm">
                  <p className="text-3xl font-bold text-vtext font-playfair">
                    {Math.max(0, (status?.limits?.daily_questions ?? 3) - (status?.usage?.daily?.used ?? 0)) >= 99999
                      ? '∞'
                      : Math.max(0, (status?.limits?.daily_questions ?? 3) - (status?.usage?.daily?.used ?? 0))
                    }
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-vtext-muted mt-2 font-semibold">Questions left today</p>
                </div>
                {/* Monthly "Questions left this month" box disabled
                <div className="p-5 rounded-xl bg-vedic-bg border border-vborder/50 text-center shadow-sm">
                  <p className="text-3xl font-bold text-vtext font-playfair">
                    {Math.max(0, (status?.limits?.monthly_questions ?? 90) - (status?.usage?.monthly?.used ?? 0)) >= 99999
                      ? '∞'
                      : Math.max(0, (status?.limits?.monthly_questions ?? 90) - (status?.usage?.monthly?.used ?? 0))
                    }
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-vtext-muted mt-2 font-semibold">Questions left this month</p>
                </div> */}
              </div>
            </div>
          </GoldCard>

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
                Upgrade to Premium
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
