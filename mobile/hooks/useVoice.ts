import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { EncodingType, cacheDirectory } from 'expo-file-system/legacy';
import { transcribeAudio, speakText } from '@/services/api';
import type { Language } from '@/constants/i18n';

type VoiceState = 'idle' | 'recording' | 'transcribing' | 'speaking';

export function useVoice(language: Language) {
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setState('recording');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recording failed');
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recordingRef.current) return null;
    try {
      setState('transcribing');
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) { setError('No audio recorded'); setState('idle'); return null; }

      // 30s timeout so it never hangs forever
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Transcription timed out')), 30000)
      );
      const text = await Promise.race([transcribeAudio(uri, language), timeout]);

      await FileSystem.deleteAsync(uri, { idempotent: true });
      setState('idle');
      return text;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transcription failed';
      console.error('[voice] transcription error:', msg);
      setError(msg);
      setState('idle');
      return null;
    }
  }, [language]);

  const speak = useCallback(async (text: string) => {
    try {
      setState('speaking');
      const buffer = await speakText(text, language);

      // Write audio buffer to temp file and play
      const tmpUri = (cacheDirectory ?? '') + 'tts_response.mp3';
      const bytes = new Uint8Array(buffer);
      const b64 = btoa(String.fromCharCode(...bytes));
      await FileSystem.writeAsStringAsync(tmpUri, b64, {
        encoding: EncodingType.Base64,
      });

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: tmpUri });
      soundRef.current = sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setState('idle');
          sound.unloadAsync();
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Playback failed');
      setState('idle');
    }
  }, [language]);

  const cancel = useCallback(async () => {
    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      soundRef.current = null;
    }
    setState('idle');
  }, []);

  return { state, error, startRecording, stopRecording, speak, cancel };
}
