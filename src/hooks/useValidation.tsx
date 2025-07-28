import { useState, useEffect } from 'react';
import { DatabaseTable } from '@/types/database';
import { ValidationError, validateTable, validateRLSExpression, validateIndex } from '@/utils/validationUtils';
import { RLSPolicy } from '@/hooks/useRLSPolicies';
import { DatabaseIndex } from '@/hooks/useIndexes';

export function useValidation(
  tables: DatabaseTable[], 
  policies: RLSPolicy[], 
  indexes: DatabaseIndex[]
) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    const allErrors: ValidationError[] = [];

    try {
      // Validate tables and their fields
      tables.forEach(table => {
        const tableErrors = validateTable(table, tables);
        allErrors.push(...tableErrors);
      });

      // Validate RLS policies
      policies.forEach(policy => {
        if (policy.using_expression) {
          const rlsErrors = validateRLSExpression(policy.using_expression);
          allErrors.push(...rlsErrors.map(error => ({
            ...error,
            id: `rls-${policy.id}-using-${error.id}`,
            affectedElement: {
              type: 'table' as const,
              id: policy.id,
              name: `${policy.name} (USING)`
            }
          })));
        }

        if (policy.with_check_expression) {
          const rlsErrors = validateRLSExpression(policy.with_check_expression);
          allErrors.push(...rlsErrors.map(error => ({
            ...error,
            id: `rls-${policy.id}-check-${error.id}`,
            affectedElement: {
              type: 'table' as const,
              id: policy.id,
              name: `${policy.name} (WITH CHECK)`
            }
          })));
        }
      });

      // Validate indexes
      indexes.forEach(index => {
        const indexErrors = validateIndex(
          index.name,
          index.table_name,
          index.columns,
          index.index_type,
          tables
        );
        allErrors.push(...indexErrors.map(error => ({
          ...error,
          id: `index-${index.id}-${error.id}`,
          affectedElement: {
            type: 'table' as const,
            id: index.id,
            name: `${index.name} (INDEX)`
          }
        })));
      });

      setErrors(allErrors);
    } catch (error) {
      console.error('Error running validation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-validate when data changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      runValidation();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [tables, policies, indexes]);

  return {
    errors,
    loading,
    runValidation
  };
}