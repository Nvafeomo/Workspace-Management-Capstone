//workspace functions

import { supabase } from '../supabaseClient';
import { Workspace } from '../types';

export const workspaceApi = {

  //get all workspaces so they can be shown in the front end
  async getAll(): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*');

    if (error) throw error;
    return data ?? [];
  },

  //create workspace function
  async create(workspace: { name: string; description: string }): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .insert([workspace])
      .select()
      .single(); 

    if (error) throw error;
    return data;
  },

  //get workspace by id function, used so that we can click on a workspace, get the id, then display that workspace on the front end
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