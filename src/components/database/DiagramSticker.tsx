import React, { useState, useRef, useCallback } from 'react';
import { X, Move, RotateCw } from 'lucide-react';
// Don't use useDrag from @xyflow/react as it's not exported
import { useReactFlow, Position } from '@xyflow/react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface StickerData {
  id: string;
  text: string;
  position: { x: number; y: number };
  color?: string;
  type: 'sticker' | 'tag';
  rotation?: number;
  size?: 'small' | 'medium' | 'large';
}

interface DiagramStickerProps {
  data: StickerData;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<StickerData>) => void;
}

const stickerEmojis: Record<string, string> = {
  'star': '⭐',
  'fire': '🔥',
  'warning': '⚠️',
  'idea': '💡',
  'note': '📝',
  'important': '❗',
  'question': '❓',
  'ok': '✅',
  'heart': '❤️',
  'smile': '😊',
  'rocket': '🚀',
  'eyes': '👀',
  'thumbsup': '👍',
  'bug': '🐛',
  'code': '💻',
  'database': '🗄️',
};

export const DiagramSticker = ({ data, onDelete, onUpdate }: DiagramStickerProps) => {
  const [hover, setHover] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<{x: number, y: number}>({x: 0, y: 0});
  
  // Use react-flow utilities
  const reactFlowInstance = useReactFlow();
  
  // Enhanced drag implementation with improved handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only handle drag with primary mouse button (left click)
    if (e.button !== 0) return;
    
    // Don't propagate to prevent canvas drag
    e.stopPropagation();
    e.preventDefault();
    
    // Start drag operation
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    
    // Create a drag overlay div if it doesn't exist
    let overlay = document.getElementById('sticker-drag-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sticker-drag-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.zIndex = '9999';
      overlay.style.cursor = 'grabbing';
      document.body.appendChild(overlay);
    }
    
    // Handle mouse movement
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDragging) {
        const dx = moveEvent.clientX - startPosRef.current.x;
        const dy = moveEvent.clientY - startPosRef.current.y;
        
        // Apply movement threshold to prevent accidental tiny movements
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
        
        const newPos = {
          x: data.position.x + dx,
          y: data.position.y + dy
        };
        
        onUpdate(data.id, { position: newPos });
        startPosRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };
        
        // Visual feedback for dragging
        if (nodeRef.current) {
          nodeRef.current.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
        }
      }
    };
    
    // Handle mouse up - end drag operation
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Remove overlay
      const overlay = document.getElementById('sticker-drag-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
      
      // Reset visual feedback
      if (nodeRef.current) {
        nodeRef.current.style.boxShadow = '';
      }
      
      // Add a toast notification for user feedback
      toast.success(`${data.type === 'tag' ? 'Tag' : 'Sticker'} moved`, {
        duration: 1500,
        position: 'bottom-right',
      });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [data.id, data.position, data.type, onUpdate, isDragging]);
  
  // Add a drag handle component for better user experience
  const DragHandle = () => (
    <div 
      ref={dragRef}
      className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
    />
  );

  // Toggle between tag and sticker types
  const handleTypeToggle = () => {
    onUpdate(data.id, { 
      type: data.type === 'sticker' ? 'tag' : 'sticker' 
    });
  };

  // Randomly rotate the sticker slightly for a more natural look
  const rotate = () => {
    const newRotation = Math.floor(Math.random() * 30) - 15;
    onUpdate(data.id, { rotation: newRotation });
  };

  // Extract emoji from text or use default
  const getEmoji = () => {
    // Check if text starts with an emoji keyword
    const textLower = data.text.toLowerCase();
    for (const [key, emoji] of Object.entries(stickerEmojis)) {
      if (textLower.startsWith(key)) {
        return emoji;
      }
    }
    
    // Default emoji based on type
    return data.type === 'tag' ? '#️⃣' : '📌';
  };

  // Get display text (remove emoji keyword if present)
  const getDisplayText = () => {
    const textLower = data.text.toLowerCase();
    for (const key of Object.keys(stickerEmojis)) {
      if (textLower.startsWith(key)) {
        return data.text.substring(key.length).trim();
      }
    }
    return data.text;
  };

  // Random pastel background color if no color specified
  const getStickerColor = () => {
    if (data.color) return data.color;
    
    const colors = [
      'bg-yellow-100 border-yellow-300',
      'bg-blue-100 border-blue-300',
      'bg-green-100 border-green-300',
      'bg-pink-100 border-pink-300',
      'bg-purple-100 border-purple-300',
      'bg-orange-100 border-orange-300'
    ];
    
    // Use id to ensure consistent color for the same sticker
    const colorIndex = parseInt(data.id.slice(-3), 16) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div
      ref={nodeRef}
      style={{
        position: 'absolute',
        left: data.position.x,
        top: data.position.y,
        transform: `rotate(${data.rotation || 0}deg)`,
        zIndex: isDragging ? 1000 : 100,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'transform 0.3s ease, box-shadow 0.2s ease',
      }}
      className="sticker-container nodrag"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDoubleClick={rotate}
    >
      {/* Invisible drag handle layer that doesn't interfere with buttons */}
      <DragHandle />
      {data.type === 'sticker' ? (
        <Card 
          className={cn(
            "p-3 shadow-md transition-all",
            getStickerColor(),
            hover && "shadow-lg scale-105",
            data.size === 'small' && "w-20 h-20",
            data.size === 'medium' && "w-28 h-28",
            data.size === 'large' && "w-36 h-36",
            !data.size && "w-28 h-28"
          )}
        >
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-2xl mb-1">{getEmoji()}</div>
            <div className="text-xs font-medium">{getDisplayText()}</div>
          </div>
          
          {hover && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-white shadow-sm hover:bg-red-100"
                onClick={() => onDelete(data.id)}
              >
                <X className="h-3 w-3" />
              </Button>
              
              <div 
                ref={dragRef}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 cursor-grab active:cursor-grabbing"
              >
                <Move className="h-4 w-4" />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="absolute -bottom-2 -right-2 h-5 w-5 p-0 rounded-full bg-white shadow-sm hover:bg-blue-100"
                onClick={handleTypeToggle}
                title="Convert to tag"
              >
                #
              </Button>
            </>
          )}
        </Card>
      ) : (
        <div 
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium shadow-md transition-all",
            "bg-blue-100 text-blue-800 border border-blue-300",
            hover && "shadow-lg"
          )}
        >
          <div className="flex items-center gap-1">
            <span>{getEmoji()}</span>
            <span>#{getDisplayText()}</span>
          </div>
          
          {hover && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-white shadow-sm hover:bg-red-100"
                onClick={() => onDelete(data.id)}
              >
                <X className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="absolute -bottom-2 -right-2 h-5 w-5 p-0 rounded-full bg-white shadow-sm hover:bg-blue-100"
                onClick={handleTypeToggle}
                title="Convert to sticker"
              >
                📌
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
