import React, { memo, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DRAWER_BG = require('../../../assets/navigation/drawer-celestial-bg.png');
const LOGO = require('../../../assets/logo.jpeg');

const PALETTE = {
  ivory: '#FAF7F2',
  warmWhite: '#FFFDF9',
  beige: '#F5EFE5',
  pearl: '#F9F6F0',
  gold: '#D4AF37',
  rose: '#F8ECEA',
  espresso: '#35281D',
  burgundy: '#86113F',
  muted: '#8C7F72',
};

const Line = ({ style }) => <View style={[styles.glyphLine, style]} />;

/** Small, dependency-free line illustrations drawn entirely with React Native views. */
const NavigationGlyph = memo(({ type, color }) => {
  if (type === 'heart') return <View style={styles.glyphCanvas}><View style={[styles.heartHalf, styles.heartLeft, { borderColor: color }]} /><View style={[styles.heartHalf, styles.heartRight, { borderColor: color }]} /><View style={[styles.heartPoint, { borderColor: color }]} /></View>;
  if (type === 'scroll') return <View style={styles.glyphCanvas}><View style={[styles.scrollPaper, { borderColor: color }]}><Line style={{ backgroundColor: color, top: 7, left: 5, width: 12 }} /><Line style={{ backgroundColor: color, top: 12, left: 5, width: 9 }} /></View><Line style={[styles.scrollCap, { backgroundColor: color, top: 3 }]} /><Line style={[styles.scrollCap, { backgroundColor: color, bottom: 3 }]} /></View>;
  if (type === 'baby') return <View style={styles.glyphCanvas}><View style={[styles.babyHead, { borderColor: color }]}><View style={[styles.babyEye, { backgroundColor: color, left: 6 }]} /><View style={[styles.babyEye, { backgroundColor: color, right: 6 }]} /><View style={[styles.babySmile, { borderColor: color }]} /></View><View style={[styles.babyCurl, { borderColor: color }]} /></View>;
  if (type === 'chat') return <View style={styles.glyphCanvas}><View style={[styles.chatBubble, { borderColor: color }]}><View style={styles.chatDots}>{[0, 1, 2].map((dot) => <View key={dot} style={[styles.chatDot, { backgroundColor: color }]} />)}</View></View><View style={[styles.chatTail, { borderColor: color }]} /><View style={[styles.spark, { backgroundColor: color }]} /></View>;
  if (type === 'crown') return <View style={styles.glyphCanvas}><View style={styles.crownPoints}><Line style={[styles.crownStroke, styles.crownLeft, { backgroundColor: color }]} /><Line style={[styles.crownStroke, styles.crownMidLeft, { backgroundColor: color }]} /><Line style={[styles.crownStroke, styles.crownMidRight, { backgroundColor: color }]} /><Line style={[styles.crownStroke, styles.crownRight, { backgroundColor: color }]} /></View><View style={[styles.crownBase, { borderColor: color }]} /></View>;
  if (type === 'card') return <View style={styles.glyphCanvas}><View style={[styles.memberCard, { borderColor: color }]}><View style={[styles.cardStripe, { backgroundColor: color }]} /><View style={[styles.cardChip, { borderColor: color }]} /><Line style={{ backgroundColor: color, width: 7, right: 4, bottom: 5 }} /></View></View>;
  if (type === 'profile') return <View style={styles.glyphCanvas}><View style={[styles.profileHead, { borderColor: color }]} /><View style={[styles.profileShoulders, { borderColor: color }]} /></View>;
  if (type === 'logout') return <View style={styles.glyphCanvas}><View style={[styles.logoutDoor, { borderColor: color }]} /><Line style={{ backgroundColor: color, width: 13, right: 2, top: 13 }} /><Line style={[styles.logoutArrow, { backgroundColor: color, transform: [{ rotate: '45deg' }] }]} /><Line style={[styles.logoutArrow, { backgroundColor: color, transform: [{ rotate: '-45deg' }], top: 16 }]} /></View>;
  return null;
});

const CloseMark = () => <View style={styles.closeMark}><Line style={[styles.closeLine, { transform: [{ rotate: '45deg' }] }]} /><Line style={[styles.closeLine, { transform: [{ rotate: '-45deg' }] }]} /></View>;

const SectionHeading = ({ children }) => <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{children}</Text><View style={styles.sectionStar} /><View style={styles.sectionRule} /></View>;

const DrawerItem = memo(({ item, label, onPress }) => {
  const pressScale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(pressScale, { toValue: 0.975, speed: 30, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(pressScale, { toValue: 1, speed: 24, bounciness: 6, useNativeDriver: true }).start();

  return <Animated.View style={{ transform: [{ scale: pressScale }] }}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onPress(item.route)}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    >
      <LinearGradient colors={item.iconGradient} style={styles.iconTile}>
        <NavigationGlyph type={item.glyph} color={item.color} />
      </LinearGradient>
      <Text style={styles.menuLabel} numberOfLines={1}>{label}</Text>
      {item.badge ? <LinearGradient colors={['#9D174D', '#6E0D35']} style={styles.proBadge}><Text style={styles.proText}>{item.badge}</Text></LinearGradient> : null}
      <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.chevron}>›</Text>
    </Pressable>
  </Animated.View>;
});

const PremiumCard = () => <View>
  <LinearGradient colors={['rgba(255,253,249,0.98)', 'rgba(249,238,213,0.95)']} style={styles.premiumCard}>
    <View style={styles.crownHalo}><NavigationGlyph type="crown" color="#B8860B" /></View>
    <View style={styles.premiumCopy}><Text style={styles.premiumCardTitle}>Vedic wisdom. AI guidance.</Text><Text style={styles.premiumCardSubtitle}>Your cosmic journey, elevated.</Text></View>
    <View style={styles.sparkleCluster}><Text style={styles.sparkleLarge}>✦</Text><Text style={styles.sparkleSmall}>✧</Text></View>
  </LinearGradient>
</View>;

const PremiumDrawer = ({ visible, user, profileName, t, onNavigate, onClose, onClosed, onLogout }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const panelWidth = Math.min(width * 0.88, 430);
  const panelX = useRef(new Animated.Value(-panelWidth - 20)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const closeSpin = useRef(new Animated.Value(0)).current;

  const sections = useMemo(() => [
    { title: t('drawerFeatures'), items: [
      { glyph: 'heart', labelKey: 'drawerKundaliMatching', route: 'CompatibilityTab', color: '#8B1746', iconGradient: ['#FBEDEF', '#F5DCE3'] },
      { glyph: 'scroll', labelKey: 'drawerKundaliGenerate', route: 'KundaliTab', color: '#7B2C8F', iconGradient: ['#F7EDFF', '#EBD7F8'] },
      { glyph: 'baby', labelKey: 'drawerBabyNaming', route: 'BabyNaming', color: '#08786D', iconGradient: ['#EBFCF8', '#D4F3EC'] },
      { glyph: 'chat', labelKey: 'drawerAskMaharishi', route: 'Chat', color: '#8B1746', iconGradient: ['#FBEDEF', '#F4DDE4'] },
    ] },
    { title: t('drawerAccount'), items: [
      { glyph: 'crown', labelKey: 'drawerUnlockPremium', route: 'Pricing', color: '#A87904', iconGradient: ['#FFF9E8', '#FFEDB9'], badge: 'PRO' },
      { glyph: 'card', labelKey: 'drawerMySubscription', route: 'Subscription', color: '#1769AA', iconGradient: ['#F0F7FF', '#DAEAFB'] },
      { glyph: 'profile', labelKey: 'drawerProfileSettings', route: 'ProfileTab', color: '#8B1746', iconGradient: ['#FCF8F2', '#EEE7DF'] },
    ] },
  ], [t]);

  useEffect(() => {
    if (!visible) return;
    panelX.setValue(-panelWidth - 20);
    backdrop.setValue(0);
    closeSpin.setValue(0);
    Animated.parallel([
      Animated.spring(panelX, { toValue: 0, damping: 18, stiffness: 150, mass: 0.9, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [visible, panelWidth, panelX, backdrop, closeSpin]);

  const dismiss = () => {
    onClose?.();
    Animated.parallel([
      Animated.timing(panelX, { toValue: -panelWidth - 20, duration: 245, useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 210, useNativeDriver: true }),
      Animated.timing(closeSpin, { toValue: 1, duration: 230, useNativeDriver: true }),
    ]).start(() => onClosed?.());
  };

  const navigate = (route) => {
    dismiss();
    setTimeout(() => onNavigate(route), 260);
  };

  const displayName = profileName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || t('vedicMember');

  return <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
    <View style={styles.modalRoot}>
      <Animated.View pointerEvents="none" style={[styles.backdrop, { opacity: backdrop }]} />
      <Pressable accessibilityLabel="Close navigation menu" onPress={dismiss} style={StyleSheet.absoluteFill} />
      <Animated.View accessibilityViewIsModal style={[styles.panelShadow, { width: panelWidth, transform: [{ translateX: panelX }] }]}>
        <ImageBackground source={DRAWER_BG} resizeMode="cover" imageStyle={styles.backgroundImage} style={styles.panel}>
          <View style={[styles.profileArea, { paddingTop: insets.top + 24 }]}>
            <View style={styles.avatarOuter}><View style={styles.avatarInner}><Image source={LOGO} style={styles.avatarImage} /></View></View>
            <View style={styles.profileText}><Text style={styles.profileName} numberOfLines={1}>{displayName}</Text><Text style={styles.profileEmail} numberOfLines={1}>{user?.email || t('vedicMember')}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close navigation menu" hitSlop={8} onPress={dismiss} style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}>
              <Animated.View style={{ transform: [{ rotate: closeSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }] }}><CloseMark /></Animated.View>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 14) + 18 }]}>
            <View style={styles.menuSurface}>
              {sections.map((section) => <View key={section.title} style={styles.section}>
                <SectionHeading>{section.title}</SectionHeading>
                {section.items.map((item) => <DrawerItem key={item.route + item.labelKey} item={item} label={t(item.labelKey)} onPress={navigate} />)}
              </View>)}
            </View>
            <View style={styles.bottomActions}>
              <PremiumCard />
              <View>
                <Pressable accessibilityRole="button" accessibilityLabel={t('drawerLogout')} onPress={onLogout} style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}>
                  <NavigationGlyph type="logout" color="#8B1746" /><Text style={styles.logoutText}>{t('drawerLogout')}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </ImageBackground>
      </Animated.View>
    </View>
  </Modal>;
};

export default memo(PremiumDrawer);

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(53,40,29,0.42)' },
  panelShadow: { position: 'absolute', left: 0, top: 0, bottom: 0, shadowColor: '#35281D', shadowOffset: { width: 10, height: 2 }, shadowOpacity: 0.24, shadowRadius: 26, elevation: 30 },
  panel: { flex: 1, overflow: 'hidden', borderTopRightRadius: 32, borderBottomRightRadius: 32, backgroundColor: PALETTE.ivory, borderRightWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  backgroundImage: { opacity: 0.3, borderTopRightRadius: 32, borderBottomRightRadius: 32 },
  profileArea: { minHeight: 158, paddingHorizontal: 24, paddingBottom: 24, flexDirection: 'row', alignItems: 'center' },
  avatarOuter: { width: 70, height: 70, borderRadius: 35, padding: 4, backgroundColor: '#FFFDF9', borderWidth: 1.5, borderColor: '#E5C96F', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  avatarInner: { flex: 1, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: '#F2E1B4', backgroundColor: '#FFF8E9' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  profileText: { flex: 1, paddingLeft: 15, paddingRight: 8 },
  profileName: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 23, lineHeight: 29, color: PALETTE.espresso, fontWeight: '600' },
  profileEmail: { marginTop: 4, fontSize: 12.5, color: PALETTE.muted, fontWeight: '400' },
  closeButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.78)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.17)', shadowColor: '#6B5640', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 11, elevation: 4 },
  closePressed: { transform: [{ scale: 0.94 }], backgroundColor: '#FFF8E9' },
  closeMark: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  closeLine: { position: 'absolute', width: 20, height: 2, borderRadius: 2, backgroundColor: '#B18620' },
  scrollContent: { flexGrow: 1 },
  menuSurface: { marginTop: 0, paddingTop: 7, paddingBottom: 18, backgroundColor: 'rgba(255,253,249,0.79)', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderTopWidth: 1, borderColor: 'rgba(212,175,55,0.12)' },
  section: { paddingTop: 20, paddingHorizontal: 20 },
  sectionHeading: { height: 28, flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  sectionTitle: { color: '#A77A16', fontSize: 11, fontWeight: '700', letterSpacing: 1.25, textTransform: 'uppercase' },
  sectionStar: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#E4C675', marginLeft: 12, marginRight: 7 },
  sectionRule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(212,175,55,0.34)' },
  menuItem: { minHeight: 67, flexDirection: 'row', alignItems: 'center', borderRadius: 19, paddingHorizontal: 10, marginVertical: 2, borderWidth: 1, borderColor: 'transparent' },
  menuItemPressed: { backgroundColor: 'rgba(255,249,235,0.96)', borderColor: 'rgba(212,175,55,0.25)', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 3 },
  iconTile: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  menuLabel: { flex: 1, fontSize: 15.5, color: PALETTE.espresso, fontWeight: '500' },
  chevron: { marginLeft: 7, color: '#C7B9AA', fontSize: 31, lineHeight: 32, fontWeight: '200' },
  proBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,224,144,0.34)' },
  proText: { color: '#FFF0C1', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  bottomActions: { marginTop: 'auto', paddingHorizontal: 20, paddingTop: 21, gap: 13 },
  premiumCard: { minHeight: 96, borderRadius: 22, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.22)', shadowColor: '#9A6E18', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  crownHalo: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,248,224,0.92)', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  premiumCopy: { flex: 1 },
  premiumCardTitle: { fontSize: 13.5, color: PALETTE.espresso, fontWeight: '700', marginBottom: 4 },
  premiumCardSubtitle: { fontSize: 11.5, color: PALETTE.muted },
  sparkleCluster: { width: 26, alignItems: 'center' },
  sparkleLarge: { color: '#E2BD50', fontSize: 19 },
  sparkleSmall: { color: '#E8CF83', fontSize: 13, marginTop: -2, marginLeft: 12 },
  logoutButton: { height: 58, borderRadius: 21, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,253,249,0.86)', borderWidth: 1, borderColor: '#E9DDD0', gap: 10 },
  logoutPressed: { transform: [{ scale: 0.985 }], backgroundColor: '#FFF8F6' },
  logoutText: { color: '#7B1739', fontSize: 15, fontWeight: '600' },
  glyphCanvas: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  glyphLine: { position: 'absolute', height: 1.8, borderRadius: 2 },
  heartHalf: { position: 'absolute', width: 13, height: 18, top: 3, borderWidth: 1.8, borderBottomWidth: 0, borderRadius: 9 },
  heartLeft: { left: 4, transform: [{ rotate: '-42deg' }] }, heartRight: { right: 4, transform: [{ rotate: '42deg' }] },
  heartPoint: { position: 'absolute', width: 14, height: 14, bottom: 3, borderLeftWidth: 1.8, borderBottomWidth: 1.8, transform: [{ rotate: '-45deg' }] },
  scrollPaper: { width: 21, height: 22, borderWidth: 1.7, borderRadius: 3 }, scrollCap: { width: 25, height: 2, borderRadius: 2 },
  babyHead: { width: 23, height: 22, borderRadius: 12, borderWidth: 1.7, marginTop: 3 }, babyEye: { position: 'absolute', top: 8, width: 2, height: 2, borderRadius: 1 }, babySmile: { position: 'absolute', left: 7, top: 11, width: 7, height: 5, borderBottomWidth: 1.4, borderRadius: 5 }, babyCurl: { position: 'absolute', top: 0, width: 8, height: 7, borderTopWidth: 1.5, borderRightWidth: 1.5, borderRadius: 6, transform: [{ rotate: '-20deg' }] },
  chatBubble: { width: 24, height: 19, borderRadius: 8, borderWidth: 1.7 }, chatDots: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }, chatDot: { width: 2.5, height: 2.5, borderRadius: 2 }, chatTail: { position: 'absolute', left: 4, bottom: 2, width: 7, height: 7, borderLeftWidth: 1.7, transform: [{ rotate: '-28deg' }] }, spark: { position: 'absolute', right: 0, top: 0, width: 3, height: 3, borderRadius: 2 },
  crownPoints: { position: 'absolute', width: 24, height: 16, top: 4 }, crownStroke: { width: 14, height: 1.7, top: 8 }, crownLeft: { left: -1, transform: [{ rotate: '58deg' }] }, crownMidLeft: { left: 5, transform: [{ rotate: '-62deg' }] }, crownMidRight: { right: 5, transform: [{ rotate: '62deg' }] }, crownRight: { right: -1, transform: [{ rotate: '-58deg' }] }, crownBase: { position: 'absolute', bottom: 4, width: 24, height: 7, borderWidth: 1.7, borderTopWidth: 0, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  memberCard: { width: 26, height: 19, borderRadius: 4, borderWidth: 1.7, overflow: 'hidden' }, cardStripe: { width: '100%', height: 3, marginTop: 4 }, cardChip: { position: 'absolute', left: 4, bottom: 4, width: 6, height: 5, borderRadius: 1, borderWidth: 1.2 },
  profileHead: { position: 'absolute', top: 3, width: 9, height: 9, borderRadius: 5, borderWidth: 1.7 }, profileShoulders: { position: 'absolute', bottom: 3, width: 23, height: 12, borderWidth: 1.7, borderBottomWidth: 0, borderTopLeftRadius: 13, borderTopRightRadius: 13 },
  logoutDoor: { position: 'absolute', left: 3, top: 3, width: 13, height: 22, borderWidth: 1.7, borderRightWidth: 0, borderRadius: 2 }, logoutArrow: { width: 7, right: 1, top: 10 },
});
