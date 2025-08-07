import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Database, Edit, Trash2, Lock, Unlock, HardDrive } from 'lucide-react';
import { StorageBucket, StorageBucketSidebarProps } from '@/types/storageBuckets';
import { cn } from '@/lib/utils';

export function StorageBucketsSidebar({
  projectId,
  buckets,
  onBucketSelect,
  onBucketCreate,
  onBucketEdit,
  onBucketDelete
}: StorageBucketSidebarProps) {
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);

  const handleBucketClick = (bucket: StorageBucket) => {
    setSelectedBucketId(bucket.id);
    onBucketSelect(bucket);
  };

  const handleEdit = (e: React.MouseEvent, bucket: StorageBucket) => {
    e.stopPropagation();
    onBucketEdit(bucket);
  };

  const handleDelete = (e: React.MouseEvent, bucket: StorageBucket) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the storage bucket "${bucket.name}"?`)) {
      onBucketDelete(bucket.id);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'No limit';
    const mb = bytes / (1024 * 1024);
    return `${mb}MB max`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          <h3 className="font-semibold">Storage Buckets</h3>
          <Badge variant="secondary" className="text-xs">
            {buckets.length}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={onBucketCreate}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Buckets List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {buckets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No storage buckets yet</p>
              <p className="text-xs mt-1">
                Create your first storage bucket to get started
              </p>
            </div>
          ) : (
            buckets.map((bucket) => (
              <div
                key={bucket.id}
                className={cn(
                  "group relative p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                  selectedBucketId === bucket.id && "bg-accent border-primary"
                )}
                onClick={() => handleBucketClick(bucket)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {bucket.name}
                      </h4>
                      <div className="flex items-center gap-1">
                        {bucket.public ? (
                          <Unlock className="h-3 w-3 text-green-600" />
                        ) : (
                          <Lock className="h-3 w-3 text-orange-600" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {bucket.public ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                    </div>
                    
                    {bucket.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {bucket.description}
                      </p>
                    )}

                    {/* Bucket Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Size: {formatFileSize(bucket.file_size_limit)}</span>
                      </div>
                      
                      {bucket.allowed_mime_types && bucket.allowed_mime_types.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {bucket.allowed_mime_types.slice(0, 2).map((mimeType, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs px-1.5 py-0.5"
                            >
                              {mimeType.split('/')[1]}
                            </Badge>
                          ))}
                          {bucket.allowed_mime_types.length > 2 && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1.5 py-0.5 opacity-60"
                            >
                              +{bucket.allowed_mime_types.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {bucket.linked_tables && bucket.linked_tables.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Database className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Linked to {bucket.linked_tables.length} table{bucket.linked_tables.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => handleEdit(e, bucket)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDelete(e, bucket)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Created info */}
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  Created {new Date(bucket.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
