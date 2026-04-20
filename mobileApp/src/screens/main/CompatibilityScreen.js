import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VedicCard, GoldBar } from '../../components/VedicCard';
import api from '../../config/api';

const CompatibilityScreen = ({ navigation }) => {
  const { hasProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [person1, setPerson1] = useState(null);
  const [person2, setPerson2] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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
    if (!person1 || !person2) {
      Alert.alert('Error', 'Please select both profiles');
      return;
    }
    if (person1._id === person2._id) {
      Alert.alert('Error', 'Please select two different profiles');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/compatibility', {
        profile1Id: person1._id,
        profile2Id: person2._id,
      });
      if (res.data) setResult(res.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Compatibility check failed');
    } finally {
      setLoading(false);
    }
  };

  const ProfileSelector = ({ label, selected, onSelect, excludeId }) => (
    <View style={styles.selectorWrap}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {profiles
          .filter((p) => p._id !== excludeId)
          .map((p) => (
            <TouchableOpacity
              key={p._id}
              style={[styles.profileChip, selected?._id === p._id && styles.profileChipActive]}
              onPress={() => onSelect(p)}
            >
              <Text style={[styles.profileChipText, selected?._id === p._id && styles.profileChipTextActive]}>
                {p.fullName}
              </Text>
              <Text style={styles.profileChipSub}>{p.relationship}</Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#C0392B', '#7B1A38']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💕 Compatibility</Text>
        <Text style={styles.headerSub}>Kundli Milan Analysis</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <VedicCard>
            <View style={styles.formPad}>
              <ProfileSelector label="Person 1" selected={person1} onSelect={setPerson1} excludeId={person2?._id} />
              <View style={styles.vsCircle}><Text style={styles.vsText}>💕</Text></View>
              <ProfileSelector label="Person 2" selected={person2} onSelect={setPerson2} excludeId={person1?._id} />

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
  section: { alignSelf: 'stretch', marginTop: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: C.text, marginBottom: spacing.sm },
  listItem: { fontSize: fontSize.md, color: C.textMid, lineHeight: 22, marginBottom: 4 },
  rawResult: { fontSize: fontSize.md, color: C.text, lineHeight: 22, textAlign: 'center' },
});

export default CompatibilityScreen;
