/**
 * Debug Mapbox API
 */

require('dotenv').config();

async function testMapbox() {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  
  
  if (!token) {
    return;
  }
  
  if (!token.startsWith('pk.')) {
    return;
  }
  
  // Test reverse geocoding
  const lat = -1.2921;
  const lng = 36.8219;
  
  
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`;
  
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    
    if (data.features && data.features.length > 0) {
    } else if (data.message) {
    } else {
    }
  } catch (error) {
  }
}

testMapbox();
