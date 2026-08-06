import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

async function listUsers() {
  const { data: authList, error: authErr } = await supabase.auth.admin.listUsers();
  console.log('--- SUPABASE AUTH USERS ---');
  if (authErr) console.error('Auth error:', authErr);
  else {
    authList.users.forEach((u) => {
      console.log(`ID: ${u.id} | Email: ${u.email} | Metadata:`, u.user_metadata);
    });
  }

  console.log('\n--- PUBLIC.USERS TABLE ---');
  const { data: dbUsers, error: dbErr } = await supabase.from('users').select('*');
  if (dbErr) console.error('DB error:', dbErr);
  else console.log(dbUsers);

  process.exit(0);
}

listUsers();
