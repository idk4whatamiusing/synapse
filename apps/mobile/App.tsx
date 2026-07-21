/**
 * Synapse — bare React Native app shell (spine AD-2).
 *
 * @format
 */

import React from 'react';
import {Platform, StatusBar, StyleSheet, Text, useColorScheme, View} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useHealth} from './src/hooks/useHealth';
import {HealthCard} from './src/components/HealthCard';

const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

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
  const {health, check} = useHealth();

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <Text style={styles.title}>Synapse</Text>
      <Text style={styles.subtitle}>{API_BASE_URL}</Text>
      <HealthCard status={health} onRetry={check} />
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
  title: {fontSize: 32, fontWeight: '700'},
  subtitle: {fontSize: 13, opacity: 0.6},
});

export default App;
