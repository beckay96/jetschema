import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Bell, Users, Check, X } from 'lucide-react';

interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  invited_user_id?: string; // Optional as per schema
  accepted_at: string | null;
  created_at: string;
  team: {
    id: string;
    name: string;
    description?: string;
  };
  // Inviter is not directly linked in the schema, we'll need to fetch profiles separately
  inviter?: {
    display_name?: string | null;
    email?: string | null;
  };
}

interface InvitationNotificationsProps {
  showBadge?: boolean;
  className?: string;
}

export const InvitationNotifications: React.FC<InvitationNotificationsProps> = ({ 
  showBadge = true, 
  className = '' 
}) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      loadInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    if (!user) return;

    try {
      // 1) Load invitations + team via FK that exists; skip joining profiles here
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          id,
          team_id,
          email,
          role,
          invited_by,
          token,
          expires_at,
          accepted_at,
          invited_user_id,
          created_at,
          team:teams(id, name, description)
        `)
        .eq('email', user.email)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading invitations:', error);
        setInvitations([]);
        return;
      }

      const baseInvites = data || [];

      // 2) Hydrate inviter profiles in a separate query (no schema FK required)
      const inviterIds = Array.from(new Set(baseInvites.map(i => i.invited_by).filter(Boolean)));
      let profilesById: Record<string, { display_name: string | null; email: string | null }> = {};

      if (inviterIds.length > 0) {
        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('id, user_id, display_name, email')
          .in('user_id', inviterIds);

        if (profErr) {
          console.warn('Unable to load inviter profiles:', profErr);
        } else {
          profilesById = (profs || []).reduce((acc, p: any) => {
            acc[p.user_id] = { display_name: p.display_name ?? null, email: p.email ?? null };
            return acc;
          }, {} as Record<string, { display_name: string | null; email: string | null }>);
        }
      }

      // 3) Merge
      const merged = baseInvites.map((i: any) => ({
        ...i,
        inviter: profilesById[i.invited_by] ?? { display_name: null, email: null },
      }));

      setInvitations(merged);
    } catch (error) {
      console.error('Error loading invitations:', error);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitation: TeamInvitation) => {
    if (!user) return;

    try {
      // Start a transaction-like operation
      // 1. Create team membership
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: user.id,
          role: invitation.role as 'owner' | 'admin' | 'editor' | 'viewer',
          invited_by: invitation.invited_by, // Track who invited the user
          joined_at: new Date().toISOString()
        });

      if (memberError) throw memberError;

      // 2. Mark invitation as accepted
      const { error: inviteError } = await supabase
        .from('team_invitations')
        .update({
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      // 3. Create notification for team owner/admins (optional)
      try {
        const { data: teamAdmins } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', invitation.team_id)
          .in('role', ['owner', 'admin']);
          
        if (teamAdmins?.length) {
          const notifications = teamAdmins.map(admin => ({
            user_id: admin.user_id,
            type: 'team_invite',
            message: `${user.email} has joined your team ${invitation.team.name}`,
            sender_id: user.id,
            is_read: false
          }));
          
          await supabase.from('notifications').insert(notifications);
        }
      } catch (notifError) {
        console.warn('Failed to create notifications, but invitation was accepted', notifError);
        // Non-critical error, don't block the invitation acceptance
      }

      toast.success(`Welcome to ${invitation.team.name}! You are now a team member.`);
      loadInvitations(); // Refresh the list
      setShowDropdown(false);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation. Please try again.');
    }
  };

  const declineInvitation = async (invitation: TeamInvitation) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitation.id);

      if (error) throw error;

      toast.success('Invitation declined.');
      loadInvitations(); // Refresh the list
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation. Please try again.');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`bg-background relative ${className}`}>
        <Bell className="h-5 w-5 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  const hasInvitations = invitations.length > 0;

  return (
    <div className={`bg-background relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-muted-foreground hover:text-muted-foreground/80 transition-colors"
        title={hasInvitations ? `${invitations.length} pending invitation(s)` : 'No pending invitations'}
      >
        <Bell className="h-5 w-5" />
        {showBadge && hasInvitations && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {invitations.length > 9 ? '9+' : invitations.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            role="button"
            tabIndex={0}
            className="fixed inset-0 z-20 dark:bg-purple-400/10 bg-purple-400/10 backdrop-blur-sm cursor-pointer" 
            onClick={() => setShowDropdown(false)}
            onKeyDown={(e) => e.key === 'Escape' && setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-card rounded-lg shadow-lg border border-border z-20">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Invitations
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {hasInvitations 
                  ? `You have ${invitations.length} pending invitation${invitations.length === 1 ? '' : 's'}`
                  : 'No pending invitations'
                }
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {hasInvitations ? (
                invitations.map((invitation) => (
                  <div key={invitation.id} className="p-4 border-b border-border last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-lg">
                          {invitation.team.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Invited by {invitation.inviter?.display_name || invitation.inviter?.email || 'unknown user'}
                        </p>
                      </div>
                    </div>
                    
                    {invitation.team.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {invitation.team.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}>
                        {invitation.role}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        Invited {new Date(invitation.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => acceptInvitation(invitation)}
                        className="flex-1 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => declineInvitation(invitation)}
                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <div className="p-6 text-center text-muted-foreground">
                    <p>No pending invitations</p>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    When someone invites you to their team, you'll see it here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InvitationNotifications;
