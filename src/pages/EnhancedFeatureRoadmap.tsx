import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  User, 
  MessageSquare, 
  Calendar, 
  ChevronUp, 
  Crown, 
  CheckCircle, 
  Clock, 
  XCircle,
  Zap,
  AlertCircle,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  author_id: string;
  status: 'submitted' | 'next-up' | 'in-testing' | 'done' | 'rejected';
  admin_notes: string | null;
  completed_at: string | null;
  vote_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    email: string;
    display_name?: string;
    user_type?: 'user' | 'jetschema_admin';
  };
  user_vote?: {
    id: string;
    feature_id: string;
    user_id: string;
    created_at: string;
  } | null;
}

interface BugReport {
  id: string;
  type: 'bug' | 'feature' | 'question';
  feature: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  author_id: string;
  created_at: string;
  browser_info: any;
  browser_logs: any;
  screenshot_url: string;
  status: string;
  url: string;
  author?: {
    email: string;
    display_name?: string;
    user_type?: 'user' | 'jetschema_admin';
  };
}

interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  version: string | null;
  feature_id: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    email: string;
    display_name?: string;
  };
}

export default function EnhancedFeatureRoadmap() {
  // Define tab type for better type safety
  type TabType = 'requests' | 'bugs' | 'changelog';
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'recent' | 'oldest'>('votes');
  
  // New feature request form
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestDescription, setNewRequestDescription] = useState('');
  
  // Admin changelog form
  const [showChangelogForm, setShowChangelogForm] = useState(false);
  const [changelogTitle, setChangelogTitle] = useState('');
  const [changelogDescription, setChangelogDescription] = useState('');
  const [changelogVersion, setChangelogVersion] = useState('');

  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  // Check if user is admin
  const isAdmin = userProfile?.user_type === 'jetschema_admin';

  useEffect(() => {
    fetchUserProfile();
    fetchFeatureRequests();
    fetchBugReports();
    fetchChangelog();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (!error && data) {
      setUserProfile(data);
    }
  };

  const fetchFeatureRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('feature_requests')
        .select(`
          *,
          author:profiles!feature_requests_author_id_fkey(email, display_name, user_type),
          user_vote:feature_votes!left(*)
        `);

      if (user) {
        query = query.eq('feature_votes.user_id', user.id);
      }

      const { data, error } = await query.order('vote_count', { ascending: false });

      if (error) throw error;
      // Cast data to match FeatureRequest interface
      const typedData = (data || []).map(item => {
        // Handle potential SelectQueryError for author or null author
        const author = item.author || {};
        // Type assertion to access properties safely
        const typedAuthor = author as Record<string, any>;
        
        return {
          ...item,
          admin_notes: 'admin_notes' in item ? item.admin_notes : null,
          completed_at: 'completed_at' in item ? item.completed_at : null,
          author: {
            email: typedAuthor.email || '',
            display_name: typedAuthor.display_name || '',
            user_type: (typedAuthor.user_type as 'user' | 'jetschema_admin') || 'user'
          }
        };
      }) as unknown as FeatureRequest[];
      setFeatureRequests(typedData);
    } catch (error) {
      console.error('Error fetching feature requests:', error);
      toast.error('Failed to load feature requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchBugReports = async () => {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select(`
          *,
          author:profiles!user_feedback_author_id_fkey(email, display_name, user_type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast data to match BugReport interface
      const typedData = (data || []).map(item => {
        // Handle potential SelectQueryError for author or null author
        const author = item.author || {};
        // Type assertion to access properties safely
        const typedAuthor = author as Record<string, any>;
        
        return {
          ...item,
          status: 'status' in item ? item.status : 'open',
          author: {
            email: typedAuthor.email || '',
            display_name: typedAuthor.display_name || '',
            user_type: (typedAuthor.user_type as 'user' | 'jetschema_admin') || 'user'
          }
        };
      }) as unknown as BugReport[];
      setBugReports(typedData);
    } catch (error) {
      console.error('Error fetching bug reports:', error);
    }
  };

  const fetchChangelog = async () => {
    try {
      const { data, error } = await supabase
        .from('changelog')
        .select(`
          *,
          author:profiles!changelog_created_by_fkey(email, display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast data to match ChangelogEntry interface
      const typedData = (data || []).map(item => ({
        ...item,
        author: item.author || { email: '', display_name: '' }
      })) as ChangelogEntry[];
      setChangelog(typedData);
    } catch (error) {
      console.error('Error fetching changelog:', error);
    }
  };

  const handleVote = async (requestId: string, voteType: 'up') => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }

    try {
      const existingVote = featureRequests.find(r => r.id === requestId)?.user_vote;
      
      if (existingVote) {
        // Remove vote if it exists
        const { error } = await supabase
          .from('feature_votes')
          .delete()
          .eq('feature_id', requestId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Create new vote
        const { error } = await supabase
          .from('feature_votes')
          .insert({
            feature_id: requestId,
            user_id: user.id
          });
        
        if (error) throw error;
      }

      await fetchFeatureRequests();
      toast.success('Vote updated!');
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to update vote');
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string, adminNotes?: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('feature_requests')
        .update({ 
          status: newStatus as FeatureRequest['status'],
          admin_notes: adminNotes || null
        })
        .eq('id', requestId);

      if (error) throw error;

      await fetchFeatureRequests();
      if (newStatus === 'done') {
        await fetchChangelog(); // Refresh changelog as it auto-updates
      }
      toast.success('Status updated!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleCreateRequest = async () => {
    if (!user || !newRequestTitle.trim() || !newRequestDescription.trim()) return;

    try {
      const { error } = await supabase
        .from('feature_requests')
        .insert({
          title: newRequestTitle,
          description: newRequestDescription,
          author_id: user.id
        });

      if (error) throw error;

      setNewRequestTitle('');
      setNewRequestDescription('');
      setShowNewRequestForm(false);
      await fetchFeatureRequests();
      toast.success('Feature request created!');
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to create request');
    }
  };

  const handleCreateChangelogEntry = async () => {
    if (!isAdmin || !changelogTitle.trim() || !changelogDescription.trim()) return;

    try {
      const { error } = await supabase
        .from('changelog')
        .insert({
          title: changelogTitle,
          description: changelogDescription,
          version: changelogVersion || null,
          created_by: user!.id
        });

      if (error) throw error;

      setChangelogTitle('');
      setChangelogDescription('');
      setChangelogVersion('');
      setShowChangelogForm(false);
      await fetchChangelog();
      toast.success('Changelog entry created!');
    } catch (error) {
      console.error('Error creating changelog entry:', error);
      toast.error('Failed to create changelog entry');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'next-up': return <Zap className="h-4 w-4" />;
      case 'in-testing': return <AlertCircle className="h-4 w-4" />;
      case 'done': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-gray-100 text-gray-800';
      case 'next-up': return 'bg-blue-100 text-blue-800';
      case 'in-testing': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = featureRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredBugs = bugReports.filter(bug => {
    const matchesSearch = bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bug.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || bug.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="container mx-auto px-4 py-8 max-w-6xl h-screen flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feature Roadmap</h1>
            <p className="text-muted-foreground mt-2">
              Request features, report bugs, and track our progress
            </p>
          </div>

          <div className="flex gap-2">
            <Dialog open={showNewRequestForm} onOpenChange={setShowNewRequestForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Feature
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request New Feature</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newRequestTitle}
                      onChange={(e) => setNewRequestTitle(e.target.value)}
                      placeholder="Brief description of the feature"
                    />
                  </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRequestDescription}
                    onChange={(e) => setNewRequestDescription(e.target.value)}
                    placeholder="Detailed description of what you'd like to see"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewRequestForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRequest}>
                    Create Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {isAdmin && (
            <Dialog open={showChangelogForm} onOpenChange={setShowChangelogForm}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Changelog
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Changelog Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="changelog-title">Title</Label>
                    <Input
                      id="changelog-title"
                      value={changelogTitle}
                      onChange={(e) => setChangelogTitle(e.target.value)}
                      placeholder="Feature or update title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="changelog-version">Version (optional)</Label>
                    <Input
                      id="changelog-version"
                      value={changelogVersion}
                      onChange={(e) => setChangelogVersion(e.target.value)}
                      placeholder="v1.2.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="changelog-description">Description</Label>
                    <Textarea
                      id="changelog-description"
                      value={changelogDescription}
                      onChange={(e) => setChangelogDescription(e.target.value)}
                      placeholder="Detailed description of the changes"
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowChangelogForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateChangelogEntry}>
                      Add Entry
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="requests">Feature Requests</TabsTrigger>
              <TabsTrigger value="bugs">Bug Reports</TabsTrigger>
              <TabsTrigger value="changelog">Changelog</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feature requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="next-up">Next Up</SelectItem>
                <SelectItem value="in-testing">In Testing</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'votes' | 'recent' | 'oldest')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="votes">Most Votes</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No feature requests found
              </div>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{request.title}</CardTitle>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status.replace('-', ' ')}</span>
                          </Badge>
                          {request.author?.user_type === 'jetschema_admin' && (
                            <Badge variant="secondary">
                              <Crown className="h-3 w-3 mr-1" />
                              JetSchema Team
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{request.description}</CardDescription>
                        {request.admin_notes && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">
                              <strong>Admin Note:</strong> {request.admin_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <div className="flex flex-col items-center">
                          <Button
                            variant={request.user_vote ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleVote(request.id, 'up')}
                            disabled={!user}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium py-1">{request.vote_count}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {request.author?.display_name || request.author?.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {request.comment_count} comments
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(request.created_at))} ago
                        </span>
                      </div>
                      
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Select
                            value={request.status}
                            onValueChange={(value) => handleStatusUpdate(request.id, value as FeatureRequest['status'])}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="next-up">Next Up</SelectItem>
                              <SelectItem value="in-testing">In Testing</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

            <TabsContent value="bugs" className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bug reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredBugs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bug reports found
              </div>
            ) : (
              filteredBugs.map((bug) => (
                <Card key={bug.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{bug.title}</CardTitle>
                          <Badge variant="outline">{bug.type}</Badge>
                          <Badge className={getPriorityColor(bug.priority)}>
                            {bug.priority}
                          </Badge>
                          {bug.author?.user_type === 'jetschema_admin' && (
                            <Badge variant="secondary">
                              <Crown className="h-3 w-3 mr-1" />
                              JetSchema Team
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{bug.description}</CardDescription>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <strong>Feature:</strong> {bug.feature}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {bug.author?.display_name || bug.author?.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(bug.created_at))} ago
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

            <TabsContent value="changelog" className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-4">
            {changelog.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No changelog entries yet
              </div>
            ) : (
              changelog.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{entry.title}</CardTitle>
                          {entry.version && (
                            <Badge variant="secondary">{entry.version}</Badge>
                          )}
                        </div>
                        <CardDescription>{entry.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {entry.author?.display_name || entry.author?.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(entry.created_at))} ago
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
