import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AppError, ErrorCodes } from '../lib/errors';
import { theme } from '../styles/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

type ErrorDisplayInfo = {
  message: string;
  code: 4001;  // API_SERVER_ERROR
  details?: string;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  getErrorInfo = (error: Error | null): ErrorDisplayInfo => {
    const defaultError: ErrorDisplayInfo = {
      message: 'An unexpected error occurred',
      code: ErrorCodes.API_SERVER_ERROR,
    };

    if (!error) {
      return defaultError;
    }

    if (error instanceof AppError) {
      return {
        message: error.message,
        code: ErrorCodes.API_SERVER_ERROR,
        details: error.context ? JSON.stringify(error.context) : undefined
      };
    }

    return {
      message: error.message,
      code: ErrorCodes.API_SERVER_ERROR,
      details: error.stack
    };
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { message, code, details } = this.getErrorInfo(this.state.error);
      const componentStack = this.state.errorInfo?.componentStack;

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops!</Text>
          <Text style={styles.message}>{message}</Text>
          {__DEV__ && (componentStack || details) && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Error Details:</Text>
              <Text style={styles.details}>
                Code {code}{'\n'}
                {componentStack || details}
              </Text>
            </View>
          )}
          <Pressable
            style={styles.retryButton}
            onPress={this.handleRetry}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.large,
  },
  title: {
    fontSize: theme.typography.size.xlarge,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: theme.spacing.medium,
  },
  message: {
    fontSize: theme.typography.size.medium,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.large,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.large,
  },
  detailsTitle: {
    fontSize: theme.typography.size.small,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.small,
  },
  details: {
    fontSize: theme.typography.size.xsmall,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.large,
    paddingVertical: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    elevation: 2,
  },
  retryText: {
    color: theme.colors.textInverted,
    fontSize: theme.typography.size.medium,
    fontWeight: 'bold',
  },
});
