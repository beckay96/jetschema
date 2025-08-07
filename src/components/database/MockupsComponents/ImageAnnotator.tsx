import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Pencil, 
  Circle, 
  Square, 
  Type, 
  Trash2, 
  Save, 
  Undo, 
  MousePointer 
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface Annotation {
  id: string;
  type: 'drawing' | 'circle' | 'rectangle' | 'text';
  points?: { x: number; y: number }[];
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
}

interface ImageAnnotatorProps {
  imageUrl: string;
  initialAnnotations?: Annotation[];
  onSave: (annotations: Annotation[]) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

const COLORS = [
  '#FF3B30', // Red
  '#FF9500', // Orange
  '#FFCC00', // Yellow
  '#34C759', // Green
  '#007AFF', // Blue
  '#5856D6', // Purple
  '#FF2D55', // Pink
];

export const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({
  imageUrl,
  initialAnnotations = [],
  onSave,
  onCancel,
  readOnly = false
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'select' | 'draw' | 'circle' | 'rectangle' | 'text'>('select');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [textInput, setTextInput] = useState('');
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Initialize canvas and load image
  useEffect(() => {
    const image = new Image();
    image.src = imageUrl;
    image.onload = () => {
      if (imageRef.current) {
        imageRef.current.width = image.width;
        imageRef.current.height = image.height;
        setImageSize({ width: image.width, height: image.height });
        
        // Calculate scale to fit in container
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const containerHeight = containerRef.current.clientHeight;
          const scaleX = containerWidth / image.width;
          const scaleY = containerHeight / image.height;
          const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
          setScale(newScale);
        }
      }
    };
  }, [imageUrl]);

  // Draw annotations on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all annotations
    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      
      const isSelected = annotation.id === selectedAnnotation;
      if (isSelected) {
        ctx.setLineDash([5, 3]);
      } else {
        ctx.setLineDash([]);
      }

      switch (annotation.type) {
        case 'drawing':
          if (annotation.points && annotation.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            annotation.points.slice(1).forEach(point => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;
        case 'circle':
          if (annotation.x !== undefined && annotation.y !== undefined && annotation.width !== undefined) {
            const radius = annotation.width / 2;
            ctx.beginPath();
            ctx.arc(annotation.x + radius, annotation.y + radius, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        case 'rectangle':
          if (annotation.x !== undefined && annotation.y !== undefined && 
              annotation.width !== undefined && annotation.height !== undefined) {
            ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
          }
          break;
        case 'text':
          if (annotation.x !== undefined && annotation.y !== undefined && annotation.text) {
            ctx.font = `${annotation.strokeWidth * 5}px sans-serif`;
            ctx.fillText(annotation.text, annotation.x, annotation.y);
          }
          break;
      }
    });

    // Draw current annotation if drawing
    if (currentAnnotation && isDrawing) {
      ctx.strokeStyle = currentAnnotation.color;
      ctx.fillStyle = currentAnnotation.color;
      ctx.lineWidth = currentAnnotation.strokeWidth;
      ctx.setLineDash([]);

      switch (currentAnnotation.type) {
        case 'drawing':
          if (currentAnnotation.points && currentAnnotation.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(currentAnnotation.points[0].x, currentAnnotation.points[0].y);
            currentAnnotation.points.slice(1).forEach(point => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;
        case 'circle':
          if (currentAnnotation.x !== undefined && currentAnnotation.y !== undefined && 
              currentAnnotation.width !== undefined) {
            const radius = currentAnnotation.width / 2;
            ctx.beginPath();
            ctx.arc(
              currentAnnotation.x + radius, 
              currentAnnotation.y + radius, 
              radius, 
              0, 
              Math.PI * 2
            );
            ctx.stroke();
          }
          break;
        case 'rectangle':
          if (currentAnnotation.x !== undefined && currentAnnotation.y !== undefined && 
              currentAnnotation.width !== undefined && currentAnnotation.height !== undefined) {
            ctx.strokeRect(
              currentAnnotation.x, 
              currentAnnotation.y, 
              currentAnnotation.width, 
              currentAnnotation.height
            );
          }
          break;
      }
    }
  }, [annotations, currentAnnotation, isDrawing, selectedAnnotation]);

  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    
    const pos = getMousePosition(e);

    if (selectedTool === 'select') {
      // Check if clicked on an annotation
      const clicked = annotations.findIndex(anno => {
        if (anno.type === 'drawing' && anno.points) {
          // Check if clicked near any point in the drawing
          return anno.points.some(point => {
            const distance = Math.sqrt(
              Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2)
            );
            return distance < 10; // 10px tolerance
          });
        } else if ((anno.type === 'circle' || anno.type === 'rectangle' || anno.type === 'text') && 
                   anno.x !== undefined && anno.y !== undefined) {
          // Check if clicked inside bounding box
          const width = anno.width || 0;
          const height = anno.height || (anno.type === 'circle' ? anno.width || 0 : 0);
          
          return (
            pos.x >= anno.x && 
            pos.x <= anno.x + width && 
            pos.y >= anno.y && 
            pos.y <= anno.y + (anno.type === 'text' ? 30 : height)
          );
        }
        return false;
      });

      if (clicked !== -1) {
        setSelectedAnnotation(annotations[clicked].id);
      } else {
        setSelectedAnnotation(null);
      }
      return;
    }

    setIsDrawing(true);

    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      type: selectedTool === 'draw' ? 'drawing' : 
            selectedTool === 'circle' ? 'circle' : 
            selectedTool === 'rectangle' ? 'rectangle' : 'text',
      color: selectedColor,
      strokeWidth,
    };

    switch (selectedTool) {
      case 'draw':
        newAnnotation.points = [pos];
        break;
      case 'circle':
      case 'rectangle':
        newAnnotation.x = pos.x;
        newAnnotation.y = pos.y;
        newAnnotation.width = 0;
        newAnnotation.height = 0;
        break;
      case 'text':
        newAnnotation.x = pos.x;
        newAnnotation.y = pos.y;
        newAnnotation.text = textInput || 'Double click to edit';
        setIsDrawing(false);
        setAnnotations([...annotations, newAnnotation]);
        return;
    }

    setCurrentAnnotation(newAnnotation);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation || readOnly) return;

    const pos = getMousePosition(e);

    switch (currentAnnotation.type) {
      case 'drawing':
        setCurrentAnnotation({
          ...currentAnnotation,
          points: [...(currentAnnotation.points || []), pos]
        });
        break;
      case 'circle':
      case 'rectangle':
        if (currentAnnotation.x !== undefined && currentAnnotation.y !== undefined) {
          const width = pos.x - currentAnnotation.x;
          const height = pos.y - currentAnnotation.y;
          setCurrentAnnotation({
            ...currentAnnotation,
            width: Math.abs(width),
            height: Math.abs(height),
            x: width < 0 ? pos.x : currentAnnotation.x,
            y: height < 0 ? pos.y : currentAnnotation.y
          });
        }
        break;
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation || readOnly) return;

    setAnnotations([...annotations, currentAnnotation]);
    setCurrentAnnotation(null);
    setIsDrawing(false);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    
    const pos = getMousePosition(e);
    
    // Check if double-clicked on a text annotation
    const textAnnotationIndex = annotations.findIndex(anno => 
      anno.type === 'text' && 
      anno.x !== undefined && 
      anno.y !== undefined && 
      pos.x >= anno.x && 
      pos.x <= anno.x + 200 && // Approximate width
      pos.y >= anno.y - 30 && // Account for text height
      pos.y <= anno.y
    );

    if (textAnnotationIndex !== -1) {
      const newText = prompt('Edit text:', annotations[textAnnotationIndex].text);
      if (newText !== null) {
        const updatedAnnotations = [...annotations];
        updatedAnnotations[textAnnotationIndex] = {
          ...updatedAnnotations[textAnnotationIndex],
          text: newText
        };
        setAnnotations(updatedAnnotations);
      }
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedAnnotation || readOnly) return;
    setAnnotations(annotations.filter(anno => anno.id !== selectedAnnotation));
    setSelectedAnnotation(null);
  };

  const handleUndo = () => {
    if (annotations.length === 0 || readOnly) return;
    setAnnotations(annotations.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={selectedTool === 'select' ? 'default' : 'outline'} 
                  size="icon" 
                  onClick={() => setSelectedTool('select')}
                  disabled={readOnly}
                >
                  <MousePointer size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Select</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={selectedTool === 'draw' ? 'default' : 'outline'} 
                  size="icon" 
                  onClick={() => setSelectedTool('draw')}
                  disabled={readOnly}
                >
                  <Pencil size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Draw</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={selectedTool === 'circle' ? 'default' : 'outline'} 
                  size="icon" 
                  onClick={() => setSelectedTool('circle')}
                  disabled={readOnly}
                >
                  <Circle size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Circle</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={selectedTool === 'rectangle' ? 'default' : 'outline'} 
                  size="icon" 
                  onClick={() => setSelectedTool('rectangle')}
                  disabled={readOnly}
                >
                  <Square size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rectangle</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={selectedTool === 'text' ? 'default' : 'outline'} 
                  size="icon" 
                  onClick={() => setSelectedTool('text')}
                  disabled={readOnly}
                >
                  <Type size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Text</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {selectedTool === 'text' && !readOnly && (
          <div className="flex-1 mx-4">
            <Input 
              value={textInput} 
              onChange={(e) => setTextInput(e.target.value)} 
              placeholder="Enter text to add..."
              className="h-8"
            />
          </div>
        )}

        {!readOnly && (
          <div className="flex space-x-2">
            <div className="flex space-x-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "w-6 h-6 rounded-full border",
                    selectedColor === color ? "ring-2 ring-offset-2 ring-black" : ""
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
            
            <select
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="h-8 px-2 rounded border"
            >
              <option value="1">Thin</option>
              <option value="3">Medium</option>
              <option value="5">Thick</option>
            </select>
          </div>
        )}
      </div>

      <div className="relative flex-1 overflow-auto" ref={containerRef}>
        <img 
          ref={imageRef}
          src={imageUrl} 
          alt="Annotation target" 
          className="absolute top-0 left-0 pointer-events-none"
          style={{ 
            width: imageSize.width * scale, 
            height: imageSize.height * scale 
          }}
        />
        <canvas
          ref={canvasRef}
          width={imageSize.width}
          height={imageSize.height}
          className="absolute top-0 left-0"
          style={{ 
            width: imageSize.width * scale, 
            height: imageSize.height * scale 
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />
      </div>

      <div className="flex justify-between p-2 border-t">
        {!readOnly && (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUndo}
              disabled={annotations.length === 0}
            >
              <Undo size={16} className="mr-1" /> Undo
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDeleteSelected}
              disabled={!selectedAnnotation}
            >
              <Trash2 size={16} className="mr-1" /> Delete
            </Button>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          {!readOnly && (
            <Button variant="default" size="sm" onClick={() => onSave(annotations)}>
              <Save size={16} className="mr-1" /> Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
