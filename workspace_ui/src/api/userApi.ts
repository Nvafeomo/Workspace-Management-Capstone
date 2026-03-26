import { supabase } from '../supabaseClient';

export const userApi = {
    deleteAccount: async (): Promise<void> => {
        // Call the custom SQL function we created in Supabase
        const { error } = await supabase.rpc('delete_user_account');

        if (error) {
            // Supabase RPC errors usually come back with the exact RAISE EXCEPTION message we wrote
            throw new Error(error.message || 'Failed to delete account');
        }
    }
};