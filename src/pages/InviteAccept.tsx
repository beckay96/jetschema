import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Mail, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  teams: {
    id: string;
    name: string;
    description: string;
  };
  inviter?: {
    email: string;
    display_name: string;
  } | null;
}

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      // Load invitation with team and inviter details
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          *,
          teams (
            id,
            name,
            description
          )
        `)
        .eq('token', token)
        .single();

      if (!error && data) {
        // Load inviter profile separately to avoid relation issues
        const { data: inviterData } = await supabase
          .from('profiles')
          .select('email, display_name')
          .eq('user_id', data.invited_by)
          .single();
        
        // Add inviter data to the invitation
        (data as any).inviter = inviterData;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Invalid invitation link. This invitation may have been deleted or the link is incorrect.');
        } else {
          console.error('Error loading invitation:', error);
          setError('Failed to load invitation details.');
        }
        return;
      }

      // Check if invitation has expired
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      if (now > expiresAt) {
        setError('This invitation has expired. Please request a new invitation from the team owner.');
        return;
      }

      // Check if invitation has already been accepted
      if (data.accepted_at) {
        setError('This invitation has already been accepted.');
        return;
      }

      setInvitation(data as TeamInvitation);
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('An unexpected error occurred while loading the invitation.');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation || !user) return;

    // Check if user's email matches the invitation email
    if (user.email !== invitation.email) {
      toast.error(`This invitation is for ${invitation.email}. Please sign in with the correct email address.`);
      return;
    }

    try {
      setAccepting(true);

      // Start a transaction-like operation
      // 1. Create team membership
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: user.id,
          role: invitation.role,
          invited_by: invitation.invited_by
        });

      if (memberError) {
        console.error('Error creating team membership:', memberError);
        toast.error('Failed to join team. Please try again.');
        return;
      }

      // 2. Mark invitation as accepted
      const { error: inviteError } = await supabase
        .from('team_invitations')
        .update({
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (inviteError) {
        console.error('Error updating invitation:', inviteError);
        // Don't return here - membership was created successfully
      }

      toast.success(`Successfully joined ${invitation.teams.name}!`);
      
      // Redirect to team management or projects page
      setTimeout(() => {
        navigate('/team-management');
      }, 2000);

    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'editor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return '👑';
      case 'admin': return '🛡️';
      case 'editor': return '✏️';
      case 'viewer': return '👁️';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/projects')} variant="outline">
              Go to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please sign in to accept this team invitation.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team on JetSchema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Team Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <h3 className="font-semibold text-lg">{invitation?.teams.name}</h3>
                {invitation?.teams.description && (
                  <p className="text-sm text-muted-foreground">{invitation.teams.description}</p>
                )}
              </div>
              <Badge variant="outline" className={getRoleColor(invitation?.role || '')}>
                {getRoleIcon(invitation?.role || '')}
                <span className="ml-1 capitalize">{invitation?.role}</span>
              </Badge>
            </div>

            {/* Invitation Details */}
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Invited:</span>
                <span className="font-medium">{invitation?.email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Invited by:</span>
                <span className="font-medium">
                  {invitation?.inviter?.display_name || invitation?.inviter?.email}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-medium">
                  {invitation?.expires_at ? new Date(invitation.expires_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Email Mismatch Warning */}
          {user.email !== invitation?.email && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Email Mismatch</p>
                  <p className="text-yellow-700">
                    This invitation is for <strong>{invitation?.email}</strong> but you're signed in as <strong>{user.email}</strong>.
                    Please sign in with the correct email address to accept this invitation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={acceptInvitation}
              disabled={accepting || user.email !== invitation?.email}
              className="flex-1"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining Team...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/projects')}
              disabled={accepting}
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
