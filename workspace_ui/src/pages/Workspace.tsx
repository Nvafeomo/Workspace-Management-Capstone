import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workspaceApi } from '../api/workspaceApi';
import { resourceApi } from '../api/resourceApi';
import { borrowApi } from '../api/borrowApi';
import { Workspace, Resource } from '../types';
import { 
  ArrowLeft, 
  Box, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  HandHelping,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { Modal } from '../components/Modal';

const StatusBadge = ({ status }: { status: Resource['status'] }) => {
  const configs = {
    AVAILABLE: { icon: CheckCircle2, text: 'Available', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    BORROWED: { icon: Clock, text: 'Borrowed', className: 'bg-amber-50 text-amber-700 border-amber-100' },
    MAINTENANCE: { icon: AlertCircle, text: 'Maintenance', className: 'bg-rose-50 text-rose-700 border-rose-100' },
    REQUESTED: { icon: Clock, text: 'Requested', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.className}`}>
      <Icon size={12} />
      {config.text}
    </span>
  );
};

export const WorkspacePage = () => {
  const { id } = useParams<{ id: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowingId, setBorrowingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newResource, setNewResource] = useState({ 
    name: '', 
    description: '', 
    reqApprovers: 0  
  });
  const [creating, setCreating] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;

    Promise.all([
      workspaceApi.getById(id),
      resourceApi.getByWorkspace(id),
      user?.id ? workspaceApi.getUserRole(id, user.id) : Promise.resolve(null),
    ]).then(([wsData, resData, role]) => {
      setWorkspace(wsData || null);
      setResources(resData);
      setUserRole(role ?? null);
      setLoading(false);
    });
  }, [id, user?.id]);
  
  const handleQuickBorrow = async (resourceId: string) => {
    if (!user?.id) return;
    setBorrowingId(resourceId);
    try {
      await borrowApi.createRequest(resourceId, user.id);
      // Update local state to show requested
      setResources(prev => prev.map(res => 
        res.id === resourceId ? { ...res, status: 'REQUESTED' } : res
      ));
      alert('Borrow request submitted successfully!');
    } catch (error) {
      console.error(error);
    } finally {
      setBorrowingId(null);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setCreating(true);
    try {
      const created = await resourceApi.create({
        ...newResource,
        status: 'AVAILABLE'
      }, id);
      setResources(prev => [...prev, created]);
      setIsModalOpen(false);
      setNewResource({ name: '', description: '', reqApprovers: 0 });
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
        <p className="text-slate-500 font-medium">Loading resources...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900">Workspace not found</h2>
        <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{workspace.name}</h1>
              {userRole === 'ADMIN' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  Admin
                </span>
              )}
            </div>
            <p className="text-slate-500 mt-2 text-lg max-w-2xl">{workspace.description}</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={20} />
          Add Resource
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {resources.map((res, index) => (
          <motion.div
            key={res.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <div 
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-lg">{res.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{res.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <StatusBadge status={res.status} />
                  {res.reqApprovers > 0 && (
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-1.5 py-0.5 rounded">
                      Approval Req.
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleQuickBorrow(res.id)}
                  disabled={res.status !== 'AVAILABLE' || borrowingId === res.id}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    res.status === 'AVAILABLE'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 active:scale-[0.98]'
                      : res.status === 'REQUESTED'
                      ? 'bg-indigo-50 text-indigo-400 cursor-not-allowed'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {borrowingId === res.id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : res.status === 'REQUESTED' ? (
                    'Requested'
                  ) : (
                    <>
                      <HandHelping size={18} />
                      Borrow
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Resource"
      >
        <form onSubmit={handleAddResource} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Resource Name</label>
            <input
              required
              type="text"
              value={newResource.name}
              onChange={e => setNewResource(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Sony A7III Camera"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Description</label>
            <textarea
              required
              rows={3}
              value={newResource.description}
              onChange={e => setNewResource(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the resource..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Required Approvers</label>
            <input
              type="number"
              min={0}
              value={newResource.reqApprovers}
              onChange={e => setNewResource(prev => ({ ...prev, reqApprovers: parseInt(e.target.value) || 0 }))}
              placeholder="Number of approvers required"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 className="animate-spin" size={20} /> : 'Add Resource'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
