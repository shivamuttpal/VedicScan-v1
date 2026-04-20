import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { VedicCard } from '../../components/VedicCard';
import RashiChip from '../../components/RashiChip';
import api from '../../config/api';
import { SIGNS } from '../../data/signs';

const PERIODS = ['daily', 'weekly', 'monthly'];

const RashifalScreen = () => {
  const [selectedSign, setSelectedSign] = useState(0);
  const [period, setPeriod] = useState('daily');
  const [rashifal, setRashifal] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRashifal();
  }, [selectedSign, period]);

  const fetchRashifal = async () => {
    setLoading(true);
    try {
      const sign = SIGNS[selectedSign];
      const res = await api.get(`/api/rashifal?rashi=${sign.rashi}&period=${period}`);
      if (res.data) {
        setRashifal(res.data);
      }
    } catch (err) {
      console.log('Rashifal error:', err?.message);
      setRashifal(null);
    } finally {
      setLoading(false);
    }
  };

  const sign = SIGNS[selectedSign];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#D4760A', '#B8860B']} style={styles.header}>
        <Text style={styles.headerTitle}>☀️ Rashifal</Text>
        <Text style={styles.headerSub}>Your Daily Horoscope</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Period Toggle */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, period === p && styles.periodActive]}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rashi Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rashiRow}
        >
          {SIGNS.map((s, i) => (
            <RashiChip
              key={i}
              sign={s}
              active={selectedSign === i}
              onPress={() => setSelectedSign(i)}
            />
          ))}
        </ScrollView>

        {/* Selected Sign Info */}
        <View style={styles.body}>
          <VedicCard style={{ overflow: 'hidden' }}>
            <LinearGradient
              colors={['#FFF7ED', '#FFFBF0']}
              style={styles.signHeader}
            >
              <Text style={styles.signSym}>{sign.sym}</Text>
              <View>
                <Text style={styles.signName}>{sign.rashi} ({sign.zodiac})</Text>
                <Text style={styles.signDetail}>{sign.rashiDev} · Lord: {sign.lord} · {sign.el}</Text>
                <Text style={styles.signDate}>{sign.date}</Text>
              </View>
            </LinearGradient>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={C.saffron} size="large" />
                <Text style={styles.loadingText}>Reading the stars...</Text>
              </View>
            ) : rashifal ? (
              <View style={styles.rashifalContent}>
                {rashifal.prediction && (
                  <Text style={styles.prediction}>{rashifal.prediction}</Text>
                )}
                {rashifal.lucky && (
                  <View style={styles.luckyRow}>
                    {rashifal.lucky.number && (
                      <View style={styles.luckyItem}>
                        <Text style={styles.luckyLabel}>Lucky Number</Text>
                        <Text style={styles.luckyValue}>{rashifal.lucky.number}</Text>
                      </View>
                    )}
                    {rashifal.lucky.color && (
                      <View style={styles.luckyItem}>
                        <Text style={styles.luckyLabel}>Lucky Color</Text>
                        <Text style={styles.luckyValue}>{rashifal.lucky.color}</Text>
                      </View>
                    )}
                  </View>
                )}
                {typeof rashifal === 'string' && (
                  <Text style={styles.prediction}>{rashifal}</Text>
                )}
              </View>
            ) : (
              <View style={styles.noData}>
                <Text style={styles.noDataText}>
                  Rashifal data is being updated. Please check back soon! 🌟
                </Text>
              </View>
            )}
          </VedicCard>
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
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: C.white },
  headerSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  periodRow: {
    flexDirection: 'row', marginHorizontal: spacing.lg,
    marginTop: spacing.md, marginBottom: spacing.md,
    backgroundColor: C.input, borderRadius: radius.md, padding: 4,
  },
  periodBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm,
  },
  periodActive: { backgroundColor: C.white, ...shadow.sm },
  periodText: { fontSize: fontSize.md, color: C.textMuted, fontWeight: '500' },
  periodTextActive: { color: C.saffron, fontWeight: '700' },
  rashiRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  body: { paddingHorizontal: spacing.lg },
  signHeader: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
  },
  signSym: { fontSize: 48, marginRight: spacing.md },
  signName: { fontSize: fontSize.xl, fontWeight: '700', color: C.text },
  signDetail: { fontSize: fontSize.sm, color: C.textMid },
  signDate: { fontSize: fontSize.sm, color: C.saffron, fontWeight: '500', marginTop: 2 },
  loadingWrap: { padding: spacing.xxl, alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: C.textMuted, fontStyle: 'italic' },
  rashifalContent: { padding: spacing.lg },
  prediction: { fontSize: fontSize.md, color: C.text, lineHeight: 24 },
  luckyRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.md },
  luckyItem: {
    flex: 1, backgroundColor: C.saffronPale, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  luckyLabel: { fontSize: fontSize.xs, color: C.textMuted, marginBottom: 4 },
  luckyValue: { fontSize: fontSize.lg, fontWeight: '700', color: C.saffron },
  noData: { padding: spacing.xl, alignItems: 'center' },
  noDataText: { fontSize: fontSize.md, color: C.textMuted, textAlign: 'center' },
});

export default RashifalScreen;
