import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, Animated, Alert,
  Image, Keyboard, Modal, ScrollView, Dimensions, ActivityIndicator,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, fontSize } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../config/api';
import { getSampleQuestions } from '../../data/signs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Assets ────────────────────────────────────────────────────────────────────
const REVA_CHAR     = require('../../../assets/RevaCharImg.png');
const REVA_VIDEO    = require('../../../assets/RevaAI.mp4');
const MUKTI_CHAR    = require('../../../assets/MukticharImg.png');
const MUKTI_VIDEO   = require('../../../assets/MuktiAI.mp4');
const MAHA_CHAR     = require('../../../assets/MaharishiCharImg.png');
const MAHA_VIDEO    = require('../../../assets/MaharishiAI.mp4');

const SW = Dimensions.get('window').width;
const SH = Dimensions.get('window').height;
const ANDROID_TAB = 90;
const IOS_TAB     = 65;

// Guide carousel sizing
const CARD_W       = SW * 0.82;
const CARD_SPACING = 14;
const CARD_SNAP    = CARD_W + CARD_SPACING;
const CARD_H       = Math.min(SH * 0.7, 560);   // increased to show full image
const SIDE_PAD     = (SW - CARD_W) / 2;

// ── Astrologer data ───────────────────────────────────────────────────────────
const ASTROLOGERS = [
  {
    id: 'maharishi',
    name: 'Maharishi',
    nameHi: 'महर्षि',
    title: 'Vedic Sage',
    titleHi: 'वैदिक ऋषि',
    specialty: 'Career & Life Purpose',
    specialtyHi: 'करियर एवं जीवन-उद्देश्य',
    rating: 4.9,
    reviews: '12.4k',
    charImage: MAHA_CHAR,
    videoSource: MAHA_VIDEO,
    bio: 'A seasoned Vedic sage who reads your dashas and planetary periods to illuminate your career, purpose, and the timing of your biggest decisions.',
    bioHi: 'एक अनुभवी वैदिक ऋषि जो आपकी दशाओं एवं ग्रह-कालों को पढ़कर आपके करियर, उद्देश्य एवं आपके सबसे बड़े निर्णयों के सही समय को प्रकाशित करते हैं।',
    greeting: 'Namaste 🙏 I am Maharishi, your Vedic sage. The cosmic energies are beautifully aligned today.\n\nYour birth chart carries profound secrets about your life\'s purpose.\n\nWhat aspect of your journey shall we illuminate?',
    greetingHi: 'नमस्ते 🙏 मैं महर्षि हूँ, आपका वैदिक ऋषि। आज ब्रह्मांडीय ऊर्जाएँ सुंदर रूप से संरेखित हैं।\n\nआपकी जन्म कुंडली आपके जीवन-उद्देश्य के गहन रहस्य समेटे हुए है।\n\nआपकी यात्रा के किस पहलू को हम प्रकाशित करें?',
  },
  {
    id: 'reva',
    name: 'Reva',
    nameHi: 'रेवा',
    title: 'Wellness Guide',
    titleHi: 'स्वास्थ्य मार्गदर्शक',
    specialty: 'Health & Wellbeing',
    specialtyHi: 'स्वास्थ्य एवं कल्याण',
    rating: 4.8,
    reviews: '9.1k',
    charImage: REVA_CHAR,
    videoSource: REVA_VIDEO,
    bio: 'A gentle wellness guide who maps your chart to your body, mind, and vitality — helping you understand your healing journey and when to rest or rebuild.',
    bioHi: 'एक सौम्य स्वास्थ्य मार्गदर्शक जो आपकी कुंडली को आपके शरीर, मन एवं जीवन-शक्ति से जोड़ती हैं — आपकी आरोग्य-यात्रा एवं कब विश्राम या पुनर्निर्माण करना है, यह समझने में सहायता करती हैं।',
    greeting: 'Namaste 🙏 I am Reva, your guide for health and wellbeing. The planets hold deep wisdom about your body, mind, and vitality.\n\nYour birth chart is a map of your healing journey.\n\nWhat would you like to understand about your health or wellbeing today?',
    greetingHi: 'नमस्ते 🙏 मैं रेवा हूँ, आपके स्वास्थ्य एवं कल्याण की मार्गदर्शक। ग्रह आपके शरीर, मन एवं जीवन-शक्ति के विषय में गहन ज्ञान समेटे हैं।\n\nआपकी जन्म कुंडली आपकी आरोग्य-यात्रा का मानचित्र है।\n\nआज आप अपने स्वास्थ्य या कल्याण के विषय में क्या समझना चाहेंगे?',
  },
  {
    id: 'mukti',
    name: 'Mukti',
    nameHi: 'मुक्ति',
    title: 'Relationship Expert',
    titleHi: 'संबंध विशेषज्ञ',
    specialty: 'Love & Relationships',
    specialtyHi: 'प्रेम एवं संबंध',
    rating: 4.7,
    reviews: '7.3k',
    charImage: MUKTI_CHAR,
    videoSource: MUKTI_VIDEO,
    bio: 'A warm relationship expert who reads the houses of love and marriage in your chart to guide your connections, compatibility, and the timing of the heart.',
    bioHi: 'एक स्नेहमयी संबंध विशेषज्ञ जो आपकी कुंडली में प्रेम एवं विवाह के भावों को पढ़कर आपके संबंधों, अनुकूलता एवं हृदय के सही समय का मार्गदर्शन करती हैं।',
    greeting: 'Namaste 💫 I am Mukti, your guide for love and relationships. The stars have much to reveal about your heart and connections.\n\nEvery bond in your life is written in the cosmos.\n\nWhat matters of the heart shall we explore together?',
    greetingHi: 'नमस्ते 💫 मैं मुक्ति हूँ, आपके प्रेम एवं संबंधों की मार्गदर्शक। तारे आपके हृदय एवं संबंधों के विषय में बहुत कुछ प्रकट करने वाले हैं।\n\nआपके जीवन का हर बंधन ब्रह्मांड में लिखा है।\n\nहृदय के किन विषयों को हम साथ मिलकर खोजें?',
  },
];

// ── sanitize ──────────────────────────────────────────────────────────────────
// Strips OpenAI Assistants citation artifacts (e.g. 【8:4†source】) that may
// remain in older cached messages. New responses are already cleaned server-side.
const sanitize = (text = '') =>
  String(text)
    .replace(/【[^】]*】/g, '')
    .replace(/\[\d+:\d+[†:][^\]]*\]/g, '')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/ {2,}/g, ' ')
    .trim();

// ── ShimmerLoader ───────────────────────────────────────────────────────────────
// A soft skeleton with a moving highlight — replaces the typing dots so the very
// first message render doesn't flash/glitch.
const ShimmerBar = ({ width, translateX }) => (
  <View style={[shS.bar, { width }]}>
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.85)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  </View>
);

const ShimmerLoader = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1100, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-160, 160] });
  return (
    <View style={shS.wrap}>
      <ShimmerBar width="92%" translateX={translateX} />
      <ShimmerBar width="78%" translateX={translateX} />
      <ShimmerBar width="55%" translateX={translateX} />
    </View>
  );
};

const shS = StyleSheet.create({
  wrap: { width: SW * 0.5, paddingVertical: 3 },
  bar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ECE6DC',
    overflow: 'hidden',
    marginVertical: 4,
  },
});

// ── VideoBubble ───────────────────────────────────────────────────────────────
const VideoBubble = ({ source, poster }) => {
  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.muted = false;
  });
  const [playing, setPlaying] = useState(false);
  const endedRef = useRef(false);

  // Sync state when playback naturally ends (no loop)
  useEffect(() => {
    const sub = player.addListener('playingChange', ({ isPlaying }) => {
      setPlaying(isPlaying);
    });
    return () => sub.remove();
  }, [player]);

  // expo-video leaves position at the end after playback finishes — track
  // this so a tap after the video ends replays from the start instead of
  // silently doing nothing.
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      endedRef.current = true;
    });
    return () => sub.remove();
  }, [player]);

  const toggle = () => {
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      if (endedRef.current) {
        player.replay();
        endedRef.current = false;
      } else {
        player.play();
      }
      setPlaying(true);
    }
  };

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.95} style={vS.wrap}>
      <VideoView
        player={player}
        style={vS.video}
        nativeControls={false}
        contentFit="cover"
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
      {!playing && (
        <View style={vS.overlay} pointerEvents="none">
          {poster && <Image source={poster} style={vS.poster} />}
          <View style={vS.playCircle}>
            <Text style={vS.playIcon}>▶</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const vS = StyleSheet.create({
  wrap: {
    width: SW * 0.6,
    height: SW * 0.6 * 1.3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  video: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  poster: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'cover' },
  playCircle: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center', alignItems: 'center',
    elevation: 4,
  },
  playIcon: { fontSize: 20, color: '#111', marginLeft: 3 },
});

// ── StarRating ────────────────────────────────────────────────────────────────
const Stars = ({ rating }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Text key={i} style={{ fontSize: 13, color: i < Math.floor(rating) ? '#F59E0B' : '#D1D5DB' }}>
        {i < Math.floor(rating) ? '★' : '☆'}
      </Text>
    ))}
  </View>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtTime = (id) => new Date(id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const splitBubbles = (text, baseId, astrologerId) => {
  const parts = sanitize(text).split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1)
    return [{ role: 'assistant', content: text, id: baseId, astrologerId, isLastInGroup: true }];
  return parts.map((p, i) => ({
    role: 'assistant',
    content: p,
    id: baseId + i,
    astrologerId,
    blockGroup: baseId,
    isLastInGroup: i === parts.length - 1,
  }));
};

// ── ChatScreen ────────────────────────────────────────────────────────────────
const ChatScreen = ({ navigation }) => {
  const { hasProfile, userId } = useAuth();
  const { language, t } = useLanguage();
  // Guide field accessor — returns the Hindi variant when the app is in Hindi.
  const gv = (guide, field) => (language === 'hi' ? (guide?.[`${field}Hi`] || guide?.[field]) : guide?.[field]) || '';
  const sampleQuestions = getSampleQuestions(language);
  const [messages, setMessages]                 = useState([]);
  const [inputText, setInputText]               = useState('');
  const [loading, setLoading]                   = useState(false);
  const [profiles, setProfiles]                 = useState([]);
  const [selectedProfile, setSelectedProfile]   = useState(null);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [kbVisible, setKbVisible]               = useState(false);
  const [kbHeight, setKbHeight]                 = useState(0);
  const [conversationId, setConversationId]     = useState(null);
  const [astrologer, setAstrologer]             = useState(null);
  const [showSelector, setShowSelector]         = useState(false);
  const [showScrollBtn, setShowScrollBtn]       = useState(false);
  const [guideIndex, setGuideIndex]             = useState(0);
  const [loadedPortraits, setLoadedPortraits]   = useState({});
  const [limitShownToday, setLimitShownToday]   = useState(false);

  const markPortraitLoaded = (id) =>
    setLoadedPortraits((prev) => (prev[id] ? prev : { ...prev, [id]: true }));

  const flatRef      = useRef(null);
  const carouselRef  = useRef(null);
  const insets       = useSafeAreaInsets();
  const astrologerRef = useRef(null); // shadow ref for use inside async callbacks

  // Cache keys scoped to user ID — prevents cross-account data leakage
  const histKey  = (aid) => `vedicScanChat_${userId}_${aid || 'default'}`;
  const convKey  = (aid) => `vedicScanConv_${userId}_${aid || 'default'}`;
  const limitKey = () => `vedicScanLimitDate_${userId}`;

  // Check if upgrade limit message was already shown today
  const wasLimitShownToday = async () => {
    try {
      const stored = await AsyncStorage.getItem(limitKey());
      if (!stored) return false;
      const storedDate = new Date(stored).toDateString();
      const today = new Date().toDateString();
      return storedDate === today;
    } catch {
      return false;
    }
  };

  // Mark that we've shown the limit message today
  const markLimitShownToday = async () => {
    try {
      await AsyncStorage.setItem(limitKey(), new Date().toISOString());
      setLimitShownToday(true);
    } catch {}
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasProfile) { navigation.navigate('ProfileTab'); return; }
    fetchProfiles();
    loadHistory();
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => { setKbVisible(true); if (Platform.OS === 'android') setKbHeight(e.endCoordinates.height); }
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => { setKbVisible(false); if (Platform.OS === 'android') setKbHeight(0); }
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Refetch profiles when screen comes into focus — keeps the list in sync after deletions
  useFocusEffect(
    useCallback(() => {
      fetchProfiles();
    }, [])
  );

  const fetchProfiles = async () => {
    try {
      const res = await api.get('/api/profiles');
      const profs = res.data || [];
      setProfiles(profs);
      if (!profs.length) return;

      // Restore previously chosen profile, else use the default, else use first
      const savedId = await AsyncStorage.getItem(`vedicScanProfileId_${userId}`);
      const restored = savedId ? profs.find(p => (p._id || p.id) === savedId) : null;
      const auto     = restored || profs.find(p => p.isDefault) || profs[0];
      setSelectedProfile(auto);
    } catch {}
  };

  const loadHistory = async () => {
    try {
      const savedAId = await AsyncStorage.getItem(`vedicScanAstrologer_${userId}`);
      if (savedAId) {
        const found = ASTROLOGERS.find((x) => x.id === savedAId);
        if (found) {
          astrologerRef.current = found;
          setAstrologer(found);
          await loadHistoryForAstrologer(savedAId);
          return;
        }
      }
      setShowSelector(true);
    } catch {
      setShowSelector(true);
    }
  };

  const saveHistory = async (msgs, cId, aid) => {
    const id = aid ?? astrologerRef.current?.id;
    try {
      await AsyncStorage.setItem(histKey(id), JSON.stringify(msgs));
      await AsyncStorage.setItem(convKey(id), cId || '');
    } catch {}
  };

  const loadHistoryForAstrologer = async (aid) => {
    try {
      const [saved, savedId] = await Promise.all([
        AsyncStorage.getItem(histKey(aid)),
        AsyncStorage.getItem(convKey(aid)),
      ]);
      if (saved) {
        setMessages(JSON.parse(saved));
        setConversationId(savedId || null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // ── Select astrologer ─────────────────────────────────────────────────────
  const handleSelect = async (selected) => {
    setShowSelector(false);

    // Persist current astrologer's history before switching
    if (astrologerRef.current && messages.length > 0) {
      await saveHistory(messages, conversationId, astrologerRef.current.id);
    }

    // Update state and ref
    astrologerRef.current = selected;
    setAstrologer(selected);
    setConversationId(null);
    await AsyncStorage.setItem(`vedicScanAstrologer_${userId}`, selected.id);

    // Try to restore previous conversation for this astrologer
    const hadHistory = await loadHistoryForAstrologer(selected.id);
    if (hadHistory) return; // restored — no need for greeting

    // Fresh start — clear and show greeting
    setMessages([]);

    const baseId = Date.now();
    // First: video message
    const videoMsg = {
      role: 'assistant', type: 'video',
      id: baseId, astrologerId: selected.id,
      blockGroup: baseId, isLastInGroup: false,
    };
    // Then: staggered greeting text bubbles (localized)
    const greetParts = gv(selected, 'greeting').split(/\n\n+/).filter(Boolean);
    const greetBubbles = greetParts.map((p, i) => ({
      role: 'assistant', content: p,
      id: baseId + 1 + i, astrologerId: selected.id,
      blockGroup: baseId,
      isLastInGroup: i === greetParts.length - 1,
    }));

    let current = [videoMsg];
    setMessages([...current]);
    for (let i = 0; i < greetBubbles.length; i++) {
      await new Promise((r) => setTimeout(r, 650));
      current = [...current, greetBubbles[i]];
      setMessages([...current]);
    }
    saveHistory(current, null);
  };

  // Close the guide selector — return to chat if a guide is active,
  // otherwise step back to the previous screen.
  const closeSelector = () => {
    if (astrologerRef.current) { setShowSelector(false); return; }
    if (navigation?.canGoBack?.()) { navigation.goBack(); return; }
    setShowSelector(false);
  };

  const onGuideScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_SNAP);
    if (idx !== guideIndex) setGuideIndex(idx);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const userMsg = text || inputText.trim();
    if (!userMsg) return;
    setInputText('');

    // Auto-resolve profile — never block the user with an alert
    if (!selectedProfile && profiles.length > 0) {
      const auto = profiles.find(p => p.isDefault) || profiles[0];
      setSelectedProfile(auto);
      AsyncStorage.setItem(`vedicScanProfileId_${userId}`, auto._id || auto.id);
    }

    const newMsgs = [...messages, { role: 'user', content: userMsg, id: Date.now() }];
    setMessages(newMsgs);
    setLoading(true);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const payload = { message: userMsg, lang: language };
      if (conversationId) payload.conversationId = conversationId;
      if (astrologer) payload.astrologer = astrologer.id;
      if (selectedProfile) payload.profileId = selectedProfile._id || selectedProfile.id;

      const res = await api.post('/api/chat/message', payload);
      if (res.data) {
        const txt = res.data.response || res.data.reply || res.data.message || '...';
        const baseId = Date.now() + 1;
        const bubbles = splitBubbles(txt, baseId, astrologer?.id);
        let current = [...newMsgs];
        for (let i = 0; i < bubbles.length; i++) {
          if (i > 0) await new Promise((r) => setTimeout(r, 520));
          current = [...current, bubbles[i]];
          setMessages([...current]);
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
        }
        if (res.data.conversationId) setConversationId(res.data.conversationId);
        saveHistory(current, res.data.conversationId);
      }
    } catch (err) {
      const status  = err?.response?.status;
      const errMsg  = err?.response?.data?.message || '';
      const isQuota = status === 429 || status === 403 ||
                      /limit|quota|plan|subscri|upgrade/i.test(errMsg);

      let errBubble = null;

      if (isQuota) {
        // Only show upgrade prompt if we haven't shown it today
        const alreadyShownToday = await wasLimitShownToday();
        if (!alreadyShownToday) {
          errBubble = {
            role: 'assistant', type: 'upgrade',
            content: t('chatErrLimit'),
            id: Date.now() + 1, isLastInGroup: true,
          };
          await markLimitShownToday();
        } else {
          // Don't show upgrade bubble, just show generic error
          errBubble = {
            role: 'assistant',
            content: t('chatErrGeneric'),
            id: Date.now() + 1, isLastInGroup: true,
          };
        }
      } else {
        errBubble = {
          role: 'assistant',
          content: t('chatErrGeneric'),
          id: Date.now() + 1, isLastInGroup: true,
        };
      }

      const withErr = [...newMsgs, errBubble];
      setMessages(withErr);
      saveHistory(withErr, conversationId);
    } finally {
      setLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const clearChat = () => {
    Alert.alert(t('chatNewChatTitle'), t('chatNewChatMsg'), [
      { text: t('chatCancel'), style: 'cancel' },
      {
        text: t('chatClear'), style: 'destructive',
        onPress: async () => {
          const aid = astrologerRef.current?.id;
          setMessages([]); setConversationId(null); setAstrologer(null); setShowSelector(true);
          astrologerRef.current = null;
          const keysToRemove = [`vedicScanAstrologer_${userId}`];
          if (aid) { keysToRemove.push(histKey(aid)); keysToRemove.push(convKey(aid)); }
          await AsyncStorage.multiRemove(keysToRemove);
        },
      },
    ]);
  };

  // ── Get date label for messages ────────────────────────────────────────────────
  const getDateLabel = (id) => {
    const d = new Date(id);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (d.toDateString() === today) return 'Today';
    if (d.toDateString() === yesterday) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // ── Render message with date separator ────────────────────────────────────────────
  const renderMessage = ({ item, index }) => {
    const showDateSeparator = index === 0 || getDateLabel(messages[index - 1].id) !== getDateLabel(item.id);

    return (
      <View>
        {showDateSeparator && (
          <View style={{ alignItems: 'center', marginVertical: 16, marginTop: index === 0 ? 8 : 16 }}>
            <View style={{ backgroundColor: '#E8DFD2', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#5A4A42', letterSpacing: 0.3 }}>
                {getDateLabel(item.id)}
              </Text>
            </View>
          </View>
        )}
        {renderMessageBubble(item)}
      </View>
    );
  };

  // ── Render individual message bubble ────────────────────────────────────────────
  const renderMessageBubble = (item) => {
    const cur = astrologer || ASTROLOGERS[0];

    if (item.role === 'user') {
      return (
        <View style={[S.row, S.rowRight]}>
          <View style={S.userWrap}>
            <View style={S.userBubble}>
              <Text style={S.userTxt}>{item.content}</Text>
            </View>
            <Text style={S.timeRight}>{fmtTime(item.id)}</Text>
          </View>
        </View>
      );
    }

    // Upgrade CTA bubble
    if (item.type === 'upgrade') {
      return (
        <View style={[S.row, S.rowLeft, { paddingLeft: 44, marginBottom: 12 }]}>
          <View style={S.upgradeBubble}>
            <Text style={S.upgradeMsg}>{item.content}</Text>
            <TouchableOpacity
              style={S.upgradeBtn}
              onPress={() => navigation.navigate('Pricing')}
              activeOpacity={0.85}
            >
              <Text style={S.upgradeBtnTxt}>{t('chatUpgradePlan')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const showAv = item.isLastInGroup !== false;
    return (
      <View style={[S.row, S.rowLeft, !showAv && S.rowLeftIndent]}>
        {showAv
          ? <Image source={cur.charImage} style={S.avatar} />
          : <View style={{ width: 36 }} />
        }
        <View style={S.aiWrap}>
          {item.type === 'video' ? (
            <VideoBubble source={cur.videoSource} poster={cur.charImage} />
          ) : (
            <View style={S.aiBubble}>
              <Text style={S.aiTxt}>{sanitize(item.content)}</Text>
            </View>
          )}
          {showAv && <Text style={S.timeLeft}>{fmtTime(item.id)}</Text>}
        </View>
      </View>
    );
  };

  const bottomPad = Platform.OS === 'ios'
    ? (kbVisible ? 0 : insets.bottom + IOS_TAB)
    : (kbVisible ? kbHeight + insets.bottom : ANDROID_TAB);

  const cur = astrologer || ASTROLOGERS[0];

  return (
    <View style={S.container}>

      {/* ─── Guide Selector (carousel) ─── */}
      <Modal
        visible={showSelector}
        animationType="slide"
        transparent={false}
        onShow={() => {
          setGuideIndex(0);
          carouselRef.current?.scrollToOffset?.({ offset: 0, animated: false });
        }}
      >
        <View style={SM.wrap}>
          {/* Header with back button */}
          <View style={SM.hdr}>
            <TouchableOpacity style={SM.backBtn} onPress={closeSelector} activeOpacity={0.7}>
              <Text style={SM.backIcon}>‹</Text>
            </TouchableOpacity>
            <View style={SM.hdrCenter}>
              <Text style={SM.title}>{t('chatChooseGuide')}</Text>
              <Text style={SM.sub}>{t('chatSwipeSpecialist')}</Text>
            </View>
            <View style={SM.backBtn} />
          </View>

          {/* Featured intro — follows the active card */}
          <View style={SM.intro}>
            <Text style={SM.introName}>{gv(ASTROLOGERS[guideIndex], 'name')}</Text>
            <Text style={SM.introBio}>{gv(ASTROLOGERS[guideIndex], 'bio')}</Text>
          </View>

          {/* Horizontal glassy carousel */}
          <FlatList
            ref={carouselRef}
            data={ASTROLOGERS}
            horizontal
            keyExtractor={(a) => a.id}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_SNAP}
            decelerationRate="fast"
            disableIntervalMomentum
            initialNumToRender={ASTROLOGERS.length}
            windowSize={ASTROLOGERS.length}
            maxToRenderPerBatch={ASTROLOGERS.length}
            contentContainerStyle={{ paddingHorizontal: SIDE_PAD, paddingVertical: 8}}
            onMomentumScrollEnd={onGuideScroll}
            renderItem={({ item: a }) => (
              <View style={[GS.card, { marginRight: CARD_SPACING }]}>
                {/* Image fills card, contain keeps full portrait visible and centered */}
                <Image
                  source={a.charImage}
                  style={GS.portrait}
                  resizeMode="contain"
                  onLoadEnd={() => markPortraitLoaded(a.id)}
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(20,10,5,0.65)', 'rgba(20,10,5,0.97)']}
                  locations={[0, 0.5, 0.74, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={GS.ratingPill}>
                  <Text style={GS.ratingTxt}>★ {a.rating}</Text>
                </View>
                <View style={GS.footer}>
                  <Text style={GS.name}>{gv(a, 'name')}</Text>
                  <Text style={GS.title}>{gv(a, 'title')}</Text>
                  <View style={GS.specRow}>
                    <View style={GS.specPill}>
                      <Text style={GS.specPillTxt}>{gv(a, 'specialty')}</Text>
                    </View>
                    <Text style={GS.reads}>{a.reviews} {t('chatReads')}</Text>
                  </View>
                  <TouchableOpacity style={GS.cta} onPress={() => handleSelect(a)} activeOpacity={0.85}>
                    <Text style={GS.ctaTxt}>{t('chatBeginReading')}</Text>
                  </TouchableOpacity>
                </View>
                {!loadedPortraits[a.id] && (
                  <View style={GS.loaderOverlay} pointerEvents="none">
                    <ActivityIndicator size="large" color="#C9A45A" />
                  </View>
                )}
              </View>
            )}
          />

          {/* Page dots */}
          <View style={SM.dots}>
            {ASTROLOGERS.map((a, i) => (
              <View key={a.id} style={[SM.dot, i === guideIndex && SM.dotActive]} />
            ))}
          </View>
        </View>
      </Modal>

      {/* ─── Profile Switcher Modal ─── */}
      <Modal visible={showProfilePicker && profiles.length > 1} animationType="slide" transparent statusBarTranslucent>
        <View style={PS.backdrop}>
          <View style={PS.sheet}>
            <View style={PS.sheetHandle} />
            <Text style={PS.sheetTitle}>{t('chatReadingFor')}</Text>
            {profiles.map((p) => {
              const active = (selectedProfile?._id || selectedProfile?.id) === (p._id || p.id);
              return (
                <TouchableOpacity
                  key={p._id || p.id}
                  style={[PS.row, active && PS.rowActive]}
                  onPress={() => {
                    setSelectedProfile(p);
                    setShowProfilePicker(false);
                    AsyncStorage.setItem(`vedicScanProfileId_${userId}`, p._id || p.id);
                  }}
                >
                  <View style={PS.badge}>
                    <Text style={PS.badgeTxt}>{p.name[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={PS.name}>{p.name}</Text>
                    <Text style={PS.sub}>{p.relationship} · {p.placeOfBirth}</Text>
                  </View>
                  {active && <Text style={PS.tick}>✓</Text>}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={PS.cancel} onPress={() => setShowProfilePicker(false)}>
              <Text style={PS.cancelTxt}>{t('chatCancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Header (WhatsApp-style) ─── */}
      <View style={[S.header, { paddingTop: Platform.OS === 'ios' ? 54 : 44 }]}>
        <View style={S.hdrLeft}>
          <Image source={cur.charImage} style={S.hdrAvatar} />
          <View>
            <Text style={S.hdrName}>{astrologer ? gv(cur, 'name') : t('chatVedicAI')}</Text>
            <View style={S.hdrSubRow}>
              <View style={S.onlineDot} />
              <Text style={S.hdrSub}>{astrologer ? gv(cur, 'specialty') : t('chatChooseGuideShort')}</Text>
            </View>
          </View>
        </View>
        <View style={S.hdrRight}>
          {astrologer && (
            <TouchableOpacity style={S.switchBtn} onPress={() => setShowSelector(true)}>
              <Text style={S.switchTxt}>{t('chatSwitch')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={clearChat} style={S.iconBtn}>
            <Text style={{ fontSize: 18 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Profile bar ─── */}
      {selectedProfile && !showProfilePicker && (
        <View style={S.profileBar}>
          <Text style={S.profileTxt}>
            {t('chatReadingFor')}: <Text style={S.profileName}>{selectedProfile.name}</Text>
          </Text>
          {profiles.length > 1 && (
            <TouchableOpacity onPress={() => setShowProfilePicker(true)}>
              <Text style={S.changeLink}>{t('chatChange')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ flex: 1, paddingBottom: bottomPad }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <View style={{ flex: 1 }}>

            {/* ─── Empty state ─── */}
            {messages.length === 0 && !showSelector ? (
              <ScrollView contentContainerStyle={S.empty} showsVerticalScrollIndicator={false}>
                <Image source={cur.charImage} style={S.emptyPortrait} />
                <Text style={S.emptyName}>{gv(cur, 'name')}</Text>
                <Text style={S.emptySpec}>{gv(cur, 'title')} · {gv(cur, 'specialty')}</Text>

                {showProfilePicker && profiles.length > 1 ? (
                  <View style={S.profList}>
                    <Text style={S.profListTitle}>{t('chatSelectProfile')}</Text>
                    {profiles.map((p) => (
                      <TouchableOpacity
                        key={p._id || p.id}
                        style={S.profItem}
                        onPress={() => {
                          setSelectedProfile(p);
                          setShowProfilePicker(false);
                          AsyncStorage.setItem(`vedicScanProfileId_${userId}`, p._id || p.id);
                        }}
                      >
                        <View style={S.profBadge}>
                          <Text style={S.profBadgeTxt}>{p.name[0]}</Text>
                        </View>
                        <View>
                          <Text style={S.profItemName}>{p.name}</Text>
                          <Text style={S.profItemSub}>{p.placeOfBirth}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={S.chips}>
                    {sampleQuestions.slice(0, 4).map((q, i) => (
                      <TouchableOpacity
                        key={i}
                        style={S.chip}
                        onPress={() => sendMessage(q)}
                        activeOpacity={0.75}
                      >
                        <Text style={S.chipTxt}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : (
              /* ─── Message list ─── */
              <View style={{ flex: 1 }}>
                <FlatList
                  ref={flatRef}
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={S.list}
                  onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
                  onScroll={(e) => {
                    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                    const distBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
                    setShowScrollBtn(distBottom > 100);
                  }}
                  scrollEventThrottle={80}
                  showsVerticalScrollIndicator={false}
                  ListFooterComponent={
                    loading ? (
                      <View style={[S.row, S.rowLeft, { paddingHorizontal: 12, paddingVertical: 6, paddingBottom: 4 }]}>
                        <Image source={cur.charImage} style={S.avatar} />
                        <View style={[S.aiBubble, { alignSelf: 'flex-start' }]}>
                          <ShimmerLoader />
                        </View>
                      </View>
                    ) : null
                  }
                />
                {showScrollBtn && (
                  <TouchableOpacity
                    style={S.scrollDownBtn}
                    onPress={() => flatRef.current?.scrollToEnd({ animated: true })}
                    activeOpacity={0.8}
                  >
                    <Text style={S.scrollDownIco}>↓</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* ─── Bottom section: suggestions (when idle) + input bar — one visual block ─── */}
          <View style={S.bottomSection}>
            {messages.length > 0 && !showSelector && !loading && !inputText ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={S.suggestRow}
              >
                {sampleQuestions.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={S.suggestChip}
                    onPress={() => sendMessage(q)}
                    activeOpacity={0.8}
                  >
                    <Text style={S.suggestChipTxt} numberOfLines={1}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
            <View style={[S.inputBar, { paddingBottom: spacing.sm }]}>
              <TextInput
                style={S.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={astrologer
                  ? (language === 'hi' ? `${gv(cur, 'name')} से पूछें...` : `Ask ${cur.name}...`)
                  : t('chatTypeMessage')}
                placeholderTextColor="#B0A898"
                multiline
                maxLength={1000}
                disableFullscreenUI
              />
              <TouchableOpacity
                onPress={() => sendMessage()}
                disabled={loading || !inputText.trim()}
              >
                <View style={[S.sendBtn, { backgroundColor: inputText.trim() ? '#1C1C1E' : '#C8C0B8' }]}>
                  <Text style={S.sendIcon}>↑</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

// ── Selector screen styles ────────────────────────────────────────────────────
const SM = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#F5F0EB' },
  hdr: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F0EB',
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 34, color: '#3D2010', marginTop: -4 },
  hdrCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 21, fontWeight: '800', color: '#111' },
  sub: { fontSize: 12.5, color: '#9A8878', marginTop: 2 },

  intro: { paddingHorizontal: 28, paddingTop: 10, paddingBottom: 6, minHeight: 92 },
  introName: { fontSize: 17, fontWeight: '800', color: '#7B1A38', marginBottom: 4 },
  introBio: { fontSize: 13, color: '#6B5040', lineHeight: 19 },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 18,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#D6CABA' },
  dotActive: { width: 22, backgroundColor: '#7B1A38' },
});

// ── Guide carousel card styles ────────────────────────────────────────────────
const GS = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#241712',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  // Fills entire card — contain mode centers the image (not cropped)
  portrait: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_W,
    height: CARD_H,
  },
  ratingPill: {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  ratingTxt: { color: '#FFD700', fontSize: 13, fontWeight: '700' },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#241712',
  },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 20,
  },
  name: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  title: { fontSize: 13.5, color: 'rgba(255,255,255,0.8)', marginTop: 2, marginBottom: 12 },
  specRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  specPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1,
    paddingHorizontal: 11, paddingVertical: 5, borderRadius: 14,
  },
  specPillTxt: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  reads: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  cta: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14, borderRadius: 14, alignItems: 'center',
  },
  ctaTxt: { color: '#1C1C1E', fontSize: 15, fontWeight: '800' },
});

// ── Main styles ───────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#FFFDF8',
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC2',
    elevation: 2,
    shadowColor: '#6A1039',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  hdrLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  hdrAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, resizeMode: 'cover' },
  hdrName: { fontSize: 17, fontWeight: '800', color: '#6A1039' },
  hdrSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 5 },
  hdrSub: { fontSize: 12, color: '#A08856' },
  hdrRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  switchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F7F1E5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DCC2',
  },
  switchTxt: { fontSize: 13, fontWeight: '600', color: '#6A1039' },
  iconBtn: { padding: 6 },

  // ── Profile bar ─────────────────────────────────────────────────────────────
  profileBar: {
    backgroundColor: '#F7F1E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileTxt: { fontSize: 12, color: '#75695C' },
  profileName: { fontWeight: '800', color: '#6A1039' },
  changeLink: { fontSize: 12, color: '#C9A45A', fontWeight: '600' },

  // ── Messages ─────────────────────────────────────────────────────────────
  list: { padding: 12, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 },
  rowLeft: { justifyContent: 'flex-start' },
  rowLeftIndent: { paddingLeft: 44 },
  rowRight: { justifyContent: 'flex-end', marginBottom: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, resizeMode: 'cover' },

  // User bubble (right, burgundy/gold)
  userWrap: { alignItems: 'flex-end', maxWidth: '72%' },
  userBubble: {
    backgroundColor: '#6A1039',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#6A1039',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  userTxt: { fontSize: 13, color: '#FFFDF8', lineHeight: 19, textAlign: 'left' },
  timeRight: { fontSize: 11, color: '#A08856', marginTop: 3, marginRight: 2 },

  // AI bubble (left, cream)
  aiWrap: { alignItems: 'flex-start', maxWidth: '78%' },
  aiBubble: {
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#6A1039',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E8DCC2',
  },
  aiTxt: { fontSize: 13, color: '#2D2A26', lineHeight: 19, textAlign: 'left' },
  timeLeft: { fontSize: 11, color: '#A08856', marginTop: 3, marginLeft: 2 },

  // ── Empty state ──────────────────────────────────────────────────────────
  empty: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 },
  emptyPortrait: {
    width: SW * 0.42,
    height: SW * 0.55,
    borderRadius: 18,
    resizeMode: 'cover',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#C9A45A',
  },
  emptyName: { fontSize: 22, fontWeight: '800', color: '#6A1039', marginBottom: 4 },
  emptySpec: { fontSize: 13, color: '#A08856', marginBottom: 24, textAlign: 'center' },
  chips: { width: '100%', gap: 10 },
  chip: {
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E8DCC2',
    elevation: 2,
    shadowColor: '#6A1039',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  chipTxt: { fontSize: 14, color: '#6A1039', fontWeight: '600', lineHeight: 20 },

  // Profile list in empty state
  profList: { width: '100%', marginTop: 8 },
  profListTitle: { fontSize: 15, fontWeight: '800', color: '#6A1039', marginBottom: 12 },
  profItem: {
    backgroundColor: '#FFFDF8',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8DCC2',
    elevation: 2,
    shadowColor: '#6A1039',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  profBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#6A1039',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  profBadgeTxt: { color: '#C9A45A', fontWeight: '800', fontSize: 17 },
  profItemName: { fontSize: 15, fontWeight: '700', color: '#6A1039' },
  profItemSub: { fontSize: 12, color: '#A08856' },

  // ── Bottom section wrapper (suggestions + input as one unit) ─────────────────
  bottomSection: {
    backgroundColor: '#FFFDF8',
    borderTopWidth: 1,
    borderTopColor: '#E8DCC2',
  },

  // ── Quick suggestion chips ────────────────────────────────────────────────────
  suggestRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
    alignItems: 'center',
  },
  suggestChip: {
    backgroundColor: '#F7F1E5',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8DCC2',
    maxWidth: SW * 0.65,
    flexShrink: 0,
  },
  suggestChipTxt: { fontSize: 12, color: '#6A1039', fontWeight: '600' },

  // ── Input bar ─────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: '#FFFDF8',
  },
  input: {
    flex: 1,
    backgroundColor: '#F7F1E5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 11 : 8,
    paddingBottom: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 15,
    color: '#2D2A26',
    minHeight: 44,
    maxHeight: 120,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E8DCC2',
    textAlignVertical: 'top',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#6A1039',
    elevation: 3,
    shadowColor: '#6A1039',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  sendIcon: { color: '#FFFDF8', fontSize: 18, fontWeight: '700' },

  // ── Scroll-to-bottom button ─────────────────────────────────────────────────
  scrollDownBtn: {
    position: 'absolute',
    right: 14,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#6A1039',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#6A1039',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  scrollDownIco: { fontSize: 16, color: '#FFFDF8', fontWeight: '700', marginTop: -1 },

  // ── Upgrade CTA bubble ───────────────────────────────────────────────────────
  upgradeBubble: {
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: '82%',
    borderWidth: 1.5,
    borderColor: '#C9A45A',
    elevation: 2,
  },
  upgradeMsg: {
    fontSize: 13,
    color: '#6A1039',
    lineHeight: 19,
    textAlign: 'left',
    marginBottom: 10,
  },
  upgradeBtn: {
    backgroundColor: '#6A1039',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  upgradeBtnTxt: { color: '#FFFDF8', fontSize: 13, fontWeight: '700' },
});

// ── Profile switcher bottom-sheet styles ──────────────────────────────────────
const PS = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center', marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 13, fontWeight: '600', color: '#9A8878',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, borderRadius: 12,
    paddingHorizontal: 10, marginBottom: 4
  },
  rowActive: { backgroundColor: '#FFF5F0' },
  badge: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#7B1A38',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  badgeTxt: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  sub: { fontSize: 12, color: '#9A8878' },
  tick: { fontSize: 18, color: '#7B1A38', fontWeight: '700', marginLeft: 8 },
  cancel: {
    marginTop: 10, paddingVertical: 14,
    borderRadius: 14, backgroundColor: '#F3F0EC',
    alignItems: 'center',
  },
  cancelTxt: { fontSize: 15, fontWeight: '600', color: '#555' },
});

export default ChatScreen;
