import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

async function setupAdmin() {
  const email = 'admin@sterlingmarket.local';
  const password = 'abc1234';

  console.log(`Ensuring admin user ${email} exists in original database...`);

  // Paginate listUsers to find admin
  let page = 1;
  let authUser: any = null;
  while (!authUser) {
    const { data: usersData, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !usersData || usersData.users.length === 0) break;
    authUser = usersData.users.find(u => u.email === email);
    if (usersData.users.length < 100) break;
    page++;
  }

  if (authUser) {
    console.log('Found existing Auth admin user ID:', authUser.id, 'Updating password...');
    const { error: updateErr } = await supabase.auth.admin.updateUserById(authUser.id, {
      password,
      email_confirm: true,
      user_metadata: { username: 'admin', role: 'admin' }
    });
    if (updateErr) console.error('Error updating password:', updateErr);
  } else {
    console.log(`Creating new auth user ${email}...`);
    const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: 'admin', role: 'admin' }
    });
    if (createError) {
      console.error('Error creating auth user:', createError);
      process.exit(1);
    }
    authUser = newAuthUser.user;
  }

  // Insert/Upsert into public.users table with role = 'admin'
  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .upsert({
      id: authUser.id,
      username: 'admin',
      role: 'admin',
      vip_level: 3,
      balance: 100000,
      invite_code: 'ADMIN1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select('*');

  if (dbError) {
    console.error('Error upserting public.users record:', dbError);
  } else {
    console.log('🎉 SUCCESSFULLY CONFIGURED MASTER ADMIN IN ORIGINAL DATABASE! Username/Email:', email, 'Password:', password);
  }

  process.exit(0);
}

setupAdmin();
