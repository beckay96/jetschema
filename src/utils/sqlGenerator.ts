import { DatabaseTable } from '@/types/database';

export function generateTableSQL(table: DatabaseTable): string {
  const lines = [`CREATE TABLE ${table.name} (`];
  
  table.fields.forEach((field, index) => {
    let fieldDef = `  ${field.name} ${field.type}`;
    
    if (!field.nullable) {
      fieldDef += ' NOT NULL';
    }
    
    if (field.defaultValue) {
      fieldDef += ` DEFAULT ${field.defaultValue}`;
    }
    
    if (field.primaryKey) {
      fieldDef += ' PRIMARY KEY';
    }
    
    if (field.unique && !field.primaryKey) {
      fieldDef += ' UNIQUE';
    }
    
    if (index < table.fields.length - 1) {
      fieldDef += ',';
    }
    
    lines.push(fieldDef);
  });
  
  lines.push(');');
  
  // Add foreign key constraints
  const foreignKeyFields = table.fields.filter(f => f.foreignKey);
  foreignKeyFields.forEach(field => {
    if (field.foreignKey) {
      lines.push('');
      lines.push(`ALTER TABLE ${table.name}`);
      lines.push(`ADD CONSTRAINT fk_${table.name}_${field.name}`);
      lines.push(`FOREIGN KEY (${field.name}) REFERENCES ${field.foreignKey.table}(${field.foreignKey.field})`);
      
      if (field.foreignKey.onDelete) {
        lines.push(`ON DELETE ${field.foreignKey.onDelete}`);
      }
      
      if (field.foreignKey.onUpdate) {
        lines.push(`ON UPDATE ${field.foreignKey.onUpdate}`);
      }
      
      lines.push(';');
    }
  });
  
  return lines.join('\n');
}

export function generateAllTablesSQL(tables: DatabaseTable[]): string {
  return tables.map(table => generateTableSQL(table)).join('\n\n');
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}