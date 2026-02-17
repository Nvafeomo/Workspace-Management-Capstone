
import { Space } from "./space/space.entity";
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
  new Item("i1", "Shovel", "A sturdy garden shovel", "space-001"),
  new Item("i2", "Rake", "Metal rake for soil", "space-001")
];

const gardenSpace = new Space(
  "space-001",
  "Community Garden",
  "A shared space for growing vegetables and herbs.",
  gardenTerms,
  users,
  items
);

console.log(gardenSpace);
console.log('The role of user 1 is ' + users[0]?.getRole("space-001")); // Should print "ADMIN"
