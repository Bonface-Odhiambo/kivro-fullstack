/**
 * Database Migration Runner
 * Runs the geocoding_cache table migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Read migration file
  const migrationPath = path.join(__dirname, '../migrations/create_geocoding_cache.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');


  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      return;
    }


  } catch (error) {
  }
}

runMigration();
