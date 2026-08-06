import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/db';

// @desc    Get or create user's support thread
// @route   GET /api/chat/thread
export const getThread = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user._id;

    // 1. Try to find existing thread
    let { data: thread, error: threadError } = await supabaseAdmin
      .from('support_threads')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (threadError) throw threadError;

    // 2. If no thread exists, create one
    if (!thread) {
      const { data: newThread, error: createError } = await supabaseAdmin
        .from('support_threads')
        .insert({ user_id: userId, status: 'open' })
        .select()
        .single();
      
      if (createError) throw createError;
      thread = newThread;
    }

    // 3. Fetch messages for this user
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // 4. Mark messages as read by user (sender='admin')
    await supabaseAdmin
      .from('support_messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('sender', 'admin');

    // Reset unread count for user
    await supabaseAdmin
      .from('support_threads')
      .update({ unread_user_count: 0 })
      .eq('id', thread.id);

    res.json({
      success: true,
      data: {
        thread,
        messages: messages || []
      }
    });
  } catch (error: any) {
    console.error("GET_THREAD_ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send message from user
// @route   POST /api/chat/message
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    const userId = req.user.id || req.user._id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // 1. Get user thread (create if missing)
    let { data: thread, error: threadError } = await supabaseAdmin
      .from('support_threads')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (threadError) throw threadError;

    if (!thread) {
      const { data: newThread, error: createError } = await supabaseAdmin
        .from('support_threads')
        .insert({ user_id: userId, status: 'open' })
        .select()
        .single();
      
      if (createError) throw createError;
      thread = newThread;
    }

    if (!thread) {
      return res.status(500).json({ success: false, message: 'Failed to initialize support thread' });
    }

    // 2. Create message using actual database columns
    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from('support_messages')
      .insert({
        user_id: userId,
        message,
        sender: 'user',
        is_read: false
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // 3. Update thread
    await supabaseAdmin
      .from('support_threads')
      .update({ 
        last_message_at: new Date(),
        unread_admin_count: (thread.unread_admin_count || 0) + 1,
        status: 'open'
      })
      .eq('id', thread.id);

    // 4. Emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('admin_notifications').emit('new_support_message', {
        threadId: thread.id,
        userId: userId,
        username: req.user.username,
        message: newMessage
      });
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error: any) {
    console.error("SEND_MESSAGE_ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send unauthenticated support message from login page by email
// @route   POST /api/chat/public-message
export const sendPublicSupportMessage = async (req: any, res: Response) => {
  try {
    const { email, message } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if registered user exists by username or email
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .ilike('username', cleanEmail)
      .maybeSingle();

    let targetUserId = existingUser?.id;
    let targetUsername = existingUser?.username || cleanEmail;

    // If no registered user matches, fetch a valid user ID to satisfy FK constraint
    if (!targetUserId) {
      const { data: systemUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1)
        .single();
      targetUserId = systemUser?.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Support system initializing. Please try again.' });
    }

    // 2. Find existing thread for user or create one
    let { data: thread } = await supabaseAdmin
      .from('support_threads')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!thread) {
      const { data: newThread, error: createErr } = await supabaseAdmin
        .from('support_threads')
        .insert({ 
          user_id: targetUserId,
          status: 'open' 
        })
        .select()
        .maybeSingle();

      if (newThread) {
        thread = newThread;
      } else {
        const { data: existingThread } = await supabaseAdmin
          .from('support_threads')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();
        thread = existingThread;
      }
    }

    // 3. Insert public support message
    const formattedMessage = `[Public Contact from ${cleanEmail}]: ${message}`;
    const { data: newMessage, error: msgErr } = await supabaseAdmin
      .from('support_messages')
      .insert({
        user_id: targetUserId,
        message: formattedMessage,
        sender: 'user',
        is_read: false
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    // 4. Update thread unread admin count
    if (thread) {
      await supabaseAdmin
        .from('support_threads')
        .update({
          last_message_at: new Date(),
          unread_admin_count: (thread.unread_admin_count || 0) + 1,
          status: 'open'
        })
        .eq('id', thread.id);
    }

    // 5. Notify admin panel via socket
    const io = req.app.get('io');
    if (io) {
      io.to('admin_notifications').emit('new_support_message', {
        threadId: thread?.id,
        userId: targetUserId,
        username: targetUsername,
        message: newMessage
      });
    }

    res.json({ success: true, message: 'Message sent successfully to Sterling Customer Support.' });
  } catch (error: any) {
    console.error("PUBLIC_SUPPORT_MESSAGE_ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
