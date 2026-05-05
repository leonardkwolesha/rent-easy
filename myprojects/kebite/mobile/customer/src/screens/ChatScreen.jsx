import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../../shared/theme';
import api from '../../../shared/api';
import { useLang } from '../context/LanguageContext';

export default function ChatScreen({ navigation }) {
  const { lang, setLang, t } = useLang();

  const [messages, setMessages] = useState([
    { id: '0', role: 'assistant', text: t.chatWelcome },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef             = useRef(null);

  // Reset conversation when language changes
  useEffect(() => {
    setMessages([{ id: '0', role: 'assistant', text: t.chatWelcome }]);
  }, [lang]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages]);

  const send = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: String(Date.now()), role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res    = await api.post('/ai/chat', { message: text.trim(), language: lang });
      const reply  = res.data?.reply || res.data?.message || '…';
      const botMsg = { id: String(Date.now() + 1), role: 'assistant', text: reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errMsg = { id: String(Date.now() + 1), role: 'assistant', text: t.chatError };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading, lang, t]);

  function toggleLang() {
    setLang(lang === 'en' ? 'sw' : 'en');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.pageBg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Close chat">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

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

          <TouchableOpacity
            onPress={toggleLang}
            accessibilityLabel={`Switch to ${lang === 'en' ? 'Swahili' : 'English'}`}
            style={styles.langBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.langText}>{t.chatToggle}</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Message list */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.msgRow, msg.role === 'user' ? styles.msgRowUser : styles.msgRowAI]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.avatar}>
                  <Ionicons name="restaurant" size={13} color="#fff" />
                </View>
              )}
              <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userText : styles.aiText]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={[styles.msgRow, styles.msgRowAI]}>
              <View style={styles.avatar}>
                <Ionicons name="restaurant" size={13} color="#fff" />
              </View>
              <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
                <ActivityIndicator size="small" color={COLORS.orange} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}
        >
          {t.quickChips.map((chip) => (
            <TouchableOpacity
              key={chip}
              onPress={() => send(chip)}
              disabled={loading}
              style={styles.chip}
              activeOpacity={0.8}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
            style={[styles.sendWrap, (!input.trim() || loading) && { opacity: 0.4 }]}
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
    flexDirection:    'row',
    alignItems:       'center',
    paddingTop:       SPACING.sm,
    paddingBottom:    SPACING.lg,
    paddingHorizontal:SPACING.lg,
    gap:              SPACING.md,
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  kebaBubble: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: '#fff',
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerTitle: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  onlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  headerSub:   { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZE.xs },
  langBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical:   SPACING.xs,
    borderRadius:      RADIUS.pill,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.5)',
  },
  langText:    { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },

  messageList: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.sm },
  msgRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm },
  msgRowUser:  { justifyContent: 'flex-end' },
  msgRowAI:    { justifyContent: 'flex-start' },

  avatar: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: COLORS.activeOrange,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  bubble: {
    maxWidth:     '78%',
    paddingVertical:   SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius:  RADIUS.lg,
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
  typingBubble:{ paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  bubbleText:  { fontSize: FONT_SIZE.base, lineHeight: 22 },
  userText:    { color: '#fff' },
  aiText:      { color: COLORS.textPrimary },

  chipsScroll: { flexShrink: 0, backgroundColor: COLORS.pageBg },
  chips: {
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.sm,
    gap:               SPACING.sm,
  },
  chip: {
    backgroundColor:   COLORS.cardBg,
    borderRadius:      RADIUS.pill,
    borderWidth:       1,
    borderColor:       COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.xs,
  },
  chipText: { color: COLORS.textBody, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },

  inputRow: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.sm,
    gap:               SPACING.sm,
    backgroundColor:   COLORS.cardBg,
    borderTopWidth:    1,
    borderTopColor:    COLORS.border,
  },
  input: {
    flex:              1,
    minHeight:         42,
    maxHeight:         120,
    backgroundColor:   COLORS.pageBg,
    borderRadius:      RADIUS.lg,
    borderWidth:       1,
    borderColor:       COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm,
    fontSize:          FONT_SIZE.base,
    color:             COLORS.textPrimary,
  },
  sendWrap: { flexShrink: 0 },
  sendBtn: {
    width:          42,
    height:         42,
    borderRadius:   21,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
