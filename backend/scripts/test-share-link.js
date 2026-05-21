require('dotenv').config();
const { supabase } = require('../config/supabase');

async function testShareLink() {

  try {
    // Get the most recent address with a share_token
    const { data: addresses, error } = await supabase
      .from('kivro_addresses')
      .select('id, kivro_code, short_code, share_token, is_active, latitude, longitude, display_address')
      .not('share_token', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return;
    }

    if (!addresses || addresses.length === 0) {
      return;
    }


    addresses.forEach((addr, index) => {
    });

    // Test the public endpoint with the first address
    if (addresses[0].share_token) {
      
      const { data: publicAddress, error: publicError } = await supabase
        .from('kivro_addresses')
        .select(`
          id,
          kivro_code,
          display_address,
          latitude,
          longitude,
          short_code,
          region,
          district,
          landmark,
          is_verified,
          is_active,
          share_token
        `)
        .eq('share_token', addresses[0].share_token)
        .eq('is_active', true)
        .single();

      if (publicError) {
      } else {
      }
    }

  } catch (error) {
  }
}

testShareLink();
