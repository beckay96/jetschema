import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Clock, 
  Save, 
  Code, 
  Settings,
  Plus,
  Trash2,
  Play,
  Database
} from 'lucide-react';

interface DatabaseFunction {
  id?: string;
  name: string;
  description?: string;
  function_type: 'plpgsql' | 'edge' | 'cron';
  parameters: Array<{ name: string; type: string; default?: string }>;
  return_type?: string;
  function_body: string;
  is_edge_function: boolean;
  edge_function_name?: string;
  cron_schedule?: string;
  is_cron_enabled: boolean;
}

interface DatabaseTrigger {
  id?: string;
  name: string;
  table_name: string;
  trigger_event: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE';
  trigger_timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  function_id?: string;
  is_active: boolean;
  conditions?: string;
}

interface TriggerFunctionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'trigger' | 'function';
  tables: Array<{ id: string; name: string }>;
  functions: DatabaseFunction[];
  existingTrigger?: DatabaseTrigger;
  existingFunction?: DatabaseFunction;
  onSave: (data: DatabaseTrigger | DatabaseFunction) => void;
}

export function TriggerFunctionModal({ 
  open, 
  onOpenChange, 
  mode,
  tables,
  functions,
  existingTrigger,
  existingFunction,
  onSave
}: TriggerFunctionModalProps) {
  const [triggerData, setTriggerData] = useState<DatabaseTrigger>({
    name: '',
    table_name: '',
    trigger_event: 'INSERT',
    trigger_timing: 'BEFORE',
    is_active: true
  });

  const [functionData, setFunctionData] = useState<DatabaseFunction>({
    name: '',
    description: '',
    function_type: 'plpgsql',
    parameters: [],
    return_type: 'TRIGGER',
    function_body: '',
    is_edge_function: false,
    is_cron_enabled: false
  });

  const [newParameter, setNewParameter] = useState({ name: '', type: '', default: '' });

  useEffect(() => {
    if (existingTrigger) {
      setTriggerData(existingTrigger);
    } else {
      setTriggerData({
        name: '',
        table_name: '',
        trigger_event: 'INSERT',
        trigger_timing: 'BEFORE',
        is_active: true
      });
    }
  }, [existingTrigger, open]);

  useEffect(() => {
    if (existingFunction) {
      setFunctionData(existingFunction);
    } else {
      setFunctionData({
        name: '',
        description: '',
        function_type: 'plpgsql',
        parameters: [],
        return_type: 'TRIGGER',
        function_body: '',
        is_edge_function: false,
        is_cron_enabled: false
      });
    }
  }, [existingFunction, open]);

  const handleSave = () => {
    if (mode === 'trigger') {
      onSave(triggerData);
    } else {
      onSave(functionData);
    }
    onOpenChange(false);
  };

  const addParameter = () => {
    if (newParameter.name && newParameter.type) {
      setFunctionData(prev => ({
        ...prev,
        parameters: [...prev.parameters, { ...newParameter }]
      }));
      setNewParameter({ name: '', type: '', default: '' });
    }
  };

  const removeParameter = (index: number) => {
    setFunctionData(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const getFunctionTemplate = (type: 'plpgsql' | 'edge' | 'cron') => {
    switch (type) {
      case 'plpgsql':
        return `BEGIN
  -- Your PL/pgSQL function logic here
  -- For triggers, use NEW and OLD to access row data
  
  RETURN NEW; -- or OLD for DELETE triggers
END;`;
      case 'edge':
        return `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Your edge function logic here
    const data = { message: 'Hello from edge function!' };
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});`;
      case 'cron':
        return `-- CRON Job Function
-- This function will be called automatically based on the schedule
BEGIN
  -- Your scheduled task logic here
  -- Example: cleanup old records, send notifications, etc.
  
  INSERT INTO logs (message, created_at) 
  VALUES ('CRON job executed', NOW());
  
  RETURN;
END;`;
    }
  };

  const renderTriggerForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Trigger Name</label>
          <Input
            value={triggerData.name}
            onChange={(e) => setTriggerData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="trigger_name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Table</label>
          <Select
            value={triggerData.table_name}
            onValueChange={(value) => setTriggerData(prev => ({ ...prev, table_name: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map(table => (
                <SelectItem key={table.id} value={table.name}>
                  {table.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Event</label>
          <Select
            value={triggerData.trigger_event}
            onValueChange={(value: any) => setTriggerData(prev => ({ ...prev, trigger_event: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INSERT">INSERT</SelectItem>
              <SelectItem value="UPDATE">UPDATE</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="TRUNCATE">TRUNCATE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Timing</label>
          <Select
            value={triggerData.trigger_timing}
            onValueChange={(value: any) => setTriggerData(prev => ({ ...prev, trigger_timing: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BEFORE">BEFORE</SelectItem>
              <SelectItem value="AFTER">AFTER</SelectItem>
              <SelectItem value="INSTEAD OF">INSTEAD OF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Function</label>
        <Select
          value={triggerData.function_id || ''}
          onValueChange={(value) => setTriggerData(prev => ({ ...prev, function_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select function" />
          </SelectTrigger>
          <SelectContent>
            {functions.filter(f => f.function_type === 'plpgsql').map(func => (
              <SelectItem key={func.id} value={func.id!}>
                {func.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Conditions (Optional)</label>
        <Textarea
          value={triggerData.conditions || ''}
          onChange={(e) => setTriggerData(prev => ({ ...prev, conditions: e.target.value }))}
          placeholder="WHEN (condition)"
          className="h-20"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="active"
          checked={triggerData.is_active}
          onCheckedChange={(checked) => setTriggerData(prev => ({ ...prev, is_active: !!checked }))}
        />
        <label htmlFor="active" className="text-sm font-medium">
          Active
        </label>
      </div>
    </div>
  );

  const renderFunctionForm = () => (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">
          <Settings className="h-4 w-4 mr-2" />
          General
        </TabsTrigger>
        <TabsTrigger value="parameters">
          <Database className="h-4 w-4 mr-2" />
          Parameters
        </TabsTrigger>
        <TabsTrigger value="code">
          <Code className="h-4 w-4 mr-2" />
          Code
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Function Name</label>
            <Input
              value={functionData.name}
              onChange={(e) => setFunctionData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="function_name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select
              value={functionData.function_type}
              onValueChange={(value: any) => {
                setFunctionData(prev => ({ 
                  ...prev, 
                  function_type: value,
                  function_body: getFunctionTemplate(value),
                  is_edge_function: value === 'edge',
                  return_type: value === 'edge' ? 'JSON' : 'TRIGGER'
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plpgsql">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    PL/pgSQL Function
                  </div>
                </SelectItem>
                <SelectItem value="edge">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Edge Function
                  </div>
                </SelectItem>
                <SelectItem value="cron">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    CRON Job
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={functionData.description || ''}
            onChange={(e) => setFunctionData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Function description..."
            className="h-16"
          />
        </div>

        {functionData.function_type === 'edge' && (
          <div>
            <label className="text-sm font-medium">Edge Function Name</label>
            <Input
              value={functionData.edge_function_name || ''}
              onChange={(e) => setFunctionData(prev => ({ ...prev, edge_function_name: e.target.value }))}
              placeholder="edge-function-name"
            />
          </div>
        )}

        {functionData.function_type === 'cron' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">CRON Schedule</label>
              <Input
                value={functionData.cron_schedule || ''}
                onChange={(e) => setFunctionData(prev => ({ ...prev, cron_schedule: e.target.value }))}
                placeholder="0 0 * * * (every day at midnight)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: minute hour day month weekday
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cron-enabled"
                checked={functionData.is_cron_enabled}
                onCheckedChange={(checked) => setFunctionData(prev => ({ ...prev, is_cron_enabled: !!checked }))}
              />
              <label htmlFor="cron-enabled" className="text-sm font-medium">
                Enable CRON scheduling (skip creating trigger)
              </label>
            </div>
          </div>
        )}

        {functionData.function_type === 'plpgsql' && (
          <div>
            <label className="text-sm font-medium">Return Type</label>
            <Input
              value={functionData.return_type || ''}
              onChange={(e) => setFunctionData(prev => ({ ...prev, return_type: e.target.value }))}
              placeholder="TRIGGER"
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="parameters" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Function Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Input
                placeholder="Parameter name"
                value={newParameter.name}
                onChange={(e) => setNewParameter(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Type (e.g., TEXT)"
                value={newParameter.type}
                onChange={(e) => setNewParameter(prev => ({ ...prev, type: e.target.value }))}
              />
              <Input
                placeholder="Default value"
                value={newParameter.default}
                onChange={(e) => setNewParameter(prev => ({ ...prev, default: e.target.value }))}
              />
              <Button onClick={addParameter} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {functionData.parameters.map((param, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex gap-2">
                    <Badge variant="outline">{param.name}</Badge>
                    <Badge variant="secondary">{param.type}</Badge>
                    {param.default && <Badge variant="outline">default: {param.default}</Badge>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParameter(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="code" className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Function Body</label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFunctionData(prev => ({ 
                ...prev, 
                function_body: getFunctionTemplate(prev.function_type) 
              }))}
            >
              <Play className="h-4 w-4 mr-2" />
              Load Template
            </Button>
          </div>
          <Textarea
            value={functionData.function_body}
            onChange={(e) => setFunctionData(prev => ({ ...prev, function_body: e.target.value }))}
            placeholder="Function code..."
            className="h-64 font-mono text-sm"
          />
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'trigger' ? (
              <>
                <Zap className="h-5 w-5" />
                {existingTrigger ? 'Edit Trigger' : 'Create Trigger'}
              </>
            ) : (
              <>
                <Database className="h-5 w-5" />
                {existingFunction ? 'Edit Function' : 'Create Function'}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {mode === 'trigger' ? renderTriggerForm() : renderFunctionForm()}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save {mode === 'trigger' ? 'Trigger' : 'Function'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}