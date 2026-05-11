import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Image, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VedicCard, GoldBar } from '../../components/VedicCard';
import api from '../../config/api';

const LOGO = require('../../../assets/logo.jpeg');
const BANNER = require('../../../assets/bannerbackground5.webp');

const InsightsScreen = ({ navigation }) => {
  const { hasProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(false);

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
      if (res.data && res.data.length > 0) {
        setProfiles(res.data);
        setSelected(res.data[0]);
        fetchChart(res.data[0]._id);
      }
    } catch (err) {}
  };

  const fetchChart = async (profileId) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/chart/${profileId}`);
      if (res.data) setChart(res.data);
    } catch (err) {
      console.log('Chart error:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6C3FA0', '#4A2680']} style={styles.header}>
        <Image source={BANNER} style={styles.headerBannerOverlay} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Image source={LOGO} style={styles.headerLogo} />
        </View>
        <Text style={styles.headerTitle}>Insights</Text>
        <Text style={styles.headerSub}>Kundli & Planetary Chart</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* Profile Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {profiles.map((p) => (
              <TouchableOpacity
                key={p._id}
                style={[styles.chip, selected?._id === p._id && styles.chipActive]}
                onPress={() => { setSelected(p); fetchChart(p._id); }}
              >
                <Text style={[styles.chipText, selected?._id === p._id && styles.chipTextActive]}>
                  {p.fullName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={C.purple} />
              <Text style={styles.loadingText}>Generating your cosmic chart...</Text>
            </View>
          ) : chart ? (
            <>
              {/* Basic Info */}
              {chart.basicDetails && (
                <VedicCard style={{ marginBottom: spacing.md }}>
                  <View style={styles.pad}>
                    <Text style={styles.sectionTitle}>🌟 Basic Details</Text>
                    <GoldBar />
                    {Object.entries(chart.basicDetails).map(([key, val]) => (
                      <View key={key} style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                        </Text>
                        <Text style={styles.infoValue}>{String(val)}</Text>
                      </View>
                    ))}
                  </View>
                </VedicCard>
              )}

              {/* Planetary Positions */}
              {chart.planetaryPositions && chart.planetaryPositions.length > 0 && (
                <VedicCard style={{ marginBottom: spacing.md }}>
                  <View style={styles.pad}>
                    <Text style={styles.sectionTitle}>🪐 Planetary Positions</Text>
                    <GoldBar />
                    {chart.planetaryPositions.map((p, i) => (
                      <View key={i} style={styles.planetRow}>
                        <Text style={styles.planetName}>{p.planet}</Text>
                        <View style={styles.planetDetail}>
                          <Text style={styles.planetSign}>{p.sign}</Text>
                          <Text style={styles.planetHouse}>House {p.house}</Text>
                          {p.degree && <Text style={styles.planetDeg}>{p.degree}</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                </VedicCard>
              )}

              {/* Predictions */}
              {chart.predictions && (
                <VedicCard style={{ marginBottom: spacing.md }}>
                  <View style={styles.pad}>
                    <Text style={styles.sectionTitle}>🔮 Predictions</Text>
                    <GoldBar />
                    {Object.entries(chart.predictions).map(([area, text]) => (
                      <View key={area} style={styles.predBlock}>
                        <Text style={styles.predArea}>
                          {area === 'career' ? '💼' : area === 'love' ? '❤️' : area === 'health' ? '🏥' : '💰'}{' '}
                          {area.charAt(0).toUpperCase() + area.slice(1)}
                        </Text>
                        <Text style={styles.predText}>{text}</Text>
                      </View>
                    ))}
                  </View>
                </VedicCard>
              )}

              {/* Raw data fallback */}
              {typeof chart === 'string' && (
                <VedicCard>
                  <View style={styles.pad}>
                    <Text style={styles.rawText}>{chart}</Text>
                  </View>
                </VedicCard>
              )}
            </>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Select a profile to view insights</Text>
            </View>
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
    paddingTop: Platform.OS === 'ios' ? 55 : 45, paddingBottom: 16, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 25, borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  headerBannerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: 500, height: 500, resizeMode: 'cover', opacity: 0.8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLogo: {
    width: 36, height: 36, borderRadius: 8, resizeMode: 'contain',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  backBtn: { marginBottom: 0 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.md },
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: C.white },
  headerSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  body: { padding: spacing.lg },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.white, marginRight: 8,
  },
  chipActive: { backgroundColor: C.purpleSoft, borderColor: C.purple },
  chipText: { fontSize: fontSize.md, fontWeight: '600', color: C.text },
  chipTextActive: { color: C.purple },
  loadingWrap: { marginTop: spacing.xxl, alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: C.textMuted, fontStyle: 'italic' },
  pad: { padding: spacing.lg },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: '700', color: C.text },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  infoLabel: { fontSize: fontSize.md, color: C.textMid },
  infoValue: { fontSize: fontSize.md, fontWeight: '600', color: C.text },
  planetRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  planetName: { fontSize: fontSize.md, fontWeight: '600', color: C.text, flex: 1 },
  planetDetail: { flexDirection: 'row', gap: 12 },
  planetSign: { fontSize: fontSize.sm, color: C.purple, fontWeight: '500' },
  planetHouse: { fontSize: fontSize.sm, color: C.textMuted },
  planetDeg: { fontSize: fontSize.sm, color: C.textDim },
  predBlock: { marginBottom: spacing.md },
  predArea: { fontSize: fontSize.lg, fontWeight: '700', color: C.text, marginBottom: 4 },
  predText: { fontSize: fontSize.md, color: C.textMid, lineHeight: 22 },
  rawText: { fontSize: fontSize.md, color: C.text, lineHeight: 22 },
  emptyWrap: { marginTop: spacing.xxl, alignItems: 'center' },
  emptyText: { fontSize: fontSize.md, color: C.textMuted },
});

export default InsightsScreen;
