import { supabase } from '../supabaseClient';
import { UserFeedback } from '../types';

/** Supabase-backed helpers for submitting and managing user feedback. */
export const feedbackApi = {
  /** Stores an anonymous feedback message; no submitter details are recorded. */
  async submit(message: string): Promise<void> {
    const { error } = await supabase
      .from('user_feedback')
      .insert([{
        message,
      }]);

    if (error) throw error;
  },

  /** Returns all feedback, newest first. Row-level security limits reads to admins. */
  async getAll(): Promise<UserFeedback[]> {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('id, message, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as UserFeedback[];
  },

  /** Deletes a feedback entry by id. Row-level security limits deletes to admins. */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_feedback')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};