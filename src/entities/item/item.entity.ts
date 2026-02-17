export class Item{
    private id: string;
    private name: string;
    private description: string;
    private quantity?: number | undefined; // Optional property to track quantity of items
    private requiredApproval?: number | undefined; // Optional property to indicate if item requires approval for use
    private numAvailable?: number | undefined; // Optional property to indicate if item is currently available for use
    constructor(id: string, name: string, description: string, quantity?: number, requiredApproval?: number, available?: boolean) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.requiredApproval = requiredApproval;
        this.numAvailable = available ? 1 : 0;
        this.quantity = quantity;
    }

    getId(): string {
        return this.id;
    }
    getName(): string {
        return this.name;
    }
    getDescription(): string {
        return this.description;
    }
    getRequiredApproval(): number | undefined {
        return this.requiredApproval;
    }
    getAvailable(): number | undefined {
        return this.numAvailable;
    }
    getQuantity(): number | undefined {
        return this.quantity;
    }
}