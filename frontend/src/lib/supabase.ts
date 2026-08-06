import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ivtuywjsgmwbwdslwpnl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8NOrASq_galp95yBjN6csQ_NP_4sdTT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
