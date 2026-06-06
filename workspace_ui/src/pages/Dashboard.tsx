import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workspaceApi } from '../api/workspaceApi';
import { departmentApi } from '../api/departmentApi';
import { Workspace, WorkspaceType, Department, CreateWorkspaceInput } from '../types';
import { workspaceTypeLabel, workspaceTypeStyle } from '../utils/workspaceLabels';
import {
  Loader2,
  Plus,
  Trash2,
  LayoutGrid,
  Building2,
  ArrowRight,
  FolderOpen,
  AlertTriangle,
  Sparkles,
  Search,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Modal } from '../components/Modal';

function membershipBadge(
  memberships: Record<string, string | null>,
  wsId: string,
  globalRole: string | null
): { label: string; tone: 'ok' | 'pending' | 'join' | 'master' } {
  if (globalRole === 'MASTER') {
    return { label: 'Full access', tone: 'master' };
  }
  const m = memberships[wsId];
  if (m === 'APPROVED' || m === 'APPROVER_PENDING') {
    return { label: 'Member', tone: 'ok' };
  }
  if (m === 'PENDING') {
    return { label: 'Approval pending', tone: 'pending' };
  }
  return { label: 'Not joined', tone: 'join' };
}

/** Member, approver pending, or join-request pending — always listed without search */
function showsOnDashboardWithoutSearch(
  workspaceId: string,
  memberships: Record<string, string | null>,
  globalRole: string | null
): boolean {
  if (globalRole === 'MASTER') return true;
  const m = memberships[workspaceId];
  return m === 'APPROVED' || m === 'APPROVER_PENDING' || m === 'PENDING';
}

/** Workspaces you're not linked to appear only when the search matches name (substring, case-insensitive) */
function matchesWorkspaceSearch(workspaceName: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q.length > 0 && workspaceName.toLowerCase().includes(q);
}

function badgeStyles(tone: 'ok' | 'pending' | 'join' | 'master'): string {
  switch (tone) {
    case 'master':
      return 'bg-violet-100 text-violet-800 ring-violet-200/70';
    case 'ok':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200/60';
    case 'pending':
      return 'bg-amber-50 text-amber-800 ring-amber-200/60';
    case 'join':
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-200/70';
  }
}

export const Dashboard = () => {
  const { user, globalRole, displayName } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultWorkspaceForm = (): CreateWorkspaceInput => ({
    name: '',
    description: '',
    workspace_type: 'EQUIPMENT',
    department_id: null,
    building: '',
    room_number: '',
    capacity: null,
    min_booking_minutes: 30,
    max_booking_minutes: 480,
    reservation_requires_approval: false,
  });
  const [newWorkspace, setNewWorkspace] = useState<CreateWorkspaceInput>(defaultWorkspaceForm());
  const [creating, setCreating] = useState(false);
  const [memberships, setMemberships] = useState<Record<string, string | null>>({});
  const [roles, setRoles] = useState<Record<string, string | null>>({});
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [typeFilter, setTypeFilter] = useState<WorkspaceType | 'ALL'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  useEffect(() => {
    departmentApi.getAll().then(setDepartments).catch(console.error);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    workspaceApi
      .getAll()
      .then(async (data) => {
        setWorkspaces(data);
        setError(null);
        if (user?.id) {
          const membershipMap: Record<string, string | null> = {};
          const roleMap: Record<string, string | null> = {};
          await Promise.all(
            data.map(async (ws) => {
              membershipMap[ws.id] = await workspaceApi.getMembership(ws.id, user.id);
              roleMap[ws.id] = await workspaceApi.getUserRole(ws.id, user.id);
            })
          );
          setMemberships(membershipMap);
          setRoles(roleMap);
        }
      })
      .catch((err) => {
        console.error('Failed to load workspaces:', err);
        setError(
          err?.message ?? 'Failed to load workspaces. Check your Supabase connection and .env.local.'
        );
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setCreating(true);
    try {
      const created = await workspaceApi.create(newWorkspace, user.id);
      setWorkspaces((prev) => [...prev, created]);
      setMemberships((prev) => ({ ...prev, [created.id]: 'APPROVED' }));
      setRoles((prev) => ({ ...prev, [created.id]: 'ADMIN' }));
      setIsModalOpen(false);
      setNewWorkspace(defaultWorkspaceForm());
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleRequestJoin = async (workspaceId: string) => {
    if (!user?.id) return;
    try {
      await workspaceApi.requestJoin(workspaceId, user.id);
      setMemberships((prev) => ({ ...prev, [workspaceId]: 'PENDING' }));
    } catch (err) {
      console.error(err);
      alert('Failed to send join request.');
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${workspaceName}" and all its resources?`
      )
    )
      return;
    try {
      await workspaceApi.delete(workspaceId);
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== workspaceId));
    } catch (err: unknown) {
      console.error('Delete workspace failed:', err);
      const message = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : null;
      alert(message ?? 'Failed to delete workspace.');
    }
  };

  const greetingName = displayName?.split(' ')?.[0] ?? user?.email?.split('@')?.[0] ?? 'there';

  const matchesFilters = (ws: Workspace) => {
    if (typeFilter !== 'ALL' && (ws.workspace_type ?? 'EQUIPMENT') !== typeFilter) return false;
    if (departmentFilter !== 'ALL' && ws.department_id !== departmentFilter) return false;
    return true;
  };

  const mineWorkspaces = workspaces.filter(
    (ws) => showsOnDashboardWithoutSearch(ws.id, memberships, globalRole) && matchesFilters(ws)
  );
  const discoveryWorkspaces = workspaces.filter(
    (ws) =>
      !showsOnDashboardWithoutSearch(ws.id, memberships, globalRole) &&
      matchesWorkspaceSearch(ws.name, workspaceSearch) &&
      matchesFilters(ws)
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 px-8 py-16 shadow-sm shadow-slate-200/50">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
          <Loader2 className="h-9 w-9 animate-spin text-indigo-600" aria-hidden />
        </div>
        <p className="mt-6 text-lg font-semibold text-slate-900">Loading workspaces</p>
        <p className="mt-1 max-w-xs text-center text-sm text-slate-500">
          Hang on while we sync your memberships and workspaces.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50/90 to-white px-8 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
          <AlertTriangle className="h-8 w-8 text-rose-600" aria-hidden />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">We couldn’t load workspaces</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">{error}</p>
        <p className="mt-6 max-w-md text-xs text-slate-500">
          Confirm <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">workspace_ui/.env.local</code>{' '}
          includes <span className="font-mono text-[11px]">VITE_SUPABASE_URL</span> and{' '}
          <span className="font-mono text-[11px]">VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY</span>.
        </p>
      </div>
    );
  }

  const qTrim = workspaceSearch.trim();
  const mineCount = mineWorkspaces.length;

  const renderWorkspaceCard = (ws: Workspace, index: number) => {
    const badge = membershipBadge(memberships, ws.id, globalRole);
    return (
      <motion.article
        key={ws.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.35 }}
        className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/60 transition-[box-shadow,border-color] hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/70"
      >
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badgeStyles(badge.tone)}`}
                >
                  {badge.label}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${workspaceTypeStyle(ws.workspace_type)}`}
                >
                  {workspaceTypeLabel(ws.workspace_type)}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">{ws.name}</h3>
              {(ws.departments?.name || ws.building) && (
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {[ws.departments?.name, ws.building, ws.room_number && `Room ${ws.room_number}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{ws.description}</p>
            </div>
            {(globalRole === 'MASTER' || roles[ws.id] === 'OWNER') && (
              <button
                type="button"
                onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                className="shrink-0 rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                title="Delete workspace"
                aria-label={`Delete workspace ${ws.name}`}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          <div className="mt-auto pt-6">
            {memberships[ws.id] === 'APPROVED' ||
            memberships[ws.id] === 'APPROVER_PENDING' ||
            globalRole === 'MASTER' ? (
              <Link
                to={`/workspace/${ws.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Enter workspace <ArrowRight size={18} aria-hidden />
              </Link>
            ) : memberships[ws.id] === 'PENDING' ? (
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-3 text-sm font-semibold text-slate-400"
              >
                Request pending
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleRequestJoin(ws.id)}
                className="w-full rounded-xl border border-indigo-300 bg-indigo-50/50 py-3 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                Request to join
              </button>
            )}
          </div>
        </div>
      </motion.article>
    );
  };

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-indigo-50/60 px-6 py-8 shadow-lg shadow-indigo-100/40 sm:px-10 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 ring-1 ring-indigo-200/80 shadow-sm shadow-indigo-100/80">
              <Sparkles size={13} aria-hidden /> Dashboard
            </p>
            <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Hi {greetingName}, pick where you’re working today
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Reserve rooms and labs, borrow shared equipment, and manage department workspaces across campus.
            </p>
            <dl className="mt-8 flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/80 px-4 py-3 shadow-sm">
                <Building2 className="h-5 w-5 text-indigo-500" aria-hidden />
                <div>
                  <dt className="text-slate-500">
                    {globalRole === 'MASTER' ? 'All workspaces' : 'Your workspaces'}
                  </dt>
                  <dd className="text-lg font-bold tabular-nums text-slate-900">{mineCount}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/80 px-4 py-3 shadow-sm">
                <LayoutGrid className="h-5 w-5 text-indigo-500" aria-hidden />
                <div>
                  <dt className="text-slate-500">Your role</dt>
                  <dd className="text-lg font-bold capitalize text-slate-900">
                    {globalRole?.toLowerCase().replace('_', ' ') ?? 'member'}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition-colors hover:bg-indigo-700 sm:w-auto"
          >
            <Plus size={22} aria-hidden /> Create workspace
          </motion.button>
        </div>
      </section>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-8 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
            <FolderOpen className="h-9 w-9 text-indigo-500" aria-hidden />
          </div>
          <h2 className="mt-8 text-xl font-semibold text-slate-900">No workspaces yet</h2>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            Create your first workspace to start tracking shared resources—or ask your admin to approve your join requests.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700"
          >
            <Plus size={18} aria-hidden /> Create workspace
          </button>
        </div>
      ) : (
        <>
          <section
            aria-label="Search and filter workspaces"
            className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/50 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as WorkspaceType | 'ALL')}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="ALL">All types</option>
                <option value="ROOM">Rooms</option>
                <option value="LAB">Labs</option>
                <option value="EQUIPMENT">Equipment</option>
              </select>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="ALL">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <label htmlFor="workspace-search" className="sr-only">
              Search workspaces by name to request access
            </label>
            <div className="relative max-w-xl">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="workspace-search"
                type="search"
                autoComplete="off"
                placeholder="Search by name for workspaces you’re not in yet…"
                value={workspaceSearch}
                onChange={(e) => setWorkspaceSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
              />
            </div>
            <p className="mt-3 max-w-xl text-xs text-slate-500 leading-relaxed">
              Workspaces you belong to, or where a join request is pending, stay listed below. Other workspaces appear only when
              the name matches your search.
            </p>
          </section>

          {mineWorkspaces.length === 0 &&
          discoveryWorkspaces.length === 0 &&
          globalRole !== 'MASTER' && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-8 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                {qTrim.length > 0
                  ? `No workspaces match "${qTrim}".`
                  : 'You’re not in any workspace yet.'}
              </p>
              <p className="mx-auto mt-2 max-w-md text-xs text-slate-500">
                {qTrim.length > 0
                  ? 'Try another name or create a workspace.'
                  : 'Use the search above to find one by name, or create your own workspace.'}
              </p>
            </div>
          )}

          {mineWorkspaces.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Your workspaces{' '}
                <span className="font-normal text-slate-500">({mineWorkspaces.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {mineWorkspaces.map((ws, index) => renderWorkspaceCard(ws, index))}
              </div>
            </div>
          )}

          {discoveryWorkspaces.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Matching workspaces{' '}
                <span className="font-normal text-slate-500">
                  ({discoveryWorkspaces.length}
                  {qTrim ? (
                    <>
                      {' '}
                      for “<span className="font-medium text-slate-600">{qTrim}</span>”
                    </>
                  ) : null}
                  )
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {discoveryWorkspaces.map((ws, index) =>
                  renderWorkspaceCard(ws, index + mineWorkspaces.length + 10)
                )}
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create campus workspace">
        <form onSubmit={handleCreateWorkspace} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Workspace name</label>
            <input
              required
              type="text"
              value={newWorkspace.name}
              onChange={(e) =>
                setNewWorkspace((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Engineering Lab B, Study Room 204"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Type</label>
              <select
                value={newWorkspace.workspace_type}
                onChange={(e) =>
                  setNewWorkspace((prev) => ({
                    ...prev,
                    workspace_type: e.target.value as WorkspaceType,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="ROOM">Room (reservable)</option>
                <option value="LAB">Lab (reservable + equipment)</option>
                <option value="EQUIPMENT">Equipment pool (borrow only)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Department</label>
              <select
                value={newWorkspace.department_id ?? ''}
                onChange={(e) =>
                  setNewWorkspace((prev) => ({
                    ...prev,
                    department_id: e.target.value || null,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(newWorkspace.workspace_type === 'ROOM' || newWorkspace.workspace_type === 'LAB') && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Building</label>
                  <input
                    type="text"
                    value={newWorkspace.building ?? ''}
                    onChange={(e) =>
                      setNewWorkspace((prev) => ({ ...prev, building: e.target.value }))
                    }
                    placeholder="e.g. Science Hall"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Room number</label>
                  <input
                    type="text"
                    value={newWorkspace.room_number ?? ''}
                    onChange={(e) =>
                      setNewWorkspace((prev) => ({ ...prev, room_number: e.target.value }))
                    }
                    placeholder="e.g. 204"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={newWorkspace.capacity ?? ''}
                  onChange={(e) =>
                    setNewWorkspace((prev) => ({
                      ...prev,
                      capacity: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="Max occupants"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={newWorkspace.reservation_requires_approval ?? false}
                  onChange={(e) =>
                    setNewWorkspace((prev) => ({
                      ...prev,
                      reservation_requires_approval: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Reservations require approver sign-off
              </label>
            </>
          )}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Description</label>
            <textarea
              required
              rows={3}
              value={newWorkspace.description}
              onChange={(e) =>
                setNewWorkspace((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe the workspace and its purpose..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
          >
            {creating ? <Loader2 className="animate-spin" size={22} aria-hidden /> : 'Create workspace'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
