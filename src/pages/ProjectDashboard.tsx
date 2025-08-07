import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitMerge, Activity, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JetSchemaLogo } from '@/components/ui/JetSchemaLogo';

/**
 * Project Dashboard - Shows comprehensive project statistics
 * 
 * Features:
 * - Total projects created, active, and deleted counts
 * - Recent activity overview
 * - Quick navigation to projects and merge functionality
 */
function ProjectDashboard() {
  const navigate = useNavigate();

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Project Dashboard</h1>
        <p className="text-muted-foreground">Overview of your database projects and activity</p>
      </div>
      
      {/* Quick Actions */}
      <div className="flex gap-4 mb-8">
        <Button onClick={() => navigate('/projects')} className="flex items-center gap-2">
          <JetSchemaLogo size="small" />
          View All Projects
        </Button>
        <Button onClick={() => navigate('/merge')} variant="outline" className="flex items-center gap-2">
          <GitMerge className="h-4 w-4" />
          Merge Projects
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <JetSchemaLogo size="small" className="text-muted-foreground" preserveColor={true} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Welcome Message */}
      <Card>
        <CardContent className="text-center py-12">
          <JetSchemaLogo className="h-16 w-16 mx-auto mb-4 text-muted-foreground" preserveColor={true} />
          <h3 className="text-xl font-medium mb-2">Welcome to JetSchema Dashboard</h3>
          <p className="text-muted-foreground mb-6">
            Your project statistics and merge tools will appear here once you create some projects.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/projects')}>View Projects</Button>
            <Button variant="outline" onClick={() => navigate('/merge')}>Merge Projects</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProjectDashboard;
