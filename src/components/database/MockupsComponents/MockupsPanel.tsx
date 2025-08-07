import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProjectMockup, ProjectMockupCategory } from '@/types/database';
import { Plus, ImageIcon, Layers, Link, X, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MockupAnnotationModal } from '@/components/database/MockupsComponents/MockupAnnotationModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface MockupsPanelProps {
  mockups: ProjectMockupCategory[];
  onMockupsChange: (mockups: ProjectMockupCategory[]) => void;
  projectId: string;
}

export function MockupsPanel({ mockups, onMockupsChange, projectId }: MockupsPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mockupType, setMockupType] = useState<'image' | 'webview'>('image');
  const [newMockup, setNewMockup] = useState({
    name: '',
    page: '',
    url: '',
    description: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingMockup, setViewingMockup] = useState<ProjectMockup | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [annotatingMockup, setAnnotatingMockup] = useState<ProjectMockup | null>(null);
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [mockupComments, setMockupComments] = useState<Record<string, number>>({});
  const { user } = useAuth();

  const handleAddMockup = () => {
    if (!newMockup.name || !newMockup.page) return;
    
    // Create a new mockup category if it doesn't exist
    let updatedMockups = [...mockups];
    const categoryIndex = updatedMockups.findIndex(cat => cat.name === newMockup.page);
    
    const mockup = {
      id: Date.now().toString(),
      name: newMockup.name,
      page: newMockup.page,
      url: mockupType === 'image' && selectedFile ? URL.createObjectURL(selectedFile) : newMockup.url,
      description: newMockup.description,
      createdAt: new Date().toISOString(),
      type: mockupType
    };
    
    if (categoryIndex >= 0) {
      // Add to existing category
      updatedMockups[categoryIndex].mockups.push(mockup);
    } else {
      // Create new category
      updatedMockups.push({
        id: `cat-${Date.now()}`,
        name: newMockup.page,
        mockups: [mockup]
      });
    }
    
    onMockupsChange(updatedMockups);
    setNewMockup({ name: '', page: '', url: '', description: '' });
    setSelectedFile(null);
    setMockupType('image');
    setIsDialogOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setNewMockup({ ...newMockup, url: '' });
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetFileInput = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleViewMockup = (mockup: ProjectMockup) => {
    if (mockup.type === 'webview') {
      // Open webview link in new tab
      window.open(mockup.url, '_blank');
    } else {
      // Show image in modal
      setViewingMockup(mockup);
      setIsViewModalOpen(true);
    }
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingMockup(null);
  };

  const handleAnnotate = (mockup: ProjectMockup) => {
    setAnnotatingMockup(mockup);
    setIsAnnotationModalOpen(true);
  };

  // Fetch comment counts for mockups
  useEffect(() => {
    if (!projectId || !mockups.length) return;

    const fetchCommentCounts = async () => {
      try {
        // Get all mockup IDs
        const mockupIds = mockups.flatMap(category => 
          category.mockups.map(mockup => mockup.id)
        );

        if (mockupIds.length === 0) return;

        // Fetch comment counts from database
        const { data, error } = await supabase
          .from('mockup_comments')
          .select('mockup_id, id')
          .in('mockup_id', mockupIds);

        if (error) throw error;

        // Count comments per mockup
        const counts: Record<string, number> = {};
        data.forEach(comment => {
          counts[comment.mockup_id] = (counts[comment.mockup_id] || 0) + 1;
        });

        setMockupComments(counts);
      } catch (error) {
        console.error('Error fetching mockup comments:', error);
      }
    };

    fetchCommentCounts();
  }, [projectId, mockups]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-lg">Project Mockups</h3>
          <p className="text-sm text-muted-foreground">
            Webviews and images categorized by page
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Mockup
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Mockup</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newMockup.name}
                  onChange={(e) => setNewMockup({...newMockup, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="page" className="text-right">
                  Page
                </Label>
                <Input
                  id="page"
                  value={newMockup.page}
                  onChange={(e) => setNewMockup({...newMockup, page: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type</Label>
                <RadioGroup 
                  value={mockupType} 
                  onValueChange={(value) => {
                    setMockupType(value as 'image' | 'webview');
                    if (value === 'image') {
                      setNewMockup({...newMockup, url: ''});
                    } else {
                      resetFileInput();
                    }
                  }}
                  className="col-span-3 flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="image" />
                    <Label htmlFor="image" className="flex items-center">
                      <ImageIcon className="h-4 w-4 mr-1" /> Image
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="webview" id="webview" />
                    <Label htmlFor="webview" className="flex items-center">
                      <Link className="h-4 w-4 mr-1" /> Webview
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {mockupType === 'image' ? (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Image</Label>
                  <div className="col-span-3">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden" 
                    />
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={triggerFileInput}
                        className="w-full"
                      >
                        {selectedFile ? selectedFile.name : 'Choose File'}
                      </Button>
                      {selectedFile && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={resetFileInput}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="url" className="text-right">
                    Webview URL
                  </Label>
                  <Input
                    id="url"
                    value={newMockup.url}
                    onChange={(e) => setNewMockup({...newMockup, url: e.target.value})}
                    className="col-span-3"
                    placeholder="https://example.com"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newMockup.description}
                  onChange={(e) => setNewMockup({...newMockup, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                resetFileInput();
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddMockup}
                disabled={mockupType === 'image' ? !selectedFile && !newMockup.url : !newMockup.url}
              >
                Add Mockup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Annotation Modal */}
      {annotatingMockup && (
        <MockupAnnotationModal
          open={isAnnotationModalOpen}
          onOpenChange={setIsAnnotationModalOpen}
          mockupId={annotatingMockup.id}
          mockupUrl={annotatingMockup.url}
          projectId={projectId}
          onCommentAdded={() => {
            // Refresh comment counts
            if (annotatingMockup?.id) {
              setMockupComments(prev => ({
                ...prev,
                [annotatingMockup.id]: (prev[annotatingMockup.id] || 0) + 1
              }));
            }
          }}
        />
      )}
      
      {/* View Mockup Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="p-6 flex justify-between items-center border-b">
            <DialogTitle>
              {viewingMockup?.name}
              <p className="text-sm font-normal text-muted-foreground mt-1">
                {viewingMockup?.page}
              </p>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={closeViewModal}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-6 overflow-auto max-h-[70vh]">
            {viewingMockup && viewingMockup.type === 'image' && (
              <img 
                src={viewingMockup.url} 
                alt={viewingMockup.name} 
                className="max-w-full max-h-[60vh] mx-auto"
              />
            )}
            {viewingMockup?.description && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{viewingMockup.description}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {mockups.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No mockups added yet</p>
          <p className="text-xs mt-1">Add mockups to visualize your project design</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-6">
          {mockups.map((category) => (
            <div key={category.id} className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center">
                <Layers className="h-4 w-4 mr-2" />
                {category.name}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.mockups.map((mockup) => (
                  <div key={mockup.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-muted aspect-video flex items-center justify-center">
                      {mockup.type === 'image' ? (
                        <img 
                          src={mockup.url} 
                          alt={mockup.name} 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            if (target.nextSibling && target.nextSibling instanceof HTMLElement) {
                              target.nextSibling.classList.remove('hidden');
                            }
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                          <Link className="h-8 w-8 mb-2" />
                          <span className="text-xs text-center">Webview Link</span>
                        </div>
                      )}
                      <ImageIcon className="h-8 w-8 text-muted-foreground hidden" />
                    </div>
                    <div className="p-3">
                      <h5 className="font-medium text-sm truncate">{mockup.name}</h5>
                      <p className="text-xs text-muted-foreground truncate mt-1">{mockup.page}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(mockup.createdAt).toLocaleDateString()}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full relative"
                            onClick={() => handleAnnotate(mockup)}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {mockupComments[mockup.id] > 0 && (
                              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                {mockupComments[mockup.id]}
                              </span>
                            )}
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => handleViewMockup(mockup)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
