import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSentimentColor, getDisasterTypeColor } from '@/lib/colors';
import { PieChart, Map, AlertTriangle, Globe, MousePointerClick } from 'lucide-react';

interface AffectedArea {
  name: string;
  sentiment: string;
  disasterType?: string | null;
  coordinates?: [number, number];
  isTopTen?: boolean;
}

interface SentimentLegendProps {
  mostAffectedAreas?: AffectedArea[];
  otherAffectedAreas?: AffectedArea[];
  showRegionSelection?: boolean;
  onSentimentClick?: (sentiment: string) => void;
  showOtherAreas?: boolean; // Flag to determine if Other Affected Areas should be shown
}

export function SentimentLegend({ 
  mostAffectedAreas = [],
  otherAffectedAreas = [],
  showRegionSelection = true,
  showOtherAreas = true, // Default to showing other areas
  onAreaClick,
  onSentimentClick
}: SentimentLegendProps & {
  onAreaClick?: (coordinates: [number, number]) => void;
}) {
  // Sentiment indicators
  const sentiments = [
    { name: 'Panic', color: '#ef4444' },
    { name: 'Fear/Anxiety', color: '#f97316' },
    { name: 'Disbelief', color: '#8b5cf6' },
    { name: 'Resilience', color: '#10b981' },
    { name: 'Neutral', color: '#6b7280' }
  ];

  // Disaster types - standardized to use "Volcanic Eruption"
  const disasterTypes = [
    { name: 'Flood', color: '#3b82f6' },
    { name: 'Typhoon', color: '#1e3a8a' }, // Dark Blue as per colors.ts
    { name: 'Fire', color: '#f97316' },
    { name: 'Volcanic Eruption', color: '#ef4444' }, // Standardized name
    { name: 'Earthquake', color: '#92400e' },
    { name: 'Landslide', color: '#78350f' }
  ];

  return (
    <Card className="bg-white/90 shadow-md border-none h-full flex flex-col rounded-2xl backdrop-blur-sm border border-indigo-100/40">
      <CardHeader className="p-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-indigo-100/70 shadow-inner">
            <Globe className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Insights Panel
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Disaster impacts by region
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4 flex-grow overflow-y-auto scrollbar-hide">
        {/* Sentiment Legend */}
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 p-3 rounded-lg border border-indigo-100/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 rounded-full bg-blue-100/70">
              <PieChart className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-indigo-800">Emotion Indicators</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sentiments.map((sentiment) => (
              <div 
                key={sentiment.name} 
                className="flex items-center gap-2 cursor-pointer hover:bg-white/80 p-1.5 rounded-md transition-colors"
                onClick={() => onSentimentClick?.(sentiment.name)}
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: sentiment.color }}
                />
                <span className="text-sm text-slate-700 truncate font-medium">{sentiment.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disaster Types */}
        <div className="bg-gradient-to-br from-slate-50 to-amber-50/30 p-3 rounded-lg border border-amber-100/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 rounded-full bg-amber-100/70">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <h3 className="text-sm font-medium text-amber-800">Disaster Types</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {disasterTypes.map((type) => (
              <div key={type.name} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white/80 cursor-default transition-colors">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-sm text-slate-700 truncate font-medium">{type.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Affected Areas section without separate scrolling */}
        {mostAffectedAreas && mostAffectedAreas.length > 0 && (
          <div className="bg-gradient-to-br from-slate-50 to-red-50/30 p-3 rounded-lg max-h-[600px] overflow-y-auto scrollbar-hide border border-red-100/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-red-100/70">
                  <Globe className="h-3.5 w-3.5 text-red-600" />
                </div>
                <h3 className="text-sm font-medium text-red-800">Most Affected Areas</h3>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50/50">
                  Clickable Regions
                </Badge>
                <MousePointerClick className="h-3 w-3 text-red-500" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-2 italic">Click any area to zoom to its location on map</p>
            <div className="space-y-2">
              {mostAffectedAreas.map((area, index) => {
                // Standardize disaster type display
                const displayDisasterType = area.disasterType === 'Volcano' ? 'Volcanic Eruption' : area.disasterType;

                return (
                  <div 
                    key={index}
                    onClick={() => area.coordinates && onAreaClick?.(area.coordinates)}
                    className="bg-white p-2.5 rounded-md border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer active:bg-blue-100 shadow-sm hover:shadow-md group"
                    title="Click to zoom to this location on the map"
                  >
                    <div className="flex items-center justify-between mb-1.5">
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
                      <Badge 
                        variant="outline"
                        className="text-xs font-medium px-2 py-0.5"
                        style={{ 
                          borderColor: getSentimentColor(area.sentiment),
                          color: getSentimentColor(area.sentiment),
                          backgroundColor: `${getSentimentColor(area.sentiment)}10`
                        }}
                      >
                        {area.sentiment}
                      </Badge>
                      {displayDisasterType && (
                        <Badge
                          className="text-xs font-medium px-2 py-0.5"
                          style={{
                            backgroundColor: getDisasterTypeColor(displayDisasterType),
                            color: 'white'
                          }}
                        >
                          {displayDisasterType}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Affected Areas section - only show when showOtherAreas is true */}
        {showOtherAreas && otherAffectedAreas && otherAffectedAreas.length > 0 && (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-3 rounded-lg max-h-[600px] overflow-y-auto scrollbar-hide border border-blue-100/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-blue-100/70">
                  <Globe className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-blue-800">Other Affected Areas</h3>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50/50">
                  Clickable Regions
                </Badge>
                <MousePointerClick className="h-3 w-3 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-2 italic">Click any area to zoom to its location on map</p>
            <div className="space-y-2">
              {otherAffectedAreas.map((area, index) => {
                // Standardize disaster type display
                const displayDisasterType = area.disasterType === 'Volcano' ? 'Volcanic Eruption' : area.disasterType;

                return (
                  <div 
                    key={index}
                    onClick={() => area.coordinates && onAreaClick?.(area.coordinates)}
                    className="bg-white p-2.5 rounded-md border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer active:bg-blue-100 shadow-sm hover:shadow-md group"
                    title="Click to zoom to this location on the map"
                  >
                    <div className="flex items-center justify-between mb-1.5">
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
                      <Badge 
                        variant="outline"
                        className="text-xs font-medium px-2 py-0.5"
                        style={{ 
                          borderColor: getSentimentColor(area.sentiment),
                          color: getSentimentColor(area.sentiment),
                          backgroundColor: `${getSentimentColor(area.sentiment)}10`
                        }}
                      >
                        {area.sentiment}
                      </Badge>
                      {displayDisasterType && (
                        <Badge
                          className="text-xs font-medium px-2 py-0.5"
                          style={{
                            backgroundColor: getDisasterTypeColor(displayDisasterType),
                            color: 'white'
                          }}
                        >
                          {displayDisasterType}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}