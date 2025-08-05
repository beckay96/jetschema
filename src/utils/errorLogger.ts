/**
 * JetSchema Error Logger
 * Comprehensive error logging system that uploads detailed error information
 * to the jetschema_error_logs table for production debugging
 */

import { supabase } from '@/integrations/supabase/client';

// Error type definitions
export type ErrorType = 
  | 'database_error'
  | 'authentication_error'
  | 'rls_policy_error'
  | 'migration_error'
  | 'ui_error'
  | 'api_error'
  | 'validation_error'
  | 'permission_error'
  | 'network_error'
  | 'parsing_error'
  | 'export_error'
  | 'import_error'
  | 'team_collaboration_error'
  | 'subscription_error'
  | 'unknown_error';

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ErrorLogData {
  // Required fields
  errorType: ErrorType;
  severity: ErrorSeverity;
  component: string;
  errorMessage: string;
  
  // Optional context fields
  errorCode?: string;
  stackTrace?: string;
  functionName?: string;
  filePath?: string;
  lineNumber?: number;
  
  // User context
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  
  // Application context
  projectId?: string;
  teamId?: string;
  urlPath?: string;
  actionAttempted?: string;
  requestPayload?: any;
  
  // Database context
  tableName?: string;
  queryText?: string;
  queryParameters?: any;
  
  // Environment context
  environment?: 'development' | 'staging' | 'production';
  appVersion?: string;
  browserVersion?: string;
  deviceInfo?: any;
  
  // Additional debugging context
  debugContext?: any;
  reproductionSteps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  
  // Structured error details
  errorDetails?: any;
}

class JetSchemaErrorLogger {
  private static instance: JetSchemaErrorLogger;
  private sessionId: string;
  private environment: string;
  private appVersion: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.environment = this.detectEnvironment();
    this.appVersion = this.getAppVersion();
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): JetSchemaErrorLogger {
    if (!JetSchemaErrorLogger.instance) {
      JetSchemaErrorLogger.instance = new JetSchemaErrorLogger();
    }
    return JetSchemaErrorLogger.instance;
  }

  /**
   * Log an error with comprehensive context
   */
  async logError(errorData: ErrorLogData): Promise<string | null> {
    try {
      // Enrich error data with automatic context
      const enrichedData = await this.enrichErrorData(errorData);
      
      // Log to console for immediate debugging
      this.logToConsole(enrichedData);
      
      // Upload to database
      const errorId = await this.uploadToDatabase(enrichedData);
      
      // Log success
      console.log(`✅ Error logged with ID: ${errorId}`);
      
      return errorId;
      
    } catch (uploadError) {
      // If logging fails, at least log to console
      console.error('❌ Failed to upload error to database:', uploadError);
      console.error('Original error data:', errorData);
      return null;
    }
  }

  /**
   * Log database errors with specific context
   */
  async logDatabaseError(
    error: any,
    component: string,
    functionName: string,
    queryText?: string,
    queryParameters?: any,
    tableName?: string,
    actionAttempted?: string
  ): Promise<string | null> {
    const severity = this.determineDatabaseErrorSeverity(error);
    
    return await this.logError({
      errorType: 'database_error',
      severity,
      component,
      functionName,
      errorMessage: error.message || 'Database operation failed',
      errorCode: error.code,
      stackTrace: error.stack,
      queryText,
      queryParameters,
      tableName,
      actionAttempted,
      errorDetails: {
        supabaseError: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
        postgresError: error.code?.startsWith('P') || error.code?.match(/^\d{5}$/),
        isRLSError: error.code === '42501' || error.message?.includes('row-level security'),
        isRecursionError: error.message?.includes('infinite recursion'),
      },
      debugContext: {
        timestamp: new Date().toISOString(),
        userAuthenticated: !!(await this.getCurrentUser()),
        connectionState: 'active', // Could be enhanced
      }
    });
  }

  /**
   * Log authentication errors
   */
  async logAuthError(
    error: any,
    component: string,
    actionAttempted: string,
    additionalContext?: any
  ): Promise<string | null> {
    return await this.logError({
      errorType: 'authentication_error',
      severity: 'high',
      component,
      errorMessage: error.message || 'Authentication failed',
      errorCode: error.status?.toString() || error.code,
      stackTrace: error.stack,
      actionAttempted,
      errorDetails: {
        authError: {
          status: error.status,
          code: error.code,
          message: error.message,
          __isAuthError: error.__isAuthError,
        },
        sessionExpired: error.message?.includes('JWT') || error.message?.includes('session'),
        ...additionalContext
      },
      debugContext: {
        timestamp: new Date().toISOString(),
        currentUrl: window?.location?.href,
        referrer: document?.referrer,
      }
    });
  }

  /**
   * Log UI/React errors
   */
  async logUIError(
    error: any,
    component: string,
    functionName: string,
    actionAttempted: string,
    componentProps?: any,
    componentState?: any
  ): Promise<string | null> {
    return await this.logError({
      errorType: 'ui_error',
      severity: 'medium',
      component,
      functionName,
      errorMessage: error.message || 'UI component error',
      stackTrace: error.stack,
      actionAttempted,
      errorDetails: {
        reactError: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        componentProps,
        componentState,
      },
      debugContext: {
        timestamp: new Date().toISOString(),
        currentUrl: window?.location?.href,
        viewport: {
          width: window?.innerWidth,
          height: window?.innerHeight,
        },
        userAgent: navigator?.userAgent,
      }
    });
  }

  /**
   * Log API/Network errors
   */
  async logNetworkError(
    error: any,
    component: string,
    endpoint: string,
    method: string,
    requestPayload?: any,
    responseData?: any
  ): Promise<string | null> {
    const severity = error.status >= 500 ? 'high' : 'medium';
    
    return await this.logError({
      errorType: 'network_error',
      severity,
      component,
      errorMessage: error.message || `${method} ${endpoint} failed`,
      errorCode: error.status?.toString(),
      actionAttempted: `${method} request to ${endpoint}`,
      requestPayload,
      errorDetails: {
        networkError: {
          status: error.status,
          statusText: error.statusText,
          url: endpoint,
          method,
          timeout: error.timeout,
        },
        responseData,
        isTimeoutError: error.message?.includes('timeout'),
        isNetworkError: error.message?.includes('network') || error.message?.includes('fetch'),
      },
      debugContext: {
        timestamp: new Date().toISOString(),
        connectionType: (navigator as any)?.connection?.effectiveType,
        onLine: navigator?.onLine,
      }
    });
  }

  /**
   * Log validation errors
   */
  async logValidationError(
    validationErrors: any,
    component: string,
    formData: any,
    actionAttempted: string
  ): Promise<string | null> {
    return await this.logError({
      errorType: 'validation_error',
      severity: 'low',
      component,
      errorMessage: 'Form validation failed',
      actionAttempted,
      requestPayload: formData,
      errorDetails: {
        validationErrors,
        fieldCount: Object.keys(formData || {}).length,
        errorCount: Array.isArray(validationErrors) ? validationErrors.length : Object.keys(validationErrors || {}).length,
      },
      debugContext: {
        timestamp: new Date().toISOString(),
        formType: component,
      }
    });
  }

  /**
   * Log team collaboration errors
   */
  async logTeamCollaborationError(
    error: any,
    component: string,
    teamId: string,
    projectId: string,
    actionAttempted: string,
    collaborationContext?: any
  ): Promise<string | null> {
    return await this.logError({
      errorType: 'team_collaboration_error',
      severity: 'high',
      component,
      teamId,
      projectId,
      errorMessage: error.message || 'Team collaboration failed',
      errorCode: error.code,
      actionAttempted,
      errorDetails: {
        collaborationError: error,
        teamContext: collaborationContext,
        isRealTimeError: actionAttempted.includes('real-time') || actionAttempted.includes('sync'),
        isPermissionError: error.code === '42501' || error.message?.includes('permission'),
      },
      debugContext: {
        timestamp: new Date().toISOString(),
        activeCollaborators: collaborationContext?.activeUsers?.length || 0,
      }
    });
  }

  /**
   * Enrich error data with automatic context
   */
  private async enrichErrorData(errorData: ErrorLogData): Promise<any> {
    const currentUser = await this.getCurrentUser();
    const deviceInfo = this.getDeviceInfo();
    const browserInfo = this.getBrowserInfo();
    
    return {
      error_type: errorData.errorType,
      severity: errorData.severity,
      component: errorData.component,
      error_message: errorData.errorMessage,
      error_code: errorData.errorCode,
      stack_trace: errorData.stackTrace,
      function_name: errorData.functionName,
      file_path: errorData.filePath,
      line_number: errorData.lineNumber,
      
      // User context
      user_id: errorData.userId || currentUser?.id,
      session_id: errorData.sessionId || this.sessionId,
      user_agent: errorData.userAgent || navigator?.userAgent,
      ip_address: errorData.ipAddress, // Would need server-side detection
      
      // Application context
      project_id: errorData.projectId,
      team_id: errorData.teamId,
      url_path: errorData.urlPath || window?.location?.pathname,
      action_attempted: errorData.actionAttempted,
      request_payload: errorData.requestPayload,
      
      // Database context
      table_name: errorData.tableName,
      query_text: errorData.queryText,
      query_parameters: errorData.queryParameters,
      
      // Environment context
      environment: errorData.environment || this.environment,
      app_version: errorData.appVersion || this.appVersion,
      browser_version: browserInfo.version,
      device_info: errorData.deviceInfo || deviceInfo,
      
      // Additional context
      debug_context: {
        ...errorData.debugContext,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        url: window?.location?.href,
        referrer: document?.referrer,
        viewport: {
          width: window?.innerWidth,
          height: window?.innerHeight,
        },
        browserInfo,
        deviceInfo,
      },
      reproduction_steps: errorData.reproductionSteps,
      expected_behavior: errorData.expectedBehavior,
      actual_behavior: errorData.actualBehavior,
      error_details: errorData.errorDetails,
    };
  }

  /**
   * Upload error to database
   */
  private async uploadToDatabase(enrichedData: any): Promise<string> {
    const { data, error } = await supabase
      .from('jetschema_error_logs')
      .insert(enrichedData)
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(errorData: any): void {
    const timestamp = new Date().toISOString();
    const severity = errorData.severity.toUpperCase();
    const component = errorData.component;
    const message = errorData.error_message;
    
    console.group(`🚨 [${severity}] ${component} Error - ${timestamp}`);
    console.error('Message:', message);
    console.error('Error Code:', errorData.error_code);
    console.error('Function:', errorData.function_name);
    console.error('Action:', errorData.action_attempted);
    
    if (errorData.stack_trace) {
      console.error('Stack Trace:', errorData.stack_trace);
    }
    
    if (errorData.error_details) {
      console.error('Error Details:', errorData.error_details);
    }
    
    if (errorData.debug_context) {
      console.error('Debug Context:', errorData.debug_context);
    }
    
    console.groupEnd();
  }

  /**
   * Determine database error severity
   */
  private determineDatabaseErrorSeverity(error: any): ErrorSeverity {
    if (error.message?.includes('infinite recursion')) return 'critical';
    if (error.code === '42501') return 'high'; // Permission denied
    if (error.code === 'PGRST116') return 'high'; // Table not found
    if (error.message?.includes('JWT')) return 'high'; // Auth issues
    return 'medium';
  }

  /**
   * Get current authenticated user
   */
  private async getCurrentUser(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect environment
   */
  private detectEnvironment(): string {
    if (typeof window === 'undefined') return 'development';
    
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development';
    if (hostname.includes('staging') || hostname.includes('dev')) return 'staging';
    return 'production';
  }

  /**
   * Get app version
   */
  private getAppVersion(): string {
    return process.env.REACT_APP_VERSION || '1.0.0';
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): any {
    if (typeof window === 'undefined') return {};
    
    return {
      platform: navigator?.platform,
      language: navigator?.language,
      languages: navigator?.languages,
      cookieEnabled: navigator?.cookieEnabled,
      onLine: navigator?.onLine,
      hardwareConcurrency: navigator?.hardwareConcurrency,
      deviceMemory: (navigator as any)?.deviceMemory,
      connection: (navigator as any)?.connection?.effectiveType,
    };
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): any {
    if (typeof window === 'undefined') return {};
    
    const userAgent = navigator?.userAgent || '';
    
    return {
      userAgent,
      vendor: navigator?.vendor,
      version: this.extractBrowserVersion(userAgent),
      name: this.extractBrowserName(userAgent),
    };
  }

  /**
   * Extract browser name from user agent
   */
  private extractBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Extract browser version from user agent
   */
  private extractBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+\.\d+)/);
    return match ? match[2] : 'Unknown';
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        errorType: 'ui_error',
        severity: 'high',
        component: 'GlobalErrorHandler',
        errorMessage: event.message,
        filePath: event.filename,
        lineNumber: event.lineno,
        stackTrace: event.error?.stack,
        actionAttempted: 'Script execution',
        errorDetails: {
          globalError: {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error,
          }
        }
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        errorType: 'ui_error',
        severity: 'high',
        component: 'GlobalErrorHandler',
        errorMessage: event.reason?.message || 'Unhandled promise rejection',
        stackTrace: event.reason?.stack,
        actionAttempted: 'Promise execution',
        errorDetails: {
          promiseRejection: {
            reason: event.reason,
            promise: event.promise,
          }
        }
      });
    });
  }
}

// Export singleton instance
export const errorLogger = JetSchemaErrorLogger.getInstance();

// Convenience functions for common error types
export const logDatabaseError = (error: any, component: string, functionName: string, queryText?: string, queryParameters?: any, tableName?: string, actionAttempted?: string) => 
  errorLogger.logDatabaseError(error, component, functionName, queryText, queryParameters, tableName, actionAttempted);

export const logAuthError = (error: any, component: string, actionAttempted: string, additionalContext?: any) => 
  errorLogger.logAuthError(error, component, actionAttempted, additionalContext);

export const logUIError = (error: any, component: string, functionName: string, actionAttempted: string, componentProps?: any, componentState?: any) => 
  errorLogger.logUIError(error, component, functionName, actionAttempted, componentProps, componentState);

export const logNetworkError = (error: any, component: string, endpoint: string, method: string, requestPayload?: any, responseData?: any) => 
  errorLogger.logNetworkError(error, component, endpoint, method, requestPayload, responseData);

export const logValidationError = (validationErrors: any, component: string, formData: any, actionAttempted: string) => 
  errorLogger.logValidationError(validationErrors, component, formData, actionAttempted);

export const logTeamCollaborationError = (error: any, component: string, teamId: string, projectId: string, actionAttempted: string, collaborationContext?: any) => 
  errorLogger.logTeamCollaborationError(error, component, teamId, projectId, actionAttempted, collaborationContext);
