//functions for resources

import { Resource } from '../types';
import { supabase } from '../supabaseClient';

export const resourceApi = {

  // NEW: Robust Delete Function
  // Deletes all dependencies first to prevent foreign key errors
  delete: async (id: string): Promise<void> => {

    //get status from database
    const statusResult = await supabase
      .from('resource')
      .select('status')
      .eq('id', id)
      .single();

    if (statusResult.error) throw statusResult.error;

    //cant delete if borrowed or requested
    if (statusResult.data.status === 'BORROWED' || statusResult.data.status === 'REQUESTED') {
      throw new Error(`Cannot delete a resource with status "${statusResult.data.status}". It must be returned first.`);
    }

    // 1. DELETE REQUESTS
    // Remove any borrow requests linked to this resource
    const { error: reqError } = await supabase
        .from('borrow_request')
        .delete()
        .eq('resource_id', id);

    if (reqError) {
      console.error("Failed to clean up requests:", reqError);
      throw reqError;
    }

    // 2. DELETE WORKSPACE LINKS
    // Remove the link between the resource and the workspace
    const { error: linkError } = await supabase
        .from('workspace_resource')
        .delete()
        .eq('resource_id', id);

    if (linkError) {
      console.error("Failed to clean up workspace links:", linkError);
      throw linkError;
    }

    // 3. DELETE THE RESOURCE (The "Parent")
    // Finally, safe to delete the resource itself
    const { error: resError } = await supabase
        .from('resource')
        .delete()
        .eq('id', id);

    if (resError) throw resError;
  },


 // get all resources belonging to a workspace
  getByWorkspace: async (workspaceId: string): Promise<Resource[]> => {
    const { data, error } = await supabase
      .from('workspace_resource')
      .select('resource(*)')
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return data.map((row: any) => row.resource) as Resource[];
  },

  //get resource by id
  //from resource table, select resource where id matches give resource id
  getById: async (id: string): Promise<Resource> => {
    const { data, error } = await supabase
      .from('resource')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Resource;
  },

  //get resource by id with workspace_id (for "Back to Workspace" link when coming from QR scan)
  getByIdWithWorkspace: async (id: string): Promise<{ resource: Resource; workspaceId: string | null }> => {
    const resource = await resourceApi.getById(id);
    const { data: links } = await supabase
      .from('workspace_resource')
      .select('workspace_id')
      .eq('resource_id', id)
      .limit(1);
    const workspaceId = links?.[0]?.workspace_id ?? null;
    return { resource, workspaceId };
  },

  //create resource function
  //add to resource table
  //inserts into resource table first, then links to workspace via workspace_resource
  create: async (resource: Omit<Resource, 'id'>, workspaceId: string): Promise<Resource> => {
    const { data, error } = await supabase
      .from('resource')
      .insert([{
        name: resource.name,
        description: resource.description,
        status: resource.status,
        reqApprovers: resource.reqApprovers,
        minRole: resource.minRole ?? 'MEMBER'
      }])
      .select()
      .single();

    if (error) {
      console.error('resource insert error:', error);
      throw error;
    }

    const { error: linkError } = await supabase
      .from('workspace_resource')
      .insert([{ workspace_id: workspaceId, resource_id: data.id }]);

    if (linkError) {
      console.error('workspace_resource insert error:', linkError);
      throw linkError;
    }

    return data as Resource;
  },

  //update resource status
  //from resource table update status based on resource id
  updateStatus: async (id: string, status: Resource['status']): Promise<Resource> => {
    const { data, error } = await supabase
      .from('resource')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Resource;
  }
};
