import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, Animated, Alert, Image, Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, fontSize } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { sampleQuestions } from '../../data/signs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LOGO = require('../../../assets/logo.jpeg');
const BANNER = require('../../../assets/bannerbackground5.webp');

// Tab bar total height on Android = 72 (height) + 14 (bottom offset) + 4 (gap)
const ANDROID_TAB_CLEARANCE = 90;
// Tab bar total height on iOS = 72 (height) + 26 (bottom offset)
const IOS_TAB_CLEARANCE = 65;

const TypingDots = () => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 3, duration: 900, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const getDotOpacity = (index) =>
    anim.interpolate({
      inputRange: [index - 0.5, index, index + 0.5],
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

  return (
    <View style={dotStyles.row}>
      {[1, 2, 3].map((i) => (
        <Animated.View
          key={i}
          style={[dotStyles.dot, { opacity: getDotOpacity(i) }]}
        />
      ))}
    </View>
  );
};

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C8660A' },
});

const formatTime = (id) => {
  const date = new Date(id);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatScreen = ({ navigation }) => {
  const { hasProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const flatRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!hasProfile) {
      navigation.navigate('ProfileTab');
      return;
    }
    loadHistory();

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem('vedicScanChatHistory');
      const savedId = await AsyncStorage.getItem('vedicScanConversationId');
      if (saved) setMessages(JSON.parse(saved));
      if (savedId) setConversationId(savedId);
    } catch (e) { }
  };

  const saveHistory = async (msgs, cId) => {
    try {
      await AsyncStorage.setItem('vedicScanChatHistory', JSON.stringify(msgs));
      if (cId) await AsyncStorage.setItem('vedicScanConversationId', cId);
    } catch (e) { }
  };

  const sendMessage = async (text) => {
    const userMsg = text || inputText.trim();
    if (!userMsg) return;
    setInputText('');

    const newMsgs = [...messages, { role: 'user', content: userMsg, id: Date.now() }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const payload = { message: userMsg };
      if (conversationId) payload.conversationId = conversationId;

      const res = await api.post('/api/chat/message', payload);
      if (res.data) {
        const aiMsg = {
          role: 'assistant',
          content: res.data.response || res.data.reply || res.data.message || 'I am processing your query...',
          id: Date.now() + 1,
        };
        const finalMsgs = [...newMsgs, aiMsg];
        setMessages(finalMsgs);
        if (res.data.conversationId) setConversationId(res.data.conversationId);
        saveHistory(finalMsgs, res.data.conversationId);
      }
    } catch (err) {
      const errMsg = {
        role: 'assistant',
        content: 'I apologize, I am unable to process your request right now. Please try again.',
        id: Date.now() + 1,
      };
      setMessages([...newMsgs, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear chat history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setMessages([]);
          setConversationId(null);
          await AsyncStorage.multiRemove(['vedicScanChatHistory', 'vedicScanConversationId']);
        },
      },
    ]);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAi]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Image source={LOGO} style={styles.avatarImg} />
          </View>
        )}
        <View style={styles.bubbleWrapper}>
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.msgText, isUser && styles.userMsgText]}>
              {item.content}
            </Text>
          </View>
          <Text style={[styles.timeText, isUser && styles.timeTextUser]}>
            {formatTime(item.id)}
          </Text>
        </View>
      </View>
    );
  };

  // Clears the floating tab bar (position:absolute) when keyboard is hidden.
  // When keyboard is visible, we drop this padding because the tab bar hides
  // and we want the input bar to sit directly on top of the keyboard.
  const outerBottomPadding = isKeyboardVisible
    ? 0
    : (Platform.OS === 'ios' ? insets.bottom + IOS_TAB_CLEARANCE : ANDROID_TAB_CLEARANCE);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#7B1A38', '#4A0E22']} style={styles.header}>
        <Image source={BANNER} style={styles.headerBannerOverlay} />
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogoWrap}>
              <Image source={LOGO} style={styles.headerLogo} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Maharshi AI</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerSub}>Your Vedic Guide</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Outer view handles tab-bar clearance when keyboard is hidden.
          Android uses softwareKeyboardLayoutMode="resize" (app.json) so the OS
          shrinks the window automatically — no KAV behavior needed there.
          iOS uses KAV "padding" to shift the input above the keyboard. */}
      <View style={{ flex: 1, paddingBottom: outerBottomPadding }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={{ flex: 1 }}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Image source={LOGO} style={styles.emptyLogo} />
              <Text style={styles.emptyTitle}>Ask Maharshi Anything</Text>
              <Text style={styles.emptyDesc}>Your personal AI Vedic astrologer</Text>

              <View style={styles.chipsWrap}>
                {sampleQuestions.slice(0, 4).map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.chip}
                    onPress={() => sendMessage(q)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipEmoji}>✨</Text>
                    <Text style={styles.chipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.msgList}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Typing indicator */}
        {loading && (
          <View style={styles.typingRow}>
            <View style={styles.aiAvatar}>
              <Image source={LOGO} style={styles.avatarImg} />
            </View>
            <View style={styles.typingBubble}>
              <TypingDots />
            </View>
          </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: spacing.sm }]}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your cosmic path..."
            placeholderTextColor={C.textDim}
            multiline
            maxLength={1000}
            disableFullscreenUI={true}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={loading || !inputText.trim()}
            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendDisabled]}
          >
            <LinearGradient
              colors={inputText.trim() ? ['#D4760A', '#B8860B'] : ['#E0D4C8', '#D4C8BC']}
              style={styles.sendGrad}
            >
              <Text style={[styles.sendText, !inputText.trim() && styles.sendTextDim]}>↗</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F4EF' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 55 : 45,
    paddingBottom: 18,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  headerBannerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: 500, height: 500, resizeMode: 'cover', opacity: 0.8,
  },
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogoWrap: {
    backgroundColor: '#FFF', borderRadius: 8, padding: 3,
    marginRight: 10, overflow: 'hidden',
    borderWidth: 2, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  headerLogo: { width: 30, height: 30, resizeMode: 'contain' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '700', color: C.white },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80', marginRight: 5 },
  headerSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  clearBtn: { padding: 6 },
  clearText: { fontSize: 18 },

  // Empty state
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: 100,
  },
  emptyLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F5E6D3',
  },
  emptyTitle: { fontSize: fontSize.xxl, fontWeight: '800', color: '#1A0810', marginBottom: 6 },
  emptyDesc: { fontSize: fontSize.md, color: C.textMuted, marginBottom: spacing.xl, textAlign: 'center' },
  chipsWrap: { width: '100%', gap: 10 },
  chip: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#EDE4D8',
    shadowColor: '#7B1A38', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  chipEmoji: { fontSize: 14, marginRight: 8 },
  chipText: { fontSize: fontSize.md, color: '#3D2010', flex: 1, lineHeight: 20 },

  // Messages
  msgList: { padding: spacing.md, paddingBottom: spacing.lg },
  msgRow: { marginBottom: 14, flexDirection: 'row', alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAi: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
    marginRight: 8, borderWidth: 2, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  avatarImg: { width: 22, height: 22, resizeMode: 'contain' },
  bubbleWrapper: { maxWidth: '78%' },
  bubble: {
    padding: spacing.md,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#7B1A38',
    borderBottomRightRadius: 4,
    shadowColor: '#7B1A38', shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#EDE4D8',
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  msgText: { fontSize: fontSize.md, color: '#2D1508', lineHeight: 22 },
  userMsgText: { color: '#FFFFFF' },
  timeText: { fontSize: 11, color: '#A89880', marginTop: 4, marginLeft: 4 },
  timeTextUser: { textAlign: 'right', marginRight: 4 },

  // Typing
  typingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF', borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: '#EDE4D8',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#EDE4D8',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8,
    elevation: 8, zIndex: 100,
  },
  textInput: {
    flex: 1, backgroundColor: '#F5F0EB', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: fontSize.md, color: '#2D1508',
    minHeight: 46, maxHeight: 120, marginRight: 10,
    borderWidth: 1, borderColor: '#EDE4D8',
  },
  sendBtn: { borderRadius: 23, overflow: 'hidden' },
  sendGrad: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  sendText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  sendTextDim: { color: '#A89880' },
  sendDisabled: { opacity: 0.8 },
});

export default ChatScreen;
