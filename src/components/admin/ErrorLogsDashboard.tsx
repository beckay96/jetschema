/**
 * Error Logs Dashboard Component
 * Comprehensive dashboard for viewing and managing JetSchema error logs
 */

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useErrorLogger } from '@/hooks/useErrorLogger';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  Clock, 
  User, 
  Database, 
  Code, 
  Filter,
  Download,
  RefreshCw,
  Search,
  Calendar,
  BarChart3
} from 'lucide-react';

interface ErrorLog {
  id: string;
  error_type: string;
  severity: string;
  component: string;
  error_message: string;
  error_code?: string;
  function_name?: string;
  user_id?: string;
  project_id?: string;
  team_id?: string;
  table_name?: string;
  action_attempted?: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  error_details?: any;
  debug_context?: any;
  resolution_notes?: string;
}

interface ErrorStatistics {
  error_type: string;
  severity: string;
  count: number;
  resolved_count: number;
  unresolved_count: number;
}

export function ErrorLogsDashboard() {
  const { user } = useAuth();
  const { logError, logDatabaseError } = useErrorLogger('ErrorLogsDashboard');
  
  // State management
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [statistics, setStatistics] = useState<ErrorStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    errorType: '',
    severity: '',
    component: '',
    resolved: 'all', // 'all', 'resolved', 'unresolved'
    dateRange: '7d', // '1d', '7d', '30d', 'all'
    searchTerm: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Load error logs
  const loadErrorLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('jetschema_error_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.errorType) {
        query = query.eq('error_type', filters.errorType);
      }
      
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      
      if (filters.component) {
        query = query.ilike('component', `%${filters.component}%`);
      }
      
      if (filters.resolved === 'resolved') {
        query = query.eq('is_resolved', true);
      } else if (filters.resolved === 'unresolved') {
        query = query.eq('is_resolved', false);
      }
      
      if (filters.searchTerm) {
        query = query.or(`error_message.ilike.%${filters.searchTerm}%,function_name.ilike.%${filters.searchTerm}%,action_attempted.ilike.%${filters.searchTerm}%`);
      }
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const days = parseInt(filters.dateRange.replace('d', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('created_at', startDate.toISOString());
      }
      
      // Pagination
      const startIndex = (currentPage - 1) * pageSize;
      query = query.range(startIndex, startIndex + pageSize - 1);

      const { data, error } = await query;
      
      if (error) {
        await logDatabaseError(error, 'loadErrorLogs', query.toString(), 'jetschema_error_logs', 'Loading error logs');
        throw error;
      }
      
      setErrorLogs(data || []);
      
    } catch (error) {
      console.error('Failed to load error logs:', error);
      toast.error('Failed to load error logs');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_error_statistics');
      
      if (error) {
        await logDatabaseError(error, 'loadStatistics', 'get_error_statistics()', 'jetschema_error_logs', 'Loading error statistics');
        throw error;
      }
      
      setStatistics(data || []);
      
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  // Resolve error
  const resolveError = async (errorId: string, notes: string) => {
    try {
      const { data, error } = await supabase.rpc('resolve_jetschema_error', {
        p_error_id: errorId,
        p_resolution_notes: notes
      });
      
      if (error) {
        await logDatabaseError(error, 'resolveError', 'resolve_jetschema_error()', 'jetschema_error_logs', 'Resolving error');
        throw error;
      }
      
      if (data) {
        toast.success('Error marked as resolved');
        await loadErrorLogs();
        await loadStatistics();
        setShowResolutionModal(false);
        setSelectedError(null);
        setResolutionNotes('');
      } else {
        toast.error('Failed to resolve error - insufficient permissions');
      }
      
    } catch (error) {
      console.error('Failed to resolve error:', error);
      toast.error('Failed to resolve error');
    }
  };

  // Export error logs
  const exportErrorLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('jetschema_error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      
      const csvContent = convertToCSV(data);
      downloadCSV(csvContent, `jetschema_error_logs_${new Date().toISOString().split('T')[0]}.csv`);
      
      toast.success('Error logs exported successfully');
      
    } catch (error) {
      console.error('Failed to export error logs:', error);
      toast.error('Failed to export error logs');
    }
  };

  // Convert data to CSV
  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  // Download CSV file
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get severity icon and color
  const getSeverityDisplay = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' };
      case 'high':
        return { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' };
      case 'medium':
        return { icon: Info, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'low':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'info':
        return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' };
      default:
        return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  // Get error type icon
  const getErrorTypeIcon = (errorType: string) => {
    switch (errorType) {
      case 'database_error':
        return Database;
      case 'authentication_error':
        return User;
      case 'ui_error':
        return Code;
      default:
        return AlertCircle;
    }
  };

  // Filtered and paginated statistics
  const filteredStatistics = useMemo(() => {
    return statistics.filter(stat => {
      if (filters.errorType && stat.error_type !== filters.errorType) return false;
      if (filters.severity && stat.severity !== filters.severity) return false;
      return true;
    });
  }, [statistics, filters]);

  // Load data on mount and filter changes
  useEffect(() => {
    loadErrorLogs();
  }, [filters, currentPage]);

  useEffect(() => {
    loadStatistics();
  }, []);

  if (loading && errorLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading error logs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Error Logs Dashboard</h1>
          <p className="text-gray-600">Monitor and manage JetSchema errors</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadErrorLogs}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
          <button
            onClick={exportErrorLogs}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {filteredStatistics.map((stat, index) => {
          const { icon: Icon, color, bg } = getSeverityDisplay(stat.severity);
          return (
            <div key={index} className={`p-4 rounded-lg border ${bg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.error_type.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className={`text-lg font-bold ${color}`}>
                    {stat.severity.toUpperCase()}
                  </p>
                </div>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <div>Total: {stat.count}</div>
                <div>Resolved: {stat.resolved_count}</div>
                <div>Unresolved: {stat.unresolved_count}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Error Type
            </label>
            <select
              value={filters.errorType}
              onChange={(e) => setFilters({ ...filters, errorType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              <option value="database_error">Database Error</option>
              <option value="authentication_error">Auth Error</option>
              <option value="ui_error">UI Error</option>
              <option value="api_error">API Error</option>
              <option value="validation_error">Validation Error</option>
              <option value="team_collaboration_error">Team Error</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.resolved}
              onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All</option>
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Component
            </label>
            <input
              type="text"
              value={filters.component}
              onChange={(e) => setFilters({ ...filters, component: e.target.value })}
              placeholder="Filter by component"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              placeholder="Search errors..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Error Logs Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Component
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {errorLogs.map((error) => {
                const { icon: SeverityIcon, color, bg } = getSeverityDisplay(error.severity);
                const ErrorTypeIcon = getErrorTypeIcon(error.error_type);
                
                return (
                  <tr key={error.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${bg}`}>
                          <SeverityIcon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <ErrorTypeIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {error.error_type.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${bg} ${color}`}>
                              {error.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {error.error_message}
                          </p>
                          {error.error_code && (
                            <p className="text-xs text-gray-500 mt-1">
                              Code: {error.error_code}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{error.component}</div>
                      {error.function_name && (
                        <div className="text-xs text-gray-500">{error.function_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(error.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {error.is_resolved ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm">Resolved</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm">Open</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedError(error)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Details
                        </button>
                        {!error.is_resolved && (
                          <button
                            onClick={() => {
                              setSelectedError(error);
                              setShowResolutionModal(true);
                            }}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {errorLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No error logs found matching the current filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Showing page {currentPage} of error logs
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={errorLogs.length < pageSize}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Error Details Modal */}
      {selectedError && !showResolutionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">Error Details</h2>
                <button
                  onClick={() => setSelectedError(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Error Type</label>
                    <p className="text-sm text-gray-900">{selectedError.error_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                    <p className="text-sm text-gray-900">{selectedError.severity}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Component</label>
                    <p className="text-sm text-gray-900">{selectedError.component}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Function</label>
                    <p className="text-sm text-gray-900">{selectedError.function_name || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Error Message</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedError.error_message}</p>
                </div>
                
                {selectedError.error_details && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Error Details</label>
                    <pre className="text-xs text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedError.error_details, null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedError.debug_context && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Debug Context</label>
                    <pre className="text-xs text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedError.debug_context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {showResolutionModal && selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Resolve Error</h2>
              <p className="text-gray-600 mb-4">
                Mark this error as resolved and add resolution notes.
              </p>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter resolution notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 resize-none"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowResolutionModal(false);
                    setResolutionNotes('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => resolveError(selectedError.id, resolutionNotes)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Resolve Error
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
