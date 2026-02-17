import { Workspace } from "./workspace/workspace.entity";
import { User } from "./user/user.entity";
import { Item } from "./item/item.entity";

const gardenTerms = {
  space: "Garden",
  item: "Tool",
  members: "Gardener"
};

const users: User[] = [
  new User("u1", "Alice", {"space-001": "ADMIN"}),
  new User("u2", "Bob", {"space-001": "MEMBER"})
];

const items: Item[] = [
  new Item("i1", "Shovel", "A sturdy garden shovel",  5),
  new Item("i2", "Rake", "Metal rake for soil",  3)
];

const gardenSpace = new Workspace(
  "space-001",
  "A shared space for growing vegetables and herbs.",
  gardenTerms,
  users,
  items,
);
/*
console.log(gardenSpace);
console.log('The role of user 1 is ' + users[0]?.getRole("space-001"));
console.log('The role of user 1 is ' + users[0]?.getRole("space-021"));
console.log('The role of user 5 is ' + users[5]?.getRole("space-001"));
*/
console.log('All roles of user 1 are ' + JSON.stringify(users[0]?.getAllRoles()));
console.log(gardenSpace.getItems());

console.log(gardenSpace.getUsers()[0]?.setId("u3"));
console.log(gardenSpace.getUsers()[0]);

