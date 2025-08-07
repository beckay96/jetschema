import { useState, useEffect } from 'react';
import { Database, Edit2, Trash2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useIndexes, DatabaseIndex } from '@/hooks/useIndexes';
import { DatabaseTable } from '@/types/database';
import { IndexModal } from './IndexModal';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';

interface IndexesSidebarProps {
  tables: DatabaseTable[];
  projectId: string;
}

export function IndexesSidebar({ tables, projectId }: IndexesSidebarProps) {
  const { indexes, loading, saveIndex, updateIndex, deleteIndex, refetch } = useIndexes(projectId);
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<DatabaseIndex | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<DatabaseIndex | null>(null);

  // Load indexes when component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Filter indexes by project ID
  const projectIndexes = indexes?.filter(index => index.project_id === projectId) || [];

  const handleAddIndex = () => {
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleEditIndex = (index: DatabaseIndex) => {
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleDeleteIndex = (index: DatabaseIndex) => {
    setIndexToDelete(index);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteIndex = async () => {
    if (!indexToDelete) return;
    
    try {
      await deleteIndex(indexToDelete.id);
      toast.success(`Index ${indexToDelete.name} deleted successfully`);
      refetch();
    } catch (error) {
      console.error('Error deleting index:', error);
      toast.error(`Failed to delete index: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleteConfirmOpen(false);
      setIndexToDelete(null);
    }
  };

  const handleSaveIndex = async (index: Omit<DatabaseIndex, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast.error('You must be logged in to save an index');
      return;
    }

    try {
      // Add author_id to the index
      const completeIndex = {
        ...index,
        author_id: user.id
      };

      // Save the index (creates new or updates existing)
      if (editingIndex) {
        await updateIndex(editingIndex.id, completeIndex);
        toast.success(`Index ${index.name} updated successfully`);
      } else {
        await saveIndex(completeIndex);
        toast.success(`Index ${index.name} created successfully`);
      }
      
      // Refresh the indexes list
      refetch();
    } catch (error) {
      console.error('Error saving index:', error);
      toast.error(`Failed to save index: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getIndexTypeBadge = (indexType: string) => {
    switch (indexType.toUpperCase()) {
      case 'BTREE':
        return <Badge variant="outline" className="bg-primary/10">B-Tree</Badge>;
      case 'HASH':
        return <Badge variant="outline" className="bg-secondary/10">Hash</Badge>;
      case 'GIN':
        return <Badge variant="outline" className="bg-accent/10">GIN</Badge>;
      case 'GIST':
        return <Badge variant="outline" className="bg-warning/10">GiST</Badge>;
      case 'SPGIST':
        return <Badge variant="outline" className="bg-info/10">SP-GiST</Badge>;
      case 'BRIN':
        return <Badge variant="outline" className="bg-success/10">BRIN</Badge>;
      default:
        return <Badge variant="outline">{indexType}</Badge>;
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full">
      <div className="flex-shrink-0 space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Database Indexes</Label>
          <Button size="sm" className="h-8" onClick={handleAddIndex}>
            <Plus className="h-3 w-3 mr-1" />
            Add Index
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden h-full" type="always">
        <div className="space-y-2">
          {loading ? (
            // Loading state
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="cursor-default">
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : projectIndexes.length > 0 ? (
            // Indexes list
            projectIndexes.map((index) => (
              <Card key={index.id} className="cursor-default hover:bg-accent/10 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 font-medium text-sm">
                      <Search className="h-3 w-3 text-primary" />
                      <span className="truncate max-w-[180px]" title={index.name}>{index.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditIndex(index)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit index</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteIndex(index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete index</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-1 truncate" title={`Table: ${index.table_name}`}>
                    <span>Table: {index.table_name}</span>
                  </div>

                  <div className="text-xs text-muted-foreground mb-2 truncate" title={`Columns: ${index.columns.join(', ')}`}>
                    <span>Columns: {index.columns.join(', ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getIndexTypeBadge(index.index_type)}
                    {index.is_unique && (
                      <Badge variant="secondary" className="text-[10px]">Unique</Badge>
                    )}
                    {index.is_partial && (
                      <Badge variant="outline" className="text-[10px]">Partial</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Empty state
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No indexes defined</p>
              <Button 
                variant="link" 
                size="sm"
                className="mt-2 text-primary text-xs" 
                onClick={handleAddIndex}
              >
                Create your first index
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Index Modal */}
      <IndexModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveIndex}
        tables={tables}
        projectId={projectId}
        editingIndex={editingIndex}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete index</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the index "{indexToDelete?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteIndex} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
