import { supabaseAdmin } from './config/db';

async function main() {
  const tables = ['users', 'tasks', 'transactions', 'task_settings', 'products', 'combos', 'support_threads', 'support_messages', 'system_settings'];
  for (const table of tables) {
    const { data, error, count } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ Table '${table}':`, error.message);
    } else {
      console.log(`✅ Table '${table}': Exists with ${count} rows`);
    }
  }
}

main();
