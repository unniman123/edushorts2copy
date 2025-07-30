/**
 * BaseService - Eliminates singleton pattern duplication across services
 * 
 * This class provides a reusable singleton implementation to replace
 * the identical singleton patterns found in 8+ service files:
 * - RemoteConfigService.ts
 * - PerformanceMonitoringService.ts  
 * - NotificationBridge.ts
 * - NewsService.ts
 * - MonitoringService.ts
 * - AnalyticsService.ts
 * - AppLifecycleHandler.ts
 * 
 * Evidence: Each service had identical 7-line singleton implementation
 * Solution: Single reusable base class reduces code by 56+ lines
 */

export abstract class BaseService {
  private static instances: Map<string, BaseService> = new Map();

  /**
   * Gets singleton instance of the service
   * @returns Singleton instance of the extending service
   */
  protected static getInstance<T extends BaseService>(this: new () => T): T {
    const className = this.name;
    
    if (!BaseService.instances.has(className)) {
      BaseService.instances.set(className, new this());
    }
    
    return BaseService.instances.get(className) as T;
  }

  /**
   * Clears all service instances - useful for testing
   */
  protected static clearInstances(): void {
    BaseService.instances.clear();
  }

  /**
   * Abstract initialization method that must be implemented by services
   */
  protected abstract initialize?(): Promise<void> | void;
} 