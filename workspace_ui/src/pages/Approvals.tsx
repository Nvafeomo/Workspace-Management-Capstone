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
  Inbox,
  History,
  ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Approvals = () => {
  const { user, globalRole } = useAuth();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [history, setHistory] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approvalCounts, setApprovalCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.id) return;

    const loadApprovals = async () => {
      try {
        // master sees all pending requests and full history
        if (globalRole === 'MASTER') {
          const [pendingData, historyData] = await Promise.all([
            borrowApi.getApprovals(),
            borrowApi.getHistory()
          ]);
          const filtered = pendingData.filter(r => r.status === 'PENDING');
          setRequests(filtered);

          const counts: Record<string, number> = {};
          await Promise.all(filtered.map(async (req: BorrowRequest) => {
            counts[req.id] = await borrowApi.getApprovalCount(req.id);
          }));
          setApprovalCounts(counts);

          setHistory(historyData);
          setLoading(false);
          return;
        }

        // admins and approvers only see records for their workspaces
        const approverWorkspaces = await workspaceApi.getApproverWorkspaces(user.id);

        if (approverWorkspaces.length === 0) {
          setRequests([]);
          setHistory([]);
          setLoading(false);
          return;
        }

        const [pendingData, historyData] = await Promise.all([
          borrowApi.getApprovals(),
          borrowApi.getHistory()
        ]);

        const isInManagedWorkspace = (record: BorrowRequest) => {
          const workspaceIds = record.resource?.workspace_resource?.map((wr: any) => wr.workspace_id) ?? [];
          return workspaceIds.some((wsId: string) => approverWorkspaces.includes(wsId));
        };

        const filteredPending = pendingData.filter(r => isInManagedWorkspace(r) && r.status === 'PENDING');
        const filteredHistory = historyData.filter(isInManagedWorkspace);

        setRequests(filteredPending);
        const counts: Record<string, number> = {};
        await Promise.all(filteredPending.map(async (req: BorrowRequest) => {
          counts[req.id] = await borrowApi.getApprovalCount(req.id);
        }));
        setApprovalCounts(counts);

        setHistory(filteredHistory);
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
      const updated = await borrowApi.updateStatus(id, status);
      if (updated.status === 'APPROVED' || status === 'REJECTED') {
        // fully approved or rejected, remove from list
        setRequests(prev => prev.filter(r => r.id !== id));
        setHistory(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
      } else {
        // still pending, just update the approval count
        setApprovalCounts(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
      }
      alert(
        status === 'REJECTED'
          ? 'Request rejected.'
          : updated.status === 'APPROVED'
            ? 'Request fully approved!'
            : 'Approval recorded. Waiting for more approvals.'
      );
    } catch (error: any) {
      console.error(error);
      alert(error?.message ?? 'Failed to process request.');
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

  const statusBadgeClass = (status: BorrowRequest['status']) => {
    if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'RETURNED') return 'bg-slate-100 text-slate-700 border-slate-200';
    if (status === 'REJECTED') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

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
            {requests.map((req) => {
              return (
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
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-slate-400" />
                        <span>{approvalCounts[req.id] ?? 0}/{req.resource?.reqApprovers ?? 1} approvals</span>
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
            )})}
          </AnimatePresence>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <History size={20} className="text-slate-500" />
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Accountability History</h2>
        </div>
        <p className="text-slate-500">Who has or had each resource, with request and return timestamps.</p>

        {history.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center">
            <p className="text-slate-500">No history records found for your managed workspaces.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-slate-700">Resource</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-700">User</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-700">Status</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-700">Requested At</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-700">Returned At</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-700">Return Note</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(record => (
                    <tr key={record.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-3 font-medium text-slate-900">{record.resource?.name ?? 'Unknown Resource'}</td>
                      <td className="px-4 py-3 text-slate-700">{record.users?.name ?? 'Unknown User'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadgeClass(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {record.request_date ? new Date(record.request_date).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {record.return_date ? new Date(record.return_date).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 italic">
                        {record.return_note ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
