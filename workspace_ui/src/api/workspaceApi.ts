import { supabase } from '../supabaseClient';
import { Workspace } from '../types';
import type { Role } from '../types';

export const workspaceApi = {
  /**
   * Fetch workspaces the user belongs to (via workspace_users).
   * New users see an empty list until they create or are added to workspaces.
   */
  async getAll(userId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspace_users')
      .select('workspaces(*)')
      .eq('user_id', userId);

    if (error) throw error;

    // Extract workspace objects; Supabase returns { workspaces: {...} } per row
    // (workspaces can be object or array depending on relation type)
    const workspaces = (data ?? []).flatMap((row: { workspaces: Workspace | Workspace[] | null }) => {
      const ws = row.workspaces;
      if (ws == null) return [];
      return Array.isArray(ws) ? ws : [ws];
    }).filter((ws): ws is Workspace => ws != null && 'id' in ws && 'name' in ws);

    // Ensure resourceCount for type compatibility (DB may not have it)
    return workspaces.map(ws => ({
      ...ws,
      resourceCount: ws.resourceCount ?? 0,
    }));
  },

  /**
   * Create a workspace and add the creator as ADMIN in workspace_users.
   */
  async create(
    workspace: { name: string; description: string },
    userId: string
  ): Promise<Workspace> {
    const { data: created, error: insertError } = await supabase
      .from('workspaces')
      .insert([workspace])
      .select()
      .single();

    if (insertError) throw insertError;

    const { error: linkError } = await supabase.from('workspace_users').insert([
      {
        workspace_id: created.id,
        user_id: userId,
        role: 'ADMIN',
        joined: new Date().toISOString(),
      },
    ]);

    if (linkError) throw linkError;

    return { ...created, resourceCount: created.resourceCount ?? 0 };
  },

  //get workspace by id function, used so that we can click on a workspace, get the id, then display that workspace on the front end
  async getById(id: string): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { ...data, resourceCount: data.resourceCount ?? 0 };
  },

  /**
   * Get the current user's role in a workspace (for showing Admin badge, etc.).
   */
  async getUserRole(workspaceId: string, userId: string): Promise<Role | null> {
    const { data, error } = await supabase
      .from('workspace_users')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data.role as Role;
  },
};