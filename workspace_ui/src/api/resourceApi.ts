import { Resource } from '../types';
import { supabase } from '../supabaseClient';

export const resourceApi = {
  getByWorkspace: async (workspaceId: string): Promise<Resource[]> => {
    const { data, error } = await supabase
      .from('workspace_resource')
      .select('resource(*)')
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return data.map((row: any) => row.resource) as Resource[];
  },

  getById: async (id: string): Promise<Resource> => {
    const { data, error } = await supabase
      .from('resource')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Resource;
  },

  create: async (resource: Omit<Resource, 'id'>, workspaceId: string): Promise<Resource> => {

    console.log('Creating resource:', resource);

    // First insert the resource
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

    console.log('Resource insert result:', data, error);
    if (error) throw error;

    // Then link it to the workspace
    console.log('Linking to workspace:', workspaceId, data.id);
    const { error: linkError } = await supabase
      .from('workspace_resource')
      .insert([{ workspace_id: workspaceId, resource_id: data.id }]);

    console.log('Link result:', linkError);
    if (linkError) throw linkError;

    return data as Resource;
  },


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
