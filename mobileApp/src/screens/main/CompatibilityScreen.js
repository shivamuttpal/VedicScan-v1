import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, TextInput, Platform, KeyboardAvoidingView,
  Image, Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import LocationInput from '../../components/LocationInput';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../../config/api';

const MATCHING_ART = require('../../../assets/home/matching.jpg');

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const KOOTA_NAMES_HI = {
  varna: 'वर्ण', vashya: 'वश्य', tara: 'तारा', yoni: 'योनि',
  graha_maitri: 'ग्रह मैत्री', gana: 'गण', bhakoot: 'भकूट', nadi: 'नाड़ी',
};

const formatKootaName = (key, language) => {
  const normalized = key.toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (language === 'hi' && KOOTA_NAMES_HI[normalized]) return KOOTA_NAMES_HI[normalized];
  return normalized.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
};

const formatVerdict = (verdict, language) => {
  if (language !== 'hi') return verdict;
  const value = (verdict || '').toLowerCase();
  if (value.includes('excellent')) return 'उत्कृष्ट मिलान';
  if (value.includes('very good')) return 'बहुत अच्छा मिलान';
  if (value.includes('good')) return 'अच्छा मिलान';
  if (value.includes('average')) return 'औसत मिलान';
  if (value.includes('poor') || value.includes('low')) return 'कम मिलान';
  return verdict;
};

const parseDateLocal = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getScoreColor = (score, maxScore) => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 75) return C.green;
  if (percentage >= 50) return C.saffron;
  return C.red;
};

const getVerdictTheme = (verdict) => {
  const v = (verdict || '').toLowerCase();
  if (v.includes('excellent') || v.includes('very good')) return { color: '#2E7D32', bg: '#E8F5E9', icon: 'star-circle' };
  if (v.includes('good') || v.includes('average')) return { color: '#C9A45A', bg: '#FFF8E1', icon: 'star-half-full' };
  return { color: '#C62828', bg: '#FFEBEE', icon: 'alert-circle' };
};

// Premium report features shown in the paywall
const PREMIUM_FEATURES = [
  { icon: 'book-open-variant', text: '11-page detailed PDF report' },
  { icon: 'chart-bar', text: 'Deep dive on all 8 Gunas with classical references' },
  { icon: 'star-four-points', text: 'Best & worst matching analysis with explanations' },
  { icon: 'shield-alert', text: 'Complete Dosha report with cancellation conditions' },
  { icon: 'spa', text: 'Sacred remedies — mantras, puja, gemstones, fasting' },
  { icon: 'heart-pulse', text: 'Life area analysis: marriage, finance, health, children' },
  { icon: 'moon-waning-crescent', text: 'Detailed Nakshatra profiles for both partners' },
  { icon: 'crown', text: 'Luxury gold & maroon VedicScan design — shareable PDF' },
];

// ─── Premium Paywall Modal ────────────────────────────────────────────────────
const PremiumReportModal = ({ visible, onClose, onUpgrade, onPurchase, language }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={modal.overlay}>
      <View style={modal.sheet}>
        {/* Header */}
        <LinearGradient colors={['#4A0C1F', '#6E142F']} style={modal.header}>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <View style={modal.crownWrap}>
            <MaterialCommunityIcons name="crown" size={28} color="#C8A45A" />
          </View>
          <Text style={modal.headerTitle}>Full Compatibility Report</Text>
          <Text style={modal.headerSub}>
            {language === 'hi'
              ? 'सम्पूर्ण वैदिक विवाह विश्लेषण रिपोर्ट'
              : 'Complete Vedic Vivah Analysis — 9 Premium Pages'}
          </Text>
          {/* Score preview badge */}
          <View style={modal.previewBadge}>
            <Text style={modal.previewBadgeText}>✦  PREMIUM REPORT  ✦</Text>
          </View>
        </LinearGradient>

        <ScrollView style={modal.body} showsVerticalScrollIndicator={false}>
          {/* Feature list */}
          <Text style={modal.sectionLabel}>WHAT'S INCLUDED</Text>
          {PREMIUM_FEATURES.map((f, i) => (
            <View key={i} style={modal.featureRow}>
              <View style={modal.featureIconWrap}>
                <MaterialCommunityIcons name={f.icon} size={16} color="#C8A45A" />
              </View>
              <Text style={modal.featureText}>{f.text}</Text>
            </View>
          ))}

          <View style={modal.divider} />

          {/* Price options */}
          <Text style={modal.sectionLabel}>UNLOCK OPTIONS</Text>

          {/* Premium subscription */}
          <TouchableOpacity style={modal.optionCard} onPress={onUpgrade} activeOpacity={0.82}>
            <LinearGradient colors={['#4A0C1F', '#6E142F']} style={modal.optionGrad}>
              <View style={modal.optionLeft}>
                <Text style={modal.optionTitle}>VedicScan Premium</Text>
                <Text style={modal.optionDesc}>Unlimited reports + all features + AI chats</Text>
              </View>
              <View style={modal.optionRight}>
                <Text style={modal.optionPrice}>₹499</Text>
                <Text style={modal.optionPer}>/month</Text>
              </View>
            </LinearGradient>
            <View style={modal.optionBadge}>
              <Text style={modal.optionBadgeText}>BEST VALUE</Text>
            </View>
          </TouchableOpacity>

          {/* One-time purchase */}
          <TouchableOpacity style={[modal.optionCard, modal.optionCardAlt]} onPress={onPurchase} activeOpacity={0.82}>
            <View style={modal.optionLeft}>
              <Text style={[modal.optionTitle, { color: '#5A3948' }]}>This Report Only</Text>
              <Text style={[modal.optionDesc, { color: '#8A7070' }]}>One-time download, no subscription</Text>
            </View>
            <View style={modal.optionRight}>
              <Text style={[modal.optionPrice, { color: '#5A3948' }]}>₹1,499</Text>
              <Text style={[modal.optionPer, { color: '#8A7070' }]}>once</Text>
            </View>
          </TouchableOpacity>

          <Text style={modal.footerNote}>
            ✦ Premium subscribers get unlimited compatibility reports, kundali generation, AI Maharishi chats, and more. Cancel anytime.
          </Text>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
const CompatibilityScreen = ({ navigation }) => {
  const { hasProfile } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPremium, setDownloadingPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState('free');
  const scrollRef = React.useRef(null);

  const [boyData, setBoyData] = useState({ name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '' });
  const [girlData, setGirlData] = useState({ name: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '' });

  const [showBoyDatePicker, setShowBoyDatePicker] = useState(false);
  const [showBoyTimePicker, setShowBoyTimePicker] = useState(false);
  const [showGirlDatePicker, setShowGirlDatePicker] = useState(false);
  const [showGirlTimePicker, setShowGirlTimePicker] = useState(false);

  useEffect(() => {
    if (!hasProfile) { navigation.navigate('ProfileTab'); return; }
    fetchSubscriptionStatus();
  }, []);

  useEffect(() => {
    if (result?.guna_milan) { setAiExplanation(''); getAiExplanation(result); }
  }, [language]);

  const fetchSubscriptionStatus = async () => {
    try {
      const res = await api.get('/api/subscription/status');
      setSubscriptionPlan(res.data?.plan || 'free');
    } catch (err) {}
  };

  const isPremium = subscriptionPlan === 'premium';

  const checkCompatibility = async () => {
    if (!boyData.dateOfBirth || !boyData.timeOfBirth || !boyData.placeOfBirth) {
      Alert.alert(t('compatError'), t('compatBoyMissing')); return;
    }
    if (!girlData.dateOfBirth || !girlData.timeOfBirth || !girlData.placeOfBirth) {
      Alert.alert(t('compatError'), t('compatGirlMissing')); return;
    }

    setLoading(true);
    setResult(null);
    setAiExplanation('');

    try {
      const payload = {
        boy: { ...boyData, name: boyData.name || 'Boy' },
        girl: { ...girlData, name: girlData.name || 'Girl' },
      };
      const res = await api.post('/api/compatibility/analyze', payload);
      if (res.data) { setResult(res.data); getAiExplanation(res.data); }
    } catch (err) {
      Alert.alert(t('compatError'), err.response?.data?.message || t('compatCheckFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getAiExplanation = async (data) => {
    if (!data?.guna_milan) return;
    setLoadingAi(true);
    try {
      const prompt = `Act as a Maharshi Vedic Expert. Analyze the compatibility between ${data.boy_details?.nakshatra} (Groom) and ${data.girl_details?.nakshatra} (Bride).
      Total Guna Score: ${data.guna_milan.total_score}/36.
      Verdict: ${data.guna_milan.verdict}.
      Give a concise, 3-4 sentence spiritual and practical advice for this couple. Avoid technical jargon, focus on heart and soul connection.
      Respond in ${language === 'hi' ? 'Hindi using Devanagari script' : 'English'}.`;

      const aiRes = await api.post('/api/chat/message', { message: prompt });
      setAiExplanation(aiRes.data?.text || t('compatInsightFallback'));
    } catch (err) {
      setAiExplanation(t('compatInsightFallback'));
    } finally {
      setLoadingAi(false);
    }
  };

  // Free basic report — client-side HTML PDF
  const downloadBasicReport = async () => {
    if (!result?.guna_milan || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const milan = result.guna_milan;
      const totalScore = Number(milan.total_score) || 0;
      const percentage = Math.max(0, Math.min(100, Number(milan.percentage) || ((totalScore / 36) * 100)));
      const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
      const generatedDate = new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
      const groomName = boyData.name || t('compatGroom');
      const brideName = girlData.name || t('compatBride');
      const kootaRows = Object.entries(result.koota_details || {}).map(([key, detail]) => `
        <tr>
          <td class="koota-name">${escapeHtml(formatKootaName(key, language))}</td>
          <td>${escapeHtml(detail.description || '—')}</td>
          <td class="score-cell">${escapeHtml(String(detail.received))}/${escapeHtml(String(detail.max))}</td>
        </tr>
      `).join('');

      const html = `<!doctype html><html lang="${language}"><head><meta charset="UTF-8"/>
        <style>
          @page{size:A4;margin:28px}*{box-sizing:border-box}
          body{margin:0;color:#4f3e46;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans Devanagari",Arial,sans-serif;font-size:12px;line-height:1.5;background:#fff}
          .report{border:1px solid #eadfd9;border-radius:18px;overflow:hidden}
          .header{padding:28px 32px;background:linear-gradient(135deg,#fff8f3 0%,#f8e9ed 100%);border-bottom:1px solid #ead9de}
          h1{margin:22px 0 4px;color:#583846;font-size:27px;font-weight:500}
          .content{padding:26px 32px 30px}
          .score{color:#8b5a6d;font-size:34px;font-weight:500}
          .track{height:7px;border-radius:4px;overflow:hidden;background:#e9dfdb}
          .fill{height:100%;width:${percentage}%;background:linear-gradient(90deg,#cda66b,#9c6275)}
          table{width:100%;border-collapse:collapse;border:1px solid #ece2dd;border-radius:12px}
          th{padding:9px 10px;text-align:left;background:#f8f1ee;color:#846d67;font-size:9px;font-weight:500;text-transform:uppercase}
          td{padding:9px 10px;border-top:1px solid #f0e8e4;color:#7a6863;font-size:10px}
          .footer{padding:14px 32px;border-top:1px solid #eee4df;color:#aa9690;font-size:9px;text-align:center}
          .guidance{padding:17px 18px;border:1px solid #eaded8;border-radius:14px;background:linear-gradient(135deg,#fffaf5,#fff);color:#65515a}
          .note{margin-top:24px;padding:13px 15px;border-radius:12px;background:#f8f4f1;color:#8e7d77;font-size:9px}
        </style></head>
        <body><div class="report">
          <div class="header">
            <div style="color:#75485b;letter-spacing:.8px">VEDICSCAN</div>
            <h1>${escapeHtml(t('compatReportTitle'))}</h1>
            <div style="color:#9a7b87">${escapeHtml(groomName)} &amp; ${escapeHtml(brideName)}</div>
          </div>
          <div class="content">
            <div style="display:flex;gap:18px;margin-bottom:26px">
              <div style="border:1px solid #ebdfda;border-radius:16px;padding:18px;text-align:center;background:#fffcfa;width:36%">
                <div class="score">${totalScore}</div>
                <div style="color:#9c8d89;font-size:12px">/ 36</div>
              </div>
              <div style="flex:1;border-radius:16px;padding:18px;background:#f9f3ef">
                <div style="color:#a0785f;font-size:9px;text-transform:uppercase;letter-spacing:1px">${escapeHtml(t('compatSummary'))}</div>
                <div style="margin:5px 0 14px;color:#654752;font-size:18px;font-weight:500">${escapeHtml(formatVerdict(milan.verdict, language))}</div>
                <div class="track"><div class="fill"></div></div>
                <div style="display:flex;justify-content:space-between;margin-top:7px;color:#8b7872;font-size:10px">
                  <span>${escapeHtml(t('compatMatchHarmony'))}</span><span>${Math.round(percentage)}%</span>
                </div>
              </div>
            </div>
            <div style="margin-top:26px">
              <h3 style="margin:0 0 12px;color:#5c404c;font-size:16px">${escapeHtml(t('compatKootaBreakdown'))}</h3>
              <table><thead><tr><th>${escapeHtml(t('compatKoota'))}</th><th>${escapeHtml(t('compatDescription'))}</th><th style="text-align:right">${escapeHtml(t('compatScore'))}</th></tr></thead>
              <tbody>${kootaRows || '<tr><td colspan="3">—</td></tr>'}</tbody></table>
            </div>
            <div style="margin-top:26px">
              <h3 style="margin:0 0 12px;color:#5c404c;font-size:16px">${escapeHtml(t('compatGuidance'))}</h3>
              <div class="guidance">${escapeHtml(aiExplanation || t('compatInsightFallback'))}</div>
            </div>
            <div class="note"><strong>${escapeHtml(t('compatDisclaimer'))}</strong><br>${escapeHtml(t('compatDisclaimerText'))}</div>
          </div>
          <div class="footer">VedicScan · ${escapeHtml(t('compatAshtaKoota'))} · ${escapeHtml(generatedDate)}</div>
        </div></body></html>`;

      if (Platform.OS === 'web') { await Print.printAsync({ html }); return; }
      const file = await Print.printToFileAsync({ html });
      const reportUri = `${FileSystem.cacheDirectory}VedicScan-Guna-Matching-${Date.now()}.pdf`;
      await FileSystem.copyAsync({ from: file.uri, to: reportUri });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(reportUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: t('compatShareReport') });
      } else {
        Alert.alert(t('compatReportTitle'), t('compatShareUnavailable'));
      }
    } catch (error) {
      Alert.alert(t('compatReportTitle'), t('compatReportError'));
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Premium report — 9-page PDFKit report from backend
  const downloadPremiumReport = async () => {
    if (!result?.guna_milan || downloadingPremium) return;

    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setDownloadingPremium(true);
    try {
      const payload = {
        boy: { ...boyData, name: boyData.name || 'Groom' },
        girl: { ...girlData, name: girlData.name || 'Bride' },
      };
      const res = await api.post('/api/compatibility/report', payload);

      if (!res.data?.pdf) throw new Error('No PDF returned');

      const base64 = res.data.pdf;
      const filename = res.data.filename || `VedicScan-Compatibility-${Date.now()}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: t('compatPremiumShareTitle'),
        });
      } else {
        Alert.alert(t('compatPremiumReportTitle'), t('compatShareUnavailable'));
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setShowPremiumModal(true);
      } else {
        Alert.alert(t('compatPremiumReportTitle'), t('compatPremiumReportError'));
      }
    } finally {
      setDownloadingPremium(false);
    }
  };

  const handleUpgrade = () => {
    setShowPremiumModal(false);
    navigation.navigate('PricingScreen');
  };

  const handlePurchaseReport = () => {
    setShowPremiumModal(false);
    // Navigate to pricing with one-time purchase pre-selected
    navigation.navigate('PricingScreen', { feature: 'compatibility-report' });
  };

  const renderInputCard = (type, data, setData, showDatePicker, setShowDatePicker, showTimePicker, setShowTimePicker) => {
    const isBoy = type === 'Boy';
    return (
      <View style={[styles.inputCard, { zIndex: isBoy ? 10 : 1 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.genderIcon, { backgroundColor: isBoy ? '#F8EEE7' : '#F8EAEE' }]}>
              <MaterialCommunityIcons name={isBoy ? "gender-male" : "gender-female"} size={19} color={isBoy ? "#A66D4F" : "#9B6476"} />
            </View>
            <View>
              <Text style={styles.cardEyebrow}>{isBoy ? t('compatPartnerOne') : t('compatPartnerTwo')}</Text>
              <Text style={styles.cardTitle}>{isBoy ? t('compatGroomDetails') : t('compatBrideDetails')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('compatFullName')}</Text>
            <TextInput
              style={styles.compactInput}
              placeholder={t('compatEnterName')}
              value={data.name}
              onChangeText={(val) => setData({ ...data, name: val })}
              placeholderTextColor="#C0C0C0"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.fieldLabel}>{t('compatBirthDate')}</Text>
              <TouchableOpacity style={styles.compactInput} onPress={() => setShowDatePicker(true)}>
                <Text style={{ fontSize: 13, color: data.dateOfBirth ? C.text : "#C0C0C0" }}>
                  {data.dateOfBirth || 'YYYY-MM-DD'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>{t('compatBirthTime')}</Text>
              <TouchableOpacity style={styles.compactInput} onPress={() => setShowTimePicker(true)}>
                <Text style={{ fontSize: 13, color: data.timeOfBirth ? C.text : "#C0C0C0" }}>
                  {data.timeOfBirth || 'HH:MM'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('compatBirthPlace')}</Text>
            <LocationInput
              value={data.placeOfBirth}
              onChangeText={(val) => setData({ ...data, placeOfBirth: val })}
              placeholder={t('compatEnterBirthCity')}
              soft
              onFocus={() => {
                if (type === 'Girl') setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
              }}
            />
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={data.dateOfBirth ? parseDateLocal(data.dateOfBirth) : new Date(1990, 0, 1)}
            mode="date" display="spinner"
            minimumDate={new Date(1900, 0, 1)} maximumDate={new Date()}
            onChange={(e, date) => { setShowDatePicker(false); if (date) setData({ ...data, dateOfBirth: formatLocalDate(date) }); }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={(() => {
              const d = new Date();
              if (data.timeOfBirth) { const [h, m] = data.timeOfBirth.split(':'); d.setHours(parseInt(h), parseInt(m)); }
              return d;
            })()}
            mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, time) => {
              setShowTimePicker(false);
              if (time) setData({ ...data, timeOfBirth: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) });
            }}
          />
        )}
      </View>
    );
  };

  const renderInput = () => (
    <View style={styles.body}>
      <View style={styles.verticalInputStack}>
        {renderInputCard('Boy', boyData, setBoyData, showBoyDatePicker, setShowBoyDatePicker, showBoyTimePicker, setShowBoyTimePicker)}
        <View style={styles.connectorLine}>
          <View style={styles.line} />
          <View style={styles.connectorCircle}><Ionicons name="heart-outline" size={16} color="#A86C7D" /></View>
          <View style={styles.line} />
        </View>
        {renderInputCard('Girl', girlData, setGirlData, showGirlDatePicker, setShowGirlDatePicker, showGirlTimePicker, setShowGirlTimePicker)}
      </View>

      <TouchableOpacity style={styles.mainCheckBtn} onPress={checkCompatibility} disabled={loading} activeOpacity={0.8}>
        <LinearGradient colors={['#9C6275', '#B77B82']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mainCheckBtnGrad}>
          {loading ? <ActivityIndicator color={C.white} /> : <Text style={styles.mainCheckBtnText}>{t('compatCheck')}</Text>}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color="#A87861" style={{ marginRight: 9 }} />
        <Text style={styles.infoText}>{t('compatInfo')}</Text>
      </View>
    </View>
  );

  const renderResult = () => {
    const milan = result.guna_milan;
    const totalScore = Number(milan.total_score) || 0;
    const scorePercentage = Math.max(0, Math.min(100, Number(milan.percentage) || ((totalScore / 36) * 100)));
    const formattedScore = totalScore.toFixed(Number.isInteger(totalScore) ? 0 : 1);
    const vTheme = getVerdictTheme(milan.verdict);

    return (
      <View style={styles.body}>
        {/* Score Card */}
        <View style={styles.premiumResultCard}>
          <LinearGradient colors={['#FFF', '#FFFDF8']} style={styles.premiumResultGrad}>
            <View style={styles.visualScoreSection}>
              <View style={styles.scoreRingContainer}>
                <View style={[styles.scoreRingOuter, { borderColor: vTheme.bg }]}>
                  <Text style={[styles.visualScoreValue, { color: vTheme.color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {formattedScore}
                  </Text>
                  <Text style={styles.visualScoreMax}>/ 36</Text>
                </View>
                <View style={[styles.verdictBadgeSmall, { backgroundColor: vTheme.bg }]}>
                  <MaterialCommunityIcons name={vTheme.icon} size={14} color={vTheme.color} style={{ marginRight: 4 }} />
                  <Text style={[styles.verdictTextSmall, { color: vTheme.color }]}>{formatVerdict(milan.verdict, language)}</Text>
                </View>
              </View>

              <View style={styles.matchProgressBarWrap}>
                <View style={styles.matchProgressLabels}>
                  <Text style={styles.matchProgressText}>{t('compatMatchHarmony')}</Text>
                  <Text style={[styles.matchProgressVal, { color: vTheme.color }]}>{Math.round(scorePercentage)}%</Text>
                </View>
                <View style={styles.matchProgressTrack}>
                  <LinearGradient colors={['#F0F0F0', vTheme.color]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.matchProgressFill, { width: `${scorePercentage}%` }]} />
                </View>
              </View>

              {/* ── Premium Report Button ── */}
              <TouchableOpacity
                style={styles.premiumReportBtn}
                onPress={downloadPremiumReport}
                disabled={downloadingPremium}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4A0C1F', '#6E142F', '#8B3A4F']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.premiumReportGrad}
                >
                  {downloadingPremium ? (
                    <ActivityIndicator size="small" color="#C8A45A" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name={isPremium ? "file-pdf-box" : "crown"} size={20} color="#C8A45A" />
                      <View style={styles.premiumReportTextWrap}>
                        <Text style={styles.premiumReportTitle}>{t('compatPremiumReportTitle')}</Text>
                        <Text style={styles.premiumReportSub}>
                          {isPremium ? t('compatPremiumReportSub') : t('compatPremiumReportLocked')}
                        </Text>
                      </View>
                      {!isPremium && (
                        <View style={styles.premiumLockBadge}>
                          <Ionicons name="lock-closed" size={12} color="#4A0C1F" />
                        </View>
                      )}
                      {isPremium && <Ionicons name="chevron-forward" size={18} color="rgba(200,164,90,0.6)" />}
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Basic report link */}
              <TouchableOpacity style={styles.basicReportBtn} onPress={downloadBasicReport} disabled={downloadingPdf} activeOpacity={0.78}>
                {downloadingPdf ? <ActivityIndicator size="small" color="#8F5B6F" /> : <Ionicons name="document-text-outline" size={16} color="#8F5B6F" />}
                <Text style={styles.basicReportText}>
                  {downloadingPdf ? t('compatPreparingReport') : t('compatDownloadReport')}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Dashboard */}
        <Text style={styles.insightsHeader}>{t('compatDashboard')}</Text>

        <View style={styles.insightsCard}>
          <View style={styles.insightsCardHeader}>
            <Text style={styles.insightsCardTitle}>{t('compatCosmicBreakdown')}</Text>
          </View>

          <View style={styles.dashboardRow}>
            <View style={styles.dashboardItem}>
              <View style={styles.sideIndicatorBoy} />
              <Text style={styles.dashboardLabelSmall}>{t('compatGroom')}</Text>
              <Text style={styles.dashboardValue} numberOfLines={1}>{result.boy_details?.nakshatra || boyData.name}</Text>
              <Text style={styles.dashboardSubValue}>{result.boy_details?.rasi || ''}</Text>
            </View>
            <View style={styles.dashboardItem}>
              <View style={styles.sideIndicatorGirl} />
              <Text style={styles.dashboardLabelSmall}>{t('compatBride')}</Text>
              <Text style={styles.dashboardValue} numberOfLines={1}>{result.girl_details?.nakshatra || girlData.name}</Text>
              <Text style={styles.dashboardSubValue}>{result.girl_details?.rasi || ''}</Text>
            </View>
          </View>

          <View style={styles.softDivider} />

          {result.koota_details && (
            <View style={styles.kootaSection}>
              {Object.entries(result.koota_details).map(([key, k]) => (
                <View key={key} style={styles.kootaRow}>
                  <View style={styles.kootaInfo}>
                    <Text style={styles.kootaName}>{formatKootaName(key, language)}</Text>
                    <Text style={styles.kootaDesc}>{k.description || ''}</Text>
                  </View>
                  <Text style={[styles.kootaScore, { color: k.received >= k.max / 2 ? C.green : C.red }]}>
                    {k.received}/{k.max}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* AI Insight */}
          <View style={styles.aiDashboardSection}>
            <LinearGradient colors={['#FFFDF8', '#FFF']} style={styles.aiInsightBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.aiIconWrap}>
                    <MaterialCommunityIcons name="auto-fix" size={16} color="#C9A45A" />
                  </View>
                  <Text style={styles.aiDashboardTitle}>{t('compatMaharishiInsight')}</Text>
                </View>
                {loadingAi && <ActivityIndicator size="small" color="#C9A45A" />}
              </View>
              {loadingAi && !aiExplanation
                ? <Text style={styles.aiDashboardBody}>{t('compatSeekingGuidance')}</Text>
                : <Text style={styles.aiDashboardBody}>{aiExplanation || t('compatInsightFallback')}</Text>
              }
              {!loadingAi && !aiExplanation && (
                <TouchableOpacity style={styles.retryAiBtn} onPress={() => getAiExplanation(result)}>
                  <Text style={styles.retryAiText}>{t('compatGetInsights')}</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>

          <TouchableOpacity style={styles.resetBtnDashboard} onPress={() => { setResult(null); setAiExplanation(''); }}>
            <Text style={styles.resetBtnText}>{t('compatMatchAnother')}</Text>
          </TouchableOpacity>
        </View>

        {/* Premium paywall modal */}
        <PremiumReportModal
          visible={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onUpgrade={handleUpgrade}
          onPurchase={handlePurchaseReport}
          language={language}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFF9F5', '#FAEEF1']} style={styles.header}>
        <Image source={MATCHING_ART} style={styles.headerArt} resizeMode="cover" />
        <LinearGradient colors={['rgba(255,250,246,0.76)', 'rgba(250,238,241,0.91)']} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View style={styles.headerOrbLarge} />
        <View style={styles.headerOrbSmall} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#6E4758" />
          </TouchableOpacity>
          <View style={styles.headerRightControls}>
            <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage} activeOpacity={0.72}>
              <Text style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}>EN</Text>
              <View style={styles.languageDivider} />
              <Text style={[styles.languageOption, language === 'hi' && styles.languageOptionActive]}>हिं</Text>
            </TouchableOpacity>
            <View style={styles.headerPill}>
              <Ionicons name="sparkles-outline" size={13} color="#A87861" />
              <Text style={styles.headerPillText}>{t('compatAshtaKoota')}</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="heart-multiple-outline" size={25} color="#9B6476" />
        </View>
        <Text style={styles.headerTitle}>{t('compatTitle')}</Text>
        <Text style={styles.headerSub}>{t('compatSubtitle')}</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 160 }}>
          {result ? renderResult() : renderInput()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FBF8F4',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  header: { paddingTop: 24, paddingBottom: 20, paddingHorizontal: 24, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  crownWrap: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: 'rgba(200,164,90,0.15)',
    borderWidth: 1, borderColor: 'rgba(200,164,90,0.35)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#FDF8EF', letterSpacing: 0.2, textAlign: 'center' },
  headerSub: { fontSize: 11, color: 'rgba(253,248,239,0.65)', marginTop: 4, textAlign: 'center' },
  previewBadge: {
    marginTop: 12,
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(200,164,90,0.4)',
    backgroundColor: 'rgba(200,164,90,0.1)',
  },
  previewBadgeText: { fontSize: 9, fontWeight: '600', color: '#C8A45A', letterSpacing: 1.5 },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '600', color: '#8A7070', letterSpacing: 1.2, marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  featureIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: 'rgba(200,164,90,0.1)',
    borderWidth: 1, borderColor: 'rgba(200,164,90,0.2)',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  featureText: { flex: 1, fontSize: 13, color: '#5A3948', fontWeight: '400' },
  divider: { height: 1, backgroundColor: '#EDE4DE', marginVertical: 18 },
  optionCard: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 12,
    shadowColor: '#4A0C1F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
    position: 'relative',
  },
  optionGrad: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  optionCardAlt: {
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E8DADC',
  },
  optionLeft: { flex: 1 },
  optionRight: { alignItems: 'flex-end' },
  optionTitle: { fontSize: 15, fontWeight: '600', color: '#FDF8EF' },
  optionDesc: { fontSize: 11, color: 'rgba(253,248,239,0.65)', marginTop: 2 },
  optionPrice: { fontSize: 20, fontWeight: '700', color: '#C8A45A' },
  optionPer: { fontSize: 10, color: 'rgba(200,164,90,0.7)', marginTop: 2 },
  optionBadge: {
    position: 'absolute', top: -1, right: 12,
    backgroundColor: '#C8A45A', paddingHorizontal: 8, paddingVertical: 3,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
  },
  optionBadgeText: { fontSize: 8, fontWeight: '700', color: '#4A0C1F', letterSpacing: 0.5 },
  footerNote: { fontSize: 11, color: '#8A7070', textAlign: 'center', lineHeight: 17, marginTop: 8, marginBottom: 24 },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF8F4' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 28, paddingHorizontal: 20,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: '#F0DEE3',
  },
  headerArt: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.38 },
  headerOrbLarge: { position: 'absolute', width: 180, height: 180, borderRadius: 90, right: -52, top: -72, backgroundColor: 'rgba(210,161,172,0.12)' },
  headerOrbSmall: { position: 'absolute', width: 90, height: 90, borderRadius: 45, left: -35, bottom: -35, backgroundColor: 'rgba(222,183,144,0.12)' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, zIndex: 1 },
  headerRightControls: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: '#EEDDE2', justifyContent: 'center', alignItems: 'center' },
  headerPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.62)', borderWidth: 1, borderColor: '#EDDEE1' },
  headerPillText: { fontSize: 8.5, fontWeight: '500', letterSpacing: 1, color: '#8E6C61' },
  languageToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: '#EDDEE1' },
  languageOption: { fontSize: 9.5, fontWeight: '400', color: '#B09A98' },
  languageOptionActive: { fontWeight: '500', color: '#74495B' },
  languageDivider: { width: 1, height: 11, backgroundColor: '#E5D4D8' },
  headerIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEDDE2', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 11, shadowColor: '#8D6070', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 },
  headerTitle: { fontSize: 25, fontWeight: '500', color: '#5A3948', textAlign: 'center', letterSpacing: -0.4 },
  headerSub: { fontSize: 12, fontWeight: '400', color: '#9A7B87', textAlign: 'center', marginTop: 5 },
  body: { paddingHorizontal: 16, paddingTop: 20 },
  verticalInputStack: { width: '100%' },
  inputCard: { padding: 18, borderRadius: 22, marginBottom: 0, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ECE3DE', shadowColor: '#72515E', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  genderIcon: { width: 38, height: 38, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 11 },
  cardEyebrow: { fontSize: 8.5, fontWeight: '500', letterSpacing: 1, color: '#AB9188', marginBottom: 2 },
  cardTitle: { fontSize: 16, fontWeight: '500', color: '#604650' },
  cardBody: { gap: 12 },
  fieldGroup: { marginBottom: 2 },
  fieldLabel: { fontSize: 9, fontWeight: '500', color: '#947C72', letterSpacing: 0.75, textTransform: 'uppercase', marginBottom: 7, marginLeft: 2 },
  compactInput: { minHeight: 48, justifyContent: 'center', backgroundColor: '#FCFAF8', borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, fontWeight: '400', color: '#54474B', borderWidth: 1, borderColor: '#ECE6E2' },
  row: { flexDirection: 'row' },
  connectorLine: { height: 52, alignItems: 'center', justifyContent: 'center' },
  line: { width: 1, height: 10, backgroundColor: '#E5D7D9' },
  connectorCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF8F8', borderWidth: 1, borderColor: '#EAD9DD', justifyContent: 'center', alignItems: 'center', elevation: 1, shadowColor: '#8D6070', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5, zIndex: 10 },
  mainCheckBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 24, elevation: 2 },
  mainCheckBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  mainCheckBtnText: { color: C.white, fontSize: 15, fontWeight: '500', letterSpacing: 0.15 },
  infoBox: { flexDirection: 'row', marginTop: 20, padding: 15, backgroundColor: '#F8F2EF', borderRadius: 15, borderWidth: 1, borderColor: '#EDE1DC' },
  infoText: { flex: 1, fontSize: 11.5, color: '#806E68', lineHeight: 17, fontWeight: '400' },

  // Results
  premiumResultCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE3DE', shadowColor: '#72515E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 3 },
  premiumResultGrad: { padding: 24 },
  visualScoreSection: { alignItems: 'center' },
  scoreRingContainer: { alignItems: 'center', marginBottom: 20 },
  scoreRingOuter: { width: 132, height: 132, borderRadius: 66, backgroundColor: '#FFFCFA', borderWidth: 8, borderColor: '#F3EDEA', justifyContent: 'center', alignItems: 'center' },
  visualScoreValue: { width: '82%', fontSize: 34, fontWeight: '500', color: '#59464D', lineHeight: 38, textAlign: 'center' },
  visualScoreMax: { fontSize: 13, fontWeight: '400', color: '#9C8D89', marginTop: -2 },
  verdictBadgeSmall: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, marginTop: -14, maxWidth: '94%' },
  verdictTextSmall: { fontSize: 11, fontWeight: '500', letterSpacing: 0.25 },
  matchProgressBarWrap: { width: '100%', marginTop: 10 },
  matchProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  matchProgressText: { fontSize: 11, fontWeight: '400', color: '#8A7A76' },
  matchProgressVal: { fontSize: 12, fontWeight: '500' },
  matchProgressTrack: { height: 7, backgroundColor: '#F1ECE9', borderRadius: 4, overflow: 'hidden' },
  matchProgressFill: { height: '100%', borderRadius: 5 },

  // Premium report button
  premiumReportBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 20, elevation: 3, shadowColor: '#4A0C1F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 },
  premiumReportGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  premiumReportTextWrap: { flex: 1 },
  premiumReportTitle: { fontSize: 14, fontWeight: '600', color: '#FDF8EF', letterSpacing: 0.1 },
  premiumReportSub: { fontSize: 10.5, color: 'rgba(200,164,90,0.8)', marginTop: 2 },
  premiumLockBadge: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#C8A45A', justifyContent: 'center', alignItems: 'center' },

  // Basic report link
  basicReportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12, paddingVertical: 10 },
  basicReportText: { fontSize: 12, fontWeight: '400', color: '#8F6070', textDecorationLine: 'underline' },

  insightsHeader: { fontSize: 19, fontWeight: '500', color: '#59404C', marginHorizontal: 4, marginBottom: 12, marginTop: 6 },
  insightsCard: { padding: 20, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ECE3DE', shadowColor: '#72515E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  insightsCardHeader: { borderBottomWidth: 1, borderBottomColor: '#F2ECE8', paddingBottom: 12, marginBottom: 16 },
  insightsCardTitle: { fontSize: 11.5, fontWeight: '500', color: '#8D7975', letterSpacing: 0.35 },
  dashboardRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  dashboardItem: { flex: 1, paddingLeft: 12, position: 'relative' },
  sideIndicatorBoy: { position: 'absolute', left: 0, top: 4, bottom: 4, width: 2, backgroundColor: '#D9A98B', borderRadius: 2 },
  sideIndicatorGirl: { position: 'absolute', left: 0, top: 4, bottom: 4, width: 2, backgroundColor: '#C391A0', borderRadius: 2 },
  dashboardLabelSmall: { fontSize: 8.5, fontWeight: '500', color: '#AA9790', marginBottom: 4, letterSpacing: 0.7 },
  dashboardValue: { fontSize: 15, fontWeight: '500', color: '#5C4850' },
  dashboardSubValue: { fontSize: 11, color: '#8F7E79', marginTop: 2 },
  softDivider: { height: 1, backgroundColor: '#F0E7E3', marginVertical: 16 },
  kootaSection: { marginTop: 15 },
  kootaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#FAFAFA' },
  kootaInfo: { flex: 1 },
  kootaName: { fontSize: 13, fontWeight: '500', color: '#5C4850' },
  kootaDesc: { fontSize: 11, color: '#978782', marginTop: 3 },
  kootaScore: { fontSize: 13, fontWeight: '500', marginLeft: 15 },
  aiDashboardSection: { marginTop: 20 },
  aiInsightBox: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#EFE3DD' },
  aiIconWrap: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  aiDashboardTitle: { fontSize: 10, fontWeight: '500', color: '#A87861', letterSpacing: 0.8 },
  aiDashboardBody: { fontSize: 13, fontWeight: '400', color: '#68515B', lineHeight: 21 },
  retryAiBtn: { marginTop: 12, paddingVertical: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#FDF0D5' },
  retryAiText: { fontSize: 12, fontWeight: '500', color: '#A87861' },
  resetBtnDashboard: { marginTop: 25, paddingVertical: 14, borderRadius: 15, borderWidth: 1, borderColor: '#EDE4DF', alignItems: 'center', backgroundColor: '#FBF8F6' },
  resetBtnText: { color: '#806F6A', fontWeight: '500', fontSize: 13 },
});

export default CompatibilityScreen;
