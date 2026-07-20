/**
 * Synapse — bare React Native app shell (spine AD-2).
 * Verifies the runtime can reach the Gleam/BEAM backend health endpoint.
 *
 * @format
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

// ponytail: Android emulator maps host localhost to 10.0.2.2; iOS sim uses
// localhost. Add react-native-config here when a real backend URL is needed.
const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

type Health = 'checking' | 'ok' | 'unreachable';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [health, setHealth] = useState<Health>('checking');

  const checkHealth = useCallback(async () => {
    setHealth('checking');
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      setHealth(res.ok ? 'ok' : 'unreachable');
    } catch {
      setHealth('unreachable');
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Synapse</Text>
      <Text style={styles.subtitle}>{API_BASE_URL}</Text>

      {health === 'checking' ? (
        <ActivityIndicator style={styles.status} />
      ) : (
        <Text
          style={[
            styles.status,
            health === 'ok' ? styles.ok : styles.bad,
          ]}>
          backend: {health}
        </Text>
      )}

      <TouchableOpacity style={styles.button} onPress={checkHealth}>
        <Text style={styles.buttonText}>Re-check</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: { fontSize: 32, fontWeight: '700' },
  subtitle: { fontSize: 13, opacity: 0.6 },
  status: { fontSize: 18, marginTop: 8 },
  ok: { color: '#1a7f37' },
  bad: { color: '#cf222e' },
  button: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0969da',
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});

export default App;
