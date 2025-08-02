import { DatabaseTable, DatabaseField, DatabaseTrigger, DatabaseFunction } from '@/types/database';

/**
 * Database naming convention types
 */
export enum NamingConvention {
  SNAKE_CASE = 'snake_case',
  CAMEL_CASE = 'camelCase',
  PASCAL_CASE = 'PascalCase',
  KEBAB_CASE = 'kebab-case',
}

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  messages: ValidationMessage[];
}

/**
 * Validation message interface
 */
export interface ValidationMessage {
  message: string;
  severity: ValidationSeverity;
  field?: string;
  tableId?: string;
  objectId?: string;
}

/**
 * Checks if a string follows snake_case convention
 */
export function isSnakeCase(str: string): boolean {
  return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(str);
}

/**
 * Checks if a string follows camelCase convention
 */
export function isCamelCase(str: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(str) && str.toLowerCase() !== str;
}

/**
 * Checks if a string follows PascalCase convention
 */
export function isPascalCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

/**
 * Checks if a string follows kebab-case convention
 */
export function isKebabCase(str: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str);
}

/**
 * Checks if a string follows the specified naming convention
 */
export function followsNamingConvention(str: string, convention: NamingConvention): boolean {
  switch (convention) {
    case NamingConvention.SNAKE_CASE:
      return isSnakeCase(str);
    case NamingConvention.CAMEL_CASE:
      return isCamelCase(str);
    case NamingConvention.PASCAL_CASE:
      return isPascalCase(str);
    case NamingConvention.KEBAB_CASE:
      return isKebabCase(str);
    default:
      return true;
  }
}

/**
 * Validates table names according to best practices
 */
export function validateTableName(tableName: string): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  // Check for snake_case (PostgreSQL best practice)
  if (!isSnakeCase(tableName)) {
    messages.push({
      message: `Table name '${tableName}' should follow snake_case convention for PostgreSQL best practices`,
      severity: ValidationSeverity.WARNING,
    });
  }
  
  // Check for plural form (convention)
  if (!tableName.endsWith('s') && !tableName.endsWith('data') && !tableName.endsWith('info')) {
    messages.push({
      message: `Table name '${tableName}' should typically be plural (e.g., 'users' instead of 'user')`,
      severity: ValidationSeverity.INFO,
    });
  }
  
  // Check for reserved words
  const reservedWords = ['user', 'group', 'order', 'select', 'where', 'from', 'join', 'table', 'index', 'constraint'];
  if (reservedWords.includes(tableName.toLowerCase())) {
    messages.push({
      message: `Table name '${tableName}' is a reserved word in SQL and should be avoided`,
      severity: ValidationSeverity.ERROR,
    });
  }
  
  return messages;
}

/**
 * Validates column names according to best practices
 */
export function validateColumnName(columnName: string): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  // Check for snake_case (PostgreSQL best practice)
  if (!isSnakeCase(columnName)) {
    messages.push({
      message: `Column name '${columnName}' should follow snake_case convention for PostgreSQL best practices`,
      severity: ValidationSeverity.WARNING,
    });
  }
  
  // Check for reserved words
  const reservedWords = ['user', 'group', 'order', 'select', 'where', 'from', 'join', 'table', 'index', 'constraint'];
  if (reservedWords.includes(columnName.toLowerCase())) {
    messages.push({
      message: `Column name '${columnName}' is a reserved word in SQL and should be avoided`,
      severity: ValidationSeverity.ERROR,
    });
  }
  
  return messages;
}

/**
 * Validates primary key naming convention
 */
export function validatePrimaryKeyName(tableName: string, pkName: string): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  // Check for standard primary key naming convention
  const expectedPkName = `${tableName}_pkey`;
  if (pkName !== 'id' && pkName !== expectedPkName && !pkName.endsWith('_id')) {
    messages.push({
      message: `Primary key '${pkName}' should follow standard naming convention (e.g., 'id' or '${tableName}_id')`,
      severity: ValidationSeverity.INFO,
    });
  }
  
  return messages;
}

/**
 * Validates foreign key naming convention
 */
export function validateForeignKeyName(columnName: string): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  // Check for standard foreign key naming convention
  if (!columnName.endsWith('_id')) {
    messages.push({
      message: `Foreign key column '${columnName}' should end with '_id' suffix`,
      severity: ValidationSeverity.INFO,
    });
  }
  
  return messages;
}

/**
 * Validates RLS (Row-Level Security) policies
 */
export function validateRlsPolicies(table: DatabaseTable): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  // Check if the table has sensitive data that might need RLS
  const hasSensitiveData = table.fields.some(field => 
    field.name.toLowerCase().includes('user') || 
    field.name.toLowerCase().includes('email') || 
    field.name.toLowerCase().includes('password') ||
    field.name.toLowerCase().includes('address') ||
    field.name.toLowerCase().includes('phone') ||
    field.name.toLowerCase().includes('credit') ||
    field.name.toLowerCase().includes('ssn') ||
    field.name.toLowerCase().includes('secret')
  );
  
  // If table has user_id or tenant_id column, it likely needs RLS
  const hasUserOrTenantColumn = table.fields.some(field => 
    field.name === 'user_id' || 
    field.name === 'tenant_id' || 
    field.name === 'organization_id'
  );
  
  // Check for RLS - in this implementation we'll check for a custom property or assume no RLS
  // In a real implementation, you'd check for actual RLS policies in the database
  const hasRlsEnabled = (table as any).hasRlsEnabled || false;
  
  if ((hasSensitiveData || hasUserOrTenantColumn) && !hasRlsEnabled) {
    messages.push({
      message: `Table '${table.name}' contains sensitive data or user references but doesn't have Row-Level Security (RLS) enabled`,
      severity: ValidationSeverity.WARNING,
      tableId: table.id,
    });
  }
  
  return messages;
}

/**
 * Validates index naming convention
 */
export function validateIndexName(tableName: string, columnName: string, indexName: string): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  
  // Check for standard index naming convention
  const expectedIndexName = `idx_${tableName}_${columnName}`;
  if (!indexName.startsWith('idx_')) {
    messages.push({
      message: `Index name '${indexName}' should follow standard naming convention (e.g., '${expectedIndexName}')`,
      severity: ValidationSeverity.INFO,
    });
  }
  
  return messages;
}

/**
 * Validates a complete database table schema
 */
export function validateTable(table: DatabaseTable): ValidationResult {
  const messages: ValidationMessage[] = [];
  
  // Validate table name
  const tableNameMessages = validateTableName(table.name);
  messages.push(...tableNameMessages.map(msg => ({
    ...msg,
    tableId: table.id,
  })));
  
  // Validate column names
  table.fields.forEach(field => {
    const columnMessages = validateColumnName(field.name);
    messages.push(...columnMessages.map(msg => ({
      ...msg,
      field: field.name,
      tableId: table.id,
    })));
    
    // Validate primary key
    if (field.primaryKey) {
      const pkMessages = validatePrimaryKeyName(table.name, field.name);
      messages.push(...pkMessages.map(msg => ({
        ...msg,
        field: field.name,
        tableId: table.id,
      })));
    }
    
    // Validate foreign key
    if (field.foreignKey) {
      const fkMessages = validateForeignKeyName(field.name);
      messages.push(...fkMessages.map(msg => ({
        ...msg,
        field: field.name,
        tableId: table.id,
      })));
    }
  });
  
  // Validate RLS policies
  const rlsMessages = validateRlsPolicies(table);
  messages.push(...rlsMessages);
  
  return {
    isValid: !messages.some(msg => msg.severity === ValidationSeverity.ERROR),
    messages,
  };
}

/**
 * Validates all tables in a database schema
 */
export function validateDatabaseSchema(tables: DatabaseTable[]): ValidationResult {
  const messages: ValidationMessage[] = [];
  let isValid = true;
  
  tables.forEach(table => {
    const tableValidation = validateTable(table);
    messages.push(...tableValidation.messages);
    
    if (!tableValidation.isValid) {
      isValid = false;
    }
  });
  
  return {
    isValid,
    messages,
  };
}

/**
 * Suggests fixes for validation issues
 */
export function suggestFix(message: ValidationMessage): string {
  if (message.message.includes('snake_case')) {
    const name = message.message.match(/'([^']+)'/)?.[1] || '';
    return `Consider renaming to '${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}'`;
  }
  
  if (message.message.includes('plural')) {
    const name = message.message.match(/'([^']+)'/)?.[1] || '';
    return `Consider renaming to '${name}s'`;
  }
  
  if (message.message.includes('reserved word')) {
    const name = message.message.match(/'([^']+)'/)?.[1] || '';
    return `Consider renaming to '${name}_table' or another non-reserved name`;
  }
  
  if (message.message.includes('foreign key')) {
    const name = message.message.match(/'([^']+)'/)?.[1] || '';
    if (!name.endsWith('_id')) {
      return `Consider renaming to '${name}_id'`;
    }
  }
  
  if (message.message.includes('Row-Level Security')) {
    return 'Enable RLS and create appropriate policies to restrict row access based on user identity';
  }
  
  return 'Review and update according to best practices';
}
