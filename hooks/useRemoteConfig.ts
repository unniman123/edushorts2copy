/**
 * useRemoteConfig - Custom hook for managing Firebase Remote Config integration
 * 
 * Provides state management for Firebase Remote Config with initialization,
 * parameter fetching, and refresh functionality. Handles Firebase app dependency
 * and provides type-safe access to remote configuration parameters with proper
 * error handling and loading states.
 * 
 * @hook
 * @returns {UseRemoteConfigReturn} Object containing remote config state and methods
 * 
 * @example
 * const { config, loading, error, refreshConfig, getValue } = useRemoteConfig();
 * 
 * // Access specific config value
 * const featureEnabled = getValue('feature_flag_enabled');
 * 
 * // Refresh config manually
 * const handleRefresh = async () => {
 *   const updated = await refreshConfig();
 *   if (updated) {
 *     console.log('Config updated');
 *   }
 * };
 */
import { useState, useEffect } from 'react';
import { remoteConfigFacade } from '../services/RemoteConfigFacade';
import type { RemoteConfigParams } from '../services/RemoteConfigService';

/**
 * Return type for useRemoteConfig hook
 * @interface UseRemoteConfigReturn
 */
interface UseRemoteConfigReturn {
  /** Current remote config parameters */
  config: RemoteConfigParams;
  /** Loading state indicator */
  loading: boolean;
  /** Error state if any */
  error: Error | null;
  /** Function to refresh remote config from Firebase */
  refreshConfig: () => Promise<boolean>;
  /** Function to get specific config value by key */
  getValue: <T extends keyof RemoteConfigParams>(key: T) => RemoteConfigParams[T];
}

export function useRemoteConfig(): UseRemoteConfigReturn {
  const [config, setConfig] = useState<RemoteConfigParams>(remoteConfigFacade.getParams());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    /**
     * Initializes Firebase Remote Config service
     * Waits for Firebase app to be available and fetches initial config
     * @returns {Promise<void>} Promise that resolves when initialization is complete
     */
    const initializeConfig = async () => {
      try {
        setLoading(true);
        // Lazy initialize remote config non-blocking; provider will call init too.
        await remoteConfigFacade.initIfNeeded();
        setConfig(remoteConfigFacade.getParams());
        setError(null);
      } catch (err) {
        console.error('[useRemoteConfig] Initialization error:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize remote config'));
        // Use default values in case of error
        setConfig(remoteConfigFacade.getParams());
      } finally {
        setLoading(false);
      }
    };

    initializeConfig();
  }, []);

  /**
   * Refreshes remote config from Firebase
   * Fetches and activates new configuration values
   * @returns {Promise<boolean>} Promise that resolves to true if config was updated
   */
  const refreshConfig = async () => {
    try {
      setLoading(true);
      const updated = await remoteConfigFacade.fetchAndActivateSafely();
      if (updated) {
        setConfig(remoteConfigFacade.getParams());
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh remote config'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gets a specific remote config value by key
   * Provides type-safe access to configuration parameters
   * @template T - The key type from RemoteConfigParams
   * @param {T} key - The configuration key to retrieve
   * @returns {RemoteConfigParams[T]} The configuration value for the specified key
   */
  const getValue = <T extends keyof RemoteConfigParams>(key: T): RemoteConfigParams[T] => {
    const params = remoteConfigFacade.getParams();
    return params[key];
  };

  return {
    config,
    loading,
    error,
    refreshConfig,
    getValue
  };
}
