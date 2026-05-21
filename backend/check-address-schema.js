/**
 * Script to check the kivro_addresses table schema and find any status fields
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkSchema() {

  // Get table information - try sample data approach
  const { data: sampleData, error: sampleError } = await supabase
    .from('kivro_addresses')
    .select('*')
    .limit(1);

  if (sampleError) {
    return;
  }

  if (sampleData && sampleData.length > 0) {
    Object.keys(sampleData[0]).forEach(key => {
    });
  }

  // Check for any addresses with status-like fields
  const { data: addresses, error: addrError } = await supabase
    .from('kivro_addresses')
    .select('id, kivro_code, is_active, created_at, updated_at')
    .limit(5);

  if (addrError) {
  } else {
    addresses.forEach(addr => {
    });
  }

  // Check specifically for any addresses that might have "interactive" in any field
  const { data: interactiveSearch, error: searchError } = await supabase
    .from('kivro_addresses')
    .select('id, kivro_code, display_address')
    .ilike('display_address', '%interactive%')
    .limit(10);

  if (searchError) {
  } else {
    if (interactiveSearch && interactiveSearch.length > 0) {
      interactiveSearch.forEach(addr => {
      });
    } else {
    }
  }
}

checkSchema().catch(console.error);
