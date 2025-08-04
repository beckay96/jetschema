import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Database, ArrowRight, Code, CheckCircle, Layers } from "lucide-react";

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  // Redirect authenticated users to projects
  if (user) {
    navigate("/projects");
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">JetSchema</span>
          </div>
          
          <nav className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/auth")}
            >
              Log in
            </Button>
            <Button 
              onClick={() => navigate("/auth?signup=true")}
            >
              Sign up
            </Button>
          </nav>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-20 md:py-32 container">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            JetSchema is your visual backend planning tool.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Design smarter. Validate instantly. Export real code.
          </p>
          
          <Button 
            size="lg" 
            className="gap-2 text-lg px-8 py-6" 
            onClick={() => navigate("/auth?signup=true")}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            Get Started
            <ArrowRight className={`h-5 w-5 transition-transform ${isHovered ? 'transform translate-x-1' : ''}`} />
          </Button>
        </div>
      </section>
      
      {/* Value Proposition */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6">
              Planning your backend shouldn't feel like guesswork.
            </h2>
            <p className="text-xl text-muted-foreground mb-12 text-center">
              With JetSchema, you can design schemas, validate logic, and export production-ready SQL—all from a beautiful, intuitive interface.
              No more clunky diagrams. No more manual rewrites. Just structure that works.
            </p>
          </div>
          
          {/* New Marketing Sections */}
          <div className="max-w-4xl mx-auto mt-16 grid md:grid-cols-3 gap-10">
            <div className="bg-background/50 p-6 rounded-lg border shadow-sm">
              <div className="text-2xl mb-3">💬</div>
              <h3 className="text-xl font-bold mb-3">From Comment to Action.</h3>
              <p className="text-muted-foreground">
                Every table, field, or sticker comment in JetSchema can be turned into a task—so no idea gets lost and no fix is forgotten.
              </p>
            </div>
            
            <div className="bg-background/50 p-6 rounded-lg border shadow-sm">
              <div className="text-2xl mb-3">✅</div>
              <h3 className="text-xl font-bold mb-3">Track What's Done, Right Where You Planned It.</h3>
              <p className="text-muted-foreground">
                Mark tables and fields as uploaded. Stay in sync without needing a checklist app on the side.
              </p>
            </div>
            
            <div className="bg-background/50 p-6 rounded-lg border shadow-sm">
              <div className="text-2xl mb-3">🧠</div>
              <h3 className="text-xl font-bold mb-3">Plan it. Discuss it. Build it. All in one place.</h3>
              <p className="text-muted-foreground">
                No more Sheets, Slack threads, and Notion templates. JetSchema brings planning and doing into a single, beautiful workspace.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Visual Schema Design</h3>
              <p className="text-muted-foreground">
                Create and modify database schemas with an intuitive drag-and-drop interface. See relationships clearly with visual connections.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Instant Validation</h3>
              <p className="text-muted-foreground">
                Get real-time feedback on your schema design. Catch problems early and ensure your data structure is solid.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Code Export</h3>
              <p className="text-muted-foreground">
                Generate production-ready SQL, Prisma schema, or Typescript types with one click. Coming soon: more export options.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Coming Soon Section */}
      <section className="py-20 container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Coming Soon</h2>
          <p className="text-xl text-muted-foreground mb-10">
            We're constantly improving JetSchema with new features and integrations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background border">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Supabase SQL Export</h3>
                <p className="text-sm text-muted-foreground">Generate SQL optimized for Supabase</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background border">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Prisma Schema</h3>
                <p className="text-sm text-muted-foreground">Export Prisma-compatible schemas</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background border">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Zod Types</h3>
                <p className="text-sm text-muted-foreground">Generate Zod validation schemas</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background border">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">JSON Schema</h3>
                <p className="text-sm text-muted-foreground">Export standards-compliant JSON Schema</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background border">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Team Sharing & Comments</h3>
                <p className="text-sm text-muted-foreground">Collaborate with your team in real-time</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background border">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Version Snapshots</h3>
                <p className="text-sm text-muted-foreground">Save and restore schema states over time</p>
              </div>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="mt-12"
            onClick={() => navigate("/auth?signup=true")}
          >
            Join the waitlist
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Database className="h-5 w-5 text-primary" />
              <span className="font-bold">JetSchema</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} JetSchema. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
