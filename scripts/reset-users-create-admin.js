/**
 * Script to reset all users and create admin user
 * Usage: node scripts/reset-users-create-admin.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key needed for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetUsersAndCreateAdmin() {
  console.log('🧹 Starting database cleanup and admin user creation...\n');

  try {
    // Step 1: Delete all user-related data
    console.log('📋 Step 1: Cleaning up user-related data...');
    
    // Delete receipts
    const { error: receiptsError } = await supabase
      .from('receipts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (receiptsError) console.warn('⚠️  Receipts cleanup:', receiptsError.message);
    else console.log('✅ Deleted all receipts');

    // Delete government messages
    const { error: messagesError } = await supabase
      .from('government_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (messagesError) console.warn('⚠️  Messages cleanup:', messagesError.message);
    else console.log('✅ Deleted all government messages');

    // Delete KIVRO addresses
    const { error: addressesError } = await supabase
      .from('kivro_addresses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (addressesError) console.warn('⚠️  Addresses cleanup:', addressesError.message);
    else console.log('✅ Deleted all KIVRO addresses');

    // Delete packages
    const { error: packagesError } = await supabase
      .from('packages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (packagesError) console.warn('⚠️  Packages cleanup:', packagesError.message);
    else console.log('✅ Deleted all packages');

    // Delete profiles
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (profilesError) console.warn('⚠️  Profiles cleanup:', profilesError.message);
    else console.log('✅ Deleted all profiles');

    // Step 2: Get all auth users and delete them
    console.log('\n📋 Step 2: Deleting all auth users...');
    
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }

    console.log(`👥 Found ${users.users.length} auth users to delete`);

    // Delete each user
    for (const user of users.users) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.warn(`⚠️  Error deleting user ${user.email}:`, deleteError.message);
      } else {
        console.log(`✅ Deleted user: ${user.email}`);
      }
    }

    // Step 3: Create admin user
    console.log('\n📋 Step 3: Creating admin user...');
    
    const { data: adminUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'kivroafrica@gmail.com',
      password: 'BlueMountain47!Rocket',
      email_confirm: true,
      user_metadata: {
        full_name: 'KIVRO Admin'
      }
    });

    if (createError) {
      console.error('❌ Error creating admin user:', createError.message);
      return;
    }

    console.log('✅ Created admin user:', adminUser.user.email);
    console.log('🆔 Admin User ID:', adminUser.user.id);

    // Step 4: Create admin profile
    console.log('\n📋 Step 4: Creating admin profile...');
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: adminUser.user.id,
        full_name: 'KIVRO Admin',
        display_name: 'KIVRO Admin',
        email: 'kivroafrica@gmail.com',
        user_type: 'admin'
      });

    if (profileError) {
      console.error('❌ Error creating admin profile:', profileError.message);
      return;
    }

    console.log('✅ Created admin profile');

    // Step 5: Verification
    console.log('\n📋 Step 5: Verification...');
    
    const { data: finalUsers } = await supabase.auth.admin.listUsers();
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'admin');

    console.log('\n🎉 SUCCESS! Database reset and admin user created:');
    console.log('📊 FINAL STATE:');
    console.log(`   - Total auth users: ${finalUsers.users.length}`);
    console.log(`   - Admin profiles: ${profiles.length}`);
    console.log('\n🔑 ADMIN LOGIN CREDENTIALS:');
    console.log('   📧 Email: kivroafrica@gmail.com');
    console.log('   🔒 Password: BlueMountain47!Rocket');
    console.log('   🌐 Admin Panel: https://kivro.africa/admin');
    console.log('\n✨ You can now log in to the admin panel!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
resetUsersAndCreateAdmin();
