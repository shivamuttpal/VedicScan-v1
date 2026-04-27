import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { SIGNS } from '../../data/signs';

const { width } = Dimensions.get('window');

// ── Helper: Determine Rashi based on DOB (Sun sign ranges) ──
const determineRashi = (dateStr) => {
  if (!dateStr) return 'Mesh';
  const date = new Date(dateStr);
  const m = date.getMonth() + 1;
  const d = date.getDate();

  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return 'Mesh';
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return 'Vrishabh';
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return 'Mithun';
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return 'Kark';
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return 'Simha';
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return 'Kanya';
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return 'Tula';
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return 'Vrishchik';
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return 'Dhanu';
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return 'Makar';
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return 'Kumbh';
  if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) return 'Meen';
  return 'Mesh';
};

// ── Helper: format today's date as "Wednesday, 22 April" ──
const formatDate = () => {
  const d = new Date();
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

// ── Feature list items (list-style, not grid) ──
const FEATURES = [
  {
    id: 'chat',
    icon: '✨',
    title: 'Maharshi AI',
    badge: 'AI Powered',
    badgeColor: '#1A7D4E',
    badgeBg: '#D4EFDF',
    desc: 'Chat with your personal Vedic AI astrologer',
    route: 'Chat',
    iconBg: '#FFF3E0',
    iconColor: '#C8660A',
  },
  {
    id: 'baby',
    icon: '👶',
    title: 'Baby Naming',
    badge: 'Vedic + Modern',
    badgeColor: '#0B7060',
    badgeBg: '#D0F0EA',
    desc: 'Discover auspicious names by Nakshatra & Rashi',
    route: 'BabyNaming',
    iconBg: '#D0F0EA',
    iconColor: '#0B7060',
  },
  {
    id: 'kundali',
    icon: '💕',
    title: 'Kundali Matching',
    badge: '36 Gunas',
    badgeColor: '#7B1A38',
    badgeBg: '#F2D8E0',
    desc: 'Ashtakoot compatibility & gun milan analysis',
    route: 'Compatibility',
    iconBg: '#F2D8E0',
    iconColor: '#7B1A38',
  },
  {
    id: 'insights',
    icon: '📊',
    title: 'My Kundali',
    badge: 'Charts',
    badgeColor: '#6C3FA0',
    badgeBg: '#EDE3F7',
    desc: 'Planetary chart, Dasha timeline & insights',
    route: 'Insights',
    iconBg: '#EDE3F7',
    iconColor: '#6C3FA0',
  },
];

// ── User's active Rashi (comes from profile) ──
const USER_RASHI = SIGNS[0]; // Mesh/Aries for demo

const HomeScreen = ({ navigation }) => {
  const { user, hasProfile, isAuthenticated, refreshProfileStatus } = useAuth();
  const [predictions, setPredictions] = useState({});
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSignName, setSelectedSignName] = useState('Mesh');
  const [defaultProfile, setDefaultProfile] = useState(null);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadRashifal();
        fetchDefaultProfile();
      }
    }, [isAuthenticated])
  );

  const loadRashifal = async () => {
    try {
      setLoadingPredictions(true);
      const res = await api.get('/api/rashifal');
      if (res.data?.success) {
        const predMap = {};
        res.data.data.forEach((p) => {
          predMap[p.sign] = p.prediction;
        });
        setPredictions(predMap);
      }
    } catch (err) {
      console.log('Rashifal not available:', err?.message);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const fetchDefaultProfile = async () => {
    try {
      const res = await api.get('/api/profiles/default');
      if (res.data) {
        setDefaultProfile(res.data);
        const rashi = determineRashi(res.data.dateOfBirth);
        setSelectedSignName(rashi);
      }
    } catch (err) {
      console.log('Failed to fetch default profile:', err?.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfileStatus();
    await loadRashifal();
    await fetchDefaultProfile();
    setRefreshing(false);
  };

  const handleFeaturePress = (route) => {
    if (!hasProfile) {
      navigation.navigate('Profile', {
        setup: true,
      });
      return;
    }
    navigation.navigate(route);
  };

  const firstName = defaultProfile?.name || user?.firstName || 'Arjun';
  const selectedSign = SIGNS.find((s) => s.rashi === selectedSignName) || SIGNS[0];
  const insightText =
    predictions[selectedSignName] ||
    'The alignment of the planets favors a balanced approach for your sign today. Trust your intuition.';

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C8660A"
          />
        }
      >
        {/* ── HERO ── */}
        <LinearGradient
          colors={['#6E1532', '#7B1A38', '#8B2040']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroDate}>{formatDate()}</Text>
              <View style={styles.greetingRow}>
                <Text style={styles.heroGreeting}>
                  Namaste, {firstName} {'🙏'}
                </Text>
                {user?.isSubscriber && (
                  <LinearGradient
                    colors={['#FFD700', '#D4AF37']}
                    style={styles.premiumBadge}
                  >
                    <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                  </LinearGradient>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.profileBtnIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroTagline}>{'✨'} Ancient wisdom for modern life</Text>

          {/* Profile setup warning */}
          {isAuthenticated && !hasProfile && (
            <TouchableOpacity
              style={styles.profileWarning}
              onPress={() =>
                navigation.navigate('Profile', {
                  setup: true,
                })
              }
              activeOpacity={0.85}
            >
              <Text style={styles.warningIcon}>{'⚠️'}</Text>
              <View style={styles.warningBody}>
                <Text style={styles.warningTitle}>Profile setup required</Text>
                <Text style={styles.warningDesc}>
                  Create your birth profile to unlock all features
                </Text>
              </View>
              <Text style={styles.warningArrow}>{'→'}</Text>
            </TouchableOpacity>
          )}

          {/* Maharishi AI Hero Button */}
          <TouchableOpacity
            style={styles.heroAiBtn}
            onPress={() => navigation.navigate('Chat')}
            activeOpacity={0.9}
          >
            <View style={styles.heroAiBtnInner}>
              <View style={styles.heroAiIconBox}>
                <Image 
                  source={{ uri: 'https://customer-assets.emergentagent.com/job_vedicscan/artifacts/fyeynkm9_image.png' }}
                  style={{ width: 32, height: 32, resizeMode: 'contain' }}
                />
              </View>
              <View style={styles.heroAiTextContent}>
                <Text style={styles.heroAiBtnLabel}>DIVINE GUIDANCE</Text>
                <Text style={styles.heroAiBtnTitle}>ASK MAHARISHI AI</Text>
              </View>
              <Text style={styles.heroAiArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── RASHI CARD (overlaps hero bottom) ── */}
        <View style={styles.rashiCardWrap}>
          <View style={styles.rashiCard}>
            {/* Gold top bar */}
            <View style={styles.rashiCardGoldBar} />

            {/* Rashi identity row */}
            <View style={styles.rashiIdentityRow}>
              {/* Zodiac symbol icon */}
              <View style={styles.rashiIconBox}>
                <Text style={styles.rashiIconSym}>{selectedSign.sym}</Text>
              </View>

              {/* Name + tags */}
              <View style={styles.rashiInfo}>
                <View style={styles.rashiNameRow}>
                  <Text style={styles.rashiName}>{selectedSign.rashi}</Text>
                  <Text style={styles.rashiDot}> · </Text>
                  <Text style={styles.rashiZodiac}>{selectedSign.zodiac}</Text>
                </View>
                <View style={styles.rashiTagRow}>
                  <View style={[styles.rashiTag, styles.rashiTagMars]}>
                    <Text style={[styles.rashiTagText, { color: '#C0392B' }]}>
                      Lord: {selectedSign.lord}
                    </Text>
                  </View>
                  <View style={[styles.rashiTag, styles.rashiTagFire]}>
                    <Text style={[styles.rashiTagText, { color: '#C8660A' }]}>
                      {selectedSign.el} {selectedSign.icon}
                    </Text>
                  </View>
                  <Text style={styles.rashiDev}>{selectedSign.rashiDev}</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.rashiDivider} />

            {/* Today's insight */}
            <View style={styles.insightBox}>
              <Text style={styles.insightLabel}>TODAY'S INSIGHT</Text>
              <Text style={styles.insightText}>{insightText}</Text>
            </View>
          </View>
        </View>

        {/* ── DAILY RASHIFAL ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DAILY RASHIFAL</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rashiScrollContent}
          >
            {SIGNS.map((sg) => (
              <TouchableOpacity
                key={sg.rashi}
                style={[
                  styles.rashiChip,
                  selectedSignName === sg.rashi && styles.rashiChipActive,
                ]}
                onPress={() => setSelectedSignName(sg.rashi)}
                activeOpacity={0.75}
              >
                <Text style={styles.rashiChipSym}>{sg.sym}</Text>
                <Text
                  style={[
                    styles.rashiChipName,
                    selectedSignName === sg.rashi && styles.rashiChipNameActive,
                  ]}
                >
                  {sg.rashi}
                </Text>
                <Text style={styles.rashiChipZodiac}>{sg.zodiac}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Gold accent line */}
          <View style={styles.rashiGoldLine} />
        </View>

        {/* ── EXPLORE FEATURES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EXPLORE FEATURES</Text>
          <View style={styles.featureList}>
            {FEATURES.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.featureRow}
                onPress={() => handleFeaturePress(f.route)}
                activeOpacity={0.78}
              >
                {/* Icon */}
                <View style={[styles.featureIcon, { backgroundColor: f.iconBg }]}>
                  <Text style={styles.featureIconText}>{f.icon}</Text>
                </View>

                {/* Text block */}
                <View style={styles.featureTextBlock}>
                  <View style={styles.featureTitleRow}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <View
                      style={[
                        styles.featureBadge,
                        { backgroundColor: f.badgeBg },
                      ]}
                    >
                      <Text
                        style={[styles.featureBadgeText, { color: f.badgeColor }]}
                      >
                        {f.badge}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>

                {/* Arrow */}
                <Text style={styles.featureArrow}>{'›'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── PREMIUM CTA ── */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Pricing')}
            activeOpacity={0.85}
            style={styles.premiumBtn}
          >
            <LinearGradient
              colors={['#7B1A38', '#4A0E22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumGrad}
            >
              <Text style={styles.premiumIcon}>{'👑'}</Text>
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>Unlock Premium</Text>
                <Text style={styles.premiumDesc}>
                  Unlimited chats, detailed charts & more
                </Text>
              </View>
              <Text style={styles.premiumArrow}>{'→'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Floating Maharishi AI Button */}
      <Animated.View style={[styles.floatingAiWrap, { transform: [{ translateY: bounceAnim }] }]}>
        <TouchableOpacity
          style={styles.floatingAiBtn}
          onPress={() => navigation.navigate('Chat')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[C.saffron, C.maroon]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.floatingAiGrad}
          >
            <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 4, marginRight: 4 }}>
              <Image 
                source={{ uri: 'https://customer-assets.emergentagent.com/job_vedicscan/artifacts/fyeynkm9_image.png' }}
                style={{ width: 24, height: 24, resizeMode: 'contain' }}
              />
            </View>
            <View>
              <Text style={styles.floatingAiLabel}>AI GURU</Text>
              <Text style={styles.floatingAiTitle}>Ask Maharishi</Text>
            </View>
          </LinearGradient>
          {/* Notification Dot */}
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ──────────────────────────────────────────
// STYLES
// ──────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9F3EB',
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // ── HERO ──
  hero: {
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 64,
    paddingHorizontal: 24,
  },
  heroDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    marginBottom: 6,
  },
  heroGreeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#332200',
    letterSpacing: 0.5,
  },
  heroTagline: {
    fontSize: 13,
    color: '#D4BA80',
    fontWeight: '500',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileBtnIcon: {
    fontSize: 22,
  },

  // Profile warning
  profileWarning: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,118,10,0.18)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,118,10,0.35)',
  },
  warningIcon: { fontSize: 18, marginRight: 10 },
  warningBody: { flex: 1 },
  warningTitle: { color: '#D4760A', fontWeight: '700', fontSize: 14 },
  warningDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 1 },
  warningArrow: { color: '#D4760A', fontSize: 18, fontWeight: '700' },

  // ── RASHI CARD ──
  rashiCardWrap: {
    marginTop: -40,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  rashiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#2C1E12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  rashiCardGoldBar: {
    height: 3,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(90deg, transparent, #D4BA80, #C8660A, #D4BA80, transparent)',
    // For React Native, use a View with gold color:
    backgroundColor: '#D4BA80',
  },
  rashiIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    gap: 16,
  },
  rashiIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#EDE3F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9CFF0',
  },
  rashiIconSym: {
    fontSize: 26,
    color: '#6C3FA0',
  },
  rashiInfo: {
    flex: 1,
  },
  rashiNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  rashiName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C1E12',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  rashiDot: {
    fontSize: 16,
    color: '#9A8878',
  },
  rashiZodiac: {
    fontSize: 14,
    color: '#9A8878',
    fontWeight: '400',
  },
  rashiTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  rashiTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  rashiTagMars: {
    backgroundColor: '#FADBD8',
  },
  rashiTagFire: {
    backgroundColor: '#FFF3E0',
  },
  rashiTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rashiDev: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C8660A',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  rashiDivider: {
    height: 1,
    backgroundColor: '#F0E8DE',
    marginHorizontal: 16,
  },
  insightBox: {
    backgroundColor: '#FFF7ED',
    margin: 12,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#C8660A',
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C8660A',
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: 14,
    color: '#2C1E12',
    lineHeight: 21,
    fontWeight: '400',
  },

  // ── SECTION WRAPPER ──
  section: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B5040',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // ── DAILY RASHIFAL HORIZONTAL SCROLL ──
  rashiScrollContent: {
    paddingRight: 16,
    gap: 10,
  },
  rashiChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DFD2',
    minWidth: 68,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rashiChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#C8660A',
    borderWidth: 2,
  },
  rashiChipSym: {
    fontSize: 22,
    marginBottom: 4,
  },
  rashiChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1E12',
    marginBottom: 1,
  },
  rashiChipNameActive: {
    color: '#C8660A',
  },
  rashiChipZodiac: {
    fontSize: 10,
    color: '#9A8878',
    fontWeight: '400',
  },
  rashiGoldLine: {
    height: 2.5,
    backgroundColor: '#D4BA80',
    borderRadius: 2,
    marginTop: 14,
    opacity: 0.5,
  },

  // ── FEATURE LIST ──
  featureList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E8DFD2',
    shadowColor: '#2C1E12',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  featureIconText: {
    fontSize: 22,
  },
  featureTextBlock: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C1E12',
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  featureDesc: {
    fontSize: 12,
    color: '#9A8878',
    lineHeight: 17,
  },
  featureArrow: {
    fontSize: 22,
    color: '#C4B8AC',
    fontWeight: '300',
    flexShrink: 0,
  },

  // ── PREMIUM CTA ──
  premiumBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  premiumGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  premiumIcon: {
    fontSize: 26,
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  premiumDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  premiumArrow: {
    color: '#D4BA80',
    fontSize: 22,
    fontWeight: '600',
  },

  // ── MAHARISHI AI HIGHLIGHTS ──
  heroAiBtn: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    ...shadow.lg,
    overflow: 'hidden',
  },
  heroAiBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
  },
  heroAiIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#F5DFC5',
  },
  heroAiIcon: {
    fontSize: 24,
  },
  heroAiTextContent: {
    flex: 1,
  },
  heroAiBtnLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#D4760A',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  heroAiBtnTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7B1A38',
    letterSpacing: 0.5,
  },
  heroAiArrow: {
    fontSize: 24,
    color: '#7B1A38',
    fontWeight: 'bold',
    marginLeft: 8,
  },

  floatingAiWrap: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 100,
  },
  floatingAiBtn: {
    borderRadius: 30,
    ...shadow.lg,
    shadowColor: '#7B1A38',
    shadowOpacity: 0.4,
  },
  floatingAiGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingRight: 24,
    borderRadius: 30,
    gap: 12,
  },
  floatingAiIcon: {
    fontSize: 28,
    marginLeft: 4,
  },
  floatingAiLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F5DFC5',
    letterSpacing: 1.5,
    marginBottom: 1,
  },
  floatingAiTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D4BA80',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

});

export default HomeScreen;