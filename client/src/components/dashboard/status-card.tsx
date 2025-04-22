import { ReactNode, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  Droplets, 
  Flame, 
  Mountain, 
  AlertTriangle, 
  Wind, 
  Waves, 
  BarChart, 
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Zap,
  Loader2,
  Activity,
  Heart,
  TrendingUp,
  Info,
  Shield
} from 'lucide-react';
import { getDisasterTypeColor, getSentimentColor } from '@/lib/colors';

export interface StatusCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: string;
    isUpward: boolean | null;
    label: string;
  };
  isLoading?: boolean;
  sentimentPercentages?: Record<string, number>;
  disasterPercentages?: Record<string, number>;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'alert-triangle': return AlertTriangle;
    case 'bar-chart': return BarChart;
    case 'activity': return Activity;
    case 'check-circle': return CheckCircle;
    case 'heart': return Heart;
    case 'trending-up': return TrendingUp;
    case 'typhoon': case 'storm': return Wind;
    case 'flood': return Droplets;
    case 'fire': return Flame;
    case 'landslide': return Mountain;
    case 'earthquake': return AlertTriangle;
    case 'volcano': case 'eruption': return Flame;
    case 'tsunami': return Waves;
    default: return Info;
  }
};

// Card color schemes
const colorSchemes = {
  activeDisasters: {
    bg: 'from-red-500 to-orange-500',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    trendColor: 'text-white/80'
  },
  analyzedPosts: {
    bg: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    trendColor: 'text-white/80'
  },
  dominantSentiment: {
    bg: 'from-gray-500 to-gray-600',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    trendColor: 'text-white/80'
  },
  dominantDisaster: {
    bg: 'from-purple-600 to-indigo-700',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    trendColor: 'text-white/80'
  },
  default: {
    bg: 'from-gray-700 to-gray-800',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    trendColor: 'text-white/80'
  }
};

export function StatusCard({ 
  title, 
  value, 
  icon, 
  trend, 
  isLoading = false,
  sentimentPercentages,
  disasterPercentages
}: StatusCardProps) {
  // State for hover effects
  const [isHovered, setIsHovered] = useState(false);
  // Determine icon and color scheme
  let IconComponent;
  let scheme;
  let hasCustomIcon = false;
  
  // Set color scheme and icon based on card type
  switch (title) {
    case 'Active Disasters':
      IconComponent = getIconComponent('alert-triangle');
      scheme = colorSchemes.activeDisasters;
      break;
    case 'Analyzed Posts':
      IconComponent = getIconComponent('bar-chart');
      scheme = colorSchemes.analyzedPosts;
      break;
    case 'Dominant Sentiment':
      IconComponent = getIconComponent('heart');
      scheme = colorSchemes.dominantSentiment;
      break;
    case 'Dominant Disaster':
      // Use specific disaster-related icon if provided, fallback to Flame
      IconComponent = icon ? getIconComponent(icon.toLowerCase()) : getIconComponent('flame');
      scheme = colorSchemes.dominantDisaster;
      hasCustomIcon = true;
      break;
    default:
      IconComponent = icon ? getIconComponent(icon) : getIconComponent('info');
      scheme = colorSchemes.default;
      hasCustomIcon = !!icon;
  }

  // Animation states
  const [iconAnimating, setIconAnimating] = useState(false);

  // Value animation
  const [displayValue, setDisplayValue] = useState('0');
  
  useEffect(() => {
    // Animate value counting up
    if (!isLoading && value !== undefined) {
      const numericValue = parseInt(value.toString());
      if (!isNaN(numericValue)) {
        let startValue = 0;
        const incrementValue = Math.max(1, Math.ceil(numericValue / 30));
        const intervalTime = 1000 / 30; // 30fps
        
        const timer = setInterval(() => {
          startValue += incrementValue;
          if (startValue >= numericValue) {
            setDisplayValue(numericValue.toString());
            clearInterval(timer);
          } else {
            setDisplayValue(startValue.toString());
          }
        }, intervalTime);
        
        return () => clearInterval(timer);
      } else {
        setDisplayValue(value.toString());
      }
    }
  }, [value, isLoading]);

  // Icon animation effect
  useEffect(() => {
    // Periodically animate the icon
    const iconTimer = setInterval(() => {
      setIconAnimating(true);
      setTimeout(() => setIconAnimating(false), 1000);
    }, 5000);
    
    return () => clearInterval(iconTimer);
  }, []);

  // Get dynamic color for Dominant Sentiment card
  let sentimentColor = '';
  
  // If this is the Dominant Sentiment card, update the color scheme based on the sentiment
  if (title === 'Dominant Sentiment' && typeof value === 'string') {
    const sentiment = value;
    
    // Map the sentiment to a Tailwind color class rather than using hex colors
    let gradientClass = 'from-gray-500 to-gray-600'; // Default
    
    switch (sentiment) {
      case 'Panic':
        gradientClass = 'from-red-500 to-red-700';
        break;
      case 'Fear/Anxiety':
        gradientClass = 'from-orange-500 to-orange-700';
        break;
      case 'Disbelief':
        gradientClass = 'from-purple-500 to-purple-700';
        break;
      case 'Resilience':
        gradientClass = 'from-emerald-500 to-emerald-700';
        break;
      case 'Neutral':
      default:
        gradientClass = 'from-slate-500 to-slate-700';
        break;
    }
    
    // Update the color scheme with the tailwind gradient class
    scheme = {
      ...scheme,
      bg: gradientClass,
    };
  }
  
  // If this is the Dominant Disaster card, update the color scheme based on the disaster type
  if (title === 'Dominant Disaster' && typeof value === 'string') {
    const disasterType = value.toLowerCase();
    
    // Map the disaster type to a Tailwind color class
    let gradientClass = 'from-purple-600 to-indigo-700'; // Default
    
    if (disasterType.includes('flood')) {
      gradientClass = 'from-blue-500 to-blue-700';
    } else if (disasterType.includes('typhoon') || disasterType.includes('storm')) {
      gradientClass = 'from-blue-900 to-indigo-950'; // Darkened to match the #1e3a8a color standard
    } else if (disasterType.includes('fire')) {
      gradientClass = 'from-orange-500 to-orange-700';
    } else if (disasterType.includes('volcano') || disasterType.includes('eruption')) {
      gradientClass = 'from-red-500 to-red-700';
    } else if (disasterType.includes('earthquake')) {
      gradientClass = 'from-amber-700 to-amber-900';
    } else if (disasterType.includes('landslide')) {
      gradientClass = 'from-amber-800 to-amber-950';
    }
    
    // Update the color scheme with the tailwind gradient class
    scheme = {
      ...scheme,
      bg: gradientClass,
    };
  }

  // Card animation variants (no hover effect)
  const cardVariants = {
    initial: { scale: 1 },
    animate: { scale: 1 }
  };
  
  // Icon animation variants
  const iconVariants = {
    initial: { scale: 1, rotate: 0 },
    animate: { 
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
      transition: { duration: 1 } 
    }
  };
  
  // Content animation variants
  const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  
  // Background animation
  const backgroundVariants = {
    initial: { 
      backgroundPosition: "0% 0%",
    },
    animate: { 
      backgroundPosition: ["0% 0%", "100% 100%"]
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={cardVariants}
    >
      <Card 
        className="overflow-hidden shadow-lg border-none transition-all duration-300 group h-[200px] bg-transparent"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`h-full flex flex-col relative overflow-hidden rounded-xl ${isHovered ? 'shadow-inner' : ''}`}>
          {/* Gradient background with hover effect */}
          <div className={`absolute inset-0 bg-gradient-to-br ${scheme.bg} opacity-90 transition-all duration-300 ${isHovered ? 'opacity-100 bg-gradient-to-tl' : ''}`}></div>
          
          {/* Pattern overlay with hover effect */}
          <div className={`absolute inset-0 opacity-10 transition-opacity duration-300 ${isHovered ? 'opacity-20' : ''}`}></div>
          
          {/* Additional hover effect overlay */}
          <motion.div 
            className="absolute inset-0 bg-white/5 opacity-0 transition-opacity duration-300"
            animate={{ opacity: isHovered ? 0.1 : 0 }}
          ></motion.div>
          
          {/* Hover info panel for sentiment and disaster cards */}
          {isHovered && (title === "Dominant Sentiment" || title === "Dominant Disaster") && (
            <motion.div 
              className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg p-3 z-20"
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-xs text-white font-medium mb-1">
                {title === "Dominant Sentiment" ? "Sentiment Distribution" : "Disaster Distribution"}
              </div>
              <div className="space-y-1.5">
                {title === "Dominant Sentiment" && sentimentPercentages && (
                  <>
                    {Object.entries(sentimentPercentages)
                      .sort(([_, a], [__, b]) => b - a)
                      .slice(0, 4)
                      .map(([sentiment, percentage]) => {
                        // Get a color based on sentiment
                        let bgColor = "bg-gray-400";
                        if (sentiment.toLowerCase().includes("panic")) bgColor = "bg-red-400";
                        else if (sentiment.toLowerCase().includes("fear") || sentiment.toLowerCase().includes("anxiety")) bgColor = "bg-orange-400";
                        else if (sentiment.toLowerCase().includes("disbelief")) bgColor = "bg-purple-400";
                        else if (sentiment.toLowerCase().includes("resilience")) bgColor = "bg-emerald-400";
                        else if (sentiment.toLowerCase().includes("neutral")) bgColor = "bg-slate-400";
                        
                        return (
                          <div key={sentiment} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${bgColor}`}></div>
                              <span className="text-xs text-white/90">{sentiment}</span>
                            </div>
                            <span className="text-xs text-white/80">{Math.round(percentage)}%</span>
                          </div>
                        );
                      })
                    }
                    {(!sentimentPercentages || Object.keys(sentimentPercentages).length === 0) && (
                      <div className="text-xs text-white/60">No sentiment data available</div>
                    )}
                  </>
                )}
                
                {title === "Dominant Disaster" && disasterPercentages && (
                  <>
                    {Object.entries(disasterPercentages)
                      .sort(([_, a], [__, b]) => b - a)
                      .slice(0, 4)
                      .map(([disaster, percentage]) => {
                        // Get a color based on disaster type
                        let bgColor = "bg-gray-400";
                        if (disaster.toLowerCase().includes("flood")) bgColor = "bg-blue-400";
                        else if (disaster.toLowerCase().includes("typhoon") || disaster.toLowerCase().includes("storm")) bgColor = "bg-blue-900";
                        else if (disaster.toLowerCase().includes("fire")) bgColor = "bg-red-400";
                        else if (disaster.toLowerCase().includes("volcano") || disaster.toLowerCase().includes("eruption")) bgColor = "bg-red-500";
                        else if (disaster.toLowerCase().includes("earthquake")) bgColor = "bg-amber-500";
                        else if (disaster.toLowerCase().includes("landslide")) bgColor = "bg-amber-700";
                        
                        return (
                          <div key={disaster} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${bgColor}`}></div>
                              <span className="text-xs text-white/90">{disaster}</span>
                            </div>
                            <span className="text-xs text-white/80">{Math.round(percentage)}%</span>
                          </div>
                        );
                      })
                    }
                    {(!disasterPercentages || Object.keys(disasterPercentages).length === 0) && (
                      <div className="text-xs text-white/60">No disaster data available</div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Content */}
          <CardContent className="p-4 relative z-10 h-full flex flex-col">
            {isLoading ? (
              <div className="flex flex-col space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-white/20 rounded"></div>
                    <div className="h-6 w-16 bg-white/20 rounded"></div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-white/20"></div>
                </div>
                <div className="h-3 w-32 bg-white/20 rounded mt-2"></div>
              </div>
            ) : (
              <motion.div
                variants={contentVariants}
                initial="initial"
                animate="animate"
                className="h-full flex flex-col"
              >
                {/* Icon and title */}
                <div className="flex justify-between items-start mb-2">
                  <motion.div 
                    className={`w-14 h-14 rounded-full ${scheme.iconBg} flex items-center justify-center shadow-lg`}
                    variants={iconVariants}
                    animate={iconAnimating ? "animate" : "initial"}
                  >
                    <IconComponent className={`h-7 w-7 ${scheme.iconColor}`} />
                  </motion.div>
                  <p className={`text-sm font-medium uppercase tracking-wider opacity-90 ${scheme.textColor}`}>{title}</p>
                </div>
                
                {/* Value with animation */}
                <div className="mt-2">
                  <div className="flex items-center">
                    <motion.h3 
                      className={`text-4xl font-bold tracking-tight ${scheme.textColor} mr-1`}
                      style={sentimentColor ? { color: sentimentColor } : {}}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {displayValue}
                    </motion.h3>
                    
                    {/* Animated sparkles or bubbles around the value */}
                    <motion.div 
                      className="relative" 
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      transition={{delay: 0.5}}
                    >
                      {/* Removed +2% badge for better performance */}
                    </motion.div>
                  </div>
                  
                  {/* Subtitle with details - more compact */}
                  {title === "Model Accuracy" && (
                    <motion.div 
                      className="inline-flex items-center gap-1 bg-blue-500/10 rounded-full px-2 py-0.5 mt-1"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="text-[10px] font-medium text-blue-300">Deep learning</span>
                    </motion.div>
                  )}
                  
                  {title === "Analyzed Posts" && (
                    <motion.div 
                      className="inline-flex items-center gap-1 bg-blue-500/10 rounded-full px-2 py-0.5 mt-1"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="text-[10px] font-medium text-blue-300">15 events</span>
                    </motion.div>
                  )}
                  
                  {title === "Dominant Sentiment" && (
                    <motion.div 
                      className="inline-flex items-center gap-1 bg-blue-500/10 rounded-full px-2 py-0.5 mt-1"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="text-[10px] font-medium text-blue-300">{trend?.value}</span>
                    </motion.div>
                  )}
                  
                  {title === "Dominant Disaster" && (
                    <motion.div 
                      className="inline-flex items-center gap-1 bg-indigo-500/10 rounded-full px-2 py-0.5 mt-1"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="text-[10px] font-medium text-indigo-300">{trend?.value}</span>
                    </motion.div>
                  )}
                </div>
                
                {/* Trend with hover effect */}
                {trend && (
                  <div className="mt-auto pt-4">
                    <motion.div 
                      className={`flex items-center gap-2 transition-all duration-300 ${isHovered ? 'transform scale-105' : ''}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      {trend.isUpward !== null && (
                        <div className={`flex items-center justify-center px-2.5 py-1 rounded-full ${trend.isUpward ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          <motion.div
                            className="flex items-center"
                            animate={{ y: trend.isUpward ? [-1, -2, -1] : [1, 2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                          >
                            {trend.isUpward ? (
                              <ArrowUp className={`h-3.5 w-3.5 mr-1 text-green-400`} />
                            ) : (
                              <ArrowDown className={`h-3.5 w-3.5 mr-1 text-red-400`} />
                            )}
                            <span className={`text-sm font-medium ${trend.isUpward ? 'text-green-400' : 'text-red-400'}`}>
                              {trend.value}
                            </span>
                          </motion.div>
                        </div>
                      )}
                      {trend.isUpward === null && (
                        <div className={`flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-500/10`}>
                          <span className={`text-sm font-medium text-blue-400`}>{trend.value}</span>
                        </div>
                      )}
                      <span className={`text-xs ${scheme.trendColor}`}>{trend.label}</span>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}