import { supabase } from '../supabaseClient';
import { AuditLog } from '../types';

/** Supabase-backed helpers for recording and reading workspace audit log entries. */
export const auditApi = {
    /** Records an action in the audit log; failures are logged to the console, not thrown, so they never block the caller. */
    logAction: async (workspaceId: string, userId: string, action: string, details?: string) => {
        const { error } = await supabase.from('audit_logs').insert([{
            workspace_id: workspaceId,
            user_id: userId,
            action,
            details
        }]);

        if (error) console.error('Audit Log Error:', error);
    },

    /** Returns a workspace's audit log entries with each actor's name, newest first. */
    getWorkspaceLogs: async (workspaceId: string): Promise<AuditLog[]> => {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, users(name)')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as AuditLog[];
    }
};