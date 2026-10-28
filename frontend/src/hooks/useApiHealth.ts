import { useEffect, useState } from 'react';
import { getApiHealth } from '../services/api';
import type { ApiHealth } from '../types/api';

export function useApiHealth() {
  const [status, setStatus] = useState<ApiHealth['status'] | 'loading'>('loading');
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getApiHealth()
      .then(({ status: apiStatus }) => {
        if (active) setStatus(apiStatus);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => { active = false; };
  }, []);

  return { status, error };
}
