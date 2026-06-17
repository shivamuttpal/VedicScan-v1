import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, RefreshControl, Platform, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VedicCard, GoldBar } from '../../components/VedicCard';
import LocationInput from '../../components/LocationInput';
import api from '../../config/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const LOGO = require('../../../assets/logo.jpeg');
const BANNER = require('../../../assets/bannerbackground5.webp');

const GENDERS = ['Male', 'Female', 'Other'];
const RELATIONSHIPS = ['Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Other'];

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

const ProfileScreen = ({ route, navigation }) => {
  const { user, hasProfile, refreshProfileStatus, logout } = useAuth();
  const isSetup = route?.params?.setup || false;
  const [profiles, setProfiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    relationship: 'Self',
    isDefault: false,
  });

  // Auto-populate name from user context when relationship is Self
  useEffect(() => {
    if (!editingId && showForm && form.relationship === 'Self' && !form.fullName && user) {
      const nameFromContext = (user.firstName || user.name || '').trim();
      const lastNameFromContext = (user.lastName || '').trim();
      const fullName = `${nameFromContext} ${lastNameFromContext}`.trim();

      if (fullName) {
        setForm(prev => ({ ...prev, fullName }));
      } else if (user.email || user.phone) {
        const fallback = (user.email ? user.email.split('@')[0] : user.phone) || '';
        if (fallback) setForm(prev => ({ ...prev, fullName: fallback }));
      }
    }
  }, [user, showForm, form.relationship, editingId, form.fullName]);
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

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm({ ...form, dateOfBirth: formatLocalDate(selectedDate) });
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setForm({ ...form, timeOfBirth: `${hours}:${minutes}` });
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6A1039', '#6A1039']} style={styles.header}>
        <Image source={BANNER} style={styles.headerBannerOverlay} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
               <Text style={styles.headerTitle}>Profile</Text>
            </View>
            <Text style={styles.headerSub}>
              {hasProfile ? `${profiles.length} birth profile(s)` : 'Create your first profile'}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        {user && (
          <Text style={styles.userInfo}>
            {user.firstName} {user.lastName || ''} · {user.email || user.phone || ''}
          </Text>
        )}
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                  onChangeText={(t) => setForm({ ...form, fullName: t })}
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

                {showDatePicker && (
                  <DateTimePicker
                    value={form.dateOfBirth ? parseDateLocal(form.dateOfBirth) : new Date(1990, 0, 1)}
                    mode="date"
                    display="spinner"
                    minimumDate={new Date(1900, 0, 1)}
                    maximumDate={new Date()}
                    onChange={onDateChange}
                  />
                )}

                <Text style={styles.label}>Time of Birth *</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={[styles.inputText, !form.timeOfBirth && { color: C.textDim }]}>
                    {form.timeOfBirth || 'Select Time (HH:MM)'}
                  </Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={(() => {
                      const d = new Date();
                      if (form.timeOfBirth) {
                        const [h, m] = form.timeOfBirth.split(':');
                        d.setHours(parseInt(h), parseInt(m));
                      }
                      return d;
                    })()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onTimeChange}
                  />
                )}

                <Text style={styles.label}>Place of Birth *</Text>
                <LocationInput
                  style={styles.input}
                  value={form.placeOfBirth}
                  onChangeText={(t) => setForm({ ...form, placeOfBirth: t })}
                  placeholder="Mumbai, Maharashtra"
                />

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
            <VedicCard key={p._id || i} style={{ marginBottom: spacing.md }}>
              <View style={styles.profileCard}>
                <View style={styles.profileHeader}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.avatarText}>
                      {(p.name || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.profileName}>{p.name}</Text>
                      {p.isDefault && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.profileRel}>{p.relationship || 'Self'}</Text>
                  </View>
                  <View style={styles.profileActions}>
                    {!p.isDefault && (
                      <TouchableOpacity onPress={() => handleSetDefault(p.id)} style={styles.actionBtn}>
                        <Text style={styles.actionText}>⭐</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleEdit(p)} style={styles.actionBtn}>
                      <Text style={styles.actionText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(p.id)} style={styles.actionBtn}>
                      <Text style={styles.actionText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <GoldBar />
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>DOB</Text>
                    <Text style={styles.detailValue}>{p.dateOfBirth || '—'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>{p.timeOfBirth || '—'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Place</Text>
                    <Text style={styles.detailValue}>{p.placeOfBirth || '—'}</Text>
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
              activeOpacity={0.7}
            >
              <Text style={styles.addText}>+ Add Another Profile</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </View>
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
});

export default ProfileScreen;
