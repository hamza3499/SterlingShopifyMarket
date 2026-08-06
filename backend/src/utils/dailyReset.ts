import { supabase } from '../config/db';

export const runDailyReset = async () => {
  try {
    console.log('🔄 Executing automated 24-hour VIP Task & Progress Reset...');

    // Reset daily task counts, clear pending tasks, reset room approvals back to VIP 1 requirement
    const { error } = await supabase
      .from('users')
      .update({
        completed_tasks_today: 0,
        pending_task: null,
        vip_level_request: 0,
        vip_level_request_status: 'none',
        approved_vip_level: 1, // Reset access to VIP Level 1 only
        vip_level: 1,
        recently_shown_products: []
      })
      .neq('role', 'admin'); // Reset all standard members

    if (error) throw error;

    // Reset scheduled combos
    await supabase.from('combos').delete().eq('status', 'scheduled');

    console.log('✅ Daily 24-hour reset completed successfully.');
  } catch (err) {
    console.error('❌ Daily reset error:', err);
  }
};

// Initialize recurring 24-hour timer (runs every 24 hours / check hourly for midnight boundary)
export const initDailyResetCron = () => {
  // Run immediately on boot if needed, then schedule check every hour
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() < 5) {
      runDailyReset();
    }
  }, 1000 * 60 * 15); // Check every 15 minutes
};
