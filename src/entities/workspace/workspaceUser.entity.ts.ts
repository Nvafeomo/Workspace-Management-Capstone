export class WorkspaceUser {
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string | undefined;

  constructor(workspace_id: string, user_id: string, role: string, created_at?: string) {
    this.workspace_id = workspace_id;
    this.user_id = user_id;
    this.role = role;
    this.created_at = created_at;
  }
}
