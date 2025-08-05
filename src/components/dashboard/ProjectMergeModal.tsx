import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  GitMerge, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  ArrowRight, 
  Database, 
  Table,
  Plus,
  Minus,
  Edit,
  Eye,
  EyeOff,
  Save,
  RotateCcw
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';

interface ProjectMergeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProjects: any[];
  onMergeComplete: () => void;
}

interface TableConflict {
  tableName: string;
  conflictType: 'name_conflict' | 'field_conflict' | 'type_conflict';
  sourceProject: string;
  targetProject: string;
  sourceTable: any;
  targetTable: any;
  resolution: 'keep_source' | 'keep_target' | 'merge' | 'rename' | null;
  newName?: string;
  fieldConflicts?: FieldConflict[];
}

interface FieldConflict {
  fieldName: string;
  sourceField: any;
  targetField: any;
  resolution: 'keep_source' | 'keep_target' | 'merge' | null;
}

/**
 * GitHub-like Project Merge Modal
 * 
 * Provides a comprehensive interface for merging two database projects,
 * similar to GitHub's merge conflict resolution interface.
 * 
 * Features:
 * - Automatic conflict detection
 * - Visual diff comparison
 * - Interactive conflict resolution
 * - Preview of merged result
 * - Rollback capabilities
 */
export function ProjectMergeModal({ 
  open, 
  onOpenChange, 
  selectedProjects, 
  onMergeComplete 
}: ProjectMergeModalProps) {
  const { saveProject } = useProjects();
  const [conflicts, setConflicts] = useState<TableConflict[]>([]);
  const [mergedProjectName, setMergedProjectName] = useState('');
  const [mergedProjectDescription, setMergedProjectDescription] = useState('');
  const [currentStep, setCurrentStep] = useState<'analyze' | 'resolve' | 'preview' | 'complete'>('analyze');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open && selectedProjects.length === 2) {
      setMergedProjectName(`${selectedProjects[0].name} + ${selectedProjects[1].name}`);
      setMergedProjectDescription(`Merged project from ${selectedProjects[0].name} and ${selectedProjects[1].name}`);
      analyzeConflicts();
    } else if (!open) {
      resetState();
    }
  }, [open, selectedProjects]);

  /**
   * Reset all modal state
   */
  const resetState = () => {
    setConflicts([]);
    setCurrentStep('analyze');
    setIsAnalyzing(false);
    setIsMerging(false);
    setPreviewData(null);
  };

  /**
   * Analyze conflicts between the two selected projects
   */
  const analyzeConflicts = async () => {
    if (selectedProjects.length !== 2) return;

    setIsAnalyzing(true);
    setCurrentStep('analyze');

    try {
      const [sourceProject, targetProject] = selectedProjects;
      const sourceTables = sourceProject.project_data?.tables || {};
      const targetTables = targetProject.project_data?.tables || {};
      
      const detectedConflicts: TableConflict[] = [];

      // Check for table name conflicts
      Object.keys(sourceTables).forEach(tableName => {
        if (targetTables[tableName]) {
          // Table exists in both projects - check for field conflicts
          const sourceTable = sourceTables[tableName];
          const targetTable = targetTables[tableName];
          
          const fieldConflicts: FieldConflict[] = [];
          const sourceFields = sourceTable.fields || [];
          const targetFields = targetTable.fields || [];

          // Check field conflicts
          sourceFields.forEach((sourceField: any) => {
            const targetField = targetFields.find((f: any) => f.name === sourceField.name);
            if (targetField) {
              // Field exists in both - check for type conflicts
              if (sourceField.type !== targetField.type || 
                  sourceField.nullable !== targetField.nullable ||
                  sourceField.primaryKey !== targetField.primaryKey) {
                fieldConflicts.push({
                  fieldName: sourceField.name,
                  sourceField,
                  targetField,
                  resolution: null
                });
              }
            }
          });

          detectedConflicts.push({
            tableName,
            conflictType: fieldConflicts.length > 0 ? 'field_conflict' : 'name_conflict',
            sourceProject: sourceProject.name,
            targetProject: targetProject.name,
            sourceTable,
            targetTable,
            resolution: null,
            fieldConflicts
          });
        }
      });

      setConflicts(detectedConflicts);
      
      // Move to resolve step if there are conflicts, otherwise go to preview
      if (detectedConflicts.length > 0) {
        setCurrentStep('resolve');
      } else {
        generatePreview();
      }
    } catch (error) {
      console.error('Error analyzing conflicts:', error);
      toast.error('Failed to analyze project conflicts');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Update conflict resolution
   */
  const updateConflictResolution = (conflictIndex: number, resolution: TableConflict['resolution'], newName?: string) => {
    setConflicts(prev => prev.map((conflict, index) => 
      index === conflictIndex 
        ? { ...conflict, resolution, newName }
        : conflict
    ));
  };

  /**
   * Update field conflict resolution
   */
  const updateFieldConflictResolution = (conflictIndex: number, fieldIndex: number, resolution: FieldConflict['resolution']) => {
    setConflicts(prev => prev.map((conflict, index) => 
      index === conflictIndex 
        ? {
            ...conflict,
            fieldConflicts: conflict.fieldConflicts?.map((fieldConflict, fIndex) =>
              fIndex === fieldIndex ? { ...fieldConflict, resolution } : fieldConflict
            )
          }
        : conflict
    ));
  };

  /**
   * Check if all conflicts are resolved
   */
  const allConflictsResolved = () => {
    return conflicts.every(conflict => {
      const mainResolved = conflict.resolution !== null;
      const fieldsResolved = !conflict.fieldConflicts || 
        conflict.fieldConflicts.every(fc => fc.resolution !== null);
      return mainResolved && fieldsResolved;
    });
  };

  /**
   * Generate preview of merged project
   */
  const generatePreview = () => {
    if (selectedProjects.length !== 2) return;

    const [sourceProject, targetProject] = selectedProjects;
    const sourceTables = sourceProject.project_data?.tables || {};
    const targetTables = targetProject.project_data?.tables || {};
    
    const mergedTables = { ...targetTables };

    // Apply conflict resolutions
    conflicts.forEach(conflict => {
      const { tableName, resolution, newName, sourceTable, fieldConflicts } = conflict;

      switch (resolution) {
        case 'keep_source':
          mergedTables[tableName] = sourceTable;
          break;
        case 'keep_target':
          // Already in mergedTables
          break;
        case 'rename':
          if (newName) {
            mergedTables[newName] = sourceTable;
          }
          break;
        case 'merge':
          // Merge fields based on field conflict resolutions
          const mergedFields = [...(mergedTables[tableName]?.fields || [])];
          const sourceFields = sourceTable.fields || [];
          
          sourceFields.forEach((sourceField: any) => {
            const existingFieldIndex = mergedFields.findIndex((f: any) => f.name === sourceField.name);
            const fieldConflict = fieldConflicts?.find(fc => fc.fieldName === sourceField.name);
            
            if (existingFieldIndex >= 0 && fieldConflict) {
              // Apply field resolution
              switch (fieldConflict.resolution) {
                case 'keep_source':
                  mergedFields[existingFieldIndex] = sourceField;
                  break;
                case 'keep_target':
                  // Keep existing
                  break;
                case 'merge':
                  // Merge field properties (could be more sophisticated)
                  mergedFields[existingFieldIndex] = {
                    ...mergedFields[existingFieldIndex],
                    ...sourceField
                  };
                  break;
              }
            } else if (existingFieldIndex < 0) {
              // Add new field
              mergedFields.push(sourceField);
            }
          });
          
          mergedTables[tableName] = {
            ...mergedTables[tableName],
            fields: mergedFields
          };
          break;
      }
    });

    // Add tables that don't exist in target
    Object.keys(sourceTables).forEach(tableName => {
      if (!targetTables[tableName] && !conflicts.find(c => c.tableName === tableName)) {
        mergedTables[tableName] = sourceTables[tableName];
      }
    });

    setPreviewData({
      tables: mergedTables,
      triggers: [
        ...(sourceProject.project_data?.triggers || []),
        ...(targetProject.project_data?.triggers || [])
      ],
      functions: [
        ...(sourceProject.project_data?.functions || []),
        ...(targetProject.project_data?.functions || [])
      ]
    });

    setCurrentStep('preview');
  };

  /**
   * Execute the merge
   */
  const executeMerge = async () => {
    if (!previewData || !mergedProjectName.trim()) {
      toast.error('Please provide a name for the merged project');
      return;
    }

    setIsMerging(true);

    try {
      const result = await saveProject(
        mergedProjectName.trim(),
        mergedProjectDescription.trim(),
        previewData
      );

      if (result) {
        toast.success('Projects merged successfully!');
        setCurrentStep('complete');
        setTimeout(() => {
          onMergeComplete();
        }, 2000);
      } else {
        throw new Error('Failed to save merged project');
      }
    } catch (error) {
      console.error('Error merging projects:', error);
      toast.error('Failed to merge projects');
    } finally {
      setIsMerging(false);
    }
  };

  const renderAnalyzeStep = () => (
    <div className="space-y-4">
      <div className="text-center py-8">
        {isAnalyzing ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium">Analyzing Projects</h3>
            <p className="text-muted-foreground">Detecting conflicts between schemas...</p>
          </>
        ) : (
          <>
            <GitMerge className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-medium">Ready to Merge</h3>
            <p className="text-muted-foreground">
              Analyzing {selectedProjects[0]?.name} and {selectedProjects[1]?.name}
            </p>
          </>
        )}
      </div>
    </div>
  );

  const renderResolveStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <h3 className="text-lg font-medium">Resolve Conflicts</h3>
        <Badge variant="secondary">{conflicts.length} conflicts</Badge>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-4">
          {conflicts.map((conflict, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Table: {conflict.tableName}
                  </CardTitle>
                  <Badge variant={conflict.resolution ? 'default' : 'destructive'}>
                    {conflict.resolution ? 'Resolved' : 'Unresolved'}
                  </Badge>
                </div>
                <CardDescription>
                  Conflict between {conflict.sourceProject} and {conflict.targetProject}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main conflict resolution */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Source: {conflict.sourceProject}</Label>
                    <div className="p-3 border rounded bg-green-50 dark:bg-green-950/20">
                      <p className="text-sm font-medium">{conflict.tableName}</p>
                      <p className="text-xs text-muted-foreground">
                        {conflict.sourceTable.fields?.length || 0} fields
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Target: {conflict.targetProject}</Label>
                    <div className="p-3 border rounded bg-red-50 dark:bg-red-950/20">
                      <p className="text-sm font-medium">{conflict.tableName}</p>
                      <p className="text-xs text-muted-foreground">
                        {conflict.targetTable.fields?.length || 0} fields
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resolution options */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Resolution</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={conflict.resolution === 'keep_source' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateConflictResolution(index, 'keep_source')}
                    >
                      Keep Source
                    </Button>
                    <Button
                      variant={conflict.resolution === 'keep_target' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateConflictResolution(index, 'keep_target')}
                    >
                      Keep Target
                    </Button>
                    <Button
                      variant={conflict.resolution === 'merge' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateConflictResolution(index, 'merge')}
                    >
                      Merge Both
                    </Button>
                    <Button
                      variant={conflict.resolution === 'rename' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateConflictResolution(index, 'rename')}
                    >
                      Rename Source
                    </Button>
                  </div>
                  
                  {conflict.resolution === 'rename' && (
                    <Input
                      placeholder="New table name"
                      value={conflict.newName || ''}
                      onChange={(e) => updateConflictResolution(index, 'rename', e.target.value)}
                    />
                  )}
                </div>

                {/* Field conflicts */}
                {conflict.fieldConflicts && conflict.fieldConflicts.length > 0 && (
                  <div className="space-y-3">
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium">Field Conflicts</Label>
                      <div className="space-y-2 mt-2">
                        {conflict.fieldConflicts.map((fieldConflict, fieldIndex) => (
                          <div key={fieldIndex} className="p-3 border rounded space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{fieldConflict.fieldName}</span>
                              <Badge variant={fieldConflict.resolution ? 'default' : 'destructive'}>
                                {fieldConflict.resolution ? 'Resolved' : 'Unresolved'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant={fieldConflict.resolution === 'keep_source' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateFieldConflictResolution(index, fieldIndex, 'keep_source')}
                              >
                                Source
                              </Button>
                              <Button
                                variant={fieldConflict.resolution === 'keep_target' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateFieldConflictResolution(index, fieldIndex, 'keep_target')}
                              >
                                Target
                              </Button>
                              <Button
                                variant={fieldConflict.resolution === 'merge' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateFieldConflictResolution(index, fieldIndex, 'merge')}
                              >
                                Merge
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={() => setCurrentStep('analyze')}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Re-analyze
        </Button>
        <Button 
          onClick={generatePreview}
          disabled={!allConflictsResolved()}
        >
          Continue to Preview
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium">Preview Merged Project</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="merged-name">Project Name</Label>
          <Input
            id="merged-name"
            value={mergedProjectName}
            onChange={(e) => setMergedProjectName(e.target.value)}
            placeholder="Enter merged project name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="merged-description">Description</Label>
          <Input
            id="merged-description"
            value={mergedProjectDescription}
            onChange={(e) => setMergedProjectDescription(e.target.value)}
            placeholder="Enter project description"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Merged Schema Preview</CardTitle>
          <CardDescription>
            {Object.keys(previewData?.tables || {}).length} tables will be created
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {Object.entries(previewData?.tables || {}).map(([tableName, table]: [string, any]) => (
                <div key={tableName} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    <span className="font-medium">{tableName}</span>
                  </div>
                  <Badge variant="secondary">
                    {table.fields?.length || 0} fields
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={() => setCurrentStep('resolve')}>
          Back to Conflicts
        </Button>
        <Button 
          onClick={executeMerge}
          disabled={isMerging || !mergedProjectName.trim()}
          className="flex items-center gap-2"
        >
          {isMerging ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Merging...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Execute Merge
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center py-8">
      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
      <h3 className="text-lg font-medium">Merge Complete!</h3>
      <p className="text-muted-foreground">
        Successfully merged {selectedProjects[0]?.name} and {selectedProjects[1]?.name}
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        The new project "{mergedProjectName}" has been created.
      </p>
    </div>
  );

  if (selectedProjects.length !== 2) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Merge Projects
          </DialogTitle>
          <DialogDescription>
            Merge {selectedProjects[0]?.name} and {selectedProjects[1]?.name} with conflict resolution
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4 py-4">
          {['analyze', 'resolve', 'preview', 'complete'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step 
                  ? 'bg-primary text-primary-foreground' 
                  : index < ['analyze', 'resolve', 'preview', 'complete'].indexOf(currentStep)
                    ? 'bg-green-600 text-white'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              {index < 3 && (
                <div className={`w-12 h-0.5 ${
                  index < ['analyze', 'resolve', 'preview', 'complete'].indexOf(currentStep)
                    ? 'bg-green-600'
                    : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {currentStep === 'analyze' && renderAnalyzeStep()}
          {currentStep === 'resolve' && renderResolveStep()}
          {currentStep === 'preview' && renderPreviewStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
