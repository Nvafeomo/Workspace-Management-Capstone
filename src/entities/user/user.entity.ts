export class User {
  private id: string;
  private name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  public getName(): string {
    return this.name;
  }
  public getId(): string {
    return this.id;
  }
  public setId(id: string): void {
    this.id = id;
  }
  public setName(name: string): void {
    this.name = name;
  }
}
