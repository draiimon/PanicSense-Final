import { useMemo, useState } from "react";
import { useDisasterContext } from "@/context/disaster-context";
import { SentimentTimeline } from "@/components/timeline/sentiment-timeline";
import { KeyEvents } from "@/components/timeline/key-events";
import { format, isSameDay, parseISO, isAfter } from "date-fns";
import { motion } from "framer-motion";
import { 
  CalendarClock, 
  BarChart3, 
  ChevronDown, 
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Timeline() {
  const { disasterEvents, sentimentPosts, refreshData } = useDisasterContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Process sentiment posts to create timeline data
  const processTimelineData = () => {
    // Skip processing if no posts
    if (!sentimentPosts || sentimentPosts.length === 0) {
      return {
        labels: [],
        datasets: [],
        rawDates: []
      };
    }
    
    // Get current date to filter out future dates
    const currentDate = new Date();
    
    // First, sort posts chronologically and filter out future dates
    const sortedPosts = [...sentimentPosts]
      .filter(post => {
        // Skip invalid timestamps
        if (!post || !post.timestamp || typeof post.timestamp !== 'string') {
          return false;
        }
        
        const postDate = parseISO(post.timestamp);
        return !isAfter(postDate, currentDate);
      })
      .sort((a, b) => {
        // Extra safety checks
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
    
    // Extract all raw dates
    const rawDates = sortedPosts.map(post => post.timestamp);
    
    // Track unique dates to display as labels
    const uniqueDates = new Map<string, Date>();
    
    // Group sentiment posts by date and include disaster events
    [...sortedPosts, ...disasterEvents].forEach(item => {
      // Skip items with invalid timestamps
      if (!item || !item.timestamp || typeof item.timestamp !== 'string') return;
      
      try {
        const itemDate = parseISO(item.timestamp);
        // Skip future dates
        if (isAfter(itemDate, currentDate)) return;
        
        const displayDate = format(itemDate, "MMM dd, yyyy");
        uniqueDates.set(displayDate, itemDate);
      } catch (err) {
        // Skip items with invalid date formats
        return;
      }
    });
    
    // Convert to sorted array of labels
    const dates = Array.from(uniqueDates.entries())
      .sort(([_, dateA], [__, dateB]) => dateA.getTime() - dateB.getTime())
      .map(([label]) => label);

    // Initialize datasets for each sentiment
    const sentiments = ["Panic", "Fear/Anxiety", "Disbelief", "Resilience", "Neutral"];
    
    // Track sentiment counts per date for percentage calculation
    const sentimentCounts: Record<string, Record<string, number>> = {};

    // Initialize counts
    dates.forEach(date => {
      sentimentCounts[date] = {};
      sentiments.forEach(sentiment => {
        sentimentCounts[date][sentiment] = 0;
      });
    });

    // Count sentiments for each date
    sortedPosts.forEach(post => {
      try {
        // Skip posts with invalid timestamps or sentiment
        if (!post || !post.timestamp || typeof post.timestamp !== 'string') return;
        
        const postDate = format(parseISO(post.timestamp), "MMM dd, yyyy");
        
        // Check if we have this date initialized in our counts and post has valid sentiment
        if (sentimentCounts[postDate] && post.sentiment) {
          // Safety check - ensure sentiment exists in our counts object
          if (sentimentCounts[postDate][post.sentiment] !== undefined) {
            sentimentCounts[postDate][post.sentiment] += 1;
          } else {
            // If this is a different sentiment not in our predefined list, skip it
            return;
          }
        }
      } catch (err) {
        // Skip posts with invalid date formats
        return;
      }
    });

    // Convert counts to percentages and create datasets
    const datasets = sentiments.map(sentiment => {
      const data = dates.map(date => {
        const total = Object.values(sentimentCounts[date]).reduce(
          (sum: number, count: number) => sum + count, 
          0
        );
        return total > 0 ? (sentimentCounts[date][sentiment] / total) * 100 : 0;
      });

      return {
        label: sentiment,
        data
      };
    });

    return {
      labels: dates,
      datasets,
      rawDates
    };
  };

  // Calculate timeline data with memoization to avoid recalculation
  const timelineData = useMemo(() => processTimelineData(), [sentimentPosts, disasterEvents]);

  // Handle refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  return (
    <div className="relative space-y-8 pb-10">
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
      
        {/* More colorful floating elements - CSS Animations match dashboard */}
        <div
          className="absolute h-72 w-72 rounded-full bg-purple-500/25 filter blur-3xl animate-float-1 will-change-transform"
          style={{ top: "15%", left: "8%" }}
        />

        <div
          className="absolute h-64 w-64 rounded-full bg-teal-500/20 filter blur-3xl animate-float-2 will-change-transform"
          style={{ bottom: "15%", right: "15%" }}
        />

        <div
          className="absolute h-52 w-52 rounded-full bg-purple-500/25 filter blur-3xl animate-float-3 will-change-transform"
          style={{ top: "45%", right: "20%" }}
        />

        {/* Additional floating elements for more color - CSS Animations */}
        <div
          className="absolute h-48 w-48 rounded-full bg-pink-500/20 filter blur-3xl animate-float-4 will-change-transform"
          style={{ top: "65%", left: "25%" }}
        />

        <div
          className="absolute h-40 w-40 rounded-full bg-yellow-400/15 filter blur-3xl animate-float-5 will-change-transform"
          style={{ top: "30%", left: "40%" }}
        />
      </div>
    
      {/* Title Card - Consistent with Geographic Analysis and Comparison Page */}
      <Card className="border-none mb-4 overflow-hidden shadow-lg rounded-2xl bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90">
        <CardHeader className="p-2 sm:p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                <CalendarClock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold text-white">
                  Sentiment Timeline
                </CardTitle>
                <p className="text-xs sm:text-sm text-indigo-100 mt-0.5 sm:mt-1">
                  Chronological tracking of sentiment patterns across {timelineData.labels.length} dates
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white/20 hover:bg-white/30 text-white border-white/40"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline Chart in improved card - matching Geographic Analysis and Comparison styling */}
      <Card className="border-none mb-2 sm:mb-4 overflow-hidden shadow-lg rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/40">
        <CardHeader className="bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 border-b border-indigo-700/50 py-2.5">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-200" />
                Sentiment Evolution
              </CardTitle>
              <CardDescription className="text-indigo-100 opacity-90">
                {timelineData.labels.length > 0 
                  ? `Tracking sentiment changes across ${timelineData.labels.length} dates` 
                  : "No timeline data available"}
              </CardDescription>
            </div>
            {/* No action buttons needed here */}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <SentimentTimeline 
            data={timelineData}
            title="Sentiment Evolution"
            rawDates={timelineData.rawDates}
          />
        </CardContent>
      </Card>

      {/* Key Events - component already updated */}
      <KeyEvents 
        events={disasterEvents}
        title="Disaster Events"
        description="Chronological view of disaster events"
      />
    </div>
  );
}