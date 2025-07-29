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
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "./components/Layout";
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
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/team" element={<Team />} />
        <Route path="/account" element={<Account />} />
        <Route path="/projects" element={
          <Layout>
            <Projects />
          </Layout>
        } />
        <Route path="/project/:id" element={
          <Layout>
            <ProjectEditor />
          </Layout>
        } />
        <Route path="/" element={
          user ? (
            <Layout>
              <Projects />
            </Layout>
          ) : null
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
}
const App = () => {
  return <BrowserRouter>
      <AuthenticatedApp />
    </BrowserRouter>;
};
export default App;