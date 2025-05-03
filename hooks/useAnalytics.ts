import { useEffect, useRef } from 'react';
import { useNavigationContainerRef } from '@react-navigation/native';
import { analyticsService } from '../services/AnalyticsService';
import { ScreenViewAnalyticsParams } from '../src/types/analytics';

/**
 * Hook to automatically track screen views and user navigation patterns.
 * 
 * Tracks:
 * - Initial screen view on app launch
 * - Screen transitions during navigation
 * - Maintains navigation history for analytics
 */
export const useScreenTracking = () => {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef<string | undefined>();

  useEffect(() => {
    const onStateChange = () => {
      const previousRouteName = routeNameRef.current;
      const currentRouteName = navigationRef.getCurrentRoute()?.name;

      if (previousRouteName !== currentRouteName && currentRouteName) {
        const screenParams: ScreenViewAnalyticsParams = {
          screen_name: currentRouteName,
          screen_class: currentRouteName
        };
        analyticsService.logScreenView(screenParams);
        if (__DEV__) {
          console.log(`[Analytics] Screen view tracked: ${currentRouteName}`);
        }
      }

      // Save the current route name for comparison on the next change
      routeNameRef.current = currentRouteName;
    };

    // Subscribe to navigation state changes
    const unsubscribe = navigationRef.addListener('state', onStateChange);

    // Log the initial screen view when the hook mounts
    const timer = setTimeout(() => {
      const initialRoute = navigationRef.getCurrentRoute();
      if (initialRoute?.name) {
        const screenParams = {
          screen_name: initialRoute.name,
          screen_class: initialRoute.name
        } as const;
        analyticsService.logScreenView(screenParams);
        routeNameRef.current = initialRoute.name;
        if (__DEV__) {
          console.log(`[Analytics] Initial screen view tracked: ${initialRoute.name}`);
        }
      }
    }, 500);

    // Cleanup function
    return () => {
      unsubscribe?.();
      clearTimeout(timer);
    };
  }, [navigationRef]);

  return navigationRef;
};
