//borrow functions

import { BorrowRequest } from '../types';
import { supabase } from '../supabaseClient';

export const borrowApi = {
  //create borrow request function
  //uses borrow_request table, returns request information which is unused as of now but will be used for audit log later
  createRequest: async (resourceId: string, userId: string, reqApprovers: number): Promise<BorrowRequest> => {
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
  //uses borrow_request table
  // joins resource and users tables to get names for display on approvals page
  getApprovals: async (): Promise<BorrowRequest[]> => {
    const { data, error } = await supabase
      .from('borrow_request')
      .select(`*, resource(name), users(name)`)
      .eq('status', 'PENDING');

    if (error) throw error;
    return data as BorrowRequest[];
  },

  //update status of borrow request
  //uses borrow_request table
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
  }


};
