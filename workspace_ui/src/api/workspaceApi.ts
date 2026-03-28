import { supabase } from '../supabaseClient';
import { Workspace } from '../types';
import type { Role } from '../types';

export const workspaceApi = {
  /**
   * Fetch workspaces the user belongs to (via workspace_users).
   * New users see an empty list until they create or are added to workspaces.
   */
  //updated to get all workspaces
  async getAll(): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*');

    if (error) throw error;

    // Extract workspace objects; Supabase returns { workspaces: {...} } per row
    // (workspaces can be object or array depending on relation type)
    /*
    const workspaces = (data ?? []).flatMap((row: { workspaces: Workspace | Workspace[] | null }) => {
      const ws = row.workspaces;
      if (ws == null) return [];
      return Array.isArray(ws) ? ws : [ws];
    }).filter((ws): ws is Workspace => ws != null && 'id' in ws && 'name' in ws);
    */

    // Ensure resourceCount for type compatibility (DB may not have it)
    return (data ?? []).map(ws => ({
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
        role: 'OWNER', //changed to owner 
        status: 'APPROVED',
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
  // gets user's membership status in a workspace
  async getMembership(workspaceId: string, userId: string): Promise<string | null> {
      const { data, error } = await supabase
        .from('workspace_users')
        .select('status')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) return null;
      return data?.status ?? null;
    },
  // creates a join request to a workspace
  async requestJoin(workspaceId: string, userId: string): Promise<void> {
      const { error } = await supabase
        .from('workspace_users')
        .insert([{
          workspace_id: workspaceId,
          user_id: userId,
          role: 'MEMBER',
          status: 'PENDING',
          joined: new Date().toISOString()
        }]);

      if (error) throw error;
    },

  // get pending join requests for a workspace
  async getPendingJoinRequests(workspaceId: string): Promise<any[]> {
      const { data, error } = await supabase
        .from('workspace_users')
        .select('*, users(name)')
        .eq('workspace_id', workspaceId)
        .eq('status', 'PENDING');

      if (error) throw error;
      return data ?? [];
    },

  // approve or reject a join request
  async updateJoinRequest(workspaceId: string, userId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
      const { error } = await supabase
        .from('workspace_users')
        .update({ status })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

      if (error) throw error;
    },
  //get members of a workspace
  async getMembers(workspaceId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('workspace_users')
      .select('*, users(name)')
      .eq('workspace_id', workspaceId)
      .in('status', ['APPROVED', 'APPROVER_PENDING']);


    if (error) throw error;
    return data ?? [];
  },
  // request to become an approver in a workspace
  async requestApprover(workspaceId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('workspace_users')
      .update({ status: 'APPROVER_PENDING' })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // get pending approver requests for a workspace
  async getPendingApproverRequests(workspaceId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('workspace_users')
      .select('*, users(name)')
      .eq('workspace_id', workspaceId)
      .eq('status', 'APPROVER_PENDING');

    if (error) throw error;
    return data ?? [];
  },

  // approve or reject an approver request
  async updateApproverRequest(workspaceId: string, userId: string, approve: boolean): Promise<void> {
    const { error } = await supabase
      .from('workspace_users')
      .update({
        role: approve ? 'APPROVER' : 'MEMBER',
        status: 'APPROVED'
      })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // get all workspaces where the user is an approver or admin
  async getApproverWorkspaces(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('workspace_users')
      .select('workspace_id')
      .eq('user_id', userId)
      .in('role', ['APPROVER', 'ADMIN', 'OWNER']);

    if (error) throw error;
    return (data ?? []).map(row => row.workspace_id);
  },

  // get eligible successor candidates (approved members/approvers excluding current admin)
  async getSuccessorCandidates(workspaceId: string, currentUserId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('workspace_users')
      .select('user_id, role, status, users(name)')
      .eq('workspace_id', workspaceId)
      .eq('status', 'APPROVED')
      .in('role', ['MEMBER', 'APPROVER'])
      .neq('user_id', currentUserId);

    if (error) throw error;
    return data ?? [];
  },

  // promote a member/approver to ADMIN as successor
  async assignSuccessor(workspaceId: string, successorUserId: string): Promise<void> {
    const { error } = await supabase
      .from('workspace_users')
      .update({ role: 'ADMIN', status: 'APPROVED' })
      .eq('workspace_id', workspaceId)
      .eq('user_id', successorUserId);

    if (error) throw error;
  },

  // delete a workspace and all its dependencies
  async delete(workspaceId: string): Promise<void> {
    const { data: resourceLinks } = await supabase
      .from('workspace_resource')
      .select('resource_id')
      .eq('workspace_id', workspaceId);

    const resourceIds = (resourceLinks ?? []).map((r: any) => r.resource_id);
    console.log('resource ids to delete:', resourceIds);

    if (resourceIds.length > 0) {
      const { data, error: borrowError } = await supabase
        .from('borrow_request')
        .delete()
        .in('resource_id', resourceIds)
        .select();
      console.log('step 1 - delete borrow requests:', data, borrowError);
      if (borrowError) throw borrowError;
    }

    const { error: linkError } = await supabase
      .from('workspace_resource')
      .delete()
      .eq('workspace_id', workspaceId);
    console.log('step 2 - delete workspace links:', linkError);
    if (linkError) throw linkError;

    if (resourceIds.length > 0) {
      const { error: resourceError } = await supabase
        .from('resource')
        .delete()
        .in('id', resourceIds);
      console.log('step 3 - delete resources:', resourceError);
      if (resourceError) throw resourceError;
    }

    const { error: usersError } = await supabase
      .from('workspace_users')
      .delete()
      .eq('workspace_id', workspaceId);
    console.log('step 4 - delete workspace users:', usersError);
    if (usersError) throw usersError;

    const { error: wsError } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);
    console.log('step 5 - delete workspace:', wsError);
    if (wsError) throw wsError;
  },
  
 //Update a member's role in a workspace
 //Prevents removing the last admin
  async updateMemberRole(workspaceId: string, targetUserId: string, newRole: Role, currentUserId: string): Promise<void> {
  // if transferring ownership, demote current owner to ADMIN first
  if (newRole === 'OWNER') {
    const { error: demoteError } = await supabase
      .from('workspace_users')
      .update({ role: 'ADMIN' })
      .eq('workspace_id', workspaceId)
      .eq('user_id', currentUserId);

    if (demoteError) throw demoteError;
  }

    // if demoting someone from ADMIN, ensure at least one ADMIN or OWNER remains
    if (newRole !== 'ADMIN' && newRole !== 'OWNER') {
      const { data: admins, error: adminCheckError } = await supabase
        .from('workspace_users')
        .select('user_id')
        .eq('workspace_id', workspaceId)
        .in('role', ['ADMIN', 'OWNER'])
        .eq('status', 'APPROVED');

      if (adminCheckError) throw adminCheckError;

      const others = (admins ?? []).filter(a => a.user_id !== targetUserId);
      if (others.length === 0) {
        throw new Error('Cannot change role: at least one admin or owner must remain in the workspace.');
      }
    }

    const { error } = await supabase
      .from('workspace_users')
      .update({ role: newRole, status: 'APPROVED' })
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId);

    if (error) throw error;
  },

  //Leave a workspace
//Blocks if the user is the owner
async leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
  const { data: membership, error: roleError } = await supabase
    .from('workspace_users')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (roleError) throw roleError;

  // if owner, check members and block accordingly
  if (membership.role === 'OWNER') {
    const { data: allMembers, error: membersError } = await supabase
      .from('workspace_users')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'APPROVED');

    if (membersError) throw membersError;

    const otherMembers = (allMembers ?? []).filter(m => m.user_id !== userId);

    if (otherMembers.length === 0) {
      throw new Error('You are the only member in this workspace. Please delete the workspace instead of leaving.');
    } else {
      throw new Error('You must transfer ownership to another member before leaving. You can do this from Manage Members.');
    }
  }

  const { error } = await supabase
    .from('workspace_users')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) throw error;
},

};