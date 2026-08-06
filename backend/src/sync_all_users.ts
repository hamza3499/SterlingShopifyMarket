import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

async function syncAllUsers() {
  console.log('--- SYNCING ALL SUPABASE AUTH USERS TO PUBLIC.USERS ---');

  // 1. Fetch all users from Supabase Auth
  const { data: authList, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authErr || !authList?.users) {
    console.error('Failed to list auth users:', authErr);
    process.exit(1);
  }

  console.log(`Found ${authList.users.length} users in Supabase Auth.`);

  for (const u of authList.users) {
    const email = u.email || '';
    const username = u.user_metadata?.username || email.split('@')[0] || `user_${u.id.substring(0, 6)}`;
    const role = u.user_metadata?.role || (username === 'admin' ? 'admin' : 'user');
    const inviteCode = (username === 'admin' ? 'ADMIN1' : Math.random().toString(36).substring(2, 8).toUpperCase());

    console.log(`Syncing user: ID=${u.id} | Email=${email} | Username=${username} | Role=${role}`);

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: u.id,
        username,
        role,
        balance: role === 'admin' ? 100000 : 0,
        vip_level: role === 'admin' ? 3 : 1,
        invite_code: inviteCode,
        created_at: u.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('*');

    if (error) {
      console.error(`  ❌ Error syncing ${username}:`, error.message);
    } else {
      console.log(`  ✅ Successfully synced ${username}`);
    }
  }

  console.log('--- ALL USERS SYNCED CLEANLY ---');
  process.exit(0);
}

syncAllUsers();
