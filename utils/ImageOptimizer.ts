import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PerformanceMonitoringService from '../services/PerformanceMonitoringService';

interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxAge: number; // Maximum age of cached items in milliseconds
  maxItems: number; // Maximum number of items in cache
}

interface CachedImage {
  uri: string;
  timestamp: number;
  size: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxItems: 100,
};

class ImageOptimizer {
  private static instance: ImageOptimizer;
  private cache: Map<string, CachedImage> = new Map();
  private config: CacheConfig;
  private totalCacheSize: number = 0;
  private performanceMonitor: PerformanceMonitoringService;

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.performanceMonitor = PerformanceMonitoringService.getInstance();
    this.initializeCache();
  }

  static getInstance(config?: Partial<CacheConfig>): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer(config);
    }
    return ImageOptimizer.instance;
  }

  private async initializeCache(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem('image_cache');
      if (cachedData) {
        const parsedCache = JSON.parse(cachedData);
        this.cache = new Map(Object.entries(parsedCache));
        this.updateTotalCacheSize();
      }
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  private updateTotalCacheSize(): void {
    this.totalCacheSize = Array.from(this.cache.values())
      .reduce((total, item) => total + item.size, 0);
  }

  private async persistCache(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem('image_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Failed to persist image cache:', error);
    }
  }

  async preloadImage(uri: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Get image size before downloading
      const imageSize = await this.getImageSize(uri);
      
      // Check if we need to clear space in cache
      await this.ensureCacheSpace(imageSize);
      
      // Prefetch the image
      await Image.prefetch(uri);
      
      const loadTime = Date.now() - startTime;
      
      // Record metrics
      this.performanceMonitor.recordImageLoad(uri, loadTime, imageSize);
      
      // Update cache
      this.cache.set(uri, {
        uri,
        timestamp: Date.now(),
        size: imageSize,
      });
      
      this.totalCacheSize += imageSize;
      await this.persistCache();
      
    } catch (error) {
      console.error(`Failed to preload image ${uri}:`, error);
    }
  }

  private async getImageSize(uri: string): Promise<number> {
    try {
      const response = await fetch(uri, { method: 'HEAD' });
      const size = parseInt(response.headers.get('content-length') || '0', 10);
      return size;
    } catch (error) {
      console.error(`Failed to get image size for ${uri}:`, error);
      return 0;
    }
  }

  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    if (this.totalCacheSize + requiredSize <= this.config.maxSize) {
      return;
    }

    // Sort cache items by age
    const sortedItems = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    // Remove oldest items until we have enough space
    for (const [uri, item] of sortedItems) {
      this.cache.delete(uri);
      this.totalCacheSize -= item.size;

      if (this.totalCacheSize + requiredSize <= this.config.maxSize) {
        break;
      }
    }

    await this.persistCache();
  }

  private async cleanExpiredItems(): Promise<void> {
    const now = Date.now();
    const expired = Array.from(this.cache.entries())
      .filter(([, item]) => now - item.timestamp > this.config.maxAge);

    for (const [uri, item] of expired) {
      this.cache.delete(uri);
      this.totalCacheSize -= item.size;
    }

    if (expired.length > 0) {
      await this.persistCache();
    }
  }

  isImageCached(uri: string): boolean {
    return this.cache.has(uri);
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    this.totalCacheSize = 0;
    await AsyncStorage.removeItem('image_cache');
  }

  getCacheStats(): {
    size: number;
    itemCount: number;
    maxSize: number;
    maxItems: number;
  } {
    return {
      size: this.totalCacheSize,
      itemCount: this.cache.size,
      maxSize: this.config.maxSize,
      maxItems: this.config.maxItems,
    };
  }
}

export default ImageOptimizer;
