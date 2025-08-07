// Index type definitions for database indexes

export type IndexType = 'btree' | 'hash' | 'gist' | 'gin' | 'brin';

export interface Index {
  id: string;
  name: string;
  table_name: string;
  column_names: string[];
  index_type: IndexType;
  is_unique: boolean;
  description?: string;
  project_id: string;
}

// Index expression interface for more complex indexes
export interface IndexExpression {
  id: string;
  index_id: string;
  expression: string;
}

// Interface for index usage stats and metadata
export interface IndexMetadata {
  index_id: string;
  usage_count?: number;
  last_used?: Date;
  size_bytes?: number;
  performance_impact?: 'positive' | 'neutral' | 'negative';
}
