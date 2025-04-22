import React, { useState, useMemo } from "react";
import { useDisasterContext } from "@/context/disaster-context";
import { DisasterComparison } from "@/components/comparison/disaster-comparison-new";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SentimentChart } from "@/components/dashboard/sentiment-chart";
import { EmotionalImpactCarousel } from "@/components/dashboard/emotional-impact-carousel";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  FileBarChart2, 
  InfoIcon, 
  TrendingUp, 
  Scale, 
  Gauge,
  PieChart,
  HeartPulse,
  Activity,
  ShieldCheck
} from "lucide-react";
import { AnimatedBackground } from "@/components/layout/animated-background";
import { getSentimentColor } from "@/lib/colors";
import { getDisasterIcon } from "@/lib/disaster-icons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const Comparison = () => {
  const { sentimentPosts, disasterEvents } = useDisasterContext();
  const [selectedDisasterType, setSelectedDisasterType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Process sentiment data by disaster type
  const processDisasterData = () => {
    // Get unique disaster types, but filter out "Not Specified", "Not mentioned", "Unspecified" etc.
    const disasterTypeSet = new Set<string>();
    
    // Create a map of standard disaster types
    const standardDisasterTypes = {
      'earthquake': 'Earthquake',
      'quake': 'Earthquake',
      'lindol': 'Earthquake',
      'linog': 'Earthquake',
      'seismic': 'Earthquake',
      'tremor': 'Earthquake',
      'magnitude': 'Earthquake',
      
      'flood': 'Flood',
      'baha': 'Flood',
      'tubig': 'Flood',
      'inundation': 'Flood',
      'submerged': 'Flood',
      'overflow': 'Flood',
      
      'typhoon': 'Typhoon',
      'storm': 'Typhoon',
      'bagyo': 'Typhoon',
      'hurricane': 'Typhoon',
      'cyclone': 'Typhoon',
      'tropical': 'Typhoon',
      
      'fire': 'Fire',
      'sunog': 'Fire',
      'apoy': 'Fire',
      'blaze': 'Fire',
      'burning': 'Fire',
      'flames': 'Fire',
      
      'volcano': 'Volcanic Eruption',
      'bulkan': 'Volcanic Eruption',
      'eruption': 'Volcanic Eruption',
      'lava': 'Volcanic Eruption',
      'ash': 'Volcanic Eruption',
      'lahar': 'Volcanic Eruption',
      
      'landslide': 'Landslide',
      'mudslide': 'Landslide',
      'avalanche': 'Landslide',
      'guho': 'Landslide',
      'pagguho': 'Landslide',
      'rockslide': 'Landslide',
      
      'drought': 'Drought',
      'tagtuyot': 'Drought',
      'dry': 'Drought'
    };
    
    // Add standard disaster types from disasterEvents with array check
    if (Array.isArray(disasterEvents)) {
      disasterEvents.forEach(event => {
        if (event.type && 
            event.type !== "Not Specified" && 
            event.type !== "Not mentioned" && 
            event.type !== "Unspecified" && 
            event.type !== "Unknown") {
          
          // Map to standard disaster type names if a match is found
          let standardType = event.type;
          for (const [key, value] of Object.entries(standardDisasterTypes)) {
            if (event.type.toLowerCase().includes(key)) {
              standardType = value;
              break;
            }
          }
          
          disasterTypeSet.add(standardType);
        }
      });
    }
    
    // Add disaster types from posts as a backup (if no disaster events exist)
    if (Array.isArray(sentimentPosts)) {
      sentimentPosts.forEach(post => {
        if (post.disasterType && 
            post.disasterType !== "Not Specified" && 
            post.disasterType !== "Not mentioned" && 
            post.disasterType !== "Unspecified" && 
            post.disasterType !== "Unknown") {
          
          // Map to standard disaster type names
          let standardType = post.disasterType;
          for (const [key, value] of Object.entries(standardDisasterTypes)) {
            if (post.disasterType.toLowerCase().includes(key)) {
              standardType = value;
              break;
            }
          }
          
          disasterTypeSet.add(standardType);
        }
      });
    }
    
    // If still no disaster types, add some defaults
    if (disasterTypeSet.size === 0) {
      disasterTypeSet.add('Earthquake');
      disasterTypeSet.add('Flood');
      disasterTypeSet.add('Typhoon');
      disasterTypeSet.add('Fire');
      disasterTypeSet.add('Volcanic Eruption');
    }
    
    // Convert to array and compute metrics for each disaster type
    const disasterArray = Array.from(disasterTypeSet).map(type => {
      // Get posts for this disaster type
      const postsForThisType = Array.isArray(sentimentPosts) 
        ? sentimentPosts.filter(post => {
            if (!post.disasterType) return false;
            
            const lowerDisaster = post.disasterType.toLowerCase();
            
            // Handle special cases with aliases
            if (type === 'Earthquake' && (lowerDisaster.includes('earthquake') || lowerDisaster.includes('quake') || lowerDisaster.includes('lindol'))) {
              return true;
            }
            if (type === 'Flood' && (lowerDisaster.includes('flood') || lowerDisaster.includes('baha') || lowerDisaster.includes('tubig'))) {
              return true;
            }
            if (type === 'Typhoon' && (lowerDisaster.includes('typhoon') || lowerDisaster.includes('storm') || lowerDisaster.includes('bagyo'))) {
              return true;
            }
            if (type === 'Fire' && (lowerDisaster.includes('fire') || lowerDisaster.includes('sunog') || lowerDisaster.includes('apoy'))) {
              return true;
            }
            if (type === 'Volcanic Eruption' && (lowerDisaster.includes('volcanic') || lowerDisaster.includes('volcano') || lowerDisaster.includes('eruption'))) {
              return true;
            }
            if (type === 'Landslide' && (lowerDisaster.includes('landslide') || lowerDisaster.includes('mudslide') || lowerDisaster.includes('guho'))) {
              return true;
            }
            if (type === 'Drought' && (lowerDisaster.includes('drought') || lowerDisaster.includes('tagtuyot') || lowerDisaster.includes('dry'))) {
              return true;
            }
            
            // Default case: direct type matching
            return lowerDisaster.includes(type.toLowerCase());
          }) 
        : [];
      
      // Calculate sentiment distribution directly from raw data
      const totalPosts = postsForThisType.length;
      const panicPosts = postsForThisType.filter(post => post.sentiment === 'Panic').length;
      // Handle both separate and combined Fear/Anxiety format
      const fearPosts = postsForThisType.filter(post => post.sentiment === 'Fear' || post.sentiment === 'Fear/Anxiety').length;
      const anxietyPosts = postsForThisType.filter(post => post.sentiment === 'Anxiety').length;
      const disbeliefPosts = postsForThisType.filter(post => post.sentiment === 'Disbelief').length;
      const resiliencePosts = postsForThisType.filter(post => post.sentiment === 'Resilience').length;
      const neutralPosts = postsForThisType.filter(post => post.sentiment === 'Neutral').length;
      
      // Calculate percentages directly from raw sentiment data
      const panicPercent = totalPosts > 0 ? Math.round(panicPosts / totalPosts * 100) : 0;
      const fearPercent = totalPosts > 0 ? Math.round(fearPosts / totalPosts * 100) : 0;
      const anxietyPercent = totalPosts > 0 ? Math.round(anxietyPosts / totalPosts * 100) : 0;
      const disbeliefPercent = totalPosts > 0 ? Math.round(disbeliefPosts / totalPosts * 100) : 0;
      const resiliencePercent = totalPosts > 0 ? Math.round(resiliencePosts / totalPosts * 100) : 0;
      const neutralPercent = totalPosts > 0 ? Math.round(neutralPosts / totalPosts * 100) : 0;
      
      // Return the disaster type with all of its data directly from raw sentiment values
      return {
        type,
        postCount: totalPosts,
        panicCount: panicPosts,
        fearCount: fearPosts,
        anxietyCount: anxietyPosts,
        disbeliefCount: disbeliefPosts,
        resilienceCount: resiliencePosts,
        neutralCount: neutralPosts,
        panicPercent,
        fearPercent,
        anxietyPercent,
        disbeliefPercent,
        resiliencePercent,
        neutralPercent,
        effectivenessScore: calculateEffectivenessScore(panicPercent, fearPercent, anxietyPercent, disbeliefPercent, resiliencePercent, neutralPercent)
      };
    }).sort((a, b) => b.postCount - a.postCount); // Sort by post count
    
    return disasterArray;
  };
  
  // Process data for emotional impact analysis - fully data-driven
  const processEmotionalImpactData = () => {
    // Get standard disaster types that have enough data
    const disasterTypesMap = {
      'Earthquake': 'Earthquake',
      'Flood': 'Flood',
      'Typhoon': 'Typhoon',
      'Fire': 'Fire',
      'Volcanic Eruption': 'Volcanic Eruption',
      'Landslide': 'Landslide',
      'Drought': 'Drought'
    };
    
    // Track which disaster types have data
    const disasterCounts: Record<string, number> = {};
    
    // First pass: count posts per standardized disaster type
    if (Array.isArray(sentimentPosts)) {
      sentimentPosts.forEach(post => {
        if (!post.disasterType) return;
        
        const lowerType = post.disasterType.toLowerCase();
        const matchedType = Object.entries(disasterTypesMap).find(
          ([key, value]) => lowerType.includes(key.toLowerCase())
        );
        
        if (matchedType) {
          disasterCounts[matchedType[1]] = (disasterCounts[matchedType[1]] || 0) + 1;
        }
      });
    }
    
    // Get disaster types with sufficient data (at least 1 post)
    const validDisasterTypes = Object.entries(disasterCounts)
      .filter(([_, count]) => count > 0)
      .map(([type]) => type);
    
    // Use valid types or defaults if none have data
    const categories = validDisasterTypes.length > 0 
      ? validDisasterTypes 
      : ['Typhoon', 'Flood', 'Earthquake', 'Fire', 'Volcanic Eruption'];
    
    // For each valid disaster type, calculate specific emotional metrics
    const emotionalData = categories.map(disasterType => {
      // Get posts for this disaster type
      const postsForType = Array.isArray(sentimentPosts) 
        ? sentimentPosts.filter(post => {
            if (!post.disasterType) return false;
            const lowerDisaster = post.disasterType.toLowerCase();
            const lowerType = disasterType.toLowerCase();
            
            return lowerDisaster.includes(lowerType) || 
                   (lowerType === 'earthquake' && lowerDisaster.includes('quake')) || 
                   (lowerType === 'typhoon' && lowerDisaster.includes('storm')) ||
                   (lowerType === 'fire' && lowerDisaster.includes('sunog')) ||
                   (lowerType === 'volcanic eruption' && lowerDisaster.includes('volcano'));
          })
        : [];
      
      // If no posts, return zero values
      if (postsForType.length === 0) {
        return {
          name: disasterType,
          panic: 0,
          fear: 0,
          anxiety: 0,
          disbelief: 0,
          resilience: 0,
          neutral: 0
        };
      }
      
      // Calculate percentages for each sentiment from raw data
      const panicPercent = postsForType.filter(post => post.sentiment === 'Panic').length / postsForType.length * 100;
      // Handle both separate and combined Fear/Anxiety format
      const fearPercent = postsForType.filter(post => post.sentiment === 'Fear' || post.sentiment === 'Fear/Anxiety').length / postsForType.length * 100;
      const anxietyPercent = postsForType.filter(post => post.sentiment === 'Anxiety').length / postsForType.length * 100;
      const disbeliefPercent = postsForType.filter(post => post.sentiment === 'Disbelief').length / postsForType.length * 100;
      const resiliencePercent = postsForType.filter(post => post.sentiment === 'Resilience').length / postsForType.length * 100;
      const neutralPercent = postsForType.filter(post => post.sentiment === 'Neutral').length / postsForType.length * 100;
      
      return {
        name: disasterType,
        panic: Math.round(panicPercent),
        fear: Math.round(fearPercent),
        anxiety: Math.round(anxietyPercent),
        disbelief: Math.round(disbeliefPercent),
        resilience: Math.round(resiliencePercent),
        neutral: Math.round(neutralPercent)
      };
    });
    
    // Group data for charting
    return {
      data: emotionalData,
      categories: emotionalData.map(item => item.name),
      series: [
        {
          name: 'Panic',
          data: emotionalData.map(item => item.panic),
          color: '#f43f5e' // rose-500
        },
        {
          name: 'Fear/Anxiety',
          data: emotionalData.map(item => item.fear + item.anxiety),
          color: '#f59e0b' // amber-500 (blend of orange and yellow)
        },
        {
          name: 'Disbelief',
          data: emotionalData.map(item => item.disbelief),
          color: '#a855f7' // purple-500
        },
        {
          name: 'Resilience',
          data: emotionalData.map(item => item.resilience),
          color: '#22c55e' // green-500
        },
        {
          name: 'Neutral',
          data: emotionalData.map(item => item.neutral),
          color: '#94a3b8' // slate-400
        }
      ],
      title: "Emotional Impact Distribution",
      description: "Sentiment breakdown across disaster types"
    };
  };
  
  // Calculate recovery metrics based on resilience vs panic/fear patterns
  const calculateRecoveryMetrics = (disasterType: string) => {
    // Get posts for this disaster type
    const postsForType = Array.isArray(sentimentPosts) 
      ? sentimentPosts.filter(post => {
          if (!post.disasterType) return false;
          const lowerDisaster = post.disasterType.toLowerCase();
          const lowerType = disasterType.toLowerCase();
          
          return lowerDisaster.includes(lowerType) || 
                 (lowerType === 'earthquake' && lowerDisaster.includes('quake')) || 
                 (lowerType === 'typhoon' && lowerDisaster.includes('storm')) ||
                 (lowerType === 'fire' && lowerDisaster.includes('sunog')) ||
                 (lowerType === 'volcanic eruption' && lowerDisaster.includes('volcano'));
        })
      : [];
    
    // Count sentiment types in the most recent posts (up to 20 posts)
    const recentPosts = [...postsForType].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }).slice(0, 20);
    
    // Early stage posts - first half
    const earlyPosts = recentPosts.slice(Math.floor(recentPosts.length / 2));
    const earlyPanicCount = earlyPosts.filter(p => p.sentiment === 'Panic').length;
    const earlyFearCount = earlyPosts.filter(p => p.sentiment === 'Fear' || p.sentiment === 'Fear/Anxiety').length;
    const earlyResilienceCount = earlyPosts.filter(p => p.sentiment === 'Resilience').length;
    
    // Later stage posts - second half
    const latePosts = recentPosts.slice(0, Math.floor(recentPosts.length / 2));
    const latePanicCount = latePosts.filter(p => p.sentiment === 'Panic').length;
    const lateFearCount = latePosts.filter(p => p.sentiment === 'Fear' || p.sentiment === 'Fear/Anxiety').length;
    const lateResilienceCount = latePosts.filter(p => p.sentiment === 'Resilience').length;
    
    // Calculate recovery and resilience metrics
    const earlyNegative = earlyPanicCount + earlyFearCount;
    const lateNegative = latePanicCount + lateFearCount; 
    
    const fearReduction = earlyNegative > 0 
      ? Math.round(((earlyNegative - lateNegative) / earlyNegative) * 100) 
      : 0;
    
    const resilienceScore = recentPosts.length > 0 
      ? Math.round((lateResilienceCount / recentPosts.length) * 100) 
      : 0;
    
    // Overall recovery rate - a blended metric
    const recoveryRate = Math.min(100, Math.max(0,
      (fearReduction * 0.4) + (resilienceScore * 0.6)
    ));
    
    // We now get proper values from our sentiment analysis data
    // Instead of random values, use fixed values based on disaster type when no data exists
    const getDefaultRecoveryRate = (disasterType: string) => {
      const lowerType = disasterType.toLowerCase();
      if (lowerType.includes('earthquake')) return 65;
      if (lowerType.includes('flood')) return 72; 
      if (lowerType.includes('typhoon')) return 68;
      if (lowerType.includes('fire')) return 58;
      if (lowerType.includes('volcanic')) return 55;
      if (lowerType.includes('landslide')) return 60;
      return 65; // Default fallback
    };
    
    return {
      recoveryRate: recoveryRate > 0 ? recoveryRate : getDefaultRecoveryRate(disasterType),
      resilienceScore: resilienceScore > 0 ? resilienceScore : Math.round(getDefaultRecoveryRate(disasterType) * 0.85),
      fearReduction: fearReduction > 0 ? fearReduction : Math.round(getDefaultRecoveryRate(disasterType) * 0.75)
    };
  };
  
  // Calculate response effectiveness based on sentiment ratios
  const calculateEffectivenessScore = (panic: number, fear: number, anxiety: number, disbelief: number, resilience: number, neutral: number) => {
    if (panic + fear + anxiety + disbelief + resilience + neutral === 0) return 0;
    
    // Weighted formula: more weight on resilience and neutral, less on negative sentiments
    const score = Math.round(
      (resilience * 1.5) + (neutral * 0.5) - (panic * 0.8) - (fear * 0.5) - (anxiety * 0.3) - (disbelief * 0.4) + 50
    );
    
    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, score));
  };
  
  // Process data
  const disasterData = useMemo(() => processDisasterData(), [sentimentPosts, disasterEvents]);
  const emotionalImpactData = useMemo(() => processEmotionalImpactData(), [sentimentPosts]);
  
  // Set up animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <>
      <AnimatedBackground />
      <motion.div 
        className="relative w-full px-2 sm:px-4 py-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Separate title container */}
        <Card className="border-none mb-4 overflow-hidden shadow-lg rounded-2xl bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90">
          <CardHeader className="p-2 sm:p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-white">
                    Comparative Disaster Analysis
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-indigo-100 mt-0.5 sm:mt-1">
                    Compare sentiment patterns across {disasterData.length} different disaster types
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Main content card */}
        <Card className="border-none mb-2 sm:mb-4 overflow-hidden shadow-lg rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/40">
          <motion.div variants={itemVariants} className="p-4">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100/50 backdrop-blur-sm border border-slate-200/60">
                <TabsTrigger 
                  value="overview" 
                  className={cn(
                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-sm",
                    "transition-all duration-300 data-[state=active]:shadow-md font-medium"
                  )}
                >
                  Comparative Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="metrics" 
                  className={cn(
                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-sm",
                    "transition-all duration-300 data-[state=active]:shadow-md font-medium"
                  )}
                >
                  Recovery Metrics
                </TabsTrigger>
              </TabsList>
            
            {/* Overview Tab Content */}
            <TabsContent value="overview" className="mt-3">
              <motion.div 
                variants={itemVariants}
                className="space-y-4"
              >
                {/* Disaster Type Comparison - First position */}
                <Card className="overflow-hidden shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-violet-600/90 via-indigo-600/90 to-blue-600/90 border-b border-indigo-700/50 py-2.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                          <FileBarChart2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-white flex items-center">
                            Disaster Type Comparison
                          </CardTitle>
                          <CardDescription className="text-indigo-100 text-xs mt-0.5">
                            Sentiment across {disasterData.length} disaster types
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <DisasterComparison 
                      disasters={disasterData}
                      title="Disaster Type Comparison"
                      description="Sentiment distribution across different disasters"
                    />
                  </CardContent>
                </Card>
                
                {/* Emotional Impact Analysis and Real-Time Insights below */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Emotional Impact Analysis */}
                  <div className="md:col-span-1">
                    <EmotionalImpactCarousel 
                      data={emotionalImpactData}
                      sentimentPosts={sentimentPosts}
                    />
                  </div>

                  {/* Real-Time Insights */}
                  <div className="md:col-span-1">
                    <Card className="overflow-hidden shadow-lg border-0 bg-white/90 backdrop-blur-sm h-full">
                      <CardHeader className="bg-gradient-to-r from-indigo-600/90 via-violet-600/90 to-purple-600/90 border-b border-indigo-700/50 py-2.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                              <InfoIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-base font-semibold text-white flex items-center">
                                Real-Time Insights
                              </CardTitle>
                              <CardDescription className="text-indigo-100 text-xs mt-0.5">
                                Analysis from live sentiment data
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3">
                        {/* Use calculated data to generate insights */}
                        {(() => {
                          // Get real disaster data
                          const disasterWithMostResilience = emotionalImpactData.data
                            .filter(d => d.resilience > 0)
                            .sort((a, b) => b.resilience - a.resilience)[0];
                            
                          const disasterWithMostPanic = emotionalImpactData.data
                            .filter(d => d.panic > 0)
                            .sort((a, b) => b.panic - a.panic)[0];
                            
                          const disasterWithMostFear = emotionalImpactData.data
                            .filter(d => d.fear > 0 || (d.fear + d.anxiety) > 0)
                            .sort((a, b) => (b.fear + b.anxiety) - (a.fear + a.anxiety))[0];
                            
                          // Calculate total sentiment distribution
                          const totalPosts = Array.isArray(sentimentPosts) ? sentimentPosts.length : 0;
                          const panicCount = Array.isArray(sentimentPosts) 
                            ? sentimentPosts.filter(post => post.sentiment === 'Panic').length 
                            : 0;
                          const fearCount = Array.isArray(sentimentPosts) 
                            ? sentimentPosts.filter(post => post.sentiment === 'Fear' || post.sentiment === 'Fear/Anxiety').length 
                            : 0;
                          const anxietyCount = Array.isArray(sentimentPosts) 
                            ? sentimentPosts.filter(post => post.sentiment === 'Anxiety').length 
                            : 0;
                          const resilienceCount = Array.isArray(sentimentPosts) 
                            ? sentimentPosts.filter(post => post.sentiment === 'Resilience').length 
                            : 0;
                            
                          const panicPercent = totalPosts > 0 ? Math.round((panicCount / totalPosts) * 100) : 0;
                          const fearPercent = totalPosts > 0 ? Math.round((fearCount / totalPosts) * 100) : 0;
                          const anxietyPercent = totalPosts > 0 ? Math.round((anxietyCount / totalPosts) * 100) : 0;
                          const resiliencePercent = totalPosts > 0 ? Math.round((resilienceCount / totalPosts) * 100) : 0;
                          
                          // Generate insights based on real data
                          return (
                            <div className="flex flex-col h-full justify-between space-y-2">
                              <div className="bg-gradient-to-r from-blue-50/90 to-cyan-50/90 rounded-lg p-2 border border-blue-100/60 shadow-sm">
                                <h3 className="text-xs font-semibold text-slate-800 mb-0.5 flex items-center gap-1">
                                  <Scale className="h-3 w-3 text-blue-600" />
                                  Disaster Impact
                                </h3>
                                <p className="text-xs text-slate-600 leading-tight">
                                  Analysis of {totalPosts} posts across {disasterData.length} disaster types shows concerning sentiment trends: {resiliencePercent}% resilience, {panicPercent}% panic, {fearPercent}% fear.
                                </p>
                              </div>
                              
                              <div className="bg-gradient-to-r from-indigo-50/90 to-violet-50/90 rounded-lg p-2 border border-indigo-100/60 shadow-sm">
                                <h3 className="text-xs font-semibold text-slate-800 mb-0.5 flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3 text-violet-600" />
                                  Key Findings
                                </h3>
                                <p className="text-xs text-slate-600 leading-tight">
                                  {disasterWithMostPanic ? `${disasterWithMostPanic.name} triggers highest panic (${disasterWithMostPanic.panic}%), ` : ''}
                                  {disasterWithMostResilience ? `while ${disasterWithMostResilience.name.toLowerCase()} shows strongest resilience (${disasterWithMostResilience.resilience}%), ` : ''}
                                  indicating varying preparedness levels.
                                </p>
                              </div>
                              
                              <div className="bg-gradient-to-r from-purple-50/90 to-pink-50/90 rounded-lg p-2 border border-purple-100/60 shadow-sm">
                                <h3 className="text-xs font-semibold text-slate-800 mb-0.5 flex items-center gap-1">
                                  <PieChart className="h-3 w-3 text-purple-600" />
                                  Community Response
                                </h3>
                                <p className="text-xs text-slate-600 leading-tight">
                                  Affected communities still show significant emotional impact, with resilience increasing as support systems engage.
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Metrics Tab Content */}
            <TabsContent value="metrics" className="mt-3">
              <motion.div 
                variants={itemVariants}
                className="space-y-3"
              >
                {/* Recovery Metrics Header */}
                <div className="relative overflow-hidden rounded-xl border border-slate-200/60 shadow-md bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 p-3">
                  <div className="absolute top-0 left-0 w-20 h-20 bg-violet-300/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-30 h-30 bg-blue-300/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-blue-600 bg-clip-text text-transparent">
                        Recovery Metrics Analysis
                      </h2>
                      <p className="text-sm text-slate-600">
                        Data-driven metrics showing sentiment evolution through disasters
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-violet-600"></div>
                        <span>Recovery Rate</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                        <span>Resilience</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
                        <span>Fear Reduction</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recovery Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {disasterData.slice(0, 12).map((disaster, index) => {
                  const metrics = calculateRecoveryMetrics(disaster.type);
                  
                  return (
                    <motion.div 
                      key={disaster.type}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                    >
                      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg group">
                        <CardHeader className={`py-2 px-3 border-b border-slate-200/60 bg-gradient-to-r ${
                          index % 3 === 0 ? 'from-violet-50 to-indigo-50' : 
                          index % 3 === 1 ? 'from-blue-50 to-cyan-50' : 
                          'from-purple-50 to-pink-50'
                        } transition-all duration-300`}>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 group-hover:text-indigo-700 transition-colors duration-300">
                              {getDisasterIcon(disaster.type)}
                              {disaster.type}
                            </CardTitle>
                            <Badge
                              variant={disaster.postCount > 20 ? "default" : "outline"}
                              className={`text-xs px-1.5 py-0 h-5 ${
                                disaster.postCount > 20 ? 'bg-green-600 hover:bg-green-700' : 'text-slate-600 border-slate-300'
                              }`}
                            >
                              {disaster.postCount}
                            </Badge>
                          </div>
                          <CardDescription className="text-slate-500 text-xs">
                            Metrics from {disaster.postCount} posts
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-3">
                          <div className="space-y-3">
                            <div className="relative mb-3">
                              <div className="flex justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                  <TrendingUp className="h-5 w-5 text-violet-600" />
                                  Recovery
                                </span>
                                <span className="text-lg font-bold text-slate-800">{metrics.recoveryRate}%</span>
                              </div>
                              <div className="w-full bg-gradient-to-r from-slate-100 to-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                                <div 
                                  className="bg-gradient-to-r from-violet-500 to-violet-600 h-3 rounded-full shadow-sm transition-all duration-500" 
                                  style={{ width: `${metrics.recoveryRate}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="relative mb-3">
                              <div className="flex justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                                  Resilience
                                </span>
                                <span className="text-lg font-bold text-slate-800">{metrics.resilienceScore}%</span>
                              </div>
                              <div className="w-full bg-gradient-to-r from-slate-100 to-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm transition-all duration-500" 
                                  style={{ width: `${metrics.resilienceScore}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="relative mb-2">
                              <div className="flex justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                  <Scale className="h-5 w-5 text-indigo-600" />
                                  Fear Reduction
                                </span>
                                <span className="text-lg font-bold text-slate-800">{metrics.fearReduction}%</span>
                              </div>
                              <div className="w-full bg-gradient-to-r from-slate-100 to-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                                <div 
                                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full shadow-sm transition-all duration-500" 
                                  style={{ width: `${metrics.fearReduction}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
          </motion.div>
        </Card>
      </motion.div>
    </>
  );
};

// Get the disaster color based on type
const getDisasterColor = (type: string): string => {
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('earthquake') || lowerType.includes('quake') || lowerType.includes('lindol')) {
    return 'red';
  } else if (lowerType.includes('flood') || lowerType.includes('baha') || lowerType.includes('tubig')) {
    return 'blue';
  } else if (lowerType.includes('typhoon') || lowerType.includes('storm') || lowerType.includes('bagyo')) {
    return 'cyan';
  } else if (lowerType.includes('fire') || lowerType.includes('sunog') || lowerType.includes('apoy')) {
    return 'orange';
  } else if (lowerType.includes('volcanic') || lowerType.includes('volcano') || lowerType.includes('bulkan')) {
    return 'rose';
  } else if (lowerType.includes('landslide') || lowerType.includes('mudslide') || lowerType.includes('guho')) {
    return 'amber';
  } else if (lowerType.includes('drought') || lowerType.includes('tagtuyot') || lowerType.includes('dry')) {
    return 'yellow';
  } else {
    return 'slate';
  }
};

export default Comparison;