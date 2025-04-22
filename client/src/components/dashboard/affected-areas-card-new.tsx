import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { getSentimentBadgeClasses } from "@/lib/colors";
import { getDisasterTypeColor, createProgressGradient } from "@/lib/colors";
import { getSmallDisasterIcon } from "@/lib/disaster-icons";
import { 
  MapPin, 
  AlertTriangle, 
  TrendingUp
} from "lucide-react";
import { SentimentPost } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";

import "./ticker-style.css"; // CSS for continuous ticker animation

interface AffectedAreaProps {
  sentimentPosts: SentimentPost[];
  isLoading?: boolean;
}

interface AffectedArea {
  name: string;
  sentiment: string;
  sentiments: Record<string, number>; // Added to support multiple sentiment indicators with counts
  disasterType: string | null;
  disasterTypes: Record<string, number>; // Added to support multiple disaster type indicators with counts
  impactLevel: number;
}

export function AffectedAreasCard({ sentimentPosts, isLoading = false }: AffectedAreaProps) {
  const [affectedAreas, setAffectedAreas] = useState<AffectedArea[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Extract and count location mentions using Records instead of Maps
    const locationCount: Record<string, { 
      count: number,
      sentiment: Record<string, number>,
      disasterType: Record<string, number>
    }> = {};

    sentimentPosts.forEach(post => {
      if (!post.location) return;
      
      // Skip posts with "UNKNOWN" location
      if (post.location.toUpperCase() === "UNKNOWN") return;

      const location = post.location;

      if (!locationCount[location]) {
        locationCount[location] = {
          count: 0,
          sentiment: {},
          disasterType: {}
        };
      }

      const locationData = locationCount[location];
      locationData.count++;

      // Track sentiments
      const currentSentimentCount = locationData.sentiment[post.sentiment] || 0;
      locationData.sentiment[post.sentiment] = currentSentimentCount + 1;

      // Track disaster types
      if (post.disasterType) {
        const currentTypeCount = locationData.disasterType[post.disasterType] || 0;
        locationData.disasterType[post.disasterType] = currentTypeCount + 1;
      }
    });

    // Convert to array and sort by count
    const sortedAreas = Object.entries(locationCount)
      .map(([name, data]) => {
        // Get dominant sentiment
        let maxSentimentCount = 0;
        let dominantSentiment = "Neutral";

        Object.entries(data.sentiment).forEach(([sentiment, count]) => {
          if (count > maxSentimentCount) {
            maxSentimentCount = count;
            dominantSentiment = sentiment;
          }
        });

        // Get dominant disaster type
        let maxTypeCount = 0;
        let dominantType: string | null = null;

        Object.entries(data.disasterType).forEach(([type, count]) => {
          if (count > maxTypeCount) {
            maxTypeCount = count;
            dominantType = type;
          }
        });

        return {
          name,
          sentiment: dominantSentiment,
          sentiments: data.sentiment,
          disasterType: dominantType,
          disasterTypes: data.disasterType,
          impactLevel: data.count
        };
      })
      .sort((a, b) => b.impactLevel - a.impactLevel)
      .slice(0, 10); // Show top 10 affected areas

    setAffectedAreas(sortedAreas);
  }, [sentimentPosts]);

  // Handle mouse interaction with scroll position preservation
  const handleMouseEnter = () => {
    setIsHovered(true);
    
    // Get current animation position and store it as a CSS variable
    // This ensures we maintain the exact scroll position on hover
    if (containerRef.current) {
      const computedStyle = window.getComputedStyle(containerRef.current);
      const transform = computedStyle.getPropertyValue('transform');
      
      // Extract the current Y position from the transform matrix
      if (transform !== 'none') {
        const tickerContent = containerRef.current.querySelector('.ticker') as HTMLElement;
        if (tickerContent) {
          // Store the current transform position as a CSS variable
          const currentY = parseFloat(transform.split(',')[5]) || 0;
          tickerContent.style.setProperty('--scroll-position', `${currentY}px`);
        }
      }
      
      containerRef.current.style.overflowY = 'auto';
    }
  };
  
  const handleMouseLeave = () => {
    if (containerRef.current) {
      containerRef.current.style.overflowY = 'hidden';
    }
    setIsHovered(false);
  };

  return (
    <div 
      ref={containerRef}
      className="h-[450px] overflow-hidden will-change-scroll rounded-xl bg-white ticker-container"
      style={{ 
        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent 100%)',
        scrollBehavior: 'smooth',
        overscrollBehavior: 'contain', // Prevents scroll chaining
        touchAction: 'pan-y',          // Ensures mobile scrolling works
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        msOverflowStyle: 'none',      // Hide scrollbars in IE and Edge
        scrollbarWidth: 'none'        // Hide scrollbars in Firefox
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {affectedAreas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[420px] py-8">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <MapPin className="h-7 w-7 text-blue-400" />
          </div>
          <p className="text-center text-base text-slate-500 mb-2">No affected areas detected</p>
          <p className="text-center text-sm text-slate-400">Upload data to see disaster impact by location</p>
        </div>
      ) : (
        <div className={`ticker-wrap ${isHovered ? 'paused' : ''}`}>
          <div className="ticker">
            {/* Double the content to create seamless loop */}
            {[...affectedAreas, ...affectedAreas, ...affectedAreas].map((area, index) => (
              <motion.div
                key={`${area.name}-${index}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1,
                  transition: { 
                    delay: index * 0.02, // Reduced delay
                    duration: 0.2, // Faster animation
                    type: "tween", // Changed from spring for better performance
                  } 
                }}
                whileHover={{ 
                  scale: 1.01, // Smaller scale
                  boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.08)" // Lighter shadow
                }}
                className="ticker-item rounded-xl p-4 bg-white border border-gray-200 shadow-sm transition-all duration-300 mx-auto my-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div 
                      className="p-2 rounded-lg flex-shrink-0 transition-all duration-300"
                      style={{ 
                        backgroundColor: area.disasterType 
                          ? `${getDisasterTypeColor(area.disasterType)}20` // 20% opacity version of the color
                          : 'rgba(59, 130, 246, 0.1)' 
                      }}
                    >
                      {getSmallDisasterIcon(area.disasterType)}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-semibold text-gray-900 text-base">{area.name}</h3>
                        <div className="flex items-center ml-2 gap-0.5">
                          <TrendingUp className="h-3 w-3 text-amber-500" />
                          <span className="text-xs font-medium text-amber-600">
                            {area.impactLevel}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {/* Display ALL sentiment badges with their percentages */}
                        {Object.entries(area.sentiments)
                          .sort(([_, countA], [__, countB]) => countB - countA)
                          .map(([sentiment, count]) => {
                            const percentage = Math.round((count / area.impactLevel) * 100);
                            // Only show badges with at least 1% representation
                            if (percentage < 1) return null;
                            return (
                              <Badge 
                                key={`sentiment-${sentiment}`}
                                variant={sentiment.toLowerCase() === 'fear/anxiety' 
                                  ? 'fear' 
                                  : (sentiment.toLowerCase() as any)}
                                className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                              >
                                {sentiment} {percentage}%
                              </Badge>
                            );
                          })
                        }

                        {/* Display ALL disaster type badges with their percentages */}
                        {Object.entries(area.disasterTypes)
                          .sort(([_, countA], [__, countB]) => countB - countA)
                          .map(([disasterType, count]) => {
                            const percentage = Math.round((count / area.impactLevel) * 100);
                            // Only show badges with at least 1% representation
                            if (percentage < 1) return null;
                            return (
                              <Badge
                                key={`disaster-${disasterType}`}
                                variant="outline"
                                className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: getDisasterTypeColor(disasterType),
                                  color: 'white',
                                  borderColor: getDisasterTypeColor(disasterType)
                                }}
                              >
                                {disasterType} {percentage}%
                              </Badge>
                            );
                          })
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    {/* Create a gradient progress bar using the colors from multiple tags */}
                    <motion.div 
                      initial={{ width: 0, opacity: 0.5 }}
                      animate={{ 
                        width: `${Math.min(100, (area.impactLevel / 10) * 100)}%`,
                        opacity: 1
                      }}
                      transition={{ 
                        duration: 0.4, // Faster animation
                        delay: 0.1 + (index * 0.02), // Reduced delay
                        ease: "easeOut"
                      }}
                      className="h-full rounded-full relative"
                      style={{ 
                        background: createProgressGradient(area.sentiments, area.disasterTypes)
                      }}
                    >
                      {/* Static gradient overlay for shine effect */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}