import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {HealthStatus} from '../hooks/useHealth';

type Props = {
  status: HealthStatus;
  onRetry: () => void;
};

export function HealthCard({status, onRetry}: Props) {
  return (
    <View style={styles.card}>
      {status === 'checking' ? (
        <ActivityIndicator style={styles.status} />
      ) : (
        <Text style={[styles.status, status === 'ok' ? styles.ok : styles.bad]}>
          backend: {status}
        </Text>
      )}

      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Re-check</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {alignItems: 'center', gap: 12},
  status: {fontSize: 18, marginTop: 8},
  ok: {color: '#1a7f37'},
  bad: {color: '#cf222e'},
  button: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0969da',
    borderRadius: 8,
  },
  buttonText: {color: '#fff', fontWeight: '600'},
});
