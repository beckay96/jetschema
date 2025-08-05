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
import LandingPage from "./pages/LandingPage";
import { HeaderMenu } from "./components/HeaderMenu";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StripeProvider } from "./contexts/StripeContext";
import { SettingsPage } from "./pages/SettingsPage";
import ProjectDashboard from './pages/ProjectDashboard';
import ProjectMerge from './pages/ProjectMerge';
// MainNavigation removed - consolidated with HeaderMenu
import { AIFeatures } from "./components/subscription/AIFeatures";
import { Toaster } from "sonner";
import { Layout } from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
function AuthenticatedApp() {
  const {
    user,
    signOut,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const publicRoutes = ['/auth', '/']; // Routes accessible without authentication
    if (!loading && !user && !publicRoutes.includes(location.pathname)) {
      navigate('/');
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
  return (
    <ThemeProvider>
      <StripeProvider>
        <Toaster position="top-right" />
        <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/team" element={<Team />} />
        <Route path="/account" element={<Account />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/projects" element={
          <Layout>
            <Projects />
          </Layout>
        } />
        <Route path="/project/:id" element={
          <Layout>
            <ErrorBoundary
              onError={(error) => {
                console.error("Project editor error:", error);
              }}
              fallback={
                <div className="min-h-screen flex items-center justify-center p-6">
                  <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg border text-center">
                    <h2 className="text-xl font-semibold mb-4">Project Loading Error</h2>
                    <p className="mb-6 text-muted-foreground">
                      There was an error loading the project. This could be due to corrupt project data or a temporary issue.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button 
                        onClick={() => window.location.reload()} 
                        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                      >
                        Try Again
                      </button>
                      <a 
                        href="/projects" 
                        className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/90"
                      >
                        Back to Projects
                      </a>
                    </div>
                  </div>
                </div>
              }
            >
              <ProjectEditor />
            </ErrorBoundary>
          </Layout>
        } />
        <Route path="/" element={
          user ? (
            <Layout>
              <Projects />
            </Layout>
          ) : null
        } />
        <Route path="/dashboard" element={
          <Layout>
            <ProjectDashboard />
          </Layout>
        } />
        <Route path="/merge" element={
          <Layout>
            <ProjectMerge />
          </Layout>
        } />
        <Route path="/settings" element={
          <Layout>
            <SettingsPage />
          </Layout>
        } />
        <Route path="/ai-features" element={
          <Layout>
            <div className="container py-10">
              <h1 className="text-3xl font-bold mb-6">AI-Powered Features</h1>
              <AIFeatures />
            </div>
          </Layout>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </StripeProvider>
    </ThemeProvider>
  );
}
const App = () => {
  return (
    <BrowserRouter>
      <StripeProvider>
        <AuthenticatedApp />
      </StripeProvider>
    </BrowserRouter>
  );
};
export default App;