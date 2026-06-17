import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, RefreshControl, Platform, Dimensions, TextInput, KeyboardAvoidingView,
  BackHandler, ImageBackground, Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import LocationInput from '../../components/LocationInput';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../config/api';

const { width: SCREEN_W } = Dimensions.get('window');
const BG_IMAGE = require('../../../assets/kundalihome.jpg');

// ── Kundali translation strings ──────────────────────────────────────
const KS = {
  en: {
    screenTitle: 'Kundali',
    tabs: ['Overview', 'Chart', 'Planets', 'Dashas', 'Insights'],
    downloadPdf: 'Download PDF Report',
    deleteKundali: 'Delete Kundali',
    currentDasha: 'Current Dasha Periods',
    mahadasha: 'Mahadasha', antardasha: 'Antardasha', pratyantar: 'Pratyantar',
    yogasPresent: (n) => `Yogas Present (${n})`,
    doshasPresent: (n) => `Doshas Present (${n})`,
    yogasDoshas: 'Yogas & Doshas',
    housePlacements: 'House Placements', planetaryPos: 'Planetary Positions',
    mahadashaTimeline: 'Mahadasha Timeline',
    antardashaIn: (md) => `Antardasha in ${md} Mahadasha`,
    summaryLagna: 'Lagna', summaryMoon: 'Moon Sign', summarySun: 'Sun Sign', summaryNakshatra: 'Nakshatra',
    suryaRashi: 'Surya Rashi',
    planetHeaders: ['Planet', 'Rashi', 'Nakshatra', 'Deg', 'H'],
    houseHeaders: ['House', 'Sign', 'Planets'],
    planets: { Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Mercury: 'Mercury', Jupiter: 'Jupiter', Venus: 'Venus', Saturn: 'Saturn', Rahu: 'Rahu', Ketu: 'Ketu' },
    noKundali: 'No Kundali Generated',
    noKundaliDesc: 'Generate your personalized Vedic birth chart with planetary positions, yogas, doshas, and life insights.',
    generateKundali: '✦  Generate Kundali', generateBtn: '✦  Generate My Kundali',
    generating: 'Generating...', generateNote: 'Calculation uses Swiss Ephemeris with Lahiri Ayanamsa. Generation takes 5–15 seconds.',
    formTitle: 'Generate Kundali',
    fullName: 'Full Name', dob: 'Date of Birth', tob: 'Time of Birth', pob: 'Birth Place',
    namePlaceholder: 'e.g. Shivam Kumar',
    dobHint: 'Vedic calculation requires exact date', tobHint: 'Select AM or PM carefully for accurate Lagna',
    pobHint: 'Include country for precise geocoding',
    selectLocation: 'Search city/place...',
    active: 'ACTIVE', more: (n) => `+${n} more yogas`,
    personality: 'Personality', career: 'Career & Profession', finance: 'Financial Outlook',
    marriage: 'Marriage & Relationships', health: 'Health & Well-being', spirituality: 'Spirituality',
    strengthsChallenges: 'Strengths & Challenges', strengths: 'Strengths', challenges: 'Challenges',
    vedicRec: 'Vedic Recommendations', mantras: '✦ Mantras', gemstones: '◈ Gemstones',
    fasting: '✧ Fasting Days', charity: '❋ Charity',
    d1Chart: 'D1 — Rashi Chart (Birth Chart)', d9Chart: 'D9 — Navamsa Chart',
    viewInsights: 'View the full Kundali to see all yogas and doshas.',
    langToggleLabel: 'हिंदी',
  },
  hi: {
    screenTitle: 'कुंडली',
    tabs: ['अवलोकन', 'चार्ट', 'ग्रह', 'दशा', 'अंतर्दृष्टि'],
    downloadPdf: 'PDF रिपोर्ट डाउनलोड करें',
    deleteKundali: 'कुंडली हटाएं',
    currentDasha: 'वर्तमान दशा काल',
    mahadasha: 'महादशा', antardasha: 'अंतर्दशा', pratyantar: 'प्रत्यंतर',
    yogasPresent: (n) => `उपस्थित योग (${n})`,
    doshasPresent: (n) => `उपस्थित दोष (${n})`,
    yogasDoshas: 'योग और दोष',
    housePlacements: 'भाव स्थिति', planetaryPos: 'ग्रहीय स्थिति',
    mahadashaTimeline: 'महादशा काल-रेखा',
    antardashaIn: (md) => `${md} महादशा में अंतर्दशा`,
    summaryLagna: 'लग्न', summaryMoon: 'चंद्र राशि', summarySun: 'सूर्य राशि', summaryNakshatra: 'नक्षत्र',
    suryaRashi: 'सूर्य राशि',
    planetHeaders: ['ग्रह', 'राशि', 'नक्षत्र', 'अंश', 'भाव'],
    houseHeaders: ['भाव', 'राशि', 'ग्रह'],
    planets: { Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'बृहस्पति', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु' },
    noKundali: 'कोई कुंडली नहीं बनी',
    noKundaliDesc: 'ग्रहीय स्थिति, योग, दोष और जीवन अंतर्दृष्टि के साथ अपनी व्यक्तिगत वैदिक जन्म कुंडली बनाएं।',
    generateKundali: '✦  कुंडली बनाएं', generateBtn: '✦  मेरी कुंडली बनाएं',
    generating: 'बना रहे हैं...', generateNote: 'गणना स्विस इफेमेरिस और लहरी अयनांश से होती है। बनाने में 5–15 सेकंड लगते हैं।',
    formTitle: 'कुंडली बनाएं',
    fullName: 'पूर्ण नाम', dob: 'जन्म तिथि', tob: 'जन्म समय', pob: 'जन्म स्थान',
    namePlaceholder: 'जैसे शिवम कुमार',
    dobHint: 'वैदिक गणना के लिए सटीक तिथि आवश्यक है', tobHint: 'सटीक लग्न के लिए AM या PM ध्यान से चुनें',
    pobHint: 'सटीक जियोकोडिंग के लिए देश शामिल करें',
    selectLocation: 'शहर/स्थान खोजें...',
    active: 'सक्रिय', more: (n) => `+${n} और योग`,
    personality: 'व्यक्तित्व', career: 'करियर और पेशा', finance: 'वित्तीय दृष्टिकोण',
    marriage: 'विवाह और संबंध', health: 'स्वास्थ्य और कल्याण', spirituality: 'आध्यात्मिकता',
    strengthsChallenges: 'शक्तियाँ और चुनौतियाँ', strengths: 'शक्तियाँ', challenges: 'चुनौतियाँ',
    vedicRec: 'वैदिक सुझाव', mantras: '✦ मंत्र', gemstones: '◈ रत्न',
    fasting: '✧ उपवास के दिन', charity: '❋ दान',
    d1Chart: 'D1 — राशि चार्ट (जन्म कुंडली)', d9Chart: 'D9 — नवांश चार्ट',
    viewInsights: 'सभी योग और दोष देखने के लिए पूरी कुंडली देखें।',
    langToggleLabel: 'English',
  },
};

// North Indian chart house positions in a 4×4 grid
// ── Data translation maps ─────────────────────────────────────────────
const RASHI_HI = {
  Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क',
  Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक',
  Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन',
};
// Short labels that fit in a small chart cell
const RASHI_ABBR_HI = {
  Aries: 'मेष', Taurus: 'वृष', Gemini: 'मिथ', Cancer: 'कर्क',
  Leo: 'सिंह', Virgo: 'कन्य', Libra: 'तुला', Scorpio: 'वृश्च',
  Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन',
};
const NAKSHATRA_HI = {
  Ashwini: 'अश्विनी', Bharani: 'भरणी', Krittika: 'कृत्तिका',
  Rohini: 'रोहिणी', Mrigashira: 'मृगशिरा', Ardra: 'आर्द्रा',
  Punarvasu: 'पुनर्वसु', Pushya: 'पुष्य', Ashlesha: 'आश्लेषा',
  Magha: 'मघा', 'Purva Phalguni': 'पूर्व फाल्गुनी', 'Uttara Phalguni': 'उत्तर फाल्गुनी',
  Hasta: 'हस्त', Chitra: 'चित्रा', Swati: 'स्वाति',
  Vishakha: 'विशाखा', Anuradha: 'अनुराधा', Jyeshtha: 'ज्येष्ठा',
  Mula: 'मूल', 'Purva Ashadha': 'पूर्व आषाढ़', 'Uttara Ashadha': 'उत्तर आषाढ़',
  Shravana: 'श्रवण', Dhanishtha: 'धनिष्ठा', Shatabhisha: 'शतभिषा',
  'Purva Bhadrapada': 'पूर्व भाद्रपद', 'Uttara Bhadrapada': 'उत्तर भाद्रपद', Revati: 'रेवती',
};
const STRENGTH_HI = { Low: 'कमज़ोर', Moderate: 'मध्यम', Strong: 'प्रबल', High: 'उच्च' };
const SEVERITY_HI = { Low: 'कम', Moderate: 'मध्यम', High: 'उच्च' };
// Chart planet abbreviations in Hindi (2-char fit in small cells)
const PLANET_ABBR_HI = {
  Sun: 'सू', Moon: 'च', Mars: 'मं', Mercury: 'बु',
  Jupiter: 'गु', Venus: 'शु', Saturn: 'श', Rahu: 'रा', Ketu: 'के',
};

// Authentic North-Indian diamond chart — fractional anchor positions
// (same as the PDF renderer; each pair is [x, y] as a fraction of the chart size)
const NI_FRAC = {
  1:  [0.50, 0.220], 2:  [0.255, 0.108], 3:  [0.108, 0.255], 4:  [0.220, 0.50],
  5:  [0.108, 0.745], 6:  [0.255, 0.892], 7:  [0.50, 0.780], 8:  [0.745, 0.892],
  9:  [0.892, 0.745], 10: [0.780, 0.50], 11: [0.892, 0.255], 12: [0.745, 0.108],
};

// ── Authentic North-Indian Diamond Chart ──────────────────────────
const KundaliChart = ({ houses = [], lagnaSign, title, tSignAbbr, tPlanetAbbr }) => {
  const S        = SCREEN_W - 52;          // square side
  const inner    = S / Math.SQRT2;         // inner-diamond View side (corners touch midpoints)
  const diagLen  = S * Math.SQRT2;         // full diagonal length
  const diagOff  = -(diagLen - S) / 2;    // left offset to centre the diagonal in the square

  const signLabel   = (sign) => tSignAbbr   ? tSignAbbr(sign)   : (sign?.substring(0, 3) || '').toUpperCase();
  const planetLabel = (p)    => tPlanetAbbr ? tPlanetAbbr(p)    : p.substring(0, 2);

  return (
    <View style={styles.chartWrapper}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}

      {/* Outer square — parchment background, gold border, clips the diagonal lines */}
      <View style={[styles.chartGrid, { width: S, height: S }]}>

        {/* ── Diagonal TL → BR ── */}
        <View pointerEvents="none" style={{
          position: 'absolute',
          width: diagLen, height: 1,
          backgroundColor: 'rgba(160,120,50,0.45)',
          left: diagOff, top: S / 2 - 0.5,
          transform: [{ rotate: '45deg' }],
        }} />

        {/* ── Diagonal TR → BL ── */}
        <View pointerEvents="none" style={{
          position: 'absolute',
          width: diagLen, height: 1,
          backgroundColor: 'rgba(160,120,50,0.45)',
          left: diagOff, top: S / 2 - 0.5,
          transform: [{ rotate: '-45deg' }],
        }} />

        {/* ── Inner diamond (rotated square) ── */}
        <View pointerEvents="none" style={{
          position: 'absolute',
          width: inner, height: inner,
          left: (S - inner) / 2, top: (S - inner) / 2,
          borderWidth: 1,
          borderColor: 'rgba(200,164,90,0.75)',
          backgroundColor: 'transparent',
          transform: [{ rotate: '45deg' }],
        }} />

        {/* ── Centre watermark ── */}
        <View style={{
          position: 'absolute',
          left: S / 2 - 30, top: S / 2 - 10,
          width: 60, alignItems: 'center',
        }}>
          <Text style={styles.centerLabel}>VedicScan</Text>
        </View>

        {/* ── House labels ── */}
        {houses.map((house) => {
          const frac = NI_FRAC[house.number];
          if (!frac) return null;
          const cx = frac[0] * S;
          const cy = frac[1] * S;
          const isLagna = house.number === 1;
          const pStr = (house.planets || []).map(p => planetLabel(p)).join(' ');

          return (
            <View key={house.number} style={{
              position: 'absolute',
              left: cx - 28, top: cy - 22,
              width: 56, alignItems: 'center',
            }}>
              {/* small house number, top-right */}
              <Text style={[styles.houseNumber, isLagna && styles.houseNumberLagna]}>
                {house.number}
              </Text>
              {/* sign abbreviation */}
              <Text style={[styles.houseSign, isLagna && styles.houseSignLagna]}>
                {signLabel(house.sign)}
              </Text>
              {/* planets */}
              {!!pStr && (
                <Text style={[styles.housePlanets, isLagna && styles.housePlanetsLagna]}>
                  {pStr}
                </Text>
              )}
              {/* ASC badge for house 1 */}
              {isLagna && <Text style={styles.ascBadge}>ASC</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ── Section component ──────────────────────────────────────────────
const Section = ({ title, children, icon }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      {icon && <MaterialCommunityIcons name={icon} size={18} color="#C9A45A" style={{ marginRight: 10 }} />}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

// ── Planet row ──────────────────────────────────────────────────────
const PlanetRow = ({ name, data, alt, tSign, tNak }) => (
  <View style={[styles.tableRow, alt && styles.tableRowAlt]}>
    <Text style={[styles.tableCell, styles.tableBold, { flex: 1.2 }]}>{name}</Text>
    <Text style={[styles.tableCell, { flex: 1.5 }]}>{tSign ? tSign(data?.rashi) : (data?.rashi || '—')}</Text>
    <Text style={[styles.tableCell, { flex: 1.8 }]}>{tNak ? tNak(data?.nakshatra) : (data?.nakshatra || '—')}</Text>
    <Text style={[styles.tableCell, { flex: 0.8 }]}>{data?.degree?.toFixed(1) || '—'}°</Text>
    <Text style={[styles.tableCell, { flex: 0.6 }]}>{data?.houseNumber || '—'}</Text>
  </View>
);

// ── Tab bar keys (resolved to labels via KS[lang].tabs) ──────────────
const TAB_KEYS = ['Overview', 'Chart', 'Planets', 'Dashas', 'Insights'];

// ── Main Screen ──────────────────────────────────────────────────────
export default function KundaliScreen({ navigation }) {
  const { token } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [kundalis, setKundalis] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '' });

  // Language is now the global app language
  const L = KS[language] || KS.en;
  const isHindi = language === 'hi';

  // ── Translation helpers ───────────────────────────────────────────
  const tSign = (s) => (isHindi ? RASHI_HI[s] || s : s) || '—';
  const tSignAbbr = (s) => isHindi ? (RASHI_ABBR_HI[s] || s?.substring(0, 3) || '') : (s?.substring(0, 3).toUpperCase() || '');
  const tNak  = (n) => (isHindi ? NAKSHATRA_HI[n] || n : n) || '—';
  const tPlanet = (p) => (isHindi ? L.planets[p] || p : p) || '—';
  const tPlanetAbbr = (p) => isHindi ? (PLANET_ABBR_HI[p] || p?.substring(0, 2) || '') : (p?.substring(0, 2) || '');
  const tStrength = (s) => isHindi ? (STRENGTH_HI[s] || s) : s;
  const tSeverity = (s) => isHindi ? (SEVERITY_HI[s] || s) : s;

  // Scroll ref for the form — used to scroll location field into view
  const formScrollRef = useRef(null);

  // Intercept Android hardware back when form is open
  useEffect(() => {
    if (!showForm) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowForm(false);
      return true; // prevents default navigation back
    });
    return () => sub.remove();
  }, [showForm]);

  // Date / Time pickers
  const [dateObj, setDateObj] = useState(new Date(2000, 0, 1));
  const [timeObj, setTimeObj] = useState(new Date(2000, 0, 1, 12, 0));
  const [timeDisplay, setTimeDisplay] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onDateChange = (_, date) => {
    setShowDatePicker(false);
    if (date) {
      setDateObj(date);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      setForm(f => ({ ...f, dateOfBirth: `${yyyy}-${mm}-${dd}` }));
    }
  };

  const onTimeChange = (_, time) => {
    setShowTimePicker(false);
    if (time) {
      setTimeObj(time);
      // Store 24-hr value for API
      const hh = String(time.getHours()).padStart(2, '0');
      const min = String(time.getMinutes()).padStart(2, '0');
      setForm(f => ({ ...f, timeOfBirth: `${hh}:${min}` }));
      // Build 12-hr AM/PM display string
      const h12 = time.getHours() % 12 || 12;
      const ampm = time.getHours() < 12 ? 'AM' : 'PM';
      setTimeDisplay(`${h12}:${min} ${ampm}`);
    }
  };

  // Fetch full kundali (includes dasha.timeline + interpretations excluded from list)
  const fetchFullKundali = useCallback(async (id) => {
    try {
      const res = await api.get(`/api/kundali/${id}`);
      if (res.data?.success) {
        const full = res.data.data;
        setSelected(full);
        setKundalis(prev => prev.map(k => k.id === full.id ? full : k));
      }
    } catch (e) {
      console.warn('Failed to fetch full kundali:', e.message);
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/kundali/list');
      const list = res.data?.data || [];
      setKundalis(list);
      if (list.length > 0 && !selected) {
        // Set a lightweight placeholder immediately so the card is highlighted,
        // then fetch the full record for dashas + insights
        setSelected(list[0]);
        fetchFullKundali(list[0].id);
      }
    } catch (e) {
      console.warn('Kundali list fetch failed:', e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFullKundali]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchList();
    setRefreshing(false);
  };

  const handleGenerate = async () => {
    const { name, dateOfBirth, timeOfBirth, placeOfBirth } = form;
    if (!name || !dateOfBirth || !timeOfBirth || !placeOfBirth) {
      Alert.alert('Missing Fields', 'Please fill in all birth details.');
      return;
    }
    // Basic date validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      Alert.alert('Invalid Date', 'Date must be in YYYY-MM-DD format.');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(timeOfBirth)) {
      Alert.alert('Invalid Time', 'Time must be in HH:MM (24hr) format.');
      return;
    }

    try {
      setGenerating(true);
      const res = await api.post('/api/kundali/generate', {
        name, dateOfBirth, timeOfBirth, placeOfBirth, timezoneOffset: 5.5,
      });
      if (res.data?.success) {
        const newK = res.data.data;
        setKundalis(prev => [newK, ...prev.filter(k => k.id !== newK.id)]);
        setSelected(newK);
        setShowForm(false);
        setActiveTab('Overview');
      }
    } catch (e) {
      Alert.alert('Generation Failed', e.response?.data?.message || e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selected?.id) return;
    try {
      setPdfLoading(true);
      const safeName = selected.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Kundali';
      const fileUri = FileSystem.documentDirectory + `Kundali_${safeName}_${selected.dateOfBirth}.pdf`;

      // Use the app's axios instance (has auth interceptor) with arraybuffer response
      const response = await api.get(
        `/api/kundali/${selected.id}/pdf?lang=${language}`,
        { responseType: 'arraybuffer', timeout: 60000 }
      );

      // Convert ArrayBuffer → base64 (chunked to avoid call-stack overflow on large PDFs)
      const bytes = new Uint8Array(response.data);
      let binary = '';
      const CHUNK = 8192;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
      }
      const base64 = btoa(binary);

      // Write to device storage
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf', dialogTitle: 'Share Kundali PDF' });
      } else {
        Alert.alert('Saved', `PDF saved to: ${fileUri}`);
      }
    } catch (e) {
      // Decode arraybuffer error body if present
      let msg = e.message;
      if (e.response?.data instanceof ArrayBuffer) {
        try {
          const text = new TextDecoder().decode(e.response.data);
          const parsed = JSON.parse(text);
          msg = parsed.message || msg;
        } catch {}
      } else if (e.response?.data?.message) {
        msg = e.response.data.message;
      }
      Alert.alert('Download Failed', `${msg}\n(Status: ${e.response?.status ?? 'network error'})`);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDeleteKundali = () => {
    if (!selected?.id) return;
    Alert.alert(
      'Delete Kundali',
      `Are you sure you want to delete ${selected.name}'s Kundali? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/kundali/${selected.id}`);
              // Refresh the kundali list
              const res = await api.get('/api/kundali/list');
              setKundalis(res.data || []);
              setSelected(null);
              Alert.alert('Deleted', `${selected.name}'s Kundali has been deleted.`);
            } catch (e) {
              const msg = e.response?.data?.message || e.message;
              Alert.alert('Delete Failed', msg);
            }
          },
        },
      ]
    );
  };

  const renderKundaliCard = (k) => (
    <TouchableOpacity
      key={k.id}
      style={[styles.kundaliCard, selected?.id === k.id && styles.kundaliCardActive]}
      onPress={() => { setActiveTab('Overview'); fetchFullKundali(k.id); }}
    >
      <View style={styles.kundaliCardLeft}>
        <Text style={styles.kundaliCardName}>{k.name}</Text>
        <Text style={styles.kundaliCardSub}>{k.dateOfBirth}  •  {k.placeOfBirth}</Text>
        <Text style={styles.kundaliCardSigns}>
          {tSign(k.lagna?.sign)} {isHindi ? 'लग्न' : 'Lagna'}  •  {tSign(k.moonSign)} {isHindi ? 'चंद्र' : 'Moon'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C9A45A" />
    </TouchableOpacity>
  );

  // ── Render Form ──────────────────────────────────────────────────
  if (showForm) {
    return (
      <ImageBackground source={BG_IMAGE} style={styles.flex1} resizeMode="cover">
        {/* iOS: padding shifts content up; Android: height shrinks the container to keyboard-safe area */}
        <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#6A1039" />
            </TouchableOpacity>
            <Text style={styles.formHeaderTitle}>{L.formTitle}</Text>
            <TouchableOpacity onPress={() => toggleLanguage()} style={styles.langToggleBtn}>
              <Text style={styles.langToggleTxt}>{L.langToggleLabel}</Text>
            </TouchableOpacity>
          </View>

          {/* ref allows scrolling to the location field when dropdown opens */}
          <ScrollView
            ref={formScrollRef}
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formCard}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{L.fullName}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.inputField}
                    placeholder={L.namePlaceholder}
                    placeholderTextColor="#A08856"
                    value={form.name}
                    onChangeText={(t) => setForm(f => ({ ...f, name: t }))}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Date of Birth — picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{L.dob}</Text>
                <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
                  <View style={styles.pickerRow}>
                    <Text style={[styles.inputField, !form.dateOfBirth && { color: '#A08856' }]}>
                      {form.dateOfBirth || 'YYYY-MM-DD'}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#C9A45A" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.inputHint}>{L.dobHint}</Text>
              </View>

              {/* Time of Birth — picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{L.tob}</Text>
                <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowTimePicker(true)}>
                  <View style={styles.pickerRow}>
                    <Text style={[styles.inputField, !timeDisplay && { color: '#A08856' }]}>
                      {timeDisplay || 'Select time (AM / PM)'}
                    </Text>
                    <Ionicons name="time-outline" size={18} color="#C9A45A" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Birth Place — live search; scrolls into view so dropdown is visible above keyboard */}
              <View style={[styles.inputGroup, { zIndex: 9999 }]}>
                <Text style={styles.inputLabel}>{L.pob}</Text>
                <LocationInput
                  value={form.placeOfBirth}
                  onChangeText={(t) => setForm(f => ({ ...f, placeOfBirth: t }))}
                  placeholder={L.selectLocation}
                  onFocus={() => {
                    setTimeout(() => formScrollRef.current?.scrollTo({ y: 320, animated: true }), 150);
                  }}
                />
                <Text style={styles.inputHint}>{L.pobHint}</Text>
              </View>

              <TouchableOpacity
                style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
                onPress={handleGenerate}
                disabled={generating}
              >
                {generating
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={styles.generateBtnText}>{L.generateBtn}</Text>
                }
              </TouchableOpacity>
              <Text style={styles.generateNote}>{L.generateNote}</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display="spinner"
            minimumDate={new Date(1900, 0, 1)}
            maximumDate={new Date()}
            onChange={onDateChange}
          />
        )}
        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={timeObj}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}
      </ImageBackground>
    );
  }

  // ── No kundalis yet ──────────────────────────────────────────────
  if (!loading && kundalis.length === 0) {
    return (
      <ImageBackground source={BG_IMAGE} style={styles.flex1} resizeMode="cover">
        {/* Overlay for text readability over background image */}
        <View style={{ flex: 1, backgroundColor: 'rgba(255, 253, 248, 0.92)' }}>
          <View style={styles.headerRow}>
            <Text style={styles.screenTitle}>{L.screenTitle}</Text>
            <TouchableOpacity onPress={() => toggleLanguage()} style={styles.langToggleBtn}>
              <Text style={styles.langToggleTxt}>{L.langToggleLabel}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bookshelf" size={56} color="#C9A45A" style={styles.emptyIcon} />
            
            <View style={styles.emptyDivider} />
            <Text style={styles.emptyTitle}>{L.noKundali}</Text>
            <Text style={styles.emptyDesc}>{L.noKundaliDesc}</Text>
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.generateBtnText}>
                ✨ {L.generateKundali}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }

  const k = selected;

  
  // ── Render detail tabs ───────────────────────────────────────────
  const renderTab = () => {
    if (!k) return null;
    const planets = k.planets || {};
    const PLANET_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
    const presentYogas = (k.yogas || []).filter(y => y.isPresent);
    const presentDoshas = (k.doshas || []).filter(d => d.isPresent);
    const dasha = k.dasha || {};
    const interp = (isHindi && k.interpretationsHi) ? k.interpretationsHi : (k.interpretations || {});

    switch (activeTab) {
      case 'Overview':
        return (
          <View>
            <View style={styles.summaryGrid}>
              {[
                { label: L.summaryLagna,     value: tSign(k.lagna?.sign),    sub: `${k.lagna?.degree?.toFixed(1)}°`, icon: '↑' },
                { label: L.summaryMoon,      value: tSign(k.moonSign),        sub: tNak(k.moonNakshatra),             icon: '☽' },
                { label: L.summarySun,       value: tSign(k.sunSign),         sub: L.suryaRashi,                     icon: '☀' },
                { label: L.summaryNakshatra, value: tNak(k.moonNakshatra),    sub: `${isHindi ? 'पाद' : 'Pada'} ${k.moonPada || 1}`, icon: '✦' },
              ].map(({ label, value, sub, icon }) => (
                <View key={label} style={styles.summaryCard}>
                  <Text style={styles.summaryIcon}>{icon}</Text>
                  <Text style={styles.summaryValue}>{value || '—'}</Text>
                  <Text style={styles.summaryLabel}>{label}</Text>
                  <Text style={styles.summarySub}>{sub || ''}</Text>
                </View>
              ))}
            </View>

            <Section title={L.currentDasha} icon="calendar-clock">
              <View style={styles.dashaBox}>
                <View style={styles.dashaRow}>
                  <Text style={styles.dashaLabel}>{L.mahadasha}</Text>
                  <Text style={styles.dashaValue}>{tPlanet(dasha.currentMahadasha) || '—'}</Text>
                  <Text style={styles.dashaDate}>{dasha.mahadashaEndDate || ''}</Text>
                </View>
                <View style={styles.dashaRow}>
                  <Text style={styles.dashaLabel}>{L.antardasha}</Text>
                  <Text style={styles.dashaValue}>{tPlanet(dasha.currentAntardasha) || '—'}</Text>
                  <Text style={styles.dashaDate}>{dasha.antardashaEndDate || ''}</Text>
                </View>
                {dasha.currentPratyantar && (
                  <View style={styles.dashaRow}>
                    <Text style={styles.dashaLabel}>{L.pratyantar}</Text>
                    <Text style={styles.dashaValue}>{tPlanet(dasha.currentPratyantar)}</Text>
                    <Text style={styles.dashaDate}>{dasha.pratyantarEndDate || ''}</Text>
                  </View>
                )}
              </View>
            </Section>

            {presentYogas.length > 0 && (
              <Section title={L.yogasPresent(presentYogas.length)} icon="star-four-points">
                {presentYogas.slice(0, 3).map(y => (
                  <View key={y.name} style={styles.tagRow}>
                    <View style={styles.yogaTag}><Text style={styles.yogaTagText}>{y.name}</Text></View>
                    <Text style={styles.yogaStrength}>{tStrength(y.strength)}</Text>
                  </View>
                ))}
                {presentYogas.length > 3 && <Text style={styles.moreText}>{L.more(presentYogas.length - 3)}</Text>}
              </Section>
            )}

            {presentDoshas.length > 0 && (
              <Section title={L.doshasPresent(presentDoshas.length)} icon="alert-circle">
                {presentDoshas.map(d => (
                  <View key={d.name} style={styles.tagRow}>
                    <View style={styles.doshaTag}><Text style={styles.doshaTagText}>{d.name}</Text></View>
                    <Text style={[styles.yogaStrength, { color: d.severity === 'High' ? '#E57373' : '#FFB74D' }]}>{tSeverity(d.severity)}</Text>
                  </View>
                ))}
              </Section>
            )}

            {presentYogas.length === 0 && presentDoshas.length === 0 && (
              <Section title={L.yogasDoshas} icon="star">
                <Text style={styles.emptyDesc}>{L.viewInsights}</Text>
              </Section>
            )}
          </View>
        );

      case 'Chart':
        return (
          <View>
            <KundaliChart
              houses={k.houses || []} lagnaSign={k.lagna?.sign} title={L.d1Chart}
              tSignAbbr={tSignAbbr} tPlanetAbbr={tPlanetAbbr}
            />
            {k.navamsa && (
              <KundaliChart
                houses={buildNavamsaHouses(k.navamsa)} lagnaSign={k.navamsa.lagnaSign} title={L.d9Chart}
                tSignAbbr={tSignAbbr} tPlanetAbbr={tPlanetAbbr}
              />
            )}
            <Section title={L.housePlacements} icon="home">
              <View style={styles.tableHeader}>
                {L.houseHeaders.map((h, i) => (
                  <Text key={h} style={[styles.tableCell, styles.tableBold, i === 2 ? { flex: 2 } : { flex: 1 }]}>{h}</Text>
                ))}
              </View>
              {(k.houses || []).map((h, i) => (
                <View key={h.number} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{h.number}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{tSign(h.sign)}</Text>
                  <Text style={[styles.tableCell, { flex: 2, color: '#C8A45A' }]}>
                    {h.planets?.map(p => tPlanet(p)).join(', ') || '—'}
                  </Text>
                </View>
              ))}
            </Section>
          </View>
        );

      case 'Planets':
        return (
          <Section title={L.planetaryPos} icon="orbit">
            <View style={styles.tableHeader}>
              {L.planetHeaders.map((h, i) => (
                <Text key={h} style={[styles.tableCell, styles.tableBold, { flex: i === 2 ? 1.8 : i === 0 ? 1.2 : i === 3 ? 0.8 : i === 4 ? 0.6 : 1.5 }]}>{h}</Text>
              ))}
            </View>
            {PLANET_ORDER.map((pname, i) => (
              <PlanetRow key={pname} name={tPlanet(pname)} data={planets[pname]} alt={i % 2 === 1} tSign={tSign} tNak={tNak} />
            ))}
          </Section>
        );

      case 'Dashas': {
        const timeline = dasha.timeline || [];
        if (timeline.length === 0) {
          return (
            <View style={styles.loadingTab}>
              <ActivityIndicator color="#C9A45A" size="small" />
              <Text style={styles.loadingTabText}>{isHindi ? 'दशा डेटा लोड हो रहा है…' : 'Loading dasha data…'}</Text>
            </View>
          );
        }
        return (
          <View>
            <Section title={L.mahadashaTimeline} icon="timeline">
              {timeline.slice(0, 12).map(md => (
                <View key={md.planet + md.startDate} style={[styles.dashaTimelineItem, md.isCurrent && styles.dashaTimelineCurrent]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dashaTimelinePlanet, md.isCurrent && { color: '#C8A45A' }]}>
                      {md.isCurrent ? '► ' : ''}{tPlanet(md.planet)}
                    </Text>
                    <Text style={styles.dashaTimelineDates}>{md.startDate}  →  {md.endDate}</Text>
                  </View>
                  {md.isCurrent && <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>{L.active}</Text></View>}
                </View>
              ))}
            </Section>

            {timeline.find(m => m.isCurrent)?.antardashas?.length > 0 && (
              <Section title={L.antardashaIn(tPlanet(dasha.currentMahadasha))} icon="subdirectory-arrow-right">
                {timeline.find(m => m.isCurrent)?.antardashas.map(ad => (
                  <View key={ad.planet + ad.startDate} style={[styles.adItem, ad.isCurrent && styles.adItemCurrent]}>
                    <Text style={[styles.adPlanet, ad.isCurrent && { color: '#C8A45A', fontWeight: '700' }]}>
                      {ad.isCurrent ? '► ' : ''}{tPlanet(ad.planet)}
                    </Text>
                    <Text style={styles.adDates}>{ad.startDate}  →  {ad.endDate}</Text>
                  </View>
                ))}
              </Section>
            )}
          </View>
        );
      }

      case 'Insights':
        if (!interp.personality && !interp.career) {
          return (
            <View style={styles.loadingTab}>
              <ActivityIndicator color="#C9A45A" size="small" />
              <Text style={styles.loadingTabText}>{isHindi ? 'अंतर्दृष्टि लोड हो रही है…' : 'Loading insights…'}</Text>
            </View>
          );
        }
        return (
          <View>
            {[
              { key: 'personality', title: L.personality, icon: 'account-star' },
              { key: 'career', title: L.career, icon: 'briefcase' },
              { key: 'finance', title: L.finance, icon: 'currency-inr' },
              { key: 'marriage', title: L.marriage, icon: 'heart' },
              { key: 'health', title: L.health, icon: 'heart-pulse' },
              { key: 'spirituality', title: L.spirituality, icon: 'meditation' },
            ].map(({ key, title, icon }) => interp[key] ? (
              <Section key={key} title={title} icon={icon}>
                <Text style={styles.interpText}>{interp[key]}</Text>
              </Section>
            ) : null)}

            {(interp.strengths?.length > 0 || interp.challenges?.length > 0) && (
              <Section title={L.strengthsChallenges} icon="yin-yang">
                <View style={styles.scRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.scHeader, { color: '#4CAF50' }]}>{L.strengths}</Text>
                    {(interp.strengths || []).map((s, i) => (
                      <Text key={`str-${i}`} style={styles.scItem}>✓  {s}</Text>
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.scHeader, { color: '#E57373' }]}>{L.challenges}</Text>
                    {(interp.challenges || []).map((c, i) => (
                      <Text key={`chl-${i}`} style={styles.scItem}>→  {c}</Text>
                    ))}
                  </View>
                </View>
              </Section>
            )}

            {(interp.mantras?.length > 0 || interp.gemstones?.length > 0) && (
              <Section title={L.vedicRec} icon="hand-pointing-up">
                {interp.mantras?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.remedyHeader}>{L.mantras}</Text>
                    {interp.mantras.map((m, i) => <Text key={`man-${i}`} style={styles.remedyItem}>•  {m}</Text>)}
                  </View>
                )}
                {interp.gemstones?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.remedyHeader}>{L.gemstones}</Text>
                    {interp.gemstones.map((g, i) => <Text key={`gem-${i}`} style={styles.remedyItem}>•  {g}</Text>)}
                  </View>
                )}
                {interp.fastingDays?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.remedyHeader}>{L.fasting}</Text>
                    {interp.fastingDays.map((f, i) => <Text key={`fast-${i}`} style={styles.remedyItem}>•  {f}</Text>)}
                  </View>
                )}
                {interp.charities?.length > 0 && (
                  <View>
                    <Text style={styles.remedyHeader}>{L.charity}</Text>
                    {interp.charities.map((c, i) => <Text key={`char-${i}`} style={styles.remedyItem}>•  {c}</Text>)}
                  </View>
                )}
              </Section>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.flex1} resizeMode="cover">
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>{L.screenTitle}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => toggleLanguage()} style={styles.langToggleBtn}>
            <Text style={styles.langToggleTxt}>{L.langToggleLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={20} color="#C8A45A" />
            <Text style={styles.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && <ActivityIndicator color="#C9A45A" style={{ marginTop: 20 }} />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A45A" />}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Kundali selector */}
        {kundalis.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kundaliList} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {kundalis.map(k => renderKundaliCard(k))}
          </ScrollView>
        )}

        {k && (
          <View style={styles.detailContainer}>
            {/* Action buttons row */}
            <View style={styles.buttonRow}>
              {/* PDF Download */}
              <TouchableOpacity style={[styles.pdfBtn, { flex: 1 }]} onPress={handleDownloadPDF} disabled={pdfLoading}>
                {pdfLoading
                  ? <ActivityIndicator color="#FFFDF8" size="small" />
                  : <>
                      <Ionicons name="download-outline" size={18} color="#FFFDF8" />
                      <Text style={styles.pdfBtnText}>{L.downloadPdf}</Text>
                    </>
                }
              </TouchableOpacity>

              {/* Delete Kundali */}
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteKundali}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#6A1039" />
                <Text style={styles.deleteBtnText}>{L.deleteKundali}</Text>
              </TouchableOpacity>
            </View>

            {/* Tab bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 12 }}>
              {TAB_KEYS.map((tabKey, idx) => (
                <TouchableOpacity
                  key={tabKey}
                  style={[styles.tab, activeTab === tabKey && styles.tabActive]}
                  onPress={() => setActiveTab(tabKey)}
                >
                  <Text style={[styles.tabText, activeTab === tabKey && styles.tabTextActive]}>{L.tabs[idx]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tab content */}
            <View style={styles.tabContent}>
              {renderTab()}
            </View>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

// ── Helper: build navamsa houses ─────────────────────────────────────
const RASHIS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function buildNavamsaHouses(navamsa) {
  if (!navamsa?.lagnaSign) return [];
  const lagnaIdx = RASHIS.indexOf(navamsa.lagnaSign);
  const houses = [];
  for (let h = 1; h <= 12; h++) {
    const signIdx = (lagnaIdx + h - 1) % 12;
    const planetsInHouse = navamsa.planets
      ? Object.entries(navamsa.planets).filter(([, p]) => p.houseNumber === h).map(([name]) => name)
      : [];
    houses.push({ number: h, sign: RASHIS[signIdx], planets: planetsInHouse });
  }
  return houses;
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex1: { flex: 1 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 70,
    paddingBottom: 14,
  },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#6A1039', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langToggleBtn: { backgroundColor: 'rgba(201,164,90,0.08)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: '#C9A45A' },
  langToggleTxt: { color: '#C9A45A', fontSize: 12, fontWeight: '800' },
  newBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDF8', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#C9A45A' },
  newBtnText: { color: '#6A1039', fontSize: 13, fontWeight: '700', marginLeft: 4 },

  // Kundali selector list
  kundaliList: { maxHeight: 110 },
  kundaliCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDF8',
    borderRadius: 18, marginRight: 12, padding: 14, minWidth: 220,
    borderWidth: 1.5, borderColor: '#DFC895',
    elevation: 2, shadowColor: '#6A1039', shadowOpacity: 0.1, shadowRadius: 6,
  },
  kundaliCardActive: { borderColor: '#C9A45A', backgroundColor: '#F7F1E5' },
  kundaliCardLeft: { flex: 1 },
  kundaliCardName: { color: '#6A1039', fontSize: 15, fontWeight: '700' },
  kundaliCardSub: { color: '#75695C', fontSize: 11, marginTop: 2 },
  kundaliCardSigns: { color: '#6A1039', fontSize: 11, marginTop: 4, fontWeight: '600' },

  detailContainer: { paddingHorizontal: 0, marginTop: 12 },

  // Action buttons
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 18, marginHorizontal: 16 },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#6A1039', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
    gap: 8, elevation: 3, shadowColor: '#6A1039', shadowOpacity: 0.25, shadowRadius: 8,
  },
  pdfBtnText: { color: '#FFFDF8', fontSize: 14, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFDF8', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: '#E1D7C5', gap: 6,
  },
  deleteBtnText: { color: '#6A1039', fontSize: 12, fontWeight: '700' },

  // Tabs
  tabBar: { marginBottom: 12, paddingHorizontal: 16 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, marginRight: 8,
    backgroundColor: '#FFFDF8', borderWidth: 1, borderColor: '#DFC895',
  },
  tabActive: { backgroundColor: '#6A1039', borderColor: '#C9A45A' },
  tabText: { color: '#75695C', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#FFFDF8', fontWeight: '700' },

  tabContent: {},

  // Summary grid
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16, paddingHorizontal: 16 },
  summaryCard: {
    width: (SCREEN_W - 52) / 2, borderRadius: 18, padding: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#DFC895', backgroundColor: '#FFFDF8',
    elevation: 2, shadowColor: '#6A1039', shadowOpacity: 0.1, shadowRadius: 6,
  },
  summaryIcon: { fontSize: 24, marginBottom: 6, color: '#C9A45A' },
  summaryValue: { color: '#6A1039', fontSize: 16, fontWeight: '800' },
  summaryLabel: { color: '#75695C', fontSize: 10, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 },
  summarySub: { color: '#C9A45A', fontSize: 11, marginTop: 2, fontWeight: '600' },

  // Section
  section: {
    marginBottom: 16, marginHorizontal: 16, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#DFC895', backgroundColor: '#FFFDF8',
    elevation: 2, shadowColor: '#6A1039', shadowOpacity: 0.1, shadowRadius: 6,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E8DCC2', backgroundColor: 'rgba(106, 16, 57, 0.04)' },
  sectionTitle: { color: '#6A1039', fontSize: 13, fontWeight: '800', flex: 1, letterSpacing: 0.3 },
  sectionBody: { backgroundColor: '#FFFDF8', padding: 14 },

  // ── Diamond chart ─────────────────────────────────────────────────
  chartWrapper: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 },
  chartTitle: {
    color: '#6A1039', fontSize: 13, fontWeight: '800',
    marginBottom: 12, letterSpacing: 0.5, textAlign: 'center',
  },
  chartGrid: {
    position: 'relative',
    backgroundColor: '#F7F1E5',
    borderWidth: 2,
    borderColor: '#C9A45A',
    overflow: 'hidden',
  },
  centerLabel: {
    color: '#A08856', fontSize: 8, fontWeight: '700',
    textAlign: 'center', letterSpacing: 0.5,
  },
  // house number (top-right corner of the label block)
  houseNumber: {
    position: 'absolute', top: 0, right: 2,
    color: '#B8A080', fontSize: 7,
  },
  houseNumberLagna: { color: '#6A1039' },
  // sign abbreviation
  houseSign: { color: '#4A1831', fontSize: 9, fontWeight: '700', marginTop: 10 },
  houseSignLagna: { color: '#6A1039', fontSize: 10, fontWeight: '800' },
  // planets inside house
  housePlanets: { color: '#75695C', fontSize: 7.5, fontWeight: '600', textAlign: 'center' },
  housePlanetsLagna: { color: '#6A1039', fontWeight: '700' },
  // ASC label under house-1
  ascBadge: { color: '#C9A45A', fontSize: 6, fontWeight: '800', letterSpacing: 0.5 },

  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: 'rgba(106, 16, 57, 0.05)', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8, marginBottom: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 4, borderRadius: 4 },
  tableRowAlt: { backgroundColor: 'rgba(201, 164, 90, 0.03)' },
  tableCell: { color: '#75695C', fontSize: 11 },
  tableBold: { color: '#6A1039', fontWeight: '700' },

  // Dasha
  dashaBox: { gap: 8 },
  dashaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(106, 16, 57, 0.08)' },
  dashaLabel: { color: '#75695C', fontSize: 12, fontWeight: '600', width: 90 },
  dashaValue: { color: '#6A1039', fontSize: 15, fontWeight: '800', flex: 1 },
  dashaDate: { color: '#A08856', fontSize: 11, fontWeight: '500' },

  // Yoga/Dosha tags
  tagRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  yogaTag: { backgroundColor: '#F0F7EB', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: '#C9E4A0' },
  yogaTagText: { color: '#5A8C3A', fontSize: 12, fontWeight: '700' },
  doshaTag: { backgroundColor: '#FCF0E8', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: '#E8B599' },
  doshaTagText: { color: '#C97456', fontSize: 12, fontWeight: '700' },
  yogaStrength: { color: '#C9A45A', fontSize: 12, fontWeight: '600' },
  moreText: { color: '#75695C', fontSize: 11, marginTop: 6 },

  // Dasha timeline
  dashaTimelineItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(106, 16, 57, 0.08)' },
  dashaTimelineCurrent: { backgroundColor: 'rgba(201, 164, 90, 0.1)', borderRadius: 10, paddingHorizontal: 10, marginHorizontal: -10 },
  dashaTimelinePlanet: { color: '#6A1039', fontSize: 14, fontWeight: '800' },
  dashaTimelineDates: { color: '#A08856', fontSize: 11, marginTop: 3 },
  activeBadge: { backgroundColor: '#C9A45A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { color: '#2D2A26', fontSize: 9, fontWeight: '800' },
  adItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(106, 16, 57, 0.06)' },
  adItemCurrent: { backgroundColor: 'rgba(201, 164, 90, 0.08)', borderRadius: 8, paddingHorizontal: 8 },
  adPlanet: { color: '#6A1039', fontSize: 13, fontWeight: '700', width: 80 },
  adDates: { color: '#A08856', fontSize: 11 },

  // Insights
  interpText: { color: '#4A4238', fontSize: 13, lineHeight: 22 },
  scRow: { flexDirection: 'row', gap: 16 },
  scHeader: { fontSize: 13, fontWeight: '800', marginBottom: 10, color: '#6A1039' },
  scItem: { color: '#75695C', fontSize: 12, marginBottom: 6 },
  remedyHeader: { color: '#6A1039', fontSize: 13, fontWeight: '800', marginBottom: 10 },
  remedyItem: { color: '#75695C', fontSize: 12, marginBottom: 8, lineHeight: 18 },

  // Form
  formHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 54 : 70, paddingBottom: 14,
    backgroundColor: '#F7F1E5',
  },
  formHeaderTitle: { color: '#6A1039', fontSize: 18, fontWeight: '800' },
  backBtn: { padding: 8 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formContainer: { padding: 20, paddingBottom: 240, backgroundColor: '#FFFDF8' },
  formCard: {
    backgroundColor: '#FFFDF8', borderRadius: 20, padding: 20,
    borderWidth: 1.5, borderColor: '#DFC895', overflow: 'visible',
    elevation: 3, shadowColor: '#6A1039', shadowOpacity: 0.12, shadowRadius: 8,
  },
  inputGroup: { marginBottom: 18 },
  inputLabel: { color: '#6A1039', fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  inputWrapper: { borderWidth: 1.5, borderColor: '#DFC895', borderRadius: 14, backgroundColor: '#F7F1E5', paddingHorizontal: 16, paddingVertical: 14 },
  inputField: { color: '#2D2A26', fontSize: 15 },
  inputPlaceholder: { color: '#A08856' },
  inputHint: { color: '#A08856', fontSize: 10, marginTop: 6 },

  generateBtnDisabled: { opacity: 0.6 },
  generateBtn: {
  minWidth: 260,
  height: 58,
  paddingHorizontal: 32,
  borderRadius: 30,
  backgroundColor: '#7A123E',

  alignItems: 'center',
  justifyContent: 'center',

  shadowColor: '#7A123E',
  shadowOffset: {
    width: 0,
    height: 8,
  },
  shadowOpacity: 0.25,
  shadowRadius: 16,

  elevation: 8,
},

generateBtnText: {
  color: '#FFF',
  fontSize: 18,
  fontWeight: '700',
},
  generateNote: { color: '#A08856', fontSize: 11, textAlign: 'center', marginTop: 14, lineHeight: 18 },

  // Loading tab
  loadingTab: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingTabText: { color: '#75695C', fontSize: 13 },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 24, color: '#C9A45A' },
  emptyDivider: { width: 40, height: 2, backgroundColor: '#C9A45A', marginVertical: 20 },
  emptyTitle: { color: '#6A1039', fontSize: 24, fontWeight: '800', marginTop: 0, marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 },
  emptyDesc: { color: '#75695C', fontSize: 13, textAlign: 'center', lineHeight: 22, marginBottom: 36, fontWeight: '500' },
});
