import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-expo';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

/**
 * Custom hook to create a Supabase client with Clerk authentication
 * This ensures all Supabase requests include the Clerk session token
 */
export function useSupabaseClient() {
    const { getToken } = useAuth();

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: async () => {
                const token = await getToken({ template: 'supabase' });
                return token ? { Authorization: `Bearer ${token}` } : {};
            },
        },
        auth: {
            persistSession: false,
        },
    });

    return supabase;
}

// For use in non-React contexts (like utility functions)
// Note: This won't have the Clerk token automatically
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
    },
});
