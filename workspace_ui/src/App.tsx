console.log('workspaceApi loaded from app.tsx');
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { WorkspacePage } from './pages/Workspace';
import { ResourcePage } from './pages/Resource';
import { Approvals } from './pages/Approvals';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workspace/:id" element={<WorkspacePage />} />
          <Route path="/resource/:id" element={<ResourcePage />} />
          <Route path="/approvals" element={<Approvals />} />
        </Routes>
      </Layout>
    </Router>
  );
}
