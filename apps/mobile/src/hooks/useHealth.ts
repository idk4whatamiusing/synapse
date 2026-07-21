import {useCallback, useEffect, useState} from 'react';
import {API_BASE_URL} from '../services/api';

export type HealthStatus = 'checking' | 'ok' | 'unreachable';

export function useHealth() {
  const [health, setHealth] = useState<HealthStatus>('checking');

  const check = useCallback(async () => {
    setHealth('checking');
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      setHealth(res.ok ? 'ok' : 'unreachable');
    } catch {
      setHealth('unreachable');
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return {health, check};
}
