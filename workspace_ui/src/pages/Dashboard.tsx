import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workspaceApi } from '../api/workspaceApi';
import { Workspace } from '../types';
import { Loader2, Plus, Trash2  } from 'lucide-react';
import { motion } from 'motion/react';
import { Modal } from '../components/Modal';

export const Dashboard = () => {
  const { user, globalRole  } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [memberships, setMemberships] = useState<Record<string, string | null>>({}); //membership state
  const [roles, setRoles] = useState<Record<string, string | null>>({});


  //load on render, currently loads all workspaces on render, runs when user?.id changes
  useEffect(() => {
    if (!user?.id) return;

    workspaceApi.getAll()
        .then(async data => {
          setWorkspaces(data);
          setError(null);
          //get membership status for workspaces
          if (user?.id) {
            const membershipMap: Record<string, string | null> = {};
            const roleMap: Record<string, string | null> = {};
            await Promise.all(data.map(async ws => {
              membershipMap[ws.id] = await workspaceApi.getMembership(ws.id, user.id);
              roleMap[ws.id] = await workspaceApi.getUserRole(ws.id, user.id);
            }));
            setMemberships(membershipMap);
            setRoles(roleMap);
          }
        })
        .catch(err => {
          console.error('Failed to load workspaces:', err);
          setError(err?.message ?? 'Failed to load workspaces. Check your Supabase connection and .env.local.');
        })
        .finally(() => setLoading(false));
  }, [user?.id]);

  //create workspace function
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setCreating(true);
    try {
      const created = await workspaceApi.create(newWorkspace, user.id);
      setWorkspaces(prev => [...prev, created]);
      // update memberships state so new workspace shows as approved
      setMemberships(prev => ({ ...prev, [created.id]: 'APPROVED' }));
      setRoles(prev => ({ ...prev, [created.id]: 'ADMIN' })); // set role when creating workspace
      setIsModalOpen(false);
      setNewWorkspace({ name: '', description: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  //function for handling user joining a workspace
  const handleRequestJoin = async (workspaceId: string) => {
    if (!user?.id) return;
    try {
      await workspaceApi.requestJoin(workspaceId, user.id);
      setMemberships(prev => ({ ...prev, [workspaceId]: 'PENDING' }));
    } catch (error) {
      console.error(error);
      alert('Failed to send join request.');
    }
  };

  //delete workspace function
  const handleDeleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${workspaceName}" and all its resources?`)) return;
    try {
      await workspaceApi.delete(workspaceId);
      setWorkspaces(prev => prev.filter(ws => ws.id !== workspaceId));
    } catch (error: any) {
      console.error('Delete workspace failed:', error);
      alert(error?.message ?? 'Failed to delete workspace.');
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
                <div className="block bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{ws.name}</h3>
                        <p className="text-slate-500 mt-2 line-clamp-2 text-sm leading-relaxed">{ws.description}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {(globalRole === 'MASTER' || roles[ws.id] === 'OWNER') && (
                            <button
                                onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
                                title="Delete Workspace"
                            >
                              <Trash2 size={16} />
                            </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      {/* Shows different buttons based on membership status:
                    - APPROVED/APPROVER_PENDING: Enter Workspace button
                    - PENDING: disabled Request Pending button
                    - No membership: Request to Join button
                    - MASTER account always sees Enter Workspace */}
                      {memberships[ws.id] === 'APPROVED' || memberships[ws.id] === 'APPROVER_PENDING' || globalRole === 'MASTER' ? (
                          <Link to={`/workspace/${ws.id}`} className="w-full block text-center py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                            Enter Workspace
                          </Link>
                      ) : memberships[ws.id] === 'PENDING' ? (
                          <button disabled className="w-full py-2 bg-slate-100 text-slate-400 rounded-xl font-bold cursor-not-allowed">
                            Request Pending
                          </button>
                      ) : (
                          <button
                              onClick={() => handleRequestJoin(ws.id)}
                              className="w-full py-2 bg-white text-indigo-600 border border-indigo-300 rounded-xl font-bold hover:bg-indigo-50 transition-all"
                          >
                            Request to Join
                          </button>
                      )}
                    </div>
                  </div>
                </div>
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