import { useEffect, useState } from 'react';
import { borrowApi } from '../api/borrowApi';
import { workspaceApi } from '../api/workspaceApi';
import { useAuth } from '../contexts/AuthContext';
import { BorrowRequest } from '../types';
import { 
  Check, 
  X, 
  User, 
  Box, 
  Calendar,
  Loader2,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Approvals = () => {
  const { user, globalRole } = useAuth();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadApprovals = async () => {
      try {
        // master sees all pending requests
        if (globalRole === 'MASTER') {
          const data = await borrowApi.getApprovals();
          setRequests(data.filter(r => r.status === 'PENDING'));
          setLoading(false);
          return;
        }

        // admins and approvers only see requests for their workspaces
        const approverWorkspaces = await workspaceApi.getApproverWorkspaces(user.id);
        console.log('approver workspaces:', approverWorkspaces);

        if (approverWorkspaces.length === 0) {
          setRequests([]);
          setLoading(false);
          return;
        }

        const data = await borrowApi.getApprovals();
        console.log('all approvals:', data);

        // filter to only show requests for workspaces the user is admin/approver of
        const filtered = data.filter(r => {
          const workspaceIds = r.resource?.workspace_resource?.map((wr: any) => wr.workspace_id) ?? [];
          return workspaceIds.some((wsId: string) => approverWorkspaces.includes(wsId));
        });
        setRequests(filtered.filter(r => r.status === 'PENDING'));
        setLoading(false);
      } catch (error) {
        console.error('loadApprovals error:', error);
        setLoading(false);
      }
    };

    loadApprovals();
  }, [user?.id, globalRole]);

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      await borrowApi.updateStatus(id, status);
      setRequests(prev => prev.filter(r => r.id !== id));
      alert(`Request ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Loading pending approvals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pending Approvals</h1>
        <p className="text-slate-500 mt-2 text-lg">Review and manage resource borrowing requests from users.</p>
      </header>

      {requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Inbox size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
          <p className="text-slate-500 mt-2">There are no pending borrow requests to review at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {requests.map((req) => (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <Box size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-lg">{req.resource?.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        <span className="font-medium text-slate-700">{req.users?.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        <span>Requested on {new Date(req.request_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAction(req.id, 'REJECTED')}
                    disabled={processingId === req.id}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'APPROVED')}
                    disabled={processingId === req.id}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {processingId === req.id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Check size={18} />
                    )}
                    Approve
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
