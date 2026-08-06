import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ws = require('ws');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Service Role Key');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  realtime: {
    transport: ws as any
  }
});

// Admin client that ALWAYS stays unauthenticated by user tokens (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  realtime: {
    transport: ws as any
  }
});

export const connectDB = async () => {
  console.log('Supabase initialized with URL:', supabaseUrl);
};
