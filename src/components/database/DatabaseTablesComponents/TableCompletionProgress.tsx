import { DatabaseTable } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Circle } from 'lucide-react';

interface TableCompletionProgressProps {
  table: DatabaseTable;
}

export function TableCompletionProgress({ table }: TableCompletionProgressProps) {
  const totalFields = table.fields.length;
  const definedFields = table.fields.filter(field => field.name && field.type).length;
  const primaryKeys = table.fields.filter(field => field.primaryKey).length;
  const hasRequiredFields = totalFields >= 2; // At least 2 fields for a meaningful table
  
  const completionScore = totalFields === 0 ? 0 : (definedFields / totalFields) * 100;
  const isComplete = completionScore === 100 && primaryKeys > 0 && hasRequiredFields;
  const isInProgress = completionScore > 0 && completionScore < 100;
  
  const getProgressColor = () => {
    if (isComplete) return 'progress-complete';
    if (isInProgress) return 'progress-in-progress';
    return 'progress-incomplete';
  };

  const getStatusIcon = () => {
    if (isComplete) return <CheckCircle className="h-3 w-3 text-green-500" />;
    if (isInProgress) return <AlertCircle className="h-3 w-3 text-yellow-500" />;
    return <Circle className="h-3 w-3 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (isComplete) return 'Complete';
    if (isInProgress) return 'In Progress';
    return 'Incomplete';
  };

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div 
          className={`progress-fill ${getProgressColor()}`}
          style={{ width: `${completionScore}%` }}
        />
      </div>
      
      {/* Status Indicators */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <span className="text-muted-foreground">{getStatusText()}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs py-0">
            {definedFields} of {totalFields} fields
          </Badge>
          
          {primaryKeys > 0 && (
            <Badge variant="outline" className="text-xs py-0 text-green-500 border-green-500/30">
              <CheckCircle className="h-2.5 w-2.5 mr-1" />
              PK
            </Badge>
          )}
          
          {table.fields.some(field => field.foreignKey) && (
            <Badge variant="outline" className="text-xs py-0 text-blue-500 border-blue-500/30">
              FK
            </Badge>
          )}
        </div>
      </div>
      
      {/* Validation Messages */}
      {!hasRequiredFields && totalFields > 0 && (
        <div className="text-xs text-yellow-500 animate-slide-fade-in">
          ⚠️ Add more fields for a complete table
        </div>
      )}
      
      {hasRequiredFields && primaryKeys === 0 && (
        <div className="text-xs text-yellow-500 animate-slide-fade-in">
          ⚠️ Define a primary key
        </div>
      )}
      
      {isComplete && (
        <div className="text-xs text-green-500 animate-slide-fade-in">
          ✅ Table is deployment-ready
        </div>
      )}
    </div>
  );
}