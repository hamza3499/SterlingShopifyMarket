import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../config/db';

const SETTINGS_FILE = path.join(__dirname, '../../data/system_settings.json');
const DEFAULT_DEPOSIT_ADDRESS = "TS9CkrB8Ri9qbtf4M3v4bLw9k9mK4k1qAo";

// Ensure data directory exists
const dataDir = path.dirname(SETTINGS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const getOfficialDepositAddress = async (): Promise<string> => {
  // 1. Try local JSON file first for immediate sync
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const json = JSON.parse(content);
      if (json.officialDepositAddress && json.officialDepositAddress.trim().length >= 10) {
        return json.officialDepositAddress.trim();
      }
    }
  } catch (_) {}

  // 2. Try DB task_settings
  try {
    const { data } = await supabaseAdmin
      .from('task_settings')
      .select('deposit_address')
      .eq('id', 1)
      .maybeSingle();

    if (data && data.deposit_address) {
      return data.deposit_address;
    }
  } catch (_) {}

  return DEFAULT_DEPOSIT_ADDRESS;
};

export const updateOfficialDepositAddress = async (newAddress: string): Promise<string> => {
  const cleanAddress = newAddress.trim();

  // 1. Save to JSON file backup
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ officialDepositAddress: cleanAddress }, null, 2));
  } catch (_) {}

  // 2. Save to DB task_settings if column exists
  try {
    await supabaseAdmin
      .from('task_settings')
      .update({ deposit_address: cleanAddress })
      .eq('id', 1);
  } catch (_) {}

  return cleanAddress;
};
