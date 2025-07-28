import { DataType, getDataTypeColor } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DataTypePillProps {
  type: DataType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DataTypePill({ type, className, size = 'sm' }: DataTypePillProps) {
  const colorClass = getDataTypeColor(type);
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        `bg-${colorClass}/10 text-${colorClass} border-${colorClass}/20 hover:bg-${colorClass}/20`,
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        size === 'lg' && 'px-4 py-1.5 text-base',
        'font-mono font-medium transition-colors',
        className
      )}
    >
      {type}
    </Badge>
  );
}