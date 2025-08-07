import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { JetSchemaLogo } from '@/components/ui/JetSchemaLogo';
// Container component removed as it's not needed
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Zap, Code2, Github, BarChart3, ArrowRight, PanelRight, Check, Sparkles, Database } from 'lucide-react';
/**
 * JetSchema Landing Page
 * Modern and stunning landing page for JetSchema database design tool
 */
const Index = () => {
  const navigate = useNavigate();
  
  // Add subtle parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroElements = document.querySelectorAll('.parallax-hero');
      const featureElements = document.querySelectorAll('.fade-in-feature');
      
      // Parallax effect for hero section
      heroElements.forEach((element) => {
        const el = element as HTMLElement;
        el.style.transform = `translateY(${scrollY * 0.1}px)`;
      });
      
      // Fade in effects for features as they come into view
      featureElements.forEach((element) => {
        const el = element as HTMLElement;
        const elementPosition = el.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.2;
        
        if (elementPosition < screenPosition) {
          el.classList.add('visible');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigate to projects page
  const goToProjects = () => navigate('/projects');

  // Navigate to login page
  const goToLogin = () => navigate('/auth');

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-background via-background/95 to-background/90">
      {/* Header/Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <JetSchemaLogo size="large" />
            <span className="text-xl font-bold tracking-tight">JetSchema</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How It Works</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={goToLogin}>Log In</Button>
            <Button size="sm" onClick={goToLogin}>Sign Up</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-32 relative overflow-hidden">
        <div className="container px-4 relative z-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-40 animate-pulse"></div>
          <div className="absolute -bottom-64 -left-24 w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-30"></div>

          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-700" variant="outline">
              <Sparkles className="h-3 w-3 mr-1" />
              The Modern Database Schema Designer
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Design Your Database With <span className="text-primary">Precision & Ease</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              JetSchema helps you visually design, document, and deploy database schemas without writing a single line of SQL. Perfect for developers and teams.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
              <Button size="lg" onClick={goToProjects} className="group">
                Start Designing
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.location.href = "#demo"}>
                Watch Demo
              </Button>
            </div>

            <div className="mt-8 text-sm text-muted-foreground flex items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-1 text-primary" />
                No credit card required
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-1 text-primary" />
                14-day free trial
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-16 parallax-hero animate-in fade-in duration-1000">
          <div className="w-full max-w-6xl mx-auto px-4 relative">
            <div className="aspect-[16/9] rounded-lg border border-border shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10"></div>
              <img
                src="/screenshots/editor-screenshot.png"
                alt="JetSchema Editor Interface"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/1200x675?text=JetSchema+Editor";
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-2">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything You Need For Database Design</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Powerful tools to design, document, and deploy your database schema with ease.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur fade-in-feature">
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visual Schema Designer</h3>
              <p className="text-muted-foreground">Drag and drop interface to create tables, relationships, and indexes with visual feedback.</p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur fade-in-feature">
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">SQL Code Generation</h3>
              <p className="text-muted-foreground">Automatically generate SQL from your visual designs. Support for PostgreSQL, MySQL, and more.</p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur fade-in-feature">
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Github className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Version Control</h3>
              <p className="text-muted-foreground">Track changes to your schema over time with built-in versioning and Git integration.</p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur fade-in-feature">
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Migration Generation</h3>
              <p className="text-muted-foreground">Generate migration scripts to safely update your database structure in production.</p>
            </Card>

            {/* Feature 5 */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur fade-in-feature">
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <PanelRight className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customizable Interface</h3>
              <p className="text-muted-foreground">Fully customizable layout with resizable panels and dark/light mode support.</p>
            </Card>

            {/* Feature 6 */}
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur fade-in-feature">
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Schema Analytics</h3>
              <p className="text-muted-foreground">Analyze your database design for optimization opportunities and potential issues.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="container px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-2">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple But Powerful Process</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">From concept to deployment in three easy steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center fade-in-feature">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4 mx-auto relative">
                <span className="text-2xl font-bold">1</span>
                <div className="absolute -right-8 -top-1 h-0.5 w-16 bg-border hidden md:block"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Design</h3>
              <p className="text-muted-foreground">Create your database schema visually with our intuitive drag-and-drop interface.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center fade-in-feature">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4 mx-auto relative">
                <span className="text-2xl font-bold">2</span>
                <div className="absolute -right-8 -top-1 h-0.5 w-16 bg-border hidden md:block"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Generate</h3>
              <p className="text-muted-foreground">Automatically generate SQL scripts, migrations, and documentation.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center fade-in-feature">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4 mx-auto">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Deploy</h3>
              <p className="text-muted-foreground">Deploy your schema with confidence using our migration tools or export options.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Ready to Transform Your Database Design Process?</h2>
            <p className="text-xl text-muted-foreground mb-8">Join thousands of developers who are building better databases with JetSchema.</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={goToProjects} className="group">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.location.href = "#pricing"}>
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">JetSchema</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Modern database schema design tool for developers and teams.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tutorials</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Legal</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} JetSchema. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Add custom styles */}
      <style>{`
        .fade-in-feature {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .fade-in-feature.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default Index;