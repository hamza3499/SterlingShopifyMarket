import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase, supabaseAdmin } from '../config/db';
import { calculateProgressiveCommission } from '../utils/progressiveCommission';

const mapTaskToCamelCase = (task: any) => {
  if (!task) return null;
  return {
    id: task.id,
    userId: task.user_id,
    taskNumber: task.task_number,
    productName: task.product_name,
    productImage: task.product_image,
    price: Number(task.price),
    commission: Number(task.commission),
    status: task.status,
    comboId: task.combo_id,
    products: task.products,
    createdAt: task.created_at
  };
};

// @desc    Get user profile & dashboard data
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Fetch user with supabaseAdmin to bypass RLS and get live database balance
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const userData = user || req.user || { id: userId, username: 'User', role: 'user' };

    // Fetch pending task if any
    let pendingTask = null;
    if (userData.pending_task) {
      try {
        const { data: taskData } = await supabaseAdmin
          .from('tasks')
          .select('*')
          .eq('id', userData.pending_task)
          .single();
        pendingTask = mapTaskToCamelCase(taskData);
      } catch (_) {}
    }

    // Ensure user has an invite code
    let inviteCode = userData.invite_code || userData.inviteCode || 'STERLING';
    if (!inviteCode) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      try {
        await supabaseAdmin.from('users').update({ invite_code: inviteCode }).eq('id', userId);
      } catch (_) {}
    }

    // --- CALCULATE EARNINGS ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: todayTasks } = await supabaseAdmin
      .from('tasks')
      .select('commission')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', today.toISOString());

    const { data: yesterdayTasks } = await supabaseAdmin
      .from('tasks')
      .select('commission')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    const todayEarning = todayTasks?.reduce((sum, t) => sum + Number(t.commission), 0) || 0;
    const yesterdayEarning = yesterdayTasks?.reduce((sum, t) => sum + Number(t.commission), 0) || 0;

    // --- CHECK 24H RESET FOR ALL LEVELS COMPLETED ---
    let lastTaskReset = userData.last_task_reset;
    const currentVip = userData.vip_level ?? 1;
    const completedCount = userData.completed_tasks_today ?? 0;

    if (lastTaskReset) {
      const resetTime = new Date(lastTaskReset).getTime();
      const now = Date.now();
      if (now - resetTime >= 24 * 60 * 60 * 1000) {
        // 24 hours passed - reset everything for a new day!
        await supabaseAdmin.from('users').update({
          vip_level: 1,
          approved_vip_level: 0,
          vip_level_request: 0,
          vip_level_request_status: 'none',
          completed_tasks_today: 0,
          last_task_reset: null,
          pending_task: null
        }).eq('id', userId);

        userData.vip_level = 1;
        userData.approved_vip_level = 0;
        userData.vip_level_request = 0;
        userData.vip_level_request_status = 'none';
        userData.completed_tasks_today = 0;
        userData.last_task_reset = null;
        lastTaskReset = null;
      }
    } else if (currentVip >= 3 && completedCount >= 20) {
      lastTaskReset = new Date().toISOString();
      await supabaseAdmin.from('users').update({ last_task_reset: lastTaskReset }).eq('id', userId);
      userData.last_task_reset = lastTaskReset;
    }

    res.json({ success: true, data: { 
      _id: userData.id || userData._id || userId,
      username: userData.username || 'User',
      role: userData.role || 'user',
      balance: userData.balance ?? 0,
      vipLevel: userData.vip_level ?? userData.vipLevel ?? 1,
      approvedVipLevel: userData.approved_vip_level || 0,
      vipLevelRequest: userData.vip_level_request || 0,
      vipLevelRequestStatus: userData.vip_level_request_status || 'none',
      vipLevelApprovedAt: userData.vip_level_approved_at,
      completedTasksToday: userData.completed_tasks_today ?? 0,
      lastTaskReset: lastTaskReset || null,
      totalDeposited: userData.total_deposited ?? 0,
      totalWithdrawn: userData.total_withdrawn ?? 0,
      totalCommission: userData.total_commission ?? todayEarning,
      todayEarning,
      yesterdayEarning,
      currentSessionCommission: 0,
      isTaskLocked: userData.is_task_locked ?? false,
      inviteCode: inviteCode,
      avatar: userData.avatar ?? null,
      withdrawalAddress: userData.withdrawal_address ?? null,
      pendingTask 
    } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Generate next task (or combo)
export const generateTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.completed_tasks_today >= 20) {
      return res.status(400).json({ success: false, message: 'Session completed for this VIP room. Please wait for the daily reset or recharge to upgrade.' });
    }

    if (user.pending_task) {
      const { data: existingTask } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('id', user.pending_task)
        .single();
      return res.json({ success: true, data: mapTaskToCamelCase(existingTask) });
    }

    // 1. Fetch Task Settings for VIP Level
    const { data: settings } = await supabaseAdmin
      .from('task_settings')
      .select('*')
      .eq('vip_level', user.vip_level)
      .single();

    if (!settings) return res.status(500).json({ success: false, message: 'Task settings not configured' });

    // --- MANUAL LEVEL APPROVAL CHECK ---
    const approvedLevel = user.approved_vip_level || 0;
    
    if (user.vip_level > approvedLevel) {
      return res.status(403).json({
        success: false,
        message: `VIP Level ${user.vip_level} is not yet approved for tasks. Please request an unlock.`,
        code: 'LEVEL_NOT_APPROVED'
      });
    }

    // --- 24H EXPIRY CHECK FOR VIP 2 & 3 ---
    if (user.vip_level >= 2 && user.vip_level_approved_at) {
      const approvedAt = new Date(user.vip_level_approved_at).getTime();
      const now = new Date().getTime();
      const diffHours = (now - approvedAt) / (1000 * 60 * 60);

      if (diffHours >= 24) {
        // Reset approval if 24h passed
        await supabaseAdmin.from('users').update({ 
          approved_vip_level: 1, // Reset to Level 1 or 0
          vip_level_request_status: 'none'
        }).eq('id', userId);

        return res.status(403).json({
          success: false,
          message: `Your 24-hour approval for VIP Level ${user.vip_level} has expired. Please request a new unlock.`,
          code: 'APPROVAL_EXPIRED'
        });
      }
    }


    // 1.5. CHECK MIN BALANCE REQUIREMENT
    if (user.balance < Number(settings.min_access_balance)) {
      return res.status(403).json({ 
        success: false, 
        message: `Minimum balance of $${settings.min_access_balance} required to access orders`,
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    if (user.is_task_locked) {
      return res.status(403).json({ success: false, message: 'Your task access has been locked by admin' });
    }

    if (user.completed_tasks_today >= 20) {
      return res.status(400).json({ success: false, message: 'Session completed. Please wait for next cycle or recharge to upgrade.' });
    }

    const nextTaskNumber = user.completed_tasks_today + 1;

    // 2. Fetch Product Pool with Anti-Repetition
    let recentIds = user.recently_shown_products || [];
    let query = supabaseAdmin.from('products').select('*').eq('vip_level', user.vip_level || 1);
    
    if (recentIds.length > 0) {
      query = query.not('id', 'in', `(${recentIds.join(',')})`);
    }

    let { data: productPool, error: poolError } = await query;

    if (poolError || !productPool || productPool.length === 0) {
      // Check if it's empty because of recentIds or because there are truly no products
      const { count } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('vip_level', user.vip_level || 1);
      
      if (!count || count === 0) {
        return res.status(400).json({ success: false, message: `No products found for VIP ${user.vip_level}. Please add products in Admin.` });
      }

      // Products exist, so it must be exhausted due to recentIds. Reset and re-fetch.
      await supabaseAdmin.from('users').update({ recently_shown_products: [] }).eq('id', userId);
      const { data: resetPool } = await supabaseAdmin.from('products').select('*').eq('vip_level', user.vip_level || 1);
      productPool = resetPool;
      recentIds = [];
    }

    // Map fields for schema resilience
    productPool = productPool!.map((p: any) => ({
      ...p,
      price: p.price !== undefined ? p.price : p.price_range_min,
      commission: p.commission !== undefined ? p.commission : p.price_range_max
    }));

    // 3. Auto-Schedule Combos if it's the start of the day and not yet scheduled
    if (nextTaskNumber === 1) {
      const { data: existingCombos } = await supabaseAdmin
        .from('combos')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'scheduled');
      
      if (!existingCombos || existingCombos.length === 0) {
        const comboCount = Number(settings.combo_count || 0);
        if (comboCount > 0) {
          const totalOrders = Number(settings.total_orders);
          // Generate unique random positions (not the first, not the last)
          const positions: number[] = [];
          while (positions.length < comboCount) {
            const pos = Math.floor(Math.random() * (totalOrders - 2)) + 2;
            if (!positions.includes(pos)) positions.push(pos);
          }

          // Create combo records
          const autoItemsCount = Number(settings.combo_items_count || settings.items_count || 3);
          const comboItems = productPool.filter((p: any) => p.is_combo_item);
          const comboSourcePool = comboItems.length >= autoItemsCount ? comboItems : productPool;
          if (comboSourcePool.length >= autoItemsCount) {
            for (const pos of positions) {
              const selectedComboProducts = [...comboSourcePool].sort(() => 0.5 - Math.random()).slice(0, autoItemsCount);
              const totalPrice = selectedComboProducts.reduce((sum, p) => sum + Number(p.price), 0);
              const totalComm = selectedComboProducts.reduce((sum, p) => sum + Number(p.commission), 0);
              
              await supabaseAdmin.from('combos').insert({
                user_id: userId,
                position: pos,
                items_count: autoItemsCount,
                price: totalPrice,
                commission: totalComm,
                status: 'scheduled'
              });
            }
          }
        }
      }
    }

    // 4. Check for Scheduled or Active Combo at this position
    const { data: combo } = await supabaseAdmin
      .from('combos')
      .select('*')
      .eq('user_id', userId)
      .eq('position', nextTaskNumber)
      .in('status', ['scheduled', 'active'])
      .maybeSingle();

    let taskData: any = {
      user_id: userId,
      task_number: nextTaskNumber,
      status: 'pending',
    };

    let selectedProducts = [];

    if (combo) {
      taskData.price = combo.price;
      taskData.commission = combo.commission;
      taskData.combo_id = combo.id;

      // Use items_count from combo config (admin-set number of articles)
      const itemsCount = Number(combo.items_count || 3);
      
      // Select products marked as combo items — fall back to full product pool if not enough combo items
      const comboPool = productPool.filter((p: any) => p.is_combo_item);
      const sourcePool = comboPool.length >= itemsCount ? comboPool : productPool;
      const shuffled = [...sourcePool].sort(() => 0.5 - Math.random());
      selectedProducts = shuffled.slice(0, itemsCount);

      await supabaseAdmin.from('combos').update({ status: 'active' }).eq('id', combo.id);
    } else {
      // SINGLE Task Logic - Only use non-combo items
      const affordableProducts = productPool
        .filter(p => !p.is_combo_item)
        .filter(p => p.price <= user.balance);
      
      if (affordableProducts.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No affordable products found for your current balance. Please recharge.' 
        });
      }

      const randomProduct = affordableProducts[Math.floor(Math.random() * affordableProducts.length)];
      selectedProducts = [randomProduct];

      // Price calculation: fixed price as per product setting
      taskData.price = Number(randomProduct.price);

      // Commission calculation: Use product-specific commission
      let baseCommission = Number(randomProduct.commission || 0);
      
      if (nextTaskNumber === Number(settings.total_orders)) {
        taskData.commission = baseCommission + Number(settings.fixed_commission);
      } else {
        taskData.commission = baseCommission;
      }
    }

    // Snapshot product data into the task
    taskData.product_name = selectedProducts.map(p => p.name).join(' + ');
    taskData.product_image = selectedProducts[0].image_url; // Use first image as thumbnail
    taskData.products = selectedProducts; // JSONB storage

    // 4. Insert Task with fallback if 'products' column is missing in DB
    let taskRes = await supabaseAdmin
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (taskRes.error && (taskRes.error.message?.includes('products') || taskRes.error.code === 'PGRST204')) {
      delete taskData.products;
      taskRes = await supabaseAdmin
        .from('tasks')
        .insert(taskData)
        .select()
        .single();
    }

    if (taskRes.error) throw taskRes.error;
    const task = taskRes.data;

    // 5. Update User State with fallback if recently_shown_products column is missing in DB
    const newRecentIds = [...recentIds, ...selectedProducts.map(p => p.id)].slice(-20);
    const { error: userUpdateErr } = await supabaseAdmin
      .from('users')
      .update({ 
        pending_task: task.id,
        recently_shown_products: newRecentIds
      })
      .eq('id', userId);

    if (userUpdateErr) {
      await supabaseAdmin
        .from('users')
        .update({ pending_task: task.id })
        .eq('id', userId);
    }

    res.json({ success: true, data: mapTaskToCamelCase(task) });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Complete current task
export const completeTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Always re-fetch fresh user state from DB
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userErr || !user) return res.status(404).json({ success: false, message: 'User not found' });

    let pendingTaskId = user.pending_task;

    // Fallback: If pending_task wasn't recorded on user row, find latest pending task directly from tasks table
    if (!pendingTaskId) {
      const { data: activeTask } = await supabaseAdmin
        .from('tasks')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeTask) {
        pendingTaskId = activeTask.id;
      }
    }

    if (!pendingTaskId) {
      return res.status(400).json({ success: false, message: 'No pending task' });
    }

    const { data: task, error: taskErr } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', pendingTaskId)
      .single();

    if (taskErr || !task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (Number(user.balance) < Number(task.price)) {
      const required = (Number(task.price) - Number(user.balance)).toFixed(2);
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. You need to deposit at least $${required} to complete this task.` 
      });
    }

    // Mark task as completed
    const { error: taskUpdateErr } = await supabaseAdmin
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', task.id);
    if (taskUpdateErr) throw taskUpdateErr;

    const commission = Number(task.commission);
    const currentCompleted = Number(user.completed_tasks_today || 0);
    const newBalance = Number(user.balance) + commission;
    const newTotalCommission = Number(user.total_commission) + commission;
    const newSessionCommission = commission;
    const newCompletedTasks = Math.min(currentCompleted + 1, 20);

    // Update user with confirmed .select() so we get DB-confirmed values back
    const { data: updatedUser, error: updateErr } = await supabaseAdmin
      .from('users')
      .update({ 
        balance: newBalance,
        total_commission: newTotalCommission,
        completed_tasks_today: newCompletedTasks,
        pending_task: null
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // todayEarning: use 24-hour rolling window to avoid UTC midnight timezone issues
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: todayTasksData } = await supabaseAdmin
      .from('tasks')
      .select('commission')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', last24h);
    const todayEarning = (todayTasksData || []).reduce((sum, t) => sum + Number(t.commission), 0);

    // Update combo status if part of combo
    if (task.combo_id) {
       await supabaseAdmin.from('combos').update({ status: 'completed' }).eq('id', task.combo_id);
    }

    // Use DB-confirmed values from updatedUser (or fall back to computed values)
    const confirmedCompleted = updatedUser?.completed_tasks_today ?? newCompletedTasks;
    const confirmedBalance = updatedUser?.balance ?? newBalance;
    const confirmedTotalCommission = updatedUser?.total_commission ?? newTotalCommission;

    // Check if all levels (VIP 3, 20/20) completed today
    let lastTaskReset = updatedUser?.last_task_reset || user.last_task_reset;
    if ((user.vip_level ?? 1) >= 3 && confirmedCompleted >= 20) {
      if (!lastTaskReset) {
        lastTaskReset = new Date().toISOString();
        await supabaseAdmin.from('users').update({ last_task_reset: lastTaskReset }).eq('id', userId);
      }
    }

    const camelUser = {
      _id: userId,
      username: user.username,
      role: user.role,
      balance: Number(confirmedBalance),
      vipLevel: user.vip_level ?? 1,
      approvedVipLevel: user.approved_vip_level ?? 0,
      vipLevelRequest: user.vip_level_request ?? 0,
      vipLevelRequestStatus: user.vip_level_request_status ?? 'none',
      vipLevelApprovedAt: user.vip_level_approved_at,
      completedTasksToday: Number(confirmedCompleted),
      lastTaskReset: lastTaskReset || null,
      totalDeposited: Number(user.total_deposited ?? 0),
      totalWithdrawn: Number(user.total_withdrawn ?? 0),
      totalCommission: Number(confirmedTotalCommission),
      todayEarning,
      yesterdayEarning: 0,
      currentSessionCommission: newSessionCommission,
      inviteCode: user.invite_code ?? 'STERLING',
      avatar: user.avatar ?? null,
      withdrawalAddress: user.withdrawal_address ?? null,
      pendingTask: null,
    };

    res.json({ success: true, data: { user: camelUser, completedTask: mapTaskToCamelCase({ ...task, status: 'completed' }) } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Submit deposit
export const submitDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, screenshot } = req.body;
    
    const { data: transaction, error: txnError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: req.user._id,
        type: 'deposit',
        amount,
        net_amount: amount,
        screenshot,
        status: 'pending'
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // Notify Admin via Socket.io
    const io = req.app.get('io');
    io.to('admin_notifications').emit('new_deposit', {
      user: req.user.username,
      amount,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error("DEPOSIT ERROR:", error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Get user transaction history
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Submit withdrawal request
export const submitWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, address } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // 1. Check balance
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('balance, withdrawal_address')
      .eq('id', userId)
      .single();


    if (userError || !user) throw new Error('User not found');
    
    if (user.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // 2. Create transaction
    const fee = Number(amount) * 0.05;
    const netAmount = Number(amount) - fee;

    const { data: transaction, error: txnError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'withdrawal',
        amount,
        net_amount: netAmount,
        wallet_address: address,
        status: 'pending'
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // 3. Deduct balance immediately & Save address if first time
    const updates: any = {
      balance: Number(user.balance) - Number(amount)
    };
    if (!user.withdrawal_address && address) {
      updates.withdrawal_address = address;
    }
    
    await supabaseAdmin.from('users').update(updates).eq('id', userId);


    // 4. Notify Admin via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('admin_notifications').emit('new_withdrawal', {
        user: req.user.username,
        amount,
      });
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error("WITHDRAWAL ERROR:", error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Update user avatar
export const updateAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { avatar } = req.body;
    const userId = req.user._id;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ avatar })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: { avatar: data.avatar } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Update user withdrawal address
export const updateWithdrawalAddress = async (req: AuthRequest, res: Response) => {
  try {
    const { address } = req.body;
    const userId = req.user._id;

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('withdrawal_address')
      .eq('id', userId)
      .single();

    if (userError || !user) throw new Error('User not found');
    if (user.withdrawal_address) {
      return res.status(400).json({ success: false, message: 'Withdrawal address already set' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ withdrawal_address: address })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: { withdrawalAddress: data.withdrawal_address } });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Get all task settings (public for authenticated users)
export const getTaskSettings = async (req: AuthRequest, res: Response) => {
    const defaultSettings = [
      { id: '1', vip_level: 1, balance_min: 20, min_access_balance: 20, commission_rate: 3.0 },
      { id: '2', vip_level: 2, balance_min: 399, min_access_balance: 399, commission_rate: 8.0 },
      { id: '3', vip_level: 3, balance_min: 799, min_access_balance: 799, commission_rate: 12.0 },
    ];

    try {
        const { data } = await supabaseAdmin.from('task_settings').select('*').order('vip_level', { ascending: true });
        if (data && data.length > 0) {
          const mapped = data.map((item: any) => {
            let rate = 3.0;
            if (Number(item.vip_level) === 2) rate = 8.0;
            if (Number(item.vip_level) === 3) rate = 12.0;
            return {
              ...item,
              min_access_balance: item.balance_min || (item.vip_level === 1 ? 20 : item.vip_level === 2 ? 399 : 799),
              commission_rate: item.commission_rate ? Number(item.commission_rate) : rate
            };
          });
          return res.json({ success: true, data: mapped });
        }
        res.json({ success: true, data: defaultSettings });
    } catch (error) {
        res.json({ success: true, data: defaultSettings });
    }
};

// @desc    Get user's task history
// @desc    Select a room (VIP Level) to start tasks
export const selectRoom = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const { vipLevel } = req.body;

        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('balance, vip_level, completed_tasks_today')
            .eq('id', userId)
            .single();

        if (userError || !user) throw new Error('User not found');

        // Check balance requirement for the new room
        const { data: settings } = await supabaseAdmin
            .from('task_settings')
            .select('balance_min')
            .eq('vip_level', vipLevel)
            .single();

        if (!settings) throw new Error('Room settings not found');

        if (Number(user.balance) < Number(settings.balance_min)) {
            return res.status(403).json({ 
                success: false, 
                message: `Insufficient balance for VIP ${vipLevel}. Minimum $${settings.balance_min} required.` 
            });
        }

        // Update user's current VIP level
        await supabaseAdmin.from('users').update({ vip_level: vipLevel }).eq('id', userId);

        res.json({ success: true, message: `Entered VIP ${vipLevel} room successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const { data, error } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: data.map(mapTaskToCamelCase) });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

// @desc    Request level unlock
export const requestLevelUnlock = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { level } = req.body;

    if (!level || level < 1 || level > 3) {
      return res.status(400).json({ success: false, message: 'Invalid level' });
    }

    // Check if already approved for this level
    const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
    if (!user) throw new Error('User not found');

    if (user.approved_vip_level >= level) {
      return res.status(400).json({ success: false, message: `VIP Level ${level} is already unlocked.` });
    }

    const minBalances: Record<number, number> = { 1: 20, 2: 399, 3: 799 };
    const requiredBalance = minBalances[level] || 20;

    // 1. Balance Requirement Check
    if (Number(user.balance) < requiredBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Minimum $${requiredBalance} required to request VIP ${level}.`
      });
    }

    // 2. Sequential Progression Requirement Check
    if (level === 2) {
      if (user.completed_tasks_today < 20 && user.vip_level < 2) {
        return res.status(400).json({
          success: false,
          message: 'Sequential progression rule: You must complete all 20 tasks in VIP Level 1 before requesting VIP Level 2.'
        });
      }
    } else if (level === 3) {
      if (user.approved_vip_level < 2 || (user.vip_level === 2 && user.completed_tasks_today < 20)) {
        return res.status(400).json({
          success: false,
          message: 'Sequential progression rule: You must complete all 20 tasks in VIP Level 2 before requesting VIP Level 3.'
        });
      }
    }

    // Update request
    const { error } = await supabaseAdmin.from('users').update({
      vip_level_request: level,
      vip_level_request_status: 'pending'
    }).eq('id', userId);

    if (error) {
      if (error.message?.includes('vip_level_request') || error.code === 'PGRST204') {
        return res.status(400).json({
          success: false,
          message: "Please run the 4-line SQL snippet in Supabase SQL Editor to enable VIP Level Approvals."
        });
      }
      throw error;
    }

    // Notify admin
    const io = req.app.get('io');
    if (io) {
      io.to('admin_notifications').emit('new_level_request', {
        username: user.username,
        level
      });
    }

    res.json({ success: true, message: `Request for VIP ${level} submitted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Get official deposit address
export const getDepositAddress = async (req: any, res: Response) => {
  try {
    const { getOfficialDepositAddress } = await import('../utils/systemSettings');
    const address = await getOfficialDepositAddress();
    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
