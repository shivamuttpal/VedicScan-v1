import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VedicCard } from '../../components/VedicCard';
import LocationInput from '../../components/LocationInput';
import api from '../../config/api';

const GENDERS = ['Male', 'Female', 'Other'];
const RELATIONSHIPS = ['Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Other'];
const FEATURES = [
  { id: 'chat', icon: '✨', title: 'AI Astrologer', desc: 'Chat with Maharshi' },
  { id: 'baby', icon: '👶', title: 'Baby Naming', desc: 'Find auspicious names' },
  { id: 'compat', icon: '💑', title: 'Kundali Match', desc: 'Check compatibility' },
  { id: 'rashifal', icon: '🔮', title: 'Daily Rashifal', desc: 'Your daily forecast' }
];

const ProfileWizardScreen = ({ navigation }) => {
  const { user, refreshProfileStatus } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
        Alert.alert('Required Fields', 'Full Name, Date of Birth, and Place of Birth are required.');
        return;
      }
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    setLoading(true);
    try {
      const payload = {
        name: form.fullName,
        dateOfBirth: form.dateOfBirth,
        timeOfBirth: form.timeOfBirth || 'Unknown',
        placeOfBirth: form.placeOfBirth,
        relationship: form.relationship,
      };
      const res = await api.post('/api/profiles', payload);
      if (res.data) {
        await refreshProfileStatus();
        // Navigation auto-updates via AppNavigator since hasProfile becomes true
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Database validation error');
      setLoading(false);
    }
  };

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
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Text style={styles.brand}>Vedic<Text style={styles.brandAccent}>Scan</Text></Text>
            <Text style={styles.subtitle}>Set up your cosmic profile</Text>
            {renderStepIndicator()}
          </View>

          <VedicCard style={styles.card}>
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Birth Details</Text>
                <Text style={styles.stepDesc}>Accurate birth info ensures precise readings</Text>

                <Text style={styles.label}>Full Name *</Text>
                <TextInput style={styles.input} value={form.fullName} onChangeText={t => setForm({...form, fullName: t})} placeholder="John Doe" placeholderTextColor={C.textDim} />

                <Text style={styles.label}>Date of Birth *</Text>
                <TextInput style={styles.input} value={form.dateOfBirth} onChangeText={t => setForm({...form, dateOfBirth: t})} placeholder="YYYY-MM-DD" placeholderTextColor={C.textDim} />

                <Text style={styles.label}>Time of Birth</Text>
                <TextInput style={styles.input} value={form.timeOfBirth} onChangeText={t => setForm({...form, timeOfBirth: t})} placeholder="HH:MM" placeholderTextColor={C.textDim} />

                <Text style={styles.label}>Place of Birth *</Text>
                <LocationInput 
                  style={styles.input} 
                  value={form.placeOfBirth} 
                  onChangeText={t => setForm({...form, placeOfBirth: t})} 
                  placeholder="City, State, Country" 
                />

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>💡 Time of birth is crucial for accurate Lagna (Ascendant) and house calculations. Provide as accurately as possible.</Text>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={nextStep}>
                  <LinearGradient colors={['#D4760A', '#7B1A38']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.gradientBtn}>
                    <Text style={styles.btnText}>Continue →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Personal Details</Text>
                <Text style={styles.stepDesc}>Help us personalize your experience</Text>

                <Text style={styles.label}>Gender *</Text>
                <View style={styles.chipRow}>
                  {GENDERS.map(g => (
                    <TouchableOpacity key={g} style={[styles.chip, form.gender === g && styles.chipActive]} onPress={() => setForm({...form, gender: g})}>
                      <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>This profile is for</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                  <View style={styles.chipRow}>
                    {RELATIONSHIPS.map(r => (
                      <TouchableOpacity key={r} style={[styles.chip, form.relationship === r && styles.chipActive]} onPress={() => setForm({...form, relationship: r})}>
                        <Text style={[styles.chipText, form.relationship === r && styles.chipTextActive]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.previewBox}>
                  <Text style={styles.previewTitle}>YOUR VEDIC PROFILE PREVIEW</Text>
                  <View style={{flexDirection: 'row', gap: 8, marginTop: 8}}>
                    <View style={styles.previewBadge}><Text style={styles.badgeText}>🌙 Moon Sign Pending</Text></View>
                    <View style={styles.previewBadge}><Text style={styles.badgeText}>☿️ Lagna Pending</Text></View>
                  </View>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={prevStep}>
                    <Text style={styles.secondaryBtnText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginBottom: 0 }]} onPress={nextStep}>
                    <LinearGradient colors={['#D4760A', '#7B1A38']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.gradientBtn}>
                      <Text style={styles.btnText}>Create Profile ✓</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={[styles.stepContent, { alignItems: 'center' }]}>
                <View style={styles.omCircle}>
                  <Text style={styles.omText}>🔱</Text>
                </View>
                <Text style={styles.welcomeTitle}>Welcome, {form.fullName.split(' ')[0]}!</Text>
                <Text style={styles.welcomeDesc}>Your cosmic profile is ready. The stars have been charted and wisdom awaits you.</Text>

                <View style={styles.grid}>
                  {FEATURES.map(f => (
                    <View key={f.id} style={styles.featureCard}>
                      <Text style={styles.fIcon}>{f.icon}</Text>
                      <Text style={styles.fTitle}>{f.title}</Text>
                      <Text style={styles.fDesc}>{f.desc}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { width: '100%' }]} onPress={handleFinish} disabled={loading}>
                  <LinearGradient colors={['#D4760A', '#7B1A38']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.gradientBtn}>
                    <Text style={styles.btnText}>{loading ? 'Preparing Space...' : '🚀 Start Exploring'}</Text>
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
  stepActive: { backgroundColor: '#A03B2B' }, // Brownish maroon
  stepInactive: { backgroundColor: '#EADCD0' },
  stepText: { fontWeight: '700', fontSize: 16 },
  stepTextActive: { color: C.white },
  stepTextInactive: { color: '#B39E8F' },
  stepLine: { width: 40, height: 2, backgroundColor: '#EADCD0', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#A03B2B' },
  card: { padding: spacing.lg },
  stepTitle: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 4 },
  stepDesc: { fontSize: fontSize.sm, color: C.textMid, marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: C.textMid, marginBottom: 6, marginTop: spacing.sm },
  input: { backgroundColor: C.input, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: fontSize.md, color: C.text },
  infoBox: { backgroundColor: C.saffronPale, padding: spacing.md, borderRadius: radius.sm, marginTop: spacing.lg, marginBottom: spacing.lg, borderLeftWidth: 3, borderLeftColor: C.saffron },
  infoText: { color: C.saffron, fontSize: fontSize.sm, lineHeight: 20 },
  primaryBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.md },
  gradientBtn: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },
  
  // Step 2 particular styles
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: C.input, paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.sm },
  chipActive: { backgroundColor: C.input, borderWidth: 1, borderColor: C.saffron }, // Adjust based on visual matching
  chipText: { color: C.textMid, fontWeight: '500' },
  chipTextActive: { color: C.text },
  previewBox: { backgroundColor: C.goldPale, borderRadius: radius.sm, padding: spacing.md, marginTop: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: C.borderGold },
  previewTitle: { fontSize: 10, fontWeight: '700', color: C.saffron, letterSpacing: 1 },
  previewBadge: { backgroundColor: C.white, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: C.border },
  badgeText: { fontSize: 12, color: C.textMid },
  btnRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  secondaryBtn: { paddingVertical: 14, paddingHorizontal: 20, borderWidth: 1, borderColor: C.saffron, borderRadius: radius.md },
  secondaryBtnText: { color: C.saffron, fontWeight: '700', fontSize: fontSize.md },

  // Step 3
  omCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212, 118, 10, 0.9)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg, ...shadow.gold },
  omText: { fontSize: 40, color: C.white },
  welcomeTitle: { fontSize: 28, fontWeight: '700', color: C.text, marginBottom: spacing.sm },
  welcomeDesc: { fontSize: fontSize.md, color: C.textMid, textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.xl },
  featureCard: { width: '48%', backgroundColor: C.input, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm },
  fIcon: { fontSize: 24, marginBottom: 8 },
  fTitle: { fontSize: fontSize.sm, fontWeight: '700', color: C.text, marginBottom: 2 },
  fDesc: { fontSize: 11, color: C.textMuted },
});

export default ProfileWizardScreen;
