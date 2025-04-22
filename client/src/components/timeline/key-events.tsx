import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isAfter, compareDesc } from 'date-fns';
import { getSentimentColor, getDisasterTypeColor } from '@/lib/colors';
import { getDisasterIcon } from '@/lib/disaster-icons';
import { AlertTriangle, MapPin, Skull, Users, LifeBuoy } from 'lucide-react';

interface TimelineEvent {
  id: number;
  name: string;
  description: string | null;
  timestamp: string;
  location: string | null;
  type: string;
  sentimentImpact: string | null;
}

interface KeyEventsProps {
  events: TimelineEvent[];
  title?: string;
  description?: string;
  sentimentPosts?: any[]; // Optional sentiment posts to generate statistical insights
}

export function KeyEvents({ 
  events, 
  title = 'Key Events',
  description = 'Disaster event timeline',
  sentimentPosts = []
}: KeyEventsProps) {
  // Get proper color styling for sentiment badges
  const getSentimentBadgeClass = (sentiment: string | null) => {
    if (!sentiment) return 'bg-gray-200 text-gray-800';
    
    // Handle "Mixed sentiment patterns" and other variations
    if (sentiment.includes('Mixed')) {
      return 'bg-indigo-500 text-white';
    }
    
    if (sentiment.includes('Panic')) {
      return 'bg-red-500 text-white';
    }
    
    if (sentiment.includes('Fear') || sentiment.includes('Anxiety')) {
      return 'bg-orange-500 text-white';
    }
    
    if (sentiment.includes('Disbelief')) {
      return 'bg-purple-500 text-white';
    }
    
    if (sentiment.includes('Resilience')) {
      return 'bg-green-500 text-white';
    }
    
    if (sentiment.includes('Neutral')) {
      return 'bg-gray-500 text-white';
    }
    
    // Default case
    return 'bg-blue-500 text-white';
  };
  
  // Use shared disaster icon component with proper sizing
  const getEventIcon = (type: string) => {
    return getDisasterIcon(type, { className: "h-5 w-5" });
  };
  
  // Get icon for sentiment impact
  const getSentimentIcon = (sentiment: string | null) => {
    if (!sentiment) return <AlertTriangle size={16} />;
    
    if (sentiment.includes('Panic')) {
      return <Skull size={16} />;
    }
    
    if (sentiment.includes('Fear') || sentiment.includes('Anxiety')) {
      return <AlertTriangle size={16} />;
    }
    
    if (sentiment.includes('Resilience')) {
      return <LifeBuoy size={16} />; // Changed to LifeBuoy for better differentiation from earthquake icon
    }
    
    return <AlertTriangle size={16} />; // Default icon
  };
  
  // Filter events to only remove future dates - keep UNKNOWN data as it's still valid
  const filteredEvents = events.filter(event => {
    const eventDate = parseISO(event.timestamp);
    const currentDate = new Date();
    
    // Only filter out future dates beyond current date
    const isFutureDate = isAfter(eventDate, currentDate);
    
    // Show all events except future dates
    return !isFutureDate;
  });
  
  // Sort by most recent first
  const sortedEvents = [...filteredEvents].sort((a, b) => 
    compareDesc(parseISO(a.timestamp), parseISO(b.timestamp))
  );
  
  return (
    <Card className="border-none mb-2 sm:mb-4 overflow-hidden shadow-lg rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/40">
      <CardHeader className="bg-gradient-to-r from-violet-600/90 via-indigo-600/90 to-blue-600/90 border-b border-indigo-700/50 py-2.5 px-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
          <AlertTriangle className="h-5 w-5 text-indigo-200" />
          {title}
        </CardTitle>
        <CardDescription className="text-indigo-100 opacity-90">
          {sortedEvents.length > 0 
            ? `Showing ${sortedEvents.length} significant disaster events`
            : 'No verified disaster events available'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        {sortedEvents.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-slate-500 mb-1">No disaster events available</p>
            <p className="text-sm text-slate-400">Upload data to see disaster events</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedEvents.map((event) => {
              const disasterColor = getDisasterTypeColor(event.type);
              
              return (
                <div key={event.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Event icon - larger size for better visibility */}
                    <div 
                      className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: disasterColor }}
                    >
                      {getEventIcon(event.type)}
                    </div>
                    
                    {/* Event details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-1">
                        <h3 className="text-base font-semibold text-slate-800 pr-4">
                          {event.name}
                        </h3>
                        <time className="text-xs font-medium text-slate-500 whitespace-nowrap">
                          {format(parseISO(event.timestamp), 'MMM d, yyyy')}
                        </time>
                      </div>
                      
                      {event.location && event.location !== 'UNKNOWN' && (
                        <div className="flex items-center mb-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 mr-1.5" />
                          <p className="text-sm text-slate-700 font-medium">{event.location}</p>
                        </div>
                      )}
                      
                      {/* Improved styling for better readability */}
                      {event.description && (
                        <div className="mb-3 mt-2 bg-slate-50 p-3 rounded-md border border-slate-100">
                          <p className="text-sm text-slate-600">{event.description}</p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {/* Sentiment Badge - improved with icon */}
                        {event.sentimentImpact && (
                          <Badge className={`${getSentimentBadgeClass(event.sentimentImpact)} flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium`}>
                            {getSentimentIcon(event.sentimentImpact)}
                            {event.sentimentImpact}
                          </Badge>
                        )}
                        
                        {/* Disaster Type Badge */}
                        <Badge
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: disasterColor,
                            color: 'white'
                          }}
                        >
                          {getEventIcon(event.type)}
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
