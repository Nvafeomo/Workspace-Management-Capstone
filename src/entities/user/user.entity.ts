export class User {
    private id: string;
    private name: string;
    private rolesBySpace: {
    [spaceId: string]: 'ADMIN' | 'APPROVER' | 'MEMBER';
    };

   constructor(id: string, name: string, rolesBySpace: { [spaceId: string]: 'ADMIN' | 'APPROVER' | 'MEMBER' }) {
    this.id = id;
    this.name = name;
    this.rolesBySpace = rolesBySpace;
   }
   public getRole(spaceId: string): 'ADMIN' | 'APPROVER' | 'MEMBER' | undefined {
    return this.rolesBySpace[spaceId];
  }




}