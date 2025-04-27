import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NotificationRenderer, { NotificationData } from '../../components/NotificationRenderer';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('NotificationRenderer', () => {
  const mockNotification: NotificationData = {
    id: 'test-id',
    title: 'Test Notification',
    body: 'This is a test notification',
    timestamp: new Date(),
    read: false,
    type: 'push',
  };

  const mockPress = jest.fn();
  const mockDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notification content correctly', () => {
    const { getByText } = render(
      <NotificationRenderer
        notification={mockNotification}
        onPress={mockPress}
        onDismiss={mockDismiss}
      />
    );

    expect(getByText(mockNotification.title)).toBeTruthy();
    expect(getByText(mockNotification.body)).toBeTruthy();
  });

  it('handles press events', () => {
    const { getByTestId } = render(
      <NotificationRenderer
        notification={mockNotification}
        onPress={mockPress}
        onDismiss={mockDismiss}
      />
    );

    fireEvent.press(getByTestId('notification-container'));
    expect(mockPress).toHaveBeenCalledWith(mockNotification);
  });

  it('handles dismiss events', () => {
    const { getByTestId } = render(
      <NotificationRenderer
        notification={mockNotification}
        onPress={mockPress}
        onDismiss={mockDismiss}
      />
    );

    fireEvent.press(getByTestId('dismiss-button'));
    expect(mockDismiss).toHaveBeenCalledWith(mockNotification);
  });

  it('navigates to article detail when deep link is present', () => {
    const notificationWithDeepLink: NotificationData = {
      ...mockNotification,
      deep_link: 'edushorts://articles/123',
    };

    const { getByTestId } = render(
      <NotificationRenderer
        notification={notificationWithDeepLink}
        onPress={mockPress}
        onDismiss={mockDismiss}
      />
    );

    fireEvent.press(getByTestId('notification-container'));
    
    expect(mockNavigate).toHaveBeenCalledWith('ArticleDetail', { articleId: '123' });
    expect(mockPress).toHaveBeenCalledWith(notificationWithDeepLink);
  });

  it('displays different icons based on notification type', () => {
    const types: NotificationData['type'][] = ['push', 'web', 'scheduled', 'article_link'];
    const expectedIcons = ['notifications', 'globe', 'time', 'document-text'];

    types.forEach((type, index) => {
      const { getByTestId } = render(
        <NotificationRenderer
          notification={{ ...mockNotification, type }}
          onPress={mockPress}
          onDismiss={mockDismiss}
        />
      );

      const icon = getByTestId('notification-icon');
      expect(icon.props.name).toBe(expectedIcons[index]);
    });
  });

  it('applies unread styles when notification is not read', () => {
    const { getByTestId } = render(
      <NotificationRenderer
        notification={{ ...mockNotification, read: false }}
        onPress={mockPress}
        onDismiss={mockDismiss}
      />
    );

    const container = getByTestId('notification-container');
    expect(container.props.style).toContainEqual(
      expect.objectContaining({ backgroundColor: '#f0f9ff' })
    );
  });

  it('formats timestamp correctly', () => {
    const now = new Date();
    const notification = {
      ...mockNotification,
      timestamp: now,
    };

    const { getByTestId } = render(
      <NotificationRenderer
        notification={notification}
        onPress={mockPress}
        onDismiss={mockDismiss}
      />
    );

    const timestamp = getByTestId('notification-timestamp');
    expect(timestamp.props.children).toContain('less than a minute ago');
  });
});
