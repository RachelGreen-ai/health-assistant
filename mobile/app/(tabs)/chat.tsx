import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/hooks/useLanguage';
import { useChat } from '@/hooks/useChat';
import { useVoice } from '@/hooks/useVoice';
import { ChatMessage } from '@/components/ChatMessage';
import { VoiceButton } from '@/components/VoiceButton';

const SESSION_ID = 'main';

export default function ChatScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { language, t } = useLanguage();
  const { messages, isStreaming, sendMessage, clearChat } = useChat(SESSION_ID, language);
  const { state: voiceState, error: voiceError, startRecording, stopRecording, speak } = useVoice(language);
  const [inputText, setInputText] = useState('');
  const [showVoice, setShowVoice] = useState(mode === 'voice');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;
    setInputText('');
    await sendMessage(text);
  };

  const handleVoicePressIn = async () => { await startRecording(); };
  const handleVoicePressOut = async () => {
    const text = await stopRecording();
    if (text) {
      await sendMessage(text);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HealthCompanion</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowVoice((v) => !v)} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, showVoice && styles.headerBtnActive]}>
              {showVoice ? '⌨' : '🎙'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearChat} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>↺</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatMessage message={item} />}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState t={t} />}
        />

        {showVoice ? (
          <View style={styles.voiceBar}>
            <Text style={styles.voiceStatus}>
              {voiceError ? `⚠ ${voiceError}`
                : voiceState === 'recording' ? t('listening')
                : voiceState === 'transcribing' ? t('transcribing')
                : voiceState === 'speaking' ? '♪ Speaking…'
                : 'Hold to speak'}
            </Text>
            <VoiceButton
              state={voiceState}
              onPressIn={handleVoicePressIn}
              onPressOut={handleVoicePressOut}
            />
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('chatPlaceholder')}
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isStreaming) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isStreaming}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EmptyState({ t }: { t: (k: string) => string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>✦</Text>
      <Text style={styles.emptyTitle}>HealthCompanion</Text>
      <Text style={styles.emptySubtitle}>{t('askPrompt')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.separator,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 16, color: Colors.textSecondary },
  headerBtnActive: { color: Colors.blue },
  list: { flex: 1 },
  listContent: { paddingTop: 16, paddingBottom: 8 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 0.5, borderTopColor: Colors.separator,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 15, maxHeight: 120,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.bgCard },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  voiceBar: {
    alignItems: 'center', paddingVertical: 20, gap: 10,
    borderTopWidth: 0.5, borderTopColor: Colors.separator,
  },
  voiceStatus: { fontSize: 13, color: Colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, marginTop: 80 },
  emptyIcon: { fontSize: 36, color: Colors.blue },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
