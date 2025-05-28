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
    const onReady = () => {
      // This will be called once the navigation container is ready
      const initialRoute = navigationRef.getCurrentRoute();
      if (initialRoute?.name) {
        const screenParams = {
          screen_name: initialRoute.name,
          screen_class: initialRoute.name,
        } as const;
        analyticsService.logScreenView(screenParams);
        routeNameRef.current = initialRoute.name;
        if (__DEV__) {
          console.log(`[Analytics] Initial screen view tracked (onReady): ${initialRoute.name}`);
        }
      }
    };

    const onStateChange = () => {
      if (!navigationRef.isReady()) {
        // Don't do anything if the navigator is not yet ready
        return;
      }
      const previousRouteName = routeNameRef.current;
      const currentRouteName = navigationRef.getCurrentRoute()?.name;

      if (previousRouteName !== currentRouteName && currentRouteName) {
        const screenParams: ScreenViewAnalyticsParams = {
          screen_name: currentRouteName,
          screen_class: currentRouteName,
        };
        analyticsService.logScreenView(screenParams);
        if (__DEV__) {
          console.log(`[Analytics] Screen view tracked (onStateChange): ${currentRouteName}`);
        }
      }
      routeNameRef.current = currentRouteName;
    };

    // Add listener for when the navigator is ready
    // The 'state' event might fire before 'ready', so listening to 'ready' for initial tracking is safer.
    // However, 'ready' is not a standard event on navigationRef directly.
    // Instead, we rely on NavigationContainer's onReady in App.tsx for the *very first* screen.
    // For subsequent state changes after ready, onStateChange will work.

    // We need to ensure that the initial screen is logged *after* the navigator is ready.
    // The App.tsx onReady callback now handles DeepLinkHandler init.
    // useScreenTracking is primarily for ongoing screen changes and initial load if ready.

    if (navigationRef.isReady()) {
      // If already ready when this effect runs, log initial screen
      onReady();
    }
    // else onReady will be called by NavigationContainer in App.tsx, or we can listen for a ready event if available.
    // For now, we'll rely on isReady() check.

    const unsubscribeState = navigationRef.addListener('state', onStateChange);

    return () => {
      unsubscribeState?.();
    };
  }, [navigationRef]);

  return navigationRef;
};
