/**
 * Standalone Geocoding Test
 * Tests geocoding APIs without Supabase dependency
 */

// Load environment variables FIRST
require('dotenv').config();

// Node.js v18+ has native fetch, no need to import

// Simple geocoding test without Supabase
async function testNominatim(lat, lng) {
  
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'KIVRO Digital Address System/1.0'
      }
    });
    
    const data = await response.json();
    
    return true;
  } catch (error) {
    return false;
  }
}

async function testMapbox(lat, lng) {
  
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  
  if (!token) {
    return false;
  }
  
  if (!token.startsWith('pk.')) {
    return false;
  }
  
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.status !== 200) {
      return false;
    }
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

async function testLocationIQ(lat, lng) {
  
  const apiKey = process.env.LOCATIONIQ_API_KEY;
  
  if (!apiKey) {
    return false;
  }
  
  try {
    const url = `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function runTests() {
  
  // Test with Nairobi, Kenya coordinates
  const testLat = -1.2921;
  const testLng = 36.8219;
  
  
  const results = {
    nominatim: false,
    mapbox: false,
    locationiq: false
  };
  
  // Test each API
  results.nominatim = await testNominatim(testLat, testLng);
  
  // Wait 1 second between requests (Nominatim rate limit)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  results.mapbox = await testMapbox(testLat, testLng);
  results.locationiq = await testLocationIQ(testLat, testLng);
  
  // Summary
  
  
  const workingApis = Object.values(results).filter(r => r).length;
  
  
  if (workingApis === 0) {
  } else if (workingApis < 3) {
  } else {
  }
}

// Run tests
runTests().catch(error => {
  process.exit(1);
});
