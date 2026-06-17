import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, TextInput, Platform, Image, KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import LocationInput from '../../components/LocationInput';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VedicCard, GoldBar } from '../../components/VedicCard';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../config/api';

const LOGO = require('../../../assets/logo.jpeg');
const BANNER = require('../../../assets/bannerbackground5.webp');

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

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'High': return C.red;
    case 'Medium': return C.saffron;
    case 'Low': return C.teal;
    default: return C.textMid;
  }
};

const getVerdictTheme = (verdict) => {
  const v = (verdict || '').toLowerCase();
  if (v.includes('excellent') || v.includes('very good')) return { color: '#2E7D32', bg: '#E8F5E9', icon: 'star-circle' };
  if (v.includes('good') || v.includes('average')) return { color: '#C9A45A', bg: '#FFF8E1', icon: 'star-half-full' };
  return { color: '#C62828', bg: '#FFEBEE', icon: 'alert-circle' };
};



const CompatibilityScreen = ({ navigation }) => {
  const { hasProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const scrollRef = React.useRef(null);

  // Manual Entry States
  const [boyManual, setBoyManual] = useState(false);
  const [girlManual, setGirlManual] = useState(false);

  const [boyData, setBoyData] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
  });

  const [girlData, setGirlData] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
  });

  const [showBoyDatePicker, setShowBoyDatePicker] = useState(false);
  const [showBoyTimePicker, setShowBoyTimePicker] = useState(false);
  const [showGirlDatePicker, setShowGirlDatePicker] = useState(false);
  const [showGirlTimePicker, setShowGirlTimePicker] = useState(false);


  useEffect(() => {
    if (!hasProfile) {
      navigation.navigate('ProfileTab');
      return;
    }
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await api.get('/api/profiles');
      if (res.data) setProfiles(res.data);
    } catch (err) { }
  };

  const checkCompatibility = async () => {
    // Basic validation
    if (!boyData.dateOfBirth || !boyData.timeOfBirth || !boyData.placeOfBirth) {
      Alert.alert('Error', "Please fill all details for Boy");
      return;
    }
    if (!girlData.dateOfBirth || !girlData.timeOfBirth || !girlData.placeOfBirth) {
      Alert.alert('Error', "Please fill all details for Girl");
      return;
    }

    setLoading(true);
    setResult(null);
    setAiExplanation('');

    try {
      const payload = { 
        boy: { ...boyData, name: boyData.name || 'Boy' }, 
        girl: { ...girlData, name: girlData.name || 'Girl' } 
      };
      const res = await api.post('/api/compatibility/analyze', payload);
      if (res.data) {
        setResult(res.data);
        getAiExplanation(res.data);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Compatibility check failed');
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
      Give a concise, 3-4 sentence spiritual and practical advice for this couple. Avoid technical jargon, focus on heart and soul connection.`;
      
      const aiRes = await api.post('/api/chat/message', { message: prompt });
      if (aiRes.data?.text) {
        setAiExplanation(aiRes.data.text);
      } else {
        setAiExplanation("The celestial alignment suggests a unique path. Focus on mutual understanding and shared values for a harmonious journey.");
      }
    } catch (err) {
      console.log('AI Insight Error:', err);
      setAiExplanation("The stars are a bit hazy right now. Focus on the core Guna scores above for guidance.");
    } finally {
      setLoadingAi(false);
    }
  };


  const renderInputCard = (type, data, setData, showDatePicker, setShowDatePicker, showTimePicker, setShowTimePicker) => {
    const isBoy = type === 'Boy';
    return (
      <VedicCard style={[styles.inputCard, { borderColor: isBoy ? '#C9A45A' : '#6A1039', borderWidth: 1, zIndex: isBoy ? 10 : 1 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.genderIcon, { backgroundColor: isBoy ? '#FFF3E0' : '#FCE4EC' }]}>
              <MaterialCommunityIcons 
                name={isBoy ? "gender-male" : "gender-female"} 
                size={22} 
                color={isBoy ? "#C9A45A" : "#6A1039"} 
              />
            </View>
            <Text style={[styles.cardTitle, { color: isBoy ? "#C9A45A" : "#6A1039" }]}>
              {isBoy ? "Groom's Details" : "Bride's Details"}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.compactInput}
              placeholder="Enter name"
              value={data.name}
              onChangeText={(val) => setData({ ...data, name: val })}
              placeholderTextColor="#C0C0C0"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.fieldLabel}>Birth Date</Text>
              <TouchableOpacity style={styles.compactInput} onPress={() => setShowDatePicker(true)}>
                <Text style={{ fontSize: 13, color: data.dateOfBirth ? C.text : "#C0C0C0" }}>
                  {data.dateOfBirth || 'YYYY-MM-DD'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Birth Time</Text>
              <TouchableOpacity style={styles.compactInput} onPress={() => setShowTimePicker(true)}>
                <Text style={{ fontSize: 13, color: data.timeOfBirth ? C.text : "#C0C0C0" }}>
                  {data.timeOfBirth || 'HH:MM'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Birth Place</Text>
            <LocationInput
              value={data.placeOfBirth}
              onChangeText={(val) => setData({ ...data, placeOfBirth: val })}
              placeholder="Enter birth city"
              onFocus={() => {
                if (type === 'Girl') {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }
              }}
            />
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={data.dateOfBirth ? parseDateLocal(data.dateOfBirth) : new Date(1990, 0, 1)}
            mode="date"
            display="spinner"
            minimumDate={new Date(1900, 0, 1)}
            maximumDate={new Date()}
            onChange={(e, date) => {
              setShowDatePicker(false);
              if (date) setData({ ...data, dateOfBirth: formatLocalDate(date) });
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={(() => {
              const d = new Date();
              if (data.timeOfBirth) {
                const [h, m] = data.timeOfBirth.split(':');
                d.setHours(parseInt(h), parseInt(m));
              }
              return d;
            })()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, time) => {
              setShowTimePicker(false);
              if (time) setData({ ...data, timeOfBirth: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) });
            }}
          />
        )}
      </VedicCard>
    );
  };

  const renderInput = () => (
    <View style={styles.body}>
      <View style={styles.verticalInputStack}>
        {renderInputCard('Boy', boyData, setBoyData, showBoyDatePicker, setShowBoyDatePicker, showBoyTimePicker, setShowBoyTimePicker)}
        <View style={styles.connectorLine}>
          <View style={styles.line} />
          <View style={styles.connectorCircle}>
            <Ionicons name="heart" size={16} color="#C9A45A" />
          </View>
          <View style={styles.line} />
        </View>
        {renderInputCard('Girl', girlData, setGirlData, showGirlDatePicker, setShowGirlDatePicker, showGirlTimePicker, setShowGirlTimePicker)}
      </View>

      <TouchableOpacity 
        style={styles.mainCheckBtn} 
        onPress={checkCompatibility}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient colors={['#C9A45A', '#C9A45A']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.mainCheckBtnGrad}>
          {loading ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <Text style={styles.mainCheckBtnText}>Check Compatibility</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={18} color="#C9A45A" style={{ marginRight: 8 }} />
        <Text style={styles.infoText}>
          Compatibility matching in Vedic astrology is based on the 8 Kootas (Ashta Kootas) that influence a couple's marital life and harmony.
        </Text>
      </View>
    </View>
  );

  const renderResult = () => {
    const milan = result.guna_milan;
    const scorePercentage = milan.percentage || ((milan.total_score / 36) * 100);
    const vTheme = getVerdictTheme(milan.verdict);

    return (
      <View style={styles.body}>
        <VedicCard style={styles.premiumResultCard}>
          <LinearGradient colors={['#FFF', '#FFFDF8']} style={styles.premiumResultGrad}>
            <View style={styles.visualScoreSection}>
              <View style={styles.scoreRingContainer}>
                <View style={[styles.scoreRingOuter, { borderColor: vTheme.bg }]}>
                   <Text style={[styles.visualScoreValue, { color: vTheme.color }]}>{milan.total_score}</Text>
                   <Text style={styles.visualScoreMax}>/ 36</Text>
                </View>
                <View style={[styles.verdictBadgeSmall, { backgroundColor: vTheme.bg }]}>
                  <MaterialCommunityIcons name={vTheme.icon} size={14} color={vTheme.color} style={{ marginRight: 4 }} />
                  <Text style={[styles.verdictTextSmall, { color: vTheme.color }]}>{milan.verdict}</Text>
                </View>
              </View>
              
              <View style={styles.matchProgressBarWrap}>
                 <View style={styles.matchProgressLabels}>
                    <Text style={styles.matchProgressText}>Match Harmony</Text>
                    <Text style={[styles.matchProgressVal, { color: vTheme.color }]}>{Math.round(scorePercentage)}%</Text>
                 </View>
                 <View style={styles.matchProgressTrack}>
                    <LinearGradient 
                      colors={['#F0F0F0', vTheme.color]} 
                      start={{x:0, y:0}} end={{x:1, y:0}} 
                      style={[styles.matchProgressFill, { width: `${scorePercentage}%` }]} 
                    />
                 </View>
              </View>
            </View>
          </LinearGradient>
        </VedicCard>

        <Text style={styles.insightsHeader}>Match Dashboard</Text>
        
        <VedicCard style={styles.insightsCard}>
          <View style={styles.insightsCardHeader}>
            <Text style={styles.insightsCardTitle}>Cosmic Alignment Breakdown</Text>
          </View>
          
          <View style={styles.dashboardRow}>
             <View style={styles.dashboardItem}>
                <View style={styles.sideIndicatorBoy} />
                <Text style={styles.dashboardLabelSmall}>GROOM</Text>
                <Text style={styles.dashboardValue} numberOfLines={1}>{result.boy_details?.nakshatra || boyData.name}</Text>
                <Text style={styles.dashboardSubValue}>{result.boy_details?.rasi || ''}</Text>
             </View>
             <View style={styles.dashboardItem}>
                <View style={styles.sideIndicatorGirl} />
                <Text style={styles.dashboardLabelSmall}>BRIDE</Text>
                <Text style={styles.dashboardValue} numberOfLines={1}>{result.girl_details?.nakshatra || girlData.name}</Text>
                <Text style={styles.dashboardSubValue}>{result.girl_details?.rasi || ''}</Text>
             </View>
          </View>

          <GoldBar />

          {result.koota_details && (
            <View style={styles.kootaSection}>
              {Object.entries(result.koota_details).map(([key, k], idx) => (
                <View key={key} style={styles.kootaRow}>
                  <View style={styles.kootaInfo}>
                    <Text style={styles.kootaName}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                    <Text style={styles.kootaDesc}>{k.description || ''}</Text>
                  </View>
                  <Text style={[styles.kootaScore, { color: k.received >= k.max / 2 ? C.green : C.red }]}>
                    {k.received}/{k.max}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.aiDashboardSection}>
            <LinearGradient colors={['#FFFDF8', '#FFF']} style={styles.aiInsightBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.aiIconWrap}>
                    <MaterialCommunityIcons name="auto-fix" size={16} color="#C9A45A" />
                  </View>
                  <Text style={styles.aiDashboardTitle}>MAHARSHI AI INSIGHT</Text>
                </View>
                {loadingAi && <ActivityIndicator size="small" color="#C9A45A" />}
              </View>
              
              {loadingAi && !aiExplanation ? (
                <Text style={styles.aiDashboardBody}>Seeking guidance from the stars...</Text>
              ) : (
                <Text style={styles.aiDashboardBody}>
                  {aiExplanation || "Maharshi is taking a moment to align the constellations. Please try again."}
                </Text>
              )}
              
              {!loadingAi && !aiExplanation && (
                <TouchableOpacity 
                  style={styles.retryAiBtn}
                  onPress={() => getAiExplanation(result)}
                >
                  <Text style={styles.retryAiText}>Get AI Insights</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>

          <TouchableOpacity 
            style={styles.resetBtnDashboard} 
            onPress={() => {
              setResult(null);
              setAiExplanation('');
            }}
          >
            <Text style={styles.resetBtnText}>Match Another Couple</Text>
          </TouchableOpacity>
        </VedicCard>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6A1039', '#6A1039']} style={styles.header}>
        <Image source={BANNER} style={styles.headerBannerOverlay} />
        <View style={{ height: 40 }} /> 
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>
          <View style={styles.headerLogoContainer}>
             <Image source={LOGO} style={styles.headerLogo} />
          </View>
          <View style={{ width: 36 }} /> 
        </View>
        <Text style={styles.headerTitle}>Compatibility</Text>
        <Text style={styles.headerSub}>Divine Ashta-Koota Matching</Text>
      </LinearGradient>


      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollRef}
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          {result ? renderResult() : renderInput()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingTop: Platform.OS === 'ios' ? 65 : 55, paddingBottom: 25, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 35, borderBottomRightRadius: 35,
    overflow: 'hidden',
  },
  headerBannerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: 500, height: 500, resizeMode: 'cover', opacity: 0.8,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, zIndex: 1 },
  headerLogoContainer: {
    width: 46, height: 46, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  headerLogo: { width: 38, height: 38, resizeMode: 'contain' },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.white, textAlign: 'center' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 2 },
  body: { paddingHorizontal: 16, paddingTop: 16 },

  verticalInputStack: { width: '100%' },
  inputCard: { padding: 16, borderRadius: 20, marginBottom: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  genderIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  


  cardBody: { gap: 10 },
  fieldGroup: { marginBottom: 4 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#A08856', textTransform: 'uppercase', marginBottom: 4, marginLeft: 2 },
  compactInput: { 
    backgroundColor: '#FAFAFA', borderRadius: 10, padding: 10, fontSize: 13, color: C.text,
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  row: { flexDirection: 'row' },

  connectorLine: { height: 40, alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  line: { width: 1, height: 10, backgroundColor: '#EBEBEB' },
  connectorCircle: { 
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', 
    borderWidth: 1, borderColor: '#F7F1E5', justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
    zIndex: 10,
  },

  mainCheckBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 24, elevation: 4 },
  mainCheckBtnGrad: { paddingVertical: 15, alignItems: 'center' },
  mainCheckBtnText: { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  infoBox: { flexDirection: 'row', marginTop: 24, padding: 14, backgroundColor: '#F7F1E5', borderRadius: 12, borderWidth: 1, borderColor: '#E8DCC8' },
  infoText: { flex: 1, fontSize: 11, color: '#7A5C45', lineHeight: 16, fontStyle: 'italic' },

  // Results Styles
  premiumResultCard: { borderRadius: 24, overflow: 'hidden', padding: 0, marginBottom: 20, elevation: 6 },
  premiumResultGrad: { padding: 24 },
  visualScoreSection: { alignItems: 'center' },
  scoreRingContainer: { alignItems: 'center', marginBottom: 20 },
  scoreRingOuter: { 
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF',
    borderWidth: 1, borderColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8,
  },
  visualScoreValue: { fontSize: 36, fontWeight: '900', color: C.text, lineHeight: 36 },
  visualScoreMax: { fontSize: 14, fontWeight: '700', color: C.textDim, marginTop: -4 },
  
  verdictBadgeSmall: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, 
    borderRadius: 12, marginTop: -15, elevation: 4 
  },
  verdictTextSmall: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  matchProgressBarWrap: { width: '100%', marginTop: 10 },
  matchProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  matchProgressText: { fontSize: 11, fontWeight: '700', color: '#666' },
  matchProgressVal: { fontSize: 12, fontWeight: '800' },
  matchProgressTrack: { height: 10, backgroundColor: '#F0F0F0', borderRadius: 5, overflow: 'hidden' },
  matchProgressFill: { height: '100%', borderRadius: 5 },

  insightsHeader: { fontSize: 18, fontWeight: '800', color: C.text, marginHorizontal: 16, marginBottom: 12, marginTop: 10 },
  insightsCard: { padding: 20, marginHorizontal: 16, borderRadius: 24, elevation: 4 },
  insightsCardHeader: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: 12, marginBottom: 16 },
  insightsCardTitle: { fontSize: 12, fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },

  dashboardRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  dashboardItem: { flex: 1, paddingLeft: 12, position: 'relative' },
  sideIndicatorBoy: { position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, backgroundColor: '#C9A45A', borderRadius: 2 },
  sideIndicatorGirl: { position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, backgroundColor: '#6A1039', borderRadius: 2 },
  dashboardLabelSmall: { fontSize: 9, fontWeight: '800', color: '#999', marginBottom: 4 },
  dashboardValue: { fontSize: 15, fontWeight: '700', color: C.text },
  dashboardSubValue: { fontSize: 11, color: '#666', marginTop: 2 },

  kootaSection: { marginTop: 15 },
  kootaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#FAFAFA' },
  kootaInfo: { flex: 1 },
  kootaName: { fontSize: 13, fontWeight: '700', color: C.text },
  kootaDesc: { fontSize: 11, color: '#888', marginTop: 2 },
  kootaScore: { fontSize: 14, fontWeight: '800', marginLeft: 15 },

  aiDashboardSection: { marginTop: 20 },
  aiInsightBox: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FDF0D5' },
  aiIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 10, elevation: 1 },
  aiDashboardTitle: { fontSize: 11, fontWeight: '800', color: '#C9A45A', letterSpacing: 1 },
  aiDashboardBody: { fontSize: 13, color: '#6A1039', lineHeight: 22, fontStyle: 'italic' },
  
  retryAiBtn: { marginTop: 12, paddingVertical: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#FDF0D5' },
  retryAiText: { fontSize: 12, fontWeight: '700', color: '#C9A45A' },

  resetBtnDashboard: {
    marginTop: 25, paddingVertical: 14, borderRadius: 15,
    borderWidth: 1, borderColor: '#EEE', alignItems: 'center', backgroundColor: '#F9F9F9',
  },
  resetBtnText: { color: '#888', fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default CompatibilityScreen;
