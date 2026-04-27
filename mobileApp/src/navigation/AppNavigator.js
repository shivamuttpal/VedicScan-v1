import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import SetupStack from './SetupStack';
import { C } from '../theme';

const AppNavigator = () => {
  const { isAuthenticated, hasProfile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <View style={styles.omCircle}>
          <Text style={styles.omText}>🔱</Text>
        </View>
        <ActivityIndicator size="large" color={C.saffron} style={styles.spinner} />
        <Text style={styles.loadingText}>VedicScan</Text>
        <Text style={styles.loadingSub}>Loading your cosmic journey...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bgDark,
  },
  omCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(184, 134, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  omText: {
    fontSize: 38,
    color: C.goldBorder,
  },
  spinner: { marginBottom: 16 },
  loadingText: {
    fontSize: 28,
    fontWeight: '800',
    color: C.white,
  },
  loadingSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
});

export default AppNavigator;
