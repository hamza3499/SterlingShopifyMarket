import dotenv from 'dotenv';
import { supabase } from './config/db';

dotenv.config();

async function updateVIP() {
  console.log('Updating VIP settings...');
  
  const updates = [
    { level: 1, name: 'VIP 1 - Shopify', min: 20, max: 398, rate: 3.0 },
    { level: 2, name: 'VIP 2 - Shopify', min: 399, max: 798, rate: 8.0 },
    { level: 3, name: 'VIP 3 - Shopify', min: 799, max: 999999, rate: 12.0 },
  ];

  for (const up of updates) {
    const { error } = await supabase
      .from('task_settings')
      .update({
        level_name: up.name,
        balance_min: up.min,
        balance_max: up.max,
        commission_rate: up.rate,
        min_access_balance: up.min,
        total_orders: 20
      })
      .eq('vip_level', up.level);

    if (error) {
      console.log(`Fallback updating VIP ${up.level} without commission_rate column if missing:`, error.message);
      await supabase
        .from('task_settings')
        .update({
          balance_min: up.min,
          balance_max: up.max,
        })
        .eq('vip_level', up.level);
    } else {
      console.log(`Updated VIP ${up.level} rate to ${up.rate}% successfully.`);
    }
  }
  process.exit(0);
}

updateVIP();
