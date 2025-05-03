import React, { createContext, useContext, ReactNode } from 'react';
import { useRemoteConfig } from '../hooks/useRemoteConfig';
import type { RemoteConfigParams } from '../services/RemoteConfigService';

type RemoteConfigContextType = {
  config: RemoteConfigParams;
  loading: boolean;
  error: Error | null;
  refreshConfig: () => Promise<boolean>;
  getValue: <T extends keyof RemoteConfigParams>(key: T) => RemoteConfigParams[T];
};

const RemoteConfigContext = createContext<RemoteConfigContextType | undefined>(undefined);

export function RemoteConfigProvider({ children }: { children: ReactNode }) {
  const remoteConfigState = useRemoteConfig();

  return (
    <RemoteConfigContext.Provider value={remoteConfigState}>
      {children}
    </RemoteConfigContext.Provider>
  );
}

export function useRemoteConfigContext() {
  const context = useContext(RemoteConfigContext);
  if (context === undefined) {
    throw new Error('useRemoteConfigContext must be used within a RemoteConfigProvider');
  }
  return context;
}
