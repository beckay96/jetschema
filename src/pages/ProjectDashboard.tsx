import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Database, 
  Users, 
  MessageSquare, 
  Shield, 
  Download, 
  GitMerge, 
  Activity, 
  Sparkles,
  Rocket,
  Zap,
  Target,
  Award,
  TrendingUp,
  Clock,
  FileText,
  Import,
  Search,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JetSchemaLogo } from '@/components/ui/JetSchemaLogo';
import { useProjects } from '@/hooks/useProjects';

/**
 * Enhanced Project Dashboard - Interactive onboarding and feature showcase
 * 
 * Features:
 * - Interactive onboarding for new users
 * - Animated placeholders and engaging stats
 * - JetSchema unique feature highlights
 * - Quick action power panel
 * - Light gamification with badges and progress
 * - Beautiful empty states with calls-to-action
 */
function ProjectDashboard() {
  const navigate = useNavigate();
  const { projects, loading } = useProjects();
  const [animatedStats, setAnimatedStats] = useState({ projects: 0, activity: 0 });
  
  // Animate stats on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats({ 
        projects: projects.length, 
        activity: projects.length * 3 // Simulate activity count
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [projects]);

  const hasProjects = projects.length > 0;
  const completionPercentage = hasProjects ? Math.min(85, projects.length * 25) : 0;

  // Mock badges for demonstration
  const badges = [
    { id: 'first-table', name: 'First Table Created', earned: hasProjects, icon: Database },
    { id: 'first-rls', name: 'First RLS Policy', earned: false, icon: Shield },
    { id: 'team-invite', name: 'Team Collaboration', earned: false, icon: Users },
    { id: 'first-export', name: 'SQL Export Master', earned: false, icon: Download }
  ];

  const earnedBadges = badges.filter(b => b.earned);

  return (
    <div className="container py-10 space-y-8">
      {/* Header with Dynamic Greeting */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Welcome to JetSchema</h1>
          {hasProjects && <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />}
        </div>
        <p className="text-muted-foreground">
          {hasProjects 
            ? `You have ${projects.length} project${projects.length === 1 ? '' : 's'} in your workspace` 
            : "Let's build something amazing together"}
        </p>
      </div>

      {/* Quick Action Power Panel */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Jump into action with these powerful tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={() => navigate('/projects')} 
              className="h-auto p-4 flex flex-col items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
              <span className="font-medium">New Schema</span>
              <span className="text-xs opacity-80">Start fresh</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-secondary/50"
              onClick={() => navigate('/projects')}
            >
              <Import className="h-6 w-6" />
              <span className="font-medium">Import Schema</span>
              <span className="text-xs opacity-60">From Supabase/JSON</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-secondary/50"
              disabled={!hasProjects}
            >
              <Search className="h-6 w-6" />
              <span className="font-medium">RLS Audit</span>
              <span className="text-xs opacity-60">{hasProjects ? 'Analyze security' : 'Need schema first'}</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/merge')} 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-secondary/50"
              disabled={projects.length < 2}
            >
              <GitMerge className="h-6 w-6" />
              <span className="font-medium">Merge Schemas</span>
              <span className="text-xs opacity-60">{projects.length < 2 ? 'Need 2+ projects' : 'Combine projects'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats with Animation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Projects</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {animatedStats.projects}
              {animatedStats.projects === 0 && (
                <div className="animate-pulse text-muted-foreground text-sm">✨ Start here!</div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasProjects ? 'Active schemas' : 'Ready to create your first?'}
            </p>
            {animatedStats.projects === 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            )}
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Activity</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              {animatedStats.activity}
              {animatedStats.activity === 0 && (
                <TrendingUp className="h-4 w-4 animate-bounce text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasProjects ? 'Comments & changes' : 'Collaborate with your team'}
            </p>
            {animatedStats.activity === 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-shimmer" />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">{completionPercentage}%</div>
            <Progress value={completionPercentage} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {completionPercentage === 0 ? 'Let\'s get started!' : 'Great progress!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* What Makes JetSchema Unique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            What You Can Do with JetSchema
          </CardTitle>
          <CardDescription>
            Discover the features that make JetSchema unique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Visualize Tables & Relationships</h4>
                <p className="text-sm text-muted-foreground">
                  Design your database schema visually with drag-and-drop tables, fields, and relationships
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Plan RLS Rules & Triggers</h4>
                <p className="text-sm text-muted-foreground">
                  Design Row Level Security policies and database triggers before you deploy
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Collaborate with Comments</h4>
                <p className="text-sm text-muted-foreground">
                  Add comments to tables and fields, assign tasks, and work together as a team
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Download className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Export Clean SQL</h4>
                <p className="text-sm text-muted-foreground">
                  Generate production-ready SQL that's clean, optimized, and ready to deploy
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gamification & Badges */}
      {earnedBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Your Achievements
            </CardTitle>
            <CardDescription>
              Celebrate your JetSchema milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <Badge 
                    key={badge.id} 
                    variant={badge.earned ? "default" : "secondary"}
                    className={`flex items-center gap-2 p-2 ${badge.earned ? 'bg-primary text-primary-foreground' : 'opacity-50'}`}
                  >
                    <Icon className="h-4 w-4" />
                    {badge.name}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Onboarding for Empty State */}
      {!hasProjects && (
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
          <CardContent className="text-center py-12">
            <div className="relative">
              <JetSchemaLogo className="h-20 w-20 mx-auto mb-6 text-primary animate-pulse" preserveColor={true} />
              <div className="absolute -top-2 -right-2 animate-bounce">
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-3">Ready to Build Something Amazing?</h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              JetSchema makes database design visual, collaborative, and fun. 
              Start with one of these quick actions to see the magic in under 60 seconds!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-primary/20 hover:border-primary/40" onClick={() => navigate('/projects')}>
                <Database className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="font-medium mb-2">Create Your First Schema</h4>
                <p className="text-sm text-muted-foreground">Design your first table in under 60 seconds</p>
              </Card>
              
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-blue-200 hover:border-blue-400">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-medium mb-2">Invite Your Team</h4>
                <p className="text-sm text-muted-foreground">See how team collaboration works</p>
              </Card>
              
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-green-200 hover:border-green-400">
                <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h4 className="font-medium mb-2">Add Comments</h4>
                <p className="text-sm text-muted-foreground">Try commenting on a field or table</p>
              </Card>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/projects')} className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Your First Project
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/projects')}>
                <FileText className="h-4 w-4 mr-2" />
                Import Existing Schema
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coming Soon Features */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-600" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            Exciting features we're working on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span className="font-medium">AI Schema Assistant</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Smart Indexing</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <GitMerge className="h-5 w-5 text-green-500" />
              <span className="font-medium">Visual Merge Diff</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProjectDashboard;
