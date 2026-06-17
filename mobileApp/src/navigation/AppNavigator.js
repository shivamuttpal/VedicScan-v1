import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import SetupStack from './SetupStack';
import { C } from '../theme';

const LOGO = require('../../assets/logo.jpeg');

// Feature screens that render full-screen above the tab bar
import CompatibilityScreen from '../screens/main/CompatibilityScreen';
// import InsightsScreen from '../screens/main/InsightsScreen'; // hidden
import PricingScreen from '../screens/main/PricingScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import PaymentSuccessScreen from '../screens/main/PaymentSuccessScreen';
import KundaliScreen from '../screens/main/KundaliScreen';
import BabyNamingScreen from '../screens/main/BabyNamingScreen';
// import RashifalScreen from '../screens/main/RashifalScreen'; // hidden

const Root = createNativeStackNavigator();

// RootStack wraps the Tab navigator and exposes extra full-screen routes.
// Any tab or nested screen can call navigation.navigate('Compatibility') etc.
// and reach these screens without showing the tab bar.
const RootStack = () => (
  <Root.Navigator screenOptions={{ headerShown: false }}>
    <Root.Screen name="MainTabs" component={MainTabs} />
    <Root.Screen
      name="Compatibility"
      component={CompatibilityScreen}
      options={{ animation: 'slide_from_right' }}
    />
    {/* <Root.Screen name="Insights" component={InsightsScreen} options={{ animation: 'slide_from_right' }} /> */}{/* hidden */}
    <Root.Screen
      name="Pricing"
      component={PricingScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
    <Root.Screen
      name="Subscription"
      component={SubscriptionScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
    <Root.Screen
      name="PaymentSuccess"
      component={PaymentSuccessScreen}
      options={{ animation: 'fade' }}
    />
    <Root.Screen
      name="Kundali"
      component={KundaliScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Root.Screen
      name="BabyNaming"
      component={BabyNamingScreen}
      options={{ animation: 'slide_from_right' }}
    />
    {/* <Root.Screen name="Rashifal" component={RashifalScreen} options={{ animation: 'slide_from_right' }} /> */}{/* hidden */}
  </Root.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, hasProfile, loading } = useAuth();

  if (loading) {
    return (
      <LinearGradient colors={C.heroGradient} style={styles.loader}>
        <Image source={LOGO} style={styles.loaderLogo} />
        <ActivityIndicator size="large" color={C.goldBorder} style={styles.spinner} />
        <Text style={styles.loadingText}>VedicScan</Text>
        <Text style={styles.loadingSub}>Aligning your stars...</Text>
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : !hasProfile ? (
        <SetupStack />
      ) : (
        <RootStack />
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
  loaderLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.3)',
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
