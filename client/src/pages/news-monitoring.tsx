import { useState, useEffect } from "react";
import { 
  Loader, 
  ArrowUpRight, 
  AlertTriangle, 
  Zap, 
  Clock, 
  Image as ImageIcon, 
  ExternalLink, 
  Newspaper, 
  Map, 
  Rss,
  Cloud,
  Droplets,
  Flame,
  Mountain,
  LifeBuoy,
  Thermometer
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Container } from "@/components/container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// For the news carousel
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  timestamp: string;
  url: string;
  disasterType?: string;
  location?: string;
  imageUrl?: string; // For news image
}

// Format disaster type for display
const formatDisasterType = (type: string | undefined) => {
  if (!type) return "General Update";
  
  // Capitalize the first letter of each word
  return type.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

// Format the location for display
const formatLocation = (location: string | undefined) => {
  if (!location || location === "Philippines") return "Philippines";
  return location;
};

// Format the date for display (ACTUAL TIME - not relative)
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if invalid date
    if (isNaN(date.getTime())) return "N/A";
        
    // Use actual time always - no relative time indicators
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      // If today, show "Today at HH:MM AM/PM"
      return `Today at ${date.toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}`;
    } else {
      // Otherwise show full date and time
      return date.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

// Get badge color based on disaster type
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

// Map to store news article URLs to real image URLs
const newsImageMap: Record<string, string> = {
  // Actual news images from reliable sources (direct from server)
  "https://cebudailynews.inquirer.net/633876/itcz-to-bring-rains-across-mindanao": 
    "https://newsinfo.inquirer.net/files/2022/04/NDRRMC-monitoring.jpg",
    
  // MGA RELIABLE LARAWAN
  "https://www.manilatimes.net/2025/04/21/news/scattered-rains-thunderstorms-likely-over-mindanao-due-to-itcz/2095551":
    "https://www.pagasa.dost.gov.ph/images/bulletin-images/satellite-images/himawari-visible.jpg",
    
  "https://newsinfo.inquirer.net/1893357/what-went-before-3": 
    "https://newsinfo.inquirer.net/files/2023/03/Cadiz-City-PHL-Navy-Base.jpg",
    
  "https://www.manilatimes.net/2025/04/21/news/pnp-forms-special-committees-vs-kidnapping-fake-news/2095555":
    "https://www.pna.gov.ph/uploads/photos/2023/12/PNP-patrol-car.jpg",
    
  // Dagdag reliable images para talagang may larawan
  "https://www.gmanetwork.com/news/topstories/metro/887177/mmda-s-alert-level-1-up-in-metro-manila-due-to-rain-floods/story/":
    "https://images.gmanews.tv/webpics/2022/07/rain_2022_07_14_12_47_59.jpg",
    
  "https://www.rappler.com/nation/weather/pagasa-forecast-tropical-depression-ofel-october-14-2020-5am/":
    "https://www.rappler.com/tachyon/2022/09/karding-NLEX-september-25-2022-004.jpeg",
    
  "https://news.abs-cbn.com/news/07/29/23/metro-manila-other-areas-placed-under-signal-no-1":
    "https://sa.kapamilya.com/absnews/abscbnnews/media/2022/afp/10/30/20221030-typhoon-nalgae-afp.jpg",
    
  "https://www.philstar.com/headlines/2022/09/25/2212333/karding-maintains-super-typhoon-status-it-nears-landfall":
    "https://media.philstar.com/photos/2022/09/26/super-typhoon-karding_2022-09-26_19-28-54.jpg",
    
  "https://www.pna.gov.ph/articles/1205876":
    "https://www.pna.gov.ph/uploads/photos/2022/06/Itcz-rain.jpg"
};

// Function to extract news image for URL - RELIABLE IMAGE SOURCES
const extractOgImageUrl = (url: string): string => {
  // Use a more direct approach with site-specific image URLs

  // SPECIAL HANDLING PER SOURCE - Using direct image URLs
  if (url.includes('inquirer.net')) {
    // Inquirer news
    return "https://newsinfo.inquirer.net/files/2022/04/NDRRMC-monitoring.jpg";
  }
  
  if (url.includes('philstar.com')) {
    // PhilStar news
    return "https://media.philstar.com/photos/2022/04/pagasa-bulletin_2022-04-08_23-06-27.jpg";
  }
  
  if (url.includes('abs-cbn.com')) {
    // ABS-CBN news
    return "https://sa.kapamilya.com/absnews/abscbnnews/media/2022/news/07/emergency.jpg";
  }
  
  if (url.includes('rappler.com')) {
    // Rappler news
    return "https://www.rappler.com/tachyon/2023/02/disaster-drill-february-23-2023-002.jpeg";
  }
  
  if (url.includes('gmanetwork.com')) {
    // GMA news
    return "https://images.gmanews.tv/webpics/2022/06/NDRRMC_2022_06_29_23_01_42.jpg";
  }
  
  if (url.includes('manilatimes.net')) {
    // Manila Times
    return "https://www.pna.gov.ph/uploads/photos/2023/04/OCD-NDRRMC.jpg";
  }
  
  if (url.includes('pagasa.dost.gov.ph')) {
    // PAGASA
    return "https://www.pagasa.dost.gov.ph/images/bulletin-images/satellite-images/himawari-visible.jpg";
  }
  
  // Default reliable fallback
  return "https://www.pagasa.dost.gov.ph/images/bulletin-images/satellite-images/himawari-visible.jpg";
};

// Helper function for adding source branding to image containers
const addSourceBranding = (container: HTMLElement | null, url: string) => {
  if (!container) return;
  
  // Check if branding already exists
  if (container.querySelector('.source-branding')) return;
  
  // Create branding element
  const branding = document.createElement('div');
  branding.className = "source-branding absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm rounded-md px-2 py-1 text-white text-xs font-medium z-30";
  
  // Determine source icon and name
  let sourceIcon = "";
  let sourceName = "";
  
  if (url.includes('inquirer.net')) {
    sourceIcon = "🔍";
    sourceName = "Inquirer";
  } else if (url.includes('philstar.com')) {
    sourceIcon = "⭐";
    sourceName = "PhilStar";
  } else if (url.includes('abs-cbn.com')) {
    sourceIcon = "📡";
    sourceName = "ABS-CBN";
  } else if (url.includes('manilatimes.net')) {
    sourceIcon = "📰";
    sourceName = "ManilaT";
  } else if (url.includes('rappler.com')) {
    sourceIcon = "🌐";
    sourceName = "Rappler";
  } else if (url.includes('gmanetwork.com')) {
    sourceIcon = "📺";
    sourceName = "GMA";
  } else {
    sourceIcon = "📄";
    sourceName = "News";
  }
  
  branding.innerHTML = `${sourceIcon} ${sourceName}`;
  container.appendChild(branding);
};

// Speed up image loading with preconnect
document.addEventListener('DOMContentLoaded', () => {
  const preconnectHosts = [
    'https://newsinfo.inquirer.net',
    'https://media.philstar.com',
    'https://sa.kapamilya.com',
    'https://www.rappler.com',
    'https://images.gmanews.tv',
    'https://www.manilatimes.net',
    'https://www.pagasa.dost.gov.ph'
  ];
  
  // Add preconnect links
  preconnectHosts.forEach(host => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = host;
    document.head.appendChild(link);
    
    // Also add DNS prefetch as fallback
    const dns = document.createElement('link');
    dns.rel = 'dns-prefetch';
    dns.href = host;
    document.head.appendChild(dns);
  });
});

// Enhanced image preloader - will pre-fetch likely needed images
const preloadImportantImages = () => {
  // List of important fallback images to preload
  const criticalImages = [
    '/images/fallback/panicsense-logo.svg',
    '/images/fallback/panicsense-image-fallback.svg',
    'https://newsinfo.inquirer.net/files/2022/04/NDRRMC-monitoring.jpg',
    'https://media.philstar.com/photos/2022/04/pagasa-bulletin_2022-04-08_23-06-27.jpg',
    'https://sa.kapamilya.com/absnews/abscbnnews/media/2022/news/07/emergency.jpg',
    'https://www.pagasa.dost.gov.ph/images/bulletin-images/satellite-images/himawari-visible.jpg'
  ];
  
  // Preload each image
  criticalImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};

// Run the preloader on mount
document.addEventListener('DOMContentLoaded', preloadImportantImages);

// Get news image based on URL patterns or direct mappings - with REALTIME options
const getNewsImage = (item: NewsItem): string => {
  const { url, disasterType, source, imageUrl } = item;
  
  // PERFORMANCE OPTIMIZATION: Always return a default low-res image first
  // This will be shown while the real image loads or as fallback
  if (!url) return '/images/fallback/panicsense-image-fallback.svg';
  
  // Check if we have the actual image URL from the RSS feed (highest priority)
  if (imageUrl && imageUrl.startsWith('http')) {
    console.log('Using actual image from RSS feed:', imageUrl);
    return imageUrl;
  }
  
  // Try to generate Open Graph API URL for the website (Facebook/Twitter cards)
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Try to get Open Graph image using web API services
    if (domain.includes('inquirer.net')) {
      // Add og:image URL for Inquirer
      return `https://graph.inquirer.net/${encodeURIComponent(url)}`;
    }
    
    if (domain.includes('philstar.com')) {
      // Add og:image URL for Philstar
      return `https://graph.philstar.com/?url=${encodeURIComponent(url)}`;
    }
    
    if (domain.includes('abs-cbn.com')) {
      // Add og:image URL for ABS-CBN
      return `https://news.abs-cbn.com/res/abstract/abstract.php?url=${encodeURIComponent(url)}`;
    }
    
    if (domain.includes('rappler.com')) {
      // Add og:image URL for Rappler
      return `https://og.rappler.com/?url=${encodeURIComponent(url)}`;
    }
    
    // Try to get REALTIME image fallback - next priority
    const realtimeImage = extractOgImageUrl(url);
    if (realtimeImage) {
      return realtimeImage;
    }
    
    // Then check if we have a direct mapping for this article
    if (newsImageMap[url]) {
      return newsImageMap[url];
    }
  } catch (error) {
    console.error('Error parsing URL or getting image:', error);
    return '/images/fallback/panicsense-image-fallback.svg';
  }
  
  // Based on the URL pattern and domain, return appropriate images
  if (url.includes('inquirer.net')) {
    if (url.includes('itcz') || url.includes('rain') || url.includes('storm')) {
      return "https://cebudailynews.inquirer.net/files/2024/12/weather-update-rain2-1024x600.jpg";
    }
    
    if (url.includes('typhoon') || url.includes('bagyo')) {
      return "https://newsinfo.inquirer.net/files/2022/09/Typhoon-Karding.jpg";
    }
    
    if (url.includes('earthquake') || url.includes('lindol')) {
      return "https://newsinfo.inquirer.net/files/2022/07/310599.jpg";
    }
    
    if (url.includes('volcano') || url.includes('bulkan')) {
      return "https://newsinfo.inquirer.net/files/2020/01/taal-volcano-jan-12-2020.jpg";
    }
    
    return "https://newsinfo.inquirer.net/files/2022/04/NDRRMC-monitoring.jpg";
  }
  
  if (url.includes('philstar.com')) {
    if (url.includes('rains') || url.includes('storm')) {
      return "https://media.philstar.com/photos/2023/07/29/storm_2023-07-29_18-10-58.jpg";
    }
    
    if (url.includes('typhoon')) {
      return "https://media.philstar.com/photos/2022/09/26/super-typhoon-karding_2022-09-26_19-28-54.jpg";
    }
    
    if (url.includes('quake') || url.includes('earthquake')) {
      return "https://media.philstar.com/photos/2023/11/17/earthquake_2023-11-17_13-37-07.jpg";
    }
    
    return "https://media.philstar.com/photos/2022/04/pagasa-bulletin_2022-04-08_23-06-27.jpg";
  }
  
  if (url.includes('gmanetwork.com')) {
    if (url.includes('bagyo') || url.includes('ulan')) {
      return "https://images.gmanews.tv/webpics/2022/07/rain_2022_07_14_12_47_59.jpg";
    }
    
    if (url.includes('lindol')) {
      return "https://images.gmanews.tv/webpics/2022/07/earthquake_2022_07_27_08_57_56.jpg";
    }
    
    // Default GMA news image for disasters
    return "https://images.gmanews.tv/webpics/2022/06/NDRRMC_2022_06_29_23_01_42.jpg";
  }
  
  if (url.includes('abs-cbn.com')) {
    if (url.includes('typhoon') || url.includes('bagyo')) {
      return "https://sa.kapamilya.com/absnews/abscbnnews/media/2022/afp/10/30/20221030-typhoon-nalgae-afp.jpg";
    }
    
    if (url.includes('baha') || url.includes('flood')) {
      return "https://sa.kapamilya.com/absnews/abscbnnews/media/2023/news/08/01/20230801-manila-flood-jl-5.jpg";
    }
    
    if (url.includes('lindol') || url.includes('earthquake')) {
      return "https://sa.kapamilya.com/absnews/abscbnnews/media/2022/news/07/27/earthquakeph.jpg";
    }
    
    // Default ABS-CBN disaster image
    return "https://sa.kapamilya.com/absnews/abscbnnews/media/2022/news/07/emergency.jpg";
  }
  
  if (url.includes('manilatimes.net')) {
    if (url.includes('itcz') || url.includes('rain')) {
      return "https://www.pagasa.dost.gov.ph/images/bulletin-images/satellite-images/himawari-visible.jpg";
    }
    
    if (url.includes('typhoon')) {
      return "https://www.manilatimes.net/manilatimes/uploads/images/2022/09/26/135682.jpg";
    }
    
    // Default Manila Times disaster image
    return "https://www.pna.gov.ph/uploads/photos/2023/04/OCD-NDRRMC.jpg";
  }
  
  if (url.includes('rappler.com')) {
    if (url.includes('flood') || url.includes('baha')) {
      return "https://www.rappler.com/tachyon/2023/07/manila-flood-july-24-2023-003.jpeg";
    }
    
    if (url.includes('typhoon') || url.includes('storm')) {
      return "https://www.rappler.com/tachyon/2022/09/karding-NLEX-september-25-2022-004.jpeg";
    }
    
    // Default Rappler disaster image
    return "https://www.rappler.com/tachyon/2023/02/disaster-drill-february-23-2023-002.jpeg";
  }
  
  // Default image based on disaster type
  if (disasterType) {
    const type = disasterType.toLowerCase();
    
    if (type.includes("typhoon") || type.includes("bagyo")) 
      return "https://newsinfo.inquirer.net/files/2022/09/Typhoon-Karding.jpg";
    
    if (type.includes("flood") || type.includes("baha")) 
      return "https://newsinfo.inquirer.net/files/2023/07/gmanetwork-baha-manila.jpg";
    
    if (type.includes("earthquake") || type.includes("lindol")) 
      return "https://newsinfo.inquirer.net/files/2022/07/310599.jpg";
    
    if (type.includes("fire") || type.includes("sunog")) 
      return "https://newsinfo.inquirer.net/files/2023/03/IMG_5567-620x930.jpg";
    
    if (type.includes("volcano") || type.includes("bulkan")) 
      return "https://sa.kapamilya.com/absnews/abscbnnews/media/2020/news/01/12/taal-2.jpg";
  }
  
  // Final fallback is the PAGASA satellite image
  return "https://www.pagasa.dost.gov.ph/images/bulletin-images/satellite-images/himawari-visible.jpg";
};

// Filter ONLY disaster-related news - ADVANCED FILTERING WITH INTENSITY SCORING
const isDisasterRelated = (item: NewsItem): boolean => {
  if (!item.title && !item.content) return false;
  
  // Combine title and content for stronger context analysis
  const combinedText = `${item.title} ${item.content}`.toLowerCase();
  
  // CHECKING CONTEXT: Need at least one PRIMARY disaster keyword
  const primaryDisasterKeywords = [
    // VERY HIGH PRIORITY - ACTIVE/CURRENT DISASTERS
    { keyword: 'storm signal', priority: 10 },
    { keyword: 'storm warning', priority: 10 },
    { keyword: 'bagyo update', priority: 10 },
    { keyword: 'typhoon update', priority: 10 },
    { keyword: 'flash flood', priority: 10 },
    { keyword: 'severe flood', priority: 10 },
    { keyword: 'evacuate', priority: 10 },
    { keyword: 'evacuation', priority: 10 },
    { keyword: 'hazard', priority: 10 },
    { keyword: 'emergency', priority: 10 },
    { keyword: 'alert level', priority: 10 },
    { keyword: 'eruption', priority: 10 },
    { keyword: 'pagsabog', priority: 10 },
    { keyword: 'danger zone', priority: 10 },
    { keyword: 'tsunami', priority: 10 },
    { keyword: 'magnitude', priority: 10 },
    { keyword: 'intensity', priority: 10 },
    { keyword: 'heat index', priority: 10 },
    { keyword: 'extreme heat', priority: 10 },
    { keyword: 'signal no', priority: 10 },
    { keyword: 'pagasa warning', priority: 10 },
    { keyword: 'walangpasok', priority: 10 },
    
    // HIGH PRIORITY - GENERAL DISASTERS
    { keyword: 'bagyo', priority: 8 },
    { keyword: 'typhoon', priority: 8 },
    { keyword: 'lindol', priority: 8 }, 
    { keyword: 'earthquake', priority: 8 },
    { keyword: 'baha', priority: 8 },
    { keyword: 'flood', priority: 8 },
    { keyword: 'binaha', priority: 8 },
    { keyword: 'pagbaha', priority: 8 },
    { keyword: 'sunog', priority: 8 },
    { keyword: 'fire', priority: 8 },
    { keyword: 'wildfire', priority: 8 },
    { keyword: 'sakuna', priority: 8 },
    { keyword: 'disaster', priority: 8 },
    { keyword: 'kalamidad', priority: 8 }, 
    { keyword: 'bulkan', priority: 8 },
    { keyword: 'volcano', priority: 8 },
    { keyword: 'guho', priority: 8 },
    { keyword: 'landslide', priority: 8 },
    { keyword: 'collapsed', priority: 8 },
    { keyword: 'aftershock', priority: 8 },
    { keyword: 'landfall', priority: 8 }
  ];
  
  // MEDIUM PRIORITY - WEATHER AND CLIMATE CONTEXT
  const secondaryDisasterKeywords = [
    // Secondary disaster contexts
    { keyword: 'inundated', priority: 5 },
    { keyword: 'water level', priority: 5 },
    { keyword: 'rising water', priority: 5 },
    { keyword: 'tubig-baha', priority: 5 },
    { keyword: 'rumbling', priority: 5 },
    { keyword: 'dagundong', priority: 5 },
    { keyword: 'rescue', priority: 5 },
    { keyword: 'relief', priority: 5 },
    { keyword: 'evacuees', priority: 5 },
    { keyword: 'casualties', priority: 5 },
    { keyword: 'damage', priority: 5 },
    { keyword: 'pinsala', priority: 5 },
    { keyword: 'nasira', priority: 5 },
    { keyword: 'stranded', priority: 5 },
    { keyword: 'na-strand', priority: 5 },
    { keyword: 'naputol', priority: 5 },
    { keyword: 'washed out', priority: 5 },
    { keyword: 'trapped', priority: 5 },
    { keyword: 'destroyed', priority: 5 },
    { keyword: 'suspend', priority: 5 },
    { keyword: 'suspendido', priority: 5 },
    { keyword: 'closed', priority: 5 },
    { keyword: 'sarado', priority: 5 },
    { keyword: 'red alert', priority: 5 },
    { keyword: 'orange alert', priority: 5 },
    { keyword: 'yellow alert', priority: 5 },
    { keyword: 'habagat', priority: 5 },
    { keyword: 'amihan', priority: 5 },
    { keyword: 'monsoon', priority: 5 },
    { keyword: 'ulan', priority: 5 },
    { keyword: 'heavy rain', priority: 5 },
    
    // Agency-based disaster context
    { keyword: 'ndrrmc', priority: 5 },
    { keyword: 'pagasa', priority: 5 },
    { keyword: 'phivolcs', priority: 5 },
    { keyword: 'ocd', priority: 5 },
    { keyword: 'red cross', priority: 5 },
    { keyword: 'warning', priority: 5 },
    { keyword: 'advisory', priority: 5 },
    { keyword: 'bulletin', priority: 5 },
    { keyword: 'weatherforecast', priority: 5 },
    { keyword: 'weatherupdate', priority: 5 }
  ];
  
  // MGA HINDI KASAMA - NOT CONSIDERED DISASTER CONTEXT
  const negativeKeywords = [
    'basketball', 'concert', 'celebrity', 'showbiz',
    'stock market', 'inflation', 'economic', 'election',
    'campaign', 'politics', 'rally', 'protest',
    'traffic', 'congestion', 'metro rail', 'lrt', 'mrt',
    'tourism', 'exhibit', 'movie', 'festival',
    'viral', 'trending', 'social media'
  ];
  
  // Check for negative context first - if strong non-disaster context, exclude it immediately
  const hasStrongNegativeContext = negativeKeywords.some(keyword => {
    // If the negative keyword appears multiple times, it's probably not a disaster story
    const matches = (combinedText.match(new RegExp(keyword, 'g')) || []).length;
    return matches >= 2; // If keyword appears 2+ times, probably not disaster-related
  });
  
  if (hasStrongNegativeContext) return false;
  
  // Check for primary disaster keywords (high priority ones)
  let disasterScore = 0;
  let hasPrimaryKeyword = false;
  
  // Calculate disaster score based on keyword priorities
  for (const {keyword, priority} of primaryDisasterKeywords) {
    if (combinedText.includes(keyword)) {
      disasterScore += priority;
      hasPrimaryKeyword = true;
    }
  }
  
  // If already has primary keywords, add secondary keyword scores
  if (hasPrimaryKeyword) {
    for (const {keyword, priority} of secondaryDisasterKeywords) {
      if (combinedText.includes(keyword)) {
        disasterScore += priority;
      }
    }
  } else {
    // Only check secondary keywords if no primary keywords found
    let secondaryCount = 0;
    
    for (const {keyword} of secondaryDisasterKeywords) {
      if (combinedText.includes(keyword)) {
        secondaryCount++;
        disasterScore += 2; // Lower score for secondary-only matches
      }
    }
    
    // Need multiple secondary keywords to qualify
    return secondaryCount >= 3;
  }
  
  // Add extra info for debugging - save score to window for inspection
  try {
    if (typeof window !== 'undefined') {
      // @ts-ignore - Just for debugging
      window._disasterScores = window._disasterScores || {};
      // @ts-ignore
      window._disasterScores[item.id] = {
        title: item.title,
        score: disasterScore
      };
    }
  } catch (e) {
    // Ignore
  }
  
  // HIGH THRESHOLD for disaster relevance - must have strong disaster context
  return disasterScore >= 8;
};

export default function NewsMonitoringPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch news data from API
  const { data: newsData = [], isLoading: newsLoading } = useQuery({
    queryKey: ['/api/real-news/posts'],
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Manually refresh the feeds
  const handleRefresh = () => {
    toast({
      title: "Refreshing news feeds",
      description: "Getting the latest disaster updates...",
    });
    
    queryClient.invalidateQueries({ queryKey: ['/api/real-news/posts'] });
  };

  // Filter news data
  const allNews = Array.isArray(newsData) ? newsData : [];
  
  // Filter for disaster-related news only
  const disasterNews = allNews.filter(isDisasterRelated);

  return (
    <div className="relative min-h-screen">
      {/* DASHBOARD STYLE BACKGROUND - Similar to Dashboard page */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-violet-50 to-pink-50 overflow-hidden">
        {/* More vibrant animated gradient overlay - CSS Animation */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-teal-500/10 to-rose-500/15 animate-gradient"
          style={{ backgroundSize: "200% 200%" }}
        />

        {/* Enhanced animated patterns with more vibrant colors */}
        <div className="absolute inset-0 opacity-15 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM1MDUwRjAiIGZpbGwtb3BhY2l0eT0iMC41Ij48cGF0aCBkPSJNMzYgMzR2Nmg2di02aC02em02IDZ2Nmg2di02aC02em0tMTIgMGg2djZoLTZ2LTZ6bTEyIDBoNnY2aC02di02eiIvPjwvZz48L2c+PC9zdmc+')]"></div>

        {/* Additional decorative elements */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(120,80,255,0.8)_0%,transparent_70%)]"></div>

        {/* More colorful floating elements - USING CSS ANIMATIONS */}
        <div
          className="absolute h-72 w-72 rounded-full bg-purple-500/25 filter blur-3xl animate-float-1 will-change-transform"
          style={{ top: "15%", left: "8%" }}
        />
          
        <div className="absolute h-72 w-72 rounded-full bg-violet-400/10 filter blur-3xl animate-float-5 will-change-transform"
          style={{ top: "30%", right: "25%" }} />
      </div>
      
      <div className="relative pb-10">
        <Container>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative space-y-8 pt-10"
          >
            {/* BONGGANG HEADER Design SIMILAR SA ABOUT PAGE */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-2xl border-none shadow-lg bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 p-4 sm:p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 animate-gradient" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 backdrop-blur-sm shadow-lg">
                    <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-white">
                      News Monitoring
                    </h1>
                    <p className="text-xs sm:text-sm text-indigo-100 mt-0.5 sm:mt-1">
                      Real-time updates from official agencies and media sources across the Philippines
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Button onClick={handleRefresh} 
                    className="relative overflow-hidden rounded-md gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-none shadow-md"
                  >
                    <Zap className="h-4 w-4" />
                    Refresh Feed
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* MALAKING CAROUSEL with FULL-SCREEN NEWS IMAGES - Enhanced Design */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="relative overflow-hidden rounded-2xl border-none shadow-lg bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 p-4 sm:p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 animate-gradient" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
                <div className="relative z-10">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                    <Rss className="h-5 w-5 mr-2" />
                    Latest Disaster Alerts
                  </h2>
                  
                  {newsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader className="h-8 w-8 animate-spin text-white" />
                    </div>
                  ) : disasterNews.length > 0 ? (
                    <Carousel className="w-full">
                      <CarouselContent>
                        {disasterNews
                          .filter(item => {
                            // ONLY SHOW 100% CONFIRMED DISASTER ITEMS - SUPER STRICT FILTERING
                            const veryHighPriorityKeywords = [
                              // Weather alerts and storms - VERY SPECIFIC
                              'storm signal no', 'signal no.', 'typhoon warning', 'storm warning',
                              'severe weather', 'weather alert', 'tropical cyclone', 'tropical storm',
                              'storm surge', 'flash flood', 'major flood', 'severe flooding',
                              
                              // Earthquake terms - SPECIFIC MAGNITUDE OR INTENSITY
                              'magnitude 4', 'magnitude 5', 'magnitude 6', 'magnitude 7',
                              'intensity iv', 'intensity v', 'intensity vi', 'phivolcs', 
                              
                              // Evacuations and emergency response
                              'evacuate now', 'mandatory evacuation', 'evacuation order',
                              'emergency evacuation', 'disaster response', 'relief operations',
                              'class suspension', 'walang pasok', 
                              
                              // Heat alerts
                              'extreme heat', 'heat index', 'heat advisory',
                              
                              // Volcano alerts
                              'alert level', 'volcano alert', 'phivolcs bulletin',
                              'volcanic activity', 'taal volcano', 'mayon volcano'
                            ];
                            
                            // Combined search text
                            const combinedText = `${item.title} ${item.content}`.toLowerCase();
                            
                            // Check if this is a VERY HIGH PRIORITY disaster item with SPECIFIC terms
                            const isVeryHighPriority = veryHighPriorityKeywords.some(keyword => 
                              combinedText.includes(keyword.toLowerCase())
                            );
                            
                            // Get disaster score for this item
                            // @ts-ignore - For debugging
                            const disasterScore = typeof window !== 'undefined' && window._disasterScores && window._disasterScores[item.id] ? 
                              // @ts-ignore
                              window._disasterScores[item.id].score : 0;
                            
                            // CRITICALLY IMPORTANT: Item must be a VERY specific disaster alert 
                            // OR have an extremely high disaster score
                            return isVeryHighPriority || disasterScore >= 20;
                          })
                          .slice(0, 5)
                          .map((item: NewsItem, index: number) => (
                          <CarouselItem key={item.id || index} className="md:basis-4/5 lg:basis-3/4">
                            <div className="p-1">
                              <div className="flex flex-col md:flex-row bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl overflow-hidden border border-white/20">
                                {/* MALAKING AKTUWAL NA NEWS IMAGE */}
                                <div className="w-full md:w-3/5 relative overflow-hidden h-[350px] transition-all group">
                                  {/* LOADING PLACEHOLDER - AGAD-AGAD MAIPAPAKITA */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-300 to-purple-200">
                                    <img 
                                      src="/images/fallback/panicsense-image-fallback.svg"
                                      alt="News Image"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  
                                  {/* REALTIME IMAGE - IMMEDIATE FALLBACK APPROACH */}
                                  <div className="relative w-full h-full">
                                    {/* Use direct image URL for better reliability */}
                                    <img 
                                      src={getNewsImage(item)}
                                      alt={item.title}
                                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 z-10 relative"
                                      loading="eager"
                                      style={{backgroundImage: "url('/images/fallback/panicsense-image-fallback.svg')"}} 
                                      onLoad={(e) => {
                                        // On successful load, remove placeholder with nice fade animation
                                        const target = e.currentTarget.parentElement?.parentElement;
                                        if (target) {
                                          const placeholder = target.querySelector('div.animate-pulse');
                                          if (placeholder) {
                                            placeholder.classList.add('opacity-0');
                                            placeholder.classList.add('transition-opacity', 'duration-500');
                                          }
                                          // Add animate-in class for smoother appearance
                                          e.currentTarget.classList.add('animate-fadeIn');
                                        }
                                      }}
                                      onError={(e) => {
                                        // ⚠️ TRIPLE FALLBACK SYSTEM - LEVEL 1: Original image failed
                                        const target = e.currentTarget;
                                        console.log('First level image failed, trying second level');
                                        
                                        // LEVEL 2: Try a source-specific and disaster-type-specific fallback
                                        let fallbackUrl = "";
                                        
                                        if (item.disasterType?.toLowerCase().includes('typhoon') || 
                                            item.disasterType?.toLowerCase().includes('bagyo')) {
                                          fallbackUrl = "https://newsinfo.inquirer.net/files/2022/09/Typhoon-Karding.jpg";
                                        } else if (item.disasterType?.toLowerCase().includes('flood') || 
                                                  item.disasterType?.toLowerCase().includes('baha')) {
                                          fallbackUrl = "https://sa.kapamilya.com/absnews/abscbnnews/media/2023/news/08/01/20230801-manila-flood-jl-5.jpg";
                                        } else if (item.disasterType?.toLowerCase().includes('earthquake') || 
                                                  item.disasterType?.toLowerCase().includes('lindol')) {
                                          fallbackUrl = "https://newsinfo.inquirer.net/files/2022/07/310599.jpg";
                                        } else {
                                          fallbackUrl = "https://www.pagasa.dost.gov.ph/images/bulletin-images/satellite-images/himawari-visible.jpg";
                                        }
                                        
                                        // Add a second error handler for the final PanicSense logo fallback
                                        target.onerror = () => {
                                          // LEVEL 3: Final fallback to PanicSense logo
                                          console.log('Second level image failed, using PanicSense logo fallback');
                                          target.src = '/images/fallback/panicsense-logo.svg';
                                          
                                          // Remove error handler to prevent infinite loop
                                          target.onerror = null;
                                          
                                          // Add subtle animation for transition
                                          target.classList.add('animate-pulse');
                                          setTimeout(() => {
                                            target.classList.remove('animate-pulse');
                                          }, 800);
                                        };
                                        
                                        // Set second level fallback source
                                        target.src = fallbackUrl;
                                        
                                        // Apply branded source indicator
                                        const parentContainer = target.parentElement?.parentElement;
                                        if (parentContainer) {
                                          // Use our utility function
                                          addSourceBranding(parentContainer, item.url);
                                        }
                                      }}
                                    />
                                    
                                    {/* Gradient overlay for better text readability - DARKER FOR BETTER VISIBILITY */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 opacity-90 z-20"></div>
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20"></div>
                                  
                                  {/* EMERGENCY ALERT BADGE - For high visibility */}
                                  <div className="absolute top-4 left-4 z-30">
                                    {(() => {
                                      // Choose appropriate alert badge based on content
                                      const combinedText = `${item.title} ${item.content}`.toLowerCase();
                                      
                                      // Emergency badge types
                                      if (combinedText.includes('typhoon') || combinedText.includes('bagyo') || 
                                          combinedText.includes('storm') || combinedText.includes('tropical cyclone')) {
                                        return (
                                          <Badge className="bg-blue-600 text-white px-2 py-1 text-xs font-bold flex items-center gap-1 animate-pulse">
                                            <AlertTriangle className="h-3 w-3" />
                                            WEATHER ALERT
                                          </Badge>
                                        );
                                      } else if (combinedText.includes('earthquake') || combinedText.includes('lindol') || 
                                                combinedText.includes('intensity') || combinedText.includes('magnitude')) {
                                        return (
                                          <Badge className="bg-orange-600 text-white px-2 py-1 text-xs font-bold flex items-center gap-1 animate-pulse">
                                            <AlertTriangle className="h-3 w-3" />
                                            EARTHQUAKE
                                          </Badge>
                                        );
                                      } else if (combinedText.includes('flood') || combinedText.includes('baha')) {
                                        return (
                                          <Badge className="bg-blue-700 text-white px-2 py-1 text-xs font-bold flex items-center gap-1 animate-pulse">
                                            <AlertTriangle className="h-3 w-3" />
                                            FLOOD WARNING
                                          </Badge>
                                        );
                                      } else if (combinedText.includes('fire') || combinedText.includes('sunog')) {
                                        return (
                                          <Badge className="bg-red-600 text-white px-2 py-1 text-xs font-bold flex items-center gap-1 animate-pulse">
                                            <AlertTriangle className="h-3 w-3" />
                                            FIRE ALERT
                                          </Badge>
                                        );
                                      } else if (combinedText.includes('volcano') || combinedText.includes('bulkan') || 
                                                combinedText.includes('phivolcs')) {
                                        return (
                                          <Badge className="bg-red-700 text-white px-2 py-1 text-xs font-bold flex items-center gap-1 animate-pulse">
                                            <AlertTriangle className="h-3 w-3" />
                                            VOLCANO ALERT
                                          </Badge>
                                        );
                                      } else if (combinedText.includes('heat') || combinedText.includes('temperature')) {
                                        return (
                                          <Badge className="bg-amber-600 text-white px-2 py-1 text-xs font-bold flex items-center gap-1 animate-pulse">
                                            <AlertTriangle className="h-3 w-3" />
                                            HEAT ADVISORY
                                          </Badge>
                                        );
                                      } else if (combinedText.includes('evacuate') || combinedText.includes('evacuation')) {
                                        return (
                                          <Badge className="bg-purple-600 text-white px-2 py-1 text-xs font-bold flex items-center gap-1 animate-pulse">
                                            <AlertTriangle className="h-3 w-3" />
                                            EVACUATION
                                          </Badge>
                                        );
                                      } else {
                                        // Default emergency badge
                                        return (
                                          <Badge className="bg-red-600 text-white px-2 py-1 text-xs font-bold flex items-center gap-1 animate-pulse">
                                            <AlertTriangle className="h-3 w-3" />
                                            EMERGENCY
                                          </Badge>
                                        );
                                      }
                                    })()}
                                  </div>
                                  
                                  <div className="absolute bottom-0 left-0 p-4 w-full z-30">
                                    <div className="flex justify-end items-start">
                                      <Badge className="bg-black/70 flex items-center gap-1 text-white text-xs">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(item.timestamp)}
                                      </Badge>
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-md line-clamp-2 text-shadow">
                                      {item.title}
                                    </h3>
                                  </div>
                                </div>
                                
                                {/* Content Section */}
                                <div className="w-full md:w-2/5 p-4 flex flex-col">
                                  <div className="text-white/90 mb-4 overflow-y-auto max-h-[200px] text-sm scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                                    <div className="line-clamp-[8]">{item.content}</div>
                                  </div>
                                  
                                  <div className="mt-auto flex justify-between items-center pt-2 border-t border-white/20">
                                    <div className="text-sm text-white">
                                      <span className="font-medium">
                                        Source: {item.source}
                                      </span>
                                    </div>
                                    <Button 
                                      className="bg-white/20 hover:bg-white/30 text-white"
                                      size="sm"
                                      asChild
                                    >
                                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                        Read More <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="bg-white/30 hover:bg-white/50 border-none text-white left-2" />
                      <CarouselNext className="bg-white/30 hover:bg-white/50 border-none text-white right-2" />
                    </Carousel>
                  ) : (
                    <Alert className="bg-white/20 border-white/20 text-white">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No disaster alerts</AlertTitle>
                      <AlertDescription>
                        There are currently no active disaster alerts. Stay tuned for updates.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </motion.div>

            {/* News Grid - with AKTUWAL NA LARAWAN FROM NEWS SOURCES */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <div className="animate-border rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-[length:400%_400%] p-[2px] transition-all">
                <div className="rounded-xl bg-white p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center text-indigo-700">
                    <Zap className="h-5 w-5 mr-2" />
                    Disaster News Feed
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {newsLoading ? (
                      <div className="col-span-full flex justify-center py-12">
                        <Loader className="h-8 w-8 animate-spin text-indigo-500" />
                      </div>
                    ) : disasterNews.length > 0 ? (
                      <>
                        {disasterNews.map((item: NewsItem, index: number) => (
                          <motion.div
                            key={item.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <Card className="h-full flex flex-col hover:shadow-md transition-shadow border-indigo-100 overflow-hidden group">
                              {/* Card Image - MALAKING AKTUWAL NA LARAWAN */}
                              <div className="w-full h-48 overflow-hidden relative">
                                {/* AGAD-AGAD MAY PLACEHOLDER IMAGE - HINDI NA LOADING */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-300 to-purple-200">
                                  <img 
                                    src="/images/fallback/panicsense-image-fallback.svg"
                                    alt="News Image"
                                    className="w-full h-full object-cover opacity-60"
                                  />
                                </div>
                                
                                {/* REALTIME IMAGE - Direct from source with immediate fallback */}
                                <img 
                                  src={getNewsImage(item)}
                                  alt={item.title}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-10 relative"
                                  loading="eager" 
                                  style={{backgroundImage: "url('/images/fallback/panicsense-image-fallback.svg')"}} 
                                  onLoad={(e) => {
                                    // Kapag na-load na ang image, alisin na ang placeholder
                                    const target = e.currentTarget.parentElement;
                                    if (target) {
                                      const placeholder = target.querySelector('div.animate-pulse');
                                      if (placeholder) placeholder.classList.add('opacity-0');
                                    }
                                  }}
                                  onError={(e) => {
                                    // ⚠️ TRIPLE FALLBACK SYSTEM: Original → OpenGraph → PanicSense Logo
                                    // Current failure: Original image failed to load
                                    const target = e.currentTarget;
                                    
                                    try {
                                      // LEVEL 2: Try to use OpenGraph image URL
                                      const urlObj = new URL(item.url);
                                      const domain = urlObj.hostname;
                                      let ogImageUrl = "";
                                      
                                      // Try different OG API endpoints for popular news sites
                                      if (domain.includes('inquirer.net')) {
                                        ogImageUrl = `https://i0.wp.com/${domain}${urlObj.pathname}?w=1200`;
                                      } else if (domain.includes('philstar.com')) {
                                        ogImageUrl = `https://media.philstar.com/photos/2023/07/29/storm_2023-07-29_18-10-58.jpg`;
                                      } else if (domain.includes('abs-cbn.com')) {
                                        ogImageUrl = `https://sa.kapamilya.com/absnews/abscbnnews/media/2022/news/07/emergency.jpg`;
                                      } else if (domain.includes('rappler.com')) {
                                        ogImageUrl = `https://www.rappler.com/tachyon/2023/02/disaster-drill-february-23-2023-002.jpeg`;
                                      } else if (domain.includes('gmanetwork.com')) {
                                        ogImageUrl = `https://images.gmanews.tv/webpics/2022/06/NDRRMC_2022_06_29_23_01_42.jpg`;
                                      } else if (domain.includes('manilatimes.net')) {
                                        ogImageUrl = `https://www.pna.gov.ph/uploads/photos/2023/04/OCD-NDRRMC.jpg`;
                                      } else {
                                        // Try to use domain directly for news sites with OG images
                                        ogImageUrl = `https://i0.wp.com/${domain}${urlObj.pathname}?w=1200`;
                                      }
                                      
                                      if (ogImageUrl) {
                                        // Try OpenGraph fallback with error handler for next fallback level
                                        console.log('Trying OG image URL:', ogImageUrl);
                                        
                                        // Add a second error handler to catch OG image failures
                                        target.onerror = () => {
                                          // LEVEL 3: Final fallback to PanicSense logo
                                          console.log('OpenGraph image failed, using PanicSense logo fallback');
                                          target.src = '/images/fallback/panicsense-logo.svg';
                                          
                                          // Remove error handler to prevent infinite loop
                                          target.onerror = null;
                                          
                                          // Add animation to make the transition smoother
                                          target.classList.add('animate-pulse');
                                          setTimeout(() => {
                                            target.classList.remove('animate-pulse');
                                          }, 1000);
                                          
                                          // Add source branding
                                          const container = target.parentElement;
                                          if (container && !container.querySelector('.source-branding')) {
                                            // Create branding element
                                            const branding = document.createElement('div');
                                            branding.className = "source-branding absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm rounded-md px-2 py-1 text-white text-xs font-medium z-20";
                                            
                                            // Determine source icon and name
                                            let sourceIcon = "";
                                            let sourceName = "";
                                            
                                            if (item.url.includes('inquirer.net')) {
                                              sourceIcon = "🔍";
                                              sourceName = "Inquirer";
                                            } else if (item.url.includes('philstar.com')) {
                                              sourceIcon = "⭐";
                                              sourceName = "PhilStar";
                                            } else if (item.url.includes('abs-cbn.com')) {
                                              sourceIcon = "📡";
                                              sourceName = "ABS-CBN";
                                            } else if (item.url.includes('manilatimes.net')) {
                                              sourceIcon = "📰";
                                              sourceName = "ManilaT";
                                            } else if (item.url.includes('rappler.com')) {
                                              sourceIcon = "🌐";
                                              sourceName = "Rappler";
                                            } else if (item.url.includes('gmanetwork.com')) {
                                              sourceIcon = "📺";
                                              sourceName = "GMA";
                                            } else {
                                              sourceIcon = "📄";
                                              sourceName = "News";
                                            }
                                            
                                            branding.innerHTML = `${sourceIcon} ${sourceName}`;
                                            container.appendChild(branding);
                                          }
                                        };
                                        
                                        // Try loading the OpenGraph image
                                        target.src = ogImageUrl;
                                        return;
                                      }
                                    } catch (urlError) {
                                      console.error('Error generating OG URL:', urlError);
                                    }
                                    
                                    // If OG image generation failed, go straight to final fallback
                                    console.log('Using PanicSense logo ultimate fallback');
                                    target.src = '/images/fallback/panicsense-logo.svg';
                                    
                                    // Style the container with beautiful gradient
                                    const parentContainer = target.parentElement;
                                    if (parentContainer) {
                                      const placeholder = parentContainer.querySelector('.animate-pulse') as HTMLElement;
                                      if (placeholder) {
                                        // Make placeholder visible with nice animation
                                        placeholder.style.opacity = "0";
                                        setTimeout(() => {
                                          placeholder.style.opacity = "1";
                                          
                                          // Beautiful gradient based on source
                                          let gradientStyle = "";
                                          if (item.url.includes('inquirer.net')) {
                                            gradientStyle = "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)";
                                          } else if (item.url.includes('philstar.com')) {
                                            gradientStyle = "linear-gradient(135deg, #be123c 0%, #f87171 100%)";
                                          } else if (item.url.includes('abs-cbn.com')) {
                                            gradientStyle = "linear-gradient(135deg, #065f46 0%, #10b981 100%)";
                                          } else if (item.url.includes('manilatimes.net')) {
                                            gradientStyle = "linear-gradient(135deg, #713f12 0%, #f59e0b 100%)";
                                          } else if (item.url.includes('rappler.com')) {
                                            gradientStyle = "linear-gradient(135deg, #9f1239 0%, #f472b6 100%)";
                                          } else if (item.url.includes('gmanetwork.com')) {
                                            gradientStyle = "linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)";
                                          } else {
                                            gradientStyle = "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)";
                                          }
                                          
                                          placeholder.style.background = gradientStyle;
                                          
                                          // Remove spinner animation
                                          const loader = placeholder.querySelector('.animate-spin');
                                          if (loader) loader.remove();
                                          
                                          // Add pattern for visual interest
                                          placeholder.innerHTML += `<div class="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>`;
                                        }, 300);
                                      }
                                      
                                      // Add source branding
                                      if (!parentContainer.querySelector('.source-branding')) {
                                        // Create branding element
                                        const branding = document.createElement('div');
                                        branding.className = "source-branding absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm rounded-md px-2 py-1 text-white text-xs font-medium z-20";
                                        
                                        // Determine source icon and name
                                        let sourceIcon = "";
                                        let sourceName = "";
                                        
                                        if (item.url.includes('inquirer.net')) {
                                          sourceIcon = "🔍";
                                          sourceName = "Inquirer";
                                        } else if (item.url.includes('philstar.com')) {
                                          sourceIcon = "⭐";
                                          sourceName = "PhilStar";
                                        } else if (item.url.includes('abs-cbn.com')) {
                                          sourceIcon = "📡";
                                          sourceName = "ABS-CBN";
                                        } else if (item.url.includes('manilatimes.net')) {
                                          sourceIcon = "📰";
                                          sourceName = "ManilaT";
                                        } else if (item.url.includes('rappler.com')) {
                                          sourceIcon = "🌐";
                                          sourceName = "Rappler";
                                        } else if (item.url.includes('gmanetwork.com')) {
                                          sourceIcon = "📺";
                                          sourceName = "GMA";
                                        } else {
                                          sourceIcon = "📄";
                                          sourceName = "News";
                                        }
                                        
                                        branding.innerHTML = `${sourceIcon} ${sourceName}`;
                                        parentContainer.appendChild(branding);
                                      }
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70"></div>
                                <div className="absolute bottom-0 left-0 p-3 w-full">
                                  {/* Disaster type tags removed as requested */}
                                  <h3 className="text-white font-bold line-clamp-2 text-sm">
                                    {item.title}
                                  </h3>
                                </div>
                              </div>
                              
                              {/* Card Content */}
                              <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(item.timestamp)}
                                  </Badge>
                                </div>
                                <CardDescription className="text-xs">From: {item.source}</CardDescription>
                              </CardHeader>
                              
                              <CardContent className="py-3 flex-grow">
                                <p className="text-sm text-muted-foreground line-clamp-4">{item.content}</p>
                              </CardContent>
                              
                              <CardFooter className="pt-2 flex justify-between items-center bg-indigo-50/30">
                                <div className="text-xs font-medium text-indigo-800">{formatLocation(item.location)}</div>
                                <Button 
                                  size="sm" 
                                  className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-4" 
                                  asChild
                                >
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                    Read <ArrowUpRight className="h-3 w-3" />
                                  </a>
                                </Button>
                              </CardFooter>
                            </Card>
                          </motion.div>
                        ))}
                      </>
                    ) : (
                      <div className="col-span-3">
                        <Alert className="bg-indigo-50 border-indigo-200">
                          <AlertTriangle className="h-4 w-4 text-indigo-500" />
                          <AlertTitle>Walang updates</AlertTitle>
                          <AlertDescription>
                            Wala pang available na disaster-related news sa ngayon. Pakisubukang i-refresh sa ibang pagkakataon.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* GENERAL NEWS CAROUSEL - Hindi lang disaster news */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-12"
            >
              <div className="rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-[2px]">
                <div className="rounded-xl bg-white p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center text-pink-700">
                    <Newspaper className="h-5 w-5 mr-2" />
                    Latest Philippine News
                  </h2>
                  
                  {newsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader className="h-8 w-8 animate-spin text-pink-500" />
                    </div>
                  ) : !allNews.filter(item => item.title && item.content && !isDisasterRelated(item)).length ? (
                    <Alert className="bg-pink-50 border-pink-200">
                      <AlertTriangle className="h-4 w-4 text-pink-500" />
                      <AlertTitle>No general news available</AlertTitle>
                      <AlertDescription>
                        There are currently no general news articles available. Please check back later.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Carousel
                      className="w-full"
                      opts={{
                        align: "start",
                        loop: true,
                      }}
                    >
                      <CarouselContent>
                        {allNews
                         .filter(item => item.title && item.content && !isDisasterRelated(item))
                         .slice(0, 10)
                         .map((item, index) => (
                          <CarouselItem key={item.id || index} className="md:basis-1/2 lg:basis-1/3">
                            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                              {/* Card Image */}
                              <div className="w-full h-40 overflow-hidden relative">
                                {/* Loading placeholder - Hidden when image loads */}
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100 animate-pulse">
                                  <div className="flex items-center justify-center h-full">
                                    <Loader className="h-6 w-6 text-pink-400 animate-spin" />
                                  </div>
                                </div>
                                <img 
                                  src={getNewsImage(item)} 
                                  alt={item.title}
                                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 z-10 relative"
                                  loading="lazy"
                                  onLoad={(e) => {
                                    // Kapag na-load na ang image, alisin na ang placeholder
                                    const target = e.currentTarget.parentElement;
                                    if (target) {
                                      const placeholder = target.querySelector('div.animate-pulse');
                                      if (placeholder) placeholder.classList.add('hidden');
                                    }
                                  }}
                                  onError={(e) => {
                                    // Fallback with pretty gradient if image fails to load
                                    const target = e.currentTarget;
                                    const parentContainer = target.parentElement;
                                    
                                    if (parentContainer) {
                                      const placeholder = parentContainer.querySelector('.animate-pulse') as HTMLElement;
                                      if (placeholder) {
                                        placeholder.style.opacity = "1";
                                        
                                        // Different color scheme for general news
                                        let gradientStyle = "";
                                        if (item.url.includes('inquirer.net')) {
                                          gradientStyle = "linear-gradient(135deg, #701a75 0%, #db2777 100%)";
                                        } else if (item.url.includes('philstar.com')) {
                                          gradientStyle = "linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)";
                                        } else if (item.url.includes('abs-cbn.com')) {
                                          gradientStyle = "linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)";
                                        } else if (item.url.includes('manilatimes.net')) {
                                          gradientStyle = "linear-gradient(135deg, #c2410c 0%, #fb923c 100%)";
                                        } else if (item.url.includes('rappler.com')) {
                                          gradientStyle = "linear-gradient(135deg, #b91c1c 0%, #f87171 100%)";
                                        } else if (item.url.includes('gmanetwork.com')) {
                                          gradientStyle = "linear-gradient(135deg, #5b21b6 0%, #c084fc 100%)";
                                        } else {
                                          gradientStyle = "linear-gradient(135deg, #be185d 0%, #ec4899 100%)";
                                        }
                                        
                                        placeholder.style.background = gradientStyle;
                                        
                                        // Add source label
                                        const branding = document.createElement('div');
                                        branding.className = "absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm rounded-md px-2 py-1 text-white text-xs font-medium z-20";
                                        
                                        let sourceIcon = "";
                                        let domain = "";
                                        
                                        if (item.url.includes('inquirer.net')) {
                                          sourceIcon = "🔍";
                                          domain = "Inquirer";
                                        } else if (item.url.includes('philstar.com')) {
                                          sourceIcon = "⭐";
                                          domain = "PhilStar";
                                        } else if (item.url.includes('abs-cbn.com')) {
                                          sourceIcon = "📡";
                                          domain = "ABS-CBN";
                                        } else if (item.url.includes('manilatimes.net')) {
                                          sourceIcon = "📰";
                                          domain = "ManilaT";
                                        } else if (item.url.includes('rappler.com')) {
                                          sourceIcon = "🌐";
                                          domain = "Rappler";
                                        } else if (item.url.includes('gmanetwork.com')) {
                                          sourceIcon = "📺";
                                          domain = "GMA";
                                        } else {
                                          sourceIcon = "📄";
                                          domain = "News";
                                        }
                                        
                                        branding.innerHTML = `${sourceIcon} ${domain}`;
                                        parentContainer.appendChild(branding);
                                        
                                        // Remove spinner
                                        const loader = placeholder.querySelector('.animate-spin');
                                        if (loader) loader.remove();
                                        
                                        // Add pattern overlay
                                        placeholder.innerHTML += `<div class="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>`;
                                      }
                                      
                                      // Hide failed image
                                      target.style.opacity = "0";
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70"></div>
                                <h3 className="absolute bottom-0 left-0 p-3 text-white font-bold text-sm line-clamp-2">{item.title}</h3>
                              </div>
                              
                              <CardContent className="py-3 flex-grow">
                                <p className="text-xs text-muted-foreground line-clamp-3">{item.content}</p>
                              </CardContent>
                              
                              <CardFooter className="pt-0 flex justify-between items-center">
                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(item.timestamp)}
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                                  asChild
                                >
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                    Read <ArrowUpRight className="h-3 w-3" />
                                  </a>
                                </Button>
                              </CardFooter>
                            </Card>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="bg-pink-500/70 hover:bg-pink-500 border-none text-white" />
                      <CarouselNext className="bg-pink-500/70 hover:bg-pink-500 border-none text-white" />
                    </Carousel>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </div>

      {/* CSS Animations */}
      <style>
        {`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient {
          animation: gradient 15s ease infinite;
          background-size: 400% 400%;
        }
        
        .animate-border {
          animation: border 4s ease infinite;
        }
        
        @keyframes border {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Smooth transition for the loading placeholders */
        .animate-pulse {
          transition: opacity 0.5s ease-out;
        }
        
        .opacity-0 {
          opacity: 0;
        }
        `}
      </style>
    </div>
  );
}