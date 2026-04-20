import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { C, radius, fontSize } from '../theme';

const RashiChip = ({ sign, active = false, onPress, style }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[
      styles.chip,
      active ? styles.chipActive : styles.chipInactive,
      style,
    ]}
  >
    <Text style={styles.symbol}>{sign.sym}</Text>
    <Text style={[styles.name, active && styles.nameActive]}>{sign.rashi}</Text>
    <Text style={styles.zodiac}>{sign.zodiac}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    minWidth: 76,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: C.saffronPale,
    borderColor: C.saffron,
  },
  chipInactive: {
    backgroundColor: C.white,
    borderColor: C.border,
  },
  symbol: {
    fontSize: 22,
    marginBottom: 2,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: C.text,
  },
  nameActive: {
    color: C.saffron,
  },
  zodiac: {
    fontSize: fontSize.xs,
    color: C.textDim,
  },
});

export default RashiChip;
