import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  Database,
  ArrowRight,
  Code,
  LinkIcon,
  Layers,
  CheckCircle,
  Settings,
  PlusCircle,
  KeyRound,
  Eye,
} from 'lucide-react';

interface HowToStartProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTableClick?: () => void;
}

/**
 * Modal that provides beginner-friendly guidance on how to start a database project
 * Appears when a project has no tables defined yet
 */
export function HowToStartProjectModal({
  open,
  onOpenChange,
  onAddTableClick,
}: HowToStartProjectModalProps) {
  const handleAddTableClick = () => {
    onOpenChange(false);
    if (onAddTableClick) {
      // Small delay to ensure modal closes first
      setTimeout(() => {
        onAddTableClick();
      }, 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            How to Start Your Database Project
          </DialogTitle>
          <DialogDescription className="text-base">
            Welcome to JetSchema! This guide will help you create your first database schema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Getting Started Section */}
          <section>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 text-primary mr-2" />
              Getting Started: The Basics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Table className="h-4 w-4 mr-2 text-primary" />
                    Step 1: Create Your First Table
                  </h4>
                  <p className="text-muted-foreground mb-2">
                    Tables are the foundation of your database. Each table represents a collection of related data.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Click the "Add Table" button in the sidebar</li>
                    <li>Give your table a descriptive name (e.g., "users", "products")</li>
                    <li>Table names should be plural and lowercase</li>
                    <li>Add fields to define what data your table will store</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Layers className="h-4 w-4 mr-2 text-primary" />
                    Step 2: Add Fields to Your Table
                  </h4>
                  <p className="text-muted-foreground mb-2">
                    Fields define what data your table will store. Each field has a name, data type, and optional constraints.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Every table needs an "id" field (usually as a primary key)</li>
                    <li>Choose appropriate data types (e.g., VARCHAR for text, INTEGER for numbers)</li>
                    <li>Add constraints like NOT NULL for required fields</li>
                    <li>Consider adding timestamps like "created_at" and "updated_at"</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Best Practices Section */}
          <section>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 text-primary mr-2" />
              Database Design Best Practices
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2 flex items-center">
                    <KeyRound className="h-4 w-4 mr-2 text-primary" />
                    Primary Keys and Relationships
                  </h4>
                  <p className="text-muted-foreground mb-2">
                    Connect your tables with relationships to model how your data relates to each other.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Every table should have a primary key (typically "id")</li>
                    <li>Use foreign keys to create relationships between tables</li>
                    <li>Common relationships: one-to-many, many-to-many</li>
                    <li>Foreign key fields often end with "_id" (e.g., "user_id")</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Settings className="h-4 w-4 mr-2 text-primary" />
                    Data Types and Constraints
                  </h4>
                  <p className="text-muted-foreground mb-2">
                    Choose appropriate data types and constraints to ensure data integrity.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>VARCHAR</strong>: For text of variable length (names, descriptions)</li>
                    <li><strong>INTEGER</strong>: For whole numbers (counts, IDs)</li>
                    <li><strong>TIMESTAMP</strong>: For dates and times</li>
                    <li><strong>BOOLEAN</strong>: For true/false values</li>
                    <li><strong>UUID</strong>: For unique identifiers</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Example Schema Section */}
          <section>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 text-primary mr-2" />
              Example: Simple Blog Schema
            </h3>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-muted-foreground mb-3">
                Here's an example of a simple blog database with users, posts, and comments:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-2">users</h4>
                    <ul className="text-sm space-y-1">
                      <li><strong>id</strong>: UUID (PK)</li>
                      <li><strong>email</strong>: VARCHAR (Unique)</li>
                      <li><strong>name</strong>: VARCHAR</li>
                      <li><strong>created_at</strong>: TIMESTAMP</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-2">posts</h4>
                    <ul className="text-sm space-y-1">
                      <li><strong>id</strong>: UUID (PK)</li>
                      <li><strong>title</strong>: VARCHAR</li>
                      <li><strong>content</strong>: TEXT</li>
                      <li><strong>user_id</strong>: UUID (FK to users.id)</li>
                      <li><strong>created_at</strong>: TIMESTAMP</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-2">comments</h4>
                    <ul className="text-sm space-y-1">
                      <li><strong>id</strong>: UUID (PK)</li>
                      <li><strong>content</strong>: TEXT</li>
                      <li><strong>post_id</strong>: UUID (FK to posts.id)</li>
                      <li><strong>user_id</strong>: UUID (FK to users.id)</li>
                      <li><strong>created_at</strong>: TIMESTAMP</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Advanced Tips Section */}
          <section>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 text-primary mr-2" />
              Advanced Tips
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Eye className="h-4 w-4 mr-2 text-primary" />
                    Visualization and SQL
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Switch between diagram and table views to see your schema from different perspectives</li>
                    <li>Use the SQL editor to view the generated SQL for your schema</li>
                    <li>Add comments to tables and fields to document your schema</li>
                    <li>Use Row-Level Security (RLS) for enhanced data protection</li>
                    <li>Create indexes on frequently queried fields for better performance</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close for Now
          </Button>
          
          <Button 
            onClick={handleAddTableClick} 
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Create My First Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
