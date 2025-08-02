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
  width?: number;    // For storing node width after resizing
  height?: number;   // For storing node height after resizing
  color?: string;
  comment?: string;
  project_id?: string; // Reference to the project this table belongs to
  sizePreference?: 'small' | 'medium' | 'large' | 'xlarge' | 'huge'; // For size toggle preference
}

export interface DatabaseTrigger {
  id?: string;
  project_id: string;
  name: string;
  table_name: string;
  trigger_event: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE';
  trigger_timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  function_id?: string;
  is_active: boolean;
  conditions?: string;
  author_id?: string;
  description?: string;
}

export interface DatabaseFunction {
  id?: string;
  project_id: string;
  name: string;
  description?: string;
  function_type: 'plpgsql' | 'edge' | 'cron';
  parameters: Array<{
    name: string;
    type: string;
    default?: string;
  }>;
  return_type?: string;
  function_body: string;
  is_edge_function: boolean;
  edge_function_name?: string;
  cron_schedule?: string;
  is_cron_enabled: boolean;
  author_id?: string;
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