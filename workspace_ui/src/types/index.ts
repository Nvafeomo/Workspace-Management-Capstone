export type Role = 'MEMBER' | 'APPROVER' | 'ADMIN' | 'OWNER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  resourceCount: number;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE' | 'REQUESTED';
  reqApprovers: number;
  imageUrl?: string;
}


export interface BorrowRequest {
  id: string;
  resource_id: string;
  user_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  request_date: string;
  return_date?: string;
  return_note?: string | null;
  updated_at?: string;
  resource?: { name: string; 
    workspace_id?: string;
    workspace_resource?: { workspace_id: string }[];
 };
  users?: { name: string };
}
