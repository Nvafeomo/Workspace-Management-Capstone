import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workspaceApi } from '../api/workspaceApi';
import { Workspace } from '../types';
import { ChevronRight, Loader2, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Modal } from '../components/Modal';

export const Dashboard = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    workspaceApi.getAll(user.id)
      .then(data => {
        setWorkspaces(data);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to load workspaces:', err);
        setError(err?.message ?? 'Failed to load workspaces. Check your Supabase connection and .env.local.');
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setCreating(true);
    try {
      const created = await workspaceApi.create(newWorkspace, user.id);
      setWorkspaces(prev => [...prev, created]);
      setIsModalOpen(false);
      setNewWorkspace({ name: '', description: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Loading workspaces...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <p className="text-rose-600 font-medium mb-2">Error loading workspaces</p>
        <p className="text-slate-600 text-sm text-center max-w-md">{error}</p>
        <p className="text-slate-500 text-xs mt-4">Ensure workspace_ui/.env.local has VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Workspaces</h1>
          <p className="text-slate-500 mt-2 text-lg">Select a workspace to manage its resources and equipment.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={20} />
          Create Workspace
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((ws, index) => (
          <motion.div
            key={ws.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link 
              to={`/workspace/${ws.id}`}
              className="group block bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{ws.name}</h3>
                    <p className="text-slate-500 mt-2 line-clamp-2 text-sm leading-relaxed">{ws.description}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Workspace"
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Workspace Name</label>
            <input
              required
              type="text"
              value={newWorkspace.name}
              onChange={e => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Robotics Lab"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Description</label>
            <textarea
              required
              rows={3}
              value={newWorkspace.description}
              onChange={e => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the workspace and its purpose..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 className="animate-spin" size={20} /> : 'Create Workspace'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
