import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { RemoteConfigProvider, useRemoteConfigContext } from '../../context/RemoteConfigContext';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';

// Mock the useRemoteConfig hook
jest.mock('../../hooks/useRemoteConfig');

describe('RemoteConfigContext', () => {
  const mockConfig = {
    article_layout: 'default',
    show_related_articles: true,
    max_summary_length: 280,
    show_source_icon: true,
    enable_sharing: true,
    categories_per_row: 2
  };

  const mockHookReturn = {
    config: mockConfig,
    loading: false,
    error: null,
    refreshConfig: jest.fn().mockResolvedValue(true),
    getValue: jest.fn(<T extends keyof typeof mockConfig>(key: T) => mockConfig[key])
  };

  beforeEach(() => {
    (useRemoteConfig as jest.Mock).mockReturnValue(mockHookReturn);
  });

  it('provides remote config values to children', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RemoteConfigProvider>{children}</RemoteConfigProvider>
    );

    const { result } = renderHook(() => useRemoteConfigContext(), { wrapper });

    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('provides refresh functionality', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RemoteConfigProvider>{children}</RemoteConfigProvider>
    );

    const { result } = renderHook(() => useRemoteConfigContext(), { wrapper });

    await act(async () => {
      const refreshResult = await result.current.refreshConfig();
      expect(refreshResult).toBe(true);
    });

    expect(mockHookReturn.refreshConfig).toHaveBeenCalled();
  });

  it('provides getValue functionality', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RemoteConfigProvider>{children}</RemoteConfigProvider>
    );

    const { result } = renderHook(() => useRemoteConfigContext(), { wrapper });

    const layoutValue = result.current.getValue('article_layout');
    expect(layoutValue).toBe('default');

    const maxLength = result.current.getValue('max_summary_length');
    expect(maxLength).toBe(280);
  });

  it('throws error when used outside provider', () => {
    const { result } = renderHook(() => useRemoteConfigContext());

    expect(result.error).toEqual(
      Error('useRemoteConfigContext must be used within a RemoteConfigProvider')
    );
  });

  it('handles loading state', () => {
    (useRemoteConfig as jest.Mock).mockReturnValue({
      ...mockHookReturn,
      loading: true
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RemoteConfigProvider>{children}</RemoteConfigProvider>
    );

    const { result } = renderHook(() => useRemoteConfigContext(), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('handles error state', () => {
    const error = new Error('Test error');
    (useRemoteConfig as jest.Mock).mockReturnValue({
      ...mockHookReturn,
      error
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RemoteConfigProvider>{children}</RemoteConfigProvider>
    );

    const { result } = renderHook(() => useRemoteConfigContext(), { wrapper });

    expect(result.current.error).toBe(error);
  });
});
