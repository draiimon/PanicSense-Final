import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getSentimentColor } from '@/lib/colors';
import { useDisasterContext } from '@/context/disaster-context';
import { useMemo } from 'react';

interface AffectedArea {
  name: string;
  percentage: number;
  sentiment: string;
  count: number;
}

interface AffectedAreasProps {
  title?: string;
  description?: string;
}

export function AffectedAreas({ 
  title = 'Top Affected Areas',
  description = 'By sentiment intensity'
}: AffectedAreasProps) {
  const { sentimentPosts } = useDisasterContext();

  // Calculate affected areas from actual sentiment posts with enhanced detection
  const areas = useMemo(() => {
    const locationCounts = new Map<string, { total: number; sentiments: Map<string, number> }>();
    
    // List of Philippine locations to detect in text
    const philippineLocations = [
      'Manila', 'Quezon City', 'Cebu', 'Davao', 'Mindanao', 'Luzon',
      'Visayas', 'Palawan', 'Boracay', 'Baguio', 'Bohol', 'Iloilo',
      'Batangas', 'Zambales', 'Pampanga', 'Bicol', 'Leyte', 'Samar',
      'Pangasinan', 'Tarlac', 'Cagayan', 'Bulacan', 'Cavite', 'Laguna', 
      'Rizal', 'Nueva Ecija', 'Benguet', 'Albay', 'Marikina', 'Pasig',
      'Makati', 'Mandaluyong', 'Pasay', 'Taguig', 'Parañaque', 'Caloocan'
    ];

    // Only process posts with valid locations
    sentimentPosts.forEach(post => {
      let foundLocation = post.location;
      
      // Skip UNKNOWN/invalid locations
      if (!foundLocation || 
          foundLocation.toUpperCase() === "UNKNOWN" ||
          foundLocation === "Not mentioned" || 
          foundLocation === "Not specified" || 
          foundLocation === "Not Specified" ||
          foundLocation === "None" ||
          foundLocation.toLowerCase().includes("none") ||
          foundLocation.toLowerCase().includes("unspecified") ||
          foundLocation.toLowerCase().includes("not mentioned")) {
        return;
      }
        const text = post.text.toLowerCase();
        // Check for known Philippine locations in the text
        for (const location of philippineLocations) {
          if (text.includes(location.toLowerCase())) {
            foundLocation = location;
            break;
          }
        }
      }
      
      // Skip posts without location or with generic non-specific locations
      if (!foundLocation || 
          foundLocation === "Not mentioned" || 
          foundLocation === "Not specified" || 
          foundLocation === "Not Specified" ||
          foundLocation === "None" ||
          foundLocation.toLowerCase().includes("none") ||
          foundLocation.toLowerCase().includes("unspecified") ||
          foundLocation.toLowerCase().includes("not mentioned")) return;

      if (!locationCounts.has(foundLocation)) {
        locationCounts.set(foundLocation, {
          total: 0,
          sentiments: new Map()
        });
      }

      const locationData = locationCounts.get(foundLocation)!;
      locationData.total++;

      const currentSentimentCount = locationData.sentiments.get(post.sentiment) || 0;
      locationData.sentiments.set(post.sentiment, currentSentimentCount + 1);
    });

    // Convert to array and calculate percentages
    const totalPosts = locationCounts.size > 0 ? 
      Array.from(locationCounts.values()).reduce((sum, data) => sum + data.total, 0) : 0;

    const areaData: AffectedArea[] = Array.from(locationCounts.entries())
      .map(([location, data]) => {
        // Find dominant sentiment
        let maxCount = 0;
        let dominantSentiment = 'Neutral';

        data.sentiments.forEach((count, sentiment) => {
          if (count > maxCount) {
            maxCount = count;
            dominantSentiment = sentiment;
          }
        });

        return {
          name: location,
          count: data.total,
          percentage: (data.total / totalPosts) * 100,
          sentiment: dominantSentiment
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10 affected areas

    return areaData;
  }, [sentimentPosts]);

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="p-5 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-slate-800">{title}</CardTitle>
        <CardDescription className="text-sm text-slate-500">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {areas.length === 0 ? (
          <p className="text-center text-slate-500 py-4">No affected areas data available</p>
        ) : (
          areas.map((area, index) => {
            const color = getSentimentColor(area.sentiment);

            return (
              <div key={index} className="flex items-center">
                <div 
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-slate-700">{area.name}</span>
                      <span className="text-xs text-slate-500 ml-2">({area.count} reports)</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500">{area.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${area.percentage}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}