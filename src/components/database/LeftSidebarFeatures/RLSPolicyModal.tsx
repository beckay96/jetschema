import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Shield, AlertTriangle } from 'lucide-react';
import { DatabaseTable } from '@/types/database';
import { RLSPolicy } from '@/hooks/useRLSPolicies';

interface RLSPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (policy: Omit<RLSPolicy, 'id' | 'created_at' | 'updated_at' | 'author_id'> & { author_id?: string }) => Promise<void>;
  tables: DatabaseTable[];
  projectId: string;
  editingPolicy?: RLSPolicy | null;
}

type PolicyTemplate = {
  name: string;
  using_expression?: string;
  with_check_expression?: string;
  description: string;
};

const POLICY_TEMPLATES: Record<string, PolicyTemplate> = {
  'user-owned-select': {
    name: 'User-owned data (SELECT)',
    using_expression: 'auth.uid() = user_id',
    description: 'Users can only view their own records'
  },
  'user-owned-insert': {
    name: 'User-owned data (INSERT)',
    with_check_expression: 'auth.uid() = user_id',
    description: 'Users can only create records for themselves'
  },
  'admin-all': {
    name: 'Admin access (ALL)',
    using_expression: "EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')",
    description: 'Only admin users can access all data'
  },
  'authenticated-select': {
    name: 'Authenticated users (SELECT)',
    using_expression: 'auth.role() = authenticated',
    description: 'Any authenticated user can view'
  },
  'public-select': {
    name: 'Public data (SELECT)',
    using_expression: 'true',
    description: 'Anyone can view this data'
  }
};

export function RLSPolicyModal({ open, onOpenChange, onSave, tables, projectId, editingPolicy }: RLSPolicyModalProps) {
  const [name, setName] = useState('');
  const [tableName, setTableName] = useState('');
  const [command, setCommand] = useState<'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'>('SELECT');
  const [role, setRole] = useState('');
  const [usingExpression, setUsingExpression] = useState('');
  const [withCheckExpression, setWithCheckExpression] = useState('');
  const [isPermissive, setIsPermissive] = useState(true);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editingPolicy) {
      setName(editingPolicy.name);
      setTableName(editingPolicy.table_name);
      setCommand(editingPolicy.command);
      setRole(editingPolicy.role || '');
      setUsingExpression(editingPolicy.using_expression || '');
      setWithCheckExpression(editingPolicy.with_check_expression || '');
      setIsPermissive(editingPolicy.is_permissive);
      setDescription(editingPolicy.description || '');
    } else {
      // Reset form
      setName('');
      setTableName('');
      setCommand('SELECT');
      setRole('');
      setUsingExpression('');
      setWithCheckExpression('');
      setIsPermissive(true);
      setDescription('');
    }
  }, [editingPolicy, open]);

  const handleSave = async () => {
    if (!name || !tableName) return;

    await onSave({
      name,
      table_name: tableName,
      command,
      role: role || undefined,
      using_expression: usingExpression || undefined,
      with_check_expression: withCheckExpression || undefined,
      is_permissive: isPermissive,
      description: description || undefined,
      project_id: projectId,
      // Don't set author_id - let useRLSPolicies hook set it to user.id
    });

    onOpenChange(false);
  };

  const applyTemplate = (templateKey: string) => {
    const template = POLICY_TEMPLATES[templateKey];
    if (template?.using_expression) {
      setUsingExpression(template.using_expression);
    }
    if (template?.with_check_expression) {
      setWithCheckExpression(template.with_check_expression);
    }
    if (template?.description) {
      setDescription(template.description);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {editingPolicy ? 'Edit RLS Policy' : 'Create RLS Policy'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Guidelines */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>RLS Best Practices:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Always use <code>auth.uid()</code> for user-specific data</li>
                <li>• Test policies thoroughly before production</li>
                <li>• Use RESTRICTIVE policies for sensitive operations</li>
                <li>• Consider performance impact of complex expressions</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Policy Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Users can view own data"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table">Table *</Label>
              <Select value={tableName} onValueChange={setTableName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.name}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="command">Command</Label>
              <Select value={command} onValueChange={(value: any) => setCommand(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELECT">SELECT</SelectItem>
                  <SelectItem value="INSERT">INSERT</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="ALL">ALL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role (optional)</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., authenticated"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Policy Type
                <Badge variant={isPermissive ? "default" : "destructive"}>
                  {isPermissive ? "PERMISSIVE" : "RESTRICTIVE"}
                </Badge>
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isPermissive}
                  onCheckedChange={setIsPermissive}
                />
                <span className="text-sm text-muted-foreground">
                  {isPermissive ? "Allow" : "Deny"}
                </span>
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="space-y-3">
            <Label>Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(POLICY_TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(key)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* USING Expression */}
          <div className="space-y-2">
            <Label htmlFor="using">USING Expression (for SELECT/UPDATE/DELETE)</Label>
            <Textarea
              id="using"
              value={usingExpression}
              onChange={(e) => setUsingExpression(e.target.value)}
              placeholder="e.g., auth.uid() = user_id"
              className="font-mono"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Determines which rows are visible to the current user
            </p>
          </div>

          {/* WITH CHECK Expression */}
          <div className="space-y-2">
            <Label htmlFor="check">WITH CHECK Expression (for INSERT/UPDATE)</Label>
            <Textarea
              id="check"
              value={withCheckExpression}
              onChange={(e) => setWithCheckExpression(e.target.value)}
              placeholder="e.g., auth.uid() = user_id"
              className="font-mono"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Determines which new/modified rows are allowed
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this policy does..."
              rows={2}
            />
          </div>

          {/* Warning for risky policies */}
          {(usingExpression === 'true' || withCheckExpression === 'true') && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Using 'true' allows unrestricted access. 
                Make sure this is intentional for public data.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!name || !tableName}
            >
              {editingPolicy ? 'Update' : 'Create'} Policy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}