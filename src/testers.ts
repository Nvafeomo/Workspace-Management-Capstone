import { Workspace } from "./entities/workspace/workspace.entity";
import { User } from "./entities/user/user.entity";
import { Resource } from "./entities/resource/resource.entity";
import { supabase } from '../supabaseClient'


const gardenTerms = {
  space: "Garden",
  resource: "Tool",
  members: "Gardener"
};

const users: User[] = [
  new User("u1", "Alice"),
  new User("u2", "Bob")
];

const items: Resource[] = [
  new Resource("i1", "Shovel", "A sturdy garden shovel",  5),
  new Resource("i2", "Rake", "Metal rake for soil",  3)
];
/*
const gardenSpace = new Workspace(
  "space-001",
  "A shared space for growing vegetables and herbs.",
  gardenTerms,
  users,
  items,
);

console.log(gardenSpace);
console.log('The role of user 1 is ' + users[0]?.getRole("space-001"));
console.log('The role of user 1 is ' + users[0]?.getRole("space-021"));
console.log('The role of user 5 is ' + users[5]?.getRole("space-001"));

console.log('All roles of user 1 are ' + JSON.stringify(users[0]?.getAllRoles()));
console.log(gardenSpace.getItems());

console.log(gardenSpace.getUsers()[0]?.setId("u3"));
console.log(gardenSpace.getUsers()[0]);
*/

async function testUsers() {
  const { data: insertData, error: insertError } = await supabase
    .from('users')
    .insert([{ name: 'Alice' }])

  if (insertError) {
    console.error('Insert Error:', insertError)
  } else {
    console.log('Inserted User:', insertData)
  }

  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('*')

  if (fetchError) {
    console.error('Fetch Error:', fetchError)
  } else {
    console.log('All Users:', users)
  }
}
async function testResources() {
  const { data: insertData, error: insertError } = await supabase
    .from('resource')
    .insert([{ name: 'Shovel', description: 'A sturdy garden shovel', reqApprovers: 5 }])

  if (insertError) {
    console.error('Insert Error:', insertError)
  } else {
    console.log('Inserted Resource:', insertData)
  }

  const { data: resources, error: fetchError } = await supabase
    .from('resource')
    .select('*')

  if (fetchError) {
    console.error('Fetch Error:', fetchError)
  } else {
    console.log('All resources:', resources)
  }
}
async function testWorkspaces() {
  const { data: insertData, error: insertError } = await supabase
    .from('workspaces')
    .insert([{ name: 'Garden', description: 'A shared space for growing vegetables and herbs.' }])

  if (insertError) {
    console.error('Insert Error:', insertError)
  } else {
    console.log('Inserted Workspace:', insertData)
  }
  const { data: workspaces, error: fetchError } = await supabase
    .from('workspaces')
    .select('*')
    if (fetchError) {
      console.error('Fetch Error:', fetchError)
    } else {
      console.log('All resources:', workspaces)
    }
}
testWorkspaces()
testUsers()