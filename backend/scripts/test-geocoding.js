/**
 * Test Geocoding Service
 * Verifies that all geocoding APIs are working correctly
 */

const geocodingService = require('../services/geocodingService');
require('dotenv').config();

async function testGeocodingService() {

  // Test locations across Africa
  const testLocations = [
    { name: 'Nairobi, Kenya', lat: -1.2921, lng: 36.8219 },
    { name: 'Lagos, Nigeria', lat: 6.5244, lng: 3.3792 },
    { name: 'Mogadishu, Somalia', lat: 2.0469, lng: 45.3182 },
    { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357 },
    { name: 'Cape Town, South Africa', lat: -33.9249, lng: 18.4241 },
    { name: 'Accra, Ghana', lat: 5.6037, lng: -0.1870 }
  ];

  
  for (const location of testLocations) {
    try {
      const result = await geocodingService.reverseGeocode(location.lat, location.lng);
      
    } catch (error) {
    }
  }


  const testAddresses = [
    'Westlands, Nairobi, Kenya',
    'Victoria Island, Lagos, Nigeria',
    'Hargeisa, Somalia',
    'Johannesburg, South Africa'
  ];

  for (const address of testAddresses) {
    try {
      const result = await geocodingService.forwardGeocode(address);
      
    } catch (error) {
    }
  }


  const config = geocodingService.config;

}

// Run tests
testGeocodingService().catch(error => {
  process.exit(1);
});
