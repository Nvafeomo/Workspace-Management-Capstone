
import { Workspace } from "../src/entities/workspace/workspace.entity";
import { User } from "../src/entities/user/user.entity";
import { Resource } from "../src/entities/resource/resource.entity";
import { supabase } from './src/supabaseClient'

export async function createWorkspace(name: string, description: string) {
  const newWorkspace = new Workspace(name, description);

  const { data, error } = await supabase
    .from('workspaces')
    .insert([
      {
        name: newWorkspace.name,
        description: newWorkspace.description
      }
    ])
    .select(); // returns the inserted row(s)

  if (error) {
    console.error('Insert Error:', error);
    return null;
  } else {
    console.log('Workspace added:', data);
    return data;
  }
}
/*
(async () => {
  const result = await createWorkspace('Sample', 'Garden');
  console.log('Workspace added:', result);
})();
*/