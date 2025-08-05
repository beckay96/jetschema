/**
 * React Hook for JetSchema Error Logging
 * Provides easy-to-use error logging functionality for React components
 */

import { useCallback, useContext, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { errorLogger, ErrorType, ErrorSeverity, ErrorLogData } from '@/utils/errorLogger';
import { toast } from 'sonner';

interface UseErrorLoggerReturn {
  logError: (errorData: Partial<ErrorLogData>) => Promise<string | null>;
  logDatabaseError: (error: any, functionName: string, queryText?: string, tableName?: string, actionAttempted?: string) => Promise<string | null>;
  logAuthError: (error: any, actionAttempted: string, additionalContext?: any) => Promise<string | null>;
  logUIError: (error: any, functionName: string, actionAttempted: string, componentProps?: any, componentState?: any) => Promise<string | null>;
  logNetworkError: (error: any, endpoint: string, method: string, requestPayload?: any, responseData?: any) => Promise<string | null>;
  logValidationError: (validationErrors: any, formData: any, actionAttempted: string) => Promise<string | null>;
  logTeamCollaborationError: (error: any, teamId: string, projectId: string, actionAttempted: string, collaborationContext?: any) => Promise<string | null>;
  showErrorToast: (message: string, severity?: ErrorSeverity) => void;
}

/**
 * Hook for error logging with React context integration
 */
export function useErrorLogger(componentName: string): UseErrorLoggerReturn {
  const { user } = useAuth();

  // Get current project and team context from URL or state
  const getCurrentContext = useCallback(() => {
    const urlPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      projectId: urlParams.get('project') || undefined,
      teamId: urlParams.get('team') || undefined,
      urlPath,
    };
  }, []);

  // Enhanced error logging with component context
  const logError = useCallback(async (errorData: Partial<ErrorLogData>): Promise<string | null> => {
    const context = getCurrentContext();
    
    const enrichedErrorData: ErrorLogData = {
      errorType: 'ui_error',
      severity: 'medium',
      component: componentName,
      errorMessage: 'Unknown error occurred',
      ...errorData,
      userId: errorData.userId || user?.id,
      projectId: errorData.projectId || context.projectId,
      teamId: errorData.teamId || context.teamId,
      urlPath: errorData.urlPath || context.urlPath,
    };

    const errorId = await errorLogger.logError(enrichedErrorData);
    
    // Show user-friendly toast notification for critical/high severity errors
    if (enrichedErrorData.severity === 'critical' || enrichedErrorData.severity === 'high') {
      showErrorToast(enrichedErrorData.errorMessage, enrichedErrorData.severity);
    }
    
    return errorId;
  }, [componentName, user?.id, getCurrentContext]);

  // Database error logging
  const logDatabaseError = useCallback(async (
    error: any,
    functionName: string,
    queryText?: string,
    tableName?: string,
    actionAttempted?: string
  ): Promise<string | null> => {
    const context = getCurrentContext();
    
    const errorId = await errorLogger.logDatabaseError(
      error,
      componentName,
      functionName,
      queryText,
      { ...context },
      tableName,
      actionAttempted
    );
    
    // Show appropriate user feedback
    const isRLSError = error.code === '42501' || error.message?.includes('row-level security');
    const isRecursionError = error.message?.includes('infinite recursion');
    
    if (isRecursionError) {
      showErrorToast('Database configuration issue detected. Please contact support.', 'critical');
    } else if (isRLSError) {
      showErrorToast('Access denied. Please check your permissions.', 'high');
    } else {
      showErrorToast('Database operation failed. Please try again.', 'medium');
    }
    
    return errorId;
  }, [componentName, getCurrentContext]);

  // Authentication error logging
  const logAuthError = useCallback(async (
    error: any,
    actionAttempted: string,
    additionalContext?: any
  ): Promise<string | null> => {
    const errorId = await errorLogger.logAuthError(error, componentName, actionAttempted, additionalContext);
    
    const isSessionExpired = error.message?.includes('JWT') || error.message?.includes('session');
    
    if (isSessionExpired) {
      showErrorToast('Your session has expired. Please sign in again.', 'high');
    } else {
      showErrorToast('Authentication failed. Please try again.', 'high');
    }
    
    return errorId;
  }, [componentName]);

  // UI error logging
  const logUIError = useCallback(async (
    error: any,
    functionName: string,
    actionAttempted: string,
    componentProps?: any,
    componentState?: any
  ): Promise<string | null> => {
    const errorId = await errorLogger.logUIError(
      error,
      componentName,
      functionName,
      actionAttempted,
      componentProps,
      componentState
    );
    
    showErrorToast('An unexpected error occurred. Please refresh the page.', 'medium');
    
    return errorId;
  }, [componentName]);

  // Network error logging
  const logNetworkError = useCallback(async (
    error: any,
    endpoint: string,
    method: string,
    requestPayload?: any,
    responseData?: any
  ): Promise<string | null> => {
    const errorId = await errorLogger.logNetworkError(
      error,
      componentName,
      endpoint,
      method,
      requestPayload,
      responseData
    );
    
    const isTimeoutError = error.message?.includes('timeout');
    const isNetworkError = error.message?.includes('network') || error.message?.includes('fetch');
    
    if (isTimeoutError) {
      showErrorToast('Request timed out. Please check your connection.', 'medium');
    } else if (isNetworkError) {
      showErrorToast('Network error. Please check your connection.', 'medium');
    } else if (error.status >= 500) {
      showErrorToast('Server error. Please try again later.', 'high');
    } else {
      showErrorToast('Request failed. Please try again.', 'medium');
    }
    
    return errorId;
  }, [componentName]);

  // Validation error logging
  const logValidationError = useCallback(async (
    validationErrors: any,
    formData: any,
    actionAttempted: string
  ): Promise<string | null> => {
    const errorId = await errorLogger.logValidationError(
      validationErrors,
      componentName,
      formData,
      actionAttempted
    );
    
    showErrorToast('Please correct the highlighted fields.', 'low');
    
    return errorId;
  }, [componentName]);

  // Team collaboration error logging
  const logTeamCollaborationError = useCallback(async (
    error: any,
    teamId: string,
    projectId: string,
    actionAttempted: string,
    collaborationContext?: any
  ): Promise<string | null> => {
    const errorId = await errorLogger.logTeamCollaborationError(
      error,
      componentName,
      teamId,
      projectId,
      actionAttempted,
      collaborationContext
    );
    
    const isPermissionError = error.code === '42501' || error.message?.includes('permission');
    
    if (isPermissionError) {
      showErrorToast('Team access denied. Please check your role permissions.', 'high');
    } else {
      showErrorToast('Team collaboration error. Changes may not be synced.', 'medium');
    }
    
    return errorId;
  }, [componentName]);

  // Show error toast with appropriate styling
  const showErrorToast = useCallback((message: string, severity: ErrorSeverity = 'medium') => {
    const toastOptions = {
      duration: severity === 'critical' ? 10000 : severity === 'high' ? 7000 : 4000,
    };

    switch (severity) {
      case 'critical':
        toast.error(`🚨 Critical: ${message}`, toastOptions);
        break;
      case 'high':
        toast.error(`⚠️ Error: ${message}`, toastOptions);
        break;
      case 'medium':
        toast.error(`❌ ${message}`, toastOptions);
        break;
      case 'low':
        toast.warning(`⚠️ ${message}`, toastOptions);
        break;
      case 'info':
        toast.info(`ℹ️ ${message}`, toastOptions);
        break;
    }
  }, []);

  return {
    logError,
    logDatabaseError,
    logAuthError,
    logUIError,
    logNetworkError,
    logValidationError,
    logTeamCollaborationError,
    showErrorToast,
  };
}

/**
 * Higher-order component for automatic error boundary logging
 */
export function withErrorLogging<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function ErrorLoggedComponent(props: P) {
    const { logUIError } = useErrorLogger(componentName);

    useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        logUIError(
          event.error,
          'globalErrorHandler',
          'Component rendering or execution',
          props
        );
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        logUIError(
          event.reason,
          'globalErrorHandler',
          'Promise rejection',
          props
        );
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }, [logUIError, props]);

    return <WrappedComponent {...props} />;
  };
}

/**
 * React Error Boundary with logging
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundaryWithLogging extends React.Component<
  React.PropsWithChildren<{ componentName: string }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ componentName: string }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error using the error logger
    await errorLogger.logError({
      errorType: 'ui_error',
      severity: 'critical',
      component: this.props.componentName,
      errorMessage: error.message,
      stackTrace: error.stack,
      functionName: 'componentDidCatch',
      actionAttempted: 'Component rendering',
      errorDetails: {
        errorBoundary: true,
        componentStack: errorInfo.componentStack,
        errorInfo,
      },
      debugContext: {
        timestamp: new Date().toISOString(),
        errorBoundaryComponent: this.props.componentName,
      },
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            An error occurred in the {this.props.componentName} component.
          </p>
          <details className="text-sm text-red-700">
            <summary className="cursor-pointer mb-2">Error Details</summary>
            <pre className="whitespace-pre-wrap bg-red-100 p-2 rounded">
              {this.state.error?.message}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default useErrorLogger;
