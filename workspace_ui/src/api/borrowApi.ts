//borrow functions

import { BorrowRequest } from '../types';
import { supabase } from '../supabaseClient';

export const borrowApi = {
  //create borrow request function
  createRequest: async (resourceId: string, userId: string, reqApprovers: number): Promise<BorrowRequest> => {

    // DEBUGGING STEP: See what the API actually receives
    console.log("API RECEIVED reqApprovers:", reqApprovers);
    console.log("Type of reqApprovers:", typeof reqApprovers);

    // 1. determine the initial state of the request record
    // If 0 approvals are needed, we mark it 'APPROVED' immediately so it skips the Approvals page
    const initialStatus = reqApprovers > 0 ? 'PENDING' : 'APPROVED';

    // 2. determine the state the resource should transition to
    // If it needs approval, it sits in 'REQUESTED'. If it's auto-approved, it's now 'BORROWED'
    const resourceStatus = reqApprovers > 0 ? 'REQUESTED' : 'BORROWED';

    const { data: created, error } = await supabase
      .from('borrow_request')
      .insert([{ 
        resource_id: resourceId, 
        user_id: userId, 
        status: initialStatus, // Immediately approves if 0 required approvals
        request_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('resource')
      .update({ status: resourceStatus })
      .eq('id', resourceId);

    return created as BorrowRequest;
  },

  //gets borrow requests so they can be shown on the front end
  // joins resource and users tables to get names for display on approvals page
  getApprovals: async (): Promise<BorrowRequest[]> => {
    const { data, error } = await supabase
      .from('borrow_request')
      .select(`*, resource(name, reqApprovers, workspace_resource(workspace_id)), users(name)`).eq('status', 'PENDING');
    if (error) throw error;
    return data as BorrowRequest[];
  },

  //update status of borrow request
  updateStatus: async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<BorrowRequest> => {
    if (status === 'REJECTED') {
      // rejected, just update the status and set resource back to AVAILABLE
      const { data: updated, error } = await supabase
        .from('borrow_request')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('resource')
        .update({ status: 'AVAILABLE' })
        .eq('id', updated.resource_id);

      return updated as BorrowRequest;
    }

    // approved — insert into approvals table first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // check if this approver already approved
    const { data: existing } = await supabase
      .from('approvals')
      .select('id')
      .eq('borrow_request_id', id)
      .eq('approver_id', user.id)
      .maybeSingle();

    if (existing) throw new Error('You have already approved this request.');

    // insert approval record
    const { error: approvalError } = await supabase
      .from('approvals')
      .insert([{ borrow_request_id: id, approver_id: user.id }]);

    if (approvalError) throw approvalError;

    // get the borrow request to find the resource and required approvers
    const { data: borrowRequest, error: brError } = await supabase
      .from('borrow_request')
      .select('*, resource(reqApprovers)')
      .eq('id', id)
      .single();

    if (brError) throw brError;

    // count total approvals so far
    const { count, error: countError } = await supabase
      .from('approvals')
      .select('id', { count: 'exact' })
      .eq('borrow_request_id', id);

    if (countError) throw countError;

    const reqApprovers = borrowRequest.resource?.reqApprovers ?? 1;
    const approvalCount = count ?? 0;

    // only fully approve if we've hit the required number
    if (approvalCount >= reqApprovers) {
      const { data: updated, error } = await supabase
        .from('borrow_request')
        .update({ status: 'APPROVED' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('resource')
        .update({ status: 'BORROWED' })
        .eq('id', updated.resource_id);

      return updated as BorrowRequest;
    }

    // not enough approvals yet, return the request as still PENDING
    const { data: stillPending, error: pendingError } = await supabase
      .from('borrow_request')
      .select()
      .eq('id', id)
      .single();

    if (pendingError) throw pendingError;
    return stillPending as BorrowRequest;
  },


  // get all borrow records for accountability/audit views
  getHistory: async (): Promise<BorrowRequest[]> => {
    const { data, error } = await supabase
      .from('borrow_request')
      .select('*, resource(name, workspace_resource(workspace_id)), users(name)')
      .order('request_date', { ascending: false });

    if (error) throw error;
    return data as BorrowRequest[];
  },

  // get all currently borrowed resources for a user
  getUserBorrows: async (userId: string): Promise<BorrowRequest[]> => {
    const { data, error } = await supabase
      .from('borrow_request')
      .select(`*, resource(name, workspace_resource(workspace_id)), users(name)`)
      .eq('user_id', userId)
      .eq('status', 'APPROVED');

    if (error) throw error;
    return data as BorrowRequest[];
  },

  // return a borrowed resource
  returnResource: async (borrowId: string, resourceId: string): Promise<void> => {
    // update borrow request status to RETURNED
    const { error: borrowError } = await supabase
      .from('borrow_request')
      .update({ status: 'RETURNED', return_date: new Date().toISOString() })
      .eq('id', borrowId);

    if (borrowError) throw borrowError;

    // update resource status back to AVAILABLE
    const { error: resourceError } = await supabase
      .from('resource')
      .update({ status: 'AVAILABLE' })
      .eq('id', resourceId);

    if (resourceError) throw resourceError;
  },
  
  //get all pending borrow requests for a user
  getUserPendingRequests: async (userId: string): Promise<BorrowRequest[]> => {
    const { data, error } = await supabase
      .from('borrow_request')
      .select(`*, resource(name, workspace_resource(workspace_id))`)
      .eq('user_id', userId)
      .eq('status', 'PENDING');

    if (error) throw error;
    return data as BorrowRequest[];
  },

  // cancel a borrow request (reuses REJECTED status)
  cancelRequest: async (borrowId: string, resourceId: string): Promise<void> => {
    const { error: borrowError } = await supabase
      .from('borrow_request')
      .update({ status: 'REJECTED' })
      .eq('id', borrowId);

    if (borrowError) throw borrowError;

    const { error: resourceError } = await supabase
      .from('resource')
      .update({ status: 'AVAILABLE' })
      .eq('id', resourceId);

    if (resourceError) throw resourceError;
  },

  getApprovalCount: async (borrowRequestId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('approvals')
      .select('id', { count: 'exact' })
      .eq('borrow_request_id', borrowRequestId);

    if (error) throw error;
    return count ?? 0;
  },


};
