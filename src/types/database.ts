// ========================
// Database Core Types
// ========================

export interface DatabaseField {
  id: string;
  name: string;
  type: DataType;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  indexed?: boolean;
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

export interface SchemaComment {
  id: string;
  content: string;
  author?: string;
  createdAt: string;
  read: boolean;
  context?: {
    parentTable?: string;
    parentField?: string;
    parentTrigger?: string;
    parentFunction?: string;
    commentId?: string;
  };
  convertedToTaskId?: string;
}

export interface SchemaTask {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  author?: string;
  context?: {
    parentTable?: string;
    parentField?: string;
    parentTrigger?: string;
    parentFunction?: string;
    commentId?: string;
  };
}

export interface DatabaseFieldMockup {
  id: string;
  name: string;
  type: string;
  primaryKey: boolean;
  required: boolean;
  unique: boolean;
  defaultValue?: string;
  description?: string;
  foreignKey?: {
    table: string;
    field: string;
    onDelete: string;
    onUpdate: string;
  };
}

export interface DatabaseTableMockup {
  id: string;
  name: string;
  fields: DatabaseFieldMockup[];
  position: { x: number; y: number };
}

export interface DatabaseTriggerMockup {
  id: string;
  name: string;
  table: string;
  event: string;
  timing: string;
  code: string;
}

export interface DatabaseFunctionMockup {
  id: string;
  name: string;
  returnType: string;
  code: string;
  language: string;
}

export interface ProjectMockup {
  id: string;
  name: string;
  url: string;
  page: string;
  createdAt: string;
  description?: string;
  type: 'image' | 'webview';
}

export interface ProjectMockupCategory {
  id: string;
  name: string;
  mockups: ProjectMockup[];
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

// ========================
// Database Function & Trigger Types
// ========================

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
  parameters: Array<{ name: string; type: string; default?: string }>;
  return_type?: string;
  function_body: string;
  is_edge_function: boolean;
  edge_function_name?: string;
  cron_schedule?: string;
  is_cron_enabled: boolean;
  author_id?: string;
}

// ========================
// Component Props Types
// ========================

export const DATA_TYPES: DataType[] = [
  'UUID', 'TEXT', 'VARCHAR', 'STRING', 'INT', 'INTEGER', 'INT4', 'INT8', 
  'BIGINT', 'SERIAL', 'BOOLEAN', 'BOOL', 'TIMESTAMP', 'TIMESTAMPTZ', 
  'DATE', 'TIME', 'JSON', 'JSONB', 'DECIMAL', 'NUMERIC', 'FLOAT', 
  'REAL', 'EMAIL', 'ENUM', 'ARRAY', 'BYTEA'
];

export interface TableEditModalProps {
  table: DatabaseTable;
  allTables: DatabaseTable[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTableUpdate: (updatedTable: DatabaseTable) => void;
  /**
   * If true, automatically add a new field when the modal opens
   */
  addFieldOnOpen?: boolean;
}

export interface DatabaseSidebarProps {
  tables: DatabaseTable[];
  triggers: DatabaseTrigger[];
  functions: DatabaseFunction[];
  selectedTable?: DatabaseTable | null;
  projectId?: string;
  onAddTable?: () => void;
  onAddTrigger?: (trigger: Omit<DatabaseTrigger, 'id'>) => void;
  onAddFunction?: (func: Omit<DatabaseFunction, 'id'>) => void;
  onSelectTable?: (table: DatabaseTable) => void;
  onDeleteTable?: (tableId: string) => void;
  onDeleteTrigger?: (triggerId: string) => void;
  onDeleteFunction?: (functionId: string) => void;
  onUpdateTrigger?: (trigger: DatabaseTrigger) => void;
  onUpdateFunction?: (func: DatabaseFunction) => void;
  onSaveProject?: () => void;
  onShare?: () => void;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  onReorderTables?: (reorderedTables: DatabaseTable[]) => void;
  onAddComment?: (elementType: 'table' | 'field', elementId: string, elementName: string) => void;
  // Props for unified resizing control
  width?: number;
  isCollapsed?: boolean;
  onResize?: (newWidth: number) => void;
  onToggleCollapse?: () => void;
}

export interface SortableTableCardProps {
  table: DatabaseTable;
  isSelected: boolean;
  isValidated?: boolean;
  hasWarnings?: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onAddComment?: (elementType: 'table' | 'field', elementId: string, elementName: string) => void;
}

// ========================
// Constants
// ========================

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
    CHAR: 'color-char', // Give CHAR its own color variable
    INT: 'color-int',
    INTEGER: 'color-integer',
    INT4: 'color-int4',
    INT8: 'color-int8',
    BIGINT: 'color-bigint',
    SMALLINT: 'color-smallint', // Give SMALLINT its own color variable
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
    'DOUBLE PRECISION': 'color-double-precision', // Give DOUBLE PRECISION its own color variable
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