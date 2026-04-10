import { supabase } from '../supabaseClient';
import { UserFeedback } from '../types';

export const feedbackApi = {
  async submit(message: string): Promise<void> {
    const { error } = await supabase
      .from('user_feedback')
      .insert([{
        message,
      }]);

    if (error) throw error;
  },

  async getAll(): Promise<UserFeedback[]> {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as UserFeedback[];
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_feedback')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};