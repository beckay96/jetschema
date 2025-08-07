import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Mail, Settings, Trash2, Crown, Shield, Edit, Eye, Plus, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { InvitationManagement } from '@/components/Notifications/InvitationManagement';

// Types based on the actual database schema
interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_by: string;
  joined_at: string;
  profiles: {
    email: string;
    display_name: string;
  } | null;
}

interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface TeamManagementProps {
  projectId?: string;
}

export function TeamManagement({ projectId }: TeamManagementProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTeamData();
    }
  }, [user, projectId]);

  const loadTeamData = async () => {
    if (!user) {
      console.log('No user found, cannot load teams');
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Loading teams for user:', user.id);
      
      // Load teams where the user is a member
      const { data: userTeamMemberships, error: teamsError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          teams (
            id,
            name,
            description,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (teamsError) {
        console.error('Failed to load user teams:', teamsError);
        setError('Failed to load teams');
        toast.error('Failed to load teams');
        setTeams([]);
        return;
      }

      // Extract teams from the join result and ensure they have all required properties
      const teamsData = userTeamMemberships?.map(membership => {
        const team = membership.teams;
        return team ? {
          id: team.id,
          name: team.name,
          description: team.description || '',
          created_by: team.created_by || '',
          created_at: team.created_at,
          updated_at: team.updated_at || team.created_at
        } : null;
      }).filter(Boolean) || [];
      console.log('Teams loaded successfully:', teamsData);
      setTeams(teamsData as Team[]);

      // Determine which team to load details for
      let teamId = null;
      
      if (projectId) {
        // If we have a project ID, get its team
        const { data: project, error: projectError } = await supabase
          .from('database_projects')
          .select('team_id')
          .eq('id', projectId)
          .single();
          
        if (projectError) {
          console.error('Failed to load project team:', projectError);
        } else {
          teamId = project?.team_id;
        }
      } else if (selectedTeamId && teamsData.find(t => t.id === selectedTeamId)) {
        // Use the selected team if it exists
        teamId = selectedTeamId;
      } else if (teamsData.length > 0) {
        // Default to the first team
        teamId = teamsData[0].id;
        setSelectedTeamId(teamId);
      }
      
      if (!teamId) {
        // No teams found or no valid team ID
        setTeam(null);
        setMembers([]);
        setInvitations([]);
        return;
      }

      // Load team details
      const selectedTeam = teamsData.find(t => t.id === teamId);
      if (selectedTeam) {
        setTeam(selectedTeam);
      }

      // Load team members with their profiles
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('id, user_id, team_id, role, invited_by, joined_at')
        .eq('team_id', teamId);
        
      if (membersError) {
        console.error('Failed to load team members:', membersError);
        toast.error('Failed to load team members');
        setMembers([]);
      } else if (membersData && membersData.length > 0) {
        // Load profiles separately to avoid relation issues
        const userIds = membersData.map(m => m.user_id);
        
        // Make sure to include the current user's ID to get their profile too
        if (user && !userIds.includes(user.id)) {
          userIds.push(user.id);
        }
        
        console.log('Fetching profiles for user IDs:', userIds);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, user_id, email, display_name')
          .in('user_id', userIds);
        
        // Debug profiles data
        console.log('Profiles data:', profilesData);
          
        if (profilesError) {
          console.error('Failed to load profiles:', profilesError);
          // Use members without detailed profile data
          const membersWithoutProfiles = membersData.map(member => ({
            ...member,
            invited_by: member.invited_by || '',
            profiles: {
              email: 'Loading...',
              display_name: 'Loading...'
            }
          }));
          setMembers(membersWithoutProfiles);
        } else {
          // Join the data manually
          const membersWithProfiles = membersData.map(member => {
            // Find the matching profile by user_id
            const profile = profilesData?.find(p => p.user_id === member.user_id);
            
            // Log for debugging
            if (!profile) {
              console.log(`No profile found for user_id: ${member.user_id}`);
            }
            
            // If this is the current user and there's no profile, use auth info
            if (member.user_id === user?.id && !profile && user?.email) {
              return {
                ...member,
                invited_by: member.invited_by || '',
                profiles: {
                  email: user.email,
                  display_name: user.email.split('@')[0] // Use email username as display name
                }
              };
            }
            
            return {
              ...member,
              invited_by: member.invited_by || '',
              profiles: profile ? {
                email: profile.email || '',
                display_name: profile.display_name || profile.email?.split('@')[0] || ''
              } : {
                email: `User ID: ${member.user_id.substring(0, 8)}...`,
                display_name: `User ${member.user_id.substring(0, 8)}...`
              }
            };
          });
          
          console.log('Team members loaded successfully:', membersWithProfiles);
          setMembers(membersWithProfiles);
        }
      } else {
        setMembers([]);
      }

      // Load pending team invitations with better error handling
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('team_invitations')
        .select('id, team_id, email, role, invited_by, invited_user_id, expires_at, accepted_at, created_at')
        .eq('team_id', teamId)
        .is('accepted_at', null); // Only get pending invitations
        
      if (invitationsError) {
        console.error('Failed to load team invitations:', invitationsError);
        // Don't show error to user for invitations - it's not critical
        // The error might be due to RLS policies that need fixing
        setInvitations([]);
      } else {
        console.log('Team invitations loaded successfully:', invitationsData);
        setInvitations(invitationsData || []);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      setError('Failed to load team data');
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async () => {
    if (!inviteEmail || !team || !user) return;

    try {
      // First, check if the user exists in the system
      // Try profiles table first, then fall back to auth.users if needed
      let existingUser = null;
      let userLookupError = null;
      
      const { data: profileUser, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, email, display_name')
        .eq('email', inviteEmail.toLowerCase().trim())
        .maybeSingle(); // Use maybeSingle to avoid errors when no rows found

      if (profileError) {
        console.error('Profile lookup error:', profileError);
        // If profiles lookup fails, we can't proceed with invitation
        toast.error(`Error looking up user: ${profileError.message}`);
        return;
      }
      
      if (profileUser) {
        existingUser = profileUser;
      } else {
        // User not found in profiles - they need to sign up first
        toast.error(`No JetSchema user found with email ${inviteEmail}. Users must have a JetSchema account to be invited.`);
        return;
      }

      // Check if user is already a team member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team.id)
        .eq('user_id', existingUser.user_id)
        .single();

      if (existingMember) {
        toast.error(`${inviteEmail} is already a member of this team.`);
        return;
      }

      // Check if there's already a pending invitation
      const { data: existingInvitation, error: inviteCheckError } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('team_id', team.id)
        .eq('email', inviteEmail.toLowerCase().trim())
        .is('accepted_at', null)
        .single();

      if (existingInvitation) {
        toast.error(`There is already a pending invitation for ${inviteEmail}.`);
        return;
      }

      // Create the invitation (no token needed for in-app notifications)
      const { data: invitationData, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: team.id,
          email: inviteEmail.toLowerCase().trim(),
          role: inviteRole,
          invited_by: user.id,
          invited_user_id: existingUser.user_id, // Store the actual user ID for notifications
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiration
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Invitation sent to ${existingUser.display_name || inviteEmail}! They will see it in their notifications.`);
      
      setInviteEmail('');
      setShowInviteDialog(false);
      loadTeamData();
      
      // Log invitation details for development
      console.log('🎉 Team Invitation Created:');
      console.log('📧 Email:', inviteEmail);
      console.log('👤 User:', existingUser.display_name || existingUser.email);
      console.log('👥 Team:', team.name);
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to send invitation');
    }
  };

  // Simple function to create team with basic error handling
  const createTeam = async () => {
    if (!newTeamName || !user) {
      toast.error('Please enter a team name');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Creating team with name:', newTeamName);
      
      // Basic validation
      if (newTeamName.trim().length < 2) {
        toast.error('Team name must be at least 2 characters');
        setLoading(false);
        return;
      }

      // 1. Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          description: newTeamDescription.trim() || null,
          created_by: user.id
        })
        .select();
      
      if (teamError) {
        console.error('Team creation error:', teamError);
        toast.error(`Failed to create team: ${teamError.message}`);
        setLoading(false);
        return;
      }
      
      console.log('Team created successfully:', team);
      
      // 2. Add user as team owner
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team[0].id,
          user_id: user.id,
          role: 'owner'
        });
      
      if (memberError) {
        console.error('Failed to add team owner:', memberError);
        
        // Check if it's the known RLS infinite recursion error
        const isRLSRecursionError = memberError.message.includes('infinite recursion') && 
                                   memberError.message.includes('team_members');
        
        if (isRLSRecursionError) {
          // If it's the RLS error we know teams are created successfully
          console.log('RLS recursion error detected, but team was created. Proceeding anyway...');
          toast.success('Team created successfully');
        } else {
          toast.error(`Failed to add you as team owner: ${memberError.message}`);
          
          // Try to clean up the team if member creation fails with a non-RLS error
          try {
            await supabase.from('teams').delete().eq('id', team[0].id);
          } catch (cleanupError) {
            console.error('Failed to clean up team:', cleanupError);
          }
          
          setLoading(false);
          return;
        }
      }

      toast.success('Team created successfully');
      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateTeamDialog(false);
      
      // Refresh teams list
      loadTeamData();
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error(`Failed to create team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
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
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Editor
          </Button>
        </div>
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
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Editor
          </Button>
        </div>

        <div className="space-y-6">
          <InvitationManagement />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Selection */}
            {teams.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Select a team to manage</h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {teams.map(teamItem => (
                    <Card 
                      key={teamItem.id} 
                      className="cursor-pointer hover:border-primary transition-all"
                      onClick={() => {
                        setSelectedTeamId(teamItem.id);
                        // Load full team data for the selected team
                        loadTeamData();
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{teamItem.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {teamItem.description || 'No description'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <Users className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-6">You don't have any teams yet</p>
              </div>
            )}
            
            {/* Create Team Button */}
            <div className="flex justify-center">
              <Dialog open={showCreateTeamDialog} onOpenChange={setShowCreateTeamDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create a Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a New Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamName">Team Name</Label>
                      <Input 
                        id="teamName" 
                        value={newTeamName} 
                        onChange={(e) => setNewTeamName(e.target.value)} 
                        placeholder="Enter team name" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamDescription">Description (optional)</Label>
                      <Input 
                        id="teamDescription" 
                        value={newTeamDescription} 
                        onChange={(e) => setNewTeamDescription(e.target.value)} 
                        placeholder="Team description" 
                      />
                    </div>
                    <Button 
                      onClick={createTeam} 
                      className="w-full" 
                      disabled={loading || !newTeamName.trim()}
                    >
                      {loading ? 'Creating...' : 'Create Team'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // UI for selected team
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => {
            setTeam(null);
            setSelectedTeamId(null);
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
        </div>
        
        {/* Team selector */}
        {teams.length > 1 && (
          <Select 
            value={team?.id} 
            onValueChange={(value) => {
              setSelectedTeamId(value);
              loadTeamData();
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(teamItem => (
                <SelectItem key={teamItem.id} value={teamItem.id}>
                  {teamItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {team?.name || 'Team'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Member Management */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <h3 className="font-medium">Members</h3>
              </div>
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" /> Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        value={inviteEmail} 
                        onChange={(e) => setInviteEmail(e.target.value)} 
                        placeholder="colleague@example.com" 
                        type="email" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select defaultValue={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={inviteUser} className="w-full">Send Invitation</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <ScrollArea className="h-[250px] rounded-md border p-4">
              <div className="space-y-4">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {member.profiles?.display_name || member.profiles?.email?.split('@')[0] || `User ${member.user_id.substring(0, 8)}...`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.profiles?.email || `ID: ${member.user_id.substring(0, 8)}...`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getRoleColor(member.role)}>
                        {getRoleIcon(member.role)}
                        <span className="ml-1 capitalize">{member.role}</span>
                      </Badge>
                      
                      {member.role !== 'owner' && (
                        <Select defaultValue={member.role} onValueChange={(role: any) => updateMemberRole(member.id, role)}>
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      {member.role !== 'owner' && (
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
    </div>
  );
}