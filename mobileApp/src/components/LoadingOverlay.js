import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';

const LOADING_SCREEN = require('../../assets/loadingscreen.png');

const LoadingOverlay = ({ message = 'Aligning your stars…' }) => {
  const { width, height } = useWindowDimensions();
  const breathe = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breathingAnimation = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const rotationAnimation = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 1150, easing: Easing.linear, useNativeDriver: true }));
    breathingAnimation.start();
    rotationAnimation.start();
    return () => { breathingAnimation.stop(); rotationAnimation.stop(); };
  }, [breathe, rotation]);

  return <View accessibilityRole="progressbar" accessibilityLabel={message} style={styles.overlay}>
    <StatusBar hidden />
    <Animated.Image source={LOADING_SCREEN} resizeMode="cover" style={[styles.background, {
      width,
      height: height + 68,
      opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }),
      transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1.015, 1.04] }) }],
    }]} />
    <Animated.View pointerEvents="none" style={[styles.spinner, { transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]} />
  </View>;
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 999, overflow: 'hidden', backgroundColor: '#FFF9EF' },
  background: { position: 'absolute', left: 0, top: -34 },
  spinner: { position: 'absolute', alignSelf: 'center', top: '58.2%', width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'rgba(198,137,35,0.18)', borderTopColor: '#C68923', borderRightColor: '#E2B85D' },
});

export default LoadingOverlay;
