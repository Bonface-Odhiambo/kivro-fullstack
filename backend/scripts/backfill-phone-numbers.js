/**
 * Backfill Script: Add phone numbers to display_address for all existing addresses
 * 
 * This script updates all existing addresses in the database to include
 * the phone number in their display_address field.
 * 
 * Usage:
 *   node backend/scripts/backfill-phone-numbers.js
 */

const { supabase } = require('../config/supabase');

// Helper to normalize phone numbers (same as backend route)
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');
  // Remove leading + if present
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  return cleaned;
}

// Main backfill function
async function backfillPhoneNumbers() {
  
  try {
    // Fetch all addresses with phone numbers
    const { data: addresses, error } = await supabase
      .from('kivro_addresses')
      .select('id, display_address, phone_number, kivro_code')
      .not('phone_number', 'is', null)
      .neq('phone_number', '');
    
    if (error) {
      throw error;
    }
    
    if (!addresses || addresses.length === 0) {
      return;
    }
    
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each address
    for (const address of addresses) {
      try {
        const normalizedPhone = normalizePhone(address.phone_number);
        
        // Skip if phone already in display_address
        if (address.display_address && address.display_address.includes(normalizedPhone)) {
          skipped++;
          continue;
        }
        
        // Extract name (first part before comma) and rest of address
        let newDisplayAddress;
        const commaPos = address.display_address.indexOf(',');
        
        if (commaPos > 0) {
          const namePart = address.display_address.substring(0, commaPos).trim();
          const restOfAddress = address.display_address.substring(commaPos + 1).trim();
          
          // Reconstruct with phone number: "Name, PhoneNumber RestOfAddress"
          newDisplayAddress = `${namePart}, ${normalizedPhone} ${restOfAddress}`;
        } else {
          // If no comma, just prepend phone to the address
          newDisplayAddress = `${normalizedPhone} ${address.display_address}`;
        }
        
        // Update the address in database
        const { error: updateError } = await supabase
          .from('kivro_addresses')
          .update({ 
            display_address: newDisplayAddress,
            updated_at: new Date().toISOString()
          })
          .eq('id', address.id);
        
        if (updateError) {
          throw updateError;
        }
        
        updated++;
        
      } catch (err) {
        errors++;
      }
    }
    
    // Summary
    
  } catch (error) {
    process.exit(1);
  }
}

// Run the backfill
backfillPhoneNumbers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
