import { User } from '../user/user.entity';
import { Resource } from '../resource/resource.entity';

export class Workspace {
    private id: string;
    private description: string;
    private terms: { //Object that stores terms of workspace
        space: string;
        resource: string;
        members: string;
    }
    private users: User[] //List to store users(objects) in the workspace, we can use this to check if a user is part of the workspace and what their role is.
    private items: Resource[] //List to store items(objects) in the workspace
    constructor(id: string, description: string, terms: {space: string; resource: string; members: string}, users: User[], items: Resource[]) {
        this.id = id;
        this.description = description;
        this.terms = terms;
        this.users = users;
        this.items = items;

    }
    getId(): string{
        return this.id;
    }
    
    getDescription(): string {
        return this.description;
    }
    getTerms(): {space: string; resource: string; members: string} {
        return this.terms;
    }
    getUsers(): User[] {
        return this.users;
    }
    getItems(): Resource[] {
        return this.items;
    }
}
