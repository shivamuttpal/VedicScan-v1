import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthHeader, AuthScaffold, PrimaryButton, T } from '../../components/auth/AuthUI';
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
  const inputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) interval = setInterval(() => setResendTimer((previous) => previous - 1), 1000);
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
        res = isEmail
          ? await api.post('/api/users/verify-email', { email, otp: otp.trim() })
          : await api.post('/api/users/verify-phone', { phone: email, otp: otp.trim() });
      } else {
        res = await api.post('/api/users/verify-otp', { email, otp: otp.trim() });
      }
      if (res.data?.success) {
        if (purpose === 'signup') await saveSession(res.data.data.token, res.data.data.user);
        else navigation.navigate('ResetPassword', { email, token: res.data.data?.token || otp });
      } else Alert.alert('Error', res.data?.message || 'Invalid OTP');
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
      if (purpose === 'forgot-password') await api.post('/api/users/forgot-password', { email });
      else await api.post('/api/users/resend-otp', isEmail ? { email } : { phone: email });
      Alert.alert('Success', 'A new verification code has been sent.');
      setResendTimer(60);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold>
      <AuthHeader illustration title="Verify your identity" subtitle={`Enter the code sent to ${email}`} />
      <View style={styles.otpContainer}>
        <View pointerEvents="none" style={styles.otpRow}>
          {Array.from({ length: 6 }, (_, index) => (
            <View key={index} style={[styles.cell, otp.length === index && styles.active]}>
              <Text style={styles.digit}>{otp[index] || ''}</Text>
            </View>
          ))}
        </View>
        <TextInput
          ref={inputRef}
          style={styles.otpInput}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          caretHidden
          selectionColor="transparent"
          underlineColorAndroid="transparent"
          accessibilityLabel="Six digit verification code"
        />
      </View>
      <View style={styles.progress}><View style={[styles.progressFill, { width: `${Math.min(otp.length / 6 * 100, 100)}%` }]} /></View>
      <PrimaryButton title="Confirm Code" loading={loading} onPress={handleVerify} />
      <Pressable onPress={handleResend} disabled={resendTimer > 0 || loading} style={styles.resend}>
        <Text style={styles.body}>Didn’t receive it? <Text style={styles.link}>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}</Text></Text>
      </Pressable>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}><Text style={styles.body}>←  Go Back</Text></Pressable>
    </AuthScaffold>
  );
};

const styles = StyleSheet.create({
  otpContainer: { height: 64, position: 'relative', marginVertical: 8 },
  otpRow: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between' },
  cell: { width: '14.4%', borderRadius: 16, borderWidth: 1, borderColor: T.colors.border, backgroundColor: '#FFFEFB', alignItems: 'center', justifyContent: 'center' },
  active: { borderColor: T.colors.gold },
  digit: { fontSize: 22, fontWeight: '600', color: T.colors.ink },
  otpInput: { ...StyleSheet.absoluteFillObject, zIndex: 2, color: 'transparent', backgroundColor: 'transparent', fontSize: 1 },
  progress: { height: 3, backgroundColor: '#EADFD2', borderRadius: 2, marginVertical: 16, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: T.colors.gold },
  resend: { alignSelf: 'center', padding: 16, marginTop: 8 },
  back: { alignSelf: 'center', padding: 12 },
  body: { fontSize: 14, color: T.colors.body },
  link: { color: T.colors.amber, fontWeight: '600' },
});

export default VerifyOTPScreen;
