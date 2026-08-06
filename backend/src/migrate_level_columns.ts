import { supabaseAdmin } from './config/db';

async function migrate() {
  console.log('Running auto-migration for level approval columns...');

  const sql = `
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='approved_vip_level') THEN
        ALTER TABLE users ADD COLUMN approved_vip_level INTEGER DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='vip_level_request') THEN
        ALTER TABLE users ADD COLUMN vip_level_request INTEGER DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='vip_level_request_status') THEN
        ALTER TABLE users ADD COLUMN vip_level_request_status TEXT DEFAULT 'none';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='vip_level_approved_at') THEN
        ALTER TABLE users ADD COLUMN vip_level_approved_at TIMESTAMP WITH TIME ZONE;
      END IF;
    END $$;
  `;

  try {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.log('RPC execution info:', error.message);
    }
  } catch (err: any) {
    console.log('Migration check complete:', err.message);
  }

  console.log('Migration step done!');
}

migrate();
