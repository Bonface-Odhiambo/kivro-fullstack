const express = require('express');
const { supabase, verifyUserToken } = require('../config/supabase');

const router = express.Router();

// GET /api/auth/profile - Get user profile and subscription
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await verifyUserToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, phone_number, user_type, bio, location')
      .eq('user_id', user.id)
      .single();

    // Get user subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('status, expires_at')
      .eq('user_id', user.id)
      .single();

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile: profile || {},
        subscription: subscription || { status: 'inactive', expires_at: null }
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// GET /api/auth/check-admin - Check if user has admin privileges
router.get('/check-admin', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await verifyUserToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    const isAdmin = profile?.user_type === 'admin';

    res.json({
      success: true,
      data: {
        isAdmin,
        user_type: profile?.user_type || 'user'
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to check admin status',
      message: error.message
    });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', async (req, res) => {
  try {

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await verifyUserToken(req.headers.authorization);
    
    const { display_name, phone_number, bio, location } = req.body;

    // Check if profile exists first
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();


    const profileData = {
      user_id: user.id,
      display_name: display_name || user.email?.split('@')[0] || 'User',
      phone_number: phone_number,
      bio: bio || null,
      location: location || null,
      user_type: existingProfile?.user_type || 'customer',
      updated_at: new Date().toISOString()
    };

    // If profile doesn't exist, add created_at
    if (!existingProfile) {
      profileData.created_at = new Date().toISOString();
    }


    let updatedProfile, error;

    if (existingProfile) {
      // Update existing profile
      const updateData = {
        display_name: display_name || user.email?.split('@')[0] || 'User',
        phone_number: phone_number,
        bio: bio || null,
        location: location || null,
        updated_at: new Date().toISOString()
      };

      const result = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      updatedProfile = result.data;
      error = result.error;
    } else {
      // Insert new profile
      const result = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      updatedProfile = result.data;
      error = result.error;
    }

    if (error) {
      return res.status(500).json({
        error: 'Failed to update profile',
        details: error.message,
        code: error.code
      });
    }


    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });

  } catch (error) {
    res.status(500).json({
      error: 'Profile update failed',
      message: error.message
    });
  }
});

// GET /api/auth/subscription - Get user subscription details
router.get('/subscription', async (req, res) => {
  try {
    const user = await verifyUserToken(req.headers.authorization);

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({
        error: 'Failed to fetch subscription',
        details: error.message
      });
    }

    res.status(200).json({
      success: true,
      data: subscription || {
        status: 'inactive',
        expires_at: null
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch subscription',
      message: error.message
    });
  }
});

module.exports = router;
