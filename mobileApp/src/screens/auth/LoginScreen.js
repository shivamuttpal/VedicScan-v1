import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { statusCodes } from '@react-native-google-signin/google-signin';

const LoginScreen = ({ navigation }) => {
  const { saveSession, googleLogin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await googleLogin();
    setLoading(false);

    if (!result.success && result.error) {
      const error = result.error;
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('In Progress', 'Login is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Play Services not available');
      } else {
        Alert.alert('Login Error', 'Could not sign in with Google');
      }
    } else if (!result.success) {
      Alert.alert('Google Login Failed', result.message || 'Verification failed');
    }
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const payload = identifier.includes('@')
        ? { email: identifier.trim(), password }
        : { phone: identifier.trim(), password };

      const res = await api.post('/api/users/login', payload);
      if (res.data?.success) {
        if (res.data.data?.needsVerification) {
          navigation.navigate('VerifyOTP', { 
            email: res.data.data.email || identifier, 
            purpose: 'signup' 
          });
          return;
        }
        await saveSession(res.data.data.token, res.data.data.user);
      } else {
        Alert.alert('Login Failed', res.data?.message || 'Invalid credentials');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      Alert.alert('Login Failed', msg);
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
            <Text style={styles.subtitle}>Sign in to your cosmic journey</Text>
          </View>

          <TouchableOpacity 
            style={styles.googleBtn} 
            activeOpacity={0.7}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>
              {loading ? 'Connecting...' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <LinearGradient colors={['transparent', '#D4BA80']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <LinearGradient colors={['#D4BA80', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.dividerLine} />
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email or Phone</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Enter email or phone"
                placeholderTextColor={C.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={C.textDim}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['#D4760A', '#7B1A38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                <Text style={styles.btnText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Create Account</Text>
            </TouchableOpacity>
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

  eyeBtn: { padding: spacing.sm },
  eyeText: { fontSize: 18 },

  forgotRow: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  forgotText: { fontSize: fontSize.sm, color: C.saffron, fontWeight: '600' },

  loginBtn: { borderRadius: radius.md, overflow: 'hidden' },
  gradientBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
  btnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },

  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  signupText: { color: C.textMid, fontSize: fontSize.sm },
  signupLink: { color: C.saffron, fontSize: fontSize.sm, fontWeight: '700' },

  backHome: { marginTop: spacing.xxl },
  backHomeText: { fontSize: fontSize.sm, color: C.textMuted },
});

export default LoginScreen;
