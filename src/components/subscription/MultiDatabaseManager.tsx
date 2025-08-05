import React, { useState, useEffect } from 'react';
import { useStripe } from '@/contexts/StripeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Plus, Trash2, Edit } from 'lucide-react';
import { PremiumFeatureIndicator } from './PremiumFeatureIndicator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';


// Real database project type from Supabase
interface DatabaseProject {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  user_id: string;
  team_id: string | null;
  // Computed fields
  tables_count?: number;
  last_edited_relative?: string;
}

export function MultiDatabaseManager() {
  const { canUseMultipleDBs } = useStripe();
  const [databases, setDatabases] = useState<DatabaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDbName, setNewDbName] = useState('');
  const [newDbDescription, setNewDbDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Load user and databases on component mount
  useEffect(() => {
    loadUserAndDatabases();
  }, []);

  const loadUserAndDatabases = async () => {
    try {
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        return;
      }
      
      setUser(currentUser);
      
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Load user's database projects
      const { data: projects, error: projectsError } = await supabase
        .from('database_projects')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        toast.error('Failed to load databases');
        return;
      }

      // Count tables for each project from JSONB data (temporary until migration is applied)
      const projectsWithCounts = (projects || []).map((project) => {
        let tableCount = 0;
        
        // Count tables from JSONB project_data
        if (project.project_data && typeof project.project_data === 'object') {
          const projectData = project.project_data as any;
          if (projectData.tables && Array.isArray(projectData.tables)) {
            tableCount = projectData.tables.length;
          }
        }

        return {
          ...project,
          tables_count: tableCount,
          last_edited_relative: getRelativeTime(project.updated_at)
        };
      });

      setDatabases(projectsWithCounts);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load databases');
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const handleCreateDatabase = async () => {
    if (!newDbName.trim()) {
      toast.error('Please enter a database name');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a database');
      return;
    }

    try {
      const { data: newProject, error } = await supabase
        .from('database_projects')
        .insert({
          name: newDbName.trim(),
          description: newDbDescription.trim() || null,
          user_id: user.id,
          project_data: {
            tables: [],
            functions: [],
            triggers: [],
            comments: [],
            tasks: [],
            mockups: []
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating database:', error);
        toast.error('Failed to create database');
        return;
      }

      // Add to local state
      const newDb = {
        ...newProject,
        tables_count: 0,
        last_edited_relative: 'Just now'
      };
      
      setDatabases([newDb, ...databases]);
      setNewDbName('');
      setNewDbDescription('');
      setIsDialogOpen(false);
      toast.success(`Database "${newDbName}" created successfully`);
    } catch (error) {
      console.error('Error creating database:', error);
      toast.error('Failed to create database');
    }
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
                {db.tables_count || 0} tables • Last edited {db.last_edited_relative || 'Unknown'}
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
