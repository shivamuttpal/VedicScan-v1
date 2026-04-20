import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { VedicCard, GoldBar } from '../../components/VedicCard';
import api from '../../config/api';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'Forever',
    icon: '🌱',
    features: ['5 AI chats / day', 'Basic Rashifal', '1 profile'],
    color: '#6B5040',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹299',
    period: '/month',
    icon: '⭐',
    features: ['50 AI chats / day', 'Detailed Rashifal', '5 profiles', 'Compatibility analysis', 'Baby naming'],
    featured: true,
    color: '#D4760A',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹799',
    period: '/month',
    icon: '👑',
    features: ['Unlimited chats', 'All features', '10 profiles', 'Priority support', 'Advanced charts'],
    color: '#7B1A38',
  },
];

const PricingScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const handleSubscribe = async (planId) => {
    Alert.alert('Coming Soon', 'Subscription payments will be available soon!');
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
});

export default PricingScreen;
