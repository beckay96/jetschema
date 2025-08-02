import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Database, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Projects() {
  const navigate = useNavigate();
  const { projects, loading, saveProject, deleteProject } = useProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    const project = await saveProject(newProject.name, newProject.description, {
      tables: [],
      triggers: [],
      functions: []
    });

    if (project) {
      setIsCreateOpen(false);
      setNewProject({ name: '', description: '' });
      navigate(`/project/${project.id}`);
    }
  };

  // New implementation using AlertDialog instead of native confirm
  const handleDeleteProject = (id: string) => {
    setProjectToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  // Actual deletion happens here after confirmation
  const confirmDeleteProject = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete);
        // Clear state after successful deletion
        setProjectToDelete(null);
        setIsDeleteDialogOpen(false);
      } catch (error) {
        console.error('Failed to delete project:', error);
        toast.error('Failed to delete project. Please try again.');
      }
    }
  };
  
  // Cancel deletion
  const cancelDeleteProject = () => {
    setProjectToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Safe transformation of project data - no demo data, just using what's available
  const projectsToRender = Array.isArray(projects) ? projects : [];
  
  // Debug logging to see project data structure
  console.log('Projects data:', projects);
  if (projectsToRender.length > 0) {
    console.log('First project example:', projectsToRender[0]);
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Database Projects</h1>
            <p className="text-muted-foreground mt-2">Manage your database schema projects</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Create a new database schema project to design and manage your tables.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Project description"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject}>
                    Create Project
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsToRender.map((project) => {
            // Safely access project data with fallbacks
            const tableCount = project?.project_data?.tables?.length || 0;
            const lastUpdated = project?.updated_at ? new Date(project.updated_at).toLocaleDateString() : new Date().toLocaleDateString();

            return (
              <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Display title with fallbacks to ensure it's always shown */}
                      <CardTitle className="text-xl mb-2">
                        {project?.name || project?.project_data?.name || 'Project'}
                      </CardTitle>
                      {project?.description && (
                        <CardDescription>{project.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/project/${project.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Database className="h-4 w-4" />
                        <span>{tableCount} tables</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{lastUpdated}</span>
                      </div>
                    </div>
                    
                    {project.team_id && (
                      <Badge variant="secondary" className="w-fit">
                        <Users className="h-3 w-3 mr-1" />
                        Team Project
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {projectsToRender.length === 0 && (
          <div className="text-center py-12">
            <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first database schema project to get started
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        )}
      </div>
      
      {/* Alert Dialog for Project Deletion Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all of its associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteProject}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}