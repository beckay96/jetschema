import { JetSchemaLogo } from "@/components/ui/JetSchemaLogo";
import { HeaderMenu } from "./HeaderMenu";
import { ThemeToggle } from "./ThemeToggle";
import { useStripe } from "@/contexts/StripeContext";
import { InvitationNotifications } from "./notifications/InvitationNotifications";
import { useAuth } from "@/hooks/useAuth";

type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  // Get subscription status for conditional rendering in menu
  const { isSubscribed } = useStripe();
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Single unified header with all navigation elements */}
      <header className="bg-card/50 backdrop-blur px-4 py-3 border-b">
        <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <JetSchemaLogo size="medium" />
            <div className="border border-orange-500 rounded-full px-2 py-1 text-xs text-orange-300 animate-glow bg-black">Beta</div>
            <h1 className="text-xl font-bold text-foreground">JetSchema</h1>
          </div>
          
          {/* Right side navigation elements */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user && <InvitationNotifications />}
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
