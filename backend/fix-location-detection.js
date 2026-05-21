/**
 * Script to fix location detection issues
 * Specifically addresses:
 * 1. Sylvestre Bony showing Somalia instead of Ivory Coast
 * 2. Any other addresses with incorrect country/region detection
 */

const { createClient } = require('@supabase/supabase-js');
const geocodingService = require('./services/geocodingService');
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

async function fixAddressLocations() {

  // Get all addresses that might have incorrect locations
  const { data: addresses, error } = await supabase
    .from('kivro_addresses')
    .select('*')
    .in('country', ['Somalia', 'Somaliland']) // Focus on potentially incorrect Somalia entries
    .order('created_at', { ascending: false });

  if (error) {
    return;
  }


  let fixedCount = 0;
  let checkedCount = 0;

  for (const address of addresses) {
    checkedCount++;

    try {
      // Use geocoding service to get accurate location
      const geocodedLocation = await geocodingService.reverseGeocode(
        address.latitude,
        address.longitude,
        { useCache: false } // Don't use cache to get fresh data
      );


      // Check if the geocoded country is different from current
      if (geocodedLocation.country && geocodedLocation.country !== address.country) {
        
        // Update the address with correct location data
        const { error: updateError } = await supabase
          .from('kivro_addresses')
          .update({
            country: geocodedLocation.country,
            region: geocodedLocation.region || address.region,
            district: geocodedLocation.city || address.district,
            updated_at: new Date().toISOString()
          })
          .eq('id', address.id);

        if (updateError) {
        } else {
          fixedCount++;
        }
      } else {
      }

    } catch (geocodeError) {
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

}

// Check specifically for Sylvestre Bony's address
async function checkSylvestreAddress() {
  
  const { data: addresses, error } = await supabase
    .from('kivro_addresses')
    .select('*')
    .ilike('display_address', '%Sylvestre%')
    .or('display_address.ilike.%Bony%');

  if (error) {
    return;
  }

  if (addresses.length === 0) {
    return;
  }

  for (const address of addresses) {

    // Check if phone number is from Ivory Coast
    if (address.phone_number && address.phone_number.includes('+225')) {
      
      // Fix the country
      const { error: updateError } = await supabase
        .from('kivro_addresses')
        .update({
          country: 'Ivory Coast',
          region: 'Abidjan' || address.region, // Default to Abidjan if not specified
          updated_at: new Date().toISOString()
        })
        .eq('id', address.id);

      if (updateError) {
      } else {
      }
    }
  }
}

// Main execution
async function main() {
  await checkSylvestreAddress();
  await fixAddressLocations();
  process.exit(0);
}

main().catch(console.error);
