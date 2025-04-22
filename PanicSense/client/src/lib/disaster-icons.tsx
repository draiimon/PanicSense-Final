import React from "react";
import { 
  Activity, 
  Waves, 
  CloudLightning, 
  Flame, 
  Mountain, 
  Droplets,
  InfoIcon,
  MapPin
} from "lucide-react";

/**
 * Get a standardized icon for a disaster type to ensure consistency across the application
 * @param type The disaster type string
 * @returns React component for the appropriate icon
 */
export const getDisasterIcon = (type: string | null | undefined, options?: { className?: string }) => {
  const className = options?.className || "h-5 w-5";
  
  if (!type) return <MapPin className={className} />;
  
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('earthquake') || lowerType.includes('quake') || lowerType.includes('lindol')) {
    return <Activity className={className} />;
  } else if (lowerType.includes('flood') || lowerType.includes('baha') || lowerType.includes('tubig')) {
    return <Waves className={className} />;
  } else if (lowerType.includes('typhoon') || lowerType.includes('storm') || lowerType.includes('bagyo')) {
    return <CloudLightning className={className} />;
  } else if (lowerType.includes('fire') || lowerType.includes('sunog') || lowerType.includes('apoy')) {
    return <Flame className={className} />;
  } else if (lowerType.includes('volcano') || lowerType.includes('bulkan') || lowerType.includes('eruption')) {
    return <Mountain className={className} />;
  } else if (lowerType.includes('landslide') || lowerType.includes('mudslide') || lowerType.includes('guho')) {
    // Custom SVG for landslide since no perfect icon exists in Lucide
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none"
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={className}
      >
        <path d="M17 14l-5.34-5.34a1 1 0 0 0-1.41 0L3 16" />
        <path d="M7 14l5.34-5.34a1 1 0 0 1 1.41 0L21 16" />
        <path d="M12 2v2" />
        <path d="M4 15l2 1v6" />
        <path d="M18 15l-2 1v6" />
      </svg>
    );
  } else if (lowerType.includes('drought') || lowerType.includes('tagtuyot') || lowerType.includes('dry')) {
    return <Droplets className={className} />;
  } else {
    return <InfoIcon className={className} />;
  }
};

/**
 * Get a smaller version of the disaster icon for use in compact layouts
 * @param type The disaster type string  
 * @returns React component for the appropriate icon in small size
 */
export const getSmallDisasterIcon = (type: string | null | undefined) => {
  if (!type) return <MapPin className="h-4 w-4" />;
  
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('earthquake') || lowerType.includes('quake') || lowerType.includes('lindol')) {
    return <Activity className="h-4 w-4" />;
  } else if (lowerType.includes('flood') || lowerType.includes('baha') || lowerType.includes('tubig')) {
    return <Waves className="h-4 w-4" />;
  } else if (lowerType.includes('typhoon') || lowerType.includes('storm') || lowerType.includes('bagyo')) {
    return <CloudLightning className="h-4 w-4" />;
  } else if (lowerType.includes('fire') || lowerType.includes('sunog') || lowerType.includes('apoy')) {
    return <Flame className="h-4 w-4" />;
  } else if (lowerType.includes('volcano') || lowerType.includes('bulkan') || lowerType.includes('eruption')) {
    return <Mountain className="h-4 w-4" />;
  } else if (lowerType.includes('landslide') || lowerType.includes('mudslide') || lowerType.includes('guho')) {
    // Custom SVG for landslide since no perfect icon exists in Lucide
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none"
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M17 14l-5.34-5.34a1 1 0 0 0-1.41 0L3 16" />
        <path d="M7 14l5.34-5.34a1 1 0 0 1 1.41 0L21 16" />
        <path d="M12 2v2" />
        <path d="M4 15l2 1v6" />
        <path d="M18 15l-2 1v6" />
      </svg>
    );
  } else if (lowerType.includes('drought') || lowerType.includes('tagtuyot') || lowerType.includes('dry')) {
    return <Droplets className="h-4 w-4" />;
  } else {
    return <InfoIcon className="h-4 w-4" />;
  }
};