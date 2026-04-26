import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { C, fontSize } from '../theme';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import ChatScreen from '../screens/main/ChatScreen';
import RashifalScreen from '../screens/main/RashifalScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CompatibilityScreen from '../screens/main/CompatibilityScreen';
import BabyNamingScreen from '../screens/main/BabyNamingScreen';
import InsightsScreen from '../screens/main/InsightsScreen';
import PricingScreen from '../screens/main/PricingScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Home tab stack (contains nested screens)
const HomeStackScreen = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    <HomeStack.Screen name="Compatibility" component={CompatibilityScreen} />
    <HomeStack.Screen name="BabyNaming" component={BabyNamingScreen} />
    <HomeStack.Screen name="Insights" component={InsightsScreen} />
    <HomeStack.Screen name="Pricing" component={PricingScreen} />
    <HomeStack.Screen name="Profile" component={ProfileScreen} />
  </HomeStack.Navigator>
);

// Profile tab stack
const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

// Tab icon component
const TabIcon = ({ icon, label, focused }) => (
  <View style={styles.tabItem}>
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    {focused && <View style={styles.tabDot} />}
  </View>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeStackScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="✨" label="Maharshi" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="BabyNaming"
      component={BabyNamingScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="👶" label="Baby" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Compatibility"
      component={CompatibilityScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon="💕" label="Kundali" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8DFD2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9A8878',
  },
  tabLabelActive: {
    color: '#D4760A',
    fontWeight: '700',
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4760A',
    marginTop: 3,
  },
});

export default MainTabs;
