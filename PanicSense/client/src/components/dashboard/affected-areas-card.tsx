import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { getSentimentBadgeClasses } from "@/lib/colors";
import { getDisasterTypeColor } from "@/lib/colors";
import { 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  MapPinned, 
  Flame, 
  Droplets, 
  Wind, 
  Mountain 
} from "lucide-react";
import { SentimentPost } from "@/lib/api";
import { useDeviceCapability } from "@/hooks/use-device-capability";

interface AffectedAreaProps {
  sentimentPosts: SentimentPost[];
  isLoading?: boolean;
}

interface AffectedArea {
  name: string;
  sentiment: string;
  sentiments?: Record<string, number>;
  disasterType: string | null;
  disasterTypes?: Record<string, number>;
  impactLevel: number;
}

// Get disaster type icon based on type
function getDisasterIcon(type: string | null) {
  if (!type) return <MapPin className="h-8 w-8 text-gray-500" />;
  
  switch (type.toLowerCase()) {
    case 'flood':
      return <Droplets className="h-8 w-8" style={{ color: getDisasterTypeColor(type) }} />;
    case 'fire':
      return <Flame className="h-8 w-8" style={{ color: getDisasterTypeColor(type) }} />;
    case 'typhoon':
      return <Wind className="h-8 w-8" style={{ color: getDisasterTypeColor(type) }} />;
    case 'earthquake':
      return <MapPinned className="h-8 w-8" style={{ color: getDisasterTypeColor(type) }} />;
    case 'volcanic eruption':
    case 'volcano':
      return <Mountain className="h-8 w-8" style={{ color: getDisasterTypeColor(type) }} />;
    case 'landslide':
      return <Mountain className="h-8 w-8" style={{ color: getDisasterTypeColor(type) }} />;
    default:
      return <MapPin className="h-8 w-8" style={{ color: getDisasterTypeColor(type) }} />;
  }
}

export function AffectedAreasCard({ sentimentPosts, isLoading = false }: AffectedAreaProps) {
  const [affectedAreas, setAffectedAreas] = useState<AffectedArea[]>([]);
  const [isSlotRolling, setIsSlotRolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile, isCapableDevice } = useDeviceCapability();

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

  // OPTIMIZED CONTINUOUS SCROLLING ANIMATION - NEVER STOPS
  useEffect(() => {
    if (affectedAreas.length === 0 || !containerRef.current) return;
    
    const container = containerRef.current;
    let animationFrameId: number;
    let scrollPosition = 0;
    let isPaused = false;
    let userScrolling = false;
    let lastTimestamp = 0;
    let lastScrollTop = 0;
    
    // Use a moderate scroll speed that works well on all devices
    // Fast enough to be engaging but slow enough to not strain low-end devices
    const SCROLL_SPEED = 40; // Middle ground: 40px/s works well on most devices
    
    // Minimal delay for rendering
    setTimeout(() => {
      if (container) {
        scrollPosition = 0;
        container.scrollTop = scrollPosition;
      }
    }, 50);
    
    // Infinite upward scrolling that NEVER STOPS - no pauses, no delays
    const animateScroll = (timestamp: number) => {
      // Initialize timestamp on first run
      if (!lastTimestamp) lastTimestamp = timestamp;
      
      // Calculate time difference for consistent scrolling speed
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      // Only scroll if not paused by user interaction
      if (container && !isPaused) {
        // Get the measurements we need
        const scrollHeight = container.scrollHeight / 2; // Because we have 2 copies of content now
        
        // THIS IS KEY: Always REDUCE scrollTop (scrolling upward)
        // We start from a high value and constantly decrease it for upward scrolling
        scrollPosition -= (SCROLL_SPEED * delta) / 1000;
        
            // This simulates a rolling receipt type display
        // When we reach certain point, we WRAP AROUND instead of resetting
        // So our scroll position is never reset to 0, it's always a continuous flow
        if (scrollPosition <= -scrollHeight) {
          // Wrap to the other end of our "receipt roll"
          // Instead of jumping to 0 (which would create a visual reset)
          // We use modulo to maintain the EXACT same position in the loop
          scrollPosition = scrollPosition % -scrollHeight;
        }
        
        // Force scroll position using transform for smoother performance
        // This is the key trick - we're using transform instead of scrollTop
        const contentElement = container.firstElementChild as HTMLElement;
        if (contentElement) {
          contentElement.style.transform = `translateY(${scrollPosition}px)`;
        }
      }
      
      // ALWAYS continue animation frame - never interrupt the loop
      animationFrameId = requestAnimationFrame(animateScroll);
    };
    
    // Start animation immediately - no delay
    animationFrameId = requestAnimationFrame(animateScroll);
    
    // Add user interaction handlers - scroll should PAUSE when user hovers
    const handleMouseEnter = () => {
      isPaused = true;
      container.style.overflowY = 'auto'; // Enable scrolling when hovering
      container.style.cursor = 'pointer';
      
      // We need to undo the transform and setup real scrollTop position
      const contentElement = container.firstElementChild as HTMLElement;
      if (contentElement) {
        // Remove transform to use native scrolling
        contentElement.style.transform = '';
        // Set the equivalent scroll position
        container.scrollTop = -scrollPosition;
      }
    };
    
    const handleMouseLeave = () => {
      // On mouse leave, get current scroll position before resuming animation
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight / 2;
      
      // Same CRITICAL FIX for mouse: Make sure we never stop at the edge
      // If we're near the end of our data, jump to the start
      if (scrollTop >= (scrollHeight * 1.5)) {
        container.scrollTop = 10; // Jump to start with small offset
        scrollPosition = -10;
      } else if (scrollTop <= 10) {
        container.scrollTop = scrollHeight - 10; // Jump to end with small offset
        scrollPosition = -(scrollHeight - 10);
      } else {
        // Normal case - update position to match current scroll
        scrollPosition = -scrollTop;
      }
      
      isPaused = false;
      lastTimestamp = 0; // Reset timestamp for smooth animation restart
      container.style.overflowY = 'hidden'; // Disable scrolling when not hovering
    };
    
    const handleTouchStart = () => {
      isPaused = true;
      container.style.overflowY = 'auto'; // Enable scrolling on touch
      
      // Same as mouse enter - undo the transform and setup real scrollTop position
      const contentElement = container.firstElementChild as HTMLElement;
      if (contentElement) {
        // Remove transform to use native scrolling
        contentElement.style.transform = '';
        // Set the equivalent scroll position
        container.scrollTop = -scrollPosition;
      }
    };
    
    const handleTouchEnd = () => {
      setTimeout(() => {
        // Get current scroll position before resuming animation
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight / 2;
        
        // CRITICAL FIX: Make sure we never stop at the edge
        // Use same simpler logic as mouse handler
        if (scrollTop >= (scrollHeight * 1.5)) {
          container.scrollTop = 10; // Jump to start with small offset
          scrollPosition = -10;
        } else if (scrollTop <= 10) {
          container.scrollTop = scrollHeight - 10; // Jump to end with small offset
          scrollPosition = -(scrollHeight - 10);
        } else {
          // Normal case - update position to match current scroll
          scrollPosition = -scrollTop;
        }
        
        isPaused = false;
        lastTimestamp = 0; // Reset timestamp for smooth animation restart
        container.style.overflowY = 'hidden'; // Disable scrolling when not hovering
      }, 400); // Much faster response time for mobile devices
    };
    
    // Add event listeners
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    
    // Initial style setup
    container.style.overflowY = 'hidden'; // Start with overflow hidden
    container.style.cursor = 'default';
    container.style.touchAction = 'pan-y';
    
    // Clean up event handlers and animation on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [affectedAreas]);

  // This is for infinite scroll effect when user scrolls manually (important!)
  const handleScroll = (e: any) => {
    const container = e.target as HTMLElement;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight / 2;
    
    // Ultra-simplified approach for maximum mobile performance
    // Just jump between start and end to maintain the continuous flow
    if (scrollTop >= scrollHeight * 0.9) { // Getting near the end
      // User scrolled toward bottom - jump back to start
      container.scrollTop = 5; // Small offset for stability
    } else if (scrollTop <= 5) { // At the very top
      // User scrolled to top - jump to near end
      container.scrollTop = scrollHeight * 0.9; // Jump to near end
    }
  };

  return (
    <div className="relative">
      {/* Scrolling indicator showing infinite scroll animation*/}
      <div className="absolute right-3 top-2 z-10 flex flex-col items-center opacity-70">
        <div className="flex flex-col items-center">
          <div className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-500/20 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 animate-bounce">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
          <div className="pb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 animate-pulse">
              <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="h-[450px] overflow-hidden scrollbar-hide will-change-scroll rounded-xl bg-gray-50"
        style={{ 
          maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent 100%)',
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain', // Prevents scroll chaining
          touchAction: 'pan-y',          // Ensures mobile scrolling works
          WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
        }}
        onScroll={handleScroll} // Add the infinite scroll handler
      >
        <AnimatePresence>
          <div className="flex flex-col items-center gap-0 p-4 relative">
            {/* Vertical connecting dotted line for receipt effect */}
            <div className="absolute top-0 bottom-0 w-0.5 border-l border-dashed border-blue-200 z-0" style={{ left: 'calc(50% - 1px)', height: '100%' }}></div>
          {affectedAreas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[420px] py-8">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <MapPin className="h-7 w-7 text-blue-400" />
              </div>
              <p className="text-center text-base text-slate-500 mb-2">No affected areas detected</p>
              <p className="text-center text-sm text-slate-400">Upload data to see disaster impact by location</p>
            </div>
          ) : (
            // Always use exactly 2x repetition to ensure content is visible
            // but not too resource-intensive on any device
            [...affectedAreas, ...affectedAreas].map((area, index) => (
              <motion.div
                key={`${area.name}-${index}`}
                // Lightweight animations that work on all devices
                initial={{ opacity: 0.8, scale: 0.99 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: { 
                    // Use simple, less resource-intensive animations
                    delay: Math.min(index * 0.02, 0.2),
                    duration: 0.2,
                    type: "tween" // Simple tween animation works on all devices
                  } 
                }}
                // Simple hover effect that works on all devices
                whileHover={{ 
                  scale: 1.01, // Very subtle scale
                  boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.1)",
                  transition: { duration: 0.2 }
                }}
                className={`rounded-full p-3 bg-white border border-gray-200 shadow-sm transition-all duration-300 flex flex-col items-center text-center relative z-10 ${index === 0 ? 'mt-[30px]' : 'mt-[-40px]'}`}
              >
                <div className="w-24 h-24 flex flex-col items-center justify-center relative">
                  {/* Connection point to the vertical line */}
                  <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-200 z-20"></div>
                  {/* Circular background with icon */}
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                    style={{ 
                      backgroundColor: area.disasterType 
                        ? `${getDisasterTypeColor(area.disasterType)}20` 
                        : 'rgba(59, 130, 246, 0.1)' 
                    }}
                  >
                    <div className="text-2xl">
                      {getDisasterIcon(area.disasterType)}
                    </div>
                  </div>
                  
                  {/* Location name */}
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{area.name}</h3>
                  
                  {/* Multiple Sentiment badges with percentages */}
                  <div className="flex flex-wrap gap-1 justify-center mb-1">
                    {area.sentiments && Object.entries(area.sentiments)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 2)
                      .map(([sentiment, count]) => {
                        const total = Object.values(area.sentiments!).reduce((sum, c) => sum + c, 0);
                        const percentage = Math.round((count / total) * 100);
                        return (
                          <Badge 
                            key={sentiment}
                            variant={sentiment.toLowerCase() === 'fear/anxiety' 
                              ? 'fear' 
                              : (sentiment.toLowerCase() as any)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          >
                            {sentiment} ({percentage}%)
                          </Badge>
                        );
                      })}
                  </div>
                  
                  {/* Disaster type badges with percentages */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {area.disasterTypes && Object.entries(area.disasterTypes)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 2)
                      .map(([type, count]) => {
                        const total = Object.values(area.disasterTypes!).reduce((sum, c) => sum + c, 0);
                        const percentage = Math.round((count / total) * 100);
                        return (
                          <span 
                            key={type}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                            style={{ backgroundColor: getDisasterTypeColor(type) }}
                          >
                            {type} ({percentage}%)
                          </span>
                        );
                      })}
                  </div>
                  
                  {/* Impact level indicator */}
                  <div className="absolute -top-1 -right-1 flex items-center bg-amber-500 text-white rounded-full px-1.5 py-0.5">
                    <span className="text-[10px] font-bold">
                      {area.impactLevel}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </AnimatePresence>
    </div>
    </div>
  );
}