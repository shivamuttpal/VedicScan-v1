import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VedicCard } from '../../components/VedicCard';
import api from '../../config/api';

const BabyNamingScreen = ({ navigation }) => {
  const { hasProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
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

  const generateNames = async () => {
    if (!selected) {
      Alert.alert('Error', 'Please select a profile');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/baby-naming', { profileId: selected._id });
      if (res.data) setResult(res.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to generate names');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0C7C6B', '#065446']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👶 Baby Naming</Text>
        <Text style={styles.headerSub}>Astrologically aligned names</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <VedicCard>
            <View style={styles.pad}>
              <Text style={styles.selectLabel}>Select Parent Profile</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {profiles.map((p) => (
                  <TouchableOpacity
                    key={p._id}
                    style={[styles.chip, selected?._id === p._id && styles.chipActive]}
                    onPress={() => setSelected(p)}
                  >
                    <Text style={[styles.chipText, selected?._id === p._id && styles.chipTextActive]}>
                      {p.fullName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.genBtn, loading && { opacity: 0.6 }]}
                onPress={generateNames}
                disabled={loading}
              >
                <LinearGradient colors={['#0C7C6B', '#065446']} style={styles.gradBtn}>
                  <Text style={styles.gradBtnText}>
                    {loading ? 'Generating...' : '✨ Generate Names'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </VedicCard>

          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={C.teal} />
              <Text style={styles.loadingText}>Consulting the stars for perfect names...</Text>
            </View>
          )}

          {result && (
            <VedicCard style={{ marginTop: spacing.md }}>
              <View style={styles.pad}>
                <Text style={styles.resultTitle}>🌟 Suggested Names</Text>
                {result.names && Array.isArray(result.names) ? (
                  result.names.map((name, i) => (
                    <View key={i} style={styles.nameItem}>
                      <View style={styles.nameNum}>
                        <Text style={styles.numText}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nameText}>{typeof name === 'object' ? name.name : name}</Text>
                        {typeof name === 'object' && name.meaning && (
                          <Text style={styles.meaningText}>{name.meaning}</Text>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.rawText}>
                    {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                  </Text>
                )}
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
  pad: { padding: spacing.lg },
  selectLabel: { fontSize: fontSize.md, fontWeight: '700', color: C.text, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.white, marginRight: 8,
  },
  chipActive: { backgroundColor: C.tealSoft, borderColor: C.teal },
  chipText: { fontSize: fontSize.md, fontWeight: '600', color: C.text },
  chipTextActive: { color: C.teal },
  genBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.lg },
  gradBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: radius.md },
  gradBtnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },
  loadingWrap: { marginTop: spacing.xl, alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: C.textMuted, fontStyle: 'italic' },
  resultTitle: { fontSize: fontSize.xl, fontWeight: '700', color: C.text, marginBottom: spacing.md },
  nameItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  nameNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.tealSoft, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  numText: { fontSize: fontSize.sm, fontWeight: '700', color: C.teal },
  nameText: { fontSize: fontSize.lg, fontWeight: '600', color: C.text },
  meaningText: { fontSize: fontSize.sm, color: C.textMuted },
  rawText: { fontSize: fontSize.md, color: C.text, lineHeight: 22 },
});

export default BabyNamingScreen;
