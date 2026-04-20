import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, RefreshControl, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VedicCard, GoldBar } from '../../components/VedicCard';
import api from '../../config/api';

const GENDERS = ['Male', 'Female', 'Other'];
const RELATIONSHIPS = ['Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Other'];

const ProfileScreen = ({ route }) => {
  const { user, hasProfile, refreshProfileStatus, logout } = useAuth();
  const isSetup = route?.params?.setup || false;
  const [profiles, setProfiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [form, setForm] = useState({
    fullName: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '',
    gender: 'Male', relationship: 'Self',
  });
  const [editingId, setEditingId] = useState(null);

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
      setForm({ fullName: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '', gender: 'Male', relationship: 'Self' });
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
      gender: profile.gender || 'Male',
      relationship: profile.relationship || 'Self',
    });
    setEditingId(profile._id || profile.id);
    setShowForm(true);
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
      <LinearGradient colors={['#6C3FA0', '#4A2680']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>👤 Profile</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.saffron} />}
      >
        <View style={styles.body}>
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
                  <LinearGradient colors={['#D4760A', '#B8860B']} style={styles.gradBtn}>
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

                <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={form.dateOfBirth}
                  onChangeText={(t) => setForm({ ...form, dateOfBirth: t })}
                  placeholder="1995-08-15"
                  placeholderTextColor={C.textDim}
                />

                <Text style={styles.label}>Time of Birth * (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  value={form.timeOfBirth}
                  onChangeText={(t) => setForm({ ...form, timeOfBirth: t })}
                  placeholder="14:30"
                  placeholderTextColor={C.textDim}
                />

                <Text style={styles.label}>Place of Birth *</Text>
                <TextInput
                  style={styles.input}
                  value={form.placeOfBirth}
                  onChangeText={(t) => setForm({ ...form, placeOfBirth: t })}
                  placeholder="Mumbai, Maharashtra"
                  placeholderTextColor={C.textDim}
                />

                <Text style={styles.label}>Gender</Text>
                <View style={styles.chipRow}>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.selectChip, form.gender === g && styles.selectChipActive]}
                      onPress={() => setForm({ ...form, gender: g })}
                    >
                      <Text style={[styles.selectChipText, form.gender === g && styles.selectChipTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Relationship</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    <LinearGradient colors={['#D4760A', '#B8860B']} style={styles.gradBtn}>
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
                    <Text style={styles.profileName}>{p.name}</Text>
                    <Text style={styles.profileRel}>{p.relationship || 'Self'}</Text>
                  </View>
                  <View style={styles.profileActions}>
                    <TouchableOpacity onPress={() => handleEdit(p)} style={styles.actionBtn}>
                      <Text style={styles.actionText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(p._id)} style={styles.actionBtn}>
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
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Gender</Text>
                    <Text style={styles.detailValue}>{p.gender || '—'}</Text>
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
    paddingTop: 50, paddingBottom: 16, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
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
  profileActions: { flexDirection: 'row', gap: 8 },
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
});

export default ProfileScreen;
