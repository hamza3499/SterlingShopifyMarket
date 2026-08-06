import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/db';

const mapUserToCamelCase = (user: any) => {
  if (!user) return null;
  const activeCombos = user.combos ? user.combos.filter((c: any) => c.status === 'active' || c.status === 'scheduled').map((c: any) => c.position).join(', ') : '';
  return {
    _id: user.id,
    username: user.username,
    role: user.role,
    balance: Number(user.balance),
    vipLevel: user.vip_level,
    completedTasksToday: user.completed_tasks_today,
    totalDeposited: Number(user.total_deposited),
    totalWithdrawn: Number(user.total_withdrawn),
    totalCommission: Number(user.total_commission),
    inviteCode: user.invite_code,
    pendingTask: user.pending_task,
    isTaskLocked: user.is_task_locked,
    currentSessionCommission: Number(user.current_session_commission),
    createdAt: user.created_at,
    activeCombos,
    approvedVipLevel: user.approved_vip_level,
    vipLevelRequest: user.vip_level_request,
    vipLevelRequestStatus: user.vip_level_request_status,
    vipLevelApprovedAt: user.vip_level_approved_at,
    withdrawalAddress: user.withdrawal_address
  };
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*, combos(position, status)')
      .eq('role', 'user')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json({ success: true, data: (users || []).map(mapUserToCamelCase) });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getReferrals = async (req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, referred_by, created_at')
      .not('referred_by', 'is', null);
      
    if (error) throw error;

    // Fetch referrer names
    const referralList = await Promise.all(users.map(async (u) => {
      const { data: referrer } = await supabaseAdmin.from('users').select('username').eq('id', u.referred_by).single();
      return {
        _id: u.id,
        username: u.username,
        referrer: referrer?.username || 'Unknown',
        createdAt: u.created_at
      };
    }));

    res.json({ success: true, data: referralList });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const editUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { balance, vipLevel, withdrawalAddress } = req.body;

    const updates: any = {};
    if (balance !== undefined) updates.balance = Number(balance);
    if (vipLevel !== undefined) updates.vip_level = Number(vipLevel);
    if (withdrawalAddress !== undefined) updates.withdrawal_address = withdrawalAddress;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: mapUserToCamelCase(user) });
  } catch (error) {
    console.error('editUser error:', (error as Error).message);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const scheduleCombo = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { combos } = req.body;

    if (Array.isArray(combos)) {
      // BATCH Injection
      const finalCombos = combos.map((c: any) => ({
        user_id: userId,
        position: Number(c.position),
        items_count: Number(c.itemsCount || 3),
        price: Number(c.price),
        commission: Number(c.commission),
        status: 'scheduled'
      }));

      const { data, error } = await supabaseAdmin.from('combos').insert(finalCombos);
      if (error) throw error;
      return res.json({ success: true, data });
    } else {
      // SINGLE Injection
      const { position, itemsCount, price, commission } = req.body;
      const { data: combo, error } = await supabaseAdmin
        .from('combos')
        .insert({
          user_id: userId,
          position: Number(position),
          items_count: Number(itemsCount || 3),
          price: Number(price),
          commission: Number(commission),
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data: combo });
    }
  } catch (error) {
    console.error('INJECTION ERROR:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getUserCombos = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('combos')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['scheduled', 'active'])
      .order('position', { ascending: true });
      
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const refreshUserOrders = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('pending_task')
      .eq('id', userId)
      .single();

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Cancel active/pending tasks
    if (user.pending_task) {
      await supabaseAdmin.from('tasks').update({ status: 'frozen' }).eq('id', user.pending_task);
    }

    // Reset user daily tasks and remove pending task
    await supabaseAdmin.from('users').update({ 
      completed_tasks_today: 0,
      pending_task: null
    }).eq('id', userId);

    // Cancel pending combos
    await supabaseAdmin.from('combos').update({ status: 'cancelled' }).eq('user_id', userId).eq('status', 'scheduled');

    res.json({ success: true, message: 'User tasks refreshed' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const approveTransaction = async (req: Request, res: Response) => {
  try {
    const { txId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', txId)
      .single();

    if (txError || !transaction) return res.status(404).json({ success: false, message: 'Tx not found' });
    
    if (transaction.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Already processed' });
    }

    // Update transaction status
    await supabaseAdmin.from('transactions').update({ status }).eq('id', txId);

    if (status === 'approved') {
      const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', transaction.user_id).single();
      
      if (user) {
        if (transaction.type === 'deposit') {
          const newBalance = Number(user.balance) + Number(transaction.net_amount || transaction.amount);
          
          await supabaseAdmin.from('users').update({
            balance: newBalance,
            total_deposited: Number(user.total_deposited || 0) + Number(transaction.net_amount || transaction.amount),
          }).eq('id', user.id);
        } else if (transaction.type === 'withdrawal') {
          await supabaseAdmin.from('users').update({
            total_withdrawn: Number(user.total_withdrawn || 0) + Number(transaction.amount)
          }).eq('id', user.id);
        }
      }
    }

    res.json({ success: true, data: { ...transaction, status } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getStats = async (req: Request, res: Response) => {
    try {
        const { count: totalUsers } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user');
        const { count: totalVAs } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'va');
        
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let adminEarnings = 0;
        let pendingWithdrawals = 0;

        try {
            const { data: deposits } = await supabaseAdmin.from('transactions').select('amount, net_amount').eq('type', 'deposit').eq('status', 'approved');
            totalDeposits = deposits?.reduce((sum, d) => sum + Number(d.net_amount || d.amount), 0) || 0;
            
            const { data: withdrawals } = await supabaseAdmin.from('transactions').select('amount').eq('type', 'withdrawal').eq('status', 'approved');
            totalWithdrawals = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
            adminEarnings = totalWithdrawals * 0.05;

            const { count: pendingCount } = await supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'withdrawal').eq('status', 'pending');
            pendingWithdrawals = pendingCount || 0;
        } catch (e) {
            console.warn("Transactions table calculation error", e);
        }

        res.json({
            success: true,
            data: {
                totalUsers: totalUsers || 0,
                activeVAs: totalVAs || 0,
                totalDeposits,
                totalWithdrawals,
                adminEarnings,
                pendingWithdrawals
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
}

export const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('transactions')
            .select(`
                *,
                users (
                    username,
                    vip_level
                )
            `)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// --- TASK SETTINGS ---
export const getTaskSettings = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin.from('task_settings').select('*').order('vip_level', { ascending: true });
        if (error) throw error;
        
        const mappedData = data.map((s: any) => ({
            ...s,
            total_orders: s.total_orders ?? s.daily_limit,
            min_access_balance: s.min_access_balance ?? s.balance_min,
            fixed_commission: s.fixed_commission ?? s.commission_start
        }));

        res.json({ success: true, data: mappedData });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export const updateTaskSettings = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const body = { ...req.body };
        
        const finalBody: any = {};
        if (body.daily_limit !== undefined) finalBody.daily_limit = body.daily_limit;
        else if (body.total_orders !== undefined) finalBody.daily_limit = body.total_orders;
        
        if (body.balance_min !== undefined) finalBody.balance_min = body.balance_min;
        else if (body.min_access_balance !== undefined) finalBody.balance_min = body.min_access_balance;
        
        if (body.balance_max !== undefined) finalBody.balance_max = body.balance_max;
        if (body.commission_start !== undefined) finalBody.commission_start = body.commission_start;
        else if (body.fixed_commission !== undefined) finalBody.commission_start = body.fixed_commission;
        
        if (body.commission_end !== undefined) finalBody.commission_end = body.commission_end;
        if (body.randomization_pct !== undefined) finalBody.randomization_pct = body.randomization_pct;
        if (body.vip_level !== undefined) finalBody.vip_level = body.vip_level;

        const { data, error } = await supabaseAdmin.from('task_settings').update(finalBody).eq('id', id).select().single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// --- PRODUCT LIBRARY ---
export const getProducts = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        const mappedData = data.map((p: any) => ({
            ...p,
            price: p.price !== undefined ? p.price : p.price_range_min,
            commission: p.commission !== undefined ? p.commission : p.price_range_max
        }));

        res.json({ success: true, data: mappedData });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export const addProduct = async (req: Request, res: Response) => {
    try {
        const body = { ...req.body };
        
        const finalBody: any = {
            name: body.name,
            description: body.description,
            image_url: body.image_url,
            category: body.category,
            vip_level: body.vip_level,
            is_combo_item: body.is_combo_item
        };

        finalBody.price = body.price;
        finalBody.commission = body.commission;

        const { data, error } = await supabaseAdmin.from('products').insert(finalBody).select().single();
        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const body = { ...req.body };
        
        const finalBody: any = {};
        if (body.name !== undefined) finalBody.name = body.name;
        if (body.description !== undefined) finalBody.description = body.description;
        if (body.image_url !== undefined) finalBody.image_url = body.image_url;
        if (body.category !== undefined) finalBody.category = body.category;
        if (body.vip_level !== undefined) finalBody.vip_level = body.vip_level;
        if (body.is_combo_item !== undefined) finalBody.is_combo_item = body.is_combo_item;
        
        if (body.price !== undefined) finalBody.price = body.price;
        if (body.commission !== undefined) finalBody.commission = body.commission;

        const { data, error } = await supabaseAdmin.from('products').update(finalBody).eq('id', id).select().single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// --- SUPPORT CHAT ---
export const getThreads = async (req: Request, res: Response) => {
  try {
    const { data: threads, error } = await supabaseAdmin
      .from('support_threads')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    if (!threads || threads.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Manual join users to avoid PostgREST schema cache join issues
    const userIds = Array.from(new Set(threads.map(t => t.user_id).filter(Boolean)));
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, username, vip_level')
      .in('id', userIds);

    const userMap = new Map((users || []).map(u => [u.id, u]));

    const enrichedThreads = threads.map(t => ({
      ...t,
      users: userMap.get(t.user_id) || { username: 'Guest Member', vip_level: 1 }
    }));

    res.json({ success: true, data: enrichedThreads });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getThreadMessages = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;

    const { data: thread } = await supabaseAdmin
      .from('support_threads')
      .select('*')
      .eq('id', threadId)
      .maybeSingle();

    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('user_id', thread.user_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    await supabaseAdmin
      .from('support_messages')
      .update({ is_read: true })
      .eq('user_id', thread.user_id)
      .eq('sender', 'user');

    await supabaseAdmin
      .from('support_threads')
      .update({ unread_admin_count: 0 })
      .eq('id', threadId);

    res.json({ success: true, data: messages || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const sendAdminMessage = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content required' });
    }

    const { data: thread } = await supabaseAdmin
      .from('support_threads')
      .select('id, user_id, unread_user_count')
      .eq('id', threadId)
      .maybeSingle();

    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

    const { data: newMessage, error } = await supabaseAdmin
      .from('support_messages')
      .insert({
        user_id: thread.user_id,
        message,
        sender: 'admin',
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin
      .from('support_threads')
      .update({
        last_message_at: new Date(),
        unread_user_count: (thread.unread_user_count || 0) + 1
      })
      .eq('id', threadId);

    const io = req.app.get('io');
    if (io) io.to(thread.user_id).emit('receive_support_message', newMessage);

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const resolveThread = async (req: Request, res: Response) => {
  try {
    const { threadId } = req.params;
    const { status } = req.body;

    const { data, error } = await supabaseAdmin
      .from('support_threads')
      .update({ status })
      .eq('id', threadId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// --- LEVEL APPROVALS ---
export const getLevelRequests = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('vip_level_request_status', 'pending')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data.map(mapUserToCamelCase) });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const approveLevelUnlock = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { level, action } = req.body;

    if (action === 'approved') {
      // Approve the new VIP level AND reset task counter so user starts fresh at 0/20
      const { error } = await supabaseAdmin.from('users').update({
        approved_vip_level: level,
        vip_level: level,
        vip_level_request_status: 'approved',
        vip_level_approved_at: new Date().toISOString(),
        completed_tasks_today: 0,   // ← RESET counter for new VIP level
        pending_task: null,          // ← Clear any stuck pending task
        last_task_reset: new Date().toISOString()
      }).eq('id', userId);
      if (error) throw error;
    } else {
      await supabaseAdmin.from('users').update({
        vip_level_request_status: 'rejected'
      }).eq('id', userId);
    }

    res.json({ success: true, message: `Level ${level} ${action}` });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateDepositAddress = async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    if (!address || address.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid official deposit address' });
    }
    const { updateOfficialDepositAddress } = await import('../utils/systemSettings');
    const updated = await updateOfficialDepositAddress(address);
    res.json({ success: true, address: updated, message: 'Official deposit address updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getDepositAddressAdmin = async (req: Request, res: Response) => {
  try {
    const { getOfficialDepositAddress } = await import('../utils/systemSettings');
    const address = await getOfficialDepositAddress();
    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
