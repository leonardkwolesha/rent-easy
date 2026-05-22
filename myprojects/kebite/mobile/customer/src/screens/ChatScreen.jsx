import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW, tabBar, tabColors } from 'shared/theme';
import api from 'shared/api';
import { useLang } from '../context/LanguageContext';

// ── Animated typing dots ───────────────────────────────────────────────────
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue:  0, duration: 280, useNativeDriver: true }),
          Animated.delay(450),
        ])
      );
    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 140);
    const a3 = bounce(dot3, 280);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 4, paddingVertical: 2, alignItems: 'center' }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 3.5,
            backgroundColor: COLORS.textMuted,
            transform: [{ translateY: dot }],
          }}
        />
      ))}
    </View>
  );
}

// ── Animated message bubble ────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(msg.role === 'user' ? 16 : -16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 20, bounciness: 4, useNativeDriver: true }),
    ]).start();
  }, []);

  const isUser = msg.role === 'user';
  const time   = new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View
      style={[
        styles.msgRow,
        isUser ? styles.msgRowUser : styles.msgRowAI,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="restaurant" size={13} color="#fff" />
        </View>
      )}
      <View style={{ maxWidth: '78%' }}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
            {msg.text}
          </Text>
        </View>
        <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAI]}>
          {time}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Quick-chip category groups ─────────────────────────────────────────────
function QuickChips({ chips, onSend, loading }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
      style={styles.chipsScroll}
    >
      {chips.map((chip) => (
        <TouchableOpacity
          key={chip}
          onPress={() => onSend(chip)}
          disabled={loading}
          activeOpacity={0.75}
          style={[styles.chip, loading && { opacity: 0.5 }]}
        >
          <Text style={styles.chipText}>{chip}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { lang, setLang, t } = useLang();
  const insets = useSafeAreaInsets();
  // Space needed below input to clear the floating tab bar
  const tabBarClearance = tabBar.height + Math.max(insets.bottom, tabBar.bottomGap);

  const [messages, setMessages] = useState([
    { id: '0', role: 'assistant', text: t.chatWelcome, ts: Date.now() },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef             = useRef(null);

  useEffect(() => {
    setMessages([{ id: '0', role: 'assistant', text: t.chatWelcome, ts: Date.now() }]);
  }, [lang]);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  const send = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg = { id: String(Date.now()), role: 'user', text: trimmed, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res   = await api.post('/ai/chat', { message: trimmed, language: lang });
      const reply = res.data?.reply || res.data?.message || '…';
      setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: 'assistant', text: reply, ts: Date.now() }]);
    } catch {
      setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: 'assistant', text: t.chatError, ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }, [loading, lang, t]);

  function toggleLang() { setLang(lang === 'en' ? 'sw' : 'en'); }

  function clearChat() {
    setMessages([{ id: '0', role: 'assistant', text: t.chatWelcome, ts: Date.now() }]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.pageBg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1, marginBottom: tabBarClearance }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
          <View style={styles.headerCenter}>
            <View style={styles.kebaBubble}>
              <Ionicons name="restaurant" size={16} color={COLORS.orange} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Keba</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerSub}>Online · AI assistant</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <TouchableOpacity
              onPress={clearChat}
              accessibilityLabel="Clear conversation"
              style={styles.headerBtn}
              activeOpacity={0.75}
            >
              <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleLang}
              accessibilityLabel={`Switch to ${lang === 'en' ? 'Swahili' : 'English'}`}
              style={styles.langBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.langText}>{t.chatToggle}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Message list */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {loading && (
            <View style={[styles.msgRow, styles.msgRowAI]}>
              <View style={styles.avatar}>
                <Ionicons name="restaurant" size={13} color="#fff" />
              </View>
              <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
                <TypingIndicator />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick chips */}
        <QuickChips chips={t.quickChips} onSend={send} loading={loading} />

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t.chatPlaceholder}
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
            accessibilityLabel="Send message"
            activeOpacity={0.85}
            style={[styles.sendWrap, (!input.trim() || loading) && { opacity: 0.38 }]}
          >
            <LinearGradient colors={GRADIENTS.primary} style={styles.sendBtn}>
              <Ionicons name="send" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingTop:        SPACING.sm,
    paddingBottom:     SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  kebaBubble: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...SHADOW.sm,
  },
  headerTitle: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  onlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  headerSub:   { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZE.xs },
  headerBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  langBtn: {
    paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  langText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },

  messageList: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.sm },
  msgRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm },
  msgRowUser:  { justifyContent: 'flex-end' },
  msgRowAI:    { justifyContent: 'flex-start' },

  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.activeOrange,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bubble: {
    paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  userBubble: {
    backgroundColor: COLORS.activeOrange,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: COLORS.cardBg,
    borderBottomLeftRadius: 4,
    ...SHADOW.sm,
  },
  typingBubble: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  bubbleText:   { fontSize: FONT_SIZE.base, lineHeight: 22 },
  userText:     { color: '#fff' },
  aiText:       { color: COLORS.textPrimary },
  timestamp:    { fontSize: 10, marginTop: 4 },
  timestampUser:{ color: COLORS.textLight, textAlign: 'right' },
  timestampAI:  { color: COLORS.textLight, marginLeft: 4 },

  chipsScroll: { flexShrink: 0, backgroundColor: COLORS.cardBg, borderTopWidth: 1, borderTopColor: COLORS.border },
  chips: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2, gap: SPACING.sm },
  chip: {
    backgroundColor: COLORS.pageBg, borderRadius: RADIUS.pill,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
  },
  chipText: { color: COLORS.textBody, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    gap: SPACING.sm, backgroundColor: COLORS.cardBg,
  },
  input: {
    flex: 1, minHeight: 42, maxHeight: 120,
    backgroundColor: COLORS.pageBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.base, color: COLORS.textPrimary,
  },
  sendWrap: { flexShrink: 0 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
});
