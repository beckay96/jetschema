import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function AuthenticatedApp() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user && location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route 
        path="/" 
        element={
          user ? (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
              {/* Header with user info */}
              <header className="bg-card/50 backdrop-blur border-b px-4 py-3">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      Database Designer Pro
                    </h1>
                    <Badge variant="secondary" className="text-xs">
                      Beta
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{user.email}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={signOut}
                      className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </header>

              {/* Main app content */}
              <Index />
            </div>
          ) : null
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthenticatedApp />
    </BrowserRouter>
  );
};

export default App;
