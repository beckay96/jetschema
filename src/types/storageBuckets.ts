/**
 * Storage Bucket Types
 * Defines types for Supabase Storage Buckets in JetSchema
 */

export interface StorageBucket {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  public: boolean;
  file_size_limit?: number; // in bytes
  allowed_mime_types?: string[];
  linked_tables?: string[]; // table names that reference this bucket
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateStorageBucketRequest {
  name: string;
  description?: string;
  public: boolean;
  file_size_limit?: number;
  allowed_mime_types?: string[];
  linked_tables?: string[];
}

export interface UpdateStorageBucketRequest {
  id: string;
  name?: string;
  description?: string;
  public?: boolean;
  file_size_limit?: number;
  allowed_mime_types?: string[];
  linked_tables?: string[];
}

export interface StorageBucketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucket?: StorageBucket;
  onSave: (bucket: CreateStorageBucketRequest | UpdateStorageBucketRequest) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  availableTables: string[]; // for linking
}

export interface StorageBucketSidebarProps {
  projectId: string;
  buckets: StorageBucket[];
  onBucketSelect: (bucket: StorageBucket) => void;
  onBucketCreate: () => void;
  onBucketEdit: (bucket: StorageBucket) => void;
  onBucketDelete: (id: string) => void;
}

// Common MIME types for easy selection
export const COMMON_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'audio/mp3',
  'audio/wav',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'application/zip'
] as const;
