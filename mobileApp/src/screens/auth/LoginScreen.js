import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { statusCodes } from '@react-native-google-signin/google-signin';
import { AuthHeader, AuthInput, AuthScaffold, OrDivider, PrimaryButton, SocialButton, T } from '../../components/auth/AuthUI';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const LoginScreen = ({ navigation }) => {
  const { saveSession, googleLogin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleGoogleLogin = async () => { setLoading(true); const result = await googleLogin(); setLoading(false); if (!result.success && result.error) { const error = result.error; if (error.code === statusCodes.IN_PROGRESS) Alert.alert('In Progress', 'Login is already in progress'); else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) Alert.alert('Error', 'Play Services not available'); else if (error.code !== statusCodes.SIGN_IN_CANCELLED) Alert.alert('Login Error', 'Could not sign in with Google'); } else if (!result.success) Alert.alert('Google Login Failed', result.message || 'Verification failed'); };
  const handleLogin = async () => { if (!identifier.trim() || !password.trim()) { Alert.alert('Error', 'Please fill in all fields'); return; } setLoading(true); try { const payload = identifier.includes('@') ? { email: identifier.trim(), password } : { phone: identifier.trim(), password }; const res = await api.post('/api/users/login', payload); if (res.data?.success) { if (res.data.data?.needsVerification) { navigation.navigate('VerifyOTP', { email: res.data.data.email || identifier, purpose: 'signup' }); return; } await saveSession(res.data.data.token, res.data.data.user); } else Alert.alert('Login Failed', res.data?.message || 'Invalid credentials'); } catch (err) { Alert.alert('Login Failed', err.response?.data?.message || 'Login failed. Please try again.'); } finally { setLoading(false); } };
  return <AuthScaffold><AuthHeader title={<Text>Vedic<Text style={s.gold}>Scan</Text></Text>} subtitle="Sign in to your cosmic journey" /><SocialButton title="Sign in with Google" loading={loading} onPress={handleGoogleLogin} /><OrDivider /><AuthInput label="Email or Phone" icon="person-outline" value={identifier} onChangeText={setIdentifier} placeholder="Enter email or phone" keyboardType="email-address" autoCapitalize="none" /><AuthInput label="Password" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry={!showPassword} trailing={<Pressable accessibilityLabel="Toggle password visibility" hitSlop={12} onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={T.colors.gold} /></Pressable>} /><Pressable onPress={() => navigation.navigate('ForgotPassword')} style={s.forgot}><Text style={s.link}>Forgot Password?</Text></Pressable><PrimaryButton title="Sign In" loading={loading} onPress={handleLogin} /><View style={s.account}><Text style={s.body}>Don’t have an account? </Text><Pressable onPress={() => navigation.navigate('Signup')}><Text style={s.link}>Create Account</Text></Pressable></View><Pressable onPress={() => navigation.navigate('Splash')} style={s.home}><Text style={s.body}>←  Back to Home</Text></Pressable></AuthScaffold>;
};
const s = StyleSheet.create({ gold:{color:T.colors.gold},forgot:{alignSelf:'flex-end',paddingVertical:4,marginBottom:8},link:{color:T.colors.amber,fontSize:14,fontWeight:'600'},account:{flexDirection:'row',justifyContent:'center',marginTop:26},body:{color:T.colors.body,fontSize:14},home:{alignSelf:'center',padding:16,marginTop:12}});
export default LoginScreen;
