import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChatIconProps {
  projectId?: string;
  onClick: () => void;
  className?: string;
}

export function ChatIcon({ projectId, onClick, className }: ChatIconProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [shouldBounce, setShouldBounce] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId || !user) return;

    // Load initial unread count
    loadUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          // Don't count our own messages
          if (payload.new.author_id !== user.id) {
            setUnreadCount(prev => prev + 1);
            setShouldBounce(true);
            // Stop bouncing after 3 seconds
            setTimeout(() => setShouldBounce(false), 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, user]);

  const loadUnreadCount = async () => {
    if (!projectId || !user) return;

    try {
      // For now, count all messages not authored by current user
      // We'll enhance this when the read status is properly implemented
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('project_id', projectId)
        .neq('author_id', user.id);

      if (error) throw error;
      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleClick = async () => {
    onClick();
    
    // Reset unread count when opening chat
    setUnreadCount(0);
    setShouldBounce(false);
  };

  if (!user) return null;

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="default"
        size="icon"
        onClick={handleClick}
        className={cn(
          "rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
          shouldBounce && "animate-bounce"
        )}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
      
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className={cn(
            "absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center text-xs rounded-full",
            shouldBounce && "animate-pulse"
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </div>
  );
}