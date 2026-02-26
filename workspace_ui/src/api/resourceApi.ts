//functions for resources

import { Resource } from '../types';
import { supabase } from '../supabaseClient';

export const resourceApi = {
  //get resource function, get resource by workspace id
  //from workspace_resource table, select all resource where workspace_id matches given workspace id
  //workspace_resource table contains workspace and resource id
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
        reqApprovers: resource.reqApprovers
      }])
      .select()
      .single();

    if (error) throw error;

    const { error: linkError } = await supabase
      .from('workspace_resource')
      .insert([{ workspace_id: workspaceId, resource_id: data.id }]);

    if (linkError) throw linkError;

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
