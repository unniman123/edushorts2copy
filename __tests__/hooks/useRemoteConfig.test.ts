import { renderHook, act } from '@testing-library/react-native';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import { remoteConfigService, RemoteConfigParams } from '../../services/RemoteConfigService';

// Mock the RemoteConfigService
jest.mock('../../services/RemoteConfigService', () => ({
  remoteConfigService: {
    initialize: jest.fn(),
    getParams: jest.fn(),
    fetchAndActivate: jest.fn(),
    getValue: jest.fn()
  }
}));

describe('useRemoteConfig', () => {
  const mockDefaultConfig: RemoteConfigParams = {
    article_layout: 'default',
    show_related_articles: true,
    max_summary_length: 280,
    show_source_icon: true,
    enable_sharing: true,
    categories_per_row: 2
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock implementation
    (remoteConfigService.getParams as jest.Mock).mockReturnValue(mockDefaultConfig);
    (remoteConfigService.initialize as jest.Mock).mockResolvedValue(undefined);
    (remoteConfigService.fetchAndActivate as jest.Mock).mockResolvedValue(true);
  });

  it('should initialize with default config values', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRemoteConfig());

    // Initial state should be loading
    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    // After initialization
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.config).toEqual(mockDefaultConfig);
  });

  it('should handle initialization error', async () => {
    const error = new Error('Failed to initialize');
    (remoteConfigService.initialize as jest.Mock).mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => useRemoteConfig());

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(error);
    expect(result.current.config).toEqual(mockDefaultConfig); // Should still have default values
  });

  it('should refresh config when calling refreshConfig', async () => {
    const updatedConfig = {
      ...mockDefaultConfig,
      article_layout: 'compact'
    };

    (remoteConfigService.getParams as jest.Mock)
      .mockReturnValueOnce(mockDefaultConfig)
      .mockReturnValueOnce(updatedConfig);

    const { result, waitForNextUpdate } = renderHook(() => useRemoteConfig());

    await waitForNextUpdate();

    // Initial config
    expect(result.current.config).toEqual(mockDefaultConfig);

    // Refresh config
    await act(async () => {
      await result.current.refreshConfig();
    });

    // Should have updated config
    expect(result.current.config).toEqual(updatedConfig);
  });

  it('should handle refresh error', async () => {
    const error = new Error('Failed to refresh');
    (remoteConfigService.fetchAndActivate as jest.Mock).mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => useRemoteConfig());

    await waitForNextUpdate();

    await act(async () => {
      const updated = await result.current.refreshConfig();
      expect(updated).toBe(false);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should get specific config value using getValue', async () => {
    (remoteConfigService.getValue as jest.Mock).mockImplementation((key: keyof RemoteConfigParams) => mockDefaultConfig[key]);

    const { result, waitForNextUpdate } = renderHook(() => useRemoteConfig());

    await waitForNextUpdate();

    const layout = result.current.getValue('article_layout');
    expect(layout).toBe('default');

    const maxLength = result.current.getValue('max_summary_length');
    expect(maxLength).toBe(280);
  });
});
