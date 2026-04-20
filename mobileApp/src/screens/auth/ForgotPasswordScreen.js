import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize } from '../../theme';
import api from '../../config/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/users/forgot-password', { email: email.trim() });
      if (res.data?.success) {
        Alert.alert('Success', 'OTP sent to your email');
        navigation.navigate('VerifyOTP', { email: email.trim() });
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to send OTP');
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
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive a reset OTP</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={C.textDim}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={loading}
          >
            <LinearGradient colors={['#D4760A', '#B8860B']} style={styles.gradBtn}>
              <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back to Login</Text>
        </TouchableOpacity>
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
  subtitle: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.5)', marginBottom: spacing.lg, textAlign: 'center' },
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
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: spacing.lg,
  },
  btn: { borderRadius: radius.md, overflow: 'hidden' },
  gradBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
  btnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },
  back: { marginTop: spacing.lg },
  backText: { color: C.saffron, fontSize: fontSize.md },
});

export default ForgotPasswordScreen;
