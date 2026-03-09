import { useEffect, useState } from 'react';
import { borrowApi } from '../api/borrowApi';
import { useAuth } from '../contexts/AuthContext';
import { BorrowRequest } from '../types';
import { 
  Loader2, 
  Inbox,
  Box,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MyResources = () => {
  const { user } = useAuth();
  const [borrows, setBorrows] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState<string | null>(null);

  // load all currently borrowed resources for the user
  useEffect(() => {
    if (!user?.id) return;
    borrowApi.getUserBorrows(user.id).then(data => {
      setBorrows(data);
      setLoading(false);
    });
  }, [user?.id]);

  // return a borrowed resource, updates borrow request and resource status
  const handleReturn = async (borrowId: string, resourceId: string) => {
    if (!window.confirm('Are you sure you want to return this resource?')) return;
    setReturningId(borrowId);
    try {
      await borrowApi.returnResource(borrowId, resourceId);
      // remove from list immediately after return
      setBorrows(prev => prev.filter(b => b.id !== borrowId));
      alert('Resource returned successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to return resource.');
    } finally {
      setReturningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Loading your resources...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Resources</h1>
        <p className="text-slate-500 mt-2 text-lg">Resources you currently have borrowed.</p>
      </header>

      {borrows.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Inbox size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No borrowed resources</h3>
          <p className="text-slate-500 mt-2">You have not borrowed any resources yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {borrows.map((borrow) => (
              <motion.div
                key={borrow.id}
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
                    <h3 className="font-bold text-slate-900 text-lg">{borrow.resource?.name}</h3>
                    <p className="text-sm text-slate-500">
                      Borrowed on {new Date(borrow.request_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleReturn(borrow.id, borrow.resource_id)}
                  disabled={returningId === borrow.id}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {returningId === borrow.id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <RotateCcw size={18} />
                      Return
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};