const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { supabase, verifyUser } = require('../config/supabase');

// Middleware to verify government agency or company API key
const verifySenderApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ 
        success: false, 
        error: 'API key is required' 
      });
    }

    // First, try to verify against government_senders table
    const { data: agency, error: agencyError } = await supabase
      .from('government_senders')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (agency && !agencyError) {
      // Attach agency info to request with sender type
      req.sender = { ...agency, sender_type: 'government' };
      req.agency = agency; // Keep for backward compatibility
      return next();
    }

    // If not found in government_senders, try company_senders
    const { data: company, error: companyError } = await supabase
      .from('company_senders')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (company && !companyError) {
      // Attach company info to request with sender type
      req.sender = { ...company, sender_type: 'company' };
      req.company = company;
      return next();
    }

    // API key not found in either table
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or inactive API key' 
    });
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

// Legacy middleware name for backward compatibility
const verifyAgencyApiKey = verifySenderApiKey;

/**
 * @route   GET /api/inbox
 * @desc    Get user's inbox messages with filtering and pagination
 * @access  Private
 */
router.get('/', verifyUser, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('category').optional().isString(),
  query('is_read').optional().isBoolean().toBoolean(),
  query('is_archived').optional().isBoolean().toBoolean(),
  query('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.id;
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const offset = (page - 1) * limit;

    // Build query - fetch messages with both government and company sender info
    let query = supabase
      .from('user_inbox')
      .select(`
        *,
        sender:government_senders(organization_name, organization_code, logo_url),
        company_sender:company_senders(company_name, company_code, logo_url, industry),
        category:message_categories(name, icon, color)
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (req.query.category) {
      query = query.eq('category_id', req.query.category);
    }
    if (req.query.is_read !== undefined) {
      query = query.eq('is_read', req.query.is_read);
    }
    if (req.query.is_archived !== undefined) {
      query = query.eq('is_archived', req.query.is_archived);
    } else {
      // By default, don't show archived messages
      query = query.eq('is_archived', false);
    }
    if (req.query.priority) {
      query = query.eq('priority', req.query.priority);
    }
    if (req.query.search) {
      query = query.or(`subject.ilike.%${req.query.search}%,message_body.ilike.%${req.query.search}%,reference_number.ilike.%${req.query.search}%`);
    }

    // Order by sent date (newest first)
    query = query.order('sent_at', { ascending: false });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch inbox messages' });
    }

    res.json({
      success: true,
      data: {
        messages: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/inbox/unread-count
 * @desc    Get count of unread messages
 * @access  Private
 */
router.get('/unread-count', verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { count, error } = await supabase
      .from('user_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_archived', false);

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
    }

    res.json({
      success: true,
      data: { unread_count: count || 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/inbox/senders
 * @desc    Get all unique senders for the user with message counts
 * @access  Private
 */
router.get('/senders', verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get messages with sender info
    const { data: messages, error } = await supabase
      .from('user_inbox')
      .select(`
        sender_id,
        sender_type,
        is_read,
        sent_at,
        sender:government_senders(id, organization_name, organization_code, logo_url),
        company_sender:company_senders(id, company_name, company_code, logo_url, industry)
      `)
      .eq('user_id', userId)
      .eq('is_archived', false);

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch senders' });
    }

    // Group by sender and calculate counts
    const senderMap = new Map();

    messages.forEach(message => {
      const isGovernment = message.sender_type === 'government';
      const senderInfo = isGovernment ? message.sender : message.company_sender;
      
      if (!senderInfo) return; // Skip if no sender info

      const senderId = senderInfo.id;
      
      if (!senderMap.has(senderId)) {
        senderMap.set(senderId, {
          id: senderId,
          name: isGovernment ? senderInfo.organization_name : senderInfo.company_name,
          code: isGovernment ? senderInfo.organization_code : senderInfo.company_code,
          logo_url: senderInfo.logo_url,
          type: isGovernment ? 'government' : 'company',
          message_count: 0,
          unread_count: 0,
          last_message_at: message.sent_at
        });
      }

      const sender = senderMap.get(senderId);
      sender.message_count++;
      if (!message.is_read) {
        sender.unread_count++;
      }
      // Update last message time if this message is more recent
      if (new Date(message.sent_at) > new Date(sender.last_message_at)) {
        sender.last_message_at = message.sent_at;
      }
    });

    // Convert map to array and sort by last message date
    const senders = Array.from(senderMap.values())
      .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));

    res.json({
      success: true,
      data: { senders }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/inbox/:id
 * @desc    Get a specific message by ID
 * @access  Private
 */
router.get('/:id', verifyUser, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.id;
    const messageId = req.params.id;

    const { data, error } = await supabase
      .from('user_inbox')
      .select(`
        *,
        sender:government_senders(organization_name, organization_code, contact_email, contact_phone, logo_url),
        company_sender:company_senders(company_name, company_code, contact_email, contact_phone, logo_url, industry),
        category:message_categories(name, icon, color, description),
        related_address:kivro_addresses(kivro_code, display_address)
      `)
      .eq('id', messageId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Message not found' });
      }
      return res.status(500).json({ success: false, error: 'Failed to fetch message' });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   PATCH /api/inbox/:id/read
 * @desc    Mark a message as read
 * @access  Private
 */
router.patch('/:id/read', verifyUser, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.id;
    const messageId = req.params.id;

    const { data, error } = await supabase
      .from('user_inbox')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to mark message as read' });
    }

    res.json({
      success: true,
      data: data,
      message: 'Message marked as read'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   PATCH /api/inbox/:id/unread
 * @desc    Mark a message as unread
 * @access  Private
 */
router.patch('/:id/unread', verifyUser, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.id;
    const messageId = req.params.id;

    const { data, error } = await supabase
      .from('user_inbox')
      .update({ is_read: false, read_at: null })
      .eq('id', messageId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to mark message as unread' });
    }

    res.json({
      success: true,
      data: data,
      message: 'Message marked as unread'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   PATCH /api/inbox/:id/archive
 * @desc    Archive a message
 * @access  Private
 */
router.patch('/:id/archive', verifyUser, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.id;
    const messageId = req.params.id;

    const { data, error } = await supabase
      .from('user_inbox')
      .update({ is_archived: true })
      .eq('id', messageId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to archive message' });
    }

    res.json({
      success: true,
      data: data,
      message: 'Message archived'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   PATCH /api/inbox/:id/unarchive
 * @desc    Unarchive a message
 * @access  Private
 */
router.patch('/:id/unarchive', verifyUser, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.id;
    const messageId = req.params.id;

    const { data, error } = await supabase
      .from('user_inbox')
      .update({ is_archived: false })
      .eq('id', messageId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to unarchive message' });
    }

    res.json({
      success: true,
      data: data,
      message: 'Message unarchived'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   PATCH /api/inbox/:id/star
 * @desc    Toggle star status of a message
 * @access  Private
 */
router.patch('/:id/star', verifyUser, [
  param('id').isUUID(),
  body('is_starred').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.id;
    const messageId = req.params.id;
    const { is_starred } = req.body;

    const { data, error } = await supabase
      .from('user_inbox')
      .update({ is_starred })
      .eq('id', messageId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to update star status' });
    }

    res.json({
      success: true,
      data: data,
      message: is_starred ? 'Message starred' : 'Message unstarred'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/inbox/:id/action
 * @desc    Record an action taken on a message (payment, appeal, etc.)
 * @access  Private
 */
router.post('/:id/action', verifyUser, [
  param('id').isUUID(),
  body('action_type').isIn(['paid', 'appealed', 'acknowledged', 'downloaded', 'forwarded']),
  body('action_data').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.id;
    const messageId = req.params.id;
    const { action_type, action_data } = req.body;

    // Verify message belongs to user
    const { data: message, error: messageError } = await supabase
      .from('user_inbox')
      .select('id')
      .eq('id', messageId)
      .eq('user_id', userId)
      .single();

    if (messageError || !message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Record the action
    const { data, error } = await supabase
      .from('message_actions')
      .insert({
        message_id: messageId,
        user_id: userId,
        action_type,
        action_data: action_data || {}
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to record action' });
    }

    res.json({
      success: true,
      data: data,
      message: 'Action recorded successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/inbox/categories
 * @desc    Get all message categories
 * @access  Private
 */
router.get('/categories/list', verifyUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('message_categories')
      .select('*')
      .order('name');

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/inbox/stats
 * @desc    Get inbox statistics (unread, by category, by priority, etc.)
 * @access  Private
 */
router.get('/stats/summary', verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total messages
    const { count: total } = await supabase
      .from('user_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', false);

    // Get unread messages
    const { count: unread } = await supabase
      .from('user_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_archived', false);

    // Get starred messages
    const { count: starred } = await supabase
      .from('user_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_starred', true)
      .eq('is_archived', false);

    // Get archived messages
    const { count: archived } = await supabase
      .from('user_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', true);

    // Get urgent messages
    const { count: urgent } = await supabase
      .from('user_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('priority', 'urgent')
      .eq('is_archived', false);

    res.json({
      success: true,
      data: {
        total: total || 0,
        unread: unread || 0,
        starred: starred || 0,
        archived: archived || 0,
        urgent: urgent || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/inbox/send
 * @desc    Send a message to user's inbox (Government Agency or Company API)
 * @access  Government Agency or Company (API Key Required)
 */
router.post('/send', verifySenderApiKey, [
  body('user_id').notEmpty().isUUID().withMessage('Valid user_id is required'),
  body('category').notEmpty().isString().withMessage('Category is required'),
  body('subject').notEmpty().isString().trim().withMessage('Subject is required'),
  body('message_body').notEmpty().isString().trim().withMessage('Message body is required'),
  body('message_type').optional().isIn(['notification', 'fine', 'invoice', 'certificate', 'alert', 'reminder']).withMessage('Invalid message type'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  body('reference_number').optional().isString().trim(),
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      user_id,
      category,
      subject,
      message_body,
      message_type = 'notification',
      priority = 'normal',
      reference_number = null,
      metadata = {}
    } = req.body;

    // Verify user exists
    const { data: userExists, error: userError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user_id)
      .single();

    if (userError || !userExists) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Get category ID
    const { data: categoryData, error: categoryError } = await supabase
      .from('message_categories')
      .select('id')
      .eq('name', category)
      .single();

    if (categoryError || !categoryData) {
      return res.status(400).json({ 
        success: false, 
        error: `Category '${category}' not found. Available categories: Traffic Violations, Tax & Revenue, Health Services, Legal & Court, Education, Utilities, Immigration, Municipal Services, Employment, General Notices` 
      });
    }

    // Determine sender type and ID
    const senderType = req.sender.sender_type;
    const senderId = senderType === 'government' ? req.sender.id : null;
    const companySenderId = senderType === 'company' ? req.sender.id : null;

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('user_inbox')
      .insert({
        user_id,
        sender_id: senderId,
        company_sender_id: companySenderId,
        sender_type: senderType,
        category_id: categoryData.id,
        subject,
        message_body,
        message_type,
        priority,
        reference_number,
        metadata,
        is_read: false,
        is_starred: false,
        is_archived: false
      })
      .select(`
        *,
        sender:government_senders(organization_name, organization_code, contact_email),
        company_sender:company_senders(company_name, company_code, contact_email),
        category:message_categories(name, icon, color)
      `)
      .single();

    if (insertError) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send message' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/inbox/send-bulk
 * @desc    Send messages to multiple users (Government Agency or Company API)
 * @access  Government Agency or Company (API Key Required)
 */
router.post('/send-bulk', verifySenderApiKey, [
  body('user_ids').isArray({ min: 1 }).withMessage('user_ids must be a non-empty array'),
  body('user_ids.*').isUUID().withMessage('Each user_id must be a valid UUID'),
  body('category').notEmpty().isString().withMessage('Category is required'),
  body('subject').notEmpty().isString().trim().withMessage('Subject is required'),
  body('message_body').notEmpty().isString().trim().withMessage('Message body is required'),
  body('message_type').optional().isIn(['notification', 'fine', 'invoice', 'certificate', 'alert', 'reminder']),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  body('reference_number_prefix').optional().isString().trim(),
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      user_ids,
      category,
      subject,
      message_body,
      message_type = 'notification',
      priority = 'normal',
      reference_number_prefix = null,
      metadata = {}
    } = req.body;

    // Get category ID
    const { data: categoryData, error: categoryError } = await supabase
      .from('message_categories')
      .select('id')
      .eq('name', category)
      .single();

    if (categoryError || !categoryData) {
      return res.status(400).json({ 
        success: false, 
        error: `Category '${category}' not found` 
      });
    }

    // Determine sender type and ID
    const senderType = req.sender.sender_type;
    const senderId = senderType === 'government' ? req.sender.id : null;
    const companySenderId = senderType === 'company' ? req.sender.id : null;

    // Prepare messages for bulk insert
    const messages = user_ids.map((user_id, index) => ({
      user_id,
      sender_id: senderId,
      company_sender_id: companySenderId,
      sender_type: senderType,
      category_id: categoryData.id,
      subject,
      message_body,
      message_type,
      priority,
      reference_number: reference_number_prefix ? `${reference_number_prefix}-${String(index + 1).padStart(4, '0')}` : null,
      metadata,
      is_read: false,
      is_starred: false,
      is_archived: false
    }));

    // Bulk insert
    const { data: insertedMessages, error: insertError } = await supabase
      .from('user_inbox')
      .insert(messages)
      .select('id');

    if (insertError) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send messages' 
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully sent ${insertedMessages.length} messages`,
      data: {
        sent_count: insertedMessages.length,
        message_ids: insertedMessages.map(m => m.id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/inbox/admin/all
 * @desc    Get all inbox messages (admin only)
 * @access  Private (Admin)
 */
router.get('/admin/all', verifyUser, async (req, res) => {
  try {

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', req.user.id)
      .single();

    if (profile?.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Fetch all messages with sender, category, and recipient info
    const { data: messages, error } = await supabase
      .from('user_inbox')
      .select(`
        *,
        sender:government_senders(organization_name, organization_code, logo_url),
        company_sender:company_senders(company_name, company_code, logo_url, industry),
        category:message_categories(name, icon, color),
        recipient:profiles!user_inbox_user_id_fkey(display_name, phone_number)
      `)
      .order('sent_at', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch messages',
        details: error.message
      });
    }


    res.json({
      success: true,
      data: {
        messages: messages || [],
        total: messages?.length || 0
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin inbox',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/inbox/admin/send-message
 * @desc    Admin sends a message to a specific user
 * @access  Private (Admin)
 */
router.post('/admin/send-message', verifyUser, [
  body('user_id').notEmpty().withMessage('User ID is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message_body').notEmpty().withMessage('Message body is required'),
  body('message_type').optional().isIn(['notification', 'alert', 'fine', 'invoice']).withMessage('Invalid message type'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  body('category_id').optional().isUUID().withMessage('Invalid category ID'),
  body('reference_number').optional().isString(),
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }


    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('user_type, display_name')
      .eq('user_id', req.user.id)
      .single();

    if (adminProfile?.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const {
      user_id,
      subject,
      message_body,
      message_type = 'notification',
      priority = 'normal',
      category_id,
      reference_number,
      metadata
    } = req.body;

    // Verify target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('user_id', user_id)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Target user not found'
      });
    }

    // Create a system sender if it doesn't exist
    let systemSender;
    const { data: existingSender } = await supabase
      .from('government_senders')
      .select('*')
      .eq('organization_code', 'KIVRO_ADMIN')
      .single();

    if (existingSender) {
      systemSender = existingSender;
    } else {
      // Create KIVRO Admin sender
      const { data: newSender, error: senderError } = await supabase
        .from('government_senders')
        .insert({
          organization_name: 'KIVRO Administration',
          organization_code: 'KIVRO_ADMIN',
          is_active: true
        })
        .select()
        .single();

      if (senderError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create system sender'
        });
      }
      systemSender = newSender;
    }

    // Insert message into user_inbox
    const { data: message, error: messageError } = await supabase
      .from('user_inbox')
      .insert({
        user_id: user_id,
        sender_id: systemSender.id,
        subject: subject,
        message_body: message_body,
        message_type: message_type,
        priority: priority,
        category_id: category_id || null,
        reference_number: reference_number || null,
        metadata: metadata || null,
        is_read: false,
        is_starred: false,
        is_archived: false,
        sent_at: new Date().toISOString()
      })
      .select(`
        *,
        sender:government_senders(organization_name, organization_code, logo_url),
        category:message_categories(name, icon, color)
      `)
      .single();

    if (messageError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send message',
        details: messageError.message
      });
    }


    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/inbox/admin/broadcast
 * @desc    Admin broadcasts a message to all users
 * @access  Private (Admin)
 */
router.post('/admin/broadcast', verifyUser, [
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message_body').notEmpty().withMessage('Message body is required'),
  body('message_type').optional().isIn(['notification', 'alert', 'fine', 'invoice']).withMessage('Invalid message type'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  body('category_id').optional().isUUID().withMessage('Invalid category ID'),
  body('user_type_filter').optional().isIn(['all', 'user', 'admin', 'courier']).withMessage('Invalid user type filter')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }


    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('user_type, display_name')
      .eq('user_id', req.user.id)
      .single();

    if (adminProfile?.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const {
      subject,
      message_body,
      message_type = 'notification',
      priority = 'normal',
      category_id,
      user_type_filter = 'all'
    } = req.body;

    // Get all users based on filter
    let userQuery = supabase
      .from('profiles')
      .select('user_id, display_name');

    if (user_type_filter !== 'all') {
      userQuery = userQuery.eq('user_type', user_type_filter);
    }

    const { data: users, error: usersError } = await userQuery;

    if (usersError || !users || users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No users found matching criteria'
      });
    }

    // Create/get system sender
    let systemSender;
    const { data: existingSender } = await supabase
      .from('government_senders')
      .select('*')
      .eq('organization_code', 'KIVRO_ADMIN')
      .single();

    if (existingSender) {
      systemSender = existingSender;
    } else {
      const { data: newSender, error: senderError } = await supabase
        .from('government_senders')
        .insert({
          organization_name: 'KIVRO Administration',
          organization_code: 'KIVRO_ADMIN',
          is_active: true
        })
        .select()
        .single();

      if (senderError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create system sender'
        });
      }
      systemSender = newSender;
    }

    // Prepare messages for all users
    const messages = users.map(user => ({
      user_id: user.user_id,
      sender_id: systemSender.id,
      subject: subject,
      message_body: message_body,
      message_type: message_type,
      priority: priority,
      category_id: category_id || null,
      is_read: false,
      is_starred: false,
      is_archived: false,
      sent_at: new Date().toISOString()
    }));

    // Insert all messages
    const { data: insertedMessages, error: messageError } = await supabase
      .from('user_inbox')
      .insert(messages)
      .select();

    if (messageError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to broadcast messages',
        details: messageError.message
      });
    }


    res.status(201).json({
      success: true,
      message: `Message broadcast to ${users.length} users`,
      data: {
        recipients_count: users.length,
        messages_sent: insertedMessages?.length || 0
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast message',
      message: error.message
    });
  }
});

module.exports = router;
