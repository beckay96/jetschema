import { DatabaseTable, DatabaseField, DataType } from '@/types/database';

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
    };
  }>;
}

export function parseCreateTableStatement(sql: string): ParsedTable[] {
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
  
  return {
    name: fieldName,
    type: normalizeDataType(dataType),
    nullable,
    primaryKey,
    unique,
    defaultValue
  };
}

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
  
  return typeMap[baseType] || baseType;
}

export function convertParsedTablesToDatabase(parsedTables: ParsedTable[]): DatabaseTable[] {
  return parsedTables.map((table, index) => ({
    id: `table-${index + 1}`,
    name: table.name,
    position: { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
    fields: table.fields.map((field, fieldIndex) => ({
      id: `field-${index + 1}-${fieldIndex + 1}`,
      name: field.name,
      type: field.type as DataType,
      nullable: field.nullable,
      primaryKey: field.primaryKey,
      unique: field.unique,
      defaultValue: field.defaultValue,
      foreignKey: field.foreignKey
    }))
  }));
}

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
        definition += ` DEFAULT ${field.defaultValue}`;
      }
      
      return definition;
    });
    
    sql += fieldDefinitions.join(',\n');
    sql += '\n);\n\n';
  }
  
  return sql.trim();
}