import { MessageCircle } from 'lucide-react';
import { FeedbackLauncher } from '../components/FeedbackLauncher';
import { useAuth } from '../contexts/AuthContext';

export const GiveFeedbackPage = () => {
  const { globalRole } = useAuth();

  if (globalRole === 'ADMIN' || globalRole === 'MASTER') {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Give Feedback</h1>
          <p className="text-slate-500 mt-2 text-lg">This page is available to non-admin users only.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Give Feedback</h1>
        <p className="text-slate-500 mt-2 text-lg">
          Share your thoughts: bugs, ideas, or anything on your mind.
        </p>
      </header>

      <section className="bg-white rounded-3xl border border-slate-200 p-8 max-w-2xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MessageCircle size={22} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">Tell us what you think</h2>
            <p className="text-slate-500 mt-1 mb-5">
              Click the button below to give feedback and help us improve our app! We read every message and appreciate your input.
            </p>
            <FeedbackLauncher buttonClassName="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors" />
          </div>
        </div>
      </section>
    </div>
  );
};