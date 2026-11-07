import { supabase } from '../supabaseClient';

/** Supabase-backed helpers for managing the signed-in user's account. */
export const userApi = {
    /** Permanently deletes the signed-in user's account via the `delete_user_account` RPC; throws with the database's error message on failure. */
    deleteAccount: async (): Promise<void> => {
        // Call the custom SQL function we created in Supabase
        const { error } = await supabase.rpc('delete_user_account');

        if (error) {
            // Supabase RPC errors usually come back with the exact RAISE EXCEPTION message we wrote
            throw new Error(error.message || 'Failed to delete account');
        }
    }
};