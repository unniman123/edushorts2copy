import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

// Mock contexts used by HomeScreen to avoid heavy setup
jest.mock('../../context/NewsContext', () => ({
  useNews: () => ({
    news: [
      { id: 'n1', title: 't1', summary: 's1', image_path: 'https://example.com/1.jpg', created_at: new Date().toISOString() },
    ],
    loading: false,
    error: null,
    refreshNews: jest.fn(),
    loadMoreNews: jest.fn(),
  }),
}));

jest.mock('../../context/AdvertisementContext', () => ({
  useAdvertisements: () => ({
    advertisements: [],
  }),
}));

function renderWithPlatform(os: 'android' | 'ios', version: any) {
  jest.isolateModules(() => {
    jest.doMock('react-native', () => {
      const actual = jest.requireActual('react-native');
      return {
        ...actual,
        Platform: { ...actual.Platform, OS: os, Version: version },
      };
    });

    // Mock PagerView as a simple View to avoid native requirements
    jest.doMock('react-native-pager-view', () => 'View');

    // Mock safe area insets
    jest.doMock('react-native-safe-area-context', () => {
      const actual = jest.requireActual('react-native-safe-area-context');
      return {
        ...actual,
        useSafeAreaInsets: () => ({ top: 24, bottom: 16, left: 0, right: 0 }),
      };
    });

    const HomeScreen = require('../../screens/HomeScreen').default;
    const utils = render(<HomeScreen />);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore get access outside isolateModules
    global.__TEST_RENDER__ = utils;
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return global.__TEST_RENDER__ as ReturnType<typeof render>;
}

describe('HomeScreen edge-to-edge safe area behavior', () => {
  it('applies top/bottom padding on Android 15+ (API 35+)', () => {
    const { getByTestId } = renderWithPlatform('android', 35);
    const node = getByTestId('home-safe-area');
    const flattened = StyleSheet.flatten(node.props.style);
    expect(flattened.paddingTop).toBe(24);
    expect(flattened.paddingBottom).toBe(16);
  });

  it('does not add top/bottom padding on Android 14 (API 34)', () => {
    const { getByTestId } = renderWithPlatform('android', 34);
    const node = getByTestId('home-safe-area');
    const flattened = StyleSheet.flatten(node.props.style);
    expect(flattened.paddingTop).toBeUndefined();
    expect(flattened.paddingBottom).toBeUndefined();
  });

  it('does not add top/bottom padding on iOS', () => {
    const { getByTestId } = renderWithPlatform('ios', '17.0');
    const node = getByTestId('home-safe-area');
    const flattened = StyleSheet.flatten(node.props.style);
    expect(flattened.paddingTop).toBeUndefined();
    expect(flattened.paddingBottom).toBeUndefined();
  });
});


