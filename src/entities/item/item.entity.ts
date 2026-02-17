export class Item{
    id: string;
    name: string;
    description: string;
    spaceId: string;

    constructor(id: string, name: string, description: string, spaceId: string) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.spaceId = spaceId;
    }

    getId(): string {
        return this.id;
    }
}