import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, Animated, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, spacing, radius, fontSize, shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { sampleQuestions } from '../../data/signs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatScreen = ({ navigation }) => {
  const { hasProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const flatRef = useRef(null);

  useEffect(() => {
    if (!hasProfile) {
      navigation.navigate('ProfileTab', { screen: 'ProfileMain', params: { setup: true } });
      return;
    }
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem('vedicScanChatHistory');
      const savedId = await AsyncStorage.getItem('vedicScanConversationId');
      if (saved) setMessages(JSON.parse(saved));
      if (savedId) setConversationId(savedId);
    } catch (e) {}
  };

  const saveHistory = async (msgs, cId) => {
    try {
      await AsyncStorage.setItem('vedicScanChatHistory', JSON.stringify(msgs));
      if (cId) await AsyncStorage.setItem('vedicScanConversationId', cId);
    } catch (e) {}
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

      const res = await api.post('/api/chat', payload);
      if (res.data) {
        const aiMsg = {
          role: 'assistant',
          content: res.data.reply || res.data.message || 'I am processing your query...',
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
      const finalMsgs = [...newMsgs, errMsg];
      setMessages(finalMsgs);
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
            <Image 
              source={{ uri: 'https://customer-assets.emergentagent.com/job_vedicscan/artifacts/fyeynkm9_image.png' }}
              style={{ width: 22, height: 22, resizeMode: 'contain' }}
            />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.msgText, isUser && styles.userMsgText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#7B1A38', '#4A0E22']} style={styles.header}>
        <View style={styles.headerInner}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#FFF', borderRadius: 8, padding: 2, marginRight: 10 }}>
              <Image 
                source={{ uri: 'https://customer-assets.emergentagent.com/job_vedicscan/artifacts/fyeynkm9_image.png' }}
                style={{ width: 28, height: 28, resizeMode: 'contain' }}
              />
            </View>
            <View>
              <Text style={styles.headerTitle}>Maharshi AI</Text>
              <Text style={styles.headerSub}>Your Vedic Guide</Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Text style={styles.clearText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyOm}>
              <Text style={styles.emptyOmText}>ॐ</Text>
            </View>
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
          />
        )}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.typingRow}>
            <View style={styles.aiAvatar}>
              <Image 
                source={{ uri: 'https://customer-assets.emergentagent.com/job_vedicscan/artifacts/fyeynkm9_image.png' }}
                style={{ width: 22, height: 22, resizeMode: 'contain' }}
              />
            </View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Channeling cosmic wisdom...</Text>
            </View>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your cosmic path..."
            placeholderTextColor={C.textDim}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={loading || !inputText.trim()}
            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendDisabled]}
          >
            <LinearGradient
              colors={['#D4760A', '#B8860B']}
              style={styles.sendGrad}
            >
              <Text style={styles.sendText}>↗</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingTop: 50, paddingBottom: 14, paddingHorizontal: spacing.lg },
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '700', color: C.white },
  headerSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.6)' },
  clearBtn: { padding: 8 },
  clearText: { fontSize: 18 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyOm: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.saffronPale, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  emptyOmText: { fontSize: 32, color: C.saffron },
  emptyTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptyDesc: { fontSize: fontSize.md, color: C.textMuted, marginBottom: spacing.lg },
  chipsWrap: { width: '100%' },
  chip: {
    backgroundColor: C.white, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: C.border,
    ...shadow.sm,
  },
  chipText: { fontSize: fontSize.md, color: C.text },
  msgList: { padding: spacing.md },
  msgRow: { marginBottom: spacing.md, flexDirection: 'row', alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAi: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  bubble: {
    maxWidth: '78%', padding: spacing.md,
    borderRadius: radius.lg,
  },
  userBubble: {
    backgroundColor: C.maroon,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  msgText: { fontSize: fontSize.md, color: C.text, lineHeight: 22 },
  userMsgText: { color: C.white },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  typingBubble: {
    backgroundColor: C.saffronPale, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10,
  },
  typingText: { fontSize: fontSize.sm, color: C.saffron, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.white,
  },
  textInput: {
    flex: 1, backgroundColor: C.input, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: fontSize.md, color: C.text, maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendBtn: { borderRadius: radius.md, overflow: 'hidden' },
  sendGrad: { width: 46, height: 46, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  sendText: { color: C.white, fontSize: 20, fontWeight: '700' },
  sendDisabled: { opacity: 0.4 },
});

export default ChatScreen;
