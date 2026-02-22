
import { supabase } from '../supabaseClient';
import { Workspace } from '../types';

export const workspaceApi = {
  async getAll(): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*');

    if (error) throw error;
    return data ?? [];
  },

  async create(workspace: { name: string; description: string }): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .insert([workspace])
      .select()
      .single(); // returns just the one inserted row

    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

};