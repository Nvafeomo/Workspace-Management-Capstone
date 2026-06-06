import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Loader2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reservationApi } from '../api/reservationApi';
import type { Reservation } from '../types';

function formatRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleString()} – ${e.toLocaleString()}`;
}

function statusStyle(status: Reservation['status']): string {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-100 text-emerald-800';
    case 'PENDING':
      return 'bg-amber-100 text-amber-800';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-600';
    case 'REJECTED':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export const MyReservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    reservationApi
      .getByUser(user.id)
      .then(setReservations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleCancel = async (r: Reservation) => {
    if (!user?.id) return;
    if (!window.confirm('Cancel this reservation?')) return;
    setCancellingId(r.id);
    try {
      await reservationApi.cancel(r.id, user.id, r.workspace_id);
      setReservations((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, status: 'CANCELLED' } : item))
      );
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Cancel failed.';
      alert(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = reservations.filter(
    (r) => ['PENDING', 'CONFIRMED'].includes(r.status) && new Date(r.end_time) > new Date()
  );
  const past = reservations.filter(
    (r) => !['PENDING', 'CONFIRMED'].includes(r.status) || new Date(r.end_time) <= new Date()
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  const renderRow = (r: Reservation, showCancel: boolean) => (
    <li
      key={r.id}
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <Link
          to={`/workspace/${r.workspace_id}`}
          className="text-base font-bold text-slate-900 hover:text-indigo-600"
        >
          {r.workspaces?.name ?? 'Workspace'}
        </Link>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
          <Clock size={14} className="shrink-0 text-slate-400" />
          {formatRange(r.start_time, r.end_time)}
        </p>
        {(r.workspaces?.building || r.workspaces?.room_number) && (
          <p className="mt-1 text-xs text-slate-500">
            {[r.workspaces?.building, r.workspaces?.room_number && `Room ${r.workspaces.room_number}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {r.purpose && <p className="mt-2 text-sm text-slate-500">{r.purpose}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(r.status)}`}>
          {r.status}
        </span>
        {showCancel && (
          <button
            type="button"
            onClick={() => handleCancel(r)}
            disabled={cancellingId === r.id}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          >
            {cancellingId === r.id ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <XCircle size={16} />
            )}
            Cancel
          </button>
        )}
      </div>
    </li>
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Campus spaces</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">My reservations</h1>
        <p className="mt-2 text-slate-600">Rooms and labs you have booked across campus.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming reservations. Open a room or lab workspace to book time.</p>
        ) : (
          <ul className="space-y-3">{upcoming.map((r) => renderRow(r, true))}</ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Past & cancelled</h2>
          <ul className="space-y-3">{past.map((r) => renderRow(r, false))}</ul>
        </section>
      )}
    </div>
  );
};
