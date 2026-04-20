import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { VedicCard } from '../../components/VedicCard';
import api from '../../config/api';

const SignupScreen = ({ navigation }) => {
  const { saveSession } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      Alert.alert('Error', 'Email or phone number is required');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      };
      if (email.trim()) payload.email = email.trim();
      if (phone.trim()) payload.phone = phone.trim();

      const res = await api.post('/api/users/register', payload);
      if (res.data?.success) {
        Alert.alert('Success', res.data?.message || 'Verification code sent!', [
          { text: 'OK', onPress: () => navigation.navigate('VerifyOTP', { email: email.trim() || phone.trim(), purpose: 'signup' }) }
        ]);
      } else {
        Alert.alert('Registration Failed', res.data?.message || 'Please try again');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <View style={styles.omCircle}>
              <Text style={styles.omText}>🔱</Text>
            </View>
            <Text style={styles.brand}>
              Vedic<Text style={styles.brandAccent}>Scan</Text>
            </Text>
            <Text style={styles.subtitle}>Create your celestial profile</Text>
          </View>

          <TouchableOpacity style={styles.googleBtn} activeOpacity={0.7}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <LinearGradient colors={['transparent', '#D4BA80']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <LinearGradient colors={['#D4BA80', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.dividerLine} />
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>First Name *</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Arjun"
                placeholderTextColor={C.textDim}
              />
            </View>

            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Sharma"
                placeholderTextColor={C.textDim}
              />
            </View>

            <Text style={styles.label}>Email *</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={C.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 9876543210"
                placeholderTextColor={C.textDim}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={C.textDim}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.signupBtn} onPress={handleSignup} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['#D4760A', '#7B1A38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Account'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Why VedicScan?</Text>
            <Text style={styles.featureItem}>✨ AI-powered Vedic astrology</Text>
            <Text style={styles.featureItem}>🔮 Personalized birth chart readings</Text>
            <Text style={styles.featureItem}>💕 Kundali compatibility matching</Text>
            <Text style={styles.featureItem}>👶 Auspicious baby name finder</Text>
          </View>

          <TouchableOpacity style={styles.backHome} onPress={() => navigation.navigate('Splash')}>
            <Text style={styles.backHomeText}>← Back to Home</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgWarm },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  omCircle: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: '#A03B2B', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm, ...shadow.gold
  },
  omText: { fontSize: 32, color: C.saffronSoft },
  brand: { fontSize: fontSize.h2, fontWeight: '700', color: C.maroon },
  brandAccent: { color: C.saffron },
  subtitle: { fontSize: fontSize.sm, color: C.textMid, marginTop: 4 },
  
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.white, borderRadius: radius.md,
    paddingVertical: 14, paddingHorizontal: spacing.xl, width: '100%',
    borderWidth: 1, borderColor: C.border, ...shadow.sm, marginBottom: spacing.lg
  },
  googleIcon: { fontSize: 18, marginRight: 8, color: '#4285F4', fontWeight: 'bold' },
  googleText: { fontSize: fontSize.md, fontWeight: '600', color: C.text },

  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: spacing.lg },
  dividerLine: { flex: 1, height: 1.5, borderRadius: 1 },
  dividerText: { marginHorizontal: spacing.md, color: C.textMuted, fontSize: 10, letterSpacing: 1 },

  form: { width: '100%' },
  label: { fontSize: fontSize.sm, fontWeight: '700', color: C.textMid, marginBottom: 6, marginLeft: 2 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.input, borderRadius: radius.md,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: spacing.md, marginBottom: spacing.md
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: fontSize.md, color: C.text },

  signupBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.sm },
  gradientBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
  btnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },

  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  loginText: { color: C.textMid, fontSize: fontSize.sm },
  loginLink: { color: C.saffron, fontSize: fontSize.sm, fontWeight: '700' },

  featuresSection: { alignItems: 'center', width: '100%', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: C.border },
  featuresTitle: { fontSize: fontSize.md, fontWeight: '700', color: C.text, marginBottom: spacing.md },
  featureItem: { fontSize: fontSize.sm, color: C.textMid, marginBottom: 6 },

  backHome: { marginTop: spacing.xxl },
  backHomeText: { fontSize: fontSize.sm, color: C.textMuted },
});

export default SignupScreen;
