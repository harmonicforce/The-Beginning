import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** If true, shows a "Go Home" button in the fallback UI */
  showHomeButton?: boolean;
  /** Optional label shown above the error (e.g. "Inventory Screen Error") */
  screenName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React error boundary.
 * Catches unhandled runtime errors and shows a fallback UI with:
 * - A meaningful message
 * - A retry button
 * - An optional navigate-home button
 *
 * Usage:
 *   <ErrorBoundary>
 *     <Stack />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary screenName="Intake Flow" showHomeButton>
 *     <ProcessingScreen />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in dev; in production this would go to a crash reporting service
    console.error('[ErrorBoundary]', error.message, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    try {
      router.replace('/');
    } catch {
      // If router isn't available, just retry
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { showHomeButton = true, screenName } = this.props;
    const errorMessage = this.state.error?.message ?? 'An unexpected error occurred.';

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.icon}>⚠️</Text>

          <Text style={styles.title}>Something went wrong</Text>

          {screenName && (
            <Text style={styles.screenLabel}>{screenName}</Text>
          )}

          <Text style={styles.message}>{errorMessage}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={this.handleRetry}
              style={styles.retryBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>

            {showHomeButton && (
              <TouchableOpacity
                onPress={this.handleGoHome}
                style={styles.homeBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.homeBtnText}>Go Home</Text>
              </TouchableOpacity>
            )}
          </View>

          {__DEV__ && (
            <View style={styles.devInfo}>
              <Text style={styles.devTitle}>Debug Info</Text>
              <Text style={styles.devText} selectable>
                {this.state.error?.stack?.slice(0, 500) ?? 'No stack trace'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f4f4f5',
    textAlign: 'center',
  },
  screenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  retryBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 120,
    alignItems: 'center',
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  homeBtn: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 120,
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  devInfo: {
    marginTop: 20,
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    width: '100%',
    maxHeight: 200,
  },
  devTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#52525b',
    letterSpacing: 1,
    marginBottom: 6,
  },
  devText: {
    fontSize: 11,
    color: '#71717a',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
