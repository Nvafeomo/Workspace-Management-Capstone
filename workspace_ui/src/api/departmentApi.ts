import { supabase } from '../supabaseClient';
import type { Department } from '../types';

/** Supabase-backed helpers for reading and creating departments. */
export const departmentApi = {
  /** Returns all departments ordered alphabetically by name. */
  async getAll(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data ?? []) as Department[];
  },

  /**
   * Creates a department. Name and description are trimmed, the code is
   * trimmed and uppercased, and an empty description is stored as null.
   */
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
