import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { WorkspacePage } from './pages/Workspace';
import { Approvals } from './pages/Approvals';
import Signup from './pages/Signup';
import Login from './pages/Login';
import {ManageWorkspace} from './pages/ManageWorkspace';
import { MyResources } from './pages/MyResources';
import { ResourcePage } from './pages/Resource';
import { Scan } from './pages/Scan';

/** Pages that need a logged-in user. If not logged in, send them to /login. */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Anyone can open sign up or login */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/workspace/:id" element={<WorkspacePage />} />
                    <Route path="/workspace/:id/manage" element={<ManageWorkspace />} />
                    <Route path="/approvals" element={<Approvals />} />
                    <Route path="/my-resources" element={<MyResources />} />
                    <Route path="/resource/:id" element={<ResourcePage />} />
                    <Route path="/scan" element={<Scan />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
