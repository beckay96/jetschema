import React, { useState } from 'react';
import { useStripe } from '@/contexts/StripeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Sparkles, RefreshCw, Database, Code, FileText } from 'lucide-react';
import { PremiumFeatureIndicator } from './PremiumFeatureIndicator';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AIFeatures() {
  const { canUseAIFeatures } = useStripe();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState('schema');

  // Mock AI generation function
  const generateWithAI = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setResult('');

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    let generatedResult = '';

    switch (activeTab) {
      case 'schema':
        generatedResult = `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
        break;
      case 'optimize':
        generatedResult = `
OPTIMIZATION RECOMMENDATIONS:

1. Add indexes to foreign keys:
   - CREATE INDEX idx_posts_user_id ON posts(user_id);
   - CREATE INDEX idx_comments_post_id ON comments(post_id);
   - CREATE INDEX idx_comments_user_id ON comments(user_id);

2. Add composite index for common query patterns:
   - CREATE INDEX idx_posts_published_created_at ON posts(published, created_at);

3. Consider adding a GIN index for full-text search on posts content:
   - CREATE INDEX idx_posts_content_search ON posts USING gin(to_tsvector('english', content));

4. Add partial index for published posts:
   - CREATE INDEX idx_published_posts ON posts(created_at) WHERE published = true;
`;
        break;
      case 'docs':
        generatedResult = `
# Database Schema Documentation

## Users Table
Stores user account information.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key identifier |
| username | VARCHAR(50) | Unique username for login |
| email | VARCHAR(100) | User's email address for notifications |
| password_hash | VARCHAR(255) | Securely hashed password |
| created_at | TIMESTAMP | When the account was created |
| updated_at | TIMESTAMP | When the account was last updated |

## Posts Table
Stores blog posts or articles created by users.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key identifier |
| user_id | INTEGER | Foreign key to users table |
| title | VARCHAR(100) | Post title |
| content | TEXT | Main content of the post |
| published | BOOLEAN | Whether the post is publicly visible |
| created_at | TIMESTAMP | When the post was created |
| updated_at | TIMESTAMP | When the post was last updated |

## Comments Table
Stores user comments on posts.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key identifier |
| post_id | INTEGER | Foreign key to posts table |
| user_id | INTEGER | Foreign key to users table |
| content | TEXT | Comment content |
| created_at | TIMESTAMP | When the comment was created |
`;
        break;
      default:
        generatedResult = 'No content generated for this tab.';
    }

    setResult(generatedResult);
    setIsGenerating(false);
    toast.success('AI generation complete!');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">AI-Powered Features</h2>
        </div>
      </div>

      <PremiumFeatureIndicator feature="ai" showLock={!canUseAIFeatures}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generate with AI</CardTitle>
            <CardDescription>
              Use AI to generate schema, optimize your database, or create documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="schema" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="schema" className="flex items-center gap-1.5">
                  <Database className="h-4 w-4" />
                  <span>Schema</span>
                </TabsTrigger>
                <TabsTrigger value="optimize" className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4" />
                  <span>Optimize</span>
                </TabsTrigger>
                <TabsTrigger value="docs" className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span>Docs</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-4 space-y-4">
                <Textarea
                  placeholder={
                    activeTab === 'schema'
                      ? "Describe the database schema you want to create (e.g., 'Create a blog database with users, posts, and comments')"
                      : activeTab === 'optimize'
                      ? "Describe your database usage patterns for optimization suggestions"
                      : "Describe what documentation you need for your database schema"
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
                
                <div className="flex justify-end">
                  <Button 
                    onClick={generateWithAI} 
                    disabled={isGenerating || !prompt.trim()}
                    className="gap-1.5"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
                
                {result && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Generated {activeTab === 'schema' ? 'Schema' : activeTab === 'optimize' ? 'Optimization Tips' : 'Documentation'}</h3>
                    <div className="bg-muted/50 rounded-md p-4 overflow-auto max-h-[400px]">
                      <pre className="text-sm whitespace-pre-wrap font-mono">{result}</pre>
                    </div>
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
          <CardFooter className="bg-muted/30 text-xs text-muted-foreground">
            AI-generated content is provided as a starting point and may require adjustments.
          </CardFooter>
        </Card>
      </PremiumFeatureIndicator>
    </div>
  );
}
