import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, Key, Link, Star, AlertCircle, Database, Lightbulb, Code2 } from 'lucide-react';
import { DataTypePill } from './DataTypePill';
import { DataType, DATA_TYPE_CATEGORIES } from '@/types/database';

export function HelpPopover() {
  const [open, setOpen] = useState(false);

  const constraintExamples = [
    {
      icon: <Key className="h-4 w-4" style={{ color: 'hsl(var(--status-primary-key))' }} />,
      title: "Primary Key (PK)",
      description: "Uniquely identifies each row in a table",
      example: "user_id UUID PRIMARY KEY",
      tips: ["Only one primary key per table", "Cannot be NULL", "Automatically creates unique constraint"]
    },
    {
      icon: <Link className="h-4 w-4" style={{ color: 'hsl(var(--status-foreign-key))' }} />,
      title: "Foreign Key (FK)",
      description: "Links to a primary key in another table",
      example: "user_id REFERENCES users(id)",
      tips: ["Must match existing value in referenced table", "Can have multiple per table", "Enable referential integrity"]
    },
    {
      icon: <Star className="h-4 w-4" style={{ color: 'hsl(var(--status-unique))' }} />,
      title: "Unique",
      description: "Ensures all values in column are different",
      example: "email TEXT UNIQUE",
      tips: ["Can have multiple unique constraints", "NULL values are allowed (unless NOT NULL)", "Creates index automatically"]
    },
    {
      icon: <AlertCircle className="h-4 w-4" style={{ color: 'hsl(var(--status-not-null))' }} />,
      title: "NOT NULL",
      description: "Column cannot contain empty values",
      example: "name TEXT NOT NULL",
      tips: ["Required for primary keys", "Good for essential data", "Prevents incomplete records"]
    }
  ];

  const appTips = [
    "Drag table headers to move tables around the canvas",
    "Use the Table View for quick editing like ClickUp tables",
    "Color-coded data types help identify field purposes at a glance",
    "Foreign keys automatically create visual connections between tables",
    "Use the SQL Editor to import existing schemas quickly",
    "Save your work regularly using the export function",
    "Group related tables by positioning them near each other"
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Help & Tips
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] max-h-[80vh] overflow-auto" side="left">
        <Tabs defaultValue="constraints" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="constraints" className="text-xs">
              <Database className="h-3 w-3 mr-1" />
              Constraints
            </TabsTrigger>
            <TabsTrigger value="datatypes" className="text-xs">
              <Code2 className="h-3 w-3 mr-1" />
              Data Types
            </TabsTrigger>
            <TabsTrigger value="tips" className="text-xs">
              <Lightbulb className="h-3 w-3 mr-1" />
              Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="constraints" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Database Constraints</h3>
              <div className="space-y-3">
                {constraintExamples.map((constraint, index) => (
                  <Card key={index} className="border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {constraint.icon}
                        {constraint.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {constraint.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Badge variant="outline" className="mb-2 font-mono text-xs">
                        {constraint.example}
                      </Badge>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {constraint.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-start gap-1">
                            <span className="text-primary mt-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="datatypes" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Data Types Reference</h3>
              <div className="space-y-4">
                {Object.entries(DATA_TYPE_CATEGORIES).map(([category, types]) => (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm capitalize">{category.toLowerCase()} Types</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2">
                        {types.map((type) => (
                          <DataTypePill key={type} type={type as DataType} size="sm" />
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {category === 'STRING' && "Text data: names, descriptions, emails, etc."}
                        {category === 'NUMBER' && "Numeric data: IDs, quantities, calculations, etc."}
                        {category === 'BOOLEAN' && "True/false values: flags, toggles, status, etc."}
                        {category === 'DATE' && "Time-based data: timestamps, dates, durations, etc."}
                        {category === 'UUID' && "Unique identifiers: primary keys, references, etc."}
                        {category === 'JSON' && "Structured data: configurations, nested objects, etc."}
                        {category === 'BINARY' && "Raw data: files, arrays, binary content, etc."}
                        {category === 'NETWORK' && "Network data: IP addresses, MAC addresses, etc."}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Pro Tips & Tricks</h3>
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {appTips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-sm text-foreground">{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Separator className="my-4" />

              <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs space-y-2 text-foreground">
                    <li>• Always use primary keys for tables</li>
                    <li>• Name fields clearly and consistently</li>
                    <li>• Use foreign keys to maintain data integrity</li>
                    <li>• Consider indexing frequently queried fields</li>
                    <li>• Use appropriate data types for storage efficiency</li>
                    <li>• Document complex relationships with comments</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}