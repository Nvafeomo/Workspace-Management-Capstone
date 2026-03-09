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
        status: initialStatus // Immediately approves if 0 required approvals
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
      .select(`*, resource(name, workspace_resource(workspace_id)), users(name)`)
      .eq('status', 'PENDING');

    if (error) throw error;
    return data as BorrowRequest[];
  },

  //update status of borrow request
  updateStatus: async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<BorrowRequest> => {
    const { data: updated, error } = await supabase
      .from('borrow_request')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // if approved set resource to BORROWED, if rejected return it to AVAILABLE
    const resourceStatus = status === 'APPROVED' ? 'BORROWED' : 'AVAILABLE';
    await supabase
      .from('resource')
      .update({ status: resourceStatus })
      .eq('id', updated.resource_id);

    return updated as BorrowRequest;
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
      .update({ status: 'RETURNED' })
      .eq('id', borrowId);

    if (borrowError) throw borrowError;

    // update resource status back to AVAILABLE
    const { error: resourceError } = await supabase
      .from('resource')
      .update({ status: 'AVAILABLE' })
      .eq('id', resourceId);

    if (resourceError) throw resourceError;
  },


};
