import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Newspaper, MapPin, Calendar, Loader2, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import "./carousel-style.css";

interface DisasterAnalysis {
  is_disaster_related: boolean;
  disaster_type: string;
  location: string;
  severity: number;
  confidence: number;
  explanation: string;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  timestamp: string;
  url: string;
  imageUrl?: string;
  disasterType?: string;
  location?: string;
  analysis?: DisasterAnalysis; // Add support for AI analysis
}

// Function to get disaster type color
const getDisasterTypeColor = (type: string | undefined) => {
  if (!type) return "bg-blue-500/10 text-blue-500";
  
  const disasterType = type.toLowerCase();
  
  if (disasterType.includes("typhoon") || disasterType.includes("bagyo")) 
    return "bg-blue-500/10 text-blue-500";
  
  if (disasterType.includes("flood") || disasterType.includes("baha")) 
    return "bg-cyan-500/10 text-cyan-500";
  
  if (disasterType.includes("earthquake") || disasterType.includes("lindol")) 
    return "bg-orange-500/10 text-orange-500";
  
  if (disasterType.includes("fire") || disasterType.includes("sunog")) 
    return "bg-red-500/10 text-red-500";
  
  if (disasterType.includes("volcano") || disasterType.includes("bulkan")) 
    return "bg-amber-500/10 text-amber-500";
  
  if (disasterType.includes("landslide") || disasterType.includes("guho")) 
    return "bg-yellow-500/10 text-yellow-500";
  
  if (disasterType.includes("drought") || disasterType.includes("tagtuyot")) 
    return "bg-amber-800/10 text-amber-800";
  
  if (disasterType.includes("extreme heat") || disasterType.includes("init")) 
    return "bg-red-600/10 text-red-600";
    
  return "bg-indigo-500/10 text-indigo-500";
};

// Function to format date
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Filter for disaster-related news
const isDisasterRelated = (item: NewsItem): boolean => {
  // First check if we have AI analysis
  if (item.analysis?.is_disaster_related) {
    // If AI is confident (> 0.6) about disaster relation, trust it
    if (item.analysis.confidence > 0.6) {
      return item.analysis.is_disaster_related;
    }
  }
  
  // Fallback to keyword matching if no AI analysis or low confidence
  if (!item.title && !item.content) return false;
  
  // Combine title and content for stronger context analysis
  const combinedText = `${item.title} ${item.content}`.toLowerCase();
  
  // Primary disaster keywords - expanded for better coverage
  const primaryDisasterKeywords = [
    // Weather and Storms
    'storm', 'bagyo', 'typhoon', 'cyclone', 'hurricane', 'signal', 'warning',
    
    // Floods
    'flood', 'baha', 'flash flood', 'overflow', 'rising water',
    
    // Earthquakes
    'earthquake', 'lindol', 'magnitude', 'quake', 'tremor', 'shaking',
    
    // Tsunamis
    'tsunami', 'tidal wave', 'sea level',
    
    // Volcanic Activity
    'volcanic', 'volcano', 'eruption', 'bulkan', 'ashfall', 'lava', 'phivolcs',
    
    // Landslides
    'landslide', 'mudslide', 'rockfall', 'erosion', 'guho',
    
    // Fires
    'fire', 'sunog', 'blaze', 'burning', 'flame',
    
    // Emergencies and Warnings
    'evacuation', 'evacuate', 'emergency', 'disaster', 'alert', 'warning',
    'rescue', 'pagasa', 'ndrrmc', 'calamity', 'casualty', 'damage',
    
    // Weather Conditions
    'severe weather', 'extreme weather', 'heavy rain', 'strong wind',
    'weather disturbance', 'monsoon', 'habagat'
  ];

  // Check for primary disaster keywords
  return primaryDisasterKeywords.some(keyword => combinedText.includes(keyword));
};

export function DisasterNewsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // First fetch keyword-filtered news (faster)
  const { data: regularNewsData = [], isLoading: isLoadingRegular } = useQuery({
    queryKey: ['/api/real-news/posts'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Then fetch AI-analyzed news data (slower but more accurate)
  const { data: aiNewsData = [], isLoading: isLoadingAI } = useQuery({
    queryKey: ['/api/ai-disaster-news'],
    refetchInterval: 120000, // Refetch every 2 minutes to avoid rate limits
  });
  
  // Load state - consider keywords loading as quicker route
  const isLoading = isLoadingRegular;
  
  // Combine news from both sources (regular first, then AI if needed)
  let allNews: NewsItem[] = [];
  
  // First add all the AI-analyzed news
  if (Array.isArray(aiNewsData)) {
    allNews = [...aiNewsData];
  }
  
  // Then add any missing regular news items not already in the AI list
  if (Array.isArray(regularNewsData)) {
    // Filter to avoid duplicates
    const aiIds = new Set(allNews.map(item => item.id));
    const uniqueRegularNews = regularNewsData.filter(item => !aiIds.has(item.id));
    allNews = [...allNews, ...uniqueRegularNews];
  }
  
  // First try to get disaster-related news
  let disasterNews = allNews.filter(isDisasterRelated);
  
  // If we have fewer than 3 disaster news, add more regular news to reach at least 3
  if (disasterNews.length < 3) {
    // Try getting disaster news directly from the regular endpoint
    // This is a fallback if the AI filtering didn't work well
    const regularDisasterNews = Array.isArray(regularNewsData) 
      ? regularNewsData.filter(isDisasterRelated)
      : [];
    
    const regularIds = new Set(disasterNews.map(item => item.id));
    const uniqueRegularDisasterNews = regularDisasterNews.filter(item => !regularIds.has(item.id));
    
    disasterNews = [...disasterNews, ...uniqueRegularDisasterNews];
  }
  
  // In the worst case, get any news (even non-disaster) to avoid showing "No Active Disaster Alerts"
  if (disasterNews.length === 0 && allNews.length > 0) {
    disasterNews = allNews;
  }
  
  // Limit to 5 items
  disasterNews = disasterNews.slice(0, 5);
  
  // Auto-rotation with pause on hover
  useEffect(() => {
    if (disasterNews.length <= 1 || isPaused) return;
    
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % disasterNews.length);
    }, 5000); // Change every 5 seconds
    
    return () => clearInterval(timer);
  }, [disasterNews.length, isPaused]);
  
  // Extended loading state that doesn't disappear quickly
  const [showingLoadingPlaceholder, setShowingLoadingPlaceholder] = useState(true);
  
  // Keep the loading state for at least 1.5 seconds to prevent flickering
  useEffect(() => {
    if (!isLoading && showingLoadingPlaceholder) {
      const timer = setTimeout(() => {
        setShowingLoadingPlaceholder(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, showingLoadingPlaceholder]);
  
  // Show detailed loading state
  if (isLoading || showingLoadingPlaceholder) {
    return (
      <div className="bg-blue-900 p-6 h-[280px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-white/10 backdrop-blur-md">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-1.5">
                Latest Disaster Updates
                <motion.div
                  className="inline-block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <div className="flex h-5 items-center justify-center rounded-full bg-red-500/20 px-1.5">
                    <span className="text-[9px] font-semibold text-red-400">
                      LIVE
                    </span>
                  </div>
                </motion.div>
              </h2>
              <p className="text-xs text-blue-100/70">
                Real-time monitoring from national news sources
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center items-center h-[200px]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <Loader2 className="w-16 h-16 text-blue-200/40 absolute animate-spin" />
              <Loader2 className="w-16 h-16 text-blue-100 absolute animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Fetching Disaster Alerts</h3>
            <p className="text-sm text-blue-100/70">Checking news sources across the Philippines...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // If really no news after loading
  if (disasterNews.length === 0) {
    return (
      <div className="bg-blue-900 p-6 h-[280px]">
        <div className="text-center text-white">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="text-xl font-bold mb-2">No Active Disaster Alerts</h3>
          <p>Currently, there are no active disaster alerts in our system.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="relative overflow-hidden rounded-xl shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background color - dark blue as requested */}
      <div className="absolute inset-0 bg-blue-900"></div>
      
      {/* Pattern overlay for texture */}
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC41Ij48cGF0aCBkPSJNMzYgMzR2Nmg2di02aC02em02IDZ2Nmg2di02aC02em0tMTIgMGg2djZoLTZ2LTZ6bTEyIDBoNnY2aC02di02eiIvPjwvZz48L2c+PC9zdmc+')]"></div>
      
      {/* Floating elements for visual interest */}
      <div className="absolute inset-0">
        <div 
          className="absolute h-32 w-32 rounded-full bg-teal-500/15 filter blur-2xl animate-float-1" 
          style={{ top: "20%", left: "10%" }}
        ></div>
        <div 
          className="absolute h-40 w-40 rounded-full bg-purple-500/15 filter blur-2xl animate-float-2" 
          style={{ bottom: "10%", right: "15%" }}
        ></div>
      </div>
      
      {/* Content container */}
      <div className="relative p-6 z-10">
        {/* Header with title and view all button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-white/10 backdrop-blur-md">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-1.5">
                Latest Disaster Updates
                <motion.div
                  className="inline-block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <div className="flex h-5 items-center justify-center rounded-full bg-red-500/20 px-1.5">
                    <span className="text-[9px] font-semibold text-red-400">
                      LIVE
                    </span>
                  </div>
                </motion.div>
              </h2>
              <p className="text-xs text-blue-100/70">
                Real-time monitoring from national news sources
              </p>
            </div>
          </div>
          
          {/* View All button linked to news-monitoring page */}
          <Link 
            href="/news-monitoring" 
            className="text-xs font-medium text-white flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            View All
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        
        {/* Navigation dots */}
        <div className="flex justify-center mb-3">
          <div className="flex items-center gap-1.5">
            {disasterNews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === activeIndex ? "bg-white" : "bg-white/30"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Carousel content */}
        <div className="relative h-[210px] overflow-hidden">
          <AnimatePresence mode="wait">
            {disasterNews.map((item, idx) => (
              idx === activeIndex && (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="h-full"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* News Image */}
                    {item.imageUrl && (
                      <div className="md:w-1/3 h-32 md:h-full overflow-hidden rounded-lg">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/default-disaster.svg";
                          }}
                        />
                      </div>
                    )}
                    
                    {/* News Content */}
                    <div className={item.imageUrl ? "md:w-2/3" : "w-full"}>
                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      
                      <div className="mb-3 flex flex-wrap gap-2">
                        {item.source && (
                          <span className="inline-flex items-center text-xs bg-white/20 px-2 py-1 rounded text-white">
                            <Newspaper className="h-3 w-3 mr-1" />
                            {item.source}
                          </span>
                        )}
                        
                        {item.timestamp && (
                          <span className="inline-flex items-center text-xs bg-white/20 px-2 py-1 rounded text-white">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(item.timestamp)}
                          </span>
                        )}
                        
                        {/* Location from either AI analysis or direct property */}
                        {(item.analysis?.location && item.analysis.location !== 'Philippines') ? (
                          <span className="inline-flex items-center text-xs bg-white/20 px-2 py-1 rounded text-white">
                            <MapPin className="h-3 w-3 mr-1" />
                            {item.analysis.location}
                          </span>
                        ) : item.location ? (
                          <span className="inline-flex items-center text-xs bg-white/20 px-2 py-1 rounded text-white">
                            <MapPin className="h-3 w-3 mr-1" />
                            {item.location}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs bg-white/20 px-2 py-1 rounded text-white">
                            <MapPin className="h-3 w-3 mr-1" />
                            Philippines
                          </span>
                        )}
                        
                        {/* Display disaster type from either AI analysis or direct property */}
                        {(item.analysis?.disaster_type && item.analysis.disaster_type !== 'other') ? (
                          <span className={`inline-flex items-center text-xs px-2 py-1 rounded ${getDisasterTypeColor(item.analysis.disaster_type)}`}>
                            {item.analysis.disaster_type}
                          </span>
                        ) : item.disasterType ? (
                          <span className={`inline-flex items-center text-xs px-2 py-1 rounded ${getDisasterTypeColor(item.disasterType)}`}>
                            {item.disasterType}
                          </span>
                        ) : null}
                      </div>
                      
                      <p className="text-sm text-white/80 line-clamp-3">
                        {item.content}
                      </p>
                      
                      <div className="mt-2">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-white/90 hover:text-white underline underline-offset-2"
                        >
                          Read full article
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default DisasterNewsCarousel;