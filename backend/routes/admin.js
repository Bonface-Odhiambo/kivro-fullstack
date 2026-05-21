const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase, verifyUserToken } = require('../config/supabase');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Middleware to check admin access
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token using Supabase directly
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    if (!profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
};

// GET /api/admin/stats - Get system statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {

    // Get total users count (excluding deleted users)
    const { data: allProfiles, error: usersError } = await supabase
      .from('profiles')
      .select('user_id', { count: 'exact' });

    if (usersError) {
      throw usersError;
    }

    const totalUsers = allProfiles?.length || 0;

    // Get active subscriptions count
    const { data: activeSubs, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    if (subscriptionsError) {
    }

    const activeSubscriptions = activeSubs?.length || 0;

    // Get total addresses count
    const { data: allAddresses, error: addressesError } = await supabase
      .from('kivro_addresses')
      .select('id', { count: 'exact' });

    if (addressesError) {
    }

    const totalAddresses = allAddresses?.length || 0;

    // Get completed payments count and sum
    const { data: completedPayments, error: paymentsError } = await supabase
      .from('payment_requests')
      .select('amount')
      .in('status', ['completed', 'success']);

    if (paymentsError) {
    }

    const totalPayments = completedPayments?.length || 0;
    const totalRevenue = completedPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    const stats = {
      totalUsers,
      activeSubscriptions,
      totalAddresses,
      totalPayments,
      totalRevenue
    };


    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// GET /api/admin/users - Get all users with their data
router.get('/users', requireAdmin, async (req, res) => {
  try {
    
    const { country } = req.query; // Get country filter from query params

    // Get all user profiles
    let profilesQuery = supabase
      .from('profiles')
      .select('user_id, display_name, phone_number, user_type, created_at')
      .order('created_at', { ascending: false });

    // Apply country filter if provided
    if (country && country !== 'all') {
      profilesQuery = profilesQuery.ilike('phone_number', `+${country}%`);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      throw profilesError;
    }

    // Get all subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('user_id, status, expires_at');

    // Get address counts per user
    const { data: addressCounts, error: addressError } = await supabase
      .from('kivro_addresses')
      .select('user_id');

    // Helper function to detect country from phone number
    const detectCountryFromPhone = (phone) => {
      if (!phone) return 'Unknown';
      
      const { detectCountryFromPhone } = require('../utils/phoneValidation');
      const countryInfo = detectCountryFromPhone(phone);
      return countryInfo ? countryInfo.name : 'Unknown';
    };

    // Combine the data
    const users = profiles.map(profile => {
      const subscription = subscriptions?.find(s => s.user_id === profile.user_id);
      const userAddresses = addressCounts?.filter(a => a.user_id === profile.user_id) || [];
      const country = detectCountryFromPhone(profile.phone_number);
      
      return {
        id: profile.user_id,
        email: profile.user_id, // We'll need to get this from auth.users if needed
        created_at: profile.created_at,
        profile: {
          full_name: profile.display_name || '',
          phone_number: profile.phone_number || '',
          user_type: profile.user_type || 'user',
          country: country
        },
        subscription: subscription || { status: 'inactive', expires_at: null },
        addresses_count: userAddresses.length
      };
    });


    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// GET /api/admin/addresses - Get all addresses
router.get('/addresses', requireAdmin, async (req, res) => {
  try {

    const { data: addresses, error: addressesError } = await supabase
      .from('kivro_addresses')
      .select('*')
      .order('created_at', { ascending: false });

    if (addressesError) {
      throw addressesError;
    }

    // Fetch profiles separately to avoid foreign key issues
    const userIds = [...new Set(addresses.map(a => a.user_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, phone_number')
      .in('user_id', userIds);

    // Combine the data
    const addressesWithProfiles = addresses.map(address => ({
      ...address,
      profiles: profiles?.find(p => p.user_id === address.user_id) || null
    }));


    res.json({
      success: true,
      data: addressesWithProfiles
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch addresses',
      message: error.message
    });
  }
});

// GET /api/admin/payments - Get all payment requests
router.get('/payments', requireAdmin, async (req, res) => {
  try {

    const { data: payments, error: paymentsError } = await supabase
      .from('payment_requests')
      .select(`
        *,
        profiles!payment_requests_user_id_fkey (
          display_name,
          phone_number
        )
      `)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      throw paymentsError;
    }


    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch payments',
      message: error.message
    });
  }
});

// PUT /api/admin/users/:userId/role - Update user role
router.put('/users/:userId/role', [
  requireAdmin,
  body('user_type').isIn(['user', 'admin']).withMessage('Invalid user type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const { user_type } = req.body;


    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ user_type })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }


    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedProfile
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update user role',
      message: error.message
    });
  }
});

// PUT /api/admin/addresses/:addressId/status - Update address status
router.put('/addresses/:addressId/status', [
  requireAdmin,
  body('is_active').isBoolean().withMessage('is_active must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { addressId } = req.params;
    const { is_active } = req.body;


    const { data: updatedAddress, error: updateError } = await supabase
      .from('kivro_addresses')
      .update({ is_active })
      .eq('id', addressId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }


    res.json({
      success: true,
      message: 'Address status updated successfully',
      data: updatedAddress
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update address status',
      message: error.message
    });
  }
});

// POST /api/admin/users - Create new user
router.post('/users', [
  requireAdmin,
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('phone_number').optional(),
  body('user_type').isIn(['user', 'admin', 'courier']).withMessage('Invalid user type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, full_name, phone_number, user_type } = req.body;


    // Create auth user using Supabase Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        user_type
      }
    });

    if (authError) {
      throw authError;
    }


    // Create profile (wait a moment for auth user to be fully created)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        display_name: full_name,
        full_name: full_name,
        phone_number: phone_number || null,
        user_type: user_type || 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      
      // Check if profile already exists (maybe from trigger)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();
      
      if (existingProfile) {
        // Update the existing profile with provided data
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            display_name: full_name,
            full_name: full_name,
            phone_number: phone_number || null,
            user_type: user_type || 'user',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', authData.user.id)
          .select()
          .single();
        
        if (updateError) {
        }
      } else {
        // Profile doesn't exist and couldn't be created, delete auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }
    }


    // Send welcome email
    try {
      const welcomeEmailSent = await notificationService.sendWelcomeEmail(
        email,
        full_name,
        user_type
      );
      
      if (welcomeEmailSent) {
      }
    } catch (emailError) {
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: authData.user.id,
        email: email,
        profile: profileData
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to create user',
      message: error.message
    });
  }
});

// POST /api/admin/users/:userId/send-email - Send email to specific user
router.post('/users/:userId/send-email', [
  requireAdmin,
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const { subject, message } = req.body;


    // Get user email from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .single();

    const userName = profile?.display_name || 'User';

    // Send email
    const emailSent = await notificationService.sendCustomEmail(
      authUser.user.email,
      userName,
      subject,
      message
    );

    if (!emailSent) {
      throw new Error('Failed to send email');
    }


    res.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});

// DELETE /api/admin/users/:userId - Delete user (soft delete)
router.delete('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;


    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Cannot delete your own account',
        message: 'You cannot delete your own admin account'
      });
    }

    // Check if user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, display_name')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user's addresses first (cascade)
    const { error: addressDeleteError } = await supabase
      .from('kivro_addresses')
      .delete()
      .eq('user_id', userId);

    if (addressDeleteError) {
    }

    // Delete user's subscriptions
    const { error: subscriptionDeleteError } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (subscriptionDeleteError) {
    }

    // Delete user's payment requests
    const { error: paymentDeleteError } = await supabase
      .from('payment_requests')
      .delete()
      .eq('user_id', userId);

    if (paymentDeleteError) {
    }

    // Delete user profile
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileDeleteError) {
      throw profileDeleteError;
    }

    // Delete auth user (this is permanent)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      throw authDeleteError;
    }


    res.json({
      success: true,
      message: `User ${profile.display_name} has been permanently deleted`
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

// GET /api/admin/revenue - Get revenue analytics data
router.get('/revenue', requireAdmin, async (req, res) => {
  try {

    // Get all completed payments with dates
    const { data: payments, error: paymentsError } = await supabase
      .from('payment_requests')
      .select('amount, created_at')
      .in('status', ['completed', 'success'])
      .order('created_at', { ascending: true });

    if (paymentsError) {
      throw paymentsError;
    }

    // Group payments by month
    const monthlyData = {};
    let totalRevenue = 0;

    payments?.forEach(payment => {
      const date = new Date(payment.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          revenue: 0,
          subscriptions: 0,
          enterprise: 0,
          business: 0,
          personal: 0
        };
      }

      monthlyData[monthKey].revenue += payment.amount || 0;
      monthlyData[monthKey].subscriptions += 1;
      totalRevenue += payment.amount || 0;
    });

    // Convert to array and get last 6 months
    const revenueData = Object.values(monthlyData).slice(-6);

    // Calculate growth
    const currentMonth = revenueData[revenueData.length - 1]?.revenue || 0;
    const previousMonth = revenueData[revenueData.length - 2]?.revenue || 1;
    const monthlyGrowth = previousMonth > 0 
      ? ((currentMonth - previousMonth) / previousMonth) * 100 
      : 0;

    // Get active subscriptions
    const { data: activeSubs } = await supabase
      .from('user_subscriptions')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    const activeSubscriptions = activeSubs?.length || 0;
    const averageRevenuePerUser = activeSubscriptions > 0 
      ? totalRevenue / activeSubscriptions 
      : 0;

    // Get revenue by plan type
    const { data: enterpriseSubs } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('plan_type', 'enterprise')
      .eq('status', 'active');

    const { data: businessSubs } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('plan_type', 'business')
      .eq('status', 'active');

    // Estimate revenue by plan (assuming standard pricing)
    const enterpriseRevenue = (enterpriseSubs?.length || 0) * 24; // $24/year
    const businessRevenue = (businessSubs?.length || 0) * 120; // $120/year
    const personalRevenue = totalRevenue - enterpriseRevenue - businessRevenue;

    const stats = {
      totalRevenue,
      monthlyGrowth: parseFloat(monthlyGrowth.toFixed(2)),
      activeSubscriptions,
      averageRevenuePerUser: parseFloat(averageRevenuePerUser.toFixed(2)),
      enterpriseRevenue,
      businessRevenue,
      personalRevenue: Math.max(0, personalRevenue)
    };


    res.json({
      success: true,
      data: {
        stats,
        revenueData
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch revenue analytics',
      message: error.message
    });
  }
});

module.exports = router;
