import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { saveSession } = useAuth();
  const email = route.params?.email || '';
  const resetToken = route.params?.token || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/users/reset-password', {
        email, token: resetToken, newPassword: password,
      });
      if (res.data?.success) {
        // Auto-login after password reset
        await saveSession(res.data.data.token, res.data.data.user);
        Alert.alert('Success', 'Password reset successful. Welcome back!');
      } else {
        Alert.alert('Error', res.data?.message || 'Reset failed');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={C.authGradient} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.omCircle}><Text style={styles.om}>ॐ</Text></View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Choose a new secure password</Text>

        <View style={styles.card}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Min 8 characters"
            placeholderTextColor={C.textDim}
            secureTextEntry
          />
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm password"
            placeholderTextColor={C.textDim}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleReset}
            disabled={loading}
          >
            <LinearGradient colors={['#D4760A', '#B8860B']} style={styles.gradBtn}>
              <Text style={styles.btnText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, alignItems: 'center' },
  omCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(184,134,11,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  om: { fontSize: 24, color: C.goldBorder },
  title: { fontSize: fontSize.h3, fontWeight: '700', color: C.white, marginBottom: 4 },
  subtitle: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.5)', marginBottom: spacing.lg },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.xl, padding: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14,
    fontSize: fontSize.md, color: C.white,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: spacing.md,
  },
  btn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.sm },
  gradBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
  btnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },
});

export default ResetPasswordScreen;
