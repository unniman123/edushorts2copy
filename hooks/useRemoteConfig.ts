import { useState, useEffect } from 'react';
import { remoteConfigService, RemoteConfigParams } from '../services/RemoteConfigService';

export function useRemoteConfig() {
  const [config, setConfig] = useState<RemoteConfigParams>(remoteConfigService.getParams());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeConfig = async () => {
      try {
        setLoading(true);
        await remoteConfigService.initialize();
        setConfig(remoteConfigService.getParams());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize remote config'));
        // Use default values in case of error
        setConfig(remoteConfigService.getParams());
      } finally {
        setLoading(false);
      }
    };

    initializeConfig();
  }, []);

  const refreshConfig = async () => {
    try {
      setLoading(true);
      const updated = await remoteConfigService.fetchAndActivate();
      if (updated) {
        setConfig(remoteConfigService.getParams());
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh remote config'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getValue = <T extends keyof RemoteConfigParams>(key: T): RemoteConfigParams[T] => {
    return remoteConfigService.getValue(key);
  };

  return {
    config,
    loading,
    error,
    refreshConfig,
    getValue
  };
}
