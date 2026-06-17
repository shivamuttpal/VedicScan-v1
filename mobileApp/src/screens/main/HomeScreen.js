import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Animated,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../config/api';
import { SIGNS, LORD_HI, EL_HI } from '../../data/signs';

const LOGO = require('../../../assets/logo.jpeg');
const BANNER = require('../../../assets/bannerbackground5.webp');


// Maps English planet sign names (from vedic_engine.py) to Sanskrit Rashifal names
const VEDIC_RASHI_MAP = {
  'Aries': 'Mesh', 'Taurus': 'Vrishabh', 'Gemini': 'Mithun',
  'Cancer': 'Kark', 'Leo': 'Simha', 'Virgo': 'Kanya',
  'Libra': 'Tula', 'Scorpio': 'Vrishchik', 'Sagittarius': 'Dhanu',
  'Capricorn': 'Makar', 'Aquarius': 'Kumbh', 'Pisces': 'Meen',
};

// ── Helper: format today's date as "THURSDAY 7 MAY" ──
const formatDate = () => {
  const d = new Date();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  return `${weekday} ${day} ${month}`;
};


const HomeScreen = ({ navigation }) => {
  const { user, hasProfile, isAuthenticated, refreshProfileStatus } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [predictions, setPredictions] = useState({});
  const [predictionsHi, setPredictionsHi] = useState({});
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSignName, setSelectedSignName] = useState('Mesh');
  const [defaultProfile, setDefaultProfile] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-width * 0.78)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, { toValue: -width * 0.78, duration: 220, useNativeDriver: true })
      .start(() => setDrawerOpen(false));
  };

  // Routes that live in the RootStack (above the tab bar) — everything else is a tab switch
  const STACK_ROUTES = new Set(['Compatibility', 'BabyNaming', 'Kundali', 'Pricing', 'Subscription', 'PaymentSuccess']);

  const goTo = (route) => {
    const parent = navigation.getParent();
    if (parent && STACK_ROUTES.has(route)) {
      parent.navigate(route);
    } else {
      navigation.navigate(route);
    }
  };

  const navigateTo = (route) => {
    closeDrawer();
    setTimeout(() => goTo(route), 240);
  };

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
        const predMapHi = {};
        res.data.data.forEach((p) => {
          predMap[p.sign] = p.prediction;
          if (p.predictionHi) predMapHi[p.sign] = p.predictionHi;
        });
        setPredictions(predMap);
        setPredictionsHi(predMapHi);
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
      if (!res.data) return;
      setDefaultProfile(res.data);

      // Calculate true Vedic Janma Rashi (Moon sign, sidereal Lahiri Ayanamsa)
      try {
        const chartRes = await api.post('/api/chart/calculate', {
          dateOfBirth: res.data.dateOfBirth,
          timeOfBirth: res.data.timeOfBirth || '12:00',
          placeOfBirth: res.data.placeOfBirth,
          timezoneOffset: 5.5,
        });
        if (chartRes.data?.success) {
          const rashiEN = chartRes.data.moon.sign_vedic;
          setSelectedSignName(VEDIC_RASHI_MAP[rashiEN] || 'Mesh');
        }
      } catch {
        // Fallback: keep default Mesh if chart calculation fails
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
      navigation.navigate('ProfileTab');
      return;
    }
    goTo(route);
  };

  const firstName = defaultProfile?.name || user?.firstName || 'Arjun';
  const selectedSign = SIGNS.find((s) => s.rashi === selectedSignName) || SIGNS[0];
  const isHindi = language === 'hi';

  // Pick Hindi or English prediction text
  const insightText = isHindi
    ? (predictionsHi[selectedSignName] || predictions[selectedSignName] || 'ग्रहों की स्थिति आज आपके लिए संतुलित दृष्टिकोण का समर्थन करती है। अपनी अंतरात्मा पर भरोसा रखें।')
    : (predictions[selectedSignName] || 'The alignment of the planets favors a balanced approach for your sign today. Trust your intuition.');

  // Hindi display helpers
  const rashiDisplayName = isHindi ? selectedSign.rashiDev : selectedSign.rashi;
  const lordDisplay = isHindi ? (LORD_HI[selectedSign.lord] || selectedSign.lord) : selectedSign.lord;
  const elDisplay = isHindi ? (EL_HI[selectedSign.el] || selectedSign.el) : selectedSign.el;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C9A45A"
          />
        }
      >
        {/* ── HERO ── */}
        <LinearGradient
          colors={['#6E1532', '#6A1039', '#8B2040']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Banner background overlay */}
          <Image source={BANNER} style={styles.heroBannerOverlay} />

          {/* ── Top row: date pill + lang toggle + hamburger ── */}
          <View style={styles.heroTopRow}>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>• {formatDate()}</Text>
            </View>
            <View style={styles.heroTopRight}>
              <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage} activeOpacity={0.75}>
                <Text style={[styles.langOpt, language === 'en' && styles.langOptActive]}>A</Text>
                <Text style={styles.langSep}>|</Text>
                <Text style={[styles.langOpt, language === 'hi' && styles.langOptActive]}>अ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bellBtn} onPress={openDrawer} activeOpacity={0.7}>
                <Ionicons name="menu" size={26} color="rgba(255,255,255,0.88)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Greeting ── */}
          <Text style={styles.heroNamaste}>{t('namaste')}</Text>
          <View style={styles.greetingRow}>
            <Text style={styles.heroGreeting}>{firstName} {'🙏'}</Text>
            {user?.isSubscriber && (
              <LinearGradient colors={['#FFD700', '#D4AF37']} style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.heroTagline}>{t('tagline')}</Text>

          {/* Profile setup warning */}
          {isAuthenticated && !hasProfile && (
            <TouchableOpacity
              style={styles.profileWarning}
              onPress={() => navigation.navigate('ProfileTab')}
              activeOpacity={0.85}
            >
              <Text style={styles.warningIcon}>{'⚠️'}</Text>
              <View style={styles.warningBody}>
                <Text style={styles.warningTitle}>{t('profileWarningTitle')}</Text>
                <Text style={styles.warningDesc}>{t('profileWarningDesc')}</Text>
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
                <Text style={styles.heroAiBtnLabel}>{t('divineGuidance')}</Text>
                <Text style={styles.heroAiBtnTitle}>{t('askMaharishi')}</Text>
              </View>
              <View style={styles.heroAiArrowBtn}>
                <Text style={styles.heroAiArrow}>→</Text>
              </View>
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
                  <Text style={styles.rashiName}>{rashiDisplayName}</Text>
                  <Text style={styles.rashiDot}> · </Text>
                  <Text style={styles.rashiZodiac}>{selectedSign.zodiac}</Text>
                </View>
                <View style={styles.rashiTagRow}>
                  <View style={[styles.rashiTag, styles.rashiTagMars]}>
                    <Text style={[styles.rashiTagText, { color: '#C0392B' }]}>
                      {t('lordLabel')} {lordDisplay}
                    </Text>
                  </View>
                  <View style={[styles.rashiTag, styles.rashiTagFire]}>
                    <Text style={[styles.rashiTagText, { color: '#C9A45A' }]}>
                      {elDisplay} {selectedSign.icon}
                    </Text>
                  </View>
                  {!isHindi && <Text style={styles.rashiDev}>{selectedSign.rashiDev}</Text>}
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.rashiDivider} />

            {/* Today's insight */}
            <View style={styles.insightBox}>
              <Text style={styles.insightLabel}>• {t('todaysInsight')}</Text>
              <Text style={styles.insightText}>{insightText}</Text>
            </View>
          </View>
        </View>


        {/* ── DAILY RASHIFAL ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>{t('dailyRashifal')}</Text>
          </View>
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
                  {isHindi ? sg.rashiDev : sg.rashi}
                </Text>
                <Text style={styles.rashiChipZodiac}>{sg.zodiac}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.rashiGoldLine} />
        </View>


        {/* ── EXPLORE FEATURES ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>{t('exploreFeatures')}</Text>
          <View style={styles.featureList}>
            {[
              {
                id: 'baby',
                icon: '👶',
                titleKey: 'babyNaming',
                badgeKey: 'babyNamingBadge',
                badgeColor: '#0B7060',
                badgeBg: '#D0F0EA',
                descKey: 'babyNamingDesc',
                route: 'BabyNaming',
                iconBg: '#D0F0EA',
              },
              {
                id: 'kundali',
                icon: '💕',
                titleKey: 'kundaliMatching',
                badgeKey: 'kundali36Gunas',
                badgeColor: '#6A1039',
                badgeBg: '#F2D8E0',
                descKey: 'kundaliDesc',
                route: 'CompatibilityTab',
                iconBg: '#F2D8E0',
              },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.featureRow}
                onPress={() => handleFeaturePress(f.route)}
                activeOpacity={0.78}
              >
                <View style={[styles.featureIcon, { backgroundColor: f.iconBg }]}>
                  <Text style={styles.featureIconText}>{f.icon}</Text>
                </View>
                <View style={styles.featureTextBlock}>
                  <View style={styles.featureTitleRow}>
                    <Text style={styles.featureTitle}>{t(f.titleKey)}</Text>
                    <View style={[styles.featureBadge, { backgroundColor: f.badgeBg }]}>
                      <Text style={[styles.featureBadgeText, { color: f.badgeColor }]}>
                        {t(f.badgeKey)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.featureDesc}>{t(f.descKey)}</Text>
                </View>
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
              colors={['#6A1039', '#4A0E22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumGrad}
            >
              <Text style={styles.premiumIcon}>{'👑'}</Text>
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>{t('unlockPremium')}</Text>
                <Text style={styles.premiumDesc}>{t('premiumDesc')}</Text>
              </View>
              <Text style={styles.premiumArrow}>{'→'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Extra bottom padding: floating tab bar height (64) + bottom margin (28) + buffer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── SIDE DRAWER ── */}
      <Modal visible={drawerOpen} transparent animationType="none" onRequestClose={closeDrawer} statusBarTranslucent>
        <View style={styles.drawerOverlay}>
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <View style={styles.drawerBackdrop} />
          </TouchableWithoutFeedback>

          <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: drawerAnim }] }]}>
            {/* Header */}
            <LinearGradient colors={['#6E1532', '#6A1039']} style={styles.drawerHeader}>
              <View style={styles.drawerUserRow}>
                <View style={styles.drawerAvatar}>
                  <Image source={LOGO} style={styles.drawerAvatarLogo} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerUserName}>{defaultProfile?.name || user?.firstName || 'Welcome'}</Text>
                  <Text style={styles.drawerUserSub}>{user?.email || 'vedic member'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeDrawer} style={styles.drawerCloseBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.85)" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Menu */}
            <ScrollView style={styles.drawerBody} showsVerticalScrollIndicator={false}>
              {[
                {
                  titleKey: 'drawerFeatures',
                  items: [
                    { icon: 'heart-outline', labelKey: 'drawerKundaliMatching', route: 'CompatibilityTab', color: '#6A1039', iconBg: '#F2D8E0' },
                    { icon: 'star-four-points-outline', labelKey: 'drawerKundaliGenerate', route: 'KundaliTab', color: '#6A1039', iconBg: '#EDE0F7' },
                    { icon: 'happy-outline', labelKey: 'drawerBabyNaming', route: 'BabyNaming', color: '#0B7060', iconBg: '#D0F0EA' },
                    { icon: 'chatbubble-ellipses-outline', labelKey: 'drawerAskMaharishi', route: 'Chat', color: '#6A1039', iconBg: '#F2D8E0' },
                  ],
                },
                {
                  titleKey: 'drawerAccount',
                  items: [
                    { icon: 'star-outline', labelKey: 'drawerUnlockPremium', route: 'Pricing', color: '#B8860B', iconBg: '#FFF3C4', badge: 'PRO' },
                    { icon: 'card-outline', labelKey: 'drawerMySubscription', route: 'Subscription', color: '#2C6FAC', iconBg: '#D6E8F7' },
                    { icon: 'person-outline', labelKey: 'drawerProfileSettings', route: 'ProfileTab', color: '#6A1039', iconBg: '#F0E8DE' },
                  ],
                },
              ].map((section) => (
                <View key={section.titleKey} style={styles.drawerSection}>
                  <Text style={styles.drawerSectionTitle}>{t(section.titleKey)}</Text>
                  {section.items.map((item) => (
                    <TouchableOpacity
                      key={item.route}
                      style={styles.drawerItem}
                      onPress={() => navigateTo(item.route)}
                      activeOpacity={0.72}
                    >
                      <View style={[styles.drawerItemIcon, { backgroundColor: item.iconBg }]}>
                        <Ionicons name={item.icon} size={19} color={item.color} />
                      </View>
                      <Text style={styles.drawerItemLabel}>{t(item.labelKey)}</Text>
                      {item.badge && (
                        <View style={styles.drawerBadge}>
                          <Text style={styles.drawerBadgeText}>{item.badge}</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={15} color="#C4B8AC" />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={{ height: 48 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

// ──────────────────────────────────────────
// STYLES
// ──────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // ── HERO ──
  hero: {
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 72,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  heroBannerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: 500, height: 500, resizeMode: 'cover', opacity: 0.8,
  },

  // Date pill — "• THURSDAY 7 MAY"
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  datePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  datePillText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  heroTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    gap: 3,
  },
  langOpt: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
  },
  langOptActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  langSep: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
  },
  bellBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Greeting
  heroNamaste: {
    fontSize: 24,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.92)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    lineHeight: 32,
  },
  heroGreeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
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
    color: '#abe9f3ff',
    fontWeight: '600',
    marginTop: 4,
    
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
    shadowColor: '#6A1039',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  rashiCardGoldBar: {
    height: 3,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(90deg, transparent, #C9A45A, #C9A45A, #C9A45A, transparent)',
    // For React Native, use a View with gold color:
    backgroundColor: '#C9A45A',
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
    color: '#6A1039',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  rashiDot: {
    fontSize: 16,
    color: '#A08856',
  },
  rashiZodiac: {
    fontSize: 14,
    color: '#A08856',
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
    color: '#C9A45A',
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
    borderLeftColor: '#C9A45A',
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C9A45A',
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: 14,
    color: '#6A1039',
    lineHeight: 21,
    fontWeight: '400',
  },

  // ── SECTION WRAPPER ──
  section: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B5040',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionViewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C9A45A',
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
    borderColor: '#C9A45A',
    borderWidth: 2,
  },
  rashiChipSym: {
    fontSize: 22,
    marginBottom: 4,
  },
  rashiChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6A1039',
    marginBottom: 1,
  },
  rashiChipNameActive: {
    color: '#C9A45A',
  },
  rashiChipZodiac: {
    fontSize: 10,
    color: '#A08856',
    fontWeight: '400',
  },
  rashiGoldLine: {
    height: 2.5,
    backgroundColor: '#C9A45A',
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
    shadowColor: '#6A1039',
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
    color: '#6A1039',
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
    color: '#A08856',
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
    color: '#C9A45A',
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
    color: '#6A1039',
    letterSpacing: 0.5,
  },
  heroAiArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6A1039',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  heroAiArrow: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // ── SIDE DRAWER ──
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  drawerPanel: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: width * 0.78,
    backgroundColor: '#FDFAF6',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 24,
  },
  drawerHeader: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  drawerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  drawerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  drawerAvatarLogo: {
    width: 38, height: 38, resizeMode: 'contain',
  },
  drawerUserName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  drawerUserSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  drawerCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerBody: {
    flex: 1,
  },
  drawerSection: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  drawerSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A08856',
    letterSpacing: 1.5,
    marginBottom: 4,
    paddingLeft: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  drawerItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  drawerItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#6A1039',
  },
  drawerBadge: {
    backgroundColor: '#6A1039',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  drawerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

});

export default HomeScreen;
