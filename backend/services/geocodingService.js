/**
 * Unified Geocoding Service for KIVRO
 * Integrates multiple geocoding APIs with intelligent fallback
 * Optimized for African location accuracy
 */

// Node.js v18+ has native fetch support
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for caching (lazy load to avoid circular dependency)
let supabase = null;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return supabase;
}

class GeocodingService {
  constructor() {
    // API configuration
    this.config = {
      nominatim: {
        baseUrl: 'https://nominatim.openstreetmap.org',
        userAgent: 'KIVRO Digital Address System/1.0 (contact@kivro.so)',
        rateLimit: 1000, // 1 request per second
        enabled: true
      },
      mapbox: {
        baseUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
        accessToken: process.env.MAPBOX_ACCESS_TOKEN || '',
        enabled: !!process.env.MAPBOX_ACCESS_TOKEN
      },
      google: {
        baseUrl: 'https://maps.googleapis.com/maps/api/geocode',
        apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        enabled: !!process.env.GOOGLE_MAPS_API_KEY
      },
      locationiq: {
        baseUrl: 'https://us1.locationiq.com/v1',
        apiKey: process.env.LOCATIONIQ_API_KEY || '',
        enabled: !!process.env.LOCATIONIQ_API_KEY
      }
    };

    // Rate limiting
    this.lastNominatimRequest = 0;
  }

  /**
   * Main reverse geocoding function with intelligent fallback
   * Converts GPS coordinates to address information
   */
  async reverseGeocode(latitude, longitude, options = {}) {
    const { preferredProvider = 'auto', useCache = true } = options;


    // Check cache first
    if (useCache) {
      const cached = await this.getCachedGeocode(latitude, longitude, 'reverse');
      if (cached) {
        return cached;
      }
    }

    let result = null;
    let errors = [];

    // Try providers in order of preference
    const providers = this.getProviderOrder(preferredProvider);

    for (const provider of providers) {
      try {
        
        switch (provider) {
          case 'nominatim':
            if (this.config.nominatim.enabled) {
              result = await this.nominatimReverse(latitude, longitude);
            }
            break;
          case 'mapbox':
            if (this.config.mapbox.enabled) {
              result = await this.mapboxReverse(latitude, longitude);
            }
            break;
          case 'google':
            if (this.config.google.enabled) {
              result = await this.googleReverse(latitude, longitude);
            }
            break;
          case 'locationiq':
            if (this.config.locationiq.enabled) {
              result = await this.locationiqReverse(latitude, longitude);
            }
            break;
        }

        if (result) {
          result.source = provider;
          
          // Cache the result
          if (useCache) {
            await this.cacheGeocode(latitude, longitude, 'reverse', result);
          }
          
          return result;
        }
      } catch (error) {
        errors.push({ provider, error: error.message });
      }
    }

    // All providers failed
    throw new Error(`All geocoding providers failed: ${JSON.stringify(errors)}`);
  }

  /**
   * Forward geocoding - Convert address to GPS coordinates
   */
  async forwardGeocode(address, options = {}) {
    const { preferredProvider = 'auto', useCache = true, country = null } = options;


    // Check cache first
    if (useCache) {
      const cached = await this.getCachedGeocode(address, null, 'forward');
      if (cached) {
        return cached;
      }
    }

    let result = null;
    let errors = [];

    const providers = this.getProviderOrder(preferredProvider);

    for (const provider of providers) {
      try {
        
        switch (provider) {
          case 'nominatim':
            if (this.config.nominatim.enabled) {
              result = await this.nominatimForward(address, country);
            }
            break;
          case 'mapbox':
            if (this.config.mapbox.enabled) {
              result = await this.mapboxForward(address, country);
            }
            break;
          case 'google':
            if (this.config.google.enabled) {
              result = await this.googleForward(address, country);
            }
            break;
          case 'locationiq':
            if (this.config.locationiq.enabled) {
              result = await this.locationiqForward(address, country);
            }
            break;
        }

        if (result) {
          result.source = provider;
          
          // Cache the result
          if (useCache) {
            await this.cacheGeocode(address, null, 'forward', result);
          }
          
          return result;
        }
      } catch (error) {
        errors.push({ provider, error: error.message });
      }
    }

    throw new Error(`All forward geocoding providers failed: ${JSON.stringify(errors)}`);
  }

  /**
   * OpenStreetMap Nominatim - Reverse Geocoding (FREE)
   */
  async nominatimReverse(latitude, longitude) {
    await this.respectNominatimRateLimit();

    const url = `${this.config.nominatim.baseUrl}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.config.nominatim.userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.error) {
      throw new Error(data.error || 'No results from Nominatim');
    }

    return {
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      formatted_address: data.display_name,
      country: data.address.country,
      country_code: data.address.country_code?.toUpperCase(),
      region: data.address.state || data.address.county || data.address.region,
      city: data.address.city || data.address.town || data.address.village,
      district: data.address.suburb || data.address.neighbourhood,
      postcode: data.address.postcode,
      road: data.address.road,
      confidence: this.calculateConfidence(data),
      raw: data
    };
  }

  /**
   * OpenStreetMap Nominatim - Forward Geocoding (FREE)
   */
  async nominatimForward(address, country = null) {
    await this.respectNominatimRateLimit();

    let query = address;
    if (country) {
      query += `, ${country}`;
    }

    const url = `${this.config.nominatim.baseUrl}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.config.nominatim.userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('No results from Nominatim');
    }

    const result = data[0];

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formatted_address: result.display_name,
      country: result.address.country,
      country_code: result.address.country_code?.toUpperCase(),
      region: result.address.state || result.address.county || result.address.region,
      city: result.address.city || result.address.town || result.address.village,
      district: result.address.suburb || result.address.neighbourhood,
      postcode: result.address.postcode,
      confidence: parseFloat(result.importance || 0.5),
      raw: result
    };
  }

  /**
   * Mapbox Geocoding API - Reverse (50,000/month free)
   */
  async mapboxReverse(latitude, longitude) {
    if (!this.config.mapbox.enabled) {
      throw new Error('Mapbox API key not configured');
    }

    const url = `${this.config.mapbox.baseUrl}/${longitude},${latitude}.json?access_token=${this.config.mapbox.accessToken}&types=place,region,country`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('No results from Mapbox');
    }

    const feature = data.features[0];
    const context = feature.context || [];

    return {
      latitude: feature.center[1],
      longitude: feature.center[0],
      formatted_address: feature.place_name,
      city: feature.text,
      region: this.extractFromContext(context, 'region'),
      country: this.extractFromContext(context, 'country'),
      country_code: this.extractFromContext(context, 'country', 'short_code')?.replace('_', '').toUpperCase(),
      postcode: this.extractFromContext(context, 'postcode'),
      confidence: feature.relevance || 0.8,
      raw: feature
    };
  }

  /**
   * Mapbox Geocoding API - Forward
   */
  async mapboxForward(address, country = null) {
    if (!this.config.mapbox.enabled) {
      throw new Error('Mapbox API key not configured');
    }

    let query = address;
    if (country) {
      query += `, ${country}`;
    }

    const url = `${this.config.mapbox.baseUrl}/${encodeURIComponent(query)}.json?access_token=${this.config.mapbox.accessToken}&types=place,region,country&limit=1`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('No results from Mapbox');
    }

    const feature = data.features[0];
    const context = feature.context || [];

    return {
      latitude: feature.center[1],
      longitude: feature.center[0],
      formatted_address: feature.place_name,
      city: feature.text,
      region: this.extractFromContext(context, 'region'),
      country: this.extractFromContext(context, 'country'),
      country_code: this.extractFromContext(context, 'country', 'short_code')?.replace('_', '').toUpperCase(),
      confidence: feature.relevance || 0.8,
      raw: feature
    };
  }

  /**
   * Google Maps Geocoding API - Reverse (Paid, premium option)
   */
  async googleReverse(latitude, longitude) {
    if (!this.config.google.enabled) {
      throw new Error('Google Maps API key not configured');
    }

    const url = `${this.config.google.baseUrl}/json?latlng=${latitude},${longitude}&key=${this.config.google.apiKey}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Google Maps error: ${data.status}`);
    }

    const result = data.results[0];
    const components = this.parseGoogleAddressComponents(result.address_components);

    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formatted_address: result.formatted_address,
      country: components.country,
      country_code: components.country_code,
      region: components.administrative_area_level_1,
      city: components.locality || components.administrative_area_level_2,
      district: components.sublocality || components.neighborhood,
      postcode: components.postal_code,
      confidence: 0.95, // Google is highly accurate
      raw: result
    };
  }

  /**
   * Google Maps Geocoding API - Forward
   */
  async googleForward(address, country = null) {
    if (!this.config.google.enabled) {
      throw new Error('Google Maps API key not configured');
    }

    let query = address;
    if (country) {
      query += `, ${country}`;
    }

    const url = `${this.config.google.baseUrl}/json?address=${encodeURIComponent(query)}&key=${this.config.google.apiKey}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Google Maps error: ${data.status}`);
    }

    const result = data.results[0];
    const components = this.parseGoogleAddressComponents(result.address_components);

    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formatted_address: result.formatted_address,
      country: components.country,
      country_code: components.country_code,
      region: components.administrative_area_level_1,
      city: components.locality || components.administrative_area_level_2,
      district: components.sublocality || components.neighborhood,
      postcode: components.postal_code,
      confidence: 0.95,
      raw: result
    };
  }

  /**
   * LocationIQ API - Reverse (5,000/day free)
   */
  async locationiqReverse(latitude, longitude) {
    if (!this.config.locationiq.enabled) {
      throw new Error('LocationIQ API key not configured');
    }

    const url = `${this.config.locationiq.baseUrl}/reverse.php?key=${this.config.locationiq.apiKey}&lat=${latitude}&lon=${longitude}&format=json`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`LocationIQ API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      formatted_address: data.display_name,
      country: data.address.country,
      country_code: data.address.country_code?.toUpperCase(),
      region: data.address.state || data.address.county,
      city: data.address.city || data.address.town || data.address.village,
      district: data.address.suburb || data.address.neighbourhood,
      postcode: data.address.postcode,
      confidence: 0.8,
      raw: data
    };
  }

  /**
   * LocationIQ API - Forward
   */
  async locationiqForward(address, country = null) {
    if (!this.config.locationiq.enabled) {
      throw new Error('LocationIQ API key not configured');
    }

    let query = address;
    if (country) {
      query += `, ${country}`;
    }

    const url = `${this.config.locationiq.baseUrl}/search.php?key=${this.config.locationiq.apiKey}&q=${encodeURIComponent(query)}&format=json&limit=1`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`LocationIQ API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('No results from LocationIQ');
    }

    const result = data[0];

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formatted_address: result.display_name,
      country: result.address?.country,
      country_code: result.address?.country_code?.toUpperCase(),
      region: result.address?.state || result.address?.county,
      city: result.address?.city || result.address?.town,
      confidence: parseFloat(result.importance || 0.7),
      raw: result
    };
  }

  // Helper methods

  getProviderOrder(preferredProvider) {
    if (preferredProvider !== 'auto') {
      return [preferredProvider, 'nominatim', 'mapbox', 'locationiq', 'google'];
    }
    // Default order: Free first, then premium
    return ['nominatim', 'locationiq', 'mapbox', 'google'];
  }

  async respectNominatimRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastNominatimRequest;
    
    if (timeSinceLastRequest < this.config.nominatim.rateLimit) {
      const waitTime = this.config.nominatim.rateLimit - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastNominatimRequest = Date.now();
  }

  extractFromContext(context, type, field = 'text') {
    const item = context.find(c => c.id.startsWith(type));
    return item ? item[field] : null;
  }

  parseGoogleAddressComponents(components) {
    const result = {};
    components.forEach(component => {
      component.types.forEach(type => {
        if (type === 'country') {
          result.country = component.long_name;
          result.country_code = component.short_name;
        } else {
          result[type] = component.long_name;
        }
      });
    });
    return result;
  }

  calculateConfidence(data) {
    // Nominatim importance score (0-1)
    if (data.importance) {
      return parseFloat(data.importance);
    }
    // Default confidence based on address completeness
    let confidence = 0.5;
    if (data.address.city || data.address.town) confidence += 0.2;
    if (data.address.state || data.address.county) confidence += 0.15;
    if (data.address.country) confidence += 0.15;
    return Math.min(confidence, 1.0);
  }

  /**
   * Cache geocoding results in database
   */
  async cacheGeocode(input, coordinates, type, result) {
    try {
      const cacheKey = type === 'reverse' 
        ? `${input},${coordinates}` 
        : input.toLowerCase();

      await getSupabase()
        .from('geocoding_cache')
        .upsert({
          cache_key: cacheKey,
          type: type,
          input: input,
          result: result,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        });
    } catch (error) {
    }
  }

  /**
   * Get cached geocoding result
   */
  async getCachedGeocode(input, coordinates, type) {
    try {
      const cacheKey = type === 'reverse' 
        ? `${input},${coordinates}` 
        : input.toLowerCase();

      const { data, error } = await getSupabase()
        .from('geocoding_cache')
        .select('result')
        .eq('cache_key', cacheKey)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if cache is less than 30 days old
      const cacheAge = Date.now() - new Date(data.created_at).getTime();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

      if (cacheAge > maxAge) {
        return null;
      }

      return data.result;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new GeocodingService();
