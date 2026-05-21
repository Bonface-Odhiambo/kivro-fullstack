/**
 * Backfill Script: Add share_token to all existing addresses
 * 
 * This script generates unique share tokens for all addresses that don't have one.
 * Share tokens are used for public address sharing via /kv/:token URLs.
 * 
 * Usage:
 *   node backend/scripts/backfill-share-tokens.js
 */

const crypto = require('crypto');
const { supabase } = require('../config/supabase');

// Helper to generate unique share token
function generateShareToken() {
  return crypto.randomBytes(20).toString('base64url');
}

// Check if token already exists
async function tokenExists(token) {
  const { data, error } = await supabase
    .from('kivro_addresses')
    .select('id')
    .eq('share_token', token)
    .limit(1);
  
  if (error) throw error;
  return data && data.length > 0;
}

// Generate a unique token that doesn't exist in the database
async function generateUniqueToken() {
  let token;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    token = generateShareToken();
    const exists = await tokenExists(token);
    
    if (!exists) {
      return token;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique token after ' + maxAttempts + ' attempts');
}

// Main backfill function
async function backfillShareTokens() {
  
  try {
    // Fetch all addresses without share tokens
    const { data: addresses, error } = await supabase
      .from('kivro_addresses')
      .select('id, kivro_code, share_token')
      .or('share_token.is.null,share_token.eq.');
    
    if (error) {
      throw error;
    }
    
    if (!addresses || addresses.length === 0) {
      return;
    }
    
    
    let updated = 0;
    let errors = 0;
    
    // Process each address
    for (const address of addresses) {
      try {
        // Generate a unique token
        const newToken = await generateUniqueToken();
        
        // Update the address in database
        const { error: updateError } = await supabase
          .from('kivro_addresses')
          .update({ 
            share_token: newToken,
            updated_at: new Date().toISOString()
          })
          .eq('id', address.id);
        
        if (updateError) {
          throw updateError;
        }
        
        updated++;
        
        // Show progress every 10 addresses
        if (updated % 10 === 0) {
        }
        
      } catch (err) {
        errors++;
      }
    }
    
    // Summary
    
    // Show example share URLs
    if (updated > 0) {
      const { data: examples } = await supabase
        .from('kivro_addresses')
        .select('kivro_code, share_token')
        .not('share_token', 'is', null)
        .limit(3);
      
      if (examples && examples.length > 0) {
        examples.forEach(addr => {
        });
      }
    }
    
  } catch (error) {
    process.exit(1);
  }
}

// Run the backfill
backfillShareTokens()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
