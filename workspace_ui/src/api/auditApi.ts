import { supabase } from '../supabaseClient';
import { AuditLog } from '../types';

export const auditApi = {
    logAction: async (workspaceId: string, userId: string, action: string, details?: string) => {
        const { error } = await supabase.from('audit_logs').insert([{
            workspace_id: workspaceId,
            user_id: userId,
            action,
            details
        }]);

        if (error) console.error('Audit Log Error:', error);
    },

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