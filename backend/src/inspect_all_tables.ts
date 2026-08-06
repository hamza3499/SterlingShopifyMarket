import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

async function inspectTables() {
  console.log('--- CHECKING TABLES IN SUPABASE ---');
  
  // Try querying common table names
  const tableNames = ['users', 'profiles', 'user_profiles', 'accounts', 'user', 'member', 'members'];
  for (const name of tableNames) {
    try {
      const { data, error, count } = await supabase.from(name).select('*', { count: 'exact' }).limit(5);
      if (!error && data) {
        console.log(`Table "${name}": Found ${data.length} rows (total count: ${count})`);
        if (data.length > 0) {
          console.log(`Sample row from "${name}":`, data[0]);
        }
      } else {
        console.log(`Table "${name}": ${error?.message || 'not found'}`);
      }
    } catch (e: any) {
      console.log(`Table "${name}": error ${e.message}`);
    }
  }

  process.exit(0);
}

inspectTables();
