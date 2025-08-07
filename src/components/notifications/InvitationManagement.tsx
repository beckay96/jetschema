import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Users, Check, X, Mail, ChevronDown, ChevronUp } from 'lucide-react';

interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_by: string;
  invited_user_id?: string; // Optional for backward compatibility
  created_at: string;
  team: {
    id: string;
    name: string;
    description?: string;
  };
  inviter: {
    display_name?: string;
    email: string;
  };
}

interface InvitationManagementProps {
  className?: string;
}

export const InvitationManagement: React.FC<InvitationManagementProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      loadInvitations();
    }
  }, [user]);

  useEffect(() => {
    if (invitations.length > 0) {
      setIsExpanded(true);
    }
  }, [invitations.length]);

  const loadInvitations = async () => {
    if (!user) return;

    try {
      // First try with invited_user_id (new column), fallback to email-based lookup
      let { data, error } = await supabase
        .from('team_invitations')
        .select(`
          id,
          team_id,
          email,
          role,
          invited_by,
          created_at,
          team:teams(id, name, description),
          inviter:profiles!team_invitations_invited_by_fkey(display_name, email)
        `)
        .eq('email', user.email)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading invitations:', error);
        // If there's an error, set empty array to prevent crashes
        setInvitations([]);
        return;
      }

      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast.error('Failed to load invitations');
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

      toast.success(`Welcome to ${invitation.team.name}! You are now a team member.`);
      loadInvitations(); // Refresh the list
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
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'editor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Team Invitations</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const hasInvitations = invitations.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Team Invitations</h3>
          {hasInvitations && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {invitations.length} pending
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="bg-white rounded-lg border border-gray-200">
          {hasInvitations ? (
            <div className="divide-y divide-gray-200">
              {invitations.map((invitation, index) => (
                <div key={invitation.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {invitation.team.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Invited by {invitation.inviter.display_name || invitation.inviter.email}
                          </p>
                        </div>
                      </div>
                      
                      {invitation.team.description && (
                        <p className="text-gray-700 mb-3 leading-relaxed">
                          {invitation.team.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(invitation.role)}`}>
                          {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Invited {new Date(invitation.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => acceptInvitation(invitation)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => declineInvitation(invitation)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>No pending invitations</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvitationManagement;
