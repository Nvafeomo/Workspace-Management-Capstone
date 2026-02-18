import { Workspace } from "./workspace/workspace.entity";
import { User } from "./user/user.entity";
import { Resource } from "./resource/resource.entity";
import { supabase } from '../../supabaseClient'


const gardenTerms = {
  space: "Garden",
  resource: "Tool",
  members: "Gardener"
};

const users: User[] = [
  new User("u1", "Alice", {"space-001": "ADMIN"}),
  new User("u2", "Bob", {"space-001": "MEMBER"})
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
  //insert test user
  const { data: insertData, error: insertError } = await supabase
    .from('users')
    .insert([
      { name: 'Alice'} 
    ])

  if (insertError) {
    console.error('Insert Error:', insertError)
  } else {
    console.log('Inserted User:', insertData)
  }

  //view all users
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('*')

  if (fetchError) {
    console.error('Fetch Error:', fetchError)
  } else {
    console.log('All Users:', users)
  }
}

testUsers()