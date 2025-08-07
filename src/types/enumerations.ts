/**
 * Database Enumeration Types
 * Defines types for PostgreSQL ENUM types in JetSchema
 */

export interface DatabaseEnumeration {
  id: string;
  project_id: string;
  name: string;
  values: string[];
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateEnumerationRequest {
  name: string;
  values: string[];
  description?: string;
}

export interface UpdateEnumerationRequest {
  id: string;
  name?: string;
  values?: string[];
  description?: string;
}

export interface EnumerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enumeration?: DatabaseEnumeration;
  onSave: (enumeration: CreateEnumerationRequest | UpdateEnumerationRequest) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export interface EnumerationSidebarProps {
  projectId: string;
  enumerations: DatabaseEnumeration[];
  onEnumerationSelect: (enumeration: DatabaseEnumeration) => void;
  onEnumerationCreate: () => void;
  onEnumerationEdit: (enumeration: DatabaseEnumeration) => void;
  onEnumerationDelete: (id: string) => void;
}
