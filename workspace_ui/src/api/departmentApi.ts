import { supabase } from '../supabaseClient';
import type { Department } from '../types';

export const departmentApi = {
  async getAll(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data ?? []) as Department[];
  },

  async create(input: { name: string; code: string; description?: string }): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .insert([{
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        description: input.description?.trim() || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Department;
  },
};
