import { useState, useMemo, useEffect, useRef } from "react";
import { useDisasterContext } from "@/context/disaster-context";
import { SentimentMap, SentimentMapHandle } from "@/components/analysis/sentiment-map";
import { SentimentLegend } from "@/components/analysis/sentiment-legend";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, MapPin, Map, AlertTriangle, Satellite, Eye, EyeOff, BarChart3, MousePointerClick, PieChart } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCoordinates, extractLocations } from "@/lib/geocoding";
import { getSentimentColor, getDisasterTypeColor } from "@/lib/colors";
import { toast } from "@/hooks/use-toast";

// Define types for the component
interface Region {
  name: string;
  coordinates: [number, number];
  sentiment: string; // Still keep dominant sentiment for color coding
  sentiments: Record<string, number>; // All sentiments with counts
  disasterType?: string; // Still keep dominant disaster type for main display
  disasterTypes: Record<string, number>; // All disaster types with counts
  intensity: number;
}

interface LocationData {
  count: number;
  sentiments: Record<string, number>;
  disasterTypes: Record<string, number>;
  coordinates: [number, number];
}

export default function GeographicAnalysis() {
  const [activeMapType, setActiveMapType] = useState<'disaster' | 'emotion'>('disaster');
  const { sentimentPosts, refreshData } = useDisasterContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mapView, setMapView] = useState<'standard' | 'satellite'>('standard');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string | null>(null);
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const mapRef = useRef<SentimentMapHandle>(null);
  const [detectedLocations, setDetectedLocations] = useState<Record<string, [number, number]>>({
    // Add locations that the AI might identify by name but aren't in our predefined list
    "Meycauayan": [14.7345008, 120.9571635], 
    "Meycuayan": [14.7345008, 120.9571635], // Common misspelling
    "WoodEstate Village 2 Molino 3": [14.3476, 120.9735], // Approximated coords for Molino, Bacoor
    "Molino 3": [14.3476, 120.9735],
    "Molino": [14.3476, 120.9735]
  });

  // Complete Philippine region coordinates
  const regionCoordinates: Record<string, [number, number]> = {
    // Remove the Unknown entry entirely
    // "Unknown": [12.8797, 121.7740],

    // Metro Manila and surrounding provinces
    "Metro Manila": [14.5995, 120.9842],
    "Manila": [14.5995, 120.9842],
    "Batangas": [13.7565, 121.0583],
    "Rizal": [14.6042, 121.3035],
    "Taytay": [14.5762, 121.1324],
    "Taytay Rizal": [14.5762, 121.1324],
    "Taytay, Rizal": [14.5762, 121.1324],
    "Angono": [14.5409, 121.1533],
    "Angono Rizal": [14.5409, 121.1533],
    "angono rizal": [14.5409, 121.1533],
    "Imus": [14.4301, 120.9387],
    "Imus Cavite": [14.4301, 120.9387],
    "Imus, Cavite": [14.4301, 120.9387],
    "Bacoor": [14.4624, 120.9645],
    "Bacoor Cavite": [14.4624, 120.9645],
    "Bacoor, Cavite": [14.4624, 120.9645],
    "bacoor cavite": [14.4624, 120.9645],
    "csavite": [14.2829, 120.8686], // Special case for typo
    "Laguna": [14.2691, 121.4113],
    "Bulacan": [14.7969, 120.8787],
    "Cavite": [14.2829, 120.8686],
    "Pampanga": [15.0794, 120.6200],

    // Main regions
    "Luzon": [16.0, 121.0],
    "Visayas": [11.0, 124.0],
    "Mindanao": [7.5, 125.0],

    // Major cities
    "Cebu": [10.3157, 123.8854],
    "Davao": [7.0707, 125.6087],
    "Quezon City": [14.6760, 121.0437],
    "Tacloban": [11.2543, 125.0000],
    "Baguio": [16.4023, 120.5960],
    "Zamboanga": [6.9214, 122.0790],
    "Cagayan de Oro": [8.4542, 124.6319],
    "General Santos": [6.1164, 125.1716],
    
    // Metro Manila cities
    "Makati": [14.5547, 121.0244],
    "Pasig": [14.5764, 121.0851],
    "Taguig": [14.5176, 121.0509],
    "Marikina": [14.6507, 121.1029],
    "Mandaluyong": [14.5794, 121.0359],
    "Pasay": [14.5378, 121.0014],
    "Parañaque": [14.4793, 121.0198],
    "Caloocan": [14.6499, 120.9809],
    "Muntinlupa": [14.4081, 121.0415],
    "San Juan": [14.6019, 121.0355],
    "Las Piñas": [14.4453, 120.9833],
    "Valenzuela": [14.7011, 120.9830],
    "Navotas": [14.6688, 120.9427],
    "Malabon": [14.6681, 120.9574],
    "Pateros": [14.5446, 121.0685],
    
    // Other major cities and locations
    "Angeles": [15.1450, 120.5887],
    "Bacolod": [10.6713, 122.9511],
    "Iloilo": [10.7202, 122.5621],
    "Monumento": [14.6543, 120.9834],
    "Cabanatuan": [15.4886, 120.9691],
    "Boracay": [11.9804, 121.9189],
    "Palawan": [9.8349, 118.7384],
    "Bohol": [9.8500, 124.1435],
    "Leyte": [11.0105, 124.6514],
    "Samar": [11.5750, 124.9749],
    "Pangasinan": [15.8949, 120.2863],
    "Tarlac": [15.4755, 120.5963],
    "Cagayan": [17.6132, 121.7270],
    "Bicol": [13.4213, 123.4136],
    "Nueva Ecija": [15.5784, 120.9716],
    "Benguet": [16.4023, 120.5960],
    "Albay": [13.1776, 123.5280],
    "Zambales": [15.5082, 120.0697]
  };

  // Function to find exact location match or closest match if needed
  const findExactLocation = (input: string): string | null => {
    if (!input) return null;
    
    const trimmedInput = input.trim();
    
    // First check for exact matches (preserving case)
    for (const location of Object.keys(regionCoordinates).concat(Object.keys(detectedLocations))) {
      if (location === trimmedInput) {
        return location; // Return exact match
      }
    }
    
    // For case-insensitive matches, preserve the original casing in our reference data
    for (const location of Object.keys(regionCoordinates).concat(Object.keys(detectedLocations))) {
      if (location.toLowerCase() === trimmedInput.toLowerCase()) {
        return location; // Return the original casing from our reference data
      }
    }
    
    // If there's no exact match, try to find if it's a known location with comma format
    // Example: if we know "Taytay Rizal" but input is "Taytay, Rizal" or vice versa
    const commaRemoved = trimmedInput.replace(/,/g, '');
    for (const location of Object.keys(regionCoordinates).concat(Object.keys(detectedLocations))) {
      const locationNoComma = location.replace(/,/g, '');
      if (locationNoComma.toLowerCase() === commaRemoved.toLowerCase()) {
        return location;
      }
    }
    
    // Only do partial matching if absolutely necessary
    if (trimmedInput.length >= 4) {
      for (const location of Object.keys(regionCoordinates).concat(Object.keys(detectedLocations))) {
        if (location.toLowerCase().includes(trimmedInput.toLowerCase()) || 
            trimmedInput.toLowerCase().includes(location.toLowerCase())) {
          return location;
        }
      }
    }
    
    return null;
  };
  
  // Simple Levenshtein distance calculation for typo correction
  const calculateEditDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
  
    const matrix = [];
  
    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
  
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
  
    return matrix[b.length][a.length];
  };

  // Effect for processing new posts and extracting locations
  useEffect(() => {
    // Dynamically lookup ANY location in real-time using OpenStreetMap API
    async function fetchMissingCoordinates() {
      // Find ALL locations from ALL posts
      const allLocations = sentimentPosts
        .filter(post => post.location)
        .map(post => post.location as string);
      
      // Find locations that we don't have coordinates for yet
      const missingLocations = allLocations.filter(
        location => !regionCoordinates[location] && !detectedLocations[location]
      );
      
      // Get unique locations
      const uniqueLocations = Array.from(new Set(missingLocations));
      
      if (uniqueLocations.length > 0) {
        console.log(`Searching for ${uniqueLocations.length} missing locations in real-time...`);
      }
      
      // Fetch coordinates for each missing location directly from OpenStreetMap
      const newDetectedLocations: Record<string, [number, number]> = {...detectedLocations};
      let hasNewLocations = false;
      
      for (const location of uniqueLocations) {
        try {
          // Use OpenStreetMap to get coordinates for ANY location name
          const coordinates = await getCoordinates(location);
          if (coordinates) {
            console.log(`✅ Found real-time coordinates for "${location}": [${coordinates[0]}, ${coordinates[1]}]`);
            newDetectedLocations[location] = coordinates;
            hasNewLocations = true;
          } else {
            console.log(`❌ Could not find coordinates for "${location}" - add to predefined list`);
          }
        } catch (error) {
          console.error(`Failed to get coordinates for ${location}:`, error);
        }
      }
      
      if (hasNewLocations) {
        setDetectedLocations(prevState => ({
          ...prevState,
          ...newDetectedLocations
        }));
      }
    }
    
    fetchMissingCoordinates();
  }, [sentimentPosts]);

  // We no longer need this list since we're only using the exact location names from posts
  // This ensures consistency with the Dashboard Recent Affected Areas

  const locationData = useMemo(() => {
    // Create a data structure to track location data
    const data: Record<string, LocationData> = {};
    
    // Process posts to populate the map with the exact location names
    for (const post of sentimentPosts) {
      if (!post.location || 
          post.location.toUpperCase() === "UNKNOWN" ||
          post.location === "None" ||
          post.location === "Not specified" ||
          post.location === "Not Specified" ||
          post.location.toLowerCase().includes("none") ||
          post.location.toLowerCase().includes("unspecified")) continue;
      
      const location = post.location; // Exact match - no trim or other processing
      
      // Get coordinates from predefined list or detected locations
      let coordinates = regionCoordinates[location] ?? detectedLocations[location];
      if (!coordinates) continue; // Skip locations we can't pin
      
      if (!data[location]) {
        data[location] = {
          count: 0,
          sentiments: {},
          disasterTypes: {},
          coordinates
        };
      }
      
      // Update counts
      data[location].count++;
      
      // Track sentiments
      data[location].sentiments[post.sentiment] = 
        (data[location].sentiments[post.sentiment] || 0) + 1;
      
      // Track disaster types
      if (post.disasterType) {
        data[location].disasterTypes[post.disasterType] = 
          (data[location].disasterTypes[post.disasterType] || 0) + 1;
      }
    }

    return data;
  }, [sentimentPosts, detectedLocations]);

  // Convert location data to regions for map, excluding UNKNOWN
  const regions = useMemo((): Region[] => {
    return Object.entries(locationData)
      .filter(([name]) => name !== "UNKNOWN" && name !== "Unknown")
      .map(([name, data]) => {
      // Find dominant sentiment while keeping all sentiments data
      let maxCount = 0;
      let dominantSentiment = "Neutral";

      Object.entries(data.sentiments).forEach(([sentiment, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantSentiment = sentiment;
        }
      });

      // Find dominant disaster type while keeping all disaster types data
      let maxTypeCount = 0;
      let dominantDisasterType: string | undefined;

      Object.entries(data.disasterTypes).forEach(([type, count]) => {
        if (count > maxTypeCount) {
          maxTypeCount = count;
          dominantDisasterType = type;
        }
      });

      // Calculate intensity based on post count relative to maximum
      const maxPosts = Math.max(...Object.values(locationData).map(d => d.count), 1);
      const intensity = (data.count / maxPosts) * 100;

      return {
        name,
        coordinates: data.coordinates,
        sentiment: dominantSentiment, // Keep dominant sentiment for main color coding
        sentiments: data.sentiments,  // Include all sentiments with their counts
        disasterType: dominantDisasterType, // Keep dominant disaster type for main display
        disasterTypes: data.disasterTypes, // Include all disaster types with their counts
        intensity
      };
    });
  }, [locationData]);

  // Calculate most affected areas - Top 10
  const mostAffectedAreas = useMemo(() => {
    return regions
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 10)
      .map(region => ({
        name: region.name,
        sentiment: region.sentiment,
        sentiments: region.sentiments,
        disasterType: region.disasterType,
        disasterTypes: region.disasterTypes,
        coordinates: region.coordinates, // Include coordinates for click-to-zoom functionality
        isTopTen: true
      }));
  }, [regions]);
  
  // Calculate other affected areas - Beyond top 10, but limit to 20 to prevent overwhelming
  const otherAffectedAreas = useMemo(() => {
    return regions
      .sort((a, b) => b.intensity - a.intensity)
      .slice(10, 30) // Get areas beyond the top 10, but limit to 20 more
      .map(region => ({
        name: region.name,
        sentiment: region.sentiment,
        sentiments: region.sentiments,
        disasterType: region.disasterType,
        disasterTypes: region.disasterTypes,
        coordinates: region.coordinates, // Include coordinates for click-to-zoom functionality
        isTopTen: false
      }));
  }, [regions]);

  // Handle clicking on a location to zoom to it on the map
  const handleZoomToLocation = (coordinates: [number, number]) => {
    // Access the map instance through the ref and zoom to location
    if (mapRef.current) {
      // Use the map ref directly with the proper type
      mapRef.current.zoomToLocation(coordinates);
      
      // Show visual feedback
      toast({
        title: "Zooming to location",
        description: "Moving map view to see the selected area and its surroundings",
        variant: "default",
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Enhanced colorful background for entire page (matching dashboard) */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-violet-50 to-pink-50 overflow-hidden">
        {/* More vibrant animated gradient overlay - CSS Animation */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-teal-500/10 to-rose-500/15 animate-gradient"
          style={{ backgroundSize: '200% 200%' }}
        />
        
        {/* Enhanced animated patterns with more vibrant colors */}
        <div className="absolute inset-0 opacity-15 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM1MDUwRjAiIGZpbGwtb3BhY2l0eT0iMC41Ij48cGF0aCBkPSJNMzYgMzR2Nmg2di02aC02em02IDZ2Nmg2di02aC02em0tMTIgMGg2djZoLTZ2LTZ6bTEyIDBoNnY2aC02di02eiIvPjwvZz48L2c+PC9zdmc+')]"></div>
        
        {/* Additional decorative elements */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(120,80,255,0.8)_0%,transparent_70%)]"></div>
      </div>
      
      {/* Content Container - Mobile-optimized layout with minimal padding */}
      <div className="flex-1 px-1 sm:px-2 py-2 sm:py-4 pb-0 overflow-y-auto">
        {/* Header Card - More compact on mobile with translucency */}
        <Card className="border-none mb-2 sm:mb-4 overflow-hidden shadow-lg rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/40">
          <CardHeader className="p-2 sm:p-4 bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 border-b border-indigo-700/50">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                  <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-white">
                    Geographic Analysis
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-indigo-100 mt-0.5 sm:mt-1">
                    Visualizing disaster impact across Philippine regions
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMarkers(!showMarkers)}
                className="flex items-center gap-1 z-10 text-xs sm:text-sm py-1 px-3 h-8 bg-white/30 backdrop-blur-sm text-white border border-white/30 hover:bg-white/40 shadow-sm"
              >
                {showMarkers ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                <span>{showMarkers ? 'Hide Markers' : 'Show Markers'}</span>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Area - Optimized for mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
          {/* Map Container - Enhanced design with translucency and proper corners */}
          <div className="bg-white/90 shadow-xl rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-9rem)] border border-indigo-100/40 backdrop-blur-sm">
            {/* Map Controls - Upgraded style with rounded top corners */}
            <div className="border-b border-indigo-100 p-2 sm:p-4 bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-100 rounded-t-2xl">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                {/* View Type Controls */}
                <div className="flex gap-1 sm:gap-2">
                  <Button
                    variant={activeMapType === 'disaster' ? 'default' : 'outline'}
                    onClick={() => setActiveMapType('disaster')}
                    className={`flex items-center gap-1 text-xs sm:text-sm h-8 rounded-full ${
                      activeMapType === 'disaster' 
                        ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white border-0 shadow-md' 
                        : 'border border-amber-200 text-amber-700 hover:bg-amber-50'
                    }`}
                    size="sm"
                  >
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Disaster</span>
                  </Button>
                  <Button
                    variant={activeMapType === 'emotion' ? 'default' : 'outline'}
                    onClick={() => setActiveMapType('emotion')}
                    className={`flex items-center gap-1 text-xs sm:text-sm h-8 rounded-full ${
                      activeMapType === 'emotion' 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-md' 
                        : 'border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                    }`}
                    size="sm"
                  >
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Emotion</span>
                  </Button>
                </div>

                {/* Map Style Controls */}
                <div className="flex shadow-sm rounded-full overflow-hidden border border-blue-200">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMapView('standard')}
                    className={`rounded-l-full rounded-r-none border-0 h-8 px-3 ${
                      mapView === 'standard' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                        : 'bg-white text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <Map className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs">Map</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMapView('satellite')}
                    className={`rounded-r-full rounded-l-none border-0 h-8 px-3 ${
                      mapView === 'satellite' 
                        ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Satellite className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs">Satellite</span>
                  </Button>
                </div>
              </div>

              {/* Active Filters Display - Compact on mobile */}
              {selectedRegionFilter && (
                <div className="mt-2 flex items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm text-slate-500">Filtered by:</span>
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    {selectedRegionFilter}
                    <button
                      onClick={() => setSelectedRegionFilter(null)}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                </div>
              )}
            </div>

            {/* Map View Container */}
            <div className="relative flex-1 min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMapType}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <SentimentMap
                    ref={mapRef}
                    regions={regions}
                    mapType={activeMapType}
                    view={mapView}
                    showMarkers={showMarkers}
                    onRegionSelect={(region) => {
                      setSelectedRegionFilter(region.name);
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Regional Insights Panel - All in one container with sidebars */}
          <div className="rounded-2xl bg-white/95 shadow-lg border border-indigo-100/40 backdrop-blur-sm min-h-[300px] sm:min-h-[400px] lg:h-[calc(100vh-9rem)] flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 p-3 border-b border-indigo-700/50 rounded-t-2xl">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                  <Globe className="h-3.5 w-3.5 text-white" />
                </div>
                Regional Insights
              </h3>
            </div>
            
            {/* Main Container */}
            <div className="flex-1 p-3 overflow-auto scrollbar-hide">
              {/* Legends & Indicators Section */}
              <div className="flex flex-col gap-4 mb-4">
                {/* Sentiment Legend */}
                <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/50 p-2.5 rounded-xl border border-indigo-100/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 rounded-full bg-indigo-100/70">
                      <PieChart className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-medium text-indigo-800">Emotion Indicators</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm"></div>
                      <span className="text-xs font-medium text-slate-700">Panic</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-orange-500 shadow-sm"></div>
                      <span className="text-xs font-medium text-slate-700">Fear</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-purple-500 shadow-sm"></div>
                      <span className="text-xs font-medium text-slate-700">Disbelief</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
                      <span className="text-xs font-medium text-slate-700">Resilience</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-gray-500 shadow-sm"></div>
                      <span className="text-xs font-medium text-slate-700">Neutral</span>
                    </div>
                  </div>
                </div>

                {/* Disaster Types */}
                <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/50 p-2.5 rounded-xl border border-amber-100/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 rounded-full bg-amber-100/70">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-medium text-amber-800">Disaster Types</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm"></div>
                      <span className="text-xs font-medium text-slate-700">Flood</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-blue-900 shadow-sm"></div>
                      <span className="text-xs font-medium text-slate-700">Typhoon</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-orange-500 shadow-sm"></div>
                      <span className="text-xs font-medium text-slate-700">Fire</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm"></div>
                      <span className="text-xs font-medium text-slate-700">Volcanic</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-amber-800 shadow-sm"></div>
                      <span className="text-xs font-medium text-slate-700">Earthquake</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-colors">
                      <div className="w-4 h-4 rounded-full bg-amber-950 shadow-sm"></div>
                      <span className="text-xs font-medium text-slate-700">Landslide</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Affected Areas Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                {/* Most Affected Areas */}
                <div className="bg-gradient-to-br from-slate-50 to-rose-50/30 p-3 rounded-xl border border-red-100/50 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-red-100/70">
                        <Globe className="h-3.5 w-3.5 text-red-600" />
                      </div>
                      <h3 className="text-sm font-medium text-red-800">Most Affected Areas</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50/50">
                        Clickable
                      </Badge>
                      <MousePointerClick className="h-3 w-3 text-red-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    {mostAffectedAreas.map((area, index) => {
                      // Standardize disaster type display
                      const displayDisasterType = area.disasterType === 'Volcano' ? 'Volcanic Eruption' : area.disasterType;
                      
                      return (
                        <div 
                          key={index}
                          onClick={() => area.coordinates && handleZoomToLocation(area.coordinates)}
                          className="bg-white p-2 rounded-md border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer active:bg-blue-100 shadow-sm hover:shadow-md group"
                          title="Click to zoom to this location on the map"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-800 truncate max-w-[70%]">
                              {area.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium px-1.5 py-0.5 bg-slate-100 rounded-full text-slate-600">#{index + 1}</span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MousePointerClick className="h-3 w-3 text-blue-500" />
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {/* Show multiple sentiment tags based on the data */}
                            {Object.entries(area.sentiments)
                              .sort(([, a], [, b]) => b - a)
                              .slice(0, 2) // Show top 2 sentiments
                              .map(([sentiment, count], i) => (
                                <Badge 
                                  key={i}
                                  variant="outline"
                                  className="text-xs font-medium px-1.5 py-0.5"
                                  style={{ 
                                    borderColor: getSentimentColor(sentiment),
                                    color: getSentimentColor(sentiment),
                                    backgroundColor: `${getSentimentColor(sentiment)}10`
                                  }}
                                >
                                  {sentiment}
                                </Badge>
                              ))}
                            
                            {/* Show multiple disaster types based on the data */}
                            {Object.entries(area.disasterTypes)
                              .sort(([, a], [, b]) => b - a)
                              .slice(0, 2) // Show top 2 disaster types
                              .map(([disType, count], i) => {
                                const displayType = disType === 'Volcano' ? 'Volcanic Eruption' : disType;
                                return (
                                  <Badge
                                    key={i}
                                    className="text-xs font-medium px-1.5 py-0.5"
                                    style={{
                                      backgroundColor: getDisasterTypeColor(displayType),
                                      color: 'white'
                                    }}
                                  >
                                    {displayType}
                                  </Badge>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Other Affected Areas */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-3 rounded-xl border border-blue-100/50 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-blue-100/70">
                        <Map className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-medium text-blue-800">Other Affected Areas</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50/50">
                        Clickable
                      </Badge>
                      <MousePointerClick className="h-3 w-3 text-blue-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    {otherAffectedAreas && otherAffectedAreas.length > 0 ? (
                      otherAffectedAreas.map((area, index) => {
                        // Standardize disaster type display
                        const displayDisasterType = area.disasterType === 'Volcano' ? 'Volcanic Eruption' : area.disasterType;

                        return (
                          <div 
                            key={index}
                            onClick={() => area.coordinates && handleZoomToLocation(area.coordinates)}
                            className="bg-white p-2 rounded-md border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer active:bg-blue-100 shadow-sm hover:shadow-md group"
                            title="Click to zoom to this location on the map"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-slate-800 truncate max-w-[70%]">
                                {area.name}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MousePointerClick className="h-3 w-3 text-blue-500" />
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {/* Show multiple sentiment tags based on the data */}
                              {Object.entries(area.sentiments)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 2) // Show top 2 sentiments
                                .map(([sentiment, count], i) => (
                                  <Badge 
                                    key={i}
                                    variant="outline"
                                    className="text-xs font-medium px-1.5 py-0.5"
                                    style={{ 
                                      borderColor: getSentimentColor(sentiment),
                                      color: getSentimentColor(sentiment),
                                      backgroundColor: `${getSentimentColor(sentiment)}10`
                                    }}
                                  >
                                    {sentiment}
                                  </Badge>
                                ))}
                              
                              {/* Show multiple disaster types based on the data */}
                              {Object.entries(area.disasterTypes)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 1) // Show just the top disaster type for other areas to save space
                                .map(([disType, count], i) => {
                                  const displayType = disType === 'Volcano' ? 'Volcanic Eruption' : disType;
                                  return (
                                    <Badge
                                      key={i}
                                      className="text-xs font-medium px-1.5 py-0.5"
                                      style={{
                                        backgroundColor: getDisasterTypeColor(displayType),
                                        color: 'white'
                                      }}
                                    >
                                      {displayType}
                                    </Badge>
                                  );
                                })}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-slate-500 py-2">No additional areas detected</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}