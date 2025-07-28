import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Info, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { ValidationError, getValidationSummary } from '@/utils/validationUtils';

interface ValidationPanelProps {
  errors: ValidationError[];
  onRefreshValidation?: () => void;
  loading?: boolean;
}

export function ValidationPanel({ errors, onRefreshValidation, loading }: ValidationPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const summary = getValidationSummary(errors);

  const getIcon = (type: ValidationError['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getBadgeVariant = (type: ValidationError['type']) => {
    switch (type) {
      case 'error':
        return 'destructive' as const;
      case 'warning':
        return 'secondary' as const;
      case 'info':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const displayedErrors = showAll ? errors : errors.slice(0, 5);

  if (summary.total === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Schema validation passed</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            No validation issues found in your database schema.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Schema Validation
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshValidation}
            disabled={loading}
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="flex gap-2">
          {summary.errors > 0 && (
            <Badge variant="destructive" className="text-xs">
              {summary.errors} errors
            </Badge>
          )}
          {summary.warnings > 0 && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
              {summary.warnings} warnings
            </Badge>
          )}
          {summary.info > 0 && (
            <Badge variant="outline" className="text-xs">
              {summary.info} info
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {displayedErrors.map((error) => (
              <Alert key={error.id} className="py-2">
                <div className="flex items-start gap-2">
                  {getIcon(error.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{error.message}</span>
                      <Badge variant={getBadgeVariant(error.type)} className="text-xs">
                        {error.type}
                      </Badge>
                    </div>
                    
                    {error.suggestion && (
                      <p className="text-xs text-muted-foreground mb-1">
                        <strong>Suggestion:</strong> {error.suggestion}
                      </p>
                    )}
                    
                    {error.affectedElement && (
                      <p className="text-xs text-muted-foreground">
                        <strong>Affects:</strong> {error.affectedElement.type} "{error.affectedElement.name}"
                      </p>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </ScrollArea>
        
        {errors.length > 5 && (
          <div className="mt-3 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show ${errors.length - 5} More`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}