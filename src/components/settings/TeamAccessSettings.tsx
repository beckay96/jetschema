import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Shield, Edit, Eye, UserPlus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joined_at: string;
  profiles?: {
    email?: string;
    display_name?: string;
  } | null;
}

interface Team {
  id: string;
  name: string;
  description: string;
  created_at: string;
  member_count?: number;
  user_role?: string;
}

interface TeamAccessSettingsProps {
  user: any;
  loading: boolean;
  onNavigateToTeam: () => void;
}

export function TeamAccessSettings({ user, loading, onNavigateToTeam }: TeamAccessSettingsProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      loadTeamData();
    }
  }, [user, loading]);

  const loadTeamData = async () => {
    if (!user) return;

    try {
      setLoadingTeams(true);

      // Get teams where user is a member
      const { data: membershipData, error: membershipError } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          team_id,
          role,
          joined_at,
          teams!inner (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (membershipError) {
        console.error('Error loading team memberships:', membershipError);
        // Don't show error toast for team loading - it's not critical
        setTeams([]);
        return;
      }

      // Transform the data to get teams with user roles
      const userTeams = (membershipData || []).map((membership: any) => ({
        ...membership.teams,
        user_role: membership.role,
        member_count: 0 // We'll load this separately if needed
      }));

      setTeams(userTeams);

        // Load team members for the first team (for display purposes)
        if (userTeams.length > 0) {
          const firstTeam = userTeams[0];
          
          // Get team members first
          const { data: membersData, error: membersError } = await supabase
            .from('team_members')
            .select('id, user_id, team_id, role, joined_at')
            .eq('team_id', firstTeam.id)
            .limit(5);

          if (!membersError && membersData) {
            // Get profile data separately to avoid relationship issues
            const membersWithProfiles = await Promise.all(
              membersData.map(async (member) => {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('user_id', member.user_id)
                  .single();
                
                return {
                  ...member,
                  profiles: profile
                };
              })
            );
            
            setTeamMembers(membersWithProfiles);
          }
        }

    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'editor': return <Edit className="h-4 w-4 text-green-500" />;
      case 'viewer': return <Eye className="h-4 w-4 text-gray-500" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'editor': return 'outline';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  if (loading || loadingTeams) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Access Management</CardTitle>
          <CardDescription>Loading your team information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Team Access Management</CardTitle>
          <CardDescription>
            View and manage your team memberships and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {teams.length === 0 ? (
            // No teams state
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No Teams Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create or join a team to collaborate on projects with other users.
              </p>
              <Button onClick={onNavigateToTeam} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Create Your First Team
              </Button>
            </div>
          ) : (
            // Teams list
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Your Teams ({teams.length})</h3>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="gap-1.5"
                  onClick={onNavigateToTeam}
                >
                  <Settings className="h-4 w-4" />
                  Manage Teams
                </Button>
              </div>

              <div className="grid gap-3">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{team.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {team.description || 'No description'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(team.user_role || '')} className="gap-1">
                        {getRoleIcon(team.user_role || '')}
                        {team.user_role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members Preview (if user has teams) */}
      {teams.length > 0 && teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Team Activity</CardTitle>
            <CardDescription>
              Team members from {teams[0]?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.slice(0, 3).map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {member.profiles?.display_name || 
                         (member.profiles?.email ? member.profiles.email.split('@')[0] : '') || 
                         'Unknown User'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.profiles?.email || 'No email available'}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1 text-xs">
                    {getRoleIcon(member.role)}
                    {member.role}
                  </Badge>
                </div>
              ))}
              
              {teamMembers.length > 3 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm" onClick={onNavigateToTeam}>
                    View All Members
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Project Sharing</CardTitle>
              <Badge variant="outline">Available</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Share projects with team members and collaborate in real-time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Role Management</CardTitle>
              <Badge variant="outline">Pro Feature</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Define custom roles and granular permissions for team members.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
