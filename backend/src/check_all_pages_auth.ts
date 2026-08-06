import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

async function checkAllAuthPages() {
  console.log('Fetching all pages from Supabase Auth...');
  let page = 1;
  let totalAuthUsers = 0;
  
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
      console.error('Error fetching page', page, error);
      break;
    }
    const users = data?.users || [];
    console.log(`Page ${page}: fetched ${users.length} users.`);
    totalAuthUsers += users.length;
    
    users.forEach((u) => {
      console.log(`- ID: ${u.id} | Email: ${u.email} | Username: ${u.user_metadata?.username}`);
    });

    if (users.length < 100) {
      break;
    }
    page++;
  }

  console.log(`\nTOTAL AUTH USERS FOUND: ${totalAuthUsers}`);
  process.exit(0);
}

checkAllAuthPages();
