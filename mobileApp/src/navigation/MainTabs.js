import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from '../screens/main/HomeScreen';
import ChatScreen from '../screens/main/ChatScreen';
import CompatibilityScreen from '../screens/main/CompatibilityScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import BabyNamingScreen from '../screens/main/BabyNamingScreen';

const Tab = createBottomTabNavigator();

const ACTIVE = '#7B1A38';
const MUTED  = '#9A8878';

// ── Regular tab icon ──
const TabIcon = ({ children, label, focused }) => (
  <View style={styles.tabItem}>
    <View style={[styles.activeBar, focused && styles.activeBarVisible]} />
    {children}
    <Text
      allowFontScaling={false}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.85}
      style={[styles.tabLabel, focused && styles.tabLabelActive]}
    >
      {label}
    </Text>
  </View>
);

const MaharishiIcon = ({ focused }) => (
  <View style={styles.centerWrapper}>
    <View style={[styles.centerBg, focused && styles.centerBgFocused]}>
      <MaterialCommunityIcons name="creation" size={26} color="#FFFFFF" />
    </View>
    <Text
      allowFontScaling={false}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.85}
      style={[styles.tabLabel, styles.centerLabel, focused && styles.tabLabelActive]}
    >
      Maharishi
    </Text>
  </View>
);

// ─────────────────────────────────────
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
  headerShown: false,
  tabBarStyle: styles.tabBar,
  tabBarShowLabel: false,
  tabBarHideOnKeyboard: true,
  tabBarItemStyle: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
}}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Home" focused={focused}>
            <Ionicons name={focused ? 'home' : 'home-outline'} size={23} color={focused ? ACTIVE : MUTED} />
          </TabIcon>
        ),
      }}
    />

    <Tab.Screen
      name="CompatibilityTab"
      component={CompatibilityScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Matching" focused={focused}>
            <MaterialCommunityIcons name={focused ? "heart-multiple" : "heart-multiple-outline"} size={23} color={focused ? ACTIVE : MUTED} />
          </TabIcon>
        ),
      }}
    />

    <Tab.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        tabBarIcon: ({ focused }) => <MaharishiIcon focused={focused} />,
      }}
    />

    <Tab.Screen
      name="BabyNaming"
      component={BabyNamingScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Baby" focused={focused}>
            <MaterialCommunityIcons name="baby-face-outline" size={23} color={focused ? ACTIVE : MUTED} />
          </TabIcon>
        ),
      }}
    />

    <Tab.Screen
      name="ProfileTab"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Profile" focused={focused}>
            <Ionicons name={focused ? 'person' : 'person-outline'} size={23} color={focused ? ACTIVE : MUTED} />
          </TabIcon>
        ),
      }}
    />
  </Tab.Navigator>
);

// ─────────────────────────────────────
// STYLES
// ─────────────────────────────────────
const styles = StyleSheet.create({
  // ── FLOATING TAB BAR ──
  // position:absolute + left/right/bottom creates the floating pill shape.
  // overflow:visible lets the center Maharishi button poke above.
  tabBar: {
  position: 'absolute',
  left: 28,
  right: 28,
  bottom: Platform.OS === 'ios' ? 26 : 14,
  height: 72,
  borderRadius: 28,
  backgroundColor: '#FFFFFF',
  borderTopWidth: 0,
  overflow: 'visible',


  paddingHorizontal: 4,
  paddingTop: 16,
  paddingBottom: 8,

  shadowColor: '#1A0A00',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.14,
  shadowRadius: 18,
  elevation: 14,
},

tabItem: {
  width: 64,
  height: 58,
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
},

activeBar: {
  position: 'absolute',
  top: -6,
  width: 25,
  height: 3,
  borderRadius: 2,
  backgroundColor: 'transparent',
},

activeBarVisible: {
  backgroundColor: '#C8660A',
},

tabLabel: {
  fontSize: 10.5,
  lineHeight: 13,
  fontWeight: '600',
  color: MUTED,
  marginTop: 4,
  textAlign: 'center',
  width: 64,
},

tabLabelActive: {
  color: ACTIVE,
  fontWeight: '800',
},

centerWrapper: {
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: -30,
  width: 72,
},

centerBg: {
  width: 56,
  height: 56,
  borderRadius: 19,
  backgroundColor: '#C8A45A',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 4,

  borderWidth: 2,
  borderColor: '#FFFFFF',

  shadowColor: '#7A5200',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 10,
  elevation: 16,
},

centerBgFocused: {
  backgroundColor: '#A07C30',
  transform: [{ scale: 1.04 }],
},

centerLabel: {
  width: 72,
  fontSize: 10.5,
},
});

export default MainTabs;
