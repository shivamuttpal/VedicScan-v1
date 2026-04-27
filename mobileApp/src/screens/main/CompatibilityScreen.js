import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, TextInput, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import LocationInput from '../../components/LocationInput';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VedicCard, GoldBar } from '../../components/VedicCard';
import api from '../../config/api';

const ProfileSelector = ({ label, selected, onSelect, excludeId, profiles }) => (
  <View style={styles.selectorWrap}>
    <Text style={styles.selectorLabel}>{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {profiles
        .filter((p) => p._id !== excludeId)
        .map((p) => (
          <TouchableOpacity
            key={p._id}
            style={[styles.profileChip, selected?._id === p._id && styles.profileChipActive]}
            onPress={() => onSelect(p)}
          >
            <Text style={[styles.profileChipText, selected?._id === p._id && styles.profileChipTextActive]}>
              {p.name || p.fullName}
            </Text>
            <Text style={styles.profileChipSub}>{p.relationship}</Text>
          </TouchableOpacity>
        ))}
    </ScrollView>
  </View>
);

const CompatibilityScreen = ({ navigation }) => {
  const { hasProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [person1, setPerson1] = useState(null);
  const [person2, setPerson2] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Manual Entry State (optional enhancement to match web)
  const [manualEntry, setManualEntry] = useState(false);
  const [manualData, setManualData] = useState({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
  });

  useEffect(() => {
    if (!hasProfile) {
      navigation.navigate('ProfileTab', { screen: 'ProfileMain', params: { setup: true } });
      return;
    }
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await api.get('/api/profiles');
      if (res.data) setProfiles(res.data);
    } catch (err) {}
  };

  const checkCompatibility = async () => {
    if (!manualEntry) {
      if (!person1 || !person2) {
        Alert.alert('Error', 'Please select both profiles');
        return;
      }
      if (person1._id === person2._id) {
        Alert.alert('Error', 'Please select two different profiles');
        return;
      }
    } else {
      if (!person1 || !manualData.name || !manualData.dateOfBirth || !manualData.timeOfBirth || !manualData.placeOfBirth) {
        Alert.alert('Error', 'Please select Person 1 and fill all details for Person 2');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = manualEntry 
        ? { profile1Id: person1._id, manualPerson2: manualData }
        : { profile1Id: person1._id, profile2Id: person2._id };

      const res = await api.post('/api/compatibility', payload);
      if (res.data) setResult(res.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Compatibility check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#C0392B', '#7B1A38']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💕 Compatibility</Text>
        <Text style={styles.headerSub}>Kundli Milan Analysis</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.body}>
          <VedicCard>
            <View style={styles.formPad}>
              <ProfileSelector label="Person 1" selected={person1} onSelect={setPerson1} excludeId={person2?._id} profiles={profiles} />
              
              <View style={styles.vsCircle}>
                <Text style={styles.vsText}>💕</Text>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.selectorLabel}>Person 2</Text>
                <TouchableOpacity 
                  onPress={() => setManualEntry(!manualEntry)}
                  style={styles.manualToggle}
                >
                  <Text style={styles.manualToggleText}>
                    {manualEntry ? 'Select Existing' : 'Enter Manually'}
                  </Text>
                </TouchableOpacity>
              </View>

              {manualEntry ? (
                <View style={styles.manualForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Partner's Full Name"
                    value={manualData.name}
                    onChangeText={(t) => setManualData({...manualData, name: t})}
                    placeholderTextColor={C.textDim}
                  />
                  <View style={styles.row}>
                    <TouchableOpacity 
                      style={[styles.input, {flex: 1, marginRight: 8}]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={{color: manualData.dateOfBirth ? C.text : C.textDim}}>
                        {manualData.dateOfBirth || 'Birth Date'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.input, {flex: 1}]}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={{color: manualData.timeOfBirth ? C.text : C.textDim}}>
                        {manualData.timeOfBirth || 'Birth Time'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <LocationInput
                    style={styles.input}
                    value={manualData.placeOfBirth}
                    onChangeText={(t) => setManualData({...manualData, placeOfBirth: t})}
                    placeholder="Birth Place (City, Country)"
                  />
                </View>
              ) : (
                <ProfileSelector label="" selected={person2} onSelect={setPerson2} excludeId={person1?._id} profiles={profiles} />
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={manualData.dateOfBirth ? new Date(manualData.dateOfBirth) : new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, d) => {
                    setShowDatePicker(false);
                    if(d) setManualData({...manualData, dateOfBirth: d.toISOString().split('T')[0]});
                  }}
                  maximumDate={new Date()}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={(() => {
                    const d = new Date();
                    if (manualData.timeOfBirth) {
                      const [h, m] = manualData.timeOfBirth.split(':');
                      d.setHours(parseInt(h), parseInt(m));
                    }
                    return d;
                  })()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, t) => {
                    setShowTimePicker(false);
                    if(t) {
                      const h = t.getHours().toString().padStart(2, '0');
                      const m = t.getMinutes().toString().padStart(2, '0');
                      setManualData({...manualData, timeOfBirth: `${h}:${m}`});
                    }
                  }}
                />
              )}

              <TouchableOpacity
                style={[styles.checkBtn, loading && { opacity: 0.6 }]}
                onPress={checkCompatibility}
                disabled={loading}
              >
                <LinearGradient colors={['#D4760A', '#B8860B']} style={styles.gradBtn}>
                  <Text style={styles.gradBtnText}>
                    {loading ? 'Analyzing...' : 'Check Compatibility'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </VedicCard>

          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={C.saffron} />
              <Text style={styles.loadingText}>Analyzing cosmic alignment...</Text>
            </View>
          )}

          {result && (
            <VedicCard style={{ marginTop: spacing.md }}>
              <View style={styles.resultPad}>
                <Text style={styles.resultTitle}>Match Result</Text>
                {result.gunaScore !== undefined && (
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreNum}>{result.gunaScore}</Text>
                    <Text style={styles.scoreMax}>/ {result.maxScore || 36}</Text>
                  </View>
                )}
                {result.compatibility && (
                  <Text style={styles.percentage}>{result.compatibility}</Text>
                )}
                {result.verdict && (
                  <View style={[styles.verdictBadge, { backgroundColor: C.greenSoft }]}>
                    <Text style={[styles.verdictText, { color: C.green }]}>{result.verdict}</Text>
                  </View>
                )}
                <GoldBar />
                {result.strengths && result.strengths.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✅ Strengths</Text>
                    {result.strengths.map((s, i) => (
                      <Text key={i} style={styles.listItem}>• {s}</Text>
                    ))}
                  </View>
                )}
                {result.weaknesses && result.weaknesses.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚠️ Areas for Growth</Text>
                    {result.weaknesses.map((w, i) => (
                      <Text key={i} style={styles.listItem}>• {w}</Text>
                    ))}
                  </View>
                )}
                {/* Display any string/raw result */}
                {typeof result === 'string' && <Text style={styles.rawResult}>{result}</Text>}
              </View>
            </VedicCard>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingTop: 50, paddingBottom: 16, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  backBtn: { marginBottom: spacing.sm },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.md },
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: C.white },
  headerSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  body: { padding: spacing.lg },
  formPad: { padding: spacing.lg },
  selectorWrap: { marginBottom: spacing.md },
  selectorLabel: { fontSize: fontSize.sm, fontWeight: '700', color: C.text, marginBottom: spacing.sm },
  profileChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.white, marginRight: 8,
  },
  profileChipActive: { backgroundColor: C.saffronPale, borderColor: C.saffron },
  profileChipText: { fontSize: fontSize.md, fontWeight: '600', color: C.text },
  profileChipTextActive: { color: C.saffron },
  profileChipSub: { fontSize: fontSize.xs, color: C.textDim },
  vsCircle: { alignSelf: 'center', marginVertical: spacing.sm },
  vsText: { fontSize: 30 },
  checkBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.md },
  gradBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: radius.md },
  gradBtnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },
  loadingWrap: { marginTop: spacing.xl, alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: C.textMuted, fontStyle: 'italic' },
  resultPad: { padding: spacing.lg, alignItems: 'center' },
  resultTitle: { fontSize: fontSize.xl, fontWeight: '700', color: C.text, marginBottom: spacing.md },
  scoreCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: C.saffronPale, justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm, borderWidth: 3, borderColor: C.saffron,
  },
  scoreNum: { fontSize: fontSize.h1, fontWeight: '800', color: C.saffron },
  scoreMax: { fontSize: fontSize.sm, color: C.textMuted },
  percentage: { fontSize: fontSize.h3, fontWeight: '700', color: C.green, marginBottom: spacing.sm },
  verdictBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: radius.full },
  verdictText: { fontWeight: '700', fontSize: fontSize.md },
  listItem: { fontSize: fontSize.md, color: C.textMid, lineHeight: 22, marginBottom: 4 },
  rawResult: { fontSize: fontSize.md, color: C.text, lineHeight: 22, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, marginTop: spacing.md },
  manualToggle: { backgroundColor: C.saffronPale, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm },
  manualToggleText: { color: C.saffron, fontSize: fontSize.xs, fontWeight: '700' },
  manualForm: { gap: 10, marginBottom: spacing.md },
  input: {
    backgroundColor: C.input, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 13,
    fontSize: fontSize.md, color: C.text,
    borderWidth: 1, borderColor: C.border,
  },
  row: { flexDirection: 'row', gap: 0 },
});

export default CompatibilityScreen;
