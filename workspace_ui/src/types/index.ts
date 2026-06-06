export type Role = 'MEMBER' | 'APPROVER' | 'ADMIN' | 'OWNER';

export type WorkspaceType = 'ROOM' | 'LAB' | 'EQUIPMENT';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  created_at?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  resourceCount: number;
  workspace_type?: WorkspaceType;
  department_id?: string | null;
  building?: string | null;
  room_number?: string | null;
  capacity?: number | null;
  min_booking_minutes?: number;
  max_booking_minutes?: number;
  reservation_requires_approval?: boolean;
  departments?: Pick<Department, 'id' | 'name' | 'code'> | null;
}

export interface CreateWorkspaceInput {
  name: string;
  description: string;
  workspace_type?: WorkspaceType;
  department_id?: string | null;
  building?: string | null;
  room_number?: string | null;
  capacity?: number | null;
  min_booking_minutes?: number;
  max_booking_minutes?: number;
  reservation_requires_approval?: boolean;
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

export interface Reservation {
  id: string;
  workspace_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  purpose?: string | null;
  created_at?: string;
  workspaces?: Pick<Workspace, 'id' | 'name' | 'workspace_type' | 'building' | 'room_number'>;
  users?: { name: string };
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
  created_at?: string;
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  user_id: string;
  action: string;
  details?: string;
  created_at: string;
  users?: { name: string };
}
