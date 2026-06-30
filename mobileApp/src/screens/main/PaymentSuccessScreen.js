import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { VedicCard } from '../../components/VedicCard';

const LOGO = require('../../../assets/logo.jpeg');
const BANNER = require('../../../assets/banner.png');

const { width } = Dimensions.get('window');

const PaymentSuccessScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <LinearGradient colors={C.heroGradient} style={styles.header}>
        <Image source={BANNER} style={styles.headerBannerOverlay} />
        <View style={styles.headerTopRow}>
           <Image source={LOGO} style={styles.headerLogo} />
        </View>
        <Text style={styles.omIcon}>🔱</Text>
        <Text style={styles.headerTitle}>Thank You!</Text>
        <Text style={styles.headerSub}>Your cosmic journey has been upgraded</Text>
      </LinearGradient>

      <View style={styles.content}>
        <VedicCard style={styles.card}>
          <View style={styles.successIconContainer}>
            <View style={styles.successCircle}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          </View>
          
          <Text style={styles.cardTitle}>Payment Successful</Text>
          <Text style={styles.cardDesc}>
            Your premium features are now active. Experience the full depth of Vedic wisdom with your new plan.
          </Text>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitTitle}>What's new for you:</Text>
            {[
              'Increased daily AI questions',
              'Detailed birth chart analysis',
              'Advanced Kundali matching',
              'Priority cosmic insights'
            ].map((benefit, i) => (
              <View key={i} style={styles.benefitRow}>
                <Text style={styles.benefitBullet}>✨</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Chat')}
          >
            <LinearGradient
              colors={['#D4760A', '#B8860B']}
              style={styles.gradBtn}
            >
              <Text style={styles.gradBtnText}>Start Premium Chat</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('HomeMain')}
          >
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </VedicCard>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  headerBannerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: 500, height: 500, resizeMode: 'cover', opacity: 0.8,
  },
  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 0,
    zIndex: 1,
  },
  headerLogo: {
    width: 38, height: 38, borderRadius: 8, resizeMode: 'contain',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  omIcon: { fontSize: 48, marginBottom: 10 },
  headerTitle: {
    fontSize: fontSize.h2,
    fontWeight: '800',
    color: C.white,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    marginTop: -30,
  },
  card: {
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.md,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: C.green + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.green,
  },
  checkText: {
    fontSize: 36,
    color: C.green,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: fontSize.h4,
    fontWeight: '700',
    color: C.text,
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: fontSize.md,
    color: C.textMid,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: 30,
  },
  benefitTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitBullet: {
    fontSize: 16,
    marginRight: 10,
  },
  benefitText: {
    fontSize: fontSize.md,
    color: C.textMid,
  },
  actionBtn: {
    width: '100%',
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 15,
  },
  gradBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  gradBtnText: {
    color: C.white,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: C.textMuted,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});

export default PaymentSuccessScreen;
