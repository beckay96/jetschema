import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bug, Send, Lightbulb, HelpCircle, FileText, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface StreamlinedBugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedFeature?: string;
  preselectedType?: 'bug' | 'feature' | 'question';
}

// Simplified feature list - automatically detect current page
const FEATURES = [
  'Project Editor',
  'Database Canvas/Diagram',
  'Table Editor',
  'Field Management',
  'Relationships',
  'SQL Parser',
  'Export/Import',
  'Comments System',
  'Team Collaboration',
  'Settings',
  'Authentication',
  'Other'
];

export function StreamlinedBugReportModal({
  open,
  onOpenChange,
  preselectedFeature,
  preselectedType = 'bug'
}: StreamlinedBugReportModalProps) {
  const { user } = useAuth();
  
  // Form state
  const [type, setType] = useState<'bug' | 'feature' | 'question'>(preselectedType || 'bug');
  const [feature, setFeature] = useState(preselectedFeature || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  
  // Auto-capture settings
  const [captureLogs, setCaptureLogs] = useState(true);
  const [browserLogs, setBrowserLogs] = useState<any[]>([]);
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Using dummy variable to avoid lint warning
  const [uploadingImage, setUploadingImage] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = uploadingImage; // Suppress unused variable warning

  // Auto-detect current page/feature
  useEffect(() => {
    if (open && !preselectedFeature) {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/project/')) {
        setFeature('Project Editor');
      } else if (currentPath.includes('/settings')) {
        setFeature('Settings');
      } else if (currentPath.includes('/roadmap')) {
        setFeature('Feature Roadmap');
      } else if (currentPath.includes('/projects')) {
        setFeature('Project Management');
      } else {
        setFeature('Other');
      }
    }
  }, [open, preselectedFeature]);

  // Capture browser info and console logs on open
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setImageFile(file);
  };
  
  // Remove uploaded image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };
  
  useEffect(() => {
    if (open) {
      const info = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        timestamp: new Date().toISOString(),
        localStorage: {
          keys: Object.keys(localStorage),
          count: localStorage.length
        },
        sessionStorage: {
          keys: Object.keys(sessionStorage),
          count: sessionStorage.length
        }
      };
      setBrowserInfo(info);

      // Capture recent console logs if enabled
      if (captureLogs) {
        const logs: any[] = [];
        
        // Capture current console state
        const originalConsole = {
          log: console.log,
          warn: console.warn,
          error: console.error,
          info: console.info
        };

        // Override console methods to capture new logs
        const captureLog = (level: string, args: any[]) => {
          logs.push({
            level,
            message: args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '),
            timestamp: new Date().toISOString()
          });
          
          // Keep only last 50 logs to avoid memory issues
          if (logs.length > 50) {
            logs.shift();
          }
        };

        console.log = (...args) => {
          originalConsole.log(...args);
          captureLog('log', args);
        };
        console.warn = (...args) => {
          originalConsole.warn(...args);
          captureLog('warn', args);
        };
        console.error = (...args) => {
          originalConsole.error(...args);
          captureLog('error', args);
        };
        console.info = (...args) => {
          originalConsole.info(...args);
          captureLog('info', args);
        };

        setBrowserLogs(logs);

        // Cleanup function to restore original console
        return () => {
          console.log = originalConsole.log;
          console.warn = originalConsole.warn;
          console.error = originalConsole.error;
          console.info = originalConsole.info;
        };
      }
    }
  }, [open, captureLogs]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to submit feedback');
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in the title and description');
      return;
    }

    if (!feature) {
      toast.error('Please select which feature this relates to');
      return;
    }

    setLoading(true);

    try {
      let screenshotUrl = null;

      // Upload image if one is selected (only for bug reports)
      if (imageFile && type === 'bug') {
        setUploadingImage(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `bug-reports/${fileName}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from('feedback-images')
            .upload(filePath, imageFile);

          if (uploadError) {
            console.error('Image upload failed:', uploadError);
            // Don't show error toast, just continue without image
            console.log('Continuing submission without image due to storage issue');
          } else {
            // Get public URL for the uploaded image
            const { data: urlData } = supabase.storage
              .from('feedback-images')
              .getPublicUrl(filePath);
            
            screenshotUrl = urlData.publicUrl;
          }
        } catch (storageError) {
          console.error('Storage operation failed:', storageError);
          // Continue without image if storage is not configured
        }
        setUploadingImage(false);
      }

      // Ensure user profile exists before submitting feedback
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileCheckError && profileCheckError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating user profile for feedback submission');
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email || '',
            display_name: user.email?.split('@')[0] || 'User'
          });
        
        if (profileCreateError) {
          console.error('Failed to create user profile:', profileCreateError);
          throw new Error('Unable to create user profile. Please contact support.');
        }
      } else if (profileCheckError) {
        console.error('Profile check failed:', profileCheckError);
        throw profileCheckError;
      }

      // Prepare the feedback data
      const feedbackData = {
        type,
        feature,
        title: title.trim(),
        description: description.trim(),
        priority,
        author_id: user.id,
        screenshot_url: screenshotUrl,
        browser_logs: captureLogs ? browserLogs : null,
        browser_info: browserInfo,
        url: window.location.href,
        user_agent: navigator.userAgent
      };

      const { error } = await supabase
        .from('user_feedback')
        .insert([feedbackData]);

      if (error) {
        throw error;
      }

      toast.success('Feedback submitted successfully! Thank you for helping improve JetSchema.');
      
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setImageFile(null);
      setImagePreview(null);
      setBrowserLogs([]);
      setBrowserInfo(null);
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (reportType: string) => {
    switch (reportType) {
      case 'bug': return <Bug className="h-4 w-4" />;
      case 'feature': return <Lightbulb className="h-4 w-4" />;
      case 'question': return <HelpCircle className="h-4 w-4" />;
      default: return <Bug className="h-4 w-4" />;
    }
  };

  const getTitleLabel = () => {
    if (type === 'bug') return 'What went wrong?';
    if (type === 'feature') return 'What would you like to see?';
    return 'What do you need help with?';
  };

  const getTitlePlaceholder = () => {
    if (type === 'bug') return 'Brief description of the issue';
    if (type === 'feature') return 'Brief description of the feature';
    return 'Brief description of your question';
  };

  const getDescriptionPlaceholder = () => {
    if (type === 'bug') return 'Please describe the bug in detail. What happened? What did you expect to happen?';
    if (type === 'feature') return 'Please describe your feature request in detail. How would this improve your workflow?';
    return 'Please provide more details about your question.';
  };

  const getSubmitButtonText = () => {
    if (type === 'bug') return 'Bug Report';
    if (type === 'feature') return 'Feature Request';
    return 'Question';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(type)}
            {type === 'bug' ? 'Report a Bug' : null}
            {type === 'feature' ? 'Request a Feature' : null}
            {type === 'question' ? 'Ask a Question' : null}
          </DialogTitle>
          <DialogDescription>
            Help us improve JetSchema by sharing your feedback. We'll automatically capture some technical details to help us debug faster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Type Selection */}
          <div className="flex gap-2">
            {(['bug', 'feature', 'question'] as const).map((reportType) => (
              <Button
                key={reportType}
                variant={type === reportType ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType(reportType)}
                className="flex items-center gap-2"
              >
                {getTypeIcon(reportType)}
                {reportType === 'bug' && 'Bug Report'}
                {reportType === 'feature' && 'Feature Request'}
                {reportType === 'question' && 'Question'}
              </Button>
            ))}
          </div>

          {/* Feature Selection */}
          <div className="space-y-2">
            <Label htmlFor="feature">Which feature does this relate to?</Label>
            <Select value={feature} onValueChange={setFeature}>
              <SelectTrigger>
                <SelectValue placeholder="Select the feature you're having issues with" />
              </SelectTrigger>
              <SelectContent>
                {FEATURES.map((feat) => (
                  <SelectItem key={feat} value={feat}>
                    {feat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{getTitleLabel()}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={getTitlePlaceholder()}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder={getDescriptionPlaceholder()}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
          
          {/* This section was duplicated and has been removed */}

          {/* Image Upload (only for bug reports) */}
          {type === 'bug' ? (
            <div className="space-y-2">
              <Label htmlFor="image-upload">Attach Image (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="flex-1"
                />
              </div>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative mt-2 border rounded-md overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-48 max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Priority (only for bug reports) */}
          {type === 'bug' ? (
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Auto-capture options - only for bug reports */}
          {type === 'bug' && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Help us debug faster</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="capture-logs"
                    checked={captureLogs}
                    onCheckedChange={(checked) => setCaptureLogs(checked as boolean)}
                  />
                  <Label htmlFor="capture-logs" className="text-sm flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Include browser console logs and technical details
                  </Label>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                This information helps us understand the context and debug issues faster. No personal data is collected.
              </p>
            </div>
          )}

          {/* Auto-detected info */}
          {browserInfo && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Current page:</strong> {browserInfo.url}</div>
              <div><strong>Browser:</strong> {browserInfo.userAgent.split(' ')[0]}</div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !title.trim() || !description.trim() || !feature}
          >
            {loading ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit {getSubmitButtonText()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
