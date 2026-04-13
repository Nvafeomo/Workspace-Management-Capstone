import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auditApi } from '../api/auditApi';
import { AuditLog } from '../types';
import { ArrowLeft, Loader2, Activity } from 'lucide-react';

export const AuditLogPage = () => {
    const { id } = useParams<{ id: string }>();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        auditApi.getWorkspaceLogs(id)
            .then(setLogs)
            .catch(err => console.error("Failed to load logs", err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="space-y-4">
                <Link to={`/workspace/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
                    <ArrowLeft size={16} />
                    Back to Workspace
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Workspace Audit Logs</h1>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {logs.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">No activity logged yet.</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {logs.map(log => (
                            <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-50">
                                <div className="mt-1 text-indigo-400 bg-indigo-50 p-2 rounded-full">
                                    <Activity size={16} />
                                </div>
                                <div>
                                    <p className="text-slate-900 font-medium">
                                        <span className="font-bold">{log.users?.name ?? 'Unknown User'}</span> {log.action}
                                    </p>
                                    {log.details && <p className="text-sm text-slate-500 mt-1">{log.details}</p>}
                                    <p className="text-xs text-slate-400 mt-2">
                                        {new Date(log.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};