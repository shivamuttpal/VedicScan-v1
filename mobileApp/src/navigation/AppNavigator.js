import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import SetupStack from './SetupStack';

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
    return <LoadingOverlay />;
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

export default AppNavigator;
