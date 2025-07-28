import { DataType, getDataTypeColor } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DataTypePillProps {
  type: DataType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DataTypePill({ type, className, size = 'sm' }: DataTypePillProps) {
  const colorVar = getDataTypeColor(type);
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        'font-mono font-medium transition-all duration-200 hover:scale-105',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        size === 'lg' && 'px-4 py-1.5 text-base',
        className
      )}
      style={{
        backgroundColor: `hsl(var(--${colorVar}) / 0.1)`,
        color: `hsl(var(--${colorVar}))`,
        borderColor: `hsl(var(--${colorVar}) / 0.3)`,
      }}
    >
      {type}
    </Badge>
  );
}