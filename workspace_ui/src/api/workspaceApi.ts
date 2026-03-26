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
        role: 'ADMIN',
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
      .in('role', ['APPROVER', 'ADMIN']);

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

  // remove the current user's membership from a workspace without deleting the workspace
  async leaveWorkspace(
    workspaceId: string,
    userId: string,
    successorUserId?: string
  ): Promise<{ successorId: string | null; autoAssigned: boolean }> {
    let chosenSuccessorId: string | null = successorUserId ?? null;
    let autoAssigned = false;

    const { data: me, error: meError } = await supabase
      .from('workspace_users')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (meError) throw meError;

    if (me?.role === 'ADMIN') {
      const { data: otherAdmins, error: adminsError } = await supabase
        .from('workspace_users')
        .select('user_id')
        .eq('workspace_id', workspaceId)
        .eq('role', 'ADMIN')
        .eq('status', 'APPROVED')
        .neq('user_id', userId);

      if (adminsError) throw adminsError;

      // If this is the last admin, we must assign a successor before leaving.
      if (!otherAdmins || otherAdmins.length === 0) {
        if (!chosenSuccessorId) {
          const { data: approvers, error: approverError } = await supabase
            .from('workspace_users')
            .select('user_id')
            .eq('workspace_id', workspaceId)
            .eq('status', 'APPROVED')
            .eq('role', 'APPROVER')
            .neq('user_id', userId);

          if (approverError) throw approverError;

          const approverIds = (approvers ?? []).map(a => a.user_id);
          if (approverIds.length > 0) {
            const { data: approvedRows, error: approvedError } = await supabase
              .from('borrow_request')
              .select('user_id, resource(workspace_resource(workspace_id))')
              .eq('status', 'APPROVED');

            if (approvedError) throw approvedError;

            const score = new Map<string, number>();
            for (const approverId of approverIds) {
              score.set(approverId, 0);
            }

            for (const row of approvedRows ?? []) {
              const workspaceIds = (row as any)?.resource?.workspace_resource?.map((wr: any) => wr.workspace_id) ?? [];
              if (!workspaceIds.includes(workspaceId)) continue;
              const candidateId = (row as any).user_id as string;
              if (!score.has(candidateId)) continue;
              score.set(candidateId, (score.get(candidateId) ?? 0) + 1);
            }

            chosenSuccessorId = approverIds[0];
            let bestScore = -1;
            for (const [candidateId, candidateScore] of score.entries()) {
              if (candidateScore > bestScore) {
                bestScore = candidateScore;
                chosenSuccessorId = candidateId;
              }
            }
            autoAssigned = true;
          }
        }

        if (!chosenSuccessorId) {
          throw new Error('No eligible successor found. Add an approver or choose a successor before leaving.');
        }

        await workspaceApi.assignSuccessor(workspaceId, chosenSuccessorId);
      }
    }

    const { error } = await supabase
      .from('workspace_users')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) throw error;

    return { successorId: chosenSuccessorId, autoAssigned };
  },

  // delete a workspace and all its dependencies
  async delete(workspaceId: string): Promise<void> {
    //get all resource ids in this workspace
    const { data: resourceLinks } = await supabase
      .from('workspace_resource')
      .select('resource_id')
      .eq('workspace_id', workspaceId);

    const resourceIds = (resourceLinks ?? []).map((r: any) => r.resource_id);

    //delete borrow_requests for those resources
    if (resourceIds.length > 0) {
      const { error: borrowError } = await supabase
        .from('borrow_request')
        .delete()
        .in('resource_id', resourceIds);
      if (borrowError) throw borrowError;
    }

    //delete workspace_resource links
    const { error: linkError } = await supabase
      .from('workspace_resource')
      .delete()
      .eq('workspace_id', workspaceId);
    if (linkError) throw linkError;

    //delete the resources themselves
    if (resourceIds.length > 0) {
      const { error: resourceError } = await supabase
        .from('resource')
        .delete()
        .in('id', resourceIds);
      if (resourceError) throw resourceError;
    }

    //delete workspace_users
    const { error: usersError } = await supabase
      .from('workspace_users')
      .delete()
      .eq('workspace_id', workspaceId);
    if (usersError) throw usersError;

    //delete the workspace itself
    const { error: wsError } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);
    if (wsError) throw wsError;
  },


};