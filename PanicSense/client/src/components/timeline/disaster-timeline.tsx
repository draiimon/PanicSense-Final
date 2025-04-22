import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, TrendingUp, Calendar, MapPin } from "lucide-react";
import { useDisasterContext } from "@/context/disaster-context";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  type: 'disaster' | 'sentiment';
  timestamp: string;
  location?: string;
  urgency: 'high' | 'medium' | 'low';
}

const TimelineItem = ({ event }: { event: TimelineEvent }) => {
  const Icon = event.type === 'disaster' ? AlertTriangle : TrendingUp;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        flex items-start gap-4 p-4 rounded-lg border
        ${event.urgency === 'high' ? 'bg-red-50 border-red-200' :
          event.urgency === 'medium' ? 'bg-yellow-50 border-yellow-200' :
          'bg-blue-50 border-blue-200'}
      `}
    >
      <div className={`
        p-2 rounded-full
        ${event.urgency === 'high' ? 'bg-red-100 text-red-600' :
          event.urgency === 'medium' ? 'bg-yellow-100 text-yellow-600' :
          'bg-blue-100 text-blue-600'}
      `}>
        <Icon className="h-5 w-5" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-start justify-between mb-1">
          <h3 className={`
            font-semibold
            ${event.urgency === 'high' ? 'text-red-700' :
              event.urgency === 'medium' ? 'text-yellow-700' :
              'text-blue-700'}
          `}>
            {event.title}
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(event.timestamp).toLocaleDateString()}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-2">
          {event.description}
        </p>
        
        {event.location && (
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            {event.location}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export function DisasterTimeline() {
  const { disasterEvents, sentimentPosts } = useDisasterContext();
  
  // Process disaster events
  const processedEvents: TimelineEvent[] = disasterEvents.map(event => ({
    id: `disaster-${event.id}`,
    title: event.name,
    description: event.description || '',
    type: 'disaster',
    timestamp: event.timestamp,
    location: event.location || undefined,
    urgency: event.type.toLowerCase().includes('earthquake') || 
             event.type.toLowerCase().includes('flood') ? 'high' : 'medium'
  }));

  // Process major sentiment shifts
  const sentimentShifts = sentimentPosts.reduce((shifts: TimelineEvent[], post) => {
    // Check for critical sentiment patterns
    if (post.sentiment === 'Panic' || post.sentiment === 'Fear/Anxiety') {
      shifts.push({
        id: `sentiment-${post.id}`,
        title: `Significant ${post.sentiment} Detected`,
        description: `${post.text} (Confidence: ${Math.round(post.confidence * 100)}%)`,
        type: 'sentiment',
        timestamp: post.timestamp,
        location: post.location || undefined,
        urgency: post.sentiment === 'Panic' ? 'high' : 'medium'
      });
    }
    return shifts;
  }, []);

  // Combine and sort all events by timestamp (most recent first)
  const allEvents = [...processedEvents, ...sentimentShifts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Key Disaster Events
        </h2>
        <div className="flex gap-4">
          <span className="flex items-center text-sm text-red-600">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
            Critical
          </span>
          <span className="flex items-center text-sm text-yellow-600">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
            Warning
          </span>
          <span className="flex items-center text-sm text-blue-600">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
            Info
          </span>
        </div>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          <AnimatePresence>
            {allEvents.map(event => (
              <TimelineItem key={event.id} event={event} />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
