import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { C } from '../theme';

const LoadingOverlay = ({ message = 'Loading...' }) => (
  <View style={styles.container}>
    <View style={styles.box}>
      <ActivityIndicator size="large" color={C.saffron} />
      <Text style={styles.text}>{message}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  box: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: C.textMid,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoadingOverlay;
