import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removed unused import
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
import { Badge } from '@/components/ui/badge';
import { Bug, Send, X, Lightbulb, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedFeature?: string;
  preselectedType?: 'bug' | 'feature' | 'question';
}

// Common features that users might report issues with
const FEATURES = [
  'Project Editor',
  'Database Canvas/Diagram',
  'Table Editor',
  'SQL Parser',
  'Comments System',
  'Team Collaboration',
  'RLS Policies',
  'Functions & Triggers',
  'Project Dashboard',
  'Settings',
  'Authentication',
  'Deployment',
  'Other'
];

const REPORT_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-blue-500' },
  { value: 'question', label: 'Question/Help', icon: HelpCircle, color: 'text-green-500' }
];

export function BugReportModal({
  open,
  onOpenChange,
  preselectedFeature,
  preselectedType = 'bug'
}: BugReportModalProps) {

  const { user } = useAuth();
  const [reportType, setReportType] = useState<'bug' | 'feature' | 'question'>(preselectedType);
  const [feature, setFeature] = useState(preselectedFeature || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed unused state variables

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !feature) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const reportData = {
        type: reportType,
        feature,
        title: title.trim(),
        description: description.trim(),
        steps_to_reproduce: steps.trim() || null,
        expected_behavior: expectedBehavior.trim() || null,
        priority,
        status: 'open',
        author_id: user?.id,
        author_email: user?.email,
        created_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href
      };

      // Insert into feedback table (we'll create this table)
      const { error } = await supabase
        .from('user_feedback')
        .insert([reportData]);

      if (error) throw error;

      toast.success(`${reportType === 'bug' ? 'Bug report' : reportType === 'feature' ? 'Feature request' : 'Question'} submitted successfully!`);
      
      // Reset form
      setTitle('');
      setDescription('');
      setSteps('');
      setExpectedBehavior('');
      setFeature(preselectedFeature || '');
      setPriority('medium');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeConfig = REPORT_TYPES.find(t => t.value === reportType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] m-4 p-4 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {selectedTypeConfig && (
              <selectedTypeConfig.icon className={`h-5 w-5 ${selectedTypeConfig.color}`} />
            )}
            <span>Submit Feedback</span>
          </DialogTitle>
          <DialogDescription>
            Help us improve JetSchema by reporting bugs, requesting features, or asking questions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Type */}
          <div className="space-y-2">
            <Label>Type of Report</Label>
            <div className="flex space-x-2">
              {REPORT_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={reportType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReportType(type.value as any)}
                  className="flex items-center space-x-2"
                >
                  <type.icon className={`h-4 w-4 ${reportType === type.value ? 'text-white' : type.color}`} />
                  <span>{type.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Feature/Area */}
          <div className="space-y-2">
            <Label htmlFor="feature">Feature/Area *</Label>
            <Select value={feature} onValueChange={setFeature}>
              <SelectTrigger>
                <SelectValue placeholder="Select the feature this relates to" />
              </SelectTrigger>
              <SelectContent>
                {FEATURES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {reportType === 'bug' ? 'Bug Summary' : reportType === 'feature' ? 'Feature Title' : 'Question'} *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                reportType === 'bug' 
                  ? "Brief description of the bug"
                  : reportType === 'feature'
                  ? "What feature would you like to see?"
                  : "What would you like to know?"
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {reportType === 'bug' ? 'Bug Description' : 'Description'} *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                reportType === 'bug'
                  ? "Describe what happened and what you expected to happen"
                  : reportType === 'feature'
                  ? "Describe the feature you'd like to see and how it would help you"
                  : "Provide more details about your question"
              }
              className="min-h-[100px]"
            />
          </div>

          {/* Steps to Reproduce (for bugs) */}
          {reportType === 'bug' && (
            <div className="space-y-2">
              <Label htmlFor="steps">Steps to Reproduce</Label>
              <Textarea
                id="steps"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                className="min-h-[80px]"
              />
            </div>
          )}

          {/* Expected Behavior (for bugs) */}
          {reportType === 'bug' && (
            <div className="space-y-2">
              <Label htmlFor="expected">Expected Behavior</Label>
              <Textarea
                id="expected"
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                placeholder="What should have happened instead?"
                className="min-h-[60px]"
              />
            </div>
          )}

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex space-x-2">
              {[
                { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
                { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
                { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
              ].map((p) => (
                <Badge
                  key={p.value}
                  variant={priority === p.value ? "default" : "outline"}
                  className={`cursor-pointer ${priority === p.value ? '' : p.color}`}
                  onClick={() => setPriority(p.value as any)}
                >
                  {p.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !description.trim() || !feature}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
