import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const VerifyOTPScreen = ({ navigation, route }) => {
  const { saveSession } = useAuth();
  const email = route.params?.email || '';
  const purpose = route.params?.purpose || 'forgot-password';
  const isEmail = email.includes('@');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  React.useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (!otp.trim() || otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }
    setLoading(true);
    try {
      let res;
      if (purpose === 'signup') {
        if (isEmail) {
          res = await api.post('/api/users/verify-email', { email, otp: otp.trim() });
        } else {
          res = await api.post('/api/users/verify-phone', { phone: email, otp: otp.trim() });
        }
      } else {
        res = await api.post('/api/users/verify-otp', { email, otp: otp.trim() });
      }

      if (res.data?.success) {
        if (purpose === 'signup') {
          // Instantly log the user into the app without showing an alert
          await saveSession(res.data.data.token, res.data.data.user);
        } else {
          navigation.navigate('ResetPassword', { email, token: res.data.data?.token || otp });
        }
      } else {
        Alert.alert('Error', res.data?.message || 'Invalid OTP');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (purpose === 'forgot-password') {
        await api.post('/api/users/forgot-password', { email });
        Alert.alert('Success', 'A new verification code has been sent.');
        setResendTimer(60);
      } else {
        const payload = isEmail ? { email } : { phone: email };
        await api.post('/api/users/resend-otp', payload);
        Alert.alert('Success', 'A new verification code has been sent.');
        setResendTimer(60);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={C.authGradient} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.omCircle}><Text style={styles.om}>ॐ</Text></View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the code sent to {email}</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter OTP"
            placeholderTextColor={C.textDim}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleVerify}
            disabled={loading}
          >
            <LinearGradient colors={['#D4760A', '#B8860B']} style={styles.gradBtn}>
              <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0 || loading} style={[styles.resendBtn, resendTimer > 0 && { opacity: 0.6 }]}>
          <Text style={styles.resendText}>
            Didn't receive code? <Text style={styles.resendLink}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Go Back</Text>
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
  otpInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 18,
    fontSize: 28, color: C.white, letterSpacing: 12, fontWeight: '700',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: spacing.lg,
  },
  btn: { borderRadius: radius.md, overflow: 'hidden' },
  gradBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
  btnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },
  resendBtn: { marginTop: spacing.xl },
  resendText: { color: 'rgba(255,255,255,0.6)', fontSize: fontSize.sm },
  resendLink: { color: C.saffron, fontWeight: '700' },
  back: { marginTop: spacing.lg },
  backText: { color: C.saffron, fontSize: fontSize.md },
});

export default VerifyOTPScreen;
