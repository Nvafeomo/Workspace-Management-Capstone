import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Loader2, Plus } from 'lucide-react';
import { reservationApi } from '../api/reservationApi';
import type { Reservation, Workspace } from '../types';
import { Modal } from './Modal';

function formatRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  const dateFmt: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const timeFmt: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  if (sameDay) {
    return `${s.toLocaleDateString(undefined, dateFmt)} · ${s.toLocaleTimeString(undefined, timeFmt)} – ${e.toLocaleTimeString(undefined, timeFmt)}`;
  }
  return `${s.toLocaleString(undefined, { ...dateFmt, ...timeFmt })} – ${e.toLocaleString(undefined, { ...dateFmt, ...timeFmt })}`;
}

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface Props {
  workspace: Workspace;
  userId: string;
  canBook: boolean;
}

export function WorkspaceReservations({ workspace, userId, canBook }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({ start: '', end: '', purpose: '' });

  const load = () => {
    setLoading(true);
    const from = new Date().toISOString();
    reservationApi
      .getByWorkspace(workspace.id, from)
      .then(setReservations)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [workspace.id]);

  const openBookModal = () => {
    const start = new Date();
    start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0);
    const end = new Date(start.getTime() + (workspace.min_booking_minutes ?? 30) * 60_000);
    setForm({
      start: toLocalDatetimeValue(start),
      end: toLocalDatetimeValue(end),
      purpose: '',
    });
    setModalOpen(true);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.start || !form.end) return;
    setBooking(true);
    try {
      await reservationApi.create(
        workspace.id,
        userId,
        new Date(form.start).toISOString(),
        new Date(form.end).toISOString(),
        form.purpose
      );
      setModalOpen(false);
      load();
      alert(workspace.reservation_requires_approval
        ? 'Reservation request submitted for approval.'
        : 'Room reserved successfully.');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Booking failed.';
      alert(msg);
    } finally {
      setBooking(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Calendar size={20} className="text-indigo-600" />
            Reservations
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Book {workspace.workspace_type === 'LAB' ? 'lab' : 'room'} time in {workspace.min_booking_minutes ?? 30}–{workspace.max_booking_minutes ?? 480} minute blocks.
            {workspace.reservation_requires_approval ? ' Approver sign-off required.' : ''}
          </p>
        </div>
        {canBook && (
          <button
            type="button"
            onClick={openBookModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={18} /> Book time
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : reservations.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No upcoming reservations.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {reservations.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
            >
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Clock size={14} className="text-slate-400" />
                  {formatRange(r.start_time, r.end_time)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {r.users?.name ?? 'Reserved'}
                  {r.purpose ? ` · ${r.purpose}` : ''}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  r.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {r.status === 'PENDING' ? 'Pending approval' : 'Confirmed'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Book this space">
        <form onSubmit={handleBook} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Start</label>
            <input
              required
              type="datetime-local"
              value={form.start}
              onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">End</label>
            <input
              required
              type="datetime-local"
              value={form.end}
              onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Purpose (optional)</label>
            <input
              type="text"
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
              placeholder="e.g. CS 301 lab section, study group"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <button
            type="submit"
            disabled={booking}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {booking ? <Loader2 className="animate-spin" size={22} /> : 'Confirm booking'}
          </button>
        </form>
      </Modal>
    </section>
  );
}
