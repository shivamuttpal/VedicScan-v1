import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { VedicCard } from '../../components/VedicCard';
import LocationInput from '../../components/LocationInput';
import CalendarDatePicker from '../../components/CalendarDatePicker';
import CustomTimePicker from '../../components/CustomTimePicker';
import api from '../../config/api';

const ProfileWizardScreen = ({ navigation }) => {
  const { user, refreshProfileStatus } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // step 0 = language selection, 1 = birth details, 2 = personal, 3 = welcome
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const scrollViewRef = useRef(null);
  const locationFieldRef = useRef(null);

  const scrollToLocationField = () => {
    setTimeout(() => {
      if (locationFieldRef.current && scrollViewRef.current) {
        locationFieldRef.current.measureLayout(
          scrollViewRef.current,
          (x, y) => scrollViewRef.current?.scrollTo({ y: y - 20, animated: true }),
          () => {}
        );
      }
    }, 150);
  };

  const [form, setForm] = useState({
    fullName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    gender: 'Male',
    relationship: 'Self',
  });

  const nextStep = () => {
    if (step === 1) {
      if (!form.fullName.trim() || !form.dateOfBirth.trim() || !form.placeOfBirth.trim()) {
        Alert.alert(t('requiredFieldsTitle'), t('requiredFieldsMsg'));
        return;
      }
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleFinish = async () => {
    setLoading(true);
    try {
      const payload = {
        name: form.fullName,
        dateOfBirth: form.dateOfBirth,
        timeOfBirth: form.timeOfBirth || 'Unknown',
        placeOfBirth: form.placeOfBirth,
        relationship: form.relationship,
        gender: form.gender,
      };
      const res = await api.post('/api/profiles', payload);
      if (res.data) {
        setStep(3);
        await refreshProfileStatus();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Database validation error');
      setLoading(false);
    }
  };

  // Gender and relationship values map to translation keys
  const GENDER_KEYS = [
    { value: 'Male', key: 'genderMale' },
    { value: 'Female', key: 'genderFemale' },
    { value: 'Other', key: 'genderOther' },
  ];
  const REL_KEYS = [
    { value: 'Self', key: 'relSelf' },
    { value: 'Spouse', key: 'relSpouse' },
    { value: 'Child', key: 'relChild' },
    { value: 'Parent', key: 'relParent' },
    { value: 'Sibling', key: 'relSibling' },
    { value: 'Friend', key: 'relFriend' },
    { value: 'Other', key: 'relOther' },
  ];
  const FEATURE_KEYS = [
    { id: 'chat', icon: '✨', titleKey: 'featureAITitle', descKey: 'featureAIDesc' },
    { id: 'baby', icon: '👶', titleKey: 'featureBabyTitle', descKey: 'featureBabyDesc' },
    { id: 'compat', icon: '💑', titleKey: 'featureCompatTitle', descKey: 'featureCompatDesc' },
    { id: 'rashifal', icon: '🔮', titleKey: 'featureRashiTitle', descKey: 'featureRashiDesc' },
  ];

  const renderStepIndicator = () => (
    <View style={styles.stepperContainer}>
      {[1, 2, 3].map((num) => (
        <React.Fragment key={`step-${num}`}>
          <View style={[styles.stepCircle, step >= num ? styles.stepActive : styles.stepInactive]}>
            <Text style={[styles.stepText, step >= num ? styles.stepTextActive : styles.stepTextInactive]}>{num}</Text>
          </View>
          {num < 3 && <View style={[styles.stepLine, step > num ? styles.stepLineActive : {}]} />}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Text style={styles.brand}>Vedic<Text style={styles.brandAccent}>Scan</Text></Text>
            <Text style={styles.subtitle}>{t('cosmicProfileSetup')}</Text>
            {step > 0 && renderStepIndicator()}
          </View>

          <VedicCard style={styles.card}>

            {/* ── STEP 0: Language Selection ── */}
            {step === 0 && (
              <View style={styles.stepContent}>
                <Text style={styles.langStepIcon}>🌐</Text>
                <Text style={styles.stepTitle}>{t('chooseLanguage')}</Text>
                <Text style={styles.stepDesc}>{t('chooseLanguageDesc')}</Text>

                <TouchableOpacity
                  style={[styles.langCard, language === 'en' && styles.langCardActive]}
                  onPress={() => setLanguage('en')}
                  activeOpacity={0.75}
                >
                  <View style={styles.langCardInner}>
                    <Text style={styles.langCardSymbol}>A</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.langCardTitle, language === 'en' && styles.langCardTitleActive]}>
                        English
                      </Text>
                      <Text style={styles.langCardSub}>Continue in English</Text>
                    </View>
                    {language === 'en' && <Text style={styles.langCheckmark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.langCard, language === 'hi' && styles.langCardActive]}
                  onPress={() => setLanguage('hi')}
                  activeOpacity={0.75}
                >
                  <View style={styles.langCardInner}>
                    <Text style={styles.langCardSymbol}>अ</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.langCardTitle, language === 'hi' && styles.langCardTitleActive]}>
                        हिंदी
                      </Text>
                      <Text style={styles.langCardSub}>हिंदी में जारी रखें</Text>
                    </View>
                    {language === 'hi' && <Text style={styles.langCheckmark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryBtn} onPress={nextStep}>
                  <LinearGradient colors={['#C9A45A', '#7B1A38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                    <Text style={styles.btnText}>{t('continueBtn')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STEP 1: Birth Details ── */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('birthDetails')}</Text>
                <Text style={styles.stepDesc}>{t('birthDetailsDesc')}</Text>

                <Text style={styles.label}>{t('fullName')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.fullName}
                  onChangeText={v => setForm({ ...form, fullName: v })}
                  placeholder="John Doe"
                  placeholderTextColor={C.textDim}
                />

                <Text style={styles.label}>{t('dateOfBirth')}</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                  <Text style={[styles.inputText, !form.dateOfBirth && { color: C.textDim }]}>
                    {form.dateOfBirth || t('selectDate')}
                  </Text>
                </TouchableOpacity>
                <CalendarDatePicker
                  visible={showDatePicker}
                  value={form.dateOfBirth}
                  title={t('dateOfBirth')}
                  minDate={new Date(1900, 0, 1)}
                  maxDate={new Date()}
                  onClose={() => setShowDatePicker(false)}
                  onConfirm={(dateStr) => {
                    setForm({ ...form, dateOfBirth: dateStr });
                    setShowDatePicker(false);
                  }}
                />

                <Text style={styles.label}>{t('timeOfBirth')}</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
                  <Text style={[styles.inputText, !form.timeOfBirth && { color: C.textDim }]}>
                    {form.timeOfBirth || t('selectTime')}
                  </Text>
                </TouchableOpacity>
                <CustomTimePicker
                  visible={showTimePicker}
                  value={form.timeOfBirth}
                  title={t('timeOfBirth')}
                  onClose={() => setShowTimePicker(false)}
                  onConfirm={(timeStr) => {
                    setForm({ ...form, timeOfBirth: timeStr });
                    setShowTimePicker(false);
                  }}
                />

                <Text style={styles.label}>{t('placeOfBirth')}</Text>
                <View ref={locationFieldRef} collapsable={false}>
                  <LocationInput
                    value={form.placeOfBirth}
                    onChangeText={v => setForm({ ...form, placeOfBirth: v })}
                    placeholder="City, State, Country"
                    onFocus={scrollToLocationField}
                  />
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>{t('infoTip')}</Text>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={nextStep}>
                  <LinearGradient colors={['#C9A45A', '#7B1A38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                    <Text style={styles.btnText}>{t('continueBtn')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STEP 2: Personal Details ── */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('personalDetails')}</Text>
                <Text style={styles.stepDesc}>{t('personalDetailsDesc')}</Text>

                <Text style={styles.label}>{t('gender')}</Text>
                <View style={styles.chipRow}>
                  {GENDER_KEYS.map(({ value, key }) => (
                    <TouchableOpacity
                      key={value}
                      style={[styles.chip, form.gender === value && styles.chipActive]}
                      onPress={() => setForm({ ...form, gender: value })}
                    >
                      <Text style={[styles.chipText, form.gender === value && styles.chipTextActive]}>
                        {t(key)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>{t('profileFor')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                  <View style={styles.chipRow}>
                    {REL_KEYS.map(({ value, key }) => (
                      <TouchableOpacity
                        key={value}
                        style={[styles.chip, form.relationship === value && styles.chipActive]}
                        onPress={() => setForm({ ...form, relationship: value })}
                      >
                        <Text style={[styles.chipText, form.relationship === value && styles.chipTextActive]}>
                          {t(key)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.previewBox}>
                  <Text style={styles.previewTitle}>{t('vedicProfilePreview')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <View style={styles.previewBadge}><Text style={styles.badgeText}>{t('moonSignPending')}</Text></View>
                    <View style={styles.previewBadge}><Text style={styles.badgeText}>{t('lagnaSignPending')}</Text></View>
                  </View>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={prevStep}>
                    <Text style={styles.secondaryBtnText}>{t('backBtn')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, marginBottom: 0 }]}
                    onPress={handleFinish}
                    disabled={loading}
                  >
                    <LinearGradient colors={['#C9A45A', '#7B1A38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                      <Text style={styles.btnText}>{loading ? t('creating') : t('createProfile')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── STEP 3: Welcome ── */}
            {step === 3 && (
              <View style={[styles.stepContent, { alignItems: 'center' }]}>
                <View style={styles.omCircle}>
                  <Text style={styles.omText}>🔱</Text>
                </View>
                <Text style={styles.welcomeTitle}>{t('welcomeTitle')}, {form.fullName.split(' ')[0]}!</Text>
                <Text style={styles.welcomeDesc}>{t('welcomeDesc')}</Text>

                <View style={styles.grid}>
                  {FEATURE_KEYS.map(f => (
                    <View key={f.id} style={styles.featureCard}>
                      <Text style={styles.fIcon}>{f.icon}</Text>
                      <Text style={styles.fTitle}>{t(f.titleKey)}</Text>
                      <Text style={styles.fDesc}>{t(f.descKey)}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { width: '100%' }]} onPress={() => {}}>
                  <LinearGradient colors={['#C9A45A', '#7B1A38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                    <Text style={styles.btnText}>{t('startExploring')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

          </VedicCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgWarm },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: spacing.xl, marginTop: 20 },
  brand: { fontSize: 28, fontWeight: '700', color: C.maroon },
  brandAccent: { color: C.saffron },
  subtitle: { fontSize: fontSize.md, color: C.textMid, marginTop: 4 },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  stepCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  stepActive: { backgroundColor: '#A03B2B' },
  stepInactive: { backgroundColor: '#EADCD0' },
  stepText: { fontWeight: '700', fontSize: 16 },
  stepTextActive: { color: C.white },
  stepTextInactive: { color: '#B39E8F' },
  stepLine: { width: 40, height: 2, backgroundColor: '#EADCD0', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#A03B2B' },
  card: { padding: spacing.lg, backgroundColor: C.white, borderRadius: radius.lg, ...shadow.lg },
  stepContent: {},
  stepTitle: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 4 },
  stepDesc: { fontSize: fontSize.sm, color: C.textMid, marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: C.textMid, marginBottom: 6, marginTop: spacing.sm },
  input: {
    backgroundColor: C.input,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.md,
    color: C.text,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  inputText: { fontSize: fontSize.md, color: C.text },
  infoBox: { backgroundColor: C.saffronPale, padding: spacing.md, borderRadius: radius.sm, marginTop: spacing.lg, marginBottom: spacing.lg, borderLeftWidth: 3, borderLeftColor: C.saffron },
  infoText: { color: C.saffron, fontSize: fontSize.sm, lineHeight: 20 },
  primaryBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.md },
  gradientBtn: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: C.input, paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.sm },
  chipActive: { backgroundColor: C.input, borderWidth: 1, borderColor: C.saffron },
  chipText: { color: C.textMid, fontWeight: '500' },
  chipTextActive: { color: C.text },
  previewBox: { backgroundColor: C.goldPale, borderRadius: radius.sm, padding: spacing.md, marginTop: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: C.borderGold },
  previewTitle: { fontSize: 10, fontWeight: '700', color: C.saffron, letterSpacing: 1 },
  previewBadge: { backgroundColor: C.white, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: C.border },
  badgeText: { fontSize: 12, color: C.textMid },
  btnRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  secondaryBtn: { paddingVertical: 14, paddingHorizontal: 20, borderWidth: 1, borderColor: C.saffron, borderRadius: radius.md },
  secondaryBtnText: { color: C.saffron, fontWeight: '700', fontSize: fontSize.md },
  omCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212, 118, 10, 0.9)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg, ...shadow.gold },
  omText: { fontSize: 40, color: C.white },
  welcomeTitle: { fontSize: 28, fontWeight: '700', color: C.text, marginBottom: spacing.sm },
  welcomeDesc: { fontSize: fontSize.md, color: C.textMid, textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.xl },
  featureCard: { width: '48%', backgroundColor: C.input, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm },
  fIcon: { fontSize: 24, marginBottom: 8 },
  fTitle: { fontSize: fontSize.sm, fontWeight: '700', color: C.text, marginBottom: 2 },
  fDesc: { fontSize: 11, color: C.textMuted },

  // Language selection step
  langStepIcon: { fontSize: 48, textAlign: 'center', marginBottom: spacing.md },
  langCard: {
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: radius.md,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: C.input,
  },
  langCardActive: {
    borderColor: C.saffron,
    backgroundColor: '#FFFDF8',
  },
  langCardInner: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  langCardSymbol: {
    fontSize: 32,
    fontWeight: '800',
    color: C.maroon,
    width: 44,
    textAlign: 'center',
  },
  langCardTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  langCardTitleActive: { color: C.saffron },
  langCardSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  langCheckmark: { fontSize: 20, color: C.saffron, fontWeight: '800' },
});

export default ProfileWizardScreen;
