import React, { useState } from 'react';
import { useStripe } from '@/contexts/StripeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Plus, Trash2, Edit } from 'lucide-react';
import { PremiumFeatureIndicator } from './PremiumFeatureIndicator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Mock database type
interface DatabaseProject {
  id: string;
  name: string;
  tables: number;
  lastEdited: string;
}

export function MultiDatabaseManager() {
  const { canUseMultipleDBs } = useStripe();
  const [databases, setDatabases] = useState<DatabaseProject[]>([
    {
      id: 'db1',
      name: 'Main Database',
      tables: 5,
      lastEdited: '2 hours ago'
    }
  ]);
  const [newDbName, setNewDbName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateDatabase = () => {
    if (!newDbName.trim()) {
      toast.error('Please enter a database name');
      return;
    }

    const newDb: DatabaseProject = {
      id: `db${Date.now()}`,
      name: newDbName,
      tables: 0,
      lastEdited: 'Just now'
    };

    setDatabases([...databases, newDb]);
    setNewDbName('');
    setIsDialogOpen(false);
    toast.success(`Database "${newDbName}" created successfully`);
  };

  const handleDeleteDatabase = (id: string) => {
    setDatabases(databases.filter(db => db.id !== id));
    toast.success('Database deleted successfully');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Databases</h2>
        
        <PremiumFeatureIndicator feature="multidb" showLock={false}>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Database
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Database</DialogTitle>
                <DialogDescription>
                  Enter a name for your new database project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Database Name</Label>
                  <Input
                    id="name"
                    placeholder="My New Database"
                    value={newDbName}
                    onChange={(e) => setNewDbName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCreateDatabase}>Create Database</Button>
              </div>
            </DialogContent>
          </Dialog>
        </PremiumFeatureIndicator>
      </div>

      <div className="grid gap-4">
        {databases.map((db) => (
          <Card key={db.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{db.name}</CardTitle>
                </div>
                {databases.length > 1 && canUseMultipleDBs && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteDatabase(db.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardDescription>
                {db.tables} tables • Last edited {db.lastEdited}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-3 border-t bg-muted/50">
              <div className="flex w-full justify-between">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}

        {!canUseMultipleDBs && databases.length === 1 && (
          <PremiumFeatureIndicator feature="multidb">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Add More Databases</CardTitle>
                <CardDescription>
                  Upgrade to create multiple database projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-6">
                  <Plus className="h-12 w-12 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </PremiumFeatureIndicator>
        )}
      </div>
    </div>
  );
}
