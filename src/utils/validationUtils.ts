import { DatabaseField, DatabaseTable, DataType } from '@/types/database';

export interface ValidationError {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  affectedElement?: {
    type: 'table' | 'field' | 'relationship';
    id: string;
    name: string;
  };
}

// Validate table structure
export function validateTable(table: DatabaseTable, allTables: DatabaseTable[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for table name issues
  if (!table.name.trim()) {
    errors.push({
      id: `table-${table.id}-name-empty`,
      type: 'error',
      message: 'Table name cannot be empty',
      affectedElement: { type: 'table', id: table.id, name: table.name }
    });
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(table.name)) {
    errors.push({
      id: `table-${table.id}-name-invalid`,
      type: 'error',
      message: 'Table name must start with a letter and contain only letters, numbers, and underscores',
      suggestion: 'Use snake_case naming convention',
      affectedElement: { type: 'table', id: table.id, name: table.name }
    });
  }

  // Check for duplicate table names
  const duplicates = allTables.filter(t => t.name === table.name && t.id !== table.id);
  if (duplicates.length > 0) {
    errors.push({
      id: `table-${table.id}-name-duplicate`,
      type: 'error',
      message: `Table name "${table.name}" is already in use`,
      affectedElement: { type: 'table', id: table.id, name: table.name }
    });
  }

  // Check fields
  if (table.fields.length === 0) {
    errors.push({
      id: `table-${table.id}-no-fields`,
      type: 'warning',
      message: 'Table has no fields defined',
      affectedElement: { type: 'table', id: table.id, name: table.name }
    });
  }

  // Check for primary key
  const primaryKeys = table.fields.filter(f => f.primaryKey);
  if (primaryKeys.length === 0) {
    errors.push({
      id: `table-${table.id}-no-pk`,
      type: 'warning',
      message: 'Table has no primary key defined',
      suggestion: 'Add a primary key for better performance and data integrity',
      affectedElement: { type: 'table', id: table.id, name: table.name }
    });
  }

  if (primaryKeys.length > 1) {
    errors.push({
      id: `table-${table.id}-multiple-pk`,
      type: 'error',
      message: 'Table has multiple primary keys defined',
      suggestion: 'Use a composite primary key or designate only one field as primary',
      affectedElement: { type: 'table', id: table.id, name: table.name }
    });
  }

  // Validate each field
  table.fields.forEach(field => {
    errors.push(...validateField(field, table, allTables));
  });

  return errors;
}

// Validate field structure
export function validateField(field: DatabaseField, table: DatabaseTable, allTables: DatabaseTable[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check field name
  if (!field.name.trim()) {
    errors.push({
      id: `field-${field.id}-name-empty`,
      type: 'error',
      message: 'Field name cannot be empty',
      affectedElement: { type: 'field', id: field.id, name: field.name }
    });
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
    errors.push({
      id: `field-${field.id}-name-invalid`,
      type: 'error',
      message: 'Field name must start with a letter and contain only letters, numbers, and underscores',
      suggestion: 'Use snake_case naming convention',
      affectedElement: { type: 'field', id: field.id, name: field.name }
    });
  }

  // Check for duplicate field names in table
  const duplicates = table.fields.filter(f => f.name === field.name && f.id !== field.id);
  if (duplicates.length > 0) {
    errors.push({
      id: `field-${field.id}-name-duplicate`,
      type: 'error',
      message: `Field name "${field.name}" is already used in this table`,
      affectedElement: { type: 'field', id: field.id, name: field.name }
    });
  }

  // Validate data type constraints
  errors.push(...validateDataTypeConstraints(field));

  // Validate foreign key
  if (field.foreignKey) {
    errors.push(...validateForeignKey(field, allTables));
  }

  // Check nullable primary key
  if (field.primaryKey && field.nullable) {
    errors.push({
      id: `field-${field.id}-pk-nullable`,
      type: 'error',
      message: 'Primary key cannot be nullable',
      affectedElement: { type: 'field', id: field.id, name: field.name }
    });
  }

  return errors;
}

// Validate data type constraints
export function validateDataTypeConstraints(field: DatabaseField): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check incompatible constraints for certain data types
  if (field.type === 'BOOLEAN' && field.defaultValue && !['true', 'false'].includes(field.defaultValue.toLowerCase())) {
    errors.push({
      id: `field-${field.id}-boolean-default`,
      type: 'error',
      message: 'Boolean field default value must be true or false',
      affectedElement: { type: 'field', id: field.id, name: field.name }
    });
  }

  if (['SERIAL', 'UUID'].includes(field.type) && field.nullable) {
    errors.push({
      id: `field-${field.id}-auto-nullable`,
      type: 'warning',
      message: `${field.type} fields are typically not nullable`,
      suggestion: 'Consider making this field non-nullable',
      affectedElement: { type: 'field', id: field.id, name: field.name }
    });
  }

  if (field.type === 'UUID' && field.defaultValue && field.defaultValue !== 'gen_random_uuid()') {
    errors.push({
      id: `field-${field.id}-uuid-default`,
      type: 'warning',
      message: 'UUID fields should typically use gen_random_uuid() as default',
      suggestion: 'Use gen_random_uuid() for automatic UUID generation',
      affectedElement: { type: 'field', id: field.id, name: field.name }
    });
  }

  return errors;
}

// Validate foreign key relationships
export function validateForeignKey(field: DatabaseField, allTables: DatabaseTable[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!field.foreignKey) return errors;

  const { table: refTableName, field: refFieldName } = field.foreignKey;

  // Check if referenced table exists
  const refTable = allTables.find(t => t.name === refTableName);
  if (!refTable) {
    errors.push({
      id: `field-${field.id}-fk-table-not-found`,
      type: 'error',
      message: `Referenced table "${refTableName}" does not exist`,
      affectedElement: { type: 'relationship', id: field.id, name: `${field.name} -> ${refTableName}.${refFieldName}` }
    });
    return errors;
  }

  // Check if referenced field exists
  const refField = refTable.fields.find(f => f.name === refFieldName);
  if (!refField) {
    errors.push({
      id: `field-${field.id}-fk-field-not-found`,
      type: 'error',
      message: `Referenced field "${refFieldName}" does not exist in table "${refTableName}"`,
      affectedElement: { type: 'relationship', id: field.id, name: `${field.name} -> ${refTableName}.${refFieldName}` }
    });
    return errors;
  }

  // Check data type compatibility
  if (field.type !== refField.type) {
    errors.push({
      id: `field-${field.id}-fk-type-mismatch`,
      type: 'error',
      message: `Foreign key type "${field.type}" does not match referenced field type "${refField.type}"`,
      suggestion: 'Change the field type to match the referenced field',
      affectedElement: { type: 'relationship', id: field.id, name: `${field.name} -> ${refTableName}.${refFieldName}` }
    });
  }

  // Warning if referencing non-unique field
  if (!refField.primaryKey && !refField.unique) {
    errors.push({
      id: `field-${field.id}-fk-not-unique`,
      type: 'warning',
      message: `Referenced field "${refFieldName}" is not unique or primary key`,
      suggestion: 'Consider referencing a unique or primary key field',
      affectedElement: { type: 'relationship', id: field.id, name: `${field.name} -> ${refTableName}.${refFieldName}` }
    });
  }

  return errors;
}

// Validate RLS policy expression
export function validateRLSExpression(expression: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!expression.trim()) {
    return errors; // Empty expressions are allowed
  }

  // Check for basic SQL injection patterns
  const dangerousPatterns = [
    /;\s*drop\s+table/i,
    /;\s*delete\s+from/i,
    /;\s*truncate/i,
    /;\s*alter\s+table/i
  ];

  dangerousPatterns.forEach((pattern, index) => {
    if (pattern.test(expression)) {
      errors.push({
        id: `rls-dangerous-${index}`,
        type: 'error',
        message: 'RLS expression contains potentially dangerous SQL',
        suggestion: 'Remove dangerous SQL commands from the expression'
      });
    }
  });

  // Check for common auth functions
  if (expression.includes('auth.uid()') && !expression.includes('=')) {
    errors.push({
      id: 'rls-auth-uid-comparison',
      type: 'warning',
      message: 'auth.uid() should typically be compared to a field',
      suggestion: 'Use auth.uid() = user_id or similar comparison'
    });
  }

  // Check for overly permissive policies
  if (expression.trim() === 'true') {
    errors.push({
      id: 'rls-always-true',
      type: 'warning',
      message: 'Policy allows unrestricted access',
      suggestion: 'Consider adding proper access controls unless this is for public data'
    });
  }

  return errors;
}

// Validate index configuration
export function validateIndex(indexName: string, tableName: string, columns: string[], indexType: string, tables: DatabaseTable[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!indexName.trim()) {
    errors.push({
      id: 'index-name-empty',
      type: 'error',
      message: 'Index name cannot be empty'
    });
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(indexName)) {
    errors.push({
      id: 'index-name-invalid',
      type: 'error',
      message: 'Index name must start with a letter and contain only letters, numbers, and underscores'
    });
  }

  const table = tables.find(t => t.name === tableName);
  if (!table) {
    errors.push({
      id: 'index-table-not-found',
      type: 'error',
      message: `Table "${tableName}" does not exist`
    });
    return errors;
  }

  if (columns.length === 0) {
    errors.push({
      id: 'index-no-columns',
      type: 'error',
      message: 'Index must have at least one column'
    });
  }

  // Validate each column exists
  columns.forEach((columnName, idx) => {
    const field = table.fields.find(f => f.name === columnName);
    if (!field) {
      errors.push({
        id: `index-column-${idx}-not-found`,
        type: 'error',
        message: `Column "${columnName}" does not exist in table "${tableName}"`
      });
    }
  });

  // Check index type compatibility
  if (indexType === 'HASH' && columns.length > 1) {
    errors.push({
      id: 'index-hash-multi-column',
      type: 'warning',
      message: 'Hash indexes work best with single columns',
      suggestion: 'Consider using B-tree for multi-column indexes'
    });
  }

  return errors;
}

// Get validation summary
export function getValidationSummary(errors: ValidationError[]) {
  const errorCount = errors.filter(e => e.type === 'error').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;
  const infoCount = errors.filter(e => e.type === 'info').length;

  return {
    total: errors.length,
    errors: errorCount,
    warnings: warningCount,
    info: infoCount,
    isValid: errorCount === 0
  };
}