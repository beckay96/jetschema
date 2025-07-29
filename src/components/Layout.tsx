import { Database } from "lucide-react";
import { HeaderMenu } from "./HeaderMenu";
import { ThemeToggle } from "./ThemeToggle";

type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header with theme toggle and user menu */}
      <header className="bg-card/50 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 flex-1">
            <Database className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">JetSchema</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HeaderMenu />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full px-4">
        {children}
      </main>
    </div>
  );
}
