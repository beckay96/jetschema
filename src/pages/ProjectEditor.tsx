import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { DatabaseCanvas } from '@/components/database/DatabaseCanvas';
import { TableView } from '@/components/database/TableView';
import { DatabaseSidebar } from '@/components/database/DatabaseSidebar';
import { SQLEditor } from '@/components/database/SQLEditor';
import { DatabaseTable, DatabaseTrigger, DatabaseFunction, ProjectMockupCategory } from '@/types/database';
import { CommentTaskDrawer, SchemaComment, SchemaTask } from '@/components/database/CommentTaskDrawer';
import { ValidationPanel } from '@/components/database/ValidationPanel';
import { MockupsPanel } from '@/components/database/MockupsPanel';
import { UnifiedCommentsPanel } from '@/components/comments/UnifiedCommentsPanel';
import { ValidationError } from '@/utils/validationUtils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Database, Code, Palette, PanelLeft, PanelRight, ArrowLeft, X, Grid, Layers, AlertTriangle, ImageIcon, Plus, MessageSquare, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SaveStatus, StatusType } from '@/components/SaveStatus';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import '@/styles/panel-styles.css'; // Custom panel styles (replacing missing package CSS)
import { toast } from 'sonner';
import { getUserDefaultView } from '@/api/userSettings';

const ProjectEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject } = useProjects();
  
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [triggers, setTriggers] = useState<DatabaseTrigger[]>([]);
  const [functions, setFunctions] = useState<DatabaseFunction[]>([]);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [projectName, setProjectName] = useState('');
  
  // Comments and tasks state
  const [comments, setComments] = useState<SchemaComment[]>([]);
  const [tasks, setTasks] = useState<SchemaTask[]>([]);
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  
  // Mockup state
  const [mockups, setMockups] = useState<ProjectMockupCategory[]>([]);
  
  /**
   * Validation state for the project schema
   * Stores validation errors and loading state for the validation process
   * ValidationPanel uses these to display validation issues to the user
   */
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationLoading, setValidationLoading] = useState(false);

  // Panel state management
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeRightPanelTab, setActiveRightPanelTab] = useState<'sql' | 'properties' | 'validation' | 'mockups' | 'comments'>('sql');
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  
  // View mode state - 'diagram' (default) or 'table'
  const [viewMode, setViewMode] = useState<'diagram' | 'table'>('diagram');
  
  // Initialize view mode based on user preference
  useEffect(() => {
    const loadUserDefaultView = async () => {
      try {
        const defaultView = await getUserDefaultView();
        setViewMode(defaultView);
      } catch (error) {
        console.error('Failed to load user default view preference:', error);
        // Keep default 'diagram' view if there's an error
      }
    };
    
    loadUserDefaultView();
  }, []);

  const currentProject = projects.find(p => p.id === id);
  
  // Track changes to mark as unsaved
  useEffect(() => {
    if (currentProject && !isSaving) {
      const initialData = currentProject.project_data || {};
      const currentData = { tables, triggers, functions };
      const hasChanges = 
        JSON.stringify(initialData.tables || []) !== JSON.stringify(tables) ||
        JSON.stringify(initialData.triggers || []) !== JSON.stringify(triggers) ||
        JSON.stringify(initialData.functions || []) !== JSON.stringify(functions) ||
        JSON.stringify(initialData.comments || []) !== JSON.stringify(comments) ||
        JSON.stringify(initialData.tasks || []) !== JSON.stringify(tasks);
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [tables, triggers, functions, comments, tasks, currentProject, isSaving, lastSavedTime]);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load project data
  useEffect(() => {
    if (currentProject) {
      try {
        console.log('Loading project data:', currentProject.name);
        const projectData = currentProject.project_data || {};
        
        // Safely parse and handle tables data
        const safeTables = Array.isArray(projectData.tables) ? projectData.tables.map(table => ({
          ...table,
          project_id: currentProject.id // Ensure project_id is set for all tables
        })) : [];
        setTables(safeTables);
        
        // Safely parse and handle triggers data
        const safeTriggers = Array.isArray(projectData.triggers) ? projectData.triggers.map(trigger => {
          // Convert old format triggers to new format if needed
          if ('event' in trigger && 'timing' in trigger && 'table' in trigger) {
            return {
              id: trigger.id,
              project_id: currentProject.id,
              name: trigger.name,
              table_name: (trigger as any).table,
              trigger_event: (trigger as any).event,
              trigger_timing: (trigger as any).timing,
              function_id: undefined,
              is_active: true,
              conditions: undefined,
              author_id: currentProject.user_id,
              description: trigger.description
            };
          }
          return { 
            ...trigger,
            project_id: currentProject.id // Ensure project_id is set
          };
        }) : [];
        setTriggers(safeTriggers);
        
        // Safely parse and handle functions data
        const safeFunctions = Array.isArray(projectData.functions) ? projectData.functions.map(func => {
          // Convert old format functions to new format if needed
          if ('returnType' in func && 'code' in func) {
            return {
              id: func.id,
              project_id: currentProject.id,
              name: func.name,
              description: func.description,
              function_type: 'plpgsql',
              parameters: func.parameters.map((p: any) => ({
                name: p.name,
                type: p.type,
                default: p.defaultValue
              })),
              return_type: (func as any).returnType,
              function_body: (func as any).code,
              is_edge_function: false,
              is_cron_enabled: false,
              author_id: currentProject.user_id
            };
          }
          return {
            ...func,
            project_id: currentProject.id // Ensure project_id is set
          };
        }) : [];
        setFunctions(safeFunctions);
        
        setProjectName(currentProject.name);
        
        // Safely load comments and tasks if they exist
        const safeComments = Array.isArray(projectData.comments) ? projectData.comments : [];
        setComments(safeComments);
        
        const safeTasks = Array.isArray(projectData.tasks) ? projectData.tasks : [];
        setTasks(safeTasks);
        
        // Safely load mockups if they exist
        const safeMockups = Array.isArray(projectData.mockups) ? projectData.mockups : [];
        setMockups(safeMockups);
        
        /**
         * Load validation errors if they exist in the project data
         * Otherwise, run initial validation after a short delay
         * This ensures that the ValidationPanel has data to display when the project loads
         */
        if (Array.isArray(projectData.validationErrors)) {
          setValidationErrors(projectData.validationErrors);
        } else {
          // Run initial validation after a short delay to ensure tables are loaded
          setTimeout(() => handleRefreshValidation(), 500);
        }
        
        console.log('Project data loaded successfully');
      } catch (error) {
        console.error('Error loading project data:', error);
        toast.error('There was an issue loading your project data');
        
        // Set safe default values to prevent rendering errors
        setTables([]);
        setTriggers([]);
        setFunctions([]);
        setComments([]);
        setTasks([]);
        setValidationErrors([]);
      }
    }
  }, [currentProject]);

  // Close other panel when opening one
  const toggleLeftPanel = () => {
    if (!leftPanelOpen && rightPanelOpen) {
      setRightPanelOpen(false);
    }
    setLeftPanelOpen(!leftPanelOpen);
  };

  const toggleRightPanel = () => {
    if (!rightPanelOpen && leftPanelOpen) {
      setLeftPanelOpen(false);
    }
    setRightPanelOpen(!rightPanelOpen);
  };

  // Comment and task management handlers
  // Handle adding a comment with improved error handling and state management
  const handleAddComment = (elementType: 'table' | 'field', elementId: string, elementName: string) => {
    try {
      // Update status before anything else to provide immediate feedback
      setStatusMessage({
        status: 'loading',
        message: `Adding comment for ${elementName}...`
      });
      
      // Create context information for better reference
      let context: SchemaComment['context'] = {};
      
      // If this is a field, find its parent table
      if (elementType === 'field') {
        const parentTableName = findParentTableForField(elementId);
        if (parentTableName) {
          context.parentTable = parentTableName;
        }
      }
      
      // Add current project info if available
      if (currentProject) {
        context.database = currentProject.name;
      }
      
      // Create the new comment with a more reliable ID
      const commentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newComment: SchemaComment = {
        id: commentId,
        elementType,
        elementId,
        elementName,
        content: `Add your comment about ${elementName} here...`,
        createdAt: new Date(),
        read: false,
        context,
      };
      
      // Update local state with functional update to avoid closure issues
      setComments(prevComments => {
        const updatedComments = [...prevComments, newComment];
        
        // Schedule save operation in the next event loop to avoid state update conflicts
        requestAnimationFrame(() => {
          try {
            // Open the comment drawer safely in the next tick
            setCommentDrawerOpen(true);
            
            // Save the project with the updated comments
            handleSaveProject(tables, triggers, functions, updatedComments, tasks, true);
            
            // Update status after save
            setStatusMessage({
              status: 'success',
              message: `Added comment for ${elementName}`
            });
          } catch (saveError) {
            console.error('Error saving comment:', saveError);
            setStatusMessage({
              status: 'error',
              message: `Error saving comment: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`
            });
          }
        });
        
        return updatedComments;
      });
    } catch (error) {
      // Handle errors during the comment creation process
      console.error('Error creating comment:', error);
      setStatusMessage({
        status: 'error',
        message: `Error creating comment: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handleMarkAsTask = (elementType: 'table' | 'field', elementId: string, elementName: string, priority: 'low' | 'medium' | 'high') => {
    const newTask: SchemaTask = {
      id: `task-${Date.now()}`,
      elementType,
      elementId,
      elementName,
      description: `Review and complete ${elementName}`,
      priority,
      createdAt: new Date(),
      completed: false,
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setCommentDrawerOpen(true);
    // Also save the project with the new task
    handleSaveProject(tables, triggers, functions, comments, updatedTasks, true);
    setStatusMessage({
      status: 'success',
      message: `Marked ${elementName} as ${priority} priority task`
    });
  };
  
  // Convert comment to task handler
  const handleConvertCommentToTask = (commentId: string) => {
    try {
      // Find the comment to convert
      const commentToConvert = comments.find(comment => comment.id === commentId);
      if (!commentToConvert) {
        console.error(`Comment with ID ${commentId} not found`);
        return;
      }

      setStatusMessage({
        status: 'loading',
        message: `Converting comment to task...`
      });

      // Extract details from the comment
      const { elementType, elementId, elementName, content, context } = commentToConvert;
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create a new task based on the comment
      const newTask: SchemaTask = {
        id: taskId,
        elementType,
        elementId,
        elementName,
        description: content, // Use the comment content as the task description
        priority: 'medium', // Default priority
        createdAt: new Date(),
        completed: false,
        // If the comment has an author, preserve it for the task
        ...(commentToConvert.author && { author: commentToConvert.author }),
        // Preserve context and add the commentId reference
        context: {
          ...(context || {}),
          commentId: commentId,
          
          // If this is a field, try to infer the parent table if not already set
          ...(!context?.parentTable && elementType === 'field' && {
            parentTable: findParentTableForField(elementId)
          })
        }
      };
      
      // Mark the comment as converted and store the task ID
      const updatedComments = comments.map(comment => 
        comment.id === commentId ? { 
          ...comment, 
          read: true, // Also mark as read when converting
          convertedToTaskId: taskId
        } : comment
      );
      
      // Add the new task to the tasks list
      const updatedTasks = [...tasks, newTask];
      
      // Update state
      setComments(updatedComments);
      setTasks(updatedTasks);
      
      // Save the project with both updates
      handleSaveProject(tables, triggers, functions, updatedComments, updatedTasks, true);
      
      setStatusMessage({
        status: 'success',
        message: `Comment converted to task`
      });
    } catch (error) {
      console.error('Error converting comment to task:', error);
      setStatusMessage({
        status: 'error',
        message: `Error converting comment to task: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };
  
  // Helper function to find the parent table for a field
  const findParentTableForField = (fieldId: string): string | undefined => {
    // Look through all tables to find the one containing this field
    for (const table of tables) {
      const field = table.fields.find(f => f.id === fieldId);
      if (field) {
        return table.name;
      }
    }
    return undefined;
  };
  
  // Mark comment as read handler
  const handleMarkCommentRead = (commentId: string) => {
    const updatedComments = comments.map(comment => 
      comment.id === commentId ? { ...comment, read: true } : comment
    );
    setComments(updatedComments);
    handleSaveProject(tables, triggers, functions, updatedComments, tasks, true);
    setStatusMessage({
      status: 'success',
      message: "Comment marked as read"
    });
  };
  
  // Mark task as complete handler
  const handleMarkTaskComplete = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: true, completedAt: new Date() } : task
    );
    setTasks(updatedTasks);
    handleSaveProject(tables, triggers, functions, comments, updatedTasks, true);
    setStatusMessage({
      status: 'success',
      message: "Task marked as complete"
    });
  };
  
  // Edit comment handler
  const handleEditComment = (commentId: string, newContent: string) => {
    const updatedComments = comments.map(comment => 
      comment.id === commentId ? { ...comment, content: newContent } : comment
    );
    setComments(updatedComments);
    handleSaveProject(tables, triggers, functions, updatedComments, tasks, true);
    setStatusMessage({
      status: 'success',
      message: "Comment updated successfully"
    });
  };
  
  // Delete comment handler
  const handleDeleteComment = (commentId: string) => {
    const updatedComments = comments.filter(comment => comment.id !== commentId);
    setComments(updatedComments);
    handleSaveProject(tables, triggers, functions, updatedComments, tasks, true);
    setStatusMessage({
      status: 'success',
      message: "Comment deleted successfully"
    });
  };
  
  // Edit task handler
  const handleEditTask = (taskId: string, newDescription: string, newPriority: 'low' | 'medium' | 'high') => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, description: newDescription, priority: newPriority } : task
    );
    setTasks(updatedTasks);
    handleSaveProject(tables, triggers, functions, comments, updatedTasks, true);
    setStatusMessage({
      status: 'success',
      message: "Task updated successfully"
    });
  };
  
  // Delete task handler
  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    handleSaveProject(tables, triggers, functions, comments, updatedTasks, true);
    setStatusMessage({
      status: 'success',
      message: "Task deleted successfully"
    });
  };
  
  // Reply to comment handler
  const handleReplyToComment = (parentId: string) => {
    try {
      // Find the parent comment
      const parentComment = comments.find(comment => comment.id === parentId);
      if (!parentComment) {
        console.error(`Parent comment with ID ${parentId} not found`);
        return;
      }

      setStatusMessage({
        status: 'loading',
        message: `Adding reply to comment...`
      });

      // Create context information for the reply
      let context: SchemaComment['context'] = {};
      
      // Inherit context from parent comment
      if (parentComment.context) {
        context = { ...parentComment.context };
      }
      
      // Add current project info if available
      if (currentProject) {
        context.database = currentProject.name;
      }
      
      // Create the new reply comment
      const replyId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newReply: SchemaComment = {
        id: replyId,
        elementType: parentComment.elementType,
        elementId: parentComment.elementId,
        elementName: parentComment.elementName,
        content: `Add your reply here...`,
        createdAt: new Date(),
        read: false,
        parentId: parentId,
        isReply: true,
        context,
      };
      
      // Update local state
      const updatedComments = [...comments, newReply];
      setComments(updatedComments);
      
      // Save the project with the new reply
      handleSaveProject(tables, triggers, functions, updatedComments, tasks, true);
      
      setStatusMessage({
        status: 'success',
        message: `Reply added successfully`
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      setStatusMessage({
        status: 'error',
        message: `Error adding reply: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };
  
  /**
   * Validation refresh handler
   * Performs schema validation on the current tables and fields
   * Checks for common issues like missing primary keys, empty tables,
   * fields without types, and naming convention violations
   * Updates the validationErrors state and displays toast notifications
   */
  const handleRefreshValidation = () => {
    setValidationLoading(true);
    
    // Simulate validation process
    setTimeout(() => {
      // Perform schema validation
      const errors: ValidationError[] = [];
      
      // Check for tables without primary keys
      tables.forEach(table => {
        const hasPrimaryKey = table.fields.some(field => field.primaryKey);
        if (!hasPrimaryKey) {
          errors.push({
            id: `err-${table.id}-no-pk`,
            type: 'error',
            message: `Table ${table.name} doesn't have a primary key defined.`,
            suggestion: 'Add a primary key field to ensure proper record identification.',
            affectedElement: {
              type: 'table',
              id: table.id,
              name: table.name
            }
          });
        }
        
        // Check for empty tables (no fields)
        if (table.fields.length === 0) {
          errors.push({
            id: `err-${table.id}-empty`,
            type: 'warning',
            message: `Table ${table.name} has no fields defined.`,
            suggestion: 'Add fields to define your table structure.',
            affectedElement: {
              type: 'table',
              id: table.id,
              name: table.name
            }
          });
        }
        
        // Check fields for issues
        table.fields.forEach(field => {
          // Check for fields without types
          if (!field.type || field.type.trim() === '') {
            errors.push({
              id: `err-${field.id}-no-type`,
              type: 'error',
              message: `Field ${field.name} in table ${table.name} has no data type defined.`,
              suggestion: 'Specify a data type for this field.',
              affectedElement: {
                type: 'field',
                id: field.id,
                name: field.name
              }
            });
          }
          
          // Check for naming conventions
          if (field.name.includes(' ') || /[^a-zA-Z0-9_]/.test(field.name)) {
            errors.push({
              id: `err-${field.id}-naming`,
              type: 'warning',
              message: `Field ${field.name} in table ${table.name} has spaces or special characters.`,
              suggestion: 'Use snake_case for field names (letters, numbers, and underscores only).',
              affectedElement: {
                type: 'field',
                id: field.id,
                name: field.name
              }
            });
          }
        });
      });
      
      setValidationErrors(errors);
      setValidationLoading(false);
      
      // Save the validation results to the project
      handleSaveProject(tables, triggers, functions, comments, tasks, true);
      
      if (errors.length === 0) {
        setStatusMessage({
          status: 'success',
          message: 'Schema validation passed!'
        });
      } else {
        const errorCount = errors.filter(e => e.type === 'error').length;
        const warningCount = errors.filter(e => e.type === 'warning').length;
        
        setStatusMessage({
          status: errorCount > 0 ? 'error' : 'warning',
          message: `Found ${errors.length} validation issues (${errorCount} errors, ${warningCount} warnings)`
        });
      }
    }, 800); // Simulate processing time
  };
  
  // Navigate to element handler
  const handleNavigateToElement = (elementType: string, elementId: string) => {
    // Set view mode to diagram for navigation
    setViewMode('diagram');
    
    // Find the element and select/focus on it
    if (elementType === 'table') {
      const table = tables.find(t => t.id === elementId);
      if (table) {
        setSelectedTable(table);
        setStatusMessage({
          status: 'info',
          message: `Navigated to table ${table.name}`
        });
      }
    } else if (elementType === 'field') {
      // Find which table contains this field
      for (const table of tables) {
        const field = table.fields.find(f => f.id === elementId);
        if (field) {
          setSelectedTable(table);
          setStatusMessage({
            status: 'info',
            message: `Navigated to field ${field.name} in table ${table.name}`
          });
          break;
        }
      }
    }
    
    // Close the drawer after navigation
    setCommentDrawerOpen(false);
  };

  const handleTablesImported = (importedTables: DatabaseTable[]) => {
    // Update local state first
    setTables(importedTables);
    // Persist using the freshly imported tables to avoid saving an empty array
    handleSaveProject(importedTables, triggers, functions, comments, tasks, true);
  };

  const handleAddTable = () => {
    const newTable: DatabaseTable = {
      id: `table-${Date.now()}`,
      name: `new_table_${tables.length + 1}`,
      fields: [],
      position: {
        x: 100 + tables.length * 50,
        y: 100 + tables.length * 50,
      },
    };
    const updatedTables = [...tables, newTable];
    setTables(updatedTables);
    setSelectedTable(newTable);
    // Don't auto-save, let the auto-save handle it
  };

  const handleDeleteTable = (tableId: string) => {
    const updatedTables = tables.filter((t) => t.id !== tableId);
    setTables(updatedTables);
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
    // Don't auto-save, let the auto-save handle it
  };

  // CRITICAL FIX: Add proper function handler
  const handleAddFunction = (func: any) => {
    console.log('Add function', func);
    const updatedFunctions = [...functions, func];
    setFunctions(updatedFunctions);
    // Auto-save will handle the database update
  };

  // CRITICAL FIX: Add proper trigger handler
  const handleAddTrigger = (trigger: any) => {
    const newTrigger = {
      ...trigger,
      id: `trigger-${Date.now()}`
    };
    setTriggers([...triggers, newTrigger]);
    setHasUnsavedChanges(true);
  };
  
  // Handle updating a trigger
  const handleUpdateTrigger = (updatedTrigger: DatabaseTrigger) => {
    // Update the trigger in state
    setTriggers(prev => prev.map(trigger => 
      trigger.id === updatedTrigger.id ? updatedTrigger : trigger
    ));
    
    // Mark as unsaved
    setHasUnsavedChanges(true);
  };
  
  // Handle deleting a trigger
  const handleDeleteTrigger = (triggerId: string) => {
    // Remove the trigger from state
    setTriggers(prev => prev.filter(trigger => trigger.id !== triggerId));
    
    // Mark as unsaved
    setHasUnsavedChanges(true);
  };

  // CRITICAL FIX: Add proper function handler
  const handleUpdateFunction = (updatedFunction: DatabaseFunction) => {
    // Update the function in state
    setFunctions(prev => prev.map(func => 
      func.id === updatedFunction.id ? updatedFunction : func
    ));
    
    // Mark as unsaved
    setHasUnsavedChanges(true);
  };
  
  // Handle deleting a function
  const handleDeleteFunction = (functionId: string) => {
    // Remove the function from state
    setFunctions(prev => prev.filter(func => func.id !== functionId));
    
    // Mark as unsaved
    setHasUnsavedChanges(true);
  };

  /**
   * Handle reordering of tables via drag and drop
   * Updates the tables state with the new order and marks project as unsaved
   */
  const handleReorderTables = (reorderedTables: DatabaseTable[]) => {
    setTables(reorderedTables);
    setHasUnsavedChanges(true);
    
    // Update status message to indicate the change
    setStatusMessage({
      status: 'info',
      message: 'Table order updated'
    });
  };
  
  // Edit an existing table's data
  const handleEditTable = (tableId: string, data: Partial<DatabaseTable>) => {
    const updatedTables = tables.map(table => 
      table.id === tableId ? { ...table, ...data } : table
    );
    setTables(updatedTables);
    // Don't auto-save, let the auto-save handle it
  };
  
  // Edit a field in a table
  const handleEditField = (tableId: string, fieldId: string, fieldData: Partial<any>) => {
    const updatedTables = tables.map(table => {
      if (table.id === tableId) {
        const updatedFields = table.fields.map(field => 
          field.id === fieldId ? { ...field, ...fieldData } : field
        );
        return { ...table, fields: updatedFields };
      }
      return table;
    });
    setTables(updatedTables);
    // Don't auto-save, let the auto-save handle it
  };
  
  // Delete a field from a table
  const handleDeleteField = (tableId: string, fieldId: string) => {
    const updatedTables = tables.map(table => {
      if (table.id === tableId) {
        return {
          ...table,
          fields: table.fields.filter(field => field.id !== fieldId)
        };
      }
      return table;
    });
    setTables(updatedTables);
    // Don't auto-save, let the auto-save handle it
  };
  
  // Add a new field to a table
  const handleAddField = (tableId: string, field?: any) => {
    const updatedTables = tables.map(table => {
      if (table.id === tableId) {
        const newField = field || {
          id: `field-${Date.now()}`,
          name: `new_field_${table.fields.length + 1}`,
          type: 'VARCHAR',
          nullable: true,
          primaryKey: false,
          unique: false,
          foreignKey: null,
          defaultValue: null
        };
        return {
          ...table,
          fields: [...table.fields, newField]
        };
      }
      return table;
    });
    setTables(updatedTables);
    // Don't auto-save, let the auto-save handle it
  };
  
  // Save canvas changes explicitly
  const handleSaveCanvasChanges = (updatedTables: DatabaseTable[]) => {
    setTables(updatedTables);
    handleSaveProject(updatedTables, triggers, functions, comments, tasks, false);
  };

  /**
   * Save project to Supabase. Accepts optional explicit data to avoid
   * stale closures when state updates are asynchronous.
   * @param updatedTables - Tables data to save
   * @param updatedTriggers - Triggers data to save
   * @param updatedFunctions - Functions data to save
   * @param updatedComments - Comments data to save
   * @param updatedTasks - Tasks data to save
   * @param silent - Whether to show status updates
   * @param customProjectName - Optional custom project name to use
   */
  const [statusMessage, setStatusMessage] = useState<{ status?: StatusType; message?: string }>({});

  const handleSaveProject = (
    updatedTables: DatabaseTable[] = tables,
    updatedTriggers: DatabaseTrigger[] = triggers,
    updatedFunctions: DatabaseFunction[] = functions,
    updatedComments: SchemaComment[] = comments,
    updatedTasks: SchemaTask[] = tasks,
    silent: boolean = false,
    customProjectName?: string
  ) => {
    if (!id) return;
    
    setIsSaving(true);
    if (!silent) {
      setStatusMessage({ status: 'loading', message: 'Saving project...' });
    }
    
    // Update local state
    setTables(updatedTables);
    setTriggers(updatedTriggers);
    setFunctions(updatedFunctions);
    setComments(updatedComments);
    setTasks(updatedTasks);
    
    // Prepare project data for saving
    const projectData = {
      tables: updatedTables,
      triggers: updatedTriggers,
      functions: updatedFunctions,
      comments: updatedComments,
      tasks: updatedTasks,
      mockups: mockups, // Save mockups with project
      validationErrors: validationErrors // Save validation errors with project
    };
    
    // Call API to update project
    updateProject(id, { 
      name: customProjectName !== undefined ? customProjectName : projectName, 
      project_data: projectData 
    })
      .then(() => {
        // Update the current project in memory to match what we just saved
        // This ensures that our change detection works correctly
        if (currentProject) {
          currentProject.project_data = projectData;
        }
        
        setIsSaving(false);
        setHasUnsavedChanges(false);
        setLastSavedTime(new Date());
        
        if (!silent) {
          setStatusMessage({ status: 'success', message: 'Project saved successfully' });
        }
      })
      .catch(error => {
        setIsSaving(false);
        console.error('Failed to save project:', error);
        setStatusMessage({ status: 'error', message: 'Failed to update project' });
      });
  };

  // Save immediately when project name changes
  const handleProjectNameChange = (name: string) => {
    setProjectName(name);
    // Save project name change immediately without debouncing
    // Pass the new name directly to avoid stale closure issues
    handleSaveProject(tables, triggers, functions, comments, tasks, false, name);
  };


  
  // Comment thread functionality - open comment drawer
  const handleOpenCommentDrawer = () => {
    if (!leftPanelOpen && rightPanelOpen) {
      setRightPanelOpen(false);
    }
    setLeftPanelOpen(!leftPanelOpen);
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Project not found</p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="shrink-0">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Projects</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <SaveStatus 
                status={statusMessage.status as StatusType}
                message={statusMessage.message}
                isSaving={isSaving} 
                isSaved={!hasUnsavedChanges} 
                className="hidden sm:flex"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveProject()}
                className="h-8"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Badge variant="secondary" className="hidden sm:flex">
                {tables.length} tables
              </Badge>
              
              {/* Comments & Tasks Drawer */}
              <CommentTaskDrawer 
                comments={comments}
                tasks={tasks}
                onMarkCommentRead={handleMarkCommentRead}
                onMarkTaskComplete={handleMarkTaskComplete}
                onNavigateToElement={handleNavigateToElement}
                onConvertCommentToTask={handleConvertCommentToTask}
                onReplyToComment={handleReplyToComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                open={commentDrawerOpen}
                onOpenChange={setCommentDrawerOpen}
              />
              
              {/* View Mode Toggle */}
              <div className="border rounded-md flex items-center overflow-hidden">
                <Button 
                  variant={viewMode === 'diagram' ? "secondary" : "ghost"} 
                  size="sm" 
                  className={`h-8 rounded-none px-2 ${viewMode === 'diagram' ? 'bg-muted' : ''}`}
                  onClick={() => setViewMode('diagram')}
                >
                  <Layers className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Diagram</span>
                </Button>
                <Button 
                  variant={viewMode === 'table' ? "secondary" : "ghost"} 
                  size="sm" 
                  className={`h-8 rounded-none px-2 ${viewMode === 'table' ? 'bg-muted' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  <Grid className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Table</span>
                </Button>
              </div>
              
              {/* Mobile toggle buttons */}
              {isMobile && (
                <>
                  <Button variant="outline" size="sm" onClick={toggleLeftPanel}>
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleRightPanel}>
                    <PanelRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isMobile ? (
        // Mobile Layout - Slide-in panels
        <div className="flex h-[calc(100vh-80px)] relative">
          {/* Left Sidebar - Mobile slide-in */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out ${leftPanelOpen ? 'translate-x-0' : '-translate-x-full'}
            border-r bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30 overflow-hidden
          `}>
            {/* Close button for mobile */}
            <div className="absolute top-4 right-4 z-10">
              <Button variant="ghost" size="sm" onClick={() => setLeftPanelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <DatabaseSidebar
              tables={tables}
              triggers={triggers}
              functions={functions}
              selectedTable={selectedTable}
              projectId={id}
              onAddTable={handleAddTable}
              onAddTrigger={handleAddTrigger}
              onAddFunction={handleAddFunction}
              onSelectTable={setSelectedTable}
              onDeleteTable={handleDeleteTable}
              onSaveProject={handleSaveProject}
              projectName={projectName}
              onProjectNameChange={handleProjectNameChange}
              onReorderTables={handleReorderTables}
            />
          </div>

          {/* Main Canvas - Mobile */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <DatabaseCanvas
                tables={tables}
                setTables={setTables}
                selectedTable={selectedTable}
                setSelectedTable={setSelectedTable}
                onAddTable={handleAddTable}
                onDeleteTable={handleDeleteTable}
                onEditTable={handleEditTable}
                onEditField={handleEditField}
                onDeleteField={handleDeleteField}
                onAddField={handleAddField}
                onSave={handleSaveCanvasChanges}
                onAddComment={handleAddComment}
                onMarkAsTask={handleMarkAsTask}
                onNavigateToElement={handleNavigateToElement}
              />
            </div>
          </div>

          {/* Right Panel - Mobile slide-in */}
          <div className={`
            fixed inset-y-0 right-0 z-50 w-96 transform transition-transform duration-300 ease-in-out ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}
            border-l bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30 overflow-hidden
          `}>
            {/* Close button for mobile */}
            <div className="absolute top-4 left-4 z-10">
              <Button variant="ghost" size="sm" onClick={() => setRightPanelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Mobile toggle buttons - Floating in canvas */}
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-40">
            <Button variant="outline" size="sm" onClick={toggleLeftPanel} className="shadow-md">
              <PanelLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={toggleRightPanel} className="shadow-md">
              <PanelRight className="h-4 w-4" />
            </Button>
          </div>
          
        </div>
      ) : (
        // Desktop Layout - Resizable panels
        <PanelGroup direction="horizontal" className="h-[calc(100vh-80px)]">
          {/* Left Sidebar - Desktop resizable */}
          <Panel 
            defaultSize={20} 
            minSize={0}
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => setLeftPanelOpen(false)}
            onExpand={() => setLeftPanelOpen(true)}
            className="border-r bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30 overflow-hidden"
          >
            <div ref={leftPanelRef} className="h-full">
              <DatabaseSidebar
                tables={tables}
                triggers={triggers}
                functions={functions}
                selectedTable={selectedTable}
                projectId={id}
                onAddTable={handleAddTable}
                onAddTrigger={handleAddTrigger}
                onAddFunction={handleAddFunction}
                onSelectTable={setSelectedTable}
                onDeleteTable={handleDeleteTable}
                onDeleteTrigger={handleDeleteTrigger}
                onDeleteFunction={handleDeleteFunction}
                onUpdateTrigger={handleUpdateTrigger}
                onUpdateFunction={handleUpdateFunction}
                onSaveProject={handleSaveProject}
                projectName={projectName}
                onProjectNameChange={handleProjectNameChange}
                onReorderTables={handleReorderTables}
              />
            </div>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-2 md:w-3 hover:w-4 cursor-col-resize bg-muted-foreground/10 hover:bg-muted-foreground/40 transition-all relative group">
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-0.5 h-8 bg-muted-foreground/60 rounded-full"></div>
            </div>
          </PanelResizeHandle>

          {/* Main Canvas - Desktop */}
          <Panel defaultSize={60} minSize={30} className="relative">
            {/* Toggle buttons - Only shown when panel is collapsed and only on mobile */}
            {!leftPanelOpen && (
              <div className="absolute top-4 left-4 z-10 md:hidden">
                <Button variant="outline" size="sm" onClick={() => setLeftPanelOpen(true)}>
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {!rightPanelOpen && (
              <div className="absolute top-4 right-4 z-10 md:hidden">
                <Button variant="outline" size="sm" onClick={() => setRightPanelOpen(true)}>
                  <PanelRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="h-full">
              {viewMode === 'diagram' ? (
                <DatabaseCanvas
                  tables={tables}
                  setTables={setTables}
                  selectedTable={selectedTable}
                  setSelectedTable={setSelectedTable}
                  onAddTable={handleAddTable}
                  onDeleteTable={handleDeleteTable}
                  onEditTable={handleEditTable}
                  onEditField={handleEditField}
                  onDeleteField={handleDeleteField}
                  onAddField={handleAddField}
                  onSave={handleSaveCanvasChanges}
                  onAddComment={handleAddComment}
                  onMarkAsTask={handleMarkAsTask}
                  onNavigateToElement={handleNavigateToElement}
                />
              ) : (
                <TableView
                  tables={tables}
                  onTableSelect={setSelectedTable}
                  onTableUpdate={(updatedTables) => {
                    setTables(updatedTables);
                    setHasUnsavedChanges(true);
                  }}
                  onAddTable={handleAddTable}
                  onDeleteTable={handleDeleteTable}
                  onAddComment={(tableName, fieldName) => {
                    // Implement comment functionality
                    console.log(`Add comment for ${tableName}.${fieldName}`);
                    // This would typically open a comment dialog or similar
                  }}
                  selectedTable={selectedTable}
                />
              )}
            </div>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-2 md:w-3 hover:w-4 cursor-col-resize bg-muted-foreground/10 hover:bg-muted-foreground/40 transition-all relative group">
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-0.5 h-8 bg-muted-foreground/60 rounded-full"></div>
            </div>
          </PanelResizeHandle>

          {/* Right Panel - Desktop resizable */}
          <Panel 
            defaultSize={20} 
            minSize={0} 
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => setRightPanelOpen(false)}
            onExpand={() => setRightPanelOpen(true)}
            className="border-l bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30 overflow-hidden"
          >
            <div ref={rightPanelRef} className="h-full">
              {/*
  Right Panel Tabs (Dropdown-Only)
  The right panel uses a dropdown menu for tab selection, ensuring compactness and better spacing.
  The dropdown below is the sole way to switch between right panel tabs.
*/}
<div className="h-full flex flex-col">

            <div className="p-4 pb-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center">
                      {(() => {
                        switch (activeRightPanelTab) {
                          case 'sql':
                            return (
                              <>
                                <Code className="h-4 w-4 mr-2" />
                                SQL
                              </>
                            );
                          case 'properties':
                            return (
                              <>
                                <Palette className="h-4 w-4 mr-2" />
                                Properties
                              </>
                            );
                          case 'validation':
                            return (
                              <>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Validation
                              </>
                            );
                          case 'mockups':
                            return (
                              <>
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Mockups
                              </>
                            );
                          case 'comments':
                            return (
                              <>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Comments
                              </>
                            );
                          default:
                            return (
                              <>
                                <Code className="h-4 w-4 mr-2" />
                                SQL
                              </>
                            );
                        }
                      })()} 
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem onClick={() => setActiveRightPanelTab('sql')}>
                    <Code className="h-4 w-4 mr-2" />
                    SQL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveRightPanelTab('properties')}>
                    <Palette className="h-4 w-4 mr-2" />
                    Properties
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveRightPanelTab('validation')}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Validation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveRightPanelTab('mockups')}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Mockups
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveRightPanelTab('comments')}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* SQL Tab Content */}
{activeRightPanelTab === 'sql' && (
  <div className="flex-1 p-4 pt-2">
    <SQLEditor onTablesImported={handleTablesImported} currentTables={tables} />
  </div>
)}

            {/* Properties Tab Content */}
{activeRightPanelTab === 'properties' && (
  <div className="flex-1 p-4 pt-2">
    <div className="h-full">
      {selectedTable ? (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Table Properties</h3>
            <p className="text-sm text-muted-foreground">
              Configure {selectedTable.name} table settings
            </p>
          </div>
          {/* Table properties form would go here */}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a table to edit properties</p>
        </div>
      )}
    </div>
  </div>
)}
            
            {/* 
              ValidationPanel Tab - Shows schema validation issues
              Displays errors and warnings for the current project schema
              Allows users to refresh validation and navigate to problematic elements
              Provides suggestions for fixing issues
            */}
            {/* Validation Tab Content */}
{activeRightPanelTab === 'validation' && (
  <div className="flex-1 p-4 pt-2 overflow-auto">
    <div className="h-full">
      <ValidationPanel
        errors={validationErrors}
        onRefreshValidation={handleRefreshValidation}
        onNavigateToElement={handleNavigateToElement}
        loading={validationLoading}
      />
    </div>
  </div>
)}
            
            {/* Mockups Tab Content */}
{activeRightPanelTab === 'mockups' && (
  <div className="flex-1 p-4 pt-2 overflow-auto">
    <MockupsPanel mockups={mockups} onMockupsChange={setMockups} projectId={id || ''} />
  </div>
)}
            
            {/* Comments Tab Content */}
{activeRightPanelTab === 'comments' && (
  <div className="flex-1 p-4 pt-2 overflow-auto">
    <UnifiedCommentsPanel 
      projectId={id || ''}
      onNavigateToObject={(objectType, objectId, parentObjectId) => {
        // Handle navigation to different object types
        if (objectType === 'table') {
          const table = tables.find(t => t.id === objectId || t.name === objectId);
          if (table) {
            setSelectedTable(table);
            setViewMode('diagram');
          }
        } else if (objectType === 'field') {
          // Find which table contains this field
          for (const table of tables) {
            const field = table.fields.find(f => f.id === objectId || f.name === objectId);
            if (field && (!parentObjectId || table.name === parentObjectId || table.id === parentObjectId)) {
              setSelectedTable(table);
              setViewMode('diagram');
              break;
            }
          }
        } else if (objectType === 'function') {
          // Navigate to function in sidebar
          // This would typically open the function modal or highlight it in the sidebar
          const func = functions.find(f => f.id === objectId || f.name === objectId);
          if (func) {
            // Implement function navigation (could open a modal)
            toast.info(`Navigated to function: ${func.name}`);
          }
        } else if (objectType === 'trigger') {
          // Navigate to trigger in sidebar
          const trigger = triggers.find(t => t.id === objectId || t.name === objectId);
          if (trigger) {
            // Implement trigger navigation (could open a modal)
            toast.info(`Navigated to trigger: ${trigger.name}`);
            // If trigger has a table, select that table
            const table = tables.find(t => t.name === trigger.table_name);
            if (table) {
              setSelectedTable(table);
            }
          }
        } else if (objectType === 'policy') {
          // Navigate to RLS policy
          // This would typically open the policy modal or highlight it in the sidebar
          toast.info(`Navigated to RLS policy: ${objectId}`);
          // If policy has a table, select that table
          if (parentObjectId) {
            const table = tables.find(t => t.name === parentObjectId || t.id === parentObjectId);
            if (table) {
              setSelectedTable(table);
            }
          }
        } else if (objectType === 'mockup') {
          // Navigate to mockup tab and potentially highlight the specific mockup
          const tabsList = document.querySelector('[role="tablist"]');
          const mockupsTab = tabsList?.querySelector('[value="mockups"]');
          if (mockupsTab instanceof HTMLElement) {
            mockupsTab.click();
            toast.info(`Navigated to mockup: ${objectId}`);
          }
        }
      }}
    />  
  </div>
)}

            </div>
          </div>
        </Panel>
      </PanelGroup>
      )}

    {/* Mobile backdrop - Only shown on mobile */}
    {isMobile && (leftPanelOpen || rightPanelOpen) && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40" 
        onClick={() => {
          setLeftPanelOpen(false);
          setRightPanelOpen(false);
        }} 
      />
    )}
    </div>
  );
};

export default ProjectEditor;