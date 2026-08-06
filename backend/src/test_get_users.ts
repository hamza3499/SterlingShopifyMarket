import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

async function testQuery() {
  console.log('Testing select without combos:');
  const res1 = await supabase.from('users').select('*').eq('role', 'user');
  console.log('res1 error:', res1.error);
  console.log('res1 data count:', res1.data?.length);

  console.log('\nTesting select WITH combos:');
  const res2 = await supabase.from('users').select('*, combos(position, status)').eq('role', 'user');
  console.log('res2 error:', res2.error);
  console.log('res2 data count:', res2.data?.length);

  process.exit(0);
}

testQuery();
