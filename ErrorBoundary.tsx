/**
 * © 2025 Matthew Robert Wesney. All Rights Reserved.
 * Unauthorized use, reproduction, or distribution is prohibited.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import NeumorphicCard from './components/GlassCard';
import NeumorphicButton from './components/NeumorphicButton';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
      // Attempt to clear storage if it's a bad state issue
      localStorage.removeItem('gemini_api_key');
      window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-gray-200 flex items-center justify-center p-4 z-50">
          <NeumorphicCard className="max-w-2xl w-full p-8 text-center border-red-200 border-2">
            <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">The application encountered an unexpected error.</p>
            
            <div className="bg-gray-100 p-4 rounded-lg text-left overflow-auto max-h-48 mb-6 border border-gray-300">
                <p className="font-mono text-red-600 text-sm whitespace-pre-wrap">
                    {this.state.error && this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                    <pre className="font-mono text-xs text-gray-500 mt-2">
                        {this.state.errorInfo.componentStack}
                    </pre>
                )}
            </div>

            <div className="flex justify-center gap-4">
                <NeumorphicButton onClick={() => window.location.reload()}>
                    Reload Page
                </NeumorphicButton>
                <NeumorphicButton onClick={this.handleReset} className="text-red-500">
                    Reset App Data
                </NeumorphicButton>
            </div>
          </NeumorphicCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
