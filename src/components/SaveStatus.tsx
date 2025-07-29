import { Check, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SaveStatusProps = {
  isSaving?: boolean;
  isSaved?: boolean;
  className?: string;
};

export function SaveStatus({ isSaving = false, isSaved = true, className }: SaveStatusProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 text-xs rounded-full border transition-colors',
        isSaving
          ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
          : isSaved
            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
        className
      )}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      ) : isSaved ? (
        <>
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </>
      ) : (
        <>
          <Circle className="h-2 w-2 fill-current" />
          <span>Unsaved changes</span>
        </>
      )}
    </div>
  );
}
