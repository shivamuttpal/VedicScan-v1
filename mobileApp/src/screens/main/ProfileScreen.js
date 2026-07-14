import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, RefreshControl, Platform, Image, ImageBackground, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VedicCard } from '../../components/VedicCard';
import LocationInput from '../../components/LocationInput';
import CalendarDatePicker from '../../components/CalendarDatePicker';
import CustomTimePicker from '../../components/CustomTimePicker';
import api from '../../config/api';

const PROFILE_BG = require('../../../assets/profile/profile-celestial-bg.png');
const QUILL_ART = require('../../../assets/profile/quill-inkpot.png');

const GENDERS = ['Male', 'Female', 'Other'];
const RELATIONSHIPS = ['Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Other'];

// Hosted legal documents (also linked from the web app footer)
const LEGAL_BASE = 'https://vedicscan.com';
const LEGAL_LINKS = [
  { label: 'Privacy Policy', symbol: '♢', url: `${LEGAL_BASE}/privacy` },
  { label: 'Terms of Service', symbol: '≡', url: `${LEGAL_BASE}/terms` },
  { label: 'Refund & Cancellation', symbol: '↻', url: `${LEGAL_BASE}/refund` },
  { label: 'Account & Data Deletion', symbol: '♙', url: `${LEGAL_BASE}/data-deletion` },
];

const ProfileIcon = ({ symbol, danger = false, compact = false }) => (
  <LinearGradient
    colors={danger ? ['#FFF1F1', '#F9DEDE'] : ['#FFF9EB', '#F5E7CB']}
    style={[styles.iconTile, compact && styles.iconTileCompact]}
  >
    <Text style={[styles.iconSymbol, compact && styles.iconSymbolCompact, danger && styles.iconSymbolDanger]}>{symbol}</Text>
  </LinearGradient>
);

const ProfileScreen = ({ route, navigation }) => {
  const { user, hasProfile, refreshProfileStatus, logout } = useAuth();
  const isSetup = route?.params?.setup || false;
  const [profiles, setProfiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scrollViewRef = useRef(null);
  const locationFieldRef = useRef(null);
  const nameTouchedRef = useRef(false);

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

  // Form state
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    relationship: 'Self',
    isDefault: false,
  });

  // Auto-populate name from user context when relationship is Self.
  // Only runs once per form-open session — stops the moment the user types
  // (or clears) the field themselves, so a manual clear doesn't get overwritten.
  useEffect(() => {
    if (!showForm) {
      nameTouchedRef.current = false;
      return;
    }
    if (editingId || form.relationship !== 'Self' || nameTouchedRef.current || form.fullName || !user) {
      return;
    }
    const nameFromContext = (user.firstName || user.name || '').trim();
    const lastNameFromContext = (user.lastName || '').trim();
    const fullName = `${nameFromContext} ${lastNameFromContext}`.trim();

    if (fullName) {
      setForm(prev => ({ ...prev, fullName }));
    } else if (user.email || user.phone) {
      const fallback = (user.email ? user.email.split('@')[0] : user.phone) || '';
      if (fallback) setForm(prev => ({ ...prev, fullName: fallback }));
    }
  }, [showForm, form.relationship, editingId, user]);
  const [editingId, setEditingId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (isSetup && !hasProfile) {
      setShowForm(true);
    }
  }, [isSetup, hasProfile]);

  const fetchProfiles = async () => {
    try {
      const res = await api.get('/api/profiles');
      if (res.data && Array.isArray(res.data)) {
        setProfiles(res.data);
      }
    } catch (err) {
      console.log('Error fetching profiles:', err?.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfiles();
    await refreshProfileStatus();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.dateOfBirth.trim() || !form.timeOfBirth.trim() || !form.placeOfBirth.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.fullName,
        dateOfBirth: form.dateOfBirth,
        timeOfBirth: form.timeOfBirth,
        placeOfBirth: form.placeOfBirth,
        relationship: form.relationship,
        isDefault: form.isDefault,
      };

      if (editingId) {
        await api.put(`/api/profiles/${editingId}`, payload);
        Alert.alert('Success', 'Profile updated!');
      } else {
        await api.post('/api/profiles', payload);
        Alert.alert('Success', 'Birth profile created!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({
        fullName: '',
        dateOfBirth: '',
        timeOfBirth: '',
        placeOfBirth: '',
        relationship: 'Self',
        isDefault: false,
      });
      await fetchProfiles();
      await refreshProfileStatus();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Database validation error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (profile) => {
    setForm({
      fullName: profile.name || '',
      dateOfBirth: profile.dateOfBirth || '',
      timeOfBirth: profile.timeOfBirth || '',
      placeOfBirth: profile.placeOfBirth || '',
      relationship: profile.relationship || 'Self',
      isDefault: profile.isDefault || false,
    });
    setEditingId(profile.id || profile._id);
    setShowForm(true);
  };

  const handleSetDefault = async (profileId) => {
    try {
      await api.put(`/api/profiles/${profileId}`, { isDefault: true });
      await fetchProfiles();
      await refreshProfileStatus();
      Alert.alert('Success', 'Primary profile updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update primary profile');
    }
  };


  const handleDelete = (id) => {
    Alert.alert('Delete Profile', 'Are you sure you want to delete this profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/profiles/${id}`);
            await fetchProfiles();
            await refreshProfileStatus();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete profile');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account, all birth profiles, kundalis, and chat history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/api/users/account');
              Alert.alert('Account Deleted', 'Your account and all associated data have been permanently deleted.');
              logout();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openLegal = (url) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open the link.'));
  };

  return (
    <ImageBackground source={PROFILE_BG} style={styles.container} resizeMode="cover">
      <View pointerEvents="none" style={styles.backgroundVeil} />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.headerOrnament}><View style={styles.headerDot} /><View style={styles.headerLine} /></View>
            <Text style={styles.headerSub}>Manage your account and birth profiles</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={logout} style={styles.logoutBtn} activeOpacity={0.82}>
            <Text style={styles.logoutIcon}>↪</Text><Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 160 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.saffron} />}
      >
        <View style={styles.body}>
          {/* Subscription Card */}
          <VedicCard style={{ marginBottom: spacing.md }}>
            <TouchableOpacity
              style={styles.subCard}
              onPress={() => navigation.navigate('Subscription')}
            >
              <View style={styles.subInfo}>
                <Text style={styles.subTitle}>✨ My Subscription</Text>
                <Text style={styles.subDesc}>Manage your plan and view AI usage</Text>
              </View>
              <Text style={styles.subArrow}>→</Text>
            </TouchableOpacity>
          </VedicCard>
          {/* Setup Prompt */}
          {!hasProfile && !showForm && (
            <VedicCard style={{ marginBottom: spacing.md }}>
              <View style={styles.setupPrompt}>
                <Text style={styles.setupIcon}>🌟</Text>
                <Text style={styles.setupTitle}>Create Your Birth Profile</Text>
                <Text style={styles.setupDesc}>
                  Your birth details are essential for accurate Vedic astrological readings.
                  This unlocks all cosmic features.
                </Text>
                <TouchableOpacity
                  style={styles.setupBtn}
                  onPress={() => setShowForm(true)}
                >
                  <LinearGradient colors={['#C9A45A', '#C9A45A']} style={styles.gradBtn}>
                    <Text style={styles.gradBtnText}>Create Profile</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </VedicCard>
          )}

          {/* Form */}
          {showForm && (
            <VedicCard style={{ marginBottom: spacing.md }}>
              <View style={styles.formWrap}>
                <Text style={styles.formTitle}>
                  {editingId ? '✏️ Edit Profile' : '🌟 New Birth Profile'}
                </Text>

                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={form.fullName}
                  onChangeText={(t) => { nameTouchedRef.current = true; setForm({ ...form, fullName: t }); }}
                  placeholder="Enter full name"
                  placeholderTextColor={C.textDim}
                />

                <Text style={styles.label}>Date of Birth *</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.inputText, !form.dateOfBirth && { color: C.textDim }]}>
                    {form.dateOfBirth || 'Select Date (YYYY-MM-DD)'}
                  </Text>
                </TouchableOpacity>

                <CalendarDatePicker
                  visible={showDatePicker}
                  value={form.dateOfBirth}
                  title="Date of Birth"
                  minDate={new Date(1900, 0, 1)}
                  maxDate={new Date()}
                  onClose={() => setShowDatePicker(false)}
                  onConfirm={(dateStr) => {
                    setForm({ ...form, dateOfBirth: dateStr });
                    setShowDatePicker(false);
                  }}
                />

                <Text style={styles.label}>Time of Birth *</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={[styles.inputText, !form.timeOfBirth && { color: C.textDim }]}>
                    {form.timeOfBirth || 'Select Time (HH:MM)'}
                  </Text>
                </TouchableOpacity>

                <CustomTimePicker
                  visible={showTimePicker}
                  value={form.timeOfBirth}
                  title="Time of Birth"
                  onClose={() => setShowTimePicker(false)}
                  onConfirm={(timeStr) => {
                    setForm({ ...form, timeOfBirth: timeStr });
                    setShowTimePicker(false);
                  }}
                />

                <Text style={styles.label}>Place of Birth *</Text>
                <View ref={locationFieldRef} collapsable={false}>
                  <LocationInput
                    style={styles.input}
                    value={form.placeOfBirth}
                    onChangeText={(t) => setForm({ ...form, placeOfBirth: t })}
                    placeholder="Enter city, state, country"
                    onFocus={scrollToLocationField}
                  />
                </View>

                <View style={styles.switchRow}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setForm({ ...form, isDefault: !form.isDefault })}
                  >
                    <View style={[styles.checkboxInner, form.isDefault && styles.checkboxActive]} />
                  </TouchableOpacity>
                  <Text style={styles.switchLabel}>Make this my primary profile</Text>
                </View>

                <Text style={styles.label}>Relationship</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <View style={styles.chipRow}>
                    {RELATIONSHIPS.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.selectChip, form.relationship === r && styles.selectChipActive]}
                        onPress={() => setForm({ ...form, relationship: r })}
                      >
                        <Text style={[styles.selectChipText, form.relationship === r && styles.selectChipTextActive]}>
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.formBtns}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => { setShowForm(false); setEditingId(null); }}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    <LinearGradient colors={['#C9A45A', '#C9A45A']} style={styles.gradBtn}>
                      <Text style={styles.gradBtnText}>
                        {loading ? 'Saving...' : editingId ? 'Update' : 'Save Profile'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </VedicCard>
          )}

          {/* Profiles List */}
          {profiles.map((p, i) => (
            <VedicCard key={p._id || i} style={styles.profileShell}>
              <View style={styles.profileCard}>
                <View style={styles.profileHeader}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.avatarText}>
                      {(p.name || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.profileName} numberOfLines={1}>{p.name}</Text>
                    </View>
                    <View style={styles.profileMetaRow}>
                      <Text style={styles.profileRel} numberOfLines={1}>{p.relationship || 'Self'}</Text>
                      {p.isDefault && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>♛  Primary</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.profileActions}>
                    {!p.isDefault && (
                      <TouchableOpacity accessibilityLabel="Make primary profile" hitSlop={8} onPress={() => handleSetDefault(p.id || p._id)} style={styles.actionBtn}>
                        <Text style={styles.actionText}>♛</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity accessibilityLabel="Edit profile" hitSlop={8} onPress={() => handleEdit(p)} style={styles.actionBtn}>
                      <Text style={styles.actionText}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityLabel="Delete profile" hitSlop={8} onPress={() => handleDelete(p.id || p._id)} style={[styles.actionBtn, styles.actionBtnDanger]}>
                      <Text style={[styles.actionText, styles.actionTextDanger]}>⌫</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.profileDivider}>
                  <View style={styles.profileDividerLine} />
                  <Text style={styles.profileDividerStar}>{'\u2726'}</Text>
                  <View style={styles.profileDividerLine} />
                </View>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <ProfileIcon symbol="▣" compact />
                    <Text style={styles.detailLabel}>DOB</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>{p.dateOfBirth || '—'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <ProfileIcon symbol="◷" compact />
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>{p.timeOfBirth || '—'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <ProfileIcon symbol="⌖" compact />
                    <Text style={styles.detailLabel}>Place</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>{p.placeOfBirth || '—'}</Text>
                  </View>
                </View>
              </View>
            </VedicCard>
          ))}

          {/* Add Profile Button */}
          {hasProfile && !showForm && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowForm(true)}
              activeOpacity={0.84}
            >
              <View style={styles.addPlus}><Text style={styles.addPlusText}>+</Text></View>
              <View style={styles.addCopy}>
                <Text style={styles.addText}>Add Another Birth Profile</Text>
                <Text style={styles.addSubtext}>Create birth charts for family and loved ones.</Text>
              </View>
              <Image source={QUILL_ART} style={styles.quillArt} resizeMode="contain" />
            </TouchableOpacity>
          )}

          {!showForm && (
            <>
              {/* Legal & Support */}
              <View style={styles.legalSection}>
                <View style={styles.legalTitleRow}><ProfileIcon symbol="♢" /><Text style={styles.legalHeading}>Legal & Support</Text><View style={styles.legalTitleLine} /></View>
                {LEGAL_LINKS.map((link) => (
                  <TouchableOpacity
                    key={link.url}
                    style={styles.legalRow}
                    onPress={() => openLegal(link.url)}
                    activeOpacity={0.7}
                  >
                    <ProfileIcon symbol={link.symbol} />
                    <Text style={styles.legalLabel}>{link.label}</Text>
                    <Text style={styles.legalChevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Danger Zone — delete account */}
              <View style={styles.dangerSection}>
                <View style={styles.dangerContent}>
                  <ProfileIcon symbol="!" danger />
                  <View style={styles.dangerCopy}>
                    <Text style={styles.dangerHeading}>Delete Account</Text>
                    <Text style={styles.dangerText}>Permanently remove your account and all associated data. This action cannot be undone.</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dangerBtn}
                    onPress={handleDeleteAccount}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dangerBtnText}>⌫</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Legal & Support
  legalSection: {
    marginTop: 24,
    backgroundColor: C.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#EDE4D8',
    overflow: 'hidden',
  },
  legalHeading: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: C.textMuted,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2EAE0',
  },
  legalLabel: { fontSize: fontSize.md, color: '#3D2010' },
  legalChevron: { fontSize: 22, color: '#C0A98A', marginTop: -2 },

  // Danger zone
  dangerSection: {
    marginTop: 16,
    backgroundColor: '#FDEDED',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#F5C6C6',
    padding: 12,
  },
  dangerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dangerHeading: { fontSize: fontSize.sm, fontWeight: '700', color: '#B42318', marginBottom: 2 },
  dangerText: { fontSize: fontSize.xs, color: '#B4483E', lineHeight: 14 },
  dangerBtn: {
    backgroundColor: '#D92D20',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  dangerBtnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 55 : 45, paddingBottom: 16, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 25, borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  headerBannerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: 500, height: 500, resizeMode: 'cover', opacity: 0.8,
  },
  headerLogo: {
    width: 34, height: 34, borderRadius: 8, resizeMode: 'contain',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  headerTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: C.white },
  headerSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.sm,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  logoutText: { color: C.white, fontSize: fontSize.sm, fontWeight: '600' },
  userInfo: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  body: { padding: spacing.lg },
  setupPrompt: { padding: spacing.lg, alignItems: 'center' },
  setupIcon: { fontSize: 40, marginBottom: spacing.sm },
  setupTitle: { fontSize: fontSize.xl, fontWeight: '700', color: C.text, marginBottom: 4 },
  setupDesc: { fontSize: fontSize.md, color: C.textMuted, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 22 },
  setupBtn: { borderRadius: radius.md, overflow: 'hidden', width: '100%' },
  gradBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: radius.md },
  gradBtnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },
  formWrap: { padding: spacing.lg },
  formTitle: { fontSize: fontSize.xl, fontWeight: '700', color: C.text, marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: C.textMid, marginBottom: 6, marginTop: spacing.sm },
  input: {
    backgroundColor: C.input, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 13,
    fontSize: fontSize.md, color: C.text,
    borderWidth: 1, borderColor: C.border,
  },
  inputText: {
    fontSize: fontSize.md,
    color: C.text,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  selectChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.white,
  },
  selectChipActive: { backgroundColor: C.saffronPale, borderColor: C.saffron },
  selectChipText: { fontSize: fontSize.sm, color: C.textMid },
  selectChipTextActive: { color: C.saffron, fontWeight: '600' },
  formBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.lg, gap: spacing.sm },
  cancelBtn: {
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: radius.md,
    borderWidth: 1, borderColor: C.border,
  },
  cancelText: { color: C.textMid, fontWeight: '600' },
  submitBtn: { borderRadius: radius.md, overflow: 'hidden', flex: 1 },
  profileCard: { padding: spacing.md },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  profileAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.maroonPale, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  avatarText: { fontSize: fontSize.lg, fontWeight: '700', color: C.maroon },
  profileName: { fontSize: fontSize.lg, fontWeight: '700', color: C.text },
  profileRel: { fontSize: fontSize.sm, color: C.textMuted },
  profileActions: { flexDirection: 'row', gap: 8, paddingTop: 30 },
  actionBtn: { padding: 6 },
  actionText: { fontSize: 16 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailItem: { width: '50%', marginBottom: spacing.sm },
  detailLabel: { fontSize: fontSize.xs, color: C.textMuted },
  detailValue: { fontSize: fontSize.md, color: C.text, fontWeight: '500' },
  addBtn: {
    borderWidth: 1.5, borderColor: C.saffron, borderStyle: 'dashed',
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
  },
  addText: { color: C.saffron, fontWeight: '600', fontSize: fontSize.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBadge: {
    backgroundColor: C.saffron,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgeText: { color: C.white, fontSize: 10, fontWeight: '800' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: 10 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: C.saffron,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxInner: { width: 10, height: 10, borderRadius: 2, backgroundColor: 'transparent' },
  checkboxActive: { backgroundColor: C.saffron },
  switchLabel: { fontSize: fontSize.sm, color: C.textMid, fontWeight: '500' },
  subCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  subInfo: { flex: 1 },
  subTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  subDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  subArrow: { fontSize: 20, color: C.saffron, fontWeight: '700' },

  // Premium profile dashboard overrides
  backgroundVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(250,247,242,0.28)' },
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 48, paddingBottom: 28, paddingHorizontal: 22 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerCopy: { flex: 1, paddingRight: 14 },
  headerTitle: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 40, lineHeight: 46, fontWeight: '600', color: '#35281D', letterSpacing: -0.9 },
  headerSub: { maxWidth: 230, fontSize: 13.5, color: '#786B60', lineHeight: 20, marginTop: 8 },
  headerOrnament: { width: 76, flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  headerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D4AF37', marginRight: 6 },
  headerLine: { flex: 1, height: 1, backgroundColor: 'rgba(212,175,55,0.55)' },
  logoutBtn: { minHeight: 48, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,253,249,0.86)', borderRadius: 24, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', shadowColor: '#72543D', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.11, shadowRadius: 14, elevation: 4 },
  logoutIcon: { color: '#956B1A', fontSize: 22, marginRight: 7 },
  logoutText: { color: '#6F5D4F', fontSize: 13.5, fontWeight: '600' },
  body: { paddingHorizontal: 18, paddingBottom: 30 },
  profileShell: { marginBottom: 14, borderRadius: 24, borderColor: 'rgba(212,175,55,0.24)', backgroundColor: 'rgba(255,253,249,0.95)', shadowColor: '#72543D', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.09, shadowRadius: 16, elevation: 4 },
  profileCard: { paddingHorizontal: 14, paddingTop: 13, paddingBottom: 11 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', minHeight: 58 },
  profileAvatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#F8ECEA', justifyContent: 'center', alignItems: 'center', marginRight: 11, borderWidth: 1.5, borderColor: '#D4AF37', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 7, elevation: 2 },
  avatarText: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 24, fontWeight: '600', color: '#742844' },
  profileName: { flexShrink: 1, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 17, lineHeight: 21, fontWeight: '600', color: '#35281D' },
  profileRel: { flexShrink: 1, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 12.5, color: '#8A5368' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  profileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  primaryBadge: { backgroundColor: '#F4E2AC', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, borderWidth: 1, borderColor: '#E4C975' },
  primaryBadgeText: { color: '#9B6D08', fontSize: 8.5, fontWeight: '800' },
  profileActions: { flexDirection: 'row', gap: 6, alignSelf: 'flex-start', paddingTop: 2 },
  actionBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,253,249,0.9)', borderWidth: 1, borderColor: '#E8DDD0', shadowColor: '#72543D', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  actionBtnDanger: { borderColor: '#F0D1D1', backgroundColor: '#FFF8F7' },
  actionText: { color: '#6C4937', fontSize: 15, fontWeight: '700' },
  actionTextDanger: { color: '#C33D3D' },
  profileDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  profileDividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(212,175,55,0.42)' },
  profileDividerStar: { color: '#D4AF37', fontSize: 14, marginHorizontal: 7 },
  detailGrid: { flexDirection: 'row' },
  detailItem: { width: '33.333%', minHeight: 82, paddingHorizontal: 7, paddingVertical: 4, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#E9DED1' },
  detailLabel: { fontSize: 8.5, color: '#97877A', fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 5 },
  detailValue: { fontSize: 11.5, lineHeight: 15.5, color: '#35281D', fontWeight: '700', marginTop: 4 },
  detailHelper: { color: '#9B8B7D', fontSize: 9.5, marginTop: 2 },
  iconTile: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)' },
  iconTileCompact: { width: 32, height: 32, borderRadius: 10 },
  iconSymbol: { color: '#A87308', fontSize: 20, fontWeight: '700' },
  iconSymbolCompact: { fontSize: 16 },
  iconSymbolDanger: { color: '#BE3C3C' },
  addBtn: { minHeight: 132, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#DDBA91', borderStyle: 'dashed', borderRadius: 25, paddingLeft: 15, paddingRight: 8, marginTop: 2, backgroundColor: 'rgba(255,248,238,0.78)', overflow: 'hidden' },
  addPlus: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFDF9', borderWidth: 1, borderColor: '#E8DCCB', shadowColor: '#72543D', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.09, shadowRadius: 10, elevation: 3 },
  addPlusText: { color: '#B77C08', fontSize: 30, lineHeight: 32, fontWeight: '300' },
  addCopy: { flex: 1, marginLeft: 13, paddingRight: 68 },
  addText: { color: '#A7700B', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', fontSize: 17 },
  addSubtext: { color: '#8B7A6B', fontSize: 10.5, lineHeight: 15, marginTop: 5 },
  quillArt: { position: 'absolute', right: -8, bottom: 3, width: 102, height: 116 },
  legalSection: { marginTop: 22, backgroundColor: 'rgba(255,253,249,0.94)', borderRadius: 26, borderWidth: 1, borderColor: '#EADBC8', overflow: 'hidden', paddingHorizontal: 16, shadowColor: '#72543D', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.07, shadowRadius: 15, elevation: 3 },
  legalTitleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  legalHeading: { fontSize: 12.5, fontWeight: '800', color: '#A7700B', textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 10 },
  legalTitleLine: { flex: 1, height: 1, backgroundColor: 'rgba(212,175,55,0.3)', marginLeft: 12 },
  legalRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#EEE5DA' },
  legalLabel: { flex: 1, fontSize: 14, color: '#45372D', marginLeft: 12, fontWeight: '500' },
  legalChevron: { fontSize: 25, color: '#C18B0A', marginLeft: 8 },
  dangerSection: { marginTop: 17, backgroundColor: 'rgba(255,239,239,0.9)', borderRadius: 25, borderWidth: 1, borderColor: '#F0CFCF', padding: 16 },
  dangerContent: { flexDirection: 'row', alignItems: 'center' },
  dangerCopy: { flex: 1, marginLeft: 13, marginRight: 10 },
  dangerHeading: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 17, fontWeight: '600', color: '#A52F36', marginBottom: 4 },
  dangerText: { fontSize: 10.5, color: '#976568', lineHeight: 15 },
  dangerBtn: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#C93D3D', alignItems: 'center', justifyContent: 'center', shadowColor: '#C93D3D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  dangerBtnText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
});

export default ProfileScreen;
