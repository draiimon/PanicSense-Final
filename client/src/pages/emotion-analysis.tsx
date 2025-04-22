import { useState, useMemo } from "react";
import { useDisasterContext } from "@/context/disaster-context";
import { SentimentMap } from "@/components/analysis/sentiment-map";
import { SentimentLegend } from "@/components/analysis/sentiment-legend";
import { motion, AnimatePresence } from "framer-motion";

export default function GeographicImpactAnalysis() {
  const [activeMapType, setActiveMapType] = useState<'disaster' | 'emotion'>('disaster');
  const { sentimentPosts } = useDisasterContext();
  const [mostAffectedAreas, setMostAffectedAreas] = useState<{
    name: string;
    sentiment: string;
    count: number;
  }[]>([]);

  // Complete Philippine region coordinates
  const regionCoordinates: Record<string, [number, number]> = {
    // Removed Unknown location coordinates

    // Metro Manila and surrounding provinces
    "Metro Manila": [14.5995, 120.9842],
    "Manila": [14.5995, 120.9842],
    "Batangas": [13.7565, 121.0583],
    "Rizal": [14.6042, 121.3035],
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
    "Cagayan de Oro": [8.4542, 124.6319],
    "General Santos": [6.1164, 125.1716]
  };

  // Process data for regions and map location mentions
  const regions = useMemo(() => {
    const locationCounts = new Map<string, { 
      count: number; 
      sentiments: Map<string, number>;
      disasterTypes: Map<string, number>;
    }>();

    // Process posts to populate the map
    sentimentPosts.forEach(post => {
      if (!post.location) return;
      
      // Skip posts with "UNKNOWN" location
      if (post.location.toUpperCase() === "UNKNOWN") return;

      let location = post.location;
      const lowerLocation = location.toLowerCase().trim();

      // Handle Manila specifically
      if (lowerLocation.includes('manila') && !lowerLocation.includes('metro')) {
        location = 'Manila';
      }

      // Handle main island groups if mentioned
      if (lowerLocation.includes('luzon')) location = 'Luzon';
      if (lowerLocation.includes('visayas')) location = 'Visayas';
      if (lowerLocation.includes('mindanao')) location = 'Mindanao';

      // Skip locations we don't have coordinates for
      if (!regionCoordinates[location]) return;

      if (!locationCounts.has(location)) {
        locationCounts.set(location, {
          count: 0,
          sentiments: new Map(),
          disasterTypes: new Map()
        });
      }

      const locationData = locationCounts.get(location)!;
      locationData.count++;

      // Track sentiments
      const currentSentimentCount = locationData.sentiments.get(post.sentiment) || 0;
      locationData.sentiments.set(post.sentiment, currentSentimentCount + 1);

      // Track disaster types
      if (post.disasterType) {
        const currentTypeCount = locationData.disasterTypes.get(post.disasterType) || 0;
        locationData.disasterTypes.set(post.disasterType, currentTypeCount + 1);
      }
    });

    // Convert to array and calculate intensities
    const maxPosts = Math.max(...Array.from(locationCounts.values()).map(d => d.count), 1);

    const processedRegions = Array.from(locationCounts.entries()).map(([name, data]) => {
      // Find dominant sentiment
      let maxCount = 0;
      let dominantSentiment = "Neutral";

      data.sentiments.forEach((count, sentiment) => {
        if (count > maxCount) {
          maxCount = count;
          dominantSentiment = sentiment;
        }
      });

      // Find dominant disaster type
      let maxTypeCount = 0;
      let dominantDisasterType: string | undefined;

      data.disasterTypes.forEach((count, type) => {
        if (count > maxTypeCount) {
          maxTypeCount = count;
          dominantDisasterType = type;
        }
      });

      const intensity = (data.count / maxPosts) * 100;

      return {
        name,
        coordinates: regionCoordinates[name],
        sentiment: dominantSentiment,
        disasterType: dominantDisasterType,
        intensity,
        count: data.count
      };
    });

    // Update most affected areas
    setMostAffectedAreas(
      processedRegions
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(({ name, sentiment, count }) => ({ name, sentiment, count }))
    );

    return processedRegions;
  }, [sentimentPosts]);

  return (
    <div className="space-y-6">
      {/* Impact Analysis Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
              Geographic Analysis
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Visualizing disaster impact across regions</p>
        </div>
      </div>

      {/* Tabs for Different Maps */}
      <div className="flex space-x-2 border-b border-gray-200 mb-4">
        <button 
          className={`px-6 py-2 font-medium text-sm rounded-t-lg transition-all ${activeMapType === 'disaster' ? 'bg-white text-blue-600 border border-gray-200 border-b-white' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveMapType('disaster')}
        >
          Disaster Impact Map
        </button>
        <button 
          className={`px-6 py-2 font-medium text-sm rounded-t-lg transition-all ${activeMapType === 'emotion' ? 'bg-white text-blue-600 border border-gray-200 border-b-white' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveMapType('emotion')}
        >
          Emotion Impact Map
        </button>
      </div>

      {/* Map and Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Impact Map */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">
              {activeMapType === 'disaster' ? 'Disaster Impact Map' : 'Sentiment Map'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {activeMapType === 'disaster' 
                ? 'Regions colored by disaster type' 
                : 'Regions colored by dominant emotion'}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMapType}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SentimentMap 
                  regions={regions}
                  mapType={activeMapType}
                  view="standard"
                  showMarkers={true}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white shadow-sm rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">
            {activeMapType === 'disaster' ? 'Disaster Impact Analysis' : 'Emotional Response Analysis'}
          </h3>
          <SentimentLegend 
            mostAffectedAreas={mostAffectedAreas}
          />
        </div>
      </div>
    </div>
  );
}