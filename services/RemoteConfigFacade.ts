import { getApp } from '@react-native-firebase/app';
import { remoteConfigService, RemoteConfigParams } from './RemoteConfigService';

/**
 * RemoteConfigFacade
 * Provides a safe, lazy-initialized facade around RemoteConfigService so
 * consumers can obtain defaults immediately and initialization happens
 * asynchronously.
 */
class RemoteConfigFacade {
  private initialized = false;

  getParams(): RemoteConfigParams {
    return remoteConfigService.getParams();
  }

  async initIfNeeded(): Promise<void> {
    if (this.initialized) return;
    try {
      const firebaseApp = getApp();
      await remoteConfigService.initialize(firebaseApp);
      this.initialized = true;
    } catch (err) {
      // Swallow; service has defaults and fetch retry logic.
    }
  }

  async fetchAndActivateSafely(): Promise<boolean> {
    try {
      await this.initIfNeeded();
      return await remoteConfigService.fetchAndActivate();
    } catch (err) {
      return false;
    }
  }
}

export const remoteConfigFacade = new RemoteConfigFacade();

export default remoteConfigFacade;


