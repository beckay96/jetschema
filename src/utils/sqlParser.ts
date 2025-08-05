import { DatabaseTable, DatabaseField, DataType } from '@/types/database';
import { parse, parseFirst, toSql, astVisitor } from 'pgsql-ast-parser';
import type { 
  CreateTableStatement, 
  CreateColumnDef, 
  DataTypeDef, 
  BasicDataTypeDef, 
  ArrayDataTypeDef, 
  Expr, 
  ExprRef, 
  ExprCall, 
  ExprBinary, 
  ExprList, 
  ExprLiteral, 
  ExprCast, 
  ColumnConstraint, 
  ColumnConstraintDefault, 
  ColumnConstraintCheck, 
  ColumnConstraintReference,
  ColumnConstraintSimple,
  TableConstraint,
  Name,
  QName
} from 'pgsql-ast-parser';

/**
 * Generate a unique ID for database fields
 */
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export interface ParsedTable {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    unique: boolean;
    defaultValue?: string;
    foreignKey?: {
      table: string;
      field: string;
      onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
      onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    };
    check?: string;
  }>;
}

/**
 * Preprocess SQL to handle Postgres syntax not supported by pgsql-ast-parser
 * @param sql - Raw SQL string
 * @returns Preprocessed SQL string
 */
function preprocessSql(sql: string): string {
  let processedSql = sql;
  
  // Remove TABLESPACE clauses (e.g., "TABLESPACE pg_default;")
  processedSql = processedSql.replace(/\s+TABLESPACE\s+[\w_]+\s*;/gi, ';');
  
  // Handle other potential issues
  // Remove schema prefixes from table names in some contexts if needed
  // processedSql = processedSql.replace(/public\./g, '');
  
  return processedSql;
}

/**
 * Parse SQL CREATE TABLE statements using pgsql-ast-parser
 * Supports Postgres-specific features like DEFAULT gen_random_uuid(), CHECK constraints with ANY/ARRAY, type casts
 * @param sql - SQL string containing CREATE TABLE statements
 * @returns Array of parsed table definitions
 */
export function parseCreateTableStatement(sql: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  
  try {
    console.log('Parsing SQL with pgsql-ast-parser');
    
    // Preprocess SQL to handle unsupported Postgres syntax
    const preprocessedSql = preprocessSql(sql);
    console.log('Preprocessed SQL:', preprocessedSql);
    
    // Parse the SQL statements
    const statements = parse(preprocessedSql);
    
    // Filter for CREATE TABLE statements
    for (const stmt of statements) {
      if (stmt.type === 'create table') {
        const createTableStmt = stmt as CreateTableStatement;
        console.log(`Found table: ${createTableStmt.name.name}`);
        
        const parsedTable: ParsedTable = {
          name: createTableStmt.name.name,
          fields: []
        };
        
        // Process columns
        for (const col of createTableStmt.columns) {
          if (col.kind === 'column') {
            const column = col as CreateColumnDef;
            const field = processColumn(column);
            parsedTable.fields.push(field);
          }
        }
        
        tables.push(parsedTable);
      }
    }
    
    console.log('Parsed tables:', tables);
    return tables;
  } catch (error) {
    console.error('Error parsing SQL with pgsql-ast-parser:', error);
    
    // Fallback to legacy parser if pgsql-ast-parser fails
    console.log('Falling back to legacy parser');
    return legacyParseCreateTableStatement(sql);
  }
}

/**
 * Process a column definition from the AST
 * Handles Postgres-specific features like DEFAULT gen_random_uuid(), CHECK constraints, type casts
 * @param column - Column definition from AST
 * @returns Parsed field definition
 */
function processColumn(column: CreateColumnDef): ParsedTable['fields'][0] {
  const field: ParsedTable['fields'][0] = {
    name: column.name.name,
    type: mapDataType(column.dataType),
    nullable: true,
    primaryKey: false,
    unique: false
  };

  // Process column constraints
  if (column.constraints) {
    for (const constraint of column.constraints) {
      processConstraint(constraint, field);
    }
  }
  
  return field;
}

/**
 * Process a column constraint and update the field accordingly
 * @param constraint - Column constraint from AST
 * @param field - Field to update
 */
function processConstraint(constraint: ColumnConstraint, field: ParsedTable['fields'][0]): void {
  switch (constraint.type) {
    case 'not null':
      field.nullable = false;
      break;
    case 'null':
      field.nullable = true;
      break;
    case 'primary key':
      field.primaryKey = true;
      field.nullable = false;
      break;
    case 'unique':
      field.unique = true;
      break;
    case 'default':
      const defaultConstraint = constraint as ColumnConstraintDefault;
      field.defaultValue = processDefaultValue(defaultConstraint.default);
      break;
    case 'check':
      const checkConstraint = constraint as ColumnConstraintCheck;
      field.check = processCheckExpression(checkConstraint.expr);
      break;
    case 'reference':
      const refConstraint = constraint as ColumnConstraintReference;
      field.foreignKey = {
        table: refConstraint.foreignTable.name,
        field: refConstraint.foreignColumns[0]?.name || 'id',
        onDelete: refConstraint.onDelete?.toUpperCase() as 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | undefined,
        onUpdate: refConstraint.onUpdate?.toUpperCase() as 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' | undefined
      };
      break;
  }
}

/**
 * Map a DataTypeDef to a string representation
 * Handles both BasicDataTypeDef and ArrayDataTypeDef
 * @param dataType - Data type definition from AST
 * @returns String representation of the data type
 */
function mapDataType(dataType: DataTypeDef): string {
  if (dataType.kind === 'array') {
    const arrayType = dataType as ArrayDataTypeDef;
    return `${mapDataType(arrayType.arrayOf)}[]`;
  }
  
  const basicType = dataType as BasicDataTypeDef;
  let typeStr = basicType.name;
  
  // Handle type configurations (e.g., VARCHAR(255), DECIMAL(10,2))
  if (basicType.config && basicType.config.length > 0) {
    typeStr += `(${basicType.config.join(', ')})`;
  }
  
  return normalizeDataType(typeStr);
}

/**
 * Normalize data type names to standard PostgreSQL types
 * @param type - Data type string
 * @returns Normalized data type string
 */
function normalizeDataType(type: string): string {
  const upperType = type.toUpperCase();
  
  // Handle parameterized types
  const baseType = upperType.split('(')[0];
  
  // Map common variants to standard types
  const typeMap: Record<string, string> = {
    'INT': 'INTEGER',
    'INT4': 'INTEGER',
    'INT8': 'BIGINT',
    'INT2': 'SMALLINT',
    'FLOAT': 'REAL',
    'FLOAT4': 'REAL',
    'FLOAT8': 'DOUBLE PRECISION',
    'BOOL': 'BOOLEAN',
    'TIMESTAMPTZ': 'TIMESTAMPTZ',
    'TIMESTAMP WITH TIME ZONE': 'TIMESTAMPTZ'
  };
  
  const normalizedType = typeMap[baseType] || baseType;
  
  // Preserve the parameters if present
  if (type.includes('(')) {
    const params = type.substring(type.indexOf('('));
    return normalizedType + params;
  }
  
  return normalizedType;
}

/**
 * Process a CHECK constraint expression
 * Supports Postgres-specific syntax like column = ANY (ARRAY[...])
 * @param expr - Expression from AST
 * @returns String representation of the check constraint
 */
function processCheckExpression(expr: Expr): string {
  switch (expr.type) {
    case 'binary':
      const binary = expr as ExprBinary;
      const left = processExpr(binary.left);
      const right = processExpr(binary.right);
      
      // Handle special case: column = ANY (ARRAY[...])
      if (binary.op === '=' && right.includes('ANY')) {
        return `${left} = ${right}`;
      }
      
      return `${left} ${binary.op} ${right}`;
    case 'call':
      const call = expr as ExprCall;
      if (call.function.name === 'ANY') {
        const args = call.args?.map(arg => processExpr(arg)).join(', ') || '';
        return `ANY(${args})`;
      }
      return `${call.function.name}(${call.args?.map(arg => processExpr(arg)).join(', ') || ''})`;
    case 'list':
      const list = expr as ExprList;
      return `ARRAY[${list.expressions.map(e => processExpr(e)).join(', ')}]`;
    case 'integer':
    case 'numeric':
    case 'boolean':
      const literal = expr as any;
      return String(literal.value);
    case 'string':
      return `'${(expr as any).value}'`;
    case 'ref':
      const ref = expr as ExprRef;
      return ref.name;
    default:
      return toSql.expr(expr);
  }
}

/**
 * Process a DEFAULT value expression
 * Supports Postgres-specific functions like gen_random_uuid()
 * @param expr - Expression from AST
 * @returns String representation of the default value
 */
function processDefaultValue(expr: Expr): string {
  switch (expr.type) {
    case 'integer':
    case 'numeric':
    case 'boolean':
      const literal = expr as any;
      return String(literal.value);
    case 'string':
      return `'${(expr as any).value}'`;
    case 'call':
      const call = expr as ExprCall;
      // Handle function calls like gen_random_uuid()
      if (call.function.name === 'gen_random_uuid') {
        return 'gen_random_uuid()';
      }
      return `${call.function.name}(${call.args?.map(arg => processExpr(arg)).join(', ') || ''})`;
    case 'cast':
      const cast = expr as ExprCast;
      // Normalize ::text to CAST() expression
      const castExpr = processExpr(cast.operand);
      const castType = mapDataType(cast.to);
      return `CAST(${castExpr} AS ${castType})`;
    case 'ref':
      const ref = expr as ExprRef;
      return ref.name;
    default:
      return toSql.expr(expr);
  }
}

/**
 * Process any expression from the AST
 * @param expr - Expression from AST
 * @returns String representation of the expression
 */
function processExpr(expr: Expr): string {
  switch (expr.type) {
    case 'ref':
      const ref = expr as ExprRef;
      return ref.name;
    case 'string':
      return `'${(expr as any).value}'`;
    case 'integer':
    case 'numeric':
    case 'boolean':
      const literal = expr as any;
      return String(literal.value);
    case 'call':
      const call = expr as ExprCall;
      const args = call.args?.map(arg => processExpr(arg)).join(', ') || '';
      return `${call.function.name}(${args})`;
    case 'binary':
      const binary = expr as ExprBinary;
      return `${processExpr(binary.left)} ${binary.op} ${processExpr(binary.right)}`;
    case 'cast':
      const cast = expr as ExprCast;
      // Normalize ::text to CAST() expression
      const castExpr = processExpr(cast.operand);
      const castType = mapDataType(cast.to);
      return `CAST(${castExpr} AS ${castType})`;
    default:
      return toSql.expr(expr);
  }
}

/**
 * Legacy parser implementation for backward compatibility
 * @param sql - SQL string containing CREATE TABLE statements
 * @returns Array of parsed table definitions
 */
function legacyParseCreateTableStatement(sql: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  
  console.log('Input SQL:', sql);
  
  // Clean and normalize the SQL
  const cleanSql = sql.replace(/\s+/g, ' ').trim();
  console.log('Cleaned SQL:', cleanSql);
  
  // Updated regex to be more permissive with multiline statements
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(((?:[^()]|\([^()]*\))*)\)\s*;?/gi;
  let match;
  
  while ((match = createTableRegex.exec(cleanSql)) !== null) {
    console.log('Found table match:', match);
    const tableName = match[1];
    const tableContent = match[2];
    
    console.log(`Parsing table: ${tableName}`);
    console.log(`Table content: ${tableContent}`);
    
    const fields = parseTableFields(tableContent);
    console.log(`Parsed fields:`, fields);
    
    tables.push({
      name: tableName,
      fields
    });
  }
  
  console.log('Final tables array:', tables);
  return tables;
}

/**
 * Parse table field definitions (legacy implementation)
 * @param content - Table content string
 * @returns Array of parsed field definitions
 */
function parseTableFields(content: string): ParsedTable['fields'] {
  const fields: ParsedTable['fields'] = [];
  
  // Split by commas, but be careful about commas inside parentheses
  const fieldStatements = splitFieldStatements(content);
  
  for (const statement of fieldStatements) {
    const trimmed = statement.trim();
    
    // Skip constraint definitions for now
    if (trimmed.toUpperCase().startsWith('CONSTRAINT') || 
        trimmed.toUpperCase().startsWith('PRIMARY KEY') ||
        trimmed.toUpperCase().startsWith('FOREIGN KEY') ||
        trimmed.toUpperCase().startsWith('UNIQUE') ||
        trimmed.toUpperCase().startsWith('CHECK')) {
      continue;
    }
    
    const field = parseFieldDefinition(trimmed);
    if (field) {
      fields.push(field);
    }
  }
  
  return fields;
}

/**
 * Split field statements by commas, respecting parentheses (legacy implementation)
 * @param content - Table content string
 * @returns Array of field statement strings
 */
function splitFieldStatements(content: string): string[] {
  const statements: string[] = [];
  let current = '';
  let parenthesesCount = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '(') {
      parenthesesCount++;
    } else if (char === ')') {
      parenthesesCount--;
    } else if (char === ',' && parenthesesCount === 0) {
      statements.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  return statements;
}

/**
 * Parse a field definition string (legacy implementation)
 * @param statement - Field definition string
 * @returns Parsed field definition or null if invalid
 */
function parseFieldDefinition(statement: string): ParsedTable['fields'][0] | null {
  // Basic pattern: field_name data_type [constraints]
  const parts = statement.split(/\s+/);
  if (parts.length < 2) return null;
  
  const fieldName = parts[0];
  const dataType = parts[1];
  
  // Check for constraints
  const upperStatement = statement.toUpperCase();
  const nullable = !upperStatement.includes('NOT NULL');
  const primaryKey = upperStatement.includes('PRIMARY KEY');
  const unique = upperStatement.includes('UNIQUE');
  
  // Check for default value
  let defaultValue: string | undefined;
  const defaultMatch = statement.match(/DEFAULT\s+([^,\s]+)/i);
  if (defaultMatch) {
    defaultValue = defaultMatch[1];
  }
  
  // Check for CHECK constraint
  let check: string | undefined;
  const checkMatch = statement.match(/CHECK\s+\((.+?)\)/i);
  if (checkMatch) {
    check = checkMatch[1];
  }
  
  return {
    name: fieldName,
    type: normalizeDataType(dataType),
    nullable,
    primaryKey,
    unique,
    defaultValue,
    check
  };
}

/**
 * Convert parsed table definitions to DatabaseTable objects for the application
 * @param parsedTables - Array of parsed table definitions
 * @returns Array of DatabaseTable objects
 */
export function convertParsedTablesToDatabase(parsedTables: ParsedTable[]): DatabaseTable[] {
  return parsedTables.map((table, index) => ({
    id: generateId(),
    name: table.name,
    fields: table.fields.map(field => ({
      id: generateId(),
      name: field.name,
      type: field.type as DataType,
      nullable: field.nullable,
      primaryKey: field.primaryKey,
      unique: field.unique,
      defaultValue: field.defaultValue,
      foreignKey: field.foreignKey
    })),
    position: { x: index * 300, y: index * 200 },
    color: '#3B82F6'
  }));
}

/**
 * Generate SQL CREATE TABLE statements from DatabaseTable objects
 * @param tables - Array of DatabaseTable objects
 * @returns SQL string with CREATE TABLE statements
 */
export function generateSQLFromTables(tables: DatabaseTable[]): string {
  let sql = '';
  
  for (const table of tables) {
    sql += `CREATE TABLE ${table.name} (\n`;
    
    const fieldDefinitions = table.fields.map(field => {
      let definition = `  ${field.name} ${field.type}`;
      
      if (field.primaryKey) {
        definition += ' PRIMARY KEY';
      }
      
      if (!field.nullable && !field.primaryKey) {
        definition += ' NOT NULL';
      }
      
      if (field.unique && !field.primaryKey) {
        definition += ' UNIQUE';
      }
      
      if (field.defaultValue) {
        // Handle function calls in default values (like gen_random_uuid())
        definition += ` DEFAULT ${field.defaultValue}`;
      }
      
      // Add CHECK constraints if present in the comment field
      if (field.comment && field.comment.startsWith('Check:')) {
        const checkConstraint = field.comment.substring('Check:'.length).trim();
        definition += ` CHECK (${checkConstraint})`;
      }
      
      return definition;
    });
    
    // Add field definitions
    sql += fieldDefinitions.join(',\n');
    
    // Add foreign key constraints
    const foreignKeyConstraints = table.fields
      .filter(field => field.foreignKey)
      .map(field => {
        const fk = field.foreignKey!;
        let constraint = `  FOREIGN KEY (${field.name}) REFERENCES ${fk.table}(${fk.field})`;
        
        if (fk.onDelete) {
          constraint += ` ON DELETE ${fk.onDelete}`;
        }
        
        if (fk.onUpdate) {
          constraint += ` ON UPDATE ${fk.onUpdate}`;
        }
        
        return constraint;
      });
    
    if (foreignKeyConstraints.length > 0) {
      sql += ',\n' + foreignKeyConstraints.join(',\n');
    }
    
    sql += '\n);\n\n';
  }
  
  return sql.trim();
}