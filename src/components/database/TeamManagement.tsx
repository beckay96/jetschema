import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Mail, Settings, Trash2, Crown, Shield, Edit, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joined_at: string;
  profiles: {
    email: string;
    full_name: string;
  } | null;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_by: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface TeamManagementProps {
  projectId?: string;
}

export function TeamManagement({ projectId }: TeamManagementProps) {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTeamData();
    }
  }, [user, projectId]);

  const loadTeamData = async () => {
    if (!user) return;

    try {
      // Get team info from project or user's team
      let teamId = null;
      
      if (projectId) {
        const { data: project } = await supabase
          .from('database_projects')
          .select('team_id')
          .eq('id', projectId)
          .single();
        teamId = project?.team_id;
      }

      if (!teamId) {
        // Get user's primary team
        const { data: memberData } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .limit(1);
        teamId = memberData?.[0]?.team_id;
      }

      if (!teamId) {
        setLoading(false);
        return;
      }

      // Get team details
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      // Get team members with profiles
      const { data: membersData } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          team_id,
          role,
          joined_at,
          profiles(email, full_name)
        `)
        .eq('team_id', teamId);

      // Get pending invitations
      const { data: invitationsData } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId);

      setTeam(teamData);
      setMembers((membersData as any) || []);
      setInvitations(invitationsData || []);
    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async () => {
    if (!inviteEmail || !team || !user) return;

    try {
      const { error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: team.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: user.id
        });

      if (error) throw error;

      toast.success('Invitation sent successfully');
      setInviteEmail('');
      setShowInviteDialog(false);
      loadTeamData();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to send invitation');
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'owner' | 'admin' | 'editor' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Role updated successfully');
      loadTeamData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed successfully');
      loadTeamData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'editor': return <Edit className="h-3 w-3" />;
      case 'viewer': return <Eye className="h-3 w-3" />;
      default: return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading team data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!team) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No team found. Create a team to collaborate with others.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {team.name}
          </CardTitle>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Full access</SelectItem>
                      <SelectItem value="editor">Editor - Can edit everything</SelectItem>
                      <SelectItem value="viewer">Viewer - Read only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={inviteUser} className="w-full">
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {team.description && (
          <p className="text-sm text-muted-foreground">{team.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Team Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Team Members ({members.length})</h3>
          </div>
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {member.profiles?.full_name?.[0] || member.profiles?.email?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {member.profiles?.full_name || member.profiles?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.profiles?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getRoleColor(member.role)}>
                      {getRoleIcon(member.role)}
                      <span className="ml-1 capitalize">{member.role}</span>
                    </Badge>
                    {member.role !== 'owner' && member.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => removeMember(member.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="h-4 w-4" />
              <h3 className="font-medium">Pending Invitations ({invitations.length})</h3>
            </div>
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={getRoleColor(invitation.role)}>
                    {getRoleIcon(invitation.role)}
                    <span className="ml-1 capitalize">{invitation.role}</span>
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}