import { useEffect, useState } from 'react';
import { MessageSquare, Loader2, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { feedbackApi } from '../api/feedbackApi';
import { UserFeedback } from '../types';

export const UserFeedbackPage = () => {
  const { globalRole } = useAuth();
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this feedback entry? This cannot be undone.');
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await feedbackApi.remove(id);
      setFeedback((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error: any) {
      console.error('Failed to delete feedback:', error);
      alert(error?.message ?? 'Failed to delete feedback.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (globalRole !== 'ADMIN' && globalRole !== 'MASTER') {
      setLoading(false);
      return;
    }

    feedbackApi.getAll()
      .then(setFeedback)
      .catch((error) => {
        console.error('Failed to load feedback:', error);
      })
      .finally(() => setLoading(false));
  }, [globalRole]);

  if (globalRole !== 'ADMIN' && globalRole !== 'MASTER') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <MessageSquare size={28} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Access restricted</h1>
        <p className="text-slate-500 mt-2 max-w-md">Only admins can view the user feedback list.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Feedback</h1>
        <p className="text-slate-500 mt-2 text-lg">Every message users have submitted through the feedback popup.</p>
      </header>

      {feedback.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <MessageSquare size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No feedback yet</h3>
          <p className="text-slate-500 mt-2">Submitted feedback will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {feedback.map((entry) => (
            <article key={entry.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-800">
                    From: Anonymous
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar size={14} />
                    <span>
                      {entry.created_at ? new Date(entry.created_at).toLocaleString() : 'Unknown date'}
                    </span>
                  </div>
                  <p className="text-slate-900 leading-relaxed whitespace-pre-wrap">{entry.message}</p>
                </div>
                <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                  #{entry.id.slice(0, 8)}
                </span>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                >
                  {deletingId === entry.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};