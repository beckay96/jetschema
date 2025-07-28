import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatabaseTable, DatabaseTrigger, DatabaseFunction } from '@/types/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Code, Plus, X } from 'lucide-react';

interface TriggerFunctionModalProps {
  type: 'trigger' | 'function';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: DatabaseTable[];
  onAdd: (item: Omit<DatabaseTrigger, 'id'> | Omit<DatabaseFunction, 'id'>) => void;
}

export function TriggerFunctionModal({ type, open, onOpenChange, tables, onAdd }: TriggerFunctionModalProps) {
  const [triggerData, setTriggerData] = useState({
    name: '',
    table: '',
    event: 'INSERT' as const,
    timing: 'AFTER' as const,
    code: '',
    description: ''
  });

  const [functionData, setFunctionData] = useState({
    name: '',
    returnType: 'void',
    parameters: [] as Array<{ name: string; type: string; defaultValue?: string }>,
    code: '',
    description: ''
  });

  const [newParam, setNewParam] = useState({ name: '', type: 'text', defaultValue: '' });

  const handleAddParameter = () => {
    if (newParam.name && newParam.type) {
      setFunctionData(prev => ({
        ...prev,
        parameters: [...prev.parameters, { ...newParam, defaultValue: newParam.defaultValue || undefined }]
      }));
      setNewParam({ name: '', type: 'text', defaultValue: '' });
    }
  };

  const handleRemoveParameter = (index: number) => {
    setFunctionData(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (type === 'trigger') {
      if (triggerData.name && triggerData.table && triggerData.code) {
        onAdd(triggerData);
        setTriggerData({ name: '', table: '', event: 'INSERT', timing: 'AFTER', code: '', description: '' });
        onOpenChange(false);
      }
    } else {
      if (functionData.name && functionData.returnType && functionData.code) {
        onAdd(functionData);
        setFunctionData({ name: '', returnType: 'void', parameters: [], code: '', description: '' });
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'trigger' ? <Zap className="h-5 w-5" /> : <Code className="h-5 w-5" />}
            Add Database {type === 'trigger' ? 'Trigger' : 'Function'}
          </DialogTitle>
        </DialogHeader>

        {type === 'trigger' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trigger-name">Trigger Name</Label>
                <Input
                  id="trigger-name"
                  value={triggerData.name}
                  onChange={(e) => setTriggerData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., update_timestamp"
                />
              </div>
              <div>
                <Label htmlFor="trigger-table">Table</Label>
                <Select value={triggerData.table} onValueChange={(value) => setTriggerData(prev => ({ ...prev, table: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => (
                      <SelectItem key={table.id} value={table.name}>{table.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trigger-timing">Timing</Label>
                <Select value={triggerData.timing} onValueChange={(value: any) => setTriggerData(prev => ({ ...prev, timing: value }))}>
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
              <div>
                <Label htmlFor="trigger-event">Event</Label>
                <Select value={triggerData.event} onValueChange={(value: any) => setTriggerData(prev => ({ ...prev, event: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSERT">INSERT</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="trigger-description">Description (Optional)</Label>
              <Input
                id="trigger-description"
                value={triggerData.description}
                onChange={(e) => setTriggerData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what this trigger does"
              />
            </div>

            <div>
              <Label htmlFor="trigger-code">Trigger Code</Label>
              <Textarea
                id="trigger-code"
                value={triggerData.code}
                onChange={(e) => setTriggerData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="CREATE OR REPLACE FUNCTION trigger_function() RETURNS TRIGGER AS $$
BEGIN
  -- Your trigger logic here
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="function-name">Function Name</Label>
                <Input
                  id="function-name"
                  value={functionData.name}
                  onChange={(e) => setFunctionData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., calculate_total"
                />
              </div>
              <div>
                <Label htmlFor="function-return">Return Type</Label>
                <Input
                  id="function-return"
                  value={functionData.returnType}
                  onChange={(e) => setFunctionData(prev => ({ ...prev, returnType: e.target.value }))}
                  placeholder="e.g., integer, text, void"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="function-description">Description (Optional)</Label>
              <Input
                id="function-description"
                value={functionData.description}
                onChange={(e) => setFunctionData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what this function does"
              />
            </div>

            <div>
              <Label>Parameters</Label>
              <div className="space-y-2">
                {functionData.parameters.map((param, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {param.name}: {param.type}
                      {param.defaultValue && ` = ${param.defaultValue}`}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => handleRemoveParameter(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </div>
                ))}
                
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Parameter name"
                    value={newParam.name}
                    onChange={(e) => setNewParam(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Type"
                    value={newParam.type}
                    onChange={(e) => setNewParam(prev => ({ ...prev, type: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Default (optional)"
                    value={newParam.defaultValue}
                    onChange={(e) => setNewParam(prev => ({ ...prev, defaultValue: e.target.value }))}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddParameter}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="function-code">Function Code</Label>
              <Textarea
                id="function-code"
                value={functionData.code}
                onChange={(e) => setFunctionData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="CREATE OR REPLACE FUNCTION function_name(parameters) RETURNS return_type AS $$
BEGIN
  -- Your function logic here
  RETURN result;
END;
$$ LANGUAGE plpgsql;"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add {type === 'trigger' ? 'Trigger' : 'Function'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}