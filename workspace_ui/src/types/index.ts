export type Role = 'USER' | 'ADMIN';

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
  resource?: { name: string };
  users?: { name: string };
}
