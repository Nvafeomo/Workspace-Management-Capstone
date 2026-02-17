export class User {
    private id: string;
    private name: string;
    private rolesBySpace: { //roles stored as object(dictionary) with spaceId as key and role as value so if a user is in multiple spaces we have their roles in each space.
    [spaceId: string]: 'ADMIN' | 'APPROVER' | 'MEMBER';
    };

   constructor(id: string, name: string, rolesBySpace: { [spaceId: string]: 'ADMIN' | 'APPROVER' | 'MEMBER' }) { //Consider only storing spaceids and storing roles in workspace
    this.id = id;
    this.name = name;
    this.rolesBySpace = rolesBySpace;
   }
   public getRole(spaceId: string): 'ADMIN' | 'APPROVER' | 'MEMBER' | undefined {
    return this.rolesBySpace[spaceId];
  }
  public getAllRoles(): { [spaceId: string]: 'ADMIN' | 'APPROVER' | 'MEMBER' } {
    return this.rolesBySpace;
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
  public setRole(spaceId: string, role: 'ADMIN' | 'APPROVER' | 'MEMBER'): void {
    this.rolesBySpace[spaceId] = role;
  }
  



}