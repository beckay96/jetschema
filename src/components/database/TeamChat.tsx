import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useChat } from '@/hooks/useChat';
import { 
  Send, 
  Hash, 
  MessageCircle, 
  Users, 
  AtSign 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  message_text: string;
  author_id: string;
  tagged_fields: Array<{ table_name: string; field_name: string }>;
  created_at: string;
  reply_to_message_id?: string;
  author_display_name?: string;
}

interface TeamChatProps {
  projectId?: string;
  className?: string;
}

export function TeamChat({ projectId, className }: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { taggedFields, removeTaggedField, clearTaggedFields } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages
  useEffect(() => {
    if (projectId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [projectId]);

  const loadMessages = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      const formattedMessages: ChatMessage[] = data?.map(msg => ({
        id: msg.id,
        message_text: msg.message_text,
        author_id: msg.author_id,
        tagged_fields: (msg.tagged_fields && Array.isArray(msg.tagged_fields)) 
          ? msg.tagged_fields as Array<{ table_name: string; field_name: string }>
          : [],
        created_at: msg.created_at,
        reply_to_message_id: msg.reply_to_message_id || undefined,
        author_display_name: 'User' // Will be enhanced later with profiles
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load chat messages');
    }
  };

  const subscribeToMessages = () => {
    if (!projectId) return;

    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          // For now, create a simple message object without profile lookup
          const newMessage: ChatMessage = {
            id: payload.new.id,
            message_text: payload.new.message_text,
            author_id: payload.new.author_id,
            tagged_fields: (payload.new.tagged_fields && Array.isArray(payload.new.tagged_fields)) 
              ? payload.new.tagged_fields as Array<{ table_name: string; field_name: string }>
              : [],
            created_at: payload.new.created_at,
            reply_to_message_id: payload.new.reply_to_message_id || undefined,
            author_display_name: 'User' // Will be enhanced later
          };
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !projectId || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          project_id: projectId,
          author_id: user.id,
          message_text: newMessage.trim(),
          tagged_fields: taggedFields as any // Cast to JSON for database storage
        });

      if (error) throw error;

      setNewMessage('');
      clearTaggedFields();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRemoveTaggedField = (index: number) => {
    removeTaggedField(index);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Please sign in to access team chat</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4" />
          Team Chat
          <Badge variant="secondary" className="ml-auto text-xs">
            <Users className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 pb-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {message.author_display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {message.author_display_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    
                    {/* Tagged Fields */}
                    {message.tagged_fields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {message.tagged_fields.map((field, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs bg-blue-50 border-blue-200 text-blue-700"
                          >
                            <Hash className="h-3 w-3 mr-1" />
                            {field.table_name}.{field.field_name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {message.message_text}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Tagged Fields Preview */}
        {taggedFields.length > 0 && (
          <div className="px-4 py-2 border-t bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <AtSign className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Tagged Fields:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {taggedFields.map((field, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-blue-100 border-blue-300 text-blue-800 cursor-pointer hover:bg-blue-200"
                  onClick={() => handleRemoveTaggedField(index)}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {field.table_name}.{field.field_name}
                  <span className="ml-1 text-blue-600">×</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Remove the old helper function as it's now handled by the context