import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthGate } from '@/components/AuthGate';

export default function RootLayout() {
  return (
    <AuthGate>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0c12' } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthGate>
  );
}
