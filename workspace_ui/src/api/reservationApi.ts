import { supabase } from '../supabaseClient';
import { auditApi } from './auditApi';
import type { Reservation, ReservationStatus } from '../types';

/** Supabase-backed helpers for creating, listing, and reviewing room reservations. */
export const reservationApi = {
  /** Returns a workspace's pending and confirmed reservations overlapping the optional from/to window, earliest first. */
  async getByWorkspace(workspaceId: string, from?: string, to?: string): Promise<Reservation[]> {
    let query = supabase
      .from('reservations')
      .select('*, users(name)')
      .eq('workspace_id', workspaceId)
      .in('status', ['PENDING', 'CONFIRMED'])
      .order('start_time');

    if (from) query = query.gte('end_time', from);
    if (to) query = query.lte('start_time', to);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Reservation[];
  },

  /** Returns a user's reservations of every status with workspace details, latest start time first. */
  async getByUser(userId: string): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, workspaces(id, name, workspace_type, building, room_number)')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Reservation[];
  },

  /** Returns all pending reservations visible to the caller, earliest first; no approver filter is applied here. */
  async getPendingForApprover(): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, workspaces(id, name, workspace_type, building, room_number), users(name)')
      .eq('status', 'PENDING')
      .order('start_time');

    if (error) throw error;
    return (data ?? []) as Reservation[];
  },

  /** Creates a reservation through the create_reservation RPC and writes an audit entry for the result. */
  async create(
    workspaceId: string,
    userId: string,
    startTime: string,
    endTime: string,
    purpose?: string
  ): Promise<Reservation> {
    const { data, error } = await supabase.rpc('create_reservation', {
      p_workspace_id: workspaceId,
      p_user_id: userId,
      p_start: startTime,
      p_end: endTime,
      p_purpose: purpose?.trim() || null,
    });

    if (error) throw error;

    const reservation = data as Reservation;
    await auditApi.logAction(
      workspaceId,
      userId,
      reservation.status === 'PENDING' ? 'requested a room reservation' : 'reserved a room',
      `${new Date(startTime).toLocaleString()} – ${new Date(endTime).toLocaleString()}`
    );

    return reservation;
  },

  /** Cancels the user's own pending or confirmed reservation and writes an audit entry. */
  async cancel(reservationId: string, userId: string, workspaceId: string): Promise<void> {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'CANCELLED' as ReservationStatus })
      .eq('id', reservationId)
      .eq('user_id', userId)
      .in('status', ['PENDING', 'CONFIRMED']);

    if (error) throw error;
    await auditApi.logAction(workspaceId, userId, 'cancelled a reservation', `Reservation ID: ${reservationId}`);
  },

  /** Confirms or rejects a reservation through the review_reservation RPC. */
  async review(reservationId: string, reviewerId: string, decision: 'CONFIRMED' | 'REJECTED'): Promise<Reservation> {
    const { data, error } = await supabase.rpc('review_reservation', {
      p_reservation_id: reservationId,
      p_reviewer_id: reviewerId,
      p_decision: decision,
    });

    if (error) throw error;
    return data as Reservation;
  },
};
