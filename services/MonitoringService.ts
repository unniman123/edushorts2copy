import { NOTIFICATION_CONFIG } from '../constants/config';
import type { NotificationType, DeliveryStatus } from '../constants/config';
import { supabase } from '../utils/supabase';

interface NotificationMetrics {
  deliveryStats: {
    totalSent: number;
    delivered: number;
    failed: number;
    retried: number;
  };
  
  tokenHealth: {
    validTokens: number;
    expiredTokens: number;
    refreshAttempts: number;
    refreshSuccess: number;
  };
  
  syncStatus: {
    lastSyncTime: Date;
    pendingUpdates: number;
    failedSync: number;
    retryCount: number;
  };
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'failed';
  timestamp: Date;
  details: {
    expo: boolean;
    adminPanel: boolean;
    database: boolean;
  };
}

interface HealthIssue {
  type: 'error' | 'warning';
  component: 'expo' | 'admin-panel' | 'database' | 'notification';
  message: string;
  timestamp: Date;
}

class MonitoringService {
  private static instance: MonitoringService;
  private metrics: NotificationMetrics;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.metrics = {
      deliveryStats: {
        totalSent: 0,
        delivered: 0,
        failed: 0,
        retried: 0
      },
      tokenHealth: {
        validTokens: 0,
        expiredTokens: 0,
        refreshAttempts: 0,
        refreshSuccess: 0
      },
      syncStatus: {
        lastSyncTime: new Date(),
        pendingUpdates: 0,
        failedSync: 0,
        retryCount: 0
      }
    };
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async initialize(): Promise<void> {
    await this.loadInitialMetrics();
    this.startHealthChecks();
  }

  private async loadInitialMetrics(): Promise<void> {
    try {
      // Load metrics from persistent storage if available
      const { data, error } = await supabase
        .from('monitoring_metrics')
        .select('*')
        .single();

      if (data && !error) {
        this.metrics = {
          ...this.metrics,
          ...data
        };
      }
    } catch (error) {
      console.error('Failed to load initial metrics:', error);
    }
  }

  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(
      async () => {
        await this.performHealthCheck();
      },
      NOTIFICATION_CONFIG.monitoring.healthCheckInterval
    );
  }

  async checkExpoConnection(): Promise<boolean> {
    try {
      const response = await fetch(NOTIFICATION_CONFIG.expo.apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${NOTIFICATION_CONFIG.expo.accessToken}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Expo connection check failed:', error);
      return false;
    }
  }

  async validateAdminPanelSync(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .select('count', { count: 'exact' })
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Admin panel sync validation failed:', error);
      return false;
    }
  }

  async verifyDatabaseConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('ping');
      return !error;
    } catch (error) {
      console.error('Database connection verification failed:', error);
      return false;
    }
  }

  private async performHealthCheck(): Promise<HealthCheckResult> {
    const details = {
      expo: await this.checkExpoConnection(),
      adminPanel: await this.validateAdminPanelSync(),
      database: await this.verifyDatabaseConnection()
    };

    const status = this.determineHealthStatus(details);
    const result = {
      status,
      timestamp: new Date(),
      details
    };

    await this.handleHealthCheckResult(result);
    return result;
  }

  private determineHealthStatus(details: HealthCheckResult['details']): HealthCheckResult['status'] {
    const services = Object.values(details);
    const failedCount = services.filter(status => !status).length;

    if (failedCount === 0) return 'healthy';
    if (failedCount < services.length) return 'degraded';
    return 'failed';
  }

  private async handleHealthCheckResult(result: HealthCheckResult): Promise<void> {
    if (result.status !== 'healthy') {
      const issues = this.generateHealthIssues(result);
      await this.alertOnCriticalIssues(issues);
    }
  }

  private generateHealthIssues(result: HealthCheckResult): HealthIssue[] {
    const issues: HealthIssue[] = [];
    const timestamp = new Date();

    if (!result.details.expo) {
      issues.push({
        type: 'error',
        component: 'expo',
        message: 'Expo service connection failed',
        timestamp
      });
    }

    if (!result.details.adminPanel) {
      issues.push({
        type: 'error',
        component: 'admin-panel',
        message: 'Admin panel sync failed',
        timestamp
      });
    }

    if (!result.details.database) {
      issues.push({
        type: 'error',
        component: 'database',
        message: 'Database connection failed',
        timestamp
      });
    }

    return issues;
  }

  async alertOnCriticalIssues(issues: HealthIssue[]): Promise<void> {
    try {
      await supabase
        .from('monitoring_alerts')
        .insert(issues.map(issue => ({
          type: issue.type,
          component: issue.component,
          message: issue.message,
          created_at: issue.timestamp
        })));
    } catch (error) {
      console.error('Failed to store monitoring alerts:', error);
    }
  }

  async updateMetrics(updates: Partial<NotificationMetrics>): Promise<void> {
    this.metrics = {
      ...this.metrics,
      ...updates
    };

    try {
      await supabase
        .from('monitoring_metrics')
        .upsert([{
          ...this.metrics,
          updated_at: new Date()
        }]);
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }

  async generateHealthReport(): Promise<{
    metrics: NotificationMetrics;
    lastHealthCheck: HealthCheckResult;
  }> {
    const lastHealthCheck = await this.performHealthCheck();
    return {
      metrics: this.metrics,
      lastHealthCheck
    };
  }

  cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export default MonitoringService;
