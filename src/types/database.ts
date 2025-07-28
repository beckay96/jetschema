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
  | 'BIGINT'
  | 'SMALLINT'
  | 'DECIMAL'
  | 'NUMERIC'
  | 'REAL'
  | 'DOUBLE PRECISION'
  | 'VARCHAR'
  | 'CHAR'
  | 'TEXT'
  | 'BOOLEAN'
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
  | 'MACADDR';

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
  const category = getDataTypeCategory(type);
  switch (category) {
    case 'STRING': return 'type-string';
    case 'NUMBER': return 'type-number';
    case 'BOOLEAN': return 'type-boolean';
    case 'DATE': return 'type-date';
    case 'UUID': return 'type-uuid';
    case 'JSON': return 'type-json';
    case 'BINARY': return 'type-binary';
    case 'NETWORK': return 'type-binary';
    default: return 'type-string';
  }
}