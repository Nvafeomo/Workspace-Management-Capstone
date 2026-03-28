import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { workspaceApi } from '../api/workspaceApi';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Check, X, Loader2, Users  } from 'lucide-react';
import type { Role } from '../types';

// Page for admins to manage workspace members and approve/reject join requests
export const ManageWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const { globalRole, user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pendingApproverRequests, setPendingApproverRequests] = useState<any[]>([]);
  //new state variables for leaving workspace
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<Role | null>(null);



  // load pending requests and current members when page loads
  useEffect(() => {
    if (!id) return;
    Promise.all([
      workspaceApi.getPendingJoinRequests(id),
      workspaceApi.getMembers(id),
      workspaceApi.getPendingApproverRequests(id),
      //get user role
      user?.id ? workspaceApi.getUserRole(id, user.id) : Promise.resolve(null),
    ]).then(([pending, memberData, approverRequests, role]) => {
      setPendingRequests(pending);
      setMembers(memberData);
      setPendingApproverRequests(approverRequests);
      setMyRole(role);
      setLoading(false);
    });
  }, [id, user?.id]);

  // approve or reject a join request, then update the UI
  const handleJoinRequest = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!id) return;
    setProcessingId(userId);
    try {
      await workspaceApi.updateJoinRequest(id, userId, status);
      // remove from pending list regardless of approve or reject
      setPendingRequests(prev => prev.filter(r => r.user_id !== userId));
      if (status === 'APPROVED') {
        // refresh members list so approved user shows up immediately
        const updated = await workspaceApi.getMembers(id);
        setMembers(updated);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to update request.');
    } finally {
      setProcessingId(null);
    }
  };

  //handle request to become approver
  const handleApproverRequest = async (userId: string, approve: boolean) => {
    if (!id) return;
    setProcessingId(userId);
    try {
      await workspaceApi.updateApproverRequest(id, userId, approve);
      setPendingApproverRequests(prev => prev.filter(r => r.user_id !== userId));
      const updated = await workspaceApi.getMembers(id);
      setMembers(updated);
    } catch (error) {
      console.error(error);
      alert('Failed to update approver request.');
    } finally {
      setProcessingId(null);
    }
  };

  //handle changing the role from the drop down menu
  const handleRoleChange = async (targetUserId: string, newRole: Role) => {
    if (!id || !user?.id) return;

    // extra confirmation for ownership transfer
    if (newRole === 'OWNER') {
      const targetMember = members.find(m => m.user_id === targetUserId);
      if (!window.confirm(`Are you sure you want to transfer ownership to ${targetMember?.users?.name ?? 'this user'}? You will be demoted to Admin.`)) return;
    }

    setUpdatingRoleId(targetUserId);
    try {
      await workspaceApi.updateMemberRole(id, targetUserId, newRole, user.id);
      setMembers(prev =>
        prev.map(m => {
          if (m.user_id === targetUserId) return { ...m, role: newRole };
          // if ownership was transferred, demote current owner in local state too
          if (newRole === 'OWNER' && m.user_id === user.id) return { ...m, role: 'ADMIN' };
          return m;
        })
      );
      if (newRole === 'OWNER' && targetUserId !== user.id) {
        setMyRole('ADMIN');
      } else if (targetUserId === user.id) {
        setMyRole(newRole);
      }
    } catch (error: any) {
      console.error(error);
      alert(error?.message ?? 'Failed to update role.');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  //roles that can see the role change drop down menu
  const canManageRoles = globalRole === 'MASTER' || myRole === 'ADMIN' || myRole === 'OWNER';

  const handleAssignSuccessor = async (userId: string) => {
    if (!id) return;
    setProcessingId(userId);
    try {
      await workspaceApi.assignSuccessor(id, userId);
      const updated = await workspaceApi.getMembers(id);
      setMembers(updated);
      alert('Successor assigned as ADMIN.');
    } catch (error) {
      console.error(error);
      alert('Failed to assign successor.');
    } finally {
      setProcessingId(null);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Link
          to={`/workspace/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Workspace
        </Link>
      </header>

      <h1 className="text-3xl font-bold text-slate-900">Manage Members</h1>

      {/* Pending join requests section - shows users waiting for approval */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-700">Pending Join Requests</h2>
        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <p className="text-slate-500">No pending requests.</p>
          </div>
        ) : (
          pendingRequests.map(req => (
            <div key={req.user_id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                  <Users size={20} />
                </div>
                <span className="font-semibold text-slate-800">{req.users?.name ?? 'Unknown User'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleJoinRequest(req.user_id, 'REJECTED')}
                  disabled={processingId === req.user_id}
                  className="px-4 py-2 rounded-xl font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <X size={16} /> Reject
                </button>
                <button
                  onClick={() => handleJoinRequest(req.user_id, 'APPROVED')}
                  disabled={processingId === req.user_id}
                  className="px-4 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {processingId === req.user_id ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  Approve
                </button>
              </div>
            </div>
          ))
        )}
      </section>
      {/* Pending approver requests section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-700">Pending Approver Requests</h2>
        {pendingApproverRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <p className="text-slate-500">No pending approver requests.</p>
          </div>
        ) : (
          pendingApproverRequests.map(req => (
            <div key={req.user_id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                  <Users size={20} />
                </div>
                <span className="font-semibold text-slate-800">{req.users?.name ?? 'Unknown User'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApproverRequest(req.user_id, false)}
                  disabled={processingId === req.user_id}
                  className="px-4 py-2 rounded-xl font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <X size={16} /> Reject
                </button>
                <button
                  onClick={() => handleApproverRequest(req.user_id, true)}
                  disabled={processingId === req.user_id}
                  className="px-4 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {processingId === req.user_id ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  Approve
                </button>
              </div>
            </div>
          ))
        )}
      </section>
      {/* Current members section - shows all approved members and their roles */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-700">Current Members</h2>
        {members.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <p className="text-slate-500">No members yet.</p>
          </div>
        ) : (
          members.map(member => {
            const isCurrentUser = member.user_id === user?.id;
            const isUpdating = updatingRoleId === member.user_id;

            const targetIsOwner = member.role === 'OWNER';
            const isOwner = myRole === 'OWNER' || globalRole === 'MASTER';

            const showDropdown = canManageRoles && !isCurrentUser && (!targetIsOwner || isOwner);

            return (
              <div key={member.user_id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                    <Users size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 block truncate">
                      {member.users?.name ?? 'Unknown User'}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs text-slate-400 font-medium">You</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {showDropdown ? (
                    <div className="relative flex items-center gap-2">
                      {isUpdating && <Loader2 className="animate-spin text-indigo-400" size={16} />}
                      <select
                        value={member.role}
                        onChange={e => handleRoleChange(member.user_id, e.target.value as Role)}
                        disabled={isUpdating}
                        className="text-sm font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none pr-7"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="APPROVER">APPROVER</option>
                        <option value="ADMIN">ADMIN</option>
                        {isOwner && <option value="OWNER">OWNER</option>}
                      </select>
                    </div>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};