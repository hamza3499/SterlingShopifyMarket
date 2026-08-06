import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/db';

// ─── Helper: resolve username → email via auth.users metadata ───────────────
async function resolveEmail(usernameOrEmail: string): Promise<string | null> {
  if (usernameOrEmail.includes('@')) return usernameOrEmail;

  // 1. Try public.users table (if schema has been migrated)
  try {
    const { data: row } = await supabase
      .from('users')
      .select('email')
      .eq('username', usernameOrEmail)
      .maybeSingle();
    if (row?.email) return row.email;
  } catch (_) {
    // column may not exist yet — fall through
  }

  // 2. Fall back: scan auth.users metadata for matching username
  const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (!authList?.users) return null;

  const match = authList.users.find(
    (u) => u.user_metadata?.username?.toLowerCase() === usernameOrEmail.toLowerCase()
  );
  return match?.email ?? null;
}

// ─── Helper: build user profile ──────────────────────────────────────────────
async function buildProfile(userId: string, fallback: Record<string, any>) {
  let { data: pub } = await supabaseAdmin.from('users').select('*').eq('id', userId).maybeSingle();

  if (!pub) {
    const uname = fallback.username || fallback.email?.split('@')[0] || `user_${userId.substring(0, 6)}`;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const role = fallback.role || (uname === 'admin' ? 'admin' : 'user');

    const { data: inserted } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        username: uname,
        role: role,
        balance: role === 'admin' ? 100000 : 0,
        vip_level: role === 'admin' ? 3 : 1,
        invite_code: inviteCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('*')
      .maybeSingle();

    if (inserted) {
      pub = inserted;
    }
  }

  return {
    _id: userId,
    username:               pub?.username               ?? fallback.username ?? fallback.email,
    email:                  pub?.email                  ?? fallback.email,
    role:                   pub?.role                   ?? fallback.role ?? 'user',
    balance:                pub?.balance                ?? 0,
    vipLevel:               pub?.vip_level              ?? 1,
    completedTasksToday:    pub?.completed_tasks_today  ?? 0,
    totalCommission:        pub?.total_commission        ?? 0,
    inviteCode:             pub?.invite_code             ?? '',
    avatar:                 pub?.avatar                  ?? null,
  };
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, inviteCode } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Validate invite code
    if (inviteCode) {
      const { data: referrer } = await supabase
        .from('users').select('id').eq('invite_code', inviteCode).single();
      if (!referrer) {
        return res.status(400).json({ success: false, message: 'Invalid invite code' });
      }
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (authError) {
      const msg = authError.message.includes('already registered')
        ? 'User already exists'
        : authError.message;
      return res.status(400).json({ success: false, message: msg });
    }

    const userId = authData.user.id;

    // Sign in to get session token
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email, password,
    });
    if (loginError) throw loginError;

    const profile = await buildProfile(userId, { username, email, role: 'user' });

    return res.status(201).json({
      success: true,
      data: { ...profile, token: loginData.session?.access_token },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide credentials' });
    }

    // Resolve username → email
    const email = await resolveEmail(username);
    if (!email) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Sign in
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      console.error('[login] signIn error:', loginError.message);
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const userId = loginData.user.id;

    // Get auth user metadata as fallback
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const meta = authUser?.user?.user_metadata ?? {};

    const profile = await buildProfile(userId, {
      username: meta.username ?? email,
      email,
      role: meta.role ?? 'user',
    });

    return res.json({
      success: true,
      data: { ...profile, token: loginData.session?.access_token },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};
