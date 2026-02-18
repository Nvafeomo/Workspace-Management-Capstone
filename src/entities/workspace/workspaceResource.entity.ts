export class WorkspaceResource {
  workspace_id: string;
  resource_id: string;
  created_at: string | undefined;

  constructor(workspace_id: string, resource_id: string, created_at?: string) {
    this.workspace_id = workspace_id;
    this.resource_id = resource_id;
    this.created_at = created_at;
  }
}
