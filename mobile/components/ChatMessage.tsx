import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { Colors } from '@/constants/Colors';
import type { Message } from '@/hooks/useChat';

const markdownStyles = {
  body: { color: Colors.textPrimary, fontSize: 15, lineHeight: 22 },
  strong: { color: Colors.textPrimary, fontWeight: '700' as const },
  em: { color: Colors.textPrimary, fontStyle: 'italic' as const },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { color: Colors.textPrimary, fontSize: 15, lineHeight: 22 },
  code_inline: {
    backgroundColor: '#1a1f2e', color: '#a8daff',
    borderRadius: 4, paddingHorizontal: 4, fontSize: 13,
    fontFamily: 'Courier',
  },
  fence: {
    backgroundColor: '#1a1f2e', borderRadius: 8,
    padding: 12, marginVertical: 6,
  },
  code_block: { color: '#a8daff', fontSize: 13, fontFamily: 'Courier' },
  heading1: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' as const, marginVertical: 6 },
  heading2: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' as const, marginVertical: 4 },
  heading3: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' as const, marginVertical: 4 },
  hr: { backgroundColor: Colors.separator, height: 1, marginVertical: 8 },
  blockquote: { backgroundColor: '#1a1f2e', borderLeftColor: Colors.blue, borderLeftWidth: 3, paddingLeft: 10 },
  paragraph: { marginVertical: 2 },
};

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={12} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isUser ? (
          <Text style={styles.userText}>{message.text}</Text>
        ) : (
          <>
            <Markdown style={markdownStyles}>{message.text || ''}</Markdown>
            {message.streaming && message.text.length === 0 && (
              <ActivityIndicator size="small" color={Colors.blue} />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 12, paddingHorizontal: 16 },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.blue,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  userBubble: { backgroundColor: Colors.blue, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: Colors.bgCard, borderBottomLeftRadius: 4 },
  userText: { fontSize: 15, lineHeight: 22, color: '#fff' },
});