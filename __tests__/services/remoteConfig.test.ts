import remoteConfig from '@react-native-firebase/remote-config';
import { remoteConfigService } from '../../services/RemoteConfigService';

jest.mock('@react-native-firebase/remote-config', () => {
  const mockFn = jest.fn(() => ({
    setDefaults: jest.fn().mockResolvedValue(undefined),
    setConfigSettings: jest.fn().mockResolvedValue(undefined),
    fetchAndActivate: jest.fn().mockResolvedValue(true),
    getValue: jest.fn(),
    getBoolean: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
  }));
  return Object.assign(mockFn, { mockFn });
});

type MockRemoteConfig = {
  setDefaults: jest.Mock;
  setConfigSettings: jest.Mock;
  fetchAndActivate: jest.Mock;
  getValue: jest.Mock;
  getBoolean: jest.Mock;
  getString: jest.Mock;
  getNumber: jest.Mock;
};

const mockFirebaseConfig = remoteConfig() as unknown as MockRemoteConfig;

describe('RemoteConfigService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize remote config with default values', async () => {
      await remoteConfigService.initialize();

      expect(mockFirebaseConfig.setDefaults).toHaveBeenCalledWith({
        article_layout: 'default',
        show_related_articles: true,
        max_summary_length: 280,
        show_source_icon: true,
        enable_sharing: true,
        categories_per_row: 2
      });
    });

    it('should set development config settings in dev mode', async () => {
      const prevNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await remoteConfigService.initialize();

      expect(mockFirebaseConfig.setConfigSettings).toHaveBeenCalledWith({
        minimumFetchIntervalMillis: 0,
      });

      process.env.NODE_ENV = prevNodeEnv;
    });

    it('should set production config settings in prod mode', async () => {
      const prevNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await remoteConfigService.initialize();

      expect(mockFirebaseConfig.setConfigSettings).toHaveBeenCalledWith({
        minimumFetchIntervalMillis: 3600000, // 1 hour
      });

      process.env.NODE_ENV = prevNodeEnv;
    });

    it('should not initialize multiple times', async () => {
      await remoteConfigService.initialize();
      await remoteConfigService.initialize();

      expect(mockFirebaseConfig.setDefaults).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchAndActivate', () => {
    it('should fetch and activate new values', async () => {
      const result = await remoteConfigService.fetchAndActivate();

      expect(mockFirebaseConfig.fetchAndActivate).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle fetch and activate errors', async () => {
      const error = new Error('Network error');
      mockFirebaseConfig.fetchAndActivate.mockRejectedValueOnce(error);

      await expect(remoteConfigService.fetchAndActivate()).rejects.toThrow(error);
    });
  });

  describe('getValue', () => {
    it('should get string value correctly', () => {
      mockFirebaseConfig.getString.mockReturnValueOnce('compact');
      const value = remoteConfigService.getValue('article_layout');
      expect(value).toBe('compact');
    });

    it('should get boolean value correctly', () => {
      mockFirebaseConfig.getBoolean.mockReturnValueOnce(false);
      const value = remoteConfigService.getValue('show_source_icon');
      expect(value).toBe(false);
    });

    it('should get number value correctly', () => {
      mockFirebaseConfig.getNumber.mockReturnValueOnce(150);
      const value = remoteConfigService.getValue('max_summary_length');
      expect(value).toBe(150);
    });
  });

  describe('getParams', () => {
    it('should return all config parameters', () => {
      mockFirebaseConfig.getString.mockReturnValueOnce('compact');
      mockFirebaseConfig.getBoolean.mockReturnValueOnce(true);
      mockFirebaseConfig.getNumber.mockReturnValueOnce(280);

      const params = remoteConfigService.getParams();

      expect(params).toEqual(expect.objectContaining({
        article_layout: 'compact',
        show_related_articles: true,
        max_summary_length: 280,
      }));
    });
  });
});
