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
  const [loading, setLoading] = useState(false);

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
      standard: { monthly: '₹299', annual: '₹2,999', symbol: '₹' },
      premium: { monthly: '₹999', annual: '₹9,999', symbol: '₹' },
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
    
    setLoading(true);
    try {
      const { data } = await api.post('/api/subscription/create-checkout-session', {
        plan: planId,
        billingCycle: 'monthly',
        currency: currency,
      });

      if (data.url) {
        // In a real mobile app, you'd use a WebView or In-App Browser
        // For now, alerting the URL or using Linking
        Alert.alert('Payment Redirect', 'Redirecting to secure payment page...', [
          { text: 'OK', onPress: () => Linking.openURL(data.url) }
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to initiate payment.');
    } finally {
      setLoading(false);
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
              activeOpacity={0.8}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <VedicCard
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.planSelected,
                  plan.featured && styles.planFeatured,
                ]}
              >
                <View style={styles.planInner}>
                  {plan.featured && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>MOST POPULAR</Text>
                    </View>
                  )}
                  <View style={styles.planHeader}>
                    <Text style={styles.planIcon}>{plan.icon}</Text>
                    <View>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <View style={styles.priceRow}>
                        <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                        <Text style={styles.planPeriod}>{plan.period}</Text>
                      </View>
                    </View>
                  </View>

                  <GoldBar />

                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Text style={styles.checkmark}>✓</Text>
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.subBtn}
                    onPress={() => handleSubscribe(plan.id)}
                  >
                    <LinearGradient
                      colors={plan.id === 'free' ? [C.textMuted, C.textMid] : ['#D4760A', '#B8860B']}
                      style={styles.gradBtn}
                    >
                      <Text style={styles.gradBtnText}>
                        {plan.id === 'free' ? 'Current Plan' : 'Subscribe'}
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
  planCard: { marginBottom: spacing.md },
  planSelected: { borderColor: C.saffron, borderWidth: 2 },
  planFeatured: { borderColor: C.saffron },
  planInner: { padding: spacing.lg },
  badge: {
    backgroundColor: C.saffron, borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: spacing.sm,
  },
  badgeText: { color: C.white, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  planIcon: { fontSize: 36 },
  planName: { fontSize: fontSize.xl, fontWeight: '700', color: C.text },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { fontSize: fontSize.h3, fontWeight: '800' },
  planPeriod: { fontSize: fontSize.sm, color: C.textMuted, marginLeft: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  checkmark: { color: C.green, fontWeight: '700', fontSize: fontSize.md, marginRight: spacing.sm, width: 20 },
  featureText: { fontSize: fontSize.md, color: C.textMid },
  subBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.md },
  gradBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: radius.md },
  gradBtnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.lg,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  toggleBtnActive: {
    backgroundColor: C.white,
    ...shadow.sm,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: C.textMuted,
  },
  toggleTextActive: {
    color: C.text,
  },
});

export default PricingScreen;
