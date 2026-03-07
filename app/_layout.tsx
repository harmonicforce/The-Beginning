import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSessionStore } from '../store/session';
import { useInventoryStore } from '../store/inventory';

export default function RootLayout() {
  const loadSession = useSessionStore((s) => s.loadSession);
  const loadItems = useInventoryStore((s) => s.loadItems);

  useEffect(() => {
    loadSession();
    loadItems();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#f4f4f5',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0a0a0a' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="intake/category" options={{ title: 'Select Category' }} />
        <Stack.Screen name="intake/protocol" options={{ title: 'Select Protocol' }} />
        <Stack.Screen name="intake/capture" options={{ title: 'Capture Photos' }} />
        <Stack.Screen name="intake/processing" options={{ headerShown: false }} />
        <Stack.Screen name="intake/result/[id]" options={{ title: 'Analysis Result' }} />
        <Stack.Screen name="item/[id]" options={{ title: 'Item Detail' }} />
        <Stack.Screen name="account" options={{ title: 'Account & Plan' }} />
      </Stack>
    </>
  );
}
