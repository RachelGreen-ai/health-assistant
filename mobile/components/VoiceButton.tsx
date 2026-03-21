import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface Props {
  state: 'idle' | 'recording' | 'transcribing' | 'speaking';
  onPressIn: () => void;
  onPressOut: () => void;
}

export function VoiceButton({ state, onPressIn, onPressOut }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulse.stopAnimation();
      Animated.timing(pulse, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [state, pulse]);

  const active = state === 'recording';
  const busy = state === 'transcribing' || state === 'speaking';

  const iconName: React.ComponentProps<typeof Ionicons>['name'] =
    state === 'transcribing' ? 'ellipsis-horizontal' :
    state === 'speaking' ? 'musical-note' :
    'mic';

  return (
    <View style={styles.wrapper}>
      {active && (
        <Animated.View style={[styles.ring, { transform: [{ scale: pulse }] }]} />
      )}
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={busy}
        style={[styles.btn, active && styles.btnActive, busy && styles.btnBusy]}
      >
        <Ionicons name={iconName} size={24} color={active ? '#fff' : Colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', width: 72, height: 72 },
  ring: {
    position: 'absolute', width: 72, height: 72, borderRadius: 36,
    backgroundColor: `${Colors.blue}40`,
  },
  btn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.separator,
  },
  btnActive: { backgroundColor: Colors.blue, borderColor: Colors.blue },
  btnBusy: { opacity: 0.5 },
});
