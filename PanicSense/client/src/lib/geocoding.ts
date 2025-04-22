import { toast } from "@/hooks/use-toast";

interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
  importance: number;
}

const PHILIPPINES_BOUNDS = {
  minLat: 4.5,
  maxLat: 21.5,
  minLon: 116.0,
  maxLon: 127.0
};

const geocodingCache = new Map<string, [number, number]>();

// Regular expressions for location extraction
const LOCATION_PATTERNS = [
  // City/Municipality patterns
  /\b(?:in|at|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+City)?)/,
  // Province patterns
  /\b(?:province of|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
  // Common Filipino location markers
  /\b(?:sa|dito sa)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
];

export function extractLocations(text: string): string[] {
  const locations = new Set<string>();

  // Normalize text - capitalize first letter of each word
  const normalizedText = text.replace(/\b\w+/g, word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );

  // Apply each pattern and collect matches
  LOCATION_PATTERNS.forEach(pattern => {
    const matches = normalizedText.match(pattern);
    if (matches && matches[1]) {
      locations.add(matches[1].trim());
    }
  });

  return Array.from(locations);
}

export async function getCoordinates(location: string): Promise<[number, number] | null> {
  // Handle exact location name with NO normalization
  // This is critical for finding specific places like "WoodEstate Village 2 Molino 3"
  
  // If already in cache, return cached coordinates
  if (geocodingCache.has(location)) {
    console.log(`💾 Using cached coordinates for "${location}"`);
    return geocodingCache.get(location)!;
  }

  try {
    console.log(`🔍 Searching OpenStreetMap for exact location: "${location}"`);
    
    // Try different search strategies
    // Strategy 1: Exact location with Philippines context
    const searchQuery = `${location}, Philippines`;
    const encodedQuery = encodeURIComponent(searchQuery);

    // Use more parameters to improve search precision
    // - q: the search query
    // - format: response format
    // - countrycodes: restrict to Philippines
    // - addressdetails: get full address details
    // - limit: max number of results
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&countrycodes=ph&addressdetails=1&limit=1`,
      {
        headers: {
          'User-Agent': 'PanicSensePH/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch coordinates');
    }

    const results = await response.json() as GeocodingResult[];

    if (results.length === 0) {
      console.log(`❌ No results found for "${location}" using exact search`);
      
      // Strategy 2: Try with different search methods if no results
      // This is a fallback for complex location names
      const alternativeQuery = encodeURIComponent(location.split(' ').join('+') + '+Philippines');
      const altResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${alternativeQuery}&format=json&countrycodes=ph&addressdetails=1&limit=1`,
        {
          headers: {
            'User-Agent': 'PanicSensePH/1.0'
          }
        }
      );
      
      if (!altResponse.ok) {
        throw new Error('Failed to fetch coordinates with alternative method');
      }
      
      const altResults = await altResponse.json() as GeocodingResult[];
      
      if (altResults.length === 0) {
        console.log(`❌ No results found for "${location}" using alternative search`);
        return null;
      }
      
      const { lat, lon } = altResults[0];
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      
      // Verify coordinates are within Philippines bounds
      if (
        latitude >= PHILIPPINES_BOUNDS.minLat &&
        latitude <= PHILIPPINES_BOUNDS.maxLat &&
        longitude >= PHILIPPINES_BOUNDS.minLon &&
        longitude <= PHILIPPINES_BOUNDS.maxLon
      ) {
        console.log(`✅ Found coordinates for "${location}" using alternative search: [${latitude}, ${longitude}]`);
        // Cache the result
        const coordinates: [number, number] = [latitude, longitude];
        geocodingCache.set(location, coordinates);
        return coordinates;
      }
      
      return null;
    }

    const { lat, lon } = results[0];
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // Verify coordinates are within Philippines bounds
    if (
      latitude >= PHILIPPINES_BOUNDS.minLat &&
      latitude <= PHILIPPINES_BOUNDS.maxLat &&
      longitude >= PHILIPPINES_BOUNDS.minLon &&
      longitude <= PHILIPPINES_BOUNDS.maxLon
    ) {
      console.log(`✅ Found coordinates for "${location}" using primary search: [${latitude}, ${longitude}]`);
      // Cache the result
      const coordinates: [number, number] = [latitude, longitude];
      geocodingCache.set(location, coordinates);
      return coordinates;
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    toast({
      title: "Location Error",
      description: "Failed to get coordinates for " + location,
      variant: "destructive",
    });
    return null;
  }
}