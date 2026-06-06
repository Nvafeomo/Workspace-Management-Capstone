import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { WorkspacePage } from './pages/Workspace';
import { Approvals } from './pages/Approvals';
import Signup from './pages/Signup';
import Login from './pages/Login';
import { ManageWorkspace } from './pages/ManageWorkspace';
import { MyResources } from './pages/MyResources';
import { MyReservations } from './pages/MyReservations';
import { GiveFeedbackPage } from './pages/GiveFeedback';
import { ResourcePage } from './pages/Resource';
import { Scan } from './pages/Scan';
import { UserFeedbackPage } from './pages/UserFeedback';
import { AuditLogPage } from './pages/AuditLogPage'; //Audit Log Page
import { ResetPassword } from './pages/ResetPassword'; // Reset Password Page


function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
    );
  }

  if (!user) {
    // After login, send them back to the scanned /resource/… URL (or any protected route they tried to open).
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<Login />} />

                    {/* ADD IT RIGHT HERE! */}
                    <Route path="/reset-password" element={<ResetPassword />} />

                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Routes>
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="/workspace/:id" element={<WorkspacePage />} />
                                        <Route path="/workspace/:id/manage" element={<ManageWorkspace />} />
                                        <Route path="/workspace/:id/audit-logs" element={<AuditLogPage />} />
                                        <Route path="/approvals" element={<Approvals />} />
                                        <Route path="/my-resources" element={<MyResources />} />
                                        <Route path="/my-reservations" element={<MyReservations />} />
                                        <Route path="/give-feedback" element={<GiveFeedbackPage />} />
                                        <Route path="/user-feedback" element={<UserFeedbackPage />} />
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