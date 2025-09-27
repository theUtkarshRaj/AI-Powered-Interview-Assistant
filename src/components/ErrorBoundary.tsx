import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <Alert
              message="Something went wrong"
              description={
                <div className="space-y-4">
                  <p>An unexpected error occurred. This might be due to a browser compatibility issue.</p>
                  <div className="space-y-2">
                    <Button 
                      type="primary" 
                      onClick={() => window.location.reload()}
                      className="w-full"
                    >
                      Reload Page
                    </Button>
                    <Button 
                      onClick={() => this.setState({ hasError: false })}
                      className="w-full"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              }
              type="error"
              showIcon
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
