import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  RefreshControl, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VedicCard } from '../../components/VedicCard';
import api from '../../config/api';
import { SIGNS } from '../../data/signs';

const { width } = Dimensions.get('window');

const FEATURES = [
  { id: 'chat', icon: '🔮', title: 'Ask Maharshi', desc: 'AI-powered Vedic guidance', route: 'Chat', color: '#7B1A38' },
  { id: 'compat', icon: '💕', title: 'Compatibility', desc: 'Kundli Milan analysis', route: 'Compatibility', color: '#D4760A' },
  { id: 'baby', icon: '👶', title: 'Baby Names', desc: 'Astr\u200bologically aligned names', route: 'BabyNaming', color: '#0C7C6B' },
  { id: 'insights', icon: '📊', title: 'Insights', desc: 'Kundli & planetary chart', route: 'Insights', color: '#6C3FA0' },
];

const HomeScreen = ({ navigation }) => {
  const { user, hasProfile, isAuthenticated, refreshProfileStatus } = useAuth();
  const [rashifal, setRashifal] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Pulse animation for OM symbol
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadRashifal();
    }
  }, [isAuthenticated]);

  const loadRashifal = async () => {
    try {
      const res = await api.get('/api/rashifal?rashi=Mesh&period=daily');
      if (res.data) setRashifal(res.data);
    } catch (err) {
      console.log('Rashifal not available:', err?.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfileStatus();
    await loadRashifal();
    setRefreshing(false);
  };

  const handleFeaturePress = (route) => {
    if (!hasProfile && route !== 'Pricing') {
      navigation.navigate('ProfileTab', { screen: 'ProfileMain', params: { setup: true } });
      return;
    }
    // Navigate to the screen — for features in a stack
    navigation.navigate(route);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.saffron} />}
      >
        {/* Hero Section */}
        <LinearGradient colors={C.heroGradient} style={styles.hero}>
          {/* Orbital Rings (decorative) */}
          <View style={styles.orbitalContainer}>
            <View style={[styles.orbit, styles.orbit1]} />
            <View style={[styles.orbit, styles.orbit2]} />
            <View style={[styles.orbit, styles.orbit3]} />
            <Animated.View style={[styles.omContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.omSymbol}>ॐ</Text>
            </Animated.View>
          </View>

          <Text style={styles.brandText}>
            Vedic<Text style={styles.brandAccent}>Scan</Text>
          </Text>
          <Text style={styles.heroSubtitle}>ANCIENT WISDOM · MODERN AI</Text>

          {isAuthenticated && user && (
            <Text style={styles.greeting}>
              Namaste, {user.firstName || 'Seeker'} 🙏
            </Text>
          )}

          {/* Profile Warning */}
          {isAuthenticated && !hasProfile && (
            <TouchableOpacity
              style={styles.profileWarning}
              onPress={() => navigation.navigate('ProfileTab', { screen: 'ProfileMain', params: { setup: true } })}
              activeOpacity={0.8}
            >
              <Text style={styles.warningIcon}>⚠️</Text>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Profile Setup Required</Text>
                <Text style={styles.warningDesc}>Create your birth profile to unlock all cosmic features</Text>
              </View>
              <Text style={styles.warningArrow}>→</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Features Grid */}
        <View style={styles.body}>
          <Text style={styles.sectionTitle}>✨ Cosmic Tools</Text>
          <View style={styles.grid}>
            {FEATURES.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.featureCard}
                onPress={() => handleFeaturePress(f.route)}
                activeOpacity={0.7}
              >
                <VedicCard style={styles.featureInner}>
                  <View style={styles.featurePad}>
                    <View style={[styles.iconCircle, { backgroundColor: f.color + '15' }]}>
                      <Text style={styles.featureIcon}>{f.icon}</Text>
                    </View>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                </VedicCard>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Rashifal Preview */}
          <TouchableOpacity
            style={styles.rashifalPreview}
            onPress={() => navigation.navigate('Rashifal')}
            activeOpacity={0.7}
          >
            <VedicCard style={{ overflow: 'hidden' }}>
              <LinearGradient
                colors={['#FFF7ED', '#FFFBF0']}
                style={styles.rashifalInner}
              >
                <View style={styles.rashifalHeader}>
                  <Text style={styles.rashifalTitle}>☀️ Today's Rashifal</Text>
                  <Text style={styles.rashifalLink}>View All →</Text>
                </View>
                <Text style={styles.rashifalHint}>
                  Check your daily horoscope based on your Rashi
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rashiRow}>
                  {SIGNS.slice(0, 6).map((s, i) => (
                    <View key={i} style={styles.miniRashi}>
                      <Text style={styles.miniSym}>{s.sym}</Text>
                      <Text style={styles.miniName}>{s.rashi}</Text>
                    </View>
                  ))}
                  <View style={styles.moreRashi}>
                    <Text style={styles.moreText}>+6</Text>
                  </View>
                </ScrollView>
              </LinearGradient>
            </VedicCard>
          </TouchableOpacity>

          {/* Pricing CTA */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Pricing')}
            activeOpacity={0.8}
            style={styles.pricingCTA}
          >
            <LinearGradient
              colors={['#7B1A38', '#4A0E22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pricingInner}
            >
              <Text style={styles.pricingIcon}>👑</Text>
              <View style={styles.pricingTextWrap}>
                <Text style={styles.pricingTitle}>Unlock Premium Features</Text>
                <Text style={styles.pricingDesc}>Unlimited chats, detailed charts & more</Text>
              </View>
              <Text style={styles.pricingArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  hero: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  orbitalContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  orbit: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(184,134,11,0.2)',
  },
  orbit1: { width: 100, height: 100 },
  orbit2: { width: 130, height: 130, borderColor: 'rgba(184,134,11,0.12)' },
  orbit3: { width: 160, height: 160, borderColor: 'rgba(184,134,11,0.06)' },
  omContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(184,134,11,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  omSymbol: { fontSize: 30, color: C.goldBorder },
  brandText: { fontSize: fontSize.h1, fontWeight: '800', color: C.white, marginBottom: 2 },
  brandAccent: { color: C.saffron },
  heroSubtitle: { fontSize: fontSize.xs, color: C.goldBorder, letterSpacing: 3, marginBottom: spacing.md },
  greeting: { fontSize: fontSize.lg, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  profileWarning: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,118,10,0.15)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212,118,10,0.3)',
    width: '100%',
  },
  warningIcon: { fontSize: 20, marginRight: spacing.sm },
  warningContent: { flex: 1 },
  warningTitle: { color: C.saffron, fontWeight: '700', fontSize: fontSize.md },
  warningDesc: { color: 'rgba(255,255,255,0.5)', fontSize: fontSize.sm },
  warningArrow: { color: C.saffron, fontSize: 18, fontWeight: '700' },
  body: { padding: spacing.lg },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: '700', color: C.text, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { width: (width - 56) / 2, marginBottom: spacing.md },
  featureInner: {},
  featurePad: { padding: spacing.md, alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  featureIcon: { fontSize: 22 },
  featureTitle: { fontSize: fontSize.md, fontWeight: '700', color: C.text, marginBottom: 2 },
  featureDesc: { fontSize: fontSize.xs, color: C.textMuted, textAlign: 'center' },
  rashifalPreview: { marginTop: spacing.md, marginBottom: spacing.md },
  rashifalInner: { padding: spacing.md },
  rashifalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  rashifalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: C.text },
  rashifalLink: { fontSize: fontSize.sm, color: C.saffron, fontWeight: '600' },
  rashifalHint: { fontSize: fontSize.sm, color: C.textMuted, marginBottom: spacing.md },
  rashiRow: { flexDirection: 'row' },
  miniRashi: { alignItems: 'center', marginRight: 14 },
  miniSym: { fontSize: 22 },
  miniName: { fontSize: fontSize.xs, color: C.textMid, marginTop: 2 },
  moreRashi: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.saffronSoft, justifyContent: 'center', alignItems: 'center',
  },
  moreText: { fontSize: fontSize.sm, fontWeight: '700', color: C.saffron },
  pricingCTA: { marginTop: spacing.md, borderRadius: radius.lg, overflow: 'hidden' },
  pricingInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg },
  pricingIcon: { fontSize: 26, marginRight: spacing.md },
  pricingTextWrap: { flex: 1 },
  pricingTitle: { color: C.white, fontWeight: '700', fontSize: fontSize.lg },
  pricingDesc: { color: 'rgba(255,255,255,0.6)', fontSize: fontSize.sm },
  pricingArrow: { color: C.goldBorder, fontSize: 22, fontWeight: '700' },
});

export default HomeScreen;
