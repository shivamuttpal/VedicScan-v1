import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { VedicCard, GoldBar } from '../../components/VedicCard';
import api from '../../config/api';

const LOGO = require('../../../assets/logo.jpeg');
const BANNER = require('../../../assets/bannerbackground5.webp');

const PLAN_META = {
  free: { label: 'Free', color: '#9A8878', bg: '#F8F5F1', border: '#E8DFD2', icon: '✨' },
  standard: { label: 'Standard', color: '#D4760A', bg: '#FFF8F0', border: '#FFDAB9', icon: '👑' },
  premium: { label: 'Premium', color: '#6C3FA0', bg: '#F5F0FF', border: '#DCD0FF', icon: '👑' },
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const UsageBar = ({ label, used, limit, color }) => {
  const isUnlimited = limit >= 99999;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const barColor = pct >= 90 ? '#D93025' : pct >= 70 ? '#D4760A' : '#188038';

  return (
    <View style={styles.usageItem}>
      <View style={styles.usageLabelRow}>
        <Text style={styles.usageLabel}>{label}</Text>
        <Text style={styles.usageValue}>
          {isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
        </Text>
      </View>
      <View style={styles.barContainer}>
        {isUnlimited ? (
          <View style={[styles.barFill, { backgroundColor: '#188038', opacity: 0.3, width: '100%' }]} />
        ) : (
          <View style={[styles.barFill, { backgroundColor: barColor, width: `${pct}%` }]} />
        )}
      </View>
    </View>
  );
};

const SubscriptionScreen = ({ navigation }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/api/subscription/status');
      setStatus(data);
    } catch (err) {
      console.log('Error fetching subscription status:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatus();
  }, []);

  const handleEmailToggle = async () => {
    setEmailLoading(true);
    try {
      if (status?.emailUnsubscribed) {
        await api.post('/api/subscription/resubscribe-emails');
      } else {
        await api.post('/api/subscription/unsubscribe-emails', { token: null });
      }
      await fetchStatus();
    } catch (err) {
      console.log('Error toggling email:', err?.message);
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={C.saffron} />
        <Text style={styles.loaderText}>Loading your subscription...</Text>
      </View>
    );
  }

  const plan = status?.plan || 'free';
  const meta = PLAN_META[plan] || PLAN_META.free;
  const daysLeft = daysUntil(status?.planEndDate);
  const isActive = plan !== 'free';
  const expiringSoon = isActive && daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6C3FA0', '#4A2680']} style={styles.header}>
        <Image source={BANNER} style={styles.headerBannerOverlay} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Image source={LOGO} style={styles.headerLogo} />
        </View>
        <Text style={styles.headerTitle}>Subscription</Text>
        <Text style={styles.headerSub}>Manage your cosmic plan</Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.saffron} />}
        contentContainerStyle={styles.scrollBody}
      >
        {/* Current Plan Card */}
        <VedicCard style={[styles.planCard, { borderColor: meta.border, borderWidth: 1.5 }]}>
          <View style={[styles.planHeader, { backgroundColor: meta.bg }]}>
            <View style={styles.planInfoRow}>
              <View style={styles.iconCircle}>
                <Text style={styles.planIcon}>{meta.icon}</Text>
              </View>
              <View>
                <Text style={styles.planLabel}>CURRENT PLAN</Text>
                <Text style={[styles.planName, { color: meta.color }]}>{meta.label}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isActive ? '#E6F4EA' : '#F1F3F4' }]}>
              <Text style={[styles.statusText, { color: isActive ? '#188038' : '#70757A' }]}>
                {isActive ? 'Active' : 'Free Tier'}
              </Text>
            </View>
          </View>

          <View style={styles.planDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>💳</Text>
              <View>
                <Text style={styles.detailLabel}>Billing</Text>
                <Text style={styles.detailValue}>{status?.billingCycle || 'None'}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📅</Text>
              <View>
                <Text style={styles.detailLabel}>{isActive ? 'Renews On' : 'Plan'}</Text>
                <Text style={styles.detailValue}>
                  {status?.planEndDate ? new Date(status.planEndDate).toLocaleDateString() : 'No expiry'}
                </Text>
              </View>
            </View>
          </View>

          {expiringSoon && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>⚠️ Expiring in {daysLeft} days</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Pricing')} style={styles.renewBtn}>
                <Text style={styles.renewBtnText}>Renew</Text>
              </TouchableOpacity>
            </View>
          )}
        </VedicCard>

        {/* Usage Card */}
        <VedicCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📊 Usage This Period</Text>
          </View>
          <GoldBar />
          <View style={styles.usageContent}>
            <UsageBar
              label="Daily Questions"
              used={status?.usage?.daily?.used || 0}
              limit={status?.limits?.daily_questions || 3}
            />
            {/* Monthly question limit tracking disabled
            <UsageBar
              label="Monthly Questions"
              used={status?.usage?.monthly?.used || 0}
              limit={status?.limits?.monthly_questions || 90}
            /> */}

            <View style={styles.remainingRow}>
              <View style={styles.remainingBox}>
                <Text style={styles.remNum}>
                  {Math.max(0, (status?.limits?.daily_questions || 3) - (status?.usage?.daily?.used || 0))}
                </Text>
                <Text style={styles.remLabel}>Left Today</Text>
              </View>
              {/* Monthly "Left Month" box disabled
              <View style={styles.remainingBox}>
                <Text style={styles.remNum}>
                  {Math.max(0, (status?.limits?.monthly_questions || 90) - (status?.usage?.monthly?.used || 0))}
                </Text>
                <Text style={styles.remLabel}>Left Month</Text>
              </View> */}
            </View>
          </View>
        </VedicCard>

        {/* Notifications Card */}
        <VedicCard style={styles.card}>
          <View style={styles.notifyRow}>
            <View style={styles.notifyInfo}>
              <Text style={styles.notifyTitle}>📩 Email Notifications</Text>
              <Text style={styles.notifyDesc}>
                {status?.emailUnsubscribed
                  ? 'Notifications are currently disabled.'
                  : 'Receive renewal alerts and cosmic insights.'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtn, status?.emailUnsubscribed && styles.toggleBtnOff]}
              onPress={handleEmailToggle}
              disabled={emailLoading}
            >
              {emailLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.toggleBtnText}>
                  {status?.emailUnsubscribed ? 'Enable' : 'Disable'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </VedicCard>

        {/* Upgrade CTA */}
        {plan === 'free' && (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => navigation.navigate('Pricing')}
          >
            <LinearGradient colors={['#D4760A', '#B8860B']} style={styles.upgradeGrad}>
              <Text style={styles.upgradeText}>🚀 Upgrade to Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loaderText: { marginTop: 12, color: C.textMid, fontSize: 14 },
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
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { color: C.white, fontSize: 20, fontWeight: '700' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: C.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scrollBody: { padding: spacing.lg },
  planCard: { overflow: 'hidden', marginBottom: spacing.md },
  planHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  planInfoRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  planIcon: { fontSize: 22 },
  planLabel: { fontSize: 10, fontWeight: '800', color: '#70757A', letterSpacing: 1 },
  planName: { fontSize: 22, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  planDetails: { padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailIcon: { fontSize: 20 },
  detailLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase' },
  detailValue: { fontSize: 15, fontWeight: '700', color: C.text },
  warningBanner: {
    backgroundColor: '#FFF8F0', padding: 12, borderTopWidth: 1, borderTopColor: '#FFDAB9',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  warningText: { color: '#D4760A', fontWeight: '700', fontSize: 13 },
  renewBtn: { backgroundColor: '#D4760A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  renewBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  card: { marginBottom: spacing.md },
  cardHeader: { padding: spacing.md },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  usageContent: { padding: spacing.lg, gap: 16 },
  usageItem: {},
  usageLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  usageLabel: { fontSize: 13, fontWeight: '600', color: C.textMid },
  usageValue: { fontSize: 13, fontWeight: '700', color: C.text },
  barContainer: { height: 8, backgroundColor: '#F1F3F4', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  remainingRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  remainingBox: {
    flex: 1, backgroundColor: '#F8F9FA', borderRadius: 12,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F1F3F4',
  },
  remNum: { fontSize: 24, fontWeight: '800', color: C.text },
  remLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 2, textTransform: 'uppercase' },
  notifyRow: { flexDirection: 'row', padding: spacing.lg, alignItems: 'center' },
  notifyInfo: { flex: 1, marginRight: 12 },
  notifyTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  notifyDesc: { fontSize: 12, color: C.textMuted, marginTop: 4, lineHeight: 18 },
  toggleBtn: {
    backgroundColor: '#6C3FA0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    minWidth: 80, alignItems: 'center',
  },
  toggleBtnOff: { backgroundColor: '#188038' },
  toggleBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  upgradeBtn: { borderRadius: 16, overflow: 'hidden', marginTop: spacing.md },
  upgradeGrad: { paddingVertical: 18, alignItems: 'center' },
  upgradeText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});

export default SubscriptionScreen;
