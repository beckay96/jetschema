import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Database, Trash } from 'lucide-react';

interface IndexConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDelete?: boolean;
  fieldName?: string;
  tableName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenIndexModal?: () => void;
}

export function IndexConfirmationDialog({
  open,
  onOpenChange,
  isDelete = false,
  fieldName = '',
  tableName = '',
  onConfirm,
  onCancel,
  onOpenIndexModal
}: IndexConfirmationDialogProps) {
  
  const handleAction = () => {
    if (isDelete) {
      onConfirm();
    } else if (onOpenIndexModal) {
      onOpenIndexModal();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isDelete ? (
              <>
                <Trash className="h-5 w-5 text-destructive" />
                Remove Index
              </>
            ) : (
              <>
                <Database className="h-5 w-5 text-primary" />
                Create Index
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDelete ? (
              <>
                Are you sure you want to remove the index on field <strong>{fieldName}</strong> in table <strong>{tableName}</strong>?
                <p className="mt-2">This action will delete the index information and any related settings.</p>
              </>
            ) : (
              <>
                You're adding an index on field <strong>{fieldName}</strong> in table <strong>{tableName}</strong>.
                <p className="mt-2">Would you like to configure additional index options such as index type, uniqueness, or partial conditions?</p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          {isDelete ? (
            <AlertDialogAction onClick={handleAction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Index
            </AlertDialogAction>
          ) : (
            <>
              <AlertDialogAction onClick={onConfirm}>
                Use Default Settings
              </AlertDialogAction>
              <AlertDialogAction onClick={handleAction} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Configure Index
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
