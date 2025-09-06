/**
 * useAnalytics - Custom hooks for analytics tracking and screen navigation monitoring
 * 
 * Provides comprehensive analytics tracking functionality including automatic screen
 * view tracking, navigation pattern monitoring, and user journey analytics. Integrates
 * with Firebase Analytics through the analytics service and handles navigation state
 * changes with proper initialization and cleanup.
 * 
 * @fileoverview Analytics tracking hooks for React Navigation integration
 * @author Development Team
 * @version 1.0.0
 */
import { useEffect, useRef } from 'react';
import { useNavigationContainerRef } from '@react-navigation/native';
import { analyticsService } from '../services/AnalyticsService';
import { ScreenViewAnalyticsParams } from '../src/types/analytics';

/**
 * Return type for useScreenTracking hook
 * @interface UseScreenTrackingReturn
 */
interface UseScreenTrackingReturn {
  /** Navigation container reference for manual navigation control */
  navigationRef: ReturnType<typeof useNavigationContainerRef>;
}

/**
 * useScreenTracking - Custom hook for automatic screen view tracking
 * 
 * Automatically tracks screen views and user navigation patterns using React Navigation.
 * Monitors navigation state changes, handles initial screen tracking, and maintains
 * navigation history for analytics purposes. Integrates with Firebase Analytics
 * through the analytics service.
 * 
 * @hook
 * @returns {UseScreenTrackingReturn} Object containing navigation reference
 * 
 * @example
 * const { navigationRef } = useScreenTracking();
 * 
 * // Use in NavigationContainer
 * <NavigationContainer ref={navigationRef}>
 *   <Stack.Navigator>
 *     // Navigation screens
 *   </Stack.Navigator>
 * </NavigationContainer>
 * 
 * // Automatic tracking includes:
 * // - Initial screen view on app launch
 * // - Screen transitions during navigation
 * // - Navigation history maintenance
 */
export const useScreenTracking = (): UseScreenTrackingReturn => {
  const navigationRef = useNavigationContainerRef();
  /**
   * Reference to store the current route name for comparison
   * @type {React.MutableRefObject<string | undefined>}
   */
  const routeNameRef = useRef<string | undefined>();

  useEffect(() => {
    /**
     * Handles navigation container ready state
     * Tracks initial screen view when navigation is ready
     * @returns {void}
     */
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

    /**
     * Handles navigation state changes
     * Tracks screen transitions and updates navigation history
     * @returns {void}
     */
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

    const unsubscribeState = navigationRef.addListener('state', onStateChange);

    return () => {
      unsubscribeState?.();
    };
  }, [navigationRef]);

  return { navigationRef };
};
