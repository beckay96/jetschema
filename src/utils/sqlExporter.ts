/**
 * SQL Export Utilities for JetSchema
 * Generates production-ready SQL scripts from normalized database schema
 * Supports full database exports and partial exports for specific components
 */

import { supabase } from '@/integrations/supabase/client';

// Types for database objects
interface DatabaseTable {
  id: string;
  name: string;
  description?: string;
  schema_name: string;
}

interface DatabaseField {
  id: string;
  table_id: string;
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_unique: boolean;
  default_value?: string;
  description?: string;
  order_index: number;
}

interface DatabaseRelationship {
  id: string;
  source_table_name: string;
  source_field_name: string;
  target_table_name: string;
  target_field_name: string;
  relationship_type: string;
  on_delete_action: string;
  on_update_action: string;
  name?: string;
}

interface DatabaseConstraint {
  id: string;
  table_name: string;
  name: string;
  constraint_type: string;
  definition: string;
  columns: string[];
}

interface DatabaseIndex {
  id: string;
  name: string;
  table_name: string;
  columns: string[];
  index_type: string;
  is_unique: boolean;
  is_partial: boolean;
  where_clause?: string;
}

interface DatabaseFunction {
  id: string;
  name: string;
  description?: string;
  function_type: string;
  parameters: any[];
  return_type: string;
  function_body: string;
}

interface DatabaseTrigger {
  id: string;
  name: string;
  table_name: string;
  timing: string;
  event: string;
  function_name: string;
  description?: string;
}

interface DatabasePolicy {
  id: string;
  name: string;
  table_name: string;
  command: string;
  role: string;
  using_expression?: string;
  with_check_expression?: string;
}

export interface SqlExportOptions {
  includeTables?: boolean;
  includeIndexes?: boolean;
  includeFunctions?: boolean;
  includeTriggers?: boolean;
  includePolicies?: boolean;
  includeConstraints?: boolean;
  includeComments?: boolean;
  specificTables?: string[];
  schemaName?: string;
}

export class SqlExporter {
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Generate complete SQL export for the entire project
   */
  async generateFullExport(options: SqlExportOptions = {}): Promise<string> {
    const defaultOptions: SqlExportOptions = {
      includeTables: true,
      includeIndexes: true,
      includeFunctions: true,
      includeTriggers: true,
      includePolicies: true,
      includeConstraints: true,
      includeComments: true,
      schemaName: 'public',
      ...options
    };

    let sql = '';

    // Header
    sql += this.generateHeader();

    // Extensions
    sql += this.generateExtensions();

    // Tables and fields
    if (defaultOptions.includeTables) {
      sql += await this.generateTablesSQL(defaultOptions);
    }

    // Indexes
    if (defaultOptions.includeIndexes) {
      sql += await this.generateIndexesSQL(defaultOptions);
    }

    // Functions
    if (defaultOptions.includeFunctions) {
      sql += await this.generateFunctionsSQL(defaultOptions);
    }

    // Triggers
    if (defaultOptions.includeTriggers) {
      sql += await this.generateTriggersSQL(defaultOptions);
    }

    // RLS Policies
    if (defaultOptions.includePolicies) {
      sql += await this.generatePoliciesSQL(defaultOptions);
    }

    // Footer
    sql += this.generateFooter();

    return sql;
  }

  /**
   * Generate SQL for tables only
   */
  async generateTablesSQL(options: SqlExportOptions = {}): Promise<string> {
    const tables = await this.fetchTables(options.specificTables);
    const fields = await this.fetchFields();
    const relationships = await this.fetchRelationships();
    const constraints = await this.fetchConstraints();

    let sql = '\n-- =====================================================\n';
    sql += '-- TABLE DEFINITIONS\n';
    sql += '-- =====================================================\n\n';

    for (const table of tables) {
      sql += await this.generateTableSQL(table, fields, relationships, constraints, options);
      sql += '\n';
    }

    return sql;
  }

  /**
   * Generate SQL for a single table
   */
  private async generateTableSQL(
    table: DatabaseTable,
    allFields: DatabaseField[],
    allRelationships: DatabaseRelationship[],
    allConstraints: DatabaseConstraint[],
    options: SqlExportOptions
  ): Promise<string> {
    const tableFields = allFields
      .filter(f => f.table_id === table.id)
      .sort((a, b) => a.order_index - b.order_index);

    const tableConstraints = allConstraints.filter(c => c.table_name === table.name);
    const tableRelationships = allRelationships.filter(r => r.source_table_name === table.name);

    let sql = `-- Table: ${table.name}\n`;
    if (table.description) {
      sql += `-- Description: ${table.description}\n`;
    }
    sql += `CREATE TABLE IF NOT EXISTS ${options.schemaName || 'public'}.${table.name} (\n`;

    // Fields
    const fieldDefinitions: string[] = [];
    for (const field of tableFields) {
      let fieldDef = `    ${field.name} ${field.data_type.toUpperCase()}`;
      
      if (!field.is_nullable) {
        fieldDef += ' NOT NULL';
      }
      
      if (field.default_value) {
        fieldDef += ` DEFAULT ${field.default_value}`;
      }
      
      if (field.is_unique && !field.is_primary_key) {
        fieldDef += ' UNIQUE';
      }

      fieldDefinitions.push(fieldDef);
    }

    // Primary key constraint
    const primaryKeyFields = tableFields.filter(f => f.is_primary_key);
    if (primaryKeyFields.length > 0) {
      const pkColumns = primaryKeyFields.map(f => f.name).join(', ');
      fieldDefinitions.push(`    CONSTRAINT ${table.name}_pkey PRIMARY KEY (${pkColumns})`);
    }

    // Other constraints
    for (const constraint of tableConstraints) {
      if (constraint.constraint_type !== 'PRIMARY_KEY') {
        fieldDefinitions.push(`    CONSTRAINT ${constraint.name} ${constraint.definition}`);
      }
    }

    // Foreign key relationships
    for (const rel of tableRelationships) {
      const constraintName = rel.name || `fk_${table.name}_${rel.source_field_name}`;
      let fkDef = `    CONSTRAINT ${constraintName} FOREIGN KEY (${rel.source_field_name}) REFERENCES ${rel.target_table_name}(${rel.target_field_name})`;
      
      if (rel.on_delete_action !== 'NO ACTION') {
        fkDef += ` ON DELETE ${rel.on_delete_action}`;
      }
      
      if (rel.on_update_action !== 'NO ACTION') {
        fkDef += ` ON UPDATE ${rel.on_update_action}`;
      }

      fieldDefinitions.push(fkDef);
    }

    sql += fieldDefinitions.join(',\n');
    sql += '\n);\n\n';

    // Table comments
    if (options.includeComments && table.description) {
      sql += `COMMENT ON TABLE ${options.schemaName || 'public'}.${table.name} IS '${table.description.replace(/'/g, "''")}';\n\n`;
    }

    // Field comments
    if (options.includeComments) {
      for (const field of tableFields) {
        if (field.description) {
          sql += `COMMENT ON COLUMN ${options.schemaName || 'public'}.${table.name}.${field.name} IS '${field.description.replace(/'/g, "''")}';\n`;
        }
      }
      if (tableFields.some(f => f.description)) {
        sql += '\n';
      }
    }

    return sql;
  }

  /**
   * Generate SQL for indexes
   */
  async generateIndexesSQL(options: SqlExportOptions = {}): Promise<string> {
    const indexes = await this.fetchIndexes(options.specificTables);

    let sql = '\n-- =====================================================\n';
    sql += '-- INDEX DEFINITIONS\n';
    sql += '-- =====================================================\n\n';

    for (const index of indexes) {
      sql += this.generateIndexSQL(index, options);
    }

    return sql;
  }

  private generateIndexSQL(index: DatabaseIndex, options: SqlExportOptions): string {
    const schemaName = options.schemaName || 'public';
    const uniqueKeyword = index.is_unique ? 'UNIQUE ' : '';
    const columns = index.columns.join(', ');
    
    let sql = `-- Index: ${index.name}\n`;
    sql += `CREATE ${uniqueKeyword}INDEX IF NOT EXISTS ${index.name} ON ${schemaName}.${index.table_name}`;
    
    if (index.index_type && index.index_type !== 'btree') {
      sql += ` USING ${index.index_type}`;
    }
    
    sql += ` (${columns})`;
    
    if (index.is_partial && index.where_clause) {
      sql += ` WHERE ${index.where_clause}`;
    }
    
    sql += ';\n\n';

    return sql;
  }

  /**
   * Generate SQL for functions
   */
  async generateFunctionsSQL(options: SqlExportOptions = {}): Promise<string> {
    const functions = await this.fetchFunctions();

    let sql = '\n-- =====================================================\n';
    sql += '-- FUNCTION DEFINITIONS\n';
    sql += '-- =====================================================\n\n';

    for (const func of functions) {
      sql += this.generateFunctionSQL(func, options);
    }

    return sql;
  }

  private generateFunctionSQL(func: DatabaseFunction, options: SqlExportOptions): string {
    const schemaName = options.schemaName || 'public';
    
    let sql = `-- Function: ${func.name}\n`;
    if (func.description) {
      sql += `-- Description: ${func.description}\n`;
    }
    
    sql += `CREATE OR REPLACE FUNCTION ${schemaName}.${func.name}(`;
    
    // Parameters
    if (func.parameters && func.parameters.length > 0) {
      const paramStrings = func.parameters.map((param: any) => {
        return `${param.name} ${param.type}`;
      });
      sql += paramStrings.join(', ');
    }
    
    sql += `)\nRETURNS ${func.return_type}\nLANGUAGE plpgsql\nAS $$\n`;
    sql += func.function_body;
    sql += '\n$$;\n\n';

    return sql;
  }

  /**
   * Generate SQL for triggers
   */
  async generateTriggersSQL(options: SqlExportOptions = {}): Promise<string> {
    const triggers = await this.fetchTriggers(options.specificTables);

    let sql = '\n-- =====================================================\n';
    sql += '-- TRIGGER DEFINITIONS\n';
    sql += '-- =====================================================\n\n';

    for (const trigger of triggers) {
      sql += this.generateTriggerSQL(trigger, options);
    }

    return sql;
  }

  private generateTriggerSQL(trigger: DatabaseTrigger, options: SqlExportOptions): string {
    const schemaName = options.schemaName || 'public';
    
    let sql = `-- Trigger: ${trigger.name}\n`;
    if (trigger.description) {
      sql += `-- Description: ${trigger.description}\n`;
    }
    
    sql += `CREATE TRIGGER ${trigger.name}\n`;
    sql += `    ${trigger.timing} ${trigger.event}\n`;
    sql += `    ON ${schemaName}.${trigger.table_name}\n`;
    sql += `    FOR EACH ROW\n`;
    sql += `    EXECUTE FUNCTION ${schemaName}.${trigger.function_name}();\n\n`;

    return sql;
  }

  /**
   * Generate SQL for RLS policies
   */
  async generatePoliciesSQL(options: SqlExportOptions = {}): Promise<string> {
    const policies = await this.fetchPolicies(options.specificTables);

    let sql = '\n-- =====================================================\n';
    sql += '-- ROW LEVEL SECURITY POLICIES\n';
    sql += '-- =====================================================\n\n';

    // Group policies by table
    const policiesByTable = policies.reduce((acc, policy) => {
      if (!acc[policy.table_name]) {
        acc[policy.table_name] = [];
      }
      acc[policy.table_name].push(policy);
      return acc;
    }, {} as Record<string, DatabasePolicy[]>);

    for (const [tableName, tablePolicies] of Object.entries(policiesByTable)) {
      sql += `-- Enable RLS on ${tableName}\n`;
      sql += `ALTER TABLE ${options.schemaName || 'public'}.${tableName} ENABLE ROW LEVEL SECURITY;\n\n`;

      for (const policy of tablePolicies) {
        sql += this.generatePolicySQL(policy, options);
      }
    }

    return sql;
  }

  private generatePolicySQL(policy: DatabasePolicy, options: SqlExportOptions): string {
    const schemaName = options.schemaName || 'public';
    
    let sql = `-- Policy: ${policy.name}\n`;
    sql += `CREATE POLICY "${policy.name}" ON ${schemaName}.${policy.table_name}\n`;
    sql += `    FOR ${policy.command} TO ${policy.role}`;
    
    if (policy.using_expression) {
      sql += `\n    USING (${policy.using_expression})`;
    }
    
    if (policy.with_check_expression) {
      sql += `\n    WITH CHECK (${policy.with_check_expression})`;
    }
    
    sql += ';\n\n';

    return sql;
  }

  // Data fetching methods
  private async fetchTables(specificTables?: string[]): Promise<DatabaseTable[]> {
    let query = supabase
      .from('database_tables')
      .select('*')
      .eq('project_id', this.projectId);

    if (specificTables && specificTables.length > 0) {
      query = query.in('name', specificTables);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async fetchFields(): Promise<DatabaseField[]> {
    const { data, error } = await supabase
      .from('database_fields')
      .select('*')
      .eq('project_id', this.projectId);
    
    if (error) throw error;
    return data || [];
  }

  private async fetchRelationships(): Promise<DatabaseRelationship[]> {
    const { data, error } = await supabase
      .from('database_relationships')
      .select(`
        *,
        source_table:database_tables!source_table_id(name),
        target_table:database_tables!target_table_id(name),
        source_field:database_fields!source_field_id(name),
        target_field:database_fields!target_field_id(name)
      `)
      .eq('project_id', this.projectId);
    
    if (error) throw error;
    
    return (data || []).map(rel => ({
      ...rel,
      source_table_name: (rel.source_table as any)?.name,
      target_table_name: (rel.target_table as any)?.name,
      source_field_name: (rel.source_field as any)?.name,
      target_field_name: (rel.target_field as any)?.name,
    }));
  }

  private async fetchConstraints(): Promise<DatabaseConstraint[]> {
    const { data, error } = await supabase
      .from('database_constraints')
      .select(`
        *,
        table:database_tables!table_id(name)
      `)
      .eq('project_id', this.projectId);
    
    if (error) throw error;
    
    return (data || []).map(constraint => ({
      ...constraint,
      table_name: (constraint.table as any)?.name,
    }));
  }

  private async fetchIndexes(specificTables?: string[]): Promise<DatabaseIndex[]> {
    let query = supabase
      .from('database_indexes')
      .select('*')
      .eq('project_id', this.projectId);

    if (specificTables && specificTables.length > 0) {
      query = query.in('table_name', specificTables);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async fetchFunctions(): Promise<DatabaseFunction[]> {
    const { data, error } = await supabase
      .from('database_functions')
      .select('*')
      .eq('project_id', this.projectId);
    
    if (error) throw error;
    return data || [];
  }

  private async fetchTriggers(specificTables?: string[]): Promise<DatabaseTrigger[]> {
    let query = supabase
      .from('database_triggers')
      .select('*')
      .eq('project_id', this.projectId);

    if (specificTables && specificTables.length > 0) {
      query = query.in('table_name', specificTables);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async fetchPolicies(specificTables?: string[]): Promise<DatabasePolicy[]> {
    let query = supabase
      .from('database_policies')
      .select('*')
      .eq('project_id', this.projectId);

    if (specificTables && specificTables.length > 0) {
      query = query.in('table_name', specificTables);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private generateHeader(): string {
    const timestamp = new Date().toISOString();
    return `-- =====================================================
-- JetSchema Database Export
-- Generated: ${timestamp}
-- =====================================================

`;
  }

  private generateExtensions(): string {
    return `-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

`;
  }

  private generateFooter(): string {
    return `-- =====================================================
-- Export Complete
-- =====================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
`;
  }
}

// Convenience functions for common export scenarios
export async function exportFullDatabase(projectId: string, options?: SqlExportOptions): Promise<string> {
  const exporter = new SqlExporter(projectId);
  return await exporter.generateFullExport(options);
}

export async function exportTablesOnly(projectId: string, tableNames?: string[]): Promise<string> {
  const exporter = new SqlExporter(projectId);
  return await exporter.generateTablesSQL({ specificTables: tableNames });
}

export async function exportIndexesOnly(projectId: string, tableNames?: string[]): Promise<string> {
  const exporter = new SqlExporter(projectId);
  return await exporter.generateIndexesSQL({ specificTables: tableNames });
}

export async function exportFunctionsOnly(projectId: string): Promise<string> {
  const exporter = new SqlExporter(projectId);
  return await exporter.generateFunctionsSQL();
}

export async function exportTriggersOnly(projectId: string, tableNames?: string[]): Promise<string> {
  const exporter = new SqlExporter(projectId);
  return await exporter.generateTriggersSQL({ specificTables: tableNames });
}

export async function exportPoliciesOnly(projectId: string, tableNames?: string[]): Promise<string> {
  const exporter = new SqlExporter(projectId);
  return await exporter.generatePoliciesSQL({ specificTables: tableNames });
}
