import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { VedicCard, GoldBar } from '../../components/VedicCard';
import api from '../../config/api';

const PricingScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [currency, setCurrency] = useState('INR');
  const [processingPlanId, setProcessingPlanId] = useState(null);

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.country_code !== 'IN') {
        setCurrency('USD');
      }
    } catch (error) {
      console.log('Location detection failed', error);
    }
  };

  const prices = {
    INR: {
      standard: { monthly: '₹1', annual: '₹2,999', symbol: '₹' },
      premium: { monthly: '₹1', annual: '₹9,999', symbol: '₹' },
    },
    USD: {
      standard: { monthly: '$29', annual: '$290', symbol: '$' },
      premium: { monthly: '$99', annual: '$990', symbol: '$' },
    }
  };

  const PLANS = [
    {
      id: 'free',
      name: 'Free',
      price: currency === 'INR' ? '₹0' : '$0',
      period: 'Forever',
      icon: '🌱',
      features: ['3 AI questions / day', 'Basic profile', 'Daily insights'],
      color: '#6B5040',
    },
    {
      id: 'standard',
      name: 'Standard',
      price: prices[currency].standard.monthly,
      period: '/month',
      icon: '⭐',
      features: ['11 AI questions / day', 'Priority support', 'Advanced predictions', 'Chat history saved'],
      featured: true,
      color: '#D4760A',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: prices[currency].premium.monthly,
      period: '/month',
      icon: '👑',
      features: ['51 AI questions / day', 'Everything in Standard', 'Monthly reports', 'Real astrologer review'],
      color: '#7B1A38',
    },
  ];

  const handleSubscribe = async (planId) => {
    if (planId === 'free') return;

    setProcessingPlanId(planId);
    try {
      const { data } = await api.post('/api/subscription/create-checkout-session', {
        plan: planId,
        billingCycle: 'monthly',
        currency: currency,
      });

      if (data.url) {
        Alert.alert('Payment Redirect', 'Redirecting to secure payment page...', [
          { text: 'OK', onPress: () => Linking.openURL(data.url) }
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to initiate payment.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={C.heroGradient} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💎 Choose Your Plan</Text>
        <Text style={styles.headerSub}>Unlock the full power of Vedic wisdom</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* Currency Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, currency === 'INR' && styles.toggleBtnActive]}
              onPress={() => setCurrency('INR')}
            >
              <Text style={[styles.toggleText, currency === 'INR' && styles.toggleTextActive]}>🇮🇳 INR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, currency === 'USD' && styles.toggleBtnActive]}
              onPress={() => setCurrency('USD')}
            >
              <Text style={[styles.toggleText, currency === 'USD' && styles.toggleTextActive]}>🌐 USD</Text>
            </TouchableOpacity>
          </View>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              activeOpacity={0.9}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <VedicCard
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.planSelected,
                  plan.featured && styles.planFeatured,
                ]}
              >
                {plan.featured && (
                  <LinearGradient
                    colors={['#D4760A', '#B8860B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.featuredBadge}
                  >
                    <Text style={styles.featuredBadgeText}>✨ MOST POPULAR ✨</Text>
                  </LinearGradient>
                )}

                <View style={styles.planInner}>
                  <View style={styles.planHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: plan.color + '15' }]}>
                      <Text style={styles.planIcon}>{plan.icon}</Text>
                    </View>
                    <View style={styles.planTitleContainer}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <View style={styles.priceRow}>
                        <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                        <Text style={styles.planPeriod}>{plan.period}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.featuresList}>
                    {plan.features.map((f, i) => (
                      <View key={i} style={styles.featureRow}>
                        <View style={[styles.checkCircle, { backgroundColor: C.green + '15' }]}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.subBtn}
                    onPress={() => handleSubscribe(plan.id)}
                    disabled={!!processingPlanId}
                  >
                    <LinearGradient
                      colors={plan.id === 'free' ? ['#F3F4F6', '#E5E7EB'] : [plan.color, plan.color + 'CC']}
                      style={styles.gradBtn}
                    >
                      <Text style={[styles.gradBtnText, plan.id === 'free' && { color: C.textMuted }]}>
                        {plan.id === 'free'
                          ? 'Your Current Plan'
                          : processingPlanId === plan.id
                            ? 'Processing...'
                            : 'Get Started Now'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </VedicCard>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { marginBottom: spacing.sm },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.md },
  headerTitle: { fontSize: fontSize.h3, fontWeight: '700', color: C.white },
  headerSub: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.6)' },
  body: { padding: spacing.lg },
  planCard: {
    marginBottom: spacing.xl,
    backgroundColor: C.white,
    borderWidth: 0,
    ...shadow.md,
  },
  planSelected: {
    borderColor: C.saffron,
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  planFeatured: {
    borderColor: C.saffron,
  },
  featuredBadge: {
    paddingVertical: 6,
    alignItems: 'center',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  featuredBadgeText: {
    color: C.white,
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  planInner: { padding: spacing.xl },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planIcon: { fontSize: 30 },
  planTitleContainer: { flex: 1 },
  planName: { fontSize: fontSize.xl, fontWeight: '800', color: C.text },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  planPrice: { fontSize: fontSize.h3, fontWeight: '900' },
  planPeriod: { fontSize: fontSize.sm, color: C.textMuted, marginLeft: 4 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: spacing.xl,
  },
  featuresList: { marginBottom: spacing.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkmark: { color: C.green, fontWeight: '800', fontSize: fontSize.sm },
  featureText: { fontSize: fontSize.md, color: C.textMid, flex: 1 },
  subBtn: { borderRadius: radius.lg, overflow: 'hidden' },
  gradBtn: { paddingVertical: 16, alignItems: 'center' },
  gradBtnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '800' },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.xl,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  toggleBtnActive: {
    backgroundColor: C.white,
    ...shadow.sm,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: C.textMuted,
  },
  toggleTextActive: {
    color: C.text,
  },
});

export default PricingScreen;
