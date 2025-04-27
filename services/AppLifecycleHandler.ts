import { AppState, AppStateStatus } from 'react-native';
import NotificationBridge from './NotificationBridge';
import MonitoringService from './MonitoringService';

class AppLifecycleHandler {
  private static instance: AppLifecycleHandler;
  private notificationBridge: NotificationBridge;
  private monitoringService: MonitoringService;
  private appState: AppStateStatus = AppState.currentState;
  private subscription: any;

  private constructor() {
    this.notificationBridge = NotificationBridge.getInstance();
    this.monitoringService = MonitoringService.getInstance();
  }

  static getInstance(): AppLifecycleHandler {
    if (!AppLifecycleHandler.instance) {
      AppLifecycleHandler.instance = new AppLifecycleHandler();
    }
    return AppLifecycleHandler.instance;
  }

  initialize(): void {
    this.subscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    try {
      // Handle transitions between states
      if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
        await this.onForeground();
      } else if (this.appState === 'active' && nextAppState.match(/inactive|background/)) {
        await this.onBackground();
      }

      this.appState = nextAppState;
    } catch (error) {
      console.error('Error handling app state change:', error);
      this.monitoringService.updateMetrics({
        syncStatus: {
          failedSync: this.monitoringService['metrics'].syncStatus.failedSync + 1,
          lastSyncTime: new Date(),
          pendingUpdates: 0,
          retryCount: 0
        }
      });
    }
  }

  private async onForeground(): Promise<void> {
    try {
      // Refresh notification token
      await this.handleTokenRefresh();
      
      // Sync notification status
      await this.syncNotificationStatus();
      
      // Clear notification badges
      await this.clearNotificationBadges();

      // Update monitoring metrics
      await this.monitoringService.updateMetrics({
        syncStatus: {
          lastSyncTime: new Date(),
          pendingUpdates: 0,
          failedSync: 0,
          retryCount: 0
        }
      });
    } catch (error) {
      console.error('Error handling foreground transition:', error);
      throw error;
    }
  }

  private async onBackground(): Promise<void> {
    try {
      // Perform any cleanup or state persistence needed
      await this.persistNotificationState();
    } catch (error) {
      console.error('Error handling background transition:', error);
      throw error;
    }
  }

  private async handleTokenRefresh(): Promise<void> {
    try {
      const token = await this.notificationBridge['getExpoToken']();
      if (token) {
        await this.monitoringService.updateMetrics({
          tokenHealth: {
            validTokens: this.monitoringService['metrics'].tokenHealth.validTokens + 1,
            expiredTokens: 0,
            refreshAttempts: this.monitoringService['metrics'].tokenHealth.refreshAttempts + 1,
            refreshSuccess: this.monitoringService['metrics'].tokenHealth.refreshSuccess + 1
          }
        });
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.monitoringService.updateMetrics({
        tokenHealth: {
          validTokens: this.monitoringService['metrics'].tokenHealth.validTokens,
          expiredTokens: this.monitoringService['metrics'].tokenHealth.expiredTokens + 1,
          refreshAttempts: this.monitoringService['metrics'].tokenHealth.refreshAttempts + 1,
          refreshSuccess: this.monitoringService['metrics'].tokenHealth.refreshSuccess
        }
      });
      throw error;
    }
  }

  private async syncNotificationStatus(): Promise<void> {
    try {
      // Sync any pending notification status updates
      // Implementation depends on your notification storage strategy
    } catch (error) {
      console.error('Error syncing notification status:', error);
      throw error;
    }
  }

  private async clearNotificationBadges(): Promise<void> {
    try {
      // Clear notification badges
      // Implementation depends on your platform
    } catch (error) {
      console.error('Error clearing notification badges:', error);
      throw error;
    }
  }

  private async persistNotificationState(): Promise<void> {
    try {
      // Persist any necessary notification state before going to background
      // Implementation depends on your storage strategy
    } catch (error) {
      console.error('Error persisting notification state:', error);
      throw error;
    }
  }

  cleanup(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
}

export default AppLifecycleHandler;
