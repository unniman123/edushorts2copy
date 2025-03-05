import React from 'react';
import EmptyState from './EmptyState';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to your error reporting service
    console.error('Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <EmptyState 
          icon="alert-octagon" 
          title="Component Error" 
          subtitle="Something went wrong. Please try again later."
        />
      );
    }

    return this.props.children;
  }
}
