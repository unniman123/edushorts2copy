import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';
import { AppError, ErrorCodes } from '../../lib/errors';
import { Text } from 'react-native';

// Mock console.error to avoid test output noise
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  const ThrowError = ({ error }: { error: Error }) => {
    throw error;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Test Content</Text>
      </ErrorBoundary>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('renders error UI for standard Error', () => {
    const testError = new Error('Standard error message');
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    expect(getByText('Standard error message')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('renders error UI for AppError', () => {
    const testError = new AppError(
      ErrorCodes.API_SERVER_ERROR,
      'Custom app error',
      { context: 'test' }
    );
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    expect(getByText('Custom app error')).toBeTruthy();
  });

  it('calls onError handler when error occurs', () => {
    const onError = jest.fn();
    const testError = new Error('Test error');

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      testError,
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('handles retry action', () => {
    let shouldThrow = true;
    const onRetry = jest.fn(() => {
      shouldThrow = false;
    });

    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <Text>Success</Text>;
    };

    const { getByText, rerender } = render(
      <ErrorBoundary onRetry={onRetry}>
        <TestComponent />
      </ErrorBoundary>
    );

    // Verify error state
    const retryButton = getByText('Try Again');
    expect(retryButton).toBeTruthy();

    // Trigger retry
    fireEvent.press(retryButton);
    expect(onRetry).toHaveBeenCalled();

    // Verify recovery
    rerender(
      <ErrorBoundary onRetry={onRetry}>
        <TestComponent />
      </ErrorBoundary>
    );
    expect(getByText('Success')).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    const fallback = <Text>Custom fallback</Text>;
    const { getByText } = render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError error={new Error('Test error')} />
      </ErrorBoundary>
    );

    expect(getByText('Custom fallback')).toBeTruthy();
  });

  it('shows error details in development mode', () => {
    const originalDev = __DEV__;
    (global as any).__DEV__ = true;

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError error={new Error('Test error')} />
      </ErrorBoundary>
    );

    expect(getByText('Error Details:')).toBeTruthy();
    expect(getByText(new RegExp(`Code ${ErrorCodes.API_SERVER_ERROR}`))).toBeTruthy();

    (global as any).__DEV__ = originalDev;
  });

  it('hides error details in production mode', () => {
    const originalDev = __DEV__;
    (global as any).__DEV__ = false;

    const { queryByText } = render(
      <ErrorBoundary>
        <ThrowError error={new Error('Test error')} />
      </ErrorBoundary>
    );

    expect(queryByText('Error Details:')).toBeNull();

    (global as any).__DEV__ = originalDev;
  });
});
