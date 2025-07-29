import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import ProjectEditor from "./pages/ProjectEditor";
import Account from "./pages/Account";
import { Auth } from "./pages/Auth";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";
import { HeaderMenu } from "./components/HeaderMenu";
import { Database } from "lucide-react";
function AuthenticatedApp() {
  const {
    user,
    signOut,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!loading && !user && location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [user, loading, navigate, location.pathname]);
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }
  return <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/team" element={<Team />} />
      <Route path="/account" element={<Account />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/project/:id" element={<ProjectEditor />} />
      <Route path="/" element={user ? <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
              {/* Header with user info */}
              <header className="bg-card/50 backdrop-blur px-4 py-3">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold" style={{
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            }}>JetSchema</h1>
                  </div>
                  
                  <HeaderMenu />
                </div>
              </header>

              {/* Main app content */}
              <Projects />
            </div> : null} />
      <Route path="*" element={<NotFound />} />
    </Routes>;
}
const App = () => {
  return <BrowserRouter>
      <AuthenticatedApp />
    </BrowserRouter>;
};
export default App;