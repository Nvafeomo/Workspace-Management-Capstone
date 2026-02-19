import { User } from '../user/user.entity';
import { Resource } from '../resource/resource.entity';

export class Workspace {
  id: string | undefined
  description: string
  name: string
  created_at: string | undefined
  
  constructor(description: string,name: string, id?: string,  created_at?: string, users?: User[], resources?: Resource[]) {
    this.id = id
    this.description = description
    this.created_at = created_at
    this.name = name
    
  }
  
  getDescription(): string {
        return this.description;
    }
    
    
}
