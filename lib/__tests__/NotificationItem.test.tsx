import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NotificationItem } from '../../components/NotificationItem';
import type { DBNotification } from '../../types/notifications';
import { format } from 'date-fns';

describe('NotificationItem', () => {
  const mockNotification: DBNotification = {
    id: '123',
    title: 'Test Notification',
    body: 'This is a test notification body',
    created_at: new Date().toISOString(),
    is_read: false,
    target_audience: { roles: ['user' as const], categories: [] },
    user_id: null,
    scheduled_at: null
  };

  const mockOnPress = jest.fn();
  const mockOnMarkAsRead = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with unread notification', () => {
    const { getByText, getByTestId } = render(
      <NotificationItem
        notification={mockNotification}
        onPress={mockOnPress}
        onMarkAsRead={mockOnMarkAsRead}
      />
    );

    expect(getByText(mockNotification.title)).toBeTruthy();
    expect(getByText(mockNotification.body)).toBeTruthy();
    expect(getByText(format(new Date(mockNotification.created_at), 'MMM d, yyyy h:mm a'))).toBeTruthy();
  });

  it('renders correctly with read notification', () => {
    const readNotification: DBNotification = {
      ...mockNotification,
      is_read: true
    };
    
    const { getByText, queryByTestId } = render(
      <NotificationItem
        notification={readNotification}
        onPress={mockOnPress}
        onMarkAsRead={mockOnMarkAsRead}
      />
    );

    expect(getByText(readNotification.title)).toBeTruthy();
    expect(queryByTestId('mark-read-button')).toBeNull();
  });

  it('calls onPress when notification is pressed', () => {
    const { getByTestId } = render(
      <NotificationItem
        notification={mockNotification}
        onPress={mockOnPress}
        onMarkAsRead={mockOnMarkAsRead}
      />
    );

    fireEvent.press(getByTestId('notification-container'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('calls onMarkAsRead when mark as read button is pressed', () => {
    const { getByTestId } = render(
      <NotificationItem
        notification={mockNotification}
        onPress={mockOnPress}
        onMarkAsRead={mockOnMarkAsRead}
      />
    );

    fireEvent.press(getByTestId('mark-read-button'));
    expect(mockOnMarkAsRead).toHaveBeenCalledTimes(1);
  });

  it('does not show mark as read button for read notifications', () => {
    const readNotification: DBNotification = {
      ...mockNotification,
      is_read: true
    };
    
    const { queryByTestId } = render(
      <NotificationItem
        notification={readNotification}
        onPress={mockOnPress}
        onMarkAsRead={mockOnMarkAsRead}
      />
    );

    expect(queryByTestId('mark-read-button')).toBeNull();
  });

  it('truncates long body text', () => {
    const longBodyNotification: DBNotification = {
      ...mockNotification,
      body: 'A'.repeat(200)
    };

    const { getByText } = render(
      <NotificationItem
        notification={longBodyNotification}
        onPress={mockOnPress}
        onMarkAsRead={mockOnMarkAsRead}
      />
    );

    const bodyElement = getByText(/A+/);
    expect(bodyElement.props.numberOfLines).toBe(2);
  });
});
