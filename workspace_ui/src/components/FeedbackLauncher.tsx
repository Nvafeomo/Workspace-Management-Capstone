import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { feedbackApi } from '../api/feedbackApi';

interface FeedbackLauncherProps {
  buttonClassName?: string;
}

export function FeedbackLauncher({ buttonClassName }: FeedbackLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = message.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await feedbackApi.submit(trimmed);
      setMessage('');
      setIsOpen(false);
      alert('Thanks for the feedback.');
    } catch (error: any) {
      console.error('Feedback submit failed:', error);
      alert(error?.message ? `Could not submit feedback right now: ${error.message}` : 'Could not submit feedback right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClassName ?? 'w-full mt-4 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors'}
      >
        Give feedback
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Give feedback">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-slate-600 leading-relaxed">
            Share your thoughts: bugs, ideas, or anything on your mind.
          </p>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your feedback here..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setMessage('');
                setIsOpen(false);
              }}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || message.trim().length === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Submit
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}