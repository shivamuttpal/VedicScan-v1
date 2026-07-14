import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Animated,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../config/api';
import { SIGNS, LORD_HI, EL_HI } from '../../data/signs';
import PremiumDrawer from '../../components/navigation/PremiumDrawer';

const LOGO = require('../../../assets/logo.jpeg');
const BANNER = require('../../../assets/home/hero-celestial-v2.jpg');
const HOME_ART = {
  kundali: require('../../../assets/home/kundali.jpg'),
  matching: require('../../../assets/home/matching.jpg'),
  maharishi: require('../../../assets/home/maharishi.jpg'),
  baby: require('../../../assets/home/baby-naming.jpg'),
};
const ELEMENT_ICONS = {
  Fire: 'flame-outline',
  Earth: 'leaf-outline',
  Air: 'cloud-outline',
  Water: 'water-outline',
};

const VEDIC_RASHI_MAP = {
  'Aries': 'Mesh', 'Taurus': 'Vrishabh', 'Gemini': 'Mithun',
  'Cancer': 'Kark', 'Leo': 'Simha', 'Virgo': 'Kanya',
  'Libra': 'Tula', 'Scorpio': 'Vrishchik', 'Sagittarius': 'Dhanu',
  'Capricorn': 'Makar', 'Aquarius': 'Kumbh', 'Pisces': 'Meen',
};

const formatDate = () => {
  const d = new Date();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  return `${weekday} ${day} ${month}`;
};

const HomeScreen = ({ navigation }) => {
  const { user, hasProfile, isAuthenticated, refreshProfileStatus, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [predictions, setPredictions] = useState({});
  const [predictionsHi, setPredictionsHi] = useState({});
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSignName, setSelectedSignName] = useState('Mesh');
  const [defaultProfile, setDefaultProfile] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const heroDrift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(heroDrift, { toValue: 1, duration: 12000, useNativeDriver: true }),
      Animated.timing(heroDrift, { toValue: 0, duration: 12000, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [heroDrift]);

  const openDrawer = () => setDrawerOpen(true);

  const STACK_ROUTES = new Set(['Compatibility', 'BabyNaming', 'Kundali', 'Pricing', 'Subscription', 'PaymentSuccess']);

  const goTo = (route) => {
    const parent = navigation.getParent();
    if (parent && STACK_ROUTES.has(route)) {
      parent.navigate(route);
    } else {
      navigation.navigate(route);
    }
  };

  const confirmLogout = () => Alert.alert(
    t('drawerLogoutTitle'),
    t('drawerLogoutMessage'),
    [
      { text: t('drawerCancel'), style: 'cancel' },
      { text: t('drawerLogout'), style: 'destructive', onPress: logout },
    ],
  );

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
        // fallback: keep Mesh
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
  const greetingFontSize = firstName.length > 25 ? 23 : firstName.length > 18 ? 26 : firstName.length > 12 ? 29 : 32;
  const selectedSign = SIGNS.find((s) => s.rashi === selectedSignName) || SIGNS[0];
  const isHindi = language === 'hi';

  const insightText = isHindi
    ? (predictionsHi[selectedSignName] || predictions[selectedSignName] || 'ग्रहों की स्थिति आज आपके लिए संतुलित दृष्टिकोण का समर्थन करती है। अपनी अंतरात्मा पर भरोसा रखें।')
    : (predictions[selectedSignName] || 'The alignment of the planets favors a balanced approach for your sign today. Trust your intuition.');

  const rashiDisplayName = isHindi ? selectedSign.rashiDev : selectedSign.rashi;
  const lordDisplay = isHindi ? (LORD_HI[selectedSign.lord] || selectedSign.lord) : selectedSign.lord;
  const elDisplay = isHindi ? (EL_HI[selectedSign.el] || selectedSign.el) : selectedSign.el;

  const EXPLORE_FEATURES = [
    {
      id: 'kundali',
      image: HOME_ART.kundali,
      title: t('getYourKundali'),
      desc: t('getYourKundaliDesc'),
      route: 'KundaliTab',
      accent: '#C9860A',
    },
    {
      id: 'matching',
      image: HOME_ART.matching,
      title: t('kundaliMatching'),
      desc: t('kundaliMatchingDesc'),
      route: 'CompatibilityTab',
      accent: '#7A1F3D',
    },
    {
      id: 'maharishi',
      image: HOME_ART.maharishi,
      title: t('askMaharishi'),
      desc: t('askMaharishiDesc'),
      route: 'Chat',
      accent: '#5C3D8F',
    },
    {
      id: 'baby',
      image: HOME_ART.baby,
      title: t('babyNaming'),
      desc: t('babyNamingCardDesc'),
      route: 'BabyNaming',
      accent: '#1565A0',
    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A64F" />
        }
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <Animated.Image source={BANNER} style={[styles.heroBanner, { transform: [
            { translateX: heroDrift.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
            { scale: heroDrift.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.06] }) },
          ] }]} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(255,253,249,0)', 'rgba(255,253,249,0.08)', 'rgba(250,247,242,0.46)']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <View style={styles.datePill}>
                <View style={styles.dateDot} />
                <Text style={styles.datePillText}>{formatDate()}</Text>
              </View>
              <View style={styles.heroTopRight}>
                <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage} activeOpacity={0.75}>
                  <Text style={[styles.langOpt, language === 'en' && styles.langOptActive]}>A</Text>
                  <View style={styles.langDivider} />
                  <Text style={[styles.langOpt, language === 'hi' && styles.langOptActive]}>अ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuBtn} onPress={openDrawer} activeOpacity={0.7}>
                  <Ionicons name="menu" size={22} color="#2D241D" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroGreetingBlock}>
              <Text style={styles.heroNamaste}>{t('namaste')}</Text>
              <Text
                style={[styles.heroGreeting, { fontSize: greetingFontSize }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.68}
              >
                {firstName}
              </Text>
              <View style={styles.taglineRow}>
                <Ionicons name="sparkles" size={13} color="#E7C573" />
                <Text style={styles.heroTagline}>{t('tagline')}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Chat')} activeOpacity={0.86}>
              <LinearGradient
                colors={['rgba(255,255,255,0.94)', 'rgba(255,251,243,0.86)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiGuideCard}
              >
                <View style={styles.aiAvatarRing}>
                  <Image source={HOME_ART.maharishi} style={styles.aiAvatarImg} resizeMode="cover" />
                </View>
                <View style={styles.aiGuideText}>
                  <Text style={styles.aiCapsuleEyebrow}>{t('yourVedicGuide')}</Text>
                  <Text style={styles.aiCapsuleName}>{t('askMaharishi')}</Text>
                  <Text style={styles.aiGuideHint}>{t('personalGuidanceHint')}</Text>
                </View>
                <View style={styles.aiGuideArrow}>
                  <Ionicons name="arrow-forward" size={17} color="#3E1735" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Profile setup warning */}
            {isAuthenticated && !hasProfile && (
              <TouchableOpacity
                style={styles.profileWarning}
                onPress={() => navigation.navigate('ProfileTab')}
                activeOpacity={0.85}
              >
                <View style={styles.warningIconWrap}>
                  <Ionicons name="alert-circle-outline" size={20} color="#E6A23C" />
                </View>
                <View style={styles.warningBody}>
                  <Text style={styles.warningTitle}>{t('profileWarningTitle')}</Text>
                  <Text style={styles.warningDesc}>{t('profileWarningDesc')}</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#E6A23C" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── RASHI HERO CARD ── */}
        <View style={styles.rashiCardWrap}>
          <View style={styles.rashiCard}>
            <LinearGradient
              colors={['transparent', '#D4A64F', '#C9A45A', '#D4A64F', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.rashiGoldBar}
            />

            <View style={styles.rashiOverlineRow}>
              <Text style={styles.rashiOverline}>{isHindi ? 'आपकी चंद्र राशि' : 'YOUR MOON SIGN'}</Text>
              <View style={styles.rashiTodayPill}>
                <View style={styles.rashiTodayDot} />
                <Text style={styles.rashiTodayText}>{isHindi ? 'आज' : 'TODAY'}</Text>
              </View>
            </View>

            <View style={styles.rashiIdentityRow}>
              <LinearGradient colors={['#7C3765', '#4B2147']} style={styles.rashiIconBox}>
                <Text style={styles.rashiIconSym}>{selectedSign.sym}</Text>
              </LinearGradient>

              <View style={styles.rashiInfo}>
                <View style={styles.rashiNameRow}>
                  <Text style={styles.rashiName}>{rashiDisplayName}</Text>
                  <Text style={styles.rashiDot}> · </Text>
                  <Text style={styles.rashiZodiac}>{selectedSign.zodiac}</Text>
                </View>
                <View style={styles.rashiTagRow}>
                  <View style={styles.tagMars}>
                    <Text style={styles.tagMarsText}>{t('lordLabel')} {lordDisplay}</Text>
                  </View>
                  <View style={styles.tagEl}>
                    <Ionicons name={ELEMENT_ICONS[selectedSign.el]} size={12} color="#C9780A" />
                    <Text style={styles.tagElText}>{elDisplay}</Text>
                  </View>
                  {!isHindi && <Text style={styles.rashiDev}>{selectedSign.rashiDev}</Text>}
                </View>
              </View>

              <Text style={styles.rashiSymDeco}>{selectedSign.sym}</Text>
            </View>

            <View style={styles.insightBox}>
              <View style={styles.insightHeader}>
                <View style={styles.insightIcon}>
                  <Ionicons name="sparkles" size={13} color="#A66C16" />
                </View>
                <Text style={styles.insightLabel}>{t('todaysInsight')}</Text>
              </View>
              <Text style={styles.insightText}>{insightText}</Text>
            </View>
          </View>
        </View>

        {/* ── DAILY RASHIFAL ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionLabel}>{t('dailyRashifal')}</Text>
              <Text style={styles.sectionSubtitle}>
                {isHindi ? 'मार्गदर्शन पढ़ने के लिए राशि चुनें' : 'Choose a sign to read its guidance'}
              </Text>
            </View>
            <Ionicons name="sunny-outline" size={21} color="#A66C16" />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rashiScrollContent}
          >
            {SIGNS.map((sg) => (
              <TouchableOpacity
                key={sg.rashi}
                style={[styles.rashiChip, selectedSignName === sg.rashi && styles.rashiChipActive]}
                onPress={() => setSelectedSignName(sg.rashi)}
                activeOpacity={0.75}
              >
                <View style={[styles.rashiChipSymbol, selectedSignName === sg.rashi && styles.rashiChipSymbolActive]}>
                  <Text style={[styles.rashiChipSym, selectedSignName === sg.rashi && styles.rashiChipSymActive]}>{sg.sym}</Text>
                </View>
                <Text style={[styles.rashiChipName, selectedSignName === sg.rashi && styles.rashiChipNameActive]}>
                  {isHindi ? sg.rashiDev : sg.rashi}
                </Text>
                <Text style={styles.rashiChipZodiac}>{sg.zodiac}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── EXPLORE GUIDANCE ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionLabel}>{t('exploreGuidance')}</Text>
              <Text style={styles.sectionSubtitle}>{t('exploreGuidanceSubtitle')}</Text>
            </View>
            <Ionicons name="compass-outline" size={21} color="#A66C16" />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featureScrollContent}
          >
            {EXPLORE_FEATURES.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.featureCard}
                onPress={() => handleFeaturePress(f.route)}
                activeOpacity={0.82}
              >
                <View style={styles.featureCardInner}>
                  <View style={styles.featureImageWrap}>
                    <Image source={f.image} style={styles.featureImage} resizeMode="cover" />
                    <LinearGradient
                      colors={['transparent', 'rgba(70,20,36,0.10)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </View>
                  <Text style={[styles.featureTitle, { color: f.accent }]}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                  <View style={styles.featureFooter}>
                    <Text style={[styles.featureAction, { color: f.accent }]}>{t('exploreCta')}</Text>
                    <View style={[styles.featureArrowBtn, { backgroundColor: f.accent }]}>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── PREMIUM CTA ── */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Pricing')}
            activeOpacity={0.85}
            style={styles.premiumWrap}
          >
            <LinearGradient
              colors={['#F4E3B1', '#D8B44A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumGrad}
            >
              <View style={styles.premiumIconWrap}>
                <Ionicons name="diamond-outline" size={23} color="#6B5015" />
              </View>
              <View style={styles.premiumTextBlock}>
                <Text style={styles.premiumTitle}>{t('unlockPremium')}</Text>
                <Text style={styles.premiumDesc}>{t('premiumDesc')}</Text>
              </View>
              <Ionicons name="arrow-forward" size={21} color="#5F4817" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <PremiumDrawer
        visible={drawerOpen}
        user={user}
        profileName={defaultProfile?.name}
        t={t}
        onNavigate={goTo}
        onClosed={() => setDrawerOpen(false)}
        onLogout={confirmLogout}
      />
    </View>
  );
};

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F4EE',
  },
  scrollContent: {
    paddingBottom: 160,
  },

  // ── HERO ──
  hero: {
    overflow: 'hidden',
    paddingBottom: 42,
    backgroundColor: '#241126',
  },
  heroBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 46,
    paddingHorizontal: 20,
  },

  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  dateDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E8C36D' },
  datePillText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '700',
    letterSpacing: 0.65,
  },
  heroTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    gap: 7,
  },
  langOpt: { fontSize: 12, color: 'rgba(255,255,255,0.46)', fontWeight: '700' },
  langOptActive: { color: '#FFFFFF', fontWeight: '800' },
  langDivider: { width: 1, height: 13, backgroundColor: 'rgba(255,255,255,0.20)' },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGreetingBlock: {
    maxWidth: '92%',
    marginBottom: 22,
  },
  heroNamaste: {
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.72)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 2,
  },
  heroGreeting: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 37,
    marginBottom: 9,
  },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  heroTagline: {
    fontSize: 12.5,
    color: 'rgba(255,235,187,0.88)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  aiGuideCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 10,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(235,203,132,0.34)',
    marginBottom:30
  },
  aiAvatarRing: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFF8EE',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(244,213,138,0.8)',
    overflow: 'hidden',
  },
  aiAvatarImg: {
    width: '100%',
    height: '100%',
  },
  aiGuideText: { flex: 1 },
  aiCapsuleEyebrow: {
    fontSize: 8,
    fontWeight: '900',
    color: '#E7C573',
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  aiCapsuleName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 19,
  },
  aiGuideHint: { fontSize: 10.5, color: 'rgba(255,255,255,0.60)', marginTop: 1 },
  aiGuideArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0D797',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  warningIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: 'rgba(230,162,60,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBody: { flex: 1 },
  warningTitle: { color: '#D4760A', fontWeight: '700', fontSize: 14 },
  warningDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 1 },
  // ── RASHI CARD ──
  rashiCardWrap: {
    marginTop: -49,
    paddingHorizontal: 16,
    backgroundColor: '#F8F4EE',
    zIndex: 10,
  },
  rashiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#7A1F3D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,166,79,0.14)',
    marginTop:10
  },
  rashiGoldBar: {
    height: 2,
  },
  rashiOverlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  rashiOverline: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.35,
    color: '#A37D45',
  },
  rashiTodayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#F6F0E8',
  },
  rashiTodayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#55A36A' },
  rashiTodayText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.7, color: '#806D5A' },
  rashiIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 14,
  },
  rashiIconBox: {
    width: 62,
    height: 62,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  rashiIconSym: { fontSize: 29, color: '#FFFFFF' },
  rashiInfo: { flex: 1 },
  rashiNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 7,
  },
  rashiName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4A213B',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  rashiDot: { fontSize: 16, color: '#C4A05B' },
  rashiZodiac: { fontSize: 13, color: '#9A8265', fontWeight: '500' },
  rashiTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tagMars: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#FDECEA',
  },
  tagMarsText: { fontSize: 11, fontWeight: '600', color: '#B82020' },
  tagEl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
  },
  tagElText: { fontSize: 11, fontWeight: '600', color: '#C9780A' },
  rashiDev: { fontSize: 13, fontWeight: '700', color: '#C9A45A' },
  rashiSymDeco: {
    position: 'absolute',
    right: 18,
    top: 4,
    fontSize: 64,
    opacity: 0.045,
    color: '#7A1F3D',
  },
  insightBox: {
    backgroundColor: '#F8F3EC',
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EFE4D5',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 9,
  },
  insightIcon: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: '#F1E2BE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#9A671C',
    letterSpacing: 1.05,
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: 13.5,
    color: '#55463A',
    lineHeight: 21,
    fontWeight: '500',
  },

  // ── SECTION ──
  section: {
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#3F2636',
    letterSpacing: -0.2,
  },
  sectionSubtitle: { fontSize: 11, color: '#9A8877', marginTop: 3 },

  // ── RASHIFAL SCROLL ──
  rashiScrollContent: {
    paddingRight: 10,
    gap: 10,
  },
  rashiChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 9,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED2',
    minWidth: 78,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rashiChipActive: {
    backgroundColor: '#FDF9F4',
    borderColor: '#C99D4B',
    shadowColor: '#7A1F3D',
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 3,
  },
  rashiChipSymbol: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#F5EEF3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 7,
  },
  rashiChipSymbolActive: { backgroundColor: '#6A2B55' },
  rashiChipSym: { fontSize: 20, color: '#7A315D' },
  rashiChipSymActive: { color: '#FFFFFF' },
  rashiChipName: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#503242',
    marginBottom: 2,
  },
  rashiChipNameActive: { color: '#7A315D' },
  rashiChipZodiac: { fontSize: 8.5, color: '#A18E7C', fontWeight: '500' },

  // ── EXPLORE FEATURE CARDS ──
  featureScrollContent: { paddingRight: 12, gap: 12 },
  featureCard: {
    width: 228,
  },
  featureCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,166,79,0.14)',
    shadowColor: '#7A1F3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 258,
    justifyContent: 'space-between',
  },
  featureImageWrap: {
    width: '100%',
    height: 128,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F8F0E7',
    borderWidth: 1,
    borderColor: 'rgba(212,166,79,0.18)',
  },
  featureImage: { width: '100%', height: '100%' },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 11.5,
    color: '#8C7A6A',
    lineHeight: 15,
    marginBottom: 10,
  },
  featureFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featureAction: { fontSize: 11, fontWeight: '800' },
  featureArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  // ── PREMIUM CTA ──
  premiumWrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  premiumGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  premiumIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(244,213,138,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,213,138,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumTextBlock: { flex: 1 },
  premiumTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, marginBottom: 2 },
  premiumDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },

  // Light luxury home system
  root: { flex: 1, backgroundColor: '#FAF7F2' },
  scrollContent: { paddingBottom: 118, backgroundColor: '#FAF7F2' },
  hero: { minHeight: 382, overflow: 'hidden', backgroundColor: '#FFFDF9' },
  heroBanner: { position: 'absolute', left: -8, top: 0, width: width + 16, height: 382 },
  heroContent: { flex: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 42, paddingBottom: 24, justifyContent: 'flex-start' },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,253,249,0.82)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(212,175,55,0.28)' },
  dateDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D4AF37' },
  datePillText: { fontSize: 10, color: '#6F5A46', fontWeight: '600', letterSpacing: 0.65 },
  langToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,253,249,0.82)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)', gap: 7 },
  langOpt: { fontSize: 12, color: '#9E8E7E', fontWeight: '500' },
  langOptActive: { color: '#8D6C18', fontWeight: '600' },
  langDivider: { width: 1, height: 13, backgroundColor: '#E4D6C4' },
  menuBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,253,249,0.84)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)', justifyContent: 'center', alignItems: 'center' },
  heroGreetingBlock: { width: '94%', marginTop: 24, marginBottom: 0 },
  heroNamaste: { fontSize: 17, fontWeight: '400', color: '#7B6B5C', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontStyle: 'italic', lineHeight: 24, marginBottom: 2 },
  heroGreeting: { width: '100%', fontWeight: '400', color: '#2D241D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', letterSpacing: -0.8, lineHeight: 38, marginBottom: 8 },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  heroTagline: { fontSize: 12, color: '#9A7421', fontWeight: '500', letterSpacing: 0.2 },
  aiGuideCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 10, paddingRight: 13, borderWidth: 1, borderColor: 'rgba(212,175,55,0.28)', marginTop: 22, marginBottom: 0, shadowColor: '#765D3A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 18, elevation: 5 },
  aiAvatarRing: { width: 52, height: 52, borderRadius: 17, backgroundColor: '#FFF8EE', marginRight: 12, borderWidth: 1, borderColor: '#E8C878', overflow: 'hidden' },
  aiCapsuleEyebrow: { fontSize: 8, fontWeight: '600', color: '#B5851B', letterSpacing: 1.1, marginBottom: 2 },
  aiCapsuleName: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 16, fontWeight: '400', color: '#2D241D', lineHeight: 20 },
  aiGuideHint: { fontSize: 10.5, color: '#8A7A6B', marginTop: 2 },
  aiGuideArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDD17F', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  profileWarning: { marginTop: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF6E5', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#E8C878' },
  warningDesc: { color: '#7F6D5B', fontSize: 12, marginTop: 1 },
  rashiCardWrap: { marginTop: 0, paddingHorizontal: 16, paddingTop: 18, backgroundColor: '#FAF7F2', zIndex: 10 },
  rashiCard: { backgroundColor: '#FFFDF9', borderRadius: 28, overflow: 'hidden', shadowColor: '#6B553B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.09, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)', marginTop: 0 },
  rashiName: { fontSize: 24, fontWeight: '400', color: '#2D241D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  rashiSymDeco: { position: 'absolute', right: 18, top: 4, fontSize: 64, opacity: 0.06, color: '#D4AF37' },
  insightBox: { backgroundColor: '#F7F1E8', marginHorizontal: 14, marginBottom: 14, borderRadius: 20, padding: 17, borderWidth: 1, borderColor: '#EEE2D2' },
  insightText: { fontSize: 13.5, color: '#51463D', lineHeight: 22, fontWeight: '400' },
  section: { paddingHorizontal: 16, paddingTop: 28 },
  sectionLabel: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 19, fontWeight: '400', color: '#2D241D', letterSpacing: -0.2 },
  rashiChip: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 9, borderRadius: 20, backgroundColor: '#FFFDF9', borderWidth: 1, borderColor: '#E9DED0', minWidth: 78, shadowColor: '#6A533A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  rashiChipActive: { backgroundColor: '#FFF9EC', borderColor: '#D4AF37', shadowColor: '#B68A26', shadowOpacity: 0.13, shadowRadius: 8, elevation: 3 },
  rashiChipSymbolActive: { backgroundColor: '#D4AF37' },
  featureCardInner: { backgroundColor: '#FFFDF9', borderRadius: 26, padding: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.16)', shadowColor: '#735A3B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3, minHeight: 258, justifyContent: 'space-between' },
  premiumWrap: { borderRadius: 24, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#8B6420', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 14 }, android: { elevation: 4 } }) },
  premiumGrad: { flexDirection: 'row', alignItems: 'center', padding: 19, gap: 14 },
  premiumIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,253,249,0.45)', borderWidth: 1, borderColor: 'rgba(107,80,21,0.16)', justifyContent: 'center', alignItems: 'center' },
  premiumTitle: { color: '#2D241D', fontWeight: '600', fontSize: 16, marginBottom: 2 },
  premiumDesc: { color: '#6E5B43', fontSize: 12 },
});

export default HomeScreen;
