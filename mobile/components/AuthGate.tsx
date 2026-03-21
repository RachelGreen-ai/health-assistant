import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { getAuthStatus, startAuth } from '@/services/api';

interface Props {
  children: React.ReactNode;
}

type State = 'checking' | 'authorized' | 'unauthorized' | 'authorizing' | 'error';

export function AuthGate({ children }: Props) {
  const [state, setState] = useState<State>('checking');
  const [errorMsg, setErrorMsg] = useState('');

  const checkAuth = useCallback(async () => {
    const status = await getAuthStatus();
    setState(status.authorized ? 'authorized' : 'unauthorized');
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // Poll for auth completion while in authorizing state
  useEffect(() => {
    if (state !== 'authorizing') return;
    const interval = setInterval(async () => {
      const status = await getAuthStatus();
      if (status.authorized) {
        clearInterval(interval);
        setState('authorized');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [state]);

  const handleConnect = async () => {
    setState('authorizing');
    setErrorMsg('');
    try {
      await startAuth();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to start authorization');
      setState('error');
    }
  };

  if (state === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.blue} size="large" />
      </View>
    );
  }

  if (state === 'authorized') {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>✦</Text>
        <Text style={styles.title}>Connect Health Records</Text>
        <Text style={styles.body}>
          HealthCompanion needs access to your Epic health records to give you
          personalized guidance.{'\n\n'}
          Tap below to sign in with your hospital's patient portal.
        </Text>

        {state === 'authorizing' ? (
          <>
            <ActivityIndicator color={Colors.blue} style={styles.spinner} />
            <Text style={styles.hint}>
              A browser window has opened on the server.{'\n'}
              Sign in with your Epic credentials, then return here.
            </Text>
          </>
        ) : (
          <>
            {state === 'error' && (
              <Text style={styles.error}>{errorMsg}</Text>
            )}
            <TouchableOpacity style={styles.btn} onPress={handleConnect}>
              <Text style={styles.btnText}>Connect Epic Health Records</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={() => setState('authorized')}>
              <Text style={styles.skipText}>Skip for now (demo mode)</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, padding: 24 },
  card: {
    width: '100%', maxWidth: 360,
    backgroundColor: Colors.bgCard, borderRadius: 20,
    padding: 28, alignItems: 'center', gap: 14,
  },
  icon: { fontSize: 40, color: Colors.blue },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  body: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  spinner: { marginVertical: 8 },
  hint: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center', lineHeight: 19 },
  error: { fontSize: 13, color: '#ff453a', textAlign: 'center' },
  btn: {
    width: '100%', backgroundColor: Colors.blue,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skipBtn: { paddingVertical: 8 },
  skipText: { fontSize: 13, color: Colors.textTertiary },
});
