import { Database } from "lucide-react";
import { HeaderMenu } from "./HeaderMenu";
import { ThemeToggle } from "./ThemeToggle";
import { useStripe } from "@/contexts/StripeContext";

type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  // Get subscription status for conditional rendering in menu
  const { isSubscribed } = useStripe();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Single unified header with all navigation elements */}
      <header className="bg-card/50 backdrop-blur px-4 py-3 border-b">
        <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" />
            <div className="border border-purple-500 rounded-full px-2 py-1 text-xs text-purple-300 animate-glow bg-black">Beta</div>
            <h1 className="text-xl font-bold text-foreground">JetSchema</h1>
          </div>
          
          {/* Right side navigation elements */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <HeaderMenu isSubscribed={isSubscribed} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full px-4 max-w-screen-2xl mx-auto">
        {children}
      </main>
    </div>
  );
}
