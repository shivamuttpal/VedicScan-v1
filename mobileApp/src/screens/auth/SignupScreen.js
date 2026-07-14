import React, { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { statusCodes } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import { Flag } from 'react-native-country-picker-modal';
import PhoneInput from 'react-native-phone-number-input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthHeader, AuthInput, AuthPasswordInput, AuthScaffold, OrDivider, PasswordStrength, PrimaryButton, SocialButton, T } from '../../components/auth/AuthUI';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const COUNTRY_PICKER_THEME = {
  primaryColor: T.colors.gold,
  primaryColorVariant: '#F1E4D2',
  backgroundColor: T.colors.ivory,
  onBackgroundTextColor: T.colors.ink,
  filterPlaceholderTextColor: T.colors.muted,
  itemHeight: 58,
  flagSize: 24,
  flagSizeButton: 24,
};

const SignupScreen = ({ navigation }) => {
  const { googleLogin } = useAuth();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const phoneInput = useRef(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async () => {
    setLoading(true);
    const result = await googleLogin();
    setLoading(false);
    if (!result.success && result.error) {
      const error = result.error;
      if (error.code === statusCodes.IN_PROGRESS) Alert.alert('In Progress', 'Login is already in progress');
      else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) Alert.alert('Error', 'Play Services not available');
      else if (error.code !== statusCodes.SIGN_IN_CANCELLED) Alert.alert('Login Error', 'Could not sign in with Google');
    } else if (!result.success) Alert.alert('Google Login Failed', result.message || 'Verification failed');
  };

  const handleSignup = async () => {
    if (!firstName.trim()) { Alert.alert('Error', 'First name is required'); return; }
    if (!email.trim() && !phone.trim()) { Alert.alert('Error', 'Email or phone number is required'); return; }
    if (password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const payload = { firstName: firstName.trim(), lastName: lastName.trim(), password };
      if (email.trim()) payload.email = email.trim();
      if (formattedPhone.trim()) {
        const cleanPhone = formattedPhone.trim().replace(/\s+/g, '');
        payload.phone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
      }
      const res = await api.post('/api/users/register', payload);
      if (res.data?.success) navigation.navigate('VerifyOTP', { email: email.trim() || formattedPhone.trim(), purpose: 'signup' });
      else Alert.alert('Registration Failed', res.data?.message || 'Please try again');
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return <AuthScaffold compact>
    <AuthHeader title={<Text>Vedic<Text style={styles.gold}>Scan</Text></Text>} subtitle="Create your celestial profile" />
    <SocialButton title="Continue with Google" loading={loading} onPress={handleGoogleSignup} />
    <OrDivider />
    <View style={styles.row}>
      <View style={styles.half}><AuthInput label="First Name *" icon="person-outline" value={firstName} onChangeText={setFirstName} placeholder="Arjun" /></View>
      <View style={styles.half}><AuthInput label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Sharma" /></View>
    </View>
    <AuthInput label="Email" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
    <Text style={styles.label}>Phone Number</Text>
    <PhoneInput
      ref={phoneInput}
      defaultValue={phone}
      defaultCode="IN"
      layout="first"
      flagSize={24}
      onChangeText={setPhone}
      onChangeFormattedText={setFormattedPhone}
      containerStyle={styles.phone}
      flagButtonStyle={styles.flagButton}
      textContainerStyle={styles.phoneText}
      textInputStyle={styles.phoneInput}
      codeTextStyle={styles.phoneCode}
      renderDropdownImage={<Ionicons name="chevron-down" size={16} color={T.colors.bronze} />}
      countryPickerProps={{
        withEmoji: false,
        renderFlagButton: ({ countryCode }) => <Flag countryCode={countryCode} withEmoji={false} flagSize={24} />,
        theme: COUNTRY_PICKER_THEME,
        modalProps: { statusBarTranslucent: false },
        closeButtonStyle: [styles.countryHeaderControl, { marginTop: insets.top }],
        closeButtonImageStyle: styles.closeIcon,
        filterProps: {
          placeholder: 'Search country or code',
          placeholderTextColor: T.colors.muted,
          selectionColor: T.colors.gold,
          style: [styles.countrySearch, { marginTop: insets.top }],
        },
        flatListProps: { contentContainerStyle: styles.countryList },
      }}
      placeholder="9876543210"
      textInputProps={{ placeholderTextColor: T.colors.muted, returnKeyType: 'next' }}
    />
    <AuthPasswordInput label="Password *" value={password} onChangeText={setPassword} placeholder="Create a secure password" />
    <PasswordStrength value={password} />
    <PrimaryButton title="Create Account" loading={loading} onPress={handleSignup} />
    <Text style={styles.terms}>By continuing, you agree to VedicScan’s Terms and Privacy Policy.</Text>
    <View style={styles.account}><Text style={styles.body}>Already have an account? </Text><Pressable onPress={() => navigation.navigate('Login')}><Text style={styles.link}>Sign In</Text></Pressable></View>
  </AuthScaffold>;
};

const styles = StyleSheet.create({
  gold: { color: T.colors.gold }, row: { flexDirection: 'row', gap: 12 }, half: { flex: 1 },
  label: { fontSize: 14, fontWeight: '500', color: T.colors.ink, marginBottom: 8, marginLeft: 4 },
  phone: { width: '100%', height: 58, borderRadius: 20, borderWidth: 1, borderColor: T.colors.border, backgroundColor: '#FFFEFB', marginBottom: 16, overflow: 'hidden' },
  flagButton: { width: 82, minWidth: 82, paddingHorizontal: 10, gap: 2, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: T.colors.border, backgroundColor: T.colors.cream },
  phoneText: { backgroundColor: 'transparent', borderTopRightRadius: 20, borderBottomRightRadius: 20, paddingHorizontal: 12, paddingVertical: 0 },
  phoneInput: { height: 54, fontSize: 15, color: T.colors.ink }, phoneCode: { fontSize: 14, color: T.colors.ink },
  countryHeaderControl: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  closeIcon: { width: 20, height: 20 },
  countrySearch: { flex: 1, height: 46, marginRight: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: T.colors.border, borderRadius: 16, backgroundColor: '#FFFEFB', fontSize: 15, color: T.colors.ink },
  countryList: { paddingBottom: 24 },
  terms: { fontSize: 12, lineHeight: 18, textAlign: 'center', color: T.colors.muted, marginTop: 16 },
  account: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 }, body: { fontSize: 14, color: T.colors.body }, link: { fontSize: 14, color: T.colors.amber, fontWeight: '600' },
});

export default SignupScreen;
