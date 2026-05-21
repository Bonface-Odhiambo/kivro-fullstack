/**
 * African Geolocation Service
 * Comprehensive GPS-based region detection for all African countries
 */

export interface AfricanCountry {
  name: string;
  code: string;
  phoneCode: string;
  capital: string;
  regions: string[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface LocationResult {
  country: string;
  region: string;
  city?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy: 'high' | 'medium' | 'low';
}

// Comprehensive African countries data with major regions
export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  // North Africa
  {
    name: 'Algeria',
    code: 'DZ',
    phoneCode: '+213',
    capital: 'Algiers',
    regions: ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Djelfa', 'Sétif', 'Sidi Bel Abbès', 'Biskra'],
    bounds: { north: 37.1, south: 18.9, east: 12.0, west: -8.7 }
  },
  {
    name: 'Egypt',
    code: 'EG',
    phoneCode: '+20',
    capital: 'Cairo',
    regions: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Aswan', 'Mansoura', 'Tanta'],
    bounds: { north: 31.7, south: 22.0, east: 37.0, west: 25.0 }
  },
  {
    name: 'Libya',
    code: 'LY',
    phoneCode: '+218',
    capital: 'Tripoli',
    regions: ['Tripoli', 'Benghazi', 'Misrata', 'Tarhuna', 'Al Khums', 'Az Zawiyah', 'Ajdabiya', 'Tobruk', 'Sabha', 'Sirte'],
    bounds: { north: 33.2, south: 19.5, east: 25.2, west: 9.4 }
  },
  {
    name: 'Morocco',
    code: 'MA',
    phoneCode: '+212',
    capital: 'Rabat',
    regions: ['Casablanca', 'Rabat', 'Fez', 'Marrakech', 'Agadir', 'Tangier', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan'],
    bounds: { north: 35.9, south: 27.7, east: -1.0, west: -13.2 }
  },
  {
    name: 'Tunisia',
    code: 'TN',
    phoneCode: '+216',
    capital: 'Tunis',
    regions: ['Tunis', 'Sfax', 'Sousse', 'Ettadhamen', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa', 'Monastir'],
    bounds: { north: 37.5, south: 30.2, east: 11.6, west: 7.5 }
  },
  {
    name: 'Sudan',
    code: 'SD',
    phoneCode: '+249',
    capital: 'Khartoum',
    regions: ['Khartoum', 'Omdurman', 'Port Sudan', 'Kassala', 'Obeid', 'Nyala', 'Wad Madani', 'El Fasher', 'Kosti', 'El Daein'],
    bounds: { north: 22.0, south: 8.7, east: 38.6, west: 21.8 }
  },

  // West Africa
  {
    name: 'Nigeria',
    code: 'NG',
    phoneCode: '+234',
    capital: 'Abuja',
    regions: ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu', 'Abeokuta', 'Kaduna'],
    bounds: { north: 13.9, south: 4.3, east: 14.7, west: 2.7 }
  },
  {
    name: 'Ghana',
    code: 'GH',
    phoneCode: '+233',
    capital: 'Accra',
    regions: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Tema', 'Obuasi', 'Cape Coast', 'Koforidua', 'Sunyani', 'Ho'],
    bounds: { north: 11.2, south: 4.7, east: 1.2, west: -3.3 }
  },
  {
    name: 'Senegal',
    code: 'SN',
    phoneCode: '+221',
    capital: 'Dakar',
    regions: ['Dakar', 'Touba', 'Thiès', 'Kaolack', 'Saint-Louis', 'Ziguinchor', 'Diourbel', 'Tambacounda', 'Mbour', 'Rufisque'],
    bounds: { north: 16.7, south: 12.3, east: -11.4, west: -17.5 }
  },
  {
    name: 'Ivory Coast',
    code: 'CI',
    phoneCode: '+225',
    capital: 'Yamoussoukro',
    regions: ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man', 'Divo', 'Gagnoa', 'Anyama'],
    bounds: { north: 10.7, south: 4.4, east: -2.5, west: -8.6 }
  },

  // East Africa
  {
    name: 'Kenya',
    code: 'KE',
    phoneCode: '+254',
    capital: 'Nairobi',
    regions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kehancha', 'Malindi', 'Kitale', 'Garissa', 'Kakamega', 'Thika', 'Lamu', 'Nyeri', 'Machakos', 'Meru'],
    bounds: { north: 5.0, south: -4.7, east: 41.9, west: 33.9 }
  },
  {
    name: 'Tanzania',
    code: 'TZ',
    phoneCode: '+255',
    capital: 'Dodoma',
    regions: ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Kahama', 'Tabora', 'Zanzibar City', 'Kigoma', 'Sumbawanga', 'Kasulu', 'Songea', 'Moshi'],
    bounds: { north: -0.95, south: -11.7, east: 40.4, west: 29.3 }
  },
  {
    name: 'Uganda',
    code: 'UG',
    phoneCode: '+256',
    capital: 'Kampala',
    regions: ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Bwizibwera', 'Mbale', 'Mukono', 'Kasese', 'Masaka', 'Entebbe', 'Njeru', 'Kitgum', 'Hoima', 'Soroti'],
    bounds: { north: 4.2, south: -1.5, east: 35.0, west: 29.6 }
  },
  {
    name: 'Ethiopia',
    code: 'ET',
    phoneCode: '+251',
    capital: 'Addis Ababa',
    regions: ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Adama', 'Awasa', 'Bahir Dar', 'Dessie', 'Jimma', 'Jijiga', 'Shashamane', 'Nekemte', 'Bishoftu', 'Asosa', 'Harar'],
    bounds: { north: 14.9, south: 3.4, east: 48.0, west: 33.0 }
  },
  {
    name: 'Somalia',
    code: 'SO',
    phoneCode: '+252',
    capital: 'Mogadishu',
    regions: ['Mogadishu', 'Hargeisa', 'Bosaso', 'Kismayo', 'Merca', 'Galkaio', 'Burao', 'Berbera', 'Baidoa', 'Las Anod', 'Garowe', 'Borama', 'Erigavo', 'Qardho', 'Luuq'],
    bounds: { north: 12.0, south: -1.7, east: 51.4, west: 40.9 }
  },
  {
    name: 'Rwanda',
    code: 'RW',
    phoneCode: '+250',
    capital: 'Kigali',
    regions: ['Kigali', 'Butare', 'Gitarama', 'Ruhengeri', 'Gisenyi', 'Byumba', 'Cyangugu', 'Kibungo', 'Kibuye', 'Gikongoro'],
    bounds: { north: -1.0, south: -2.8, east: 30.9, west: 28.9 }
  },

  // Southern Africa
  {
    name: 'South Africa',
    code: 'ZA',
    phoneCode: '+27',
    capital: 'Cape Town',
    regions: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Pietermaritzburg', 'Benoni', 'Tembisa', 'East London', 'Vereeniging', 'Bloemfontein', 'Boksburg', 'Welkom', 'Newcastle', 'Krugersdorp'],
    bounds: { north: -22.1, south: -34.8, east: 32.9, west: 16.5 }
  },
  {
    name: 'Zimbabwe',
    code: 'ZW',
    phoneCode: '+263',
    capital: 'Harare',
    regions: ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Kwekwe', 'Kadoma', 'Masvingo', 'Chinhoyi', 'Norton', 'Marondera', 'Ruwa', 'Chegutu', 'Zvishavane', 'Bindura'],
    bounds: { north: -15.6, south: -22.4, east: 33.1, west: 25.2 }
  },
  {
    name: 'Zambia',
    code: 'ZW',
    phoneCode: '+260',
    capital: 'Lusaka',
    regions: ['Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola', 'Mufulira', 'Livingstone', 'Luanshya', 'Kasama', 'Chipata', 'Kalulushi', 'Mazabuka', 'Choma', 'Mongu', 'Solwezi'],
    bounds: { north: -8.2, south: -18.1, east: 33.7, west: 21.2 }
  },

  // Central Africa
  {
    name: 'Democratic Republic of Congo',
    code: 'CD',
    phoneCode: '+243',
    capital: 'Kinshasa',
    regions: ['Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kisangani', 'Masina', 'Kananga', 'Likasi', 'Kolwezi', 'Tshikapa', 'Beni', 'Bukavu', 'Mwene-Ditu', 'Kikwit', 'Mbandaka', 'Matadi'],
    bounds: { north: 5.4, south: -13.5, east: 31.3, west: 12.2 }
  },
  {
    name: 'Angola',
    code: 'AO',
    phoneCode: '+244',
    capital: 'Luanda',
    regions: ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Kuito', 'Lubango', 'Malanje', 'Namibe', 'Soyo', 'Cabinda', 'Uíge', 'Saurimo', 'Sumbe', 'Menongue', 'Lucapa'],
    bounds: { north: -4.4, south: -18.0, east: 24.1, west: 11.7 }
  },
  {
    name: 'Cameroon',
    code: 'CM',
    phoneCode: '+237',
    capital: 'Yaoundé',
    regions: ['Douala', 'Yaoundé', 'Garoua', 'Kousseri', 'Bamenda', 'Maroua', 'Bafoussam', 'Mokolo', 'Ngaoundéré', 'Bertoua', 'Edéa', 'Loum', 'Kumba', 'Nkongsamba', 'Mbouda'],
    bounds: { north: 13.1, south: 1.7, east: 16.2, west: 8.5 }
  }
];

/**
 * Get current GPS location with high accuracy
 */
export async function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      reject,
      {
        enableHighAccuracy: true, // Request GPS instead of WiFi/cell tower
        timeout: 15000, // Increased timeout for better accuracy
        maximumAge: 0 // Always get fresh location, no caching
      }
    );
  });
}

/**
 * Detect African country and region from GPS coordinates
 */
export function detectLocationFromCoordinates(latitude: number, longitude: number): LocationResult | null {
  // Find the country that contains these coordinates
  const country = AFRICAN_COUNTRIES.find(c => 
    latitude >= c.bounds.south && 
    latitude <= c.bounds.north && 
    longitude >= c.bounds.west && 
    longitude <= c.bounds.east
  );

  if (!country) {
    return null;
  }

  // For now, use the capital as the default region
  // In a production app, you'd use reverse geocoding API for more accuracy
  const region = country.capital;

  return {
    country: country.name,
    region: region,
    coordinates: { latitude, longitude },
    accuracy: 'medium'
  };
}

/**
 * Get region name from GPS coordinates using reverse geocoding
 */
export async function getRegionFromCoordinates(latitude: number, longitude: number): Promise<LocationResult | null> {
  try {
    // First, detect the country from coordinates
    const basicLocation = detectLocationFromCoordinates(latitude, longitude);
    if (!basicLocation) {
      return null;
    }

    // Try to get more accurate location using reverse geocoding API
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          country: data.countryName || basicLocation.country,
          region: data.city || data.locality || data.principalSubdivision || basicLocation.region,
          city: data.city || data.locality,
          coordinates: { latitude, longitude },
          accuracy: 'high'
        };
      }
    } catch (reverseGeoError) {
    }

    // Fallback to basic detection
    return basicLocation;
  } catch (error) {
    return null;
  }
}

/**
 * Get GPS coordinates and region for address generation
 */
export async function getLocationForAddressGeneration(): Promise<LocationResult | null> {
  try {
    const position = await getCurrentLocation();
    const { latitude, longitude } = position.coords;
    
    return await getRegionFromCoordinates(latitude, longitude);
  } catch (error) {
    return null;
  }
}

/**
 * Validate if coordinates are within Africa
 */
export function isLocationInAfrica(latitude: number, longitude: number): boolean {
  // Africa's approximate bounds
  const africaBounds = {
    north: 37.5,   // Northern tip (Tunisia/Algeria)
    south: -34.8,  // Southern tip (South Africa)
    east: 51.4,    // Eastern tip (Somalia)
    west: -17.5    // Western tip (Senegal)
  };

  return latitude >= africaBounds.south && 
         latitude <= africaBounds.north && 
         longitude >= africaBounds.west && 
         longitude <= africaBounds.east;
}

/**
 * Get all regions for a specific African country
 */
export function getRegionsForCountry(countryName: string): string[] {
  const country = AFRICAN_COUNTRIES.find(c => 
    c.name.toLowerCase() === countryName.toLowerCase()
  );
  return country ? country.regions : [];
}

/**
 * Search for African regions by name
 */
export function searchAfricanRegions(query: string): Array<{country: string, region: string}> {
  const results: Array<{country: string, region: string}> = [];
  const searchTerm = query.toLowerCase();

  AFRICAN_COUNTRIES.forEach(country => {
    country.regions.forEach(region => {
      if (region.toLowerCase().includes(searchTerm)) {
        results.push({
          country: country.name,
          region: region
        });
      }
    });
  });

  return results.slice(0, 10); // Limit to 10 results
}
