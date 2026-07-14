import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SPLASH = require('../../../assets/vedicsplas.png');

const LotusMark = ({ small = false }) => (
  <View style={[styles.lotusMark, small && styles.lotusMarkSmall]}>
    <View style={[styles.lotusPetal, styles.lotusPetalCenter, small && styles.lotusPetalSmall]} />
    <View style={[styles.lotusPetal, styles.lotusPetalLeft, small && styles.lotusPetalSmall]} />
    <View style={[styles.lotusPetal, styles.lotusPetalRight, small && styles.lotusPetalSmall]} />
    <View style={[styles.lotusBase, small && styles.lotusBaseSmall]} />
  </View>
);

const Particle = ({ width, height, index }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const config = useMemo(() => ({
    left: ((index * 47) % 93) / 100 * width,
    top: (0.22 + ((index * 31) % 68) / 100) * height,
    size: 2 + (index % 3),
    distance: 70 + (index % 5) * 25,
    duration: 7000 + (index % 6) * 900,
    delay: (index % 7) * 620,
  }), [height, index, width]);

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(config.delay),
      Animated.timing(progress, {
        toValue: 1,
        duration: config.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [config, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: config.left,
          top: config.top,
          width: config.size,
          height: config.size,
          borderRadius: config.size,
          opacity: progress.interpolate({
            inputRange: [0, 0.18, 0.72, 1],
            outputRange: [0, 0.72, 0.4, 0],
          }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -config.distance] }) },
            { translateX: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 7, -3] }) },
          ],
        },
      ]}
    />
  );
};

const SplashScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const backdrop = useRef(new Animated.Value(0)).current;
  const wheel = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const lotus = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const logo = useRef(new Animated.Value(0)).current;
  const subtitle = useRef(new Animated.Value(0)).current;
  const actions = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const intro = Animated.sequence([
      Animated.delay(220),
      Animated.parallel([
        Animated.spring(lotus, { toValue: 1, damping: 13, stiffness: 80, useNativeDriver: true }),
        Animated.timing(tagline, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.spring(logo, { toValue: 1, damping: 14, stiffness: 75, useNativeDriver: true }),
      Animated.timing(subtitle, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(actions, { toValue: 1, damping: 14, stiffness: 95, mass: 0.9, useNativeDriver: true }),
    ]);
    const zoom = Animated.loop(Animated.sequence([
      Animated.timing(backdrop, { toValue: 1, duration: 11000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 11000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const rotation = Animated.loop(Animated.timing(wheel, {
      toValue: 1,
      duration: 90000,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    intro.start();
    zoom.start();
    rotation.start();
    pulse.start();
    return () => { intro.stop(); zoom.stop(); rotation.stop(); pulse.stop(); };
  }, [actions, backdrop, glow, logo, lotus, subtitle, tagline, wheel]);

  const reveal = (value, distance = 16) => ({
    opacity: value,
    transform: [
      { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
      { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <Animated.Image
        source={SPLASH}
        resizeMode="cover"
        style={[
          StyleSheet.absoluteFillObject,
          {
            width,
            height,
            transform: [{ scale: backdrop.interpolate({ inputRange: [0, 1], outputRange: [1.01, 1.065] }) }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.templeGlow,
          {
            width: width * 0.72,
            height: width * 0.72,
            borderRadius: width,
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.22] }),
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.zodiacTrace,
          {
            width: width * 0.72,
            height: width * 0.72,
            borderRadius: width,
            transform: [{ rotate: wheel.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
          },
        ]}
      >
        <View style={styles.zodiacMarker} />
      </Animated.View>
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        {Array.from({ length: 16 }, (_, index) => <Particle key={index} width={width} height={height} index={index + 1} />)}
      </View>

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0)', 'rgba(255,253,248,0.7)', 'rgba(255,252,245,0.98)']}
        locations={[0, 0.48, 1]}
        style={[styles.bottomFade, { height: height * 0.52 }]}
      />

      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
        <Animated.View style={[styles.lotusIntro, reveal(lotus, 10)]}>
          <View style={styles.ornamentLine} />
          <LotusMark />
          <View style={styles.ornamentLine} />
        </Animated.View>
        <Animated.Text style={[styles.tagline, reveal(tagline, 10)]}>ANCIENT WISDOM  •  MODERN AI</Animated.Text>

        <Animated.View style={[styles.brandRow, reveal(logo, 18)]}>
          <Text style={[styles.brand, { fontSize: Math.min(50, width * 0.12) }]}>Vedic</Text>
          <Text style={[styles.brandGoldText, { fontSize: Math.min(50, width * 0.12) }]}>Scan</Text>
        </Animated.View>

        <Animated.Text style={[styles.subtitle, reveal(subtitle, 15)]}>
          Your personal AI astrologer, powered by authentic Vedic scriptures and planetary science.
        </Animated.Text>

        <Animated.View style={[styles.actions, reveal(actions, 30)]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.buttonHalo,
              {
                opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.46] }),
                transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.035] }) }],
              },
            ]}
          />
          <Pressable onPress={() => navigation.navigate('Signup')} style={({ pressed }) => [styles.primaryPressable, pressed && styles.pressed]}>
            <LinearGradient colors={['#F3C15E', '#D9911E', '#B76A0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButton}>
              <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0)']} style={styles.reflection} />
              <Text style={styles.om}>ॐ</Text>
              <Text style={styles.primaryLabel}>Begin Your Journey</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Login')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryLabel}>Sign In</Text>
          </Pressable>
          <Animated.View style={[styles.bottomOrnament, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.48, 0.82] }) }]}>
            <View style={styles.ornamentLineSmall} />
            <LotusMark small />
            <View style={styles.ornamentLineSmall} />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F1E5', overflow: 'hidden' },
  templeGlow: { position: 'absolute', left: '-20%', top: '31%', backgroundColor: '#FFD980' },
  zodiacTrace: { position: 'absolute', right: '-22%', top: '8%', borderWidth: 1, borderColor: 'rgba(184,126,35,0.17)' },
  zodiacMarker: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(211,158,59,0.55)', top: -4, left: '50%' },
  particle: {
    position: 'absolute',
    backgroundColor: '#F1C76B',
    shadowColor: '#E1A93F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 2,
  },
  bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  content: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 26, alignItems: 'center' },
  lotusIntro: { height: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  ornamentLine: { width: 43, height: StyleSheet.hairlineWidth, marginHorizontal: 10, backgroundColor: 'rgba(190,132,36,0.48)' },
  lotusMark: { width: 28, height: 22, alignItems: 'center', justifyContent: 'flex-end' },
  lotusMarkSmall: { width: 22, height: 17 },
  lotusPetal: { position: 'absolute', bottom: 3, width: 10, height: 17, borderWidth: 1.2, borderColor: '#C98B24', borderRadius: 10, backgroundColor: 'transparent' },
  lotusPetalCenter: { transform: [{ rotate: '0deg' }] },
  lotusPetalLeft: { left: 3, bottom: 1, transform: [{ rotate: '-38deg' }] },
  lotusPetalRight: { right: 3, bottom: 1, transform: [{ rotate: '38deg' }] },
  lotusPetalSmall: { width: 8, height: 13, borderWidth: 1 },
  lotusBase: { width: 24, height: 8, borderBottomWidth: 1.2, borderColor: '#C98B24', borderRadius: 12 },
  lotusBaseSmall: { width: 19, height: 6, borderBottomWidth: 1 },
  tagline: { color: '#A96F18', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), fontSize: 10, fontWeight: '400', letterSpacing: 2.5, textAlign: 'center', marginBottom: 7 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  brand: { color: '#3D2B1F', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), fontWeight: '400', letterSpacing: -2.2, textShadowColor: 'rgba(255,255,255,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 7 },
  brandGoldText: { marginLeft: 2, color: '#C58A28', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), fontWeight: '400', letterSpacing: -2.2, textShadowColor: 'rgba(230,184,83,0.42)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 7 },
  subtitle: { maxWidth: 350, color: '#4C4741', fontSize: 14, fontWeight: '400', lineHeight: 21, textAlign: 'center', letterSpacing: 0.05, marginBottom: 18 },
  actions: { width: '100%', maxWidth: 430, alignItems: 'center' },
  buttonHalo: { position: 'absolute', top: -5, left: 6, right: 6, height: 62, borderRadius: 31, backgroundColor: '#E4A32D', ...Platform.select({ ios: { shadowColor: '#D99720', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 18 } }) },
  primaryPressable: { width: '100%', borderRadius: 29, overflow: 'hidden', elevation: 7 },
  primaryButton: { height: 57, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,244,205,0.7)', overflow: 'hidden' },
  reflection: { position: 'absolute', left: 18, right: 18, top: 3, height: '42%', borderRadius: 24 },
  om: { color: '#FFFFFF', fontSize: 19, fontWeight: '400', marginRight: 10, textShadowColor: 'rgba(89,48,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  primaryLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '400', letterSpacing: 0.3, textShadowColor: 'rgba(89,48,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  secondaryButton: { width: '100%', height: 51, marginTop: 11, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(176,121,31,0.55)', ...Platform.select({ ios: { shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, shadowRadius: 8 }, android: { elevation: 1 } }) },
  secondaryLabel: { color: '#49382A', fontSize: 15, fontWeight: '400', letterSpacing: 0.45 },
  bottomOrnament: { height: 22, flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  ornamentLineSmall: { width: 31, height: StyleSheet.hairlineWidth, marginHorizontal: 8, backgroundColor: 'rgba(190,132,36,0.42)' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});

export default SplashScreen;
