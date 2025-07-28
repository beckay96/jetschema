export interface DatabaseField {
  id: string;
  name: string;
  type: DataType;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultValue?: string;
  comment?: string;
  foreignKey?: {
    table: string;
    field: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  };
}

export interface DatabaseTable {
  id: string;
  name: string;
  fields: DatabaseField[];
  position: { x: number; y: number };
  color?: string;
  comment?: string;
}

export interface DatabaseTrigger {
  id: string;
  name: string;
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  code: string;
  description?: string;
}

export interface DatabaseFunction {
  id: string;
  name: string;
  returnType: string;
  parameters: Array<{
    name: string;
    type: string;
    defaultValue?: string;
  }>;
  code: string;
  description?: string;
}

export interface DatabaseProject {
  id: string;
  name: string;
  description?: string;
  tables: DatabaseTable[];
  triggers: DatabaseTrigger[];
  functions: DatabaseFunction[];
  createdAt: Date;
  updatedAt: Date;
}

export type DataType = 
  | 'UUID'
  | 'SERIAL'
  | 'INTEGER'
  | 'INT'
  | 'INT4'
  | 'INT8'
  | 'BIGINT'
  | 'SMALLINT'
  | 'DECIMAL'
  | 'NUMERIC'
  | 'REAL'
  | 'FLOAT'
  | 'DOUBLE PRECISION'
  | 'VARCHAR'
  | 'CHAR'
  | 'TEXT'
  | 'STRING'
  | 'BOOLEAN'
  | 'BOOL'
  | 'DATE'
  | 'TIME'
  | 'TIMESTAMP'
  | 'TIMESTAMPTZ'
  | 'JSON'
  | 'JSONB'
  | 'ARRAY'
  | 'BYTEA'
  | 'INET'
  | 'CIDR'
  | 'MACADDR'
  | 'EMAIL'
  | 'ENUM';

export const DATA_TYPE_CATEGORIES = {
  STRING: ['VARCHAR', 'CHAR', 'TEXT'],
  NUMBER: ['SERIAL', 'INTEGER', 'BIGINT', 'SMALLINT', 'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION'],
  BOOLEAN: ['BOOLEAN'],
  DATE: ['DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ'],
  UUID: ['UUID'],
  JSON: ['JSON', 'JSONB'],
  BINARY: ['BYTEA', 'ARRAY'],
  NETWORK: ['INET', 'CIDR', 'MACADDR']
} as const;

export function getDataTypeCategory(type: DataType): keyof typeof DATA_TYPE_CATEGORIES {
  for (const [category, types] of Object.entries(DATA_TYPE_CATEGORIES)) {
    if ((types as readonly string[]).includes(type)) {
      return category as keyof typeof DATA_TYPE_CATEGORIES;
    }
  }
  return 'STRING';
}

export function getDataTypeColor(type: DataType): string {
  const colorMap: Record<DataType, string> = {
    UUID: 'color-uuid',
    TEXT: 'color-text',
    VARCHAR: 'color-varchar',
    STRING: 'color-string',
    CHAR: 'color-string',
    INT: 'color-int',
    INTEGER: 'color-integer',
    INT4: 'color-int4',
    INT8: 'color-int8',
    BIGINT: 'color-bigint',
    SMALLINT: 'color-int',
    SERIAL: 'color-serial',
    BOOLEAN: 'color-boolean',
    BOOL: 'color-bool',
    TIMESTAMP: 'color-timestamp',
    TIMESTAMPTZ: 'color-timestamptz',
    DATE: 'color-date',
    TIME: 'color-time',
    JSON: 'color-json',
    JSONB: 'color-jsonb',
    DECIMAL: 'color-decimal',
    NUMERIC: 'color-numeric',
    FLOAT: 'color-float',
    REAL: 'color-real',
    'DOUBLE PRECISION': 'color-real',
    EMAIL: 'color-email',
    ENUM: 'color-enum',
    ARRAY: 'color-array',
    BYTEA: 'color-bytea',
    INET: 'color-inet',
    CIDR: 'color-cidr',
    MACADDR: 'color-macaddr',
  };
  
  return colorMap[type] || 'color-string';
}