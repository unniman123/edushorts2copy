import { supabase } from '../utils/supabase';

interface PerformanceMetric {
  type: 'network' | 'render' | 'interaction';
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ErrorEvent {
  type: 'api' | 'render' | 'runtime';
  message: string;
  stack?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorEvent[] = [];
  private batchSize: number = 10;
  private flushInterval: number = 60000; // 1 minute
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.setupPeriodicFlush();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private setupPeriodicFlush(): void {
    // Clear existing timer if any
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  async trackPerformance(metric: Omit<PerformanceMetric, 'timestamp'>): Promise<void> {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(fullMetric);

    if (this.metrics.length >= this.batchSize) {
      await this.flush();
    }
  }

  async trackError(error: Omit<ErrorEvent, 'timestamp'>): Promise<void> {
    const fullError: ErrorEvent = {
      ...error,
      timestamp: Date.now(),
    };

    this.errors.push(fullError);

    // Flush immediately for critical runtime errors or when batch size is reached
    if (error.type === 'runtime' || this.errors.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    try {
      // Send metrics
      if (this.metrics.length > 0) {
        const metricsToSend = [...this.metrics];
        this.metrics = [];
        await this.sendMetrics(metricsToSend);
      }

      // Send errors
      if (this.errors.length > 0) {
        const errorsToSend = [...this.errors];
        this.errors = [];
        await this.sendErrors(errorsToSend);
      }
    } catch (error) {
      console.error('Failed to flush monitoring data:', error);
      // Re-queue failed items
      if (this.metrics.length + this.errors.length > 1000) {
        // Prevent memory leaks by limiting queue size
        this.metrics = [];
        this.errors = [];
        console.error('Monitoring queue limit exceeded. Clearing queues.');
      }
    }
  }

  private async sendMetrics(metrics: PerformanceMetric[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert(metrics.map(metric => ({
          type: metric.type,
          name: metric.name,
          duration: metric.duration,
          timestamp: new Date(metric.timestamp).toISOString(),
          metadata: metric.metadata,
        })));

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // Re-queue failed metrics if within limit
      if (this.metrics.length + metrics.length <= 1000) {
        this.metrics.push(...metrics);
      }
    }
  }

  private async sendErrors(errors: ErrorEvent[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_events')
        .insert(errors.map(error => ({
          type: error.type,
          message: error.message,
          stack: error.stack,
          timestamp: new Date(error.timestamp).toISOString(),
          metadata: error.metadata,
        })));

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send errors:', error);
      // Re-queue failed errors if within limit
      if (this.errors.length + errors.length <= 1000) {
        this.errors.push(...errors);
      }
    }
  }

  // Utility methods for common performance tracking scenarios
  async trackNetworkRequest(name: string, duration: number, metadata?: Record<string, any>): Promise<void> {
    await this.trackPerformance({
      type: 'network',
      name,
      duration,
      metadata,
    });
  }

  async trackRenderTime(name: string, duration: number, metadata?: Record<string, any>): Promise<void> {
    await this.trackPerformance({
      type: 'render',
      name,
      duration,
      metadata,
    });
  }

  async trackInteraction(name: string, duration: number, metadata?: Record<string, any>): Promise<void> {
    await this.trackPerformance({
      type: 'interaction',
      name,
      duration,
      metadata,
    });
  }

  // Memory management
  cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

export const monitoringService = MonitoringService.getInstance();
