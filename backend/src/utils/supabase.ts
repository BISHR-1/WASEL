import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Database operations will fail.');
}

// We use the Service Role Key for backend operations to bypass RLS when necessary (e.g. audit logs)
// Be careful with this client.
export const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        // Pass node-fetch for compatibility if global fetch is missing or issues arise
        global: {
            fetch: fetch as any
        }
    }
);
