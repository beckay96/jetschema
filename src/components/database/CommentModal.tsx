import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageCircle, Send, Hash, AtSign, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TeamMember {
  id: string;
  display_name: string;
  email: string;
}

interface CommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  fieldName: string;
  onSubmit: (comment: string, tagInChat: boolean, mentions: string[]) => void;
  onTagField?: (tableName: string, fieldName: string) => void;
  teamMembers?: TeamMember[];
}

export function CommentModal({ 
  open, 
  onOpenChange, 
  tableName, 
  fieldName, 
  onSubmit,
  onTagField,
  teamMembers = []
}: CommentModalProps) {
  const [comment, setComment] = useState('');
  const [tagInChat, setTagInChat] = useState(true);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment.trim(), tagInChat, mentions);
      
      // If tagging in chat, call the tag function
      if (tagInChat && onTagField) {
        onTagField(tableName, fieldName);
      }
      
      setComment('');
      setMentions([]);
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    
    setComment(value);
    setCursorPosition(position);
    
    // Check for @ mention trigger
    const textBeforeCursor = value.slice(0, position);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      setMentionSearch(atMatch[1]);
      setShowMentionPicker(true);
    } else {
      setShowMentionPicker(false);
    }
  };

  const insertMention = (member: TeamMember) => {
    const textBeforeCursor = comment.slice(0, cursorPosition);
    const textAfterCursor = comment.slice(cursorPosition);
    
    // Find the @ symbol and replace with mention
    const beforeAt = textBeforeCursor.replace(/@\w*$/, '');
    const newComment = `${beforeAt}@${member.display_name} ${textAfterCursor}`;
    
    setComment(newComment);
    setMentions(prev => [...prev, member.id]);
    setShowMentionPicker(false);
    setMentionSearch('');
  };

  const filteredMembers = teamMembers.filter(member =>
    member.display_name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    member.email.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Add Comment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{tableName}</span>
            {fieldName && (
              <>
                <span className="text-muted-foreground">.</span>
                <span className="text-sm font-medium text-primary">{fieldName}</span>
              </>
            )}
            <Badge variant="outline" className="ml-auto text-xs">
              {fieldName ? 'Field' : 'Table'}
            </Badge>
          </div>

          <div className="space-y-2 relative">
            <label htmlFor="comment" className="text-sm font-medium">
              Comment
            </label>
            <div className="relative">
              <Textarea
                id="comment"
                placeholder="Add your comment... Use @ to mention team members"
                value={comment}
                onChange={handleCommentChange}
                onKeyDown={handleKeyDown}
                className="min-h-[100px] resize-none pr-10"
                autoFocus
              />
              
              {/* @ Mention Button */}
              <Popover open={showMentionPicker} onOpenChange={setShowMentionPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowMentionPicker(!showMentionPicker)}
                  >
                    <AtSign className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-64" align="end">
                  <Command>
                    <CommandInput placeholder="Search team members..." />
                    <CommandList>
                      <CommandEmpty>No team members found.</CommandEmpty>
                      <CommandGroup heading="Team Members">
                        {filteredMembers.map((member) => (
                          <CommandItem
                            key={member.id}
                            onSelect={() => insertMention(member)}
                            className="cursor-pointer"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            <div className="flex flex-col">
                              <span className="font-medium">{member.display_name}</span>
                              <span className="text-xs text-muted-foreground">{member.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            {mentions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Mentioning:</span>
                {mentions.map((mentionId, index) => {
                  const member = teamMembers.find(m => m.id === mentionId);
                  return member ? (
                    <Badge key={index} variant="secondary" className="text-xs">
                      @{member.display_name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Tip: Use @ to mention team members, or Ctrl+Enter to submit quickly
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <input
              type="checkbox"
              id="tagInChat"
              checked={tagInChat}
              onChange={(e) => setTagInChat(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="tagInChat" className="text-sm text-primary flex-1">
              <span className="font-medium">Tag this field in team chat</span>
              <div className="text-xs text-primary/80 mt-1">
                This will create a chat message with this field tagged so your team can discuss it
              </div>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!comment.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}