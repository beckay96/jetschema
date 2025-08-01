import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import './ValidationAlert.css';

export interface ValidationAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  suggestion?: string;
  targetElement?: {
    type: 'table' | 'field';
    id: string;
    name: string;
  };
  isNew?: boolean;
  timestamp: Date;
}

interface ValidationAlertProps {
  alert: ValidationAlert;
  onDismiss?: (alertId: string) => void;
  onNavigate?: (elementType: string, elementId: string) => void;
}

export function ValidationAlert({ alert, onDismiss, onNavigate }: ValidationAlertProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(alert.isNew);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Stop pulsing after a few seconds
    if (shouldPulse) {
      const timer = setTimeout(() => setShouldPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldPulse]);
  
  // Add focus to make new alerts more noticeable
  useEffect(() => {
    if (alert.isNew && alertRef.current) {
      alertRef.current.focus();
    }
  }, [alert.isNew]);

  const getIcon = () => {
    switch (alert.type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCardClass = () => {
    return cn(
      'validation-alert',
      'transition-all',
      isVisible ? 'new' : 'opacity-0',
      shouldPulse && 'pulsing',
      alert.type,
      'border border-border rounded-lg shadow-sm'
    );
  };

  const handleNavigate = () => {
    if (alert.targetElement && onNavigate) {
      onNavigate(alert.targetElement.type, alert.targetElement.id);
    }
  };

  return (
    <Card 
      className={getCardClass()} 
      ref={alertRef} 
      tabIndex={0}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{alert.title}</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {alert.type}
                </Badge>
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onDismiss(alert.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">{alert.message}</p>
            
            {alert.suggestion && (
              <p className="text-sm text-blue-400 italic">💡 {alert.suggestion}</p>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {alert.timestamp.toLocaleTimeString()}
              </span>
              
              {alert.targetElement && onNavigate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNavigate}
                  className="h-6 text-xs target-element-button"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Go to {alert.targetElement.name}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}