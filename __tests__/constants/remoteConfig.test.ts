import { ArticleLayout, RemoteConfigParams } from '../../services/RemoteConfigService';
import {
  REMOTE_CONFIG_DEFAULTS,
  REMOTE_CONFIG_INTERVALS,
  validateRemoteConfig
} from '../../constants/remoteConfig';

describe('Remote Config Constants', () => {
  const expectedDefaults: RemoteConfigParams = {
    article_layout: 'default' as ArticleLayout,
    categories_per_row: 2,
    max_summary_length: 280,
    show_source_icon: true,
    show_related_articles: true,
    enable_sharing: true,
  };

  it('should have correct default values', () => {
    expect(REMOTE_CONFIG_DEFAULTS).toEqual(expectedDefaults);
  });

  it('should have correct interval values', () => {
    expect(REMOTE_CONFIG_INTERVALS).toEqual({
      DEV: 0,
      PROD: 3600000, // 1 hour
    });
  });
});

describe('validateRemoteConfig', () => {
  const validConfig: RemoteConfigParams = {
    article_layout: 'default' as ArticleLayout,
    categories_per_row: 2,
    max_summary_length: 280,
    show_source_icon: true,
    show_related_articles: true,
    enable_sharing: true,
  };

  it('should validate correct config', () => {
    expect(validateRemoteConfig(validConfig)).toBe(true);
  });

  it('should validate compact layout', () => {
    const config = { ...validConfig, article_layout: 'compact' as ArticleLayout };
    expect(validateRemoteConfig(config)).toBe(true);
  });

  it('should reject invalid article layout', () => {
    const config = { ...validConfig, article_layout: 'invalid' as any };
    expect(validateRemoteConfig(config)).toBe(false);
  });

  it('should validate categories_per_row within range', () => {
    expect(validateRemoteConfig({ ...validConfig, categories_per_row: 1 })).toBe(true);
    expect(validateRemoteConfig({ ...validConfig, categories_per_row: 4 })).toBe(true);
    expect(validateRemoteConfig({ ...validConfig, categories_per_row: 0 })).toBe(false);
    expect(validateRemoteConfig({ ...validConfig, categories_per_row: 5 })).toBe(false);
  });

  it('should validate max_summary_length within range', () => {
    expect(validateRemoteConfig({ ...validConfig, max_summary_length: 100 })).toBe(true);
    expect(validateRemoteConfig({ ...validConfig, max_summary_length: 500 })).toBe(true);
    expect(validateRemoteConfig({ ...validConfig, max_summary_length: 99 })).toBe(false);
    expect(validateRemoteConfig({ ...validConfig, max_summary_length: 501 })).toBe(false);
  });

  it('should validate boolean values', () => {
    // Test show_source_icon
    expect(validateRemoteConfig({ ...validConfig, show_source_icon: false })).toBe(true);
    expect(validateRemoteConfig({ ...validConfig, show_source_icon: 'true' as any })).toBe(false);

    // Test show_related_articles
    expect(validateRemoteConfig({ ...validConfig, show_related_articles: false })).toBe(true);
    expect(validateRemoteConfig({ ...validConfig, show_related_articles: 1 as any })).toBe(false);

    // Test enable_sharing
    expect(validateRemoteConfig({ ...validConfig, enable_sharing: false })).toBe(true);
    expect(validateRemoteConfig({ ...validConfig, enable_sharing: null as any })).toBe(false);
  });

  it('should handle undefined or null config', () => {
    expect(validateRemoteConfig(undefined as any)).toBe(false);
    expect(validateRemoteConfig(null as any)).toBe(false);
  });

  it('should handle partial config', () => {
    const partialConfig = {
      article_layout: 'default' as ArticleLayout,
      categories_per_row: 2,
      // Missing required properties should cause validation to fail
    } as unknown as RemoteConfigParams;
    expect(validateRemoteConfig(partialConfig)).toBe(false);
  });
});
