import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Image, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { VedicCard } from '../../components/VedicCard';
import api from '../../config/api';
import {
  getCustomerInfo,
  hasPro,
  getActiveProductId,
  getProExpiryDate,
  presentPaywall,
  presentCustomerCenter,
  restorePurchases,
  syncRevenueCatToBackend,
} from '../../config/revenuecat';

const LOGO = require('../../../assets/logo.jpeg');
const BANNER = require('../../../assets/banner.png');

const PRO_FEATURES = [
  { icon: '🔮', title: 'Unlimited AI Questions', desc: 'Ask as many Vedic questions as you need, every day.' },
  { icon: '📜', title: 'Full Birth Chart Analysis', desc: 'Deep Kundali readings with all 9 planets and 12 houses.' },
  { icon: '💕', title: 'Compatibility Reports', desc: 'Detailed Kundali Milan and Guna matching for relationships.' },
  { icon: '👶', title: 'Baby Name Generator', desc: 'Nakshatra-based name suggestions for your newborn.' },
  { icon: '📅', title: 'Monthly Rashifal', desc: 'Personalized monthly horoscope delivered to you.' },
  { icon: '💬', title: 'Extended Chat History', desc: 'Access your full conversation history, always.' },
];

const PLAN_LABEL = {
  monthly: 'Monthly',
  yearly: 'Yearly',
  lifetime: 'Lifetime',
};

const PricingScreen = ({ navigation }) => {
  const [isPro, setIsPro] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [expiryDate, setExpiryDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [pricingMap, setPricingMap] = useState({});

  useEffect(() => {
    loadStatus();
    api.get('/api/subscription/pricing')
      .then(({ data }) => {
        if (data.success && Array.isArray(data.data)) {
          const map = {};
          data.data.forEach((p) => { map[p.planId] = p; });
          setPricingMap(map);
        }
      })
      .catch(() => {});
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    const info = await getCustomerInfo();
    if (info) {
      setIsPro(hasPro(info));
      setActiveProduct(getActiveProductId(info));
      setExpiryDate(getProExpiryDate(info));
    }
    setLoading(false);
  };

  const handleGetPro = async () => {
    setPurchasing(true);
    const result = await presentPaywall();
    setPurchasing(false);

    if (result === 'purchased' || result === 'restored') {
      // Sync the new purchase to the custom backend immediately
      await syncRevenueCatToBackend();
      await loadStatus();
      Alert.alert(
        'Welcome to VedicScan Pro! 🎉',
        'Your cosmic journey is now fully unlocked.',
        [{ text: 'Start Exploring', onPress: () => navigation.goBack() }]
      );
    } else if (result === 'not_presented') {
      // Already has Pro — still sync in case backend is stale
      await syncRevenueCatToBackend();
      loadStatus();
    }
    // 'cancelled' and 'error' — do nothing, user is still on the screen
  };

  const handleRestore = async () => {
    setRestoring(true);
    const { success, customerInfo } = await restorePurchases();
    setRestoring(false);

    if (success && hasPro(customerInfo)) {
      // Push the restored subscription to the backend
      await syncRevenueCatToBackend();
      setIsPro(true);
      setActiveProduct(getActiveProductId(customerInfo));
      setExpiryDate(getProExpiryDate(customerInfo));
      Alert.alert('Restored!', 'Your VedicScan Pro subscription has been restored.');
    } else if (success) {
      Alert.alert('Nothing to Restore', 'No active purchases found for this account.');
    } else {
      Alert.alert('Restore Failed', 'Could not restore purchases. Please try again.');
    }
  };

  const formatExpiry = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.saffron} />
        <Text style={styles.loadingText}>Loading subscription info…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={C.heroGradient} style={styles.header}>
        <Image source={BANNER} style={styles.headerBannerOverlay} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Image source={LOGO} style={styles.headerLogo} />
        </View>
        <Text style={styles.headerTitle}>VedicScan Pro</Text>
        <Text style={styles.headerSub}>Unlock the full power of Vedic wisdom</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Active subscription banner */}
        {isPro && (
          <View style={styles.activeBanner}>
            <Text style={styles.activeBannerIcon}>✓</Text>
            <View style={styles.activeBannerText}>
              <Text style={styles.activeBannerTitle}>
                VedicScan Pro{activeProduct ? ` — ${PLAN_LABEL[activeProduct] ?? activeProduct}` : ''}
              </Text>
              {expiryDate && activeProduct !== 'lifetime' ? (
                <Text style={styles.activeBannerSub}>Renews {formatExpiry(expiryDate)}</Text>
              ) : activeProduct === 'lifetime' ? (
                <Text style={styles.activeBannerSub}>Lifetime access — never expires</Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Feature list */}
        <VedicCard style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Everything included in Pro</Text>
          {PRO_FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureName}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </VedicCard>

        {/* Pricing preview */}
        {!isPro && pricingMap.premium && (
          <VedicCard style={styles.priceCard}>
            <Text style={styles.priceCardTitle}>VedicScan Pro</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceItem}>
                <Text style={styles.priceAmount}>₹{pricingMap.premium.INR.monthly}<Text style={styles.pricePer}>/mo</Text></Text>
                <Text style={styles.priceLabel}>Monthly</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceItem}>
                <Text style={styles.priceAmount}>₹{pricingMap.premium.INR.annual}<Text style={styles.pricePer}>/yr</Text></Text>
                <Text style={styles.priceLabel}>Annual</Text>
              </View>
            </View>
            <Text style={styles.priceNote}>Final price selected in checkout · USD pricing also available</Text>
          </VedicCard>
        )}

        {/* CTA */}
        {!isPro ? (
          <>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={handleGetPro}
              disabled={purchasing}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#C9A45A', '#B8650A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                {purchasing ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <>
                    <Text style={styles.ctaText}>Unlock VedicScan Pro</Text>
                    <Text style={styles.ctaSub}>Monthly · Yearly · Lifetime — choose inside</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={handleRestore}
              disabled={restoring}
            >
              {restoring
                ? <ActivityIndicator size="small" color={C.textMuted} />
                : <Text style={styles.restoreText}>Restore Previous Purchase</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={presentCustomerCenter}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#1C6EF2', '#1558C0']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Manage Subscription</Text>
              <Text style={styles.ctaSub}>Cancel, upgrade, or request a refund</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Legal note */}
        <Text style={styles.legalNote}>
          {Platform.OS === 'ios'
            ? 'Subscriptions auto-renew unless cancelled 24h before the renewal date in Apple App Store Settings.'
            : 'Subscriptions auto-renew unless cancelled in Google Play Store before the renewal date.'}
          {'\n'}Prices are shown in the checkout screen.
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

  // Features card
  featuresCard: {
    backgroundColor: C.white, marginBottom: spacing.xl,
    padding: spacing.xl, borderWidth: 0, ...shadow.md,
  },
  featuresTitle: {
    fontSize: fontSize.lg, fontWeight: '800', color: C.text,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  featureIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFFDF8', alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md, flexShrink: 0,
  },
  featureIcon: { fontSize: 22 },
  featureText: { flex: 1 },
  featureName: { fontSize: fontSize.md, fontWeight: '700', color: C.text },
  featureDesc: { fontSize: fontSize.sm, color: C.textMuted, marginTop: 2, lineHeight: 18 },

  // Pricing preview card
  priceCard: {
    backgroundColor: C.white, marginBottom: spacing.xl,
    padding: spacing.lg, borderWidth: 0, ...shadow.md,
  },
  priceCardTitle: {
    fontSize: fontSize.md, fontWeight: '700', color: C.text,
    textAlign: 'center', marginBottom: spacing.md,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  priceItem: { flex: 1, alignItems: 'center' },
  priceAmount: { fontSize: fontSize.h2, fontWeight: '800', color: '#C9A45A' },
  pricePer: { fontSize: fontSize.sm, fontWeight: '400', color: C.textMuted },
  priceLabel: { fontSize: fontSize.xs ?? 11, color: C.textMuted, marginTop: 2 },
  priceDivider: { width: 1, height: 40, backgroundColor: C.border ?? '#E5E7EB', marginHorizontal: spacing.md },
  priceNote: {
    fontSize: 11, color: C.textMuted, textAlign: 'center',
    marginTop: spacing.md, lineHeight: 15,
  },

  // CTA
  ctaBtn: { borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.lg },
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
