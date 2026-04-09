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
  minRole?: 'MEMBER' | 'APPROVER' | 'ADMIN';
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
    reqApprovers?: number;
    minRole?: string;
 };
  users?: { name: string };
}

export interface UserFeedback {
  id: string;
  message: string;
  submitter_name?: string;
  submitter_user_id?: string | null;
  created_at?: string;
}
