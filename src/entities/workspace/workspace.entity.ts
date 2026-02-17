import { User } from '../user/user.entity';
import { Item } from '../item/item.entity';

export class Workspace {
    private id: string;
    private name: string;
    private description: string;
    private terms: {
        space: string;
        item: string;
        members: string;
    }
    private users: User[]
    private items: Item[]
    
    constructor(id: string, name: string, description: string, terms: {space: string; item: string; members: string}, users: User[], items: Item[]) {
        this.name = name;
        this.id = id;
        this.description = description;
        this.terms = terms;
        this.users = users;
        this.items = items;

    }

}
