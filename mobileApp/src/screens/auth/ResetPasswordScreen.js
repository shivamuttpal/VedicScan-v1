import React, { useState } from 'react';
import { Alert } from 'react-native';
import { AuthHeader, AuthPasswordInput, AuthScaffold, PasswordStrength, PrimaryButton } from '../../components/auth/AuthUI';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const ResetPasswordScreen = ({ route }) => {
  const { saveSession } = useAuth();
  const email = route.params?.email || '';
  const resetToken = route.params?.token || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/users/reset-password', { email, token: resetToken, newPassword: password });
      if (res.data?.success) {
        await saveSession(res.data.data.token, res.data.data.user);
        Alert.alert('Success', 'Password reset successful. Welcome back!');
      } else Alert.alert('Error', res.data?.message || 'Reset failed');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return <AuthScaffold>
    <AuthHeader illustration title="Create a new password" subtitle="Choose something memorable and secure for your account." />
    <AuthPasswordInput label="New Password" icon="shield-checkmark-outline" value={password} onChangeText={setPassword} placeholder="Minimum 8 characters" textContentType="newPassword" />
    <PasswordStrength value={password} />
    <AuthPasswordInput label="Confirm Password" value={confirm} onChangeText={setConfirm} placeholder="Enter it once more" textContentType="newPassword" />
    <PrimaryButton title="Reset Password" loading={loading} onPress={handleReset} />
  </AuthScaffold>;
};

export default ResetPasswordScreen;
