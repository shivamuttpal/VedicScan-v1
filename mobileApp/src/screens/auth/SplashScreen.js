import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize } from '../../theme';
import { SIGNS } from '../../data/signs';

const { width } = Dimensions.get('window');

const PLANETS = [
  { name: 'Surya', icon: '☀️', color: '#D4760A', radius: 70, duration: 4000, startOffset: 0 },
  { name: 'Chandra', icon: '🌙', color: '#FDF2F5', radius: 100, duration: 6000, startOffset: 45 },
  { name: 'Mangal', icon: '♂️', color: '#C0392B', radius: 130, duration: 5000, startOffset: 120 },
  { name: 'Budha', icon: '☿️', color: '#1A7D4E', radius: 150, duration: 7000, startOffset: 200 },
  { name: 'Guru', icon: '♃', color: '#B8860B', radius: 180, duration: 9000, startOffset: 80 },
  { name: 'Shukra', icon: '♀️', color: '#6C3FA0', radius: 210, duration: 8000, startOffset: 270 },
];

const Planet = ({ planet }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: planet.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: [`${planet.startOffset}deg`, `${planet.startOffset + 360}deg`],
  });

  return (
    <Animated.View style={[styles.orbitWrapper, { transform: [{ rotate }] }]}>
      <View style={[styles.planetContainer, { transform: [{ translateY: -planet.radius }] }]}>
        <View style={[styles.planetBall, { backgroundColor: planet.color }]}>
          <Text style={styles.planetIcon}>{planet.icon}</Text>
        </View>
        <Text style={styles.planetName}>{planet.name}</Text>
      </View>
    </Animated.View>
  );
};

const SplashScreen = ({ navigation }) => {
  return (
    <LinearGradient colors={C.authGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tagline}>ANCIENT WISDOM · MODERN AI</Text>
        <Text style={styles.brand}>
          Vedic<Text style={styles.brandAccent}>Scan</Text>
        </Text>
      </View>

      <View style={styles.solarsystem}>
        {/* Orbits */}
        {PLANETS.map((p, i) => (
          <View key={`orbit-${i}`} style={[styles.orbitCircle, { width: p.radius * 2, height: p.radius * 2, borderRadius: p.radius }]} />
        ))}
        
        {/* Center Om */}
        <View style={styles.omCenter}>
          <Text style={styles.omText}>ॐ</Text>
        </View>

        {/* Planets */}
        {PLANETS.map((p, i) => (
          <Planet key={`planet-${i}`} planet={p} />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.desc}>
          Your personal AI astrologer, powered by authentic Vedic scriptures and planetary science.
        </Text>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => navigation.navigate('Signup')}>
          <LinearGradient
            colors={['#D4760A', '#7B1A38']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            <Text style={styles.btnIcon}>🔱</Text>
            <Text style={styles.primaryBtnText}>Begin Your Journey</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.secondaryBtnText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.zodiacRow}>
          {SIGNS.map((s, i) => (
            <View key={i} style={styles.zodiacIcon}>
              <Text style={styles.zodiacText}>{s.sym}</Text>
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  header: { alignItems: 'center', marginTop: 20 },
  tagline: { fontSize: fontSize.sm, color: C.goldBorder, letterSpacing: 2, marginBottom: 8, fontWeight: '600' },
  brand: { fontSize: 42, fontWeight: '800', color: C.white },
  brandAccent: { color: C.saffron },
  solarsystem: { width: 300, height: 300, justifyContent: 'center', alignItems: 'center', marginTop: -20 },
  orbitCircle: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  omCenter: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(184, 134, 11, 0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(184, 134, 11, 0.4)' },
  omText: { fontSize: 32, color: C.goldBorder },
  orbitWrapper: { position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  planetContainer: { position: 'absolute', alignItems: 'center' },
  planetBall: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.5, shadowRadius: 3, elevation: 4 },
  planetIcon: { fontSize: 14 },
  planetName: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: '500' },
  footer: { width: '100%', paddingHorizontal: spacing.lg, alignItems: 'center' },
  desc: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
  actionBtn: { width: '100%', borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden' },
  gradientBtn: { flexDirection: 'row', paddingVertical: 16, justifyContent: 'center', alignItems: 'center' },
  btnIcon: { fontSize: 20, marginRight: 8, color: C.white },
  primaryBtnText: { color: C.white, fontSize: fontSize.lg, fontWeight: '700' },
  secondaryBtn: { width: '100%', paddingVertical: 16, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', marginBottom: spacing.xl },
  secondaryBtnText: { color: C.goldBorder, fontSize: fontSize.lg, fontWeight: '600' },
  zodiacRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 6 },
  zodiacIcon: { width: 24, height: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  zodiacText: { fontSize: 12, color: C.goldBorder },
});

export default SplashScreen;
