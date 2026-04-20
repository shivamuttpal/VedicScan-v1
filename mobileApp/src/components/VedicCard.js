import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, shadow, radius } from '../theme';

// Gold-bordered card matching web GoldCard
export const VedicCard = ({ children, style }) => (
  <View style={[styles.card, shadow.md, style]}>
    <LinearGradient
      colors={['transparent', '#B8860B90', '#D4760A', '#B8860B90', 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.goldBar}
    />
    {children}
  </View>
);

// Simple gold divider
export const GoldBar = ({ style }) => (
  <LinearGradient
    colors={['transparent', '#B8860B60', '#D4760A', '#B8860B60', 'transparent']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[styles.divider, style]}
  />
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  goldBar: {
    height: 2.5,
    width: '100%',
  },
  divider: {
    height: 1.5,
    width: '60%',
    alignSelf: 'center',
    marginVertical: 16,
    borderRadius: 1,
  },
});
