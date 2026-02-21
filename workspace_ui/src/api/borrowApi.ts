import { BorrowRequest } from '../types';
import { supabase } from '../supabaseClient';

export const borrowApi = {
  createRequest: async (resourceId: string, userId: string): Promise<BorrowRequest> => {
    // In a real app, we'd fetch the resource name and user name first or use a RPC
    const { data: created, error } = await supabase
      .from('borrow_request')
      .insert([{ 
        resource_id: resourceId, 
        user_id: userId, 
        status: 'PENDING'
      }])
      .select()
      .single();

    if (error) throw error;

    // Update resource status to REQUESTED
    await supabase
      .from('resource')
      .update({ status: 'REQUESTED' })
      .eq('id', resourceId);

    return created as BorrowRequest;
  },

  getApprovals: async (): Promise<BorrowRequest[]> => {
    const { data, error } = await supabase
      .from('borrow_request')
      .select(`*, resource(name), users(name)`)
      .eq('status', 'PENDING');

    if (error) throw error;
    return data as BorrowRequest[];
  },


  updateStatus: async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<BorrowRequest> => {
    const { data: updated, error } = await supabase
      .from('borrow_request')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update resource status based on approval/rejection
    const resourceStatus = status === 'APPROVED' ? 'BORROWED' : 'AVAILABLE';
    await supabase
      .from('resource')
      .update({ status: resourceStatus })
      .eq('id', updated.resource_id);

    return updated as BorrowRequest;
  }
};
