# JetSchema Error Logging System - Setup Guide

## 🎯 Overview

This comprehensive error logging system provides production-grade error tracking, debugging, and resolution capabilities for JetSchema. It includes:

- **Database Table**: `jetschema_error_logs` with comprehensive error context
- **React Hooks**: Easy-to-use error logging for React components
- **Dashboard**: Admin interface for viewing and managing errors
- **Testing Scripts**: Extensive testing for all error scenarios
- **Utility Functions**: Database functions for logging and resolution

## 📋 Setup Instructions

### 1. Database Setup

Run the following SQL scripts in your Supabase SQL Editor:

```bash
# 1. First, fix the RLS recursion issue (CRITICAL)
migrations/fix_recursive_rls_policies.sql

# 2. Create the error logs table and functions
migrations/create_error_logs_table.sql
```

### 2. Frontend Integration

Add the error logging utilities to your React components:

```typescript
// Import the error logger hook
import { useErrorLogger } from '@/hooks/useErrorLogger';

// Use in your component
function MyComponent() {
  const { logDatabaseError, logUIError, showErrorToast } = useErrorLogger('MyComponent');
  
  // Example usage
  const handleSave = async () => {
    try {
      await saveData();
    } catch (error) {
      await logDatabaseError(error, 'handleSave', 'INSERT INTO...', 'projects', 'Saving project');
    }
  };
}
```

### 3. Error Boundary Setup

Wrap critical components with error boundaries:

```typescript
import { ErrorBoundaryWithLogging } from '@/hooks/useErrorLogger';

function App() {
  return (
    <ErrorBoundaryWithLogging componentName="App">
      <YourAppContent />
    </ErrorBoundaryWithLogging>
  );
}
```

### 4. Admin Dashboard

Add the error logs dashboard to your admin routes:

```typescript
import { ErrorLogsDashboard } from '@/components/admin/ErrorLogsDashboard';

// Add to your routing
<Route path="/admin/errors" component={ErrorLogsDashboard} />
```

## 🧪 Testing

### Run Comprehensive Error Tests

```bash
# Backend/Database error testing
node test_scripts/comprehensive_error_testing.js

# Frontend/UI error testing (run in browser console)
# Load the page and run: window.runUIErrorTests()
```

### Test Categories Covered

- **Database Errors**: RLS policies, constraints, foreign keys, recursion
- **Authentication Errors**: Session expiry, permissions, invalid credentials
- **UI Errors**: Component rendering, state management, user interactions
- **Network Errors**: API timeouts, connection issues, server errors
- **Validation Errors**: Form validation, data type validation
- **Team Collaboration Errors**: Real-time sync, permission conflicts
- **Performance Errors**: Memory usage, slow queries, rendering issues
- **Accessibility Errors**: ARIA labels, keyboard navigation

## 📊 Error Types and Severity Levels

### Error Types
- `database_error` - Database operations, queries, constraints
- `authentication_error` - Login, session, permissions
- `rls_policy_error` - Row Level Security issues
- `ui_error` - React components, rendering, interactions
- `api_error` - External API calls, network requests
- `validation_error` - Form validation, data validation
- `team_collaboration_error` - Real-time collaboration issues
- `migration_error` - Database migrations, schema changes
- `performance_error` - Slow operations, memory issues
- `parsing_error` - SQL parsing, data parsing
- `export_error` - Data export operations
- `import_error` - Data import operations

### Severity Levels
- `critical` - System breaking, blocks all functionality
- `high` - Major feature broken, affects multiple users
- `medium` - Single feature broken, affects some users
- `low` - Minor issue, cosmetic or edge case
- `info` - Informational, not actually an error

## 🔧 Database Functions

### Log Error
```sql
SELECT log_jetschema_error(
  'database_error',
  'critical',
  'ProjectEditor',
  'Failed to save project',
  auth.uid(),
  'project-id',
  'team-id',
  '{"table": "projects", "operation": "INSERT"}'::jsonb
);
```

### Resolve Error
```sql
SELECT resolve_jetschema_error(
  'error-id-here',
  'Fixed by updating RLS policy'
);
```

### Get Statistics
```sql
SELECT * FROM get_error_statistics('2024-01-01'::timestamptz, NOW());
```

## 📈 Dashboard Features

The ErrorLogsDashboard provides:

- **Real-time Error Monitoring**: Live updates of new errors
- **Advanced Filtering**: By type, severity, component, date range
- **Error Resolution**: Mark errors as resolved with notes
- **Statistics View**: Error counts, trends, resolution rates
- **Export Functionality**: CSV export for external analysis
- **Detailed Error Context**: Full stack traces, debug info, user context

## 🚨 Critical Error Scenarios

### RLS Recursion Error (FIXED)
The most critical error was infinite recursion in RLS policies on `team_members` table. This has been fixed with the `fix_recursive_rls_policies.sql` script.

### Common Error Patterns to Watch
1. **Database Connection Issues**: Monitor connection pool exhaustion
2. **Memory Leaks**: Track component memory usage in large projects
3. **Real-time Sync Conflicts**: Monitor team collaboration errors
4. **Authentication Expiry**: Track session timeout patterns
5. **Performance Degradation**: Monitor slow query and render times

## 🔍 Debugging Workflow

1. **Error Occurs**: Automatically logged with full context
2. **Dashboard Alert**: Admin sees error in real-time dashboard
3. **Investigation**: Review error details, stack trace, user context
4. **Reproduction**: Use reproduction steps and debug context
5. **Resolution**: Fix the issue and mark error as resolved
6. **Prevention**: Add tests to prevent similar errors

## 📝 Best Practices

### For Developers
- Always wrap async operations in try-catch with error logging
- Use the appropriate error type and severity level
- Include relevant context (user ID, project ID, action attempted)
- Add reproduction steps when possible
- Use error boundaries for critical UI components

### For Admins
- Monitor critical and high severity errors daily
- Set up alerts for critical errors (external monitoring)
- Review error trends weekly to identify patterns
- Document common resolutions for faster troubleshooting
- Export error data for deeper analysis when needed

## 🔧 Configuration

### Environment Variables
```bash
# Required for error logging
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Error Logger Settings
```typescript
// Customize error logger behavior
const errorLogger = JetSchemaErrorLogger.getInstance();

// Configure automatic error handling
errorLogger.setupGlobalErrorHandlers();
```

## 🚀 Production Deployment

1. **Apply Database Migrations**: Run all SQL scripts in production
2. **Test Error Logging**: Verify errors are being captured
3. **Set Up Monitoring**: Configure external alerts for critical errors
4. **Train Team**: Ensure team knows how to use the dashboard
5. **Document Procedures**: Create runbooks for common error scenarios

## 📞 Support

If you encounter issues with the error logging system:

1. Check the browser console for JavaScript errors
2. Verify database permissions for error logging tables
3. Test with the provided testing scripts
4. Review the dashboard for any logged errors about the error system itself
5. Check Supabase logs for database-level issues

---

## 🎉 Benefits

This error logging system provides:

- **Faster Debugging**: Comprehensive error context reduces investigation time
- **Proactive Monitoring**: Catch issues before users report them
- **Better User Experience**: Graceful error handling with user-friendly messages
- **Data-Driven Improvements**: Error statistics guide development priorities
- **Production Readiness**: Enterprise-grade error tracking and resolution

The system is now ready for production use and will significantly improve JetSchema's reliability and maintainability!
