export class Resource{
    private id: string;
    private name: string;
    private description: string;
    private quantity?: number | undefined; // Optional property to track quantity of items
    private reqApprovers?: number | undefined; // Optional property to indicate if item requires approval for use
    private numAvailable?: number | undefined; // Optional property to indicate if item is currently available for use
    private status: 'AVAILABLE' | 'REQUESTED' | 'BORROWED'; // tracks the status of item
    constructor(id: string, name: string, description: string, quantity?: number, requiredApproval?: number, available?: boolean) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.reqApprovers = requiredApproval;
        this.numAvailable = available ? 1 : 0;
        this.quantity = quantity;
        this.status = available ? 'AVAILABLE' : 'BORROWED';
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
        return this.reqApprovers;
    }
    getAvailable(): number | undefined {
        return this.numAvailable;
    }
    getQuantity(): number | undefined {
        return this.quantity;
    }
    // Returns the current status string (e.g., 'AVAILABLE')
    getStatus(): string {
        return this.status;
    }
    // Updates the status and ensures 'numAvailable' stays in sync
    setStatus(newStatus: 'AVAILABLE' | 'REQUESTED' | 'BORROWED'): void {
        this.status = newStatus;
        this.numAvailable = newStatus === 'AVAILABLE' ? 1 : 0;
    }
    // Helper for the UI to determine if the "Borrow" button should be enabled
    canBeBorrowed(): boolean {
        return this.status === 'AVAILABLE';
    }
}