import { Platform, InteractionManager, NativeModules } from 'react-native';
import { getAnalytics, FirebaseAnalyticsTypes } from '@react-native-firebase/analytics';
import type { ReactNativeFirebase } from '@react-native-firebase/app';

interface PerformanceMetrics {
  timeToInteractive: number;
  imageLoadTime: number;
  initialRenderTime: number;
  memoryUsage: number;
  batteryImpact: number;
  networkLatency: number;
  apiResponseTimes: Record<string, number>;
  renderCount: number;
  interactionEvents: Array<{
    name: string;
    duration: number;
    timestamp: number;
  }>;
}

interface ImageLoadMetrics {
  url: string;
  loadTime: number;
  size: number;
  cached: boolean;
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private firebaseApp: ReactNativeFirebase.FirebaseApp | null = null;
  private analyticsInstance: FirebaseAnalyticsTypes.Module | null = null;
  private metrics: PerformanceMetrics = {
    timeToInteractive: 0,
    imageLoadTime: 0,
    initialRenderTime: 0,
    memoryUsage: 0,
    batteryImpact: 0,
    networkLatency: 0,
    apiResponseTimes: {},
    renderCount: 0,
    interactionEvents: [],
  };

  private imageMetrics: Map<string, ImageLoadMetrics> = new Map();
  private startTime: number = 0;
  private isMonitoring: boolean = false;

  private constructor() {
    this.startTime = Date.now();
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Initializes the PerformanceMonitoringService with the Firebase App instance.
   * This MUST be called before any methods that rely on Firebase Analytics.
   * @param app The FirebaseApp instance.
   */
  async initialize(app: ReactNativeFirebase.FirebaseApp): Promise<void> {
    this.firebaseApp = app;
    this.analyticsInstance = getAnalytics(app);
    
    if (__DEV__) {
      console.log('[PerformanceMonitoringService] Initialized with Firebase App.');
    }
  }

  // Helper to ensure analytics instance is available
  private getAnalyticsInstance(): FirebaseAnalyticsTypes.Module {
    if (!this.analyticsInstance) {
      console.error('[PerformanceMonitoring] Error: PerformanceMonitoringService not initialized. Call initialize() first.');
      throw new Error('PerformanceMonitoringService not initialized.');
    }
    return this.analyticsInstance;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startTime = Date.now();
    this.monitorMemoryUsage();
    this.monitorBatteryImpact();
    this.monitorNetworkLatency();
  }

  private async monitorMemoryUsage(): Promise<void> {
    if (!this.isMonitoring) return;

    try {
      if (Platform.OS === 'android' && NativeModules.PerformanceMonitor) {
        const memoryInfo = await NativeModules.PerformanceMonitor.getMemoryInfo();
        this.metrics.memoryUsage = memoryInfo.usedMemory;
      } else {
        // Fallback for iOS or when NativeModule is not available in test environment
        if (typeof process !== 'undefined' && process.memoryUsage) {
          const memoryUsage = process.memoryUsage();
          this.metrics.memoryUsage = memoryUsage.heapUsed;
        } else {
          this.metrics.memoryUsage = 0; // Or some other default/mock value
        }
      }
    } catch (error) {
      console.error('Failed to monitor memory usage:', error);
      this.metrics.memoryUsage = 0; // Ensure a value in case of error
    }

    // Continue monitoring every 5 seconds
    if (this.isMonitoring) {
        setTimeout(() => this.monitorMemoryUsage(), 5000);
    }
  }

  private async monitorBatteryImpact(): Promise<void> {
    if (!this.isMonitoring) return;

    try {
      if (Platform.OS === 'android' && NativeModules.PerformanceMonitor) {
        const batteryInfo = await NativeModules.PerformanceMonitor.getBatteryInfo();
        this.metrics.batteryImpact = batteryInfo.consumption;
      } else {
        this.metrics.batteryImpact = 0; // Mock or default value
      }
    } catch (error) {
      console.error('Failed to monitor battery impact:', error);
      this.metrics.batteryImpact = 0; // Ensure a value in case of error
    }

    // Continue monitoring every minute
    if (this.isMonitoring) {
        setTimeout(() => this.monitorBatteryImpact(), 60000);
    }
  }

  private async monitorNetworkLatency(): Promise<void> {
    if (!this.isMonitoring) return;

    try {
      const start = Date.now();
      await fetch('https://www.google.com/generate_204'); // Simple ping endpoint
      this.metrics.networkLatency = Date.now() - start;
    } catch (error) {
      // In test environments, fetch might be mocked or fail. Handle gracefully.
      console.warn('Failed to measure network latency:', error);
      this.metrics.networkLatency = -1; // Indicate failure or mock value
    }

    // Continue monitoring every 30 seconds
    if (this.isMonitoring) {
        setTimeout(() => this.monitorNetworkLatency(), 30000);
    }
  }

  recordImageLoad(url: string, loadTime: number, size: number, cached: boolean = false): void {
    this.imageMetrics.set(url, { url, loadTime, size, cached });
    this.updateAverageImageLoadTime();
  }

  recordApiCall(endpoint: string, responseTime: number): void {
    this.metrics.apiResponseTimes[endpoint] = responseTime;
  }

  recordInteraction(name: string, duration: number): void {
    this.metrics.interactionEvents.push({
      name,
      duration,
      timestamp: Date.now()
    });
  }

  recordRender(): void {
    this.metrics.renderCount++;
  }

  private updateAverageImageLoadTime(): void {
    if (this.imageMetrics.size === 0) {
        this.metrics.imageLoadTime = 0;
        return;
    }
    const loadTimes = Array.from(this.imageMetrics.values()).map(m => m.loadTime);
    this.metrics.imageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
  }

  recordTimeToInteractive(): void {
    this.metrics.timeToInteractive = Date.now() - this.startTime;
    InteractionManager.runAfterInteractions(() => {
      this.logMetricsToAnalytics();
    });
  }

  setInitialRenderTime(time: number): void {
    this.metrics.initialRenderTime = time;
  }

  private async logMetricsToAnalytics(): Promise<void> {
    try {
      await this.getAnalyticsInstance().logEvent('app_performance_metrics', {
        ...this.metrics,
        imageMetrics: Array.from(this.imageMetrics.values()),
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to log performance metrics:', error);
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getImageMetrics(): Map<string, ImageLoadMetrics> {
    return new Map(this.imageMetrics);
  }

  reset(): void {
    this.metrics = {
      timeToInteractive: 0,
      imageLoadTime: 0,
      initialRenderTime: 0,
      memoryUsage: 0,
      batteryImpact: 0,
      networkLatency: 0,
      apiResponseTimes: {},
      renderCount: 0,
      interactionEvents: [],
    };
    this.imageMetrics.clear();
    this.startTime = Date.now();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    // Clear any pending timeouts
    // This requires storing timeout IDs, which adds complexity.
    // For Jest tests, jest.clearAllTimers() in afterEach should suffice.
  }
}

export default PerformanceMonitoringService;
