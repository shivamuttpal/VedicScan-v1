/**
 * Pricing Screen
 *
 * Plans, prices and feature lists come from `GET /api/billing/plans` — the same
 * MongoDB catalogue the website reads — so web and mobile can never advertise
 * different plans or prices. Purchasing goes through the RevenueCat SDK, which
 * maps each plan's `storeProductIds` to a Google Play product.
 *
 * There is no "Pro" or "Premium" tier: the plans are Free, Standard Monthly,
 * Standard Yearly and the one-day Add-on Pack.
 *
 * Entitlement state is read from OUR backend, never from the SDK's local cache —
 * the client is not trusted to decide what the user has paid for.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Image, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { VedicCard } from '../../components/VedicCard';
import api from '../../config/api';
import {
  purchaseProduct,
  restorePurchases,
  openManageSubscriptions,
  fetchBillingStatus,
  isConfigured,
} from '../../config/revenuecat';

const LOGO = require('../../../assets/logo.jpeg');
const BANNER = require('../../../assets/banner.png');

/** Human-readable allowance for a feature entitlement. */
const describeFeature = (f) => {
  if (f.unlimited) return `Unlimited ${f.displayName}`;
  const cadence =
    f.period === 'daily' ? 'per day' : f.period === 'monthly' ? 'per month' : 'total';
  return `${f.limit} ${f.displayName} ${cadence}`;
};

const PricingScreen = ({ navigation }) => {
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, billing] = await Promise.all([
        api.get('/api/billing/plans'),
        fetchBillingStatus(),
      ]);

      if (plansRes.data?.success) setPlans(plansRes.data.data.plans || []);
      setStatus(billing);
    } catch (e) {
      console.warn('[Pricing] load failed:', e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currentPlanCode = status?.plan?.code || 'free';
  const isPremium = Boolean(status?.isPremium);

  const handlePurchase = async (plan) => {
    const productId = plan.storeProductIds?.[0];

    if (!productId) {
      Alert.alert(
        'Unavailable',
        'This plan is not available for in-app purchase yet. Please try our website.'
      );
      return;
    }

    if (!isConfigured()) {
      Alert.alert(
        'Purchases Unavailable',
        'In-app purchases are not available in this build. Please try again later or use our website.'
      );
      return;
    }

    setPurchasing(plan.code);
    const { status: result, error } = await purchaseProduct(productId);
    setPurchasing(null);

    if (result === 'purchased') {
      await load();
      Alert.alert('You are all set!', `${plan.displayName} is now active on your account.`, [
        { text: 'Continue', onPress: () => navigation.goBack() },
      ]);
    } else if (result === 'error') {
      Alert.alert('Purchase Failed', error?.message || 'Something went wrong. Please try again.');
    }
    // 'cancelled' — the user backed out; stay on the screen silently.
  };

  const handleRestore = async () => {
    setRestoring(true);
    const { success, error } = await restorePurchases();
    setRestoring(false);

    if (!success) {
      Alert.alert('Restore Failed', error?.message || 'Could not restore purchases.');
      return;
    }

    // Re-read from the backend rather than trusting the SDK's local view.
    const refreshed = await fetchBillingStatus();
    setStatus(refreshed);

    if (refreshed?.isPremium) {
      Alert.alert('Restored', `${refreshed.plan.displayName} has been restored to your account.`);
    } else {
      Alert.alert('Nothing to Restore', 'No active purchases found for this account.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const subscriptionPlans = plans.filter((p) => p.kind === 'subscription' && p.code !== 'free');
  const addonPlans = plans.filter((p) => p.kind === 'one_time');
  const freePlan = plans.find((p) => p.code === 'free');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.saffron} />
        <Text style={styles.loadingText}>Loading plans…</Text>
      </View>
    );
  }

  const renderPlanCard = (plan, highlight) => {
    const isCurrent = currentPlanCode === plan.code;

    return (
      <VedicCard key={plan.code} style={[styles.planCard, highlight && styles.planCardHighlight]}>
        {highlight && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>BEST VALUE</Text>
          </View>
        )}

        <Text style={styles.planName}>{plan.displayName}</Text>
        {!!plan.description && <Text style={styles.planDesc}>{plan.description}</Text>}

        <View style={styles.planPriceRow}>
          <Text style={styles.planPrice}>{plan.price?.displayPrice || '—'}</Text>
          <Text style={styles.planPer}>
            {plan.billingInterval === 'yearly'
              ? '/year'
              : plan.billingInterval === 'monthly'
                ? '/month'
                : ''}
          </Text>
        </View>

        {plan.billingInterval === 'yearly' && (
          <Text style={styles.planNote}>Limits refresh every month, all year long</Text>
        )}

        <View style={styles.planFeatures}>
          {plan.features.map((f) => (
            <View key={f.featureKey} style={styles.planFeatureRow}>
              <Text style={styles.planFeatureTick}>✓</Text>
              <Text style={styles.planFeatureText}>{describeFeature(f)}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.planBtn, isCurrent && styles.planBtnCurrent]}
          onPress={() => !isCurrent && handlePurchase(plan)}
          disabled={isCurrent || !!purchasing}
          activeOpacity={0.85}
        >
          {purchasing === plan.code ? (
            <View style={styles.planBtnGradient}>
              <ActivityIndicator color={C.white} />
            </View>
          ) : isCurrent ? (
            <Text style={styles.planBtnCurrentText}>✓ Current Plan</Text>
          ) : (
            <LinearGradient
              colors={['#C9A45A', '#B8650A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.planBtnGradient}
            >
              <Text style={styles.planBtnText}>Get {plan.displayName}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </VedicCard>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={C.heroGradient} style={styles.header}>
        <Image source={BANNER} style={styles.headerBannerOverlay} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Image source={LOGO} style={styles.headerLogo} />
        </View>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <Text style={styles.headerSub}>Unlock the full power of Vedic wisdom</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Active subscription banner */}
        {isPremium && (
          <View style={styles.activeBanner}>
            <Text style={styles.activeBannerIcon}>✓</Text>
            <View style={styles.activeBannerText}>
              <Text style={styles.activeBannerTitle}>{status.plan.displayName} active</Text>
              {status.subscription?.expiresAt && (
                <Text style={styles.activeBannerSub}>
                  {status.subscription.willRenew ? 'Renews' : 'Access until'}{' '}
                  {formatDate(status.subscription.expiresAt)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Subscription plans */}
        {subscriptionPlans.map((plan) => renderPlanCard(plan, plan.billingInterval === 'yearly'))}

        {/* Add-on packs */}
        {addonPlans.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Need a top-up?</Text>
            <Text style={styles.sectionSub}>
              One-time boosts — valid for the day of purchase only.
            </Text>
            {addonPlans.map((plan) => renderPlanCard(plan, false))}
          </>
        )}

        {/* Free plan reference */}
        {freePlan && !isPremium && (
          <VedicCard style={styles.planCard}>
            <Text style={styles.planName}>{freePlan.displayName}</Text>
            {!!freePlan.description && <Text style={styles.planDesc}>{freePlan.description}</Text>}
            <View style={styles.planFeatures}>
              {freePlan.features.map((f) => (
                <View key={f.featureKey} style={styles.planFeatureRow}>
                  <Text style={styles.planFeatureTick}>✓</Text>
                  <Text style={styles.planFeatureText}>{describeFeature(f)}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.planNote}>
              {currentPlanCode === 'free' ? 'Your current plan' : 'Included for everyone'}
            </Text>
          </VedicCard>
        )}

        {/* Restore / manage */}
        {isPremium ? (
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={openManageSubscriptions}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#1C6EF2', '#1558C0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Manage Subscription</Text>
              <Text style={styles.ctaSub}>Cancel or change your plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={restoring}>
            {restoring ? (
              <ActivityIndicator size="small" color={C.textMuted} />
            ) : (
              <Text style={styles.restoreText}>Restore Previous Purchase</Text>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.legalNote}>
          {Platform.OS === 'ios'
            ? 'Subscriptions auto-renew unless cancelled 24h before the renewal date in Apple App Store Settings.'
            : 'Subscriptions auto-renew unless cancelled in Google Play Store before the renewal date.'}
          {'\n'}Add-on packs are one-time purchases valid for the day of purchase only.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg,
  },
  loadingText: { marginTop: spacing.md, color: C.textMuted, fontSize: fontSize.md },
  header: {
    paddingTop: Platform.OS === 'ios' ? 55 : 45,
    paddingBottom: 28,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerBannerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: 500, height: 500, resizeMode: 'cover', opacity: 0.8,
  },
  headerTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  headerLogo: {
    width: 36, height: 36, borderRadius: 8, resizeMode: 'contain',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  backBtn: {},
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.md },
  headerTitle: { fontSize: fontSize.h2, fontWeight: '800', color: C.white },
  headerSub: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  scroll: { padding: spacing.lg },

  // Active banner
  activeBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#22C55E',
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl,
  },
  activeBannerIcon: { fontSize: 28, marginRight: spacing.md, color: '#16A34A' },
  activeBannerText: { flex: 1 },
  activeBannerTitle: { fontSize: fontSize.lg, fontWeight: '800', color: '#15803D' },
  activeBannerSub: { fontSize: fontSize.sm, color: '#4ADE80', marginTop: 2 },

  // Section headings
  sectionTitle: {
    fontSize: fontSize.lg, fontWeight: '800', color: C.text,
    marginTop: spacing.md, marginBottom: 2,
  },
  sectionSub: { fontSize: fontSize.sm, color: C.textMuted, marginBottom: spacing.lg },

  // Plan cards
  planCard: {
    backgroundColor: C.white, marginBottom: spacing.xl,
    padding: spacing.xl, borderWidth: 0, ...shadow.md,
  },
  planCardHighlight: { borderWidth: 2, borderColor: '#C9A45A' },
  badge: {
    position: 'absolute', top: -10, alignSelf: 'center',
    backgroundColor: '#B8650A', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radius.md,
  },
  badgeText: { color: C.white, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  planName: { fontSize: fontSize.lg, fontWeight: '800', color: C.text },
  planDesc: { fontSize: fontSize.sm, color: C.textMuted, marginTop: 4, lineHeight: 18 },
  planPriceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.md },
  planPrice: { fontSize: fontSize.h2, fontWeight: '800', color: '#C9A45A' },
  planPer: { fontSize: fontSize.sm, color: C.textMuted, marginLeft: 4, marginBottom: 4 },
  planNote: { fontSize: 11, color: '#16A34A', marginTop: 4, fontWeight: '600' },
  planFeatures: { marginTop: spacing.lg, marginBottom: spacing.lg },
  planFeatureRow: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm,
  },
  planFeatureTick: {
    color: '#16A34A', fontSize: fontSize.md, fontWeight: '800',
    marginRight: spacing.sm, marginTop: 1,
  },
  planFeatureText: { flex: 1, fontSize: fontSize.sm, color: C.text, lineHeight: 19 },
  planBtn: { borderRadius: radius.xl, overflow: 'hidden' },
  planBtnGradient: {
    paddingVertical: 16, alignItems: 'center', paddingHorizontal: spacing.lg,
  },
  planBtnText: { color: C.white, fontSize: fontSize.md, fontWeight: '800' },
  planBtnCurrent: {
    backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#22C55E',
    paddingVertical: 16, alignItems: 'center',
  },
  planBtnCurrentText: { color: '#15803D', fontSize: fontSize.md, fontWeight: '800' },

  // CTA
  manageBtn: { borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.lg },
  ctaGradient: {
    paddingVertical: 20, alignItems: 'center', paddingHorizontal: spacing.lg,
  },
  ctaText: { color: C.white, fontSize: fontSize.lg, fontWeight: '800' },
  ctaSub: { color: 'rgba(255,255,255,0.75)', fontSize: fontSize.sm, marginTop: 3 },

  // Restore
  restoreBtn: {
    alignItems: 'center', paddingVertical: spacing.md, marginBottom: spacing.lg,
  },
  restoreText: { color: C.textMuted, fontSize: fontSize.sm, textDecorationLine: 'underline' },

  // Legal
  legalNote: {
    fontSize: 11, color: C.textMuted, textAlign: 'center',
    lineHeight: 17, paddingHorizontal: spacing.sm,
  },
});

export default PricingScreen;
