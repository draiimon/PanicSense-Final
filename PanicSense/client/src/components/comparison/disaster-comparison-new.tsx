import { useEffect, useState } from 'react';
import { getDisasterTypeColor } from '@/lib/colors';
import { getDisasterIcon } from '@/lib/disaster-icons';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';



// Interface for disaster data structure passed from comparison page
interface DisasterMetrics {
  type: string;
  postCount: number;
  panicCount: number;
  fearCount: number;
  anxietyCount: number;
  disbeliefCount: number;
  resilienceCount: number;
  neutralCount: number;
  panicPercent: number;
  fearPercent: number;
  anxietyPercent: number;
  disbeliefPercent: number;
  resiliencePercent: number;
  neutralPercent: number;
  effectivenessScore: number;
}

interface DisasterComparisonProps {
  disasters: DisasterMetrics[];
  title?: string;
  description?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function DisasterComparison({ 
  disasters,
  title = 'Disaster Type Comparison',
  description = 'Sentiment distribution across different disasters'
}: DisasterComparisonProps) {
  const [selectedDisasters, setSelectedDisasters] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Initialize with first two disasters if available
  useEffect(() => {
    if (disasters.length > 0 && selectedDisasters.length === 0) {
      setSelectedDisasters(disasters.slice(0, Math.min(2, disasters.length)).map(d => d.type));
    }
    setIsLoaded(true); // Set isLoaded to true after initial data load
  }, [disasters]);

  const toggleDisaster = (disasterType: string) => {
    setSelectedDisasters(prev => {
      if (prev.includes(disasterType)) {
        return prev.filter(d => d !== disasterType);
      } else {
        return [...prev, disasterType];
      }
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate={isLoaded ? "visible" : "hidden"}
      variants={containerVariants}
      className="p-4"
    >
      {disasters.length === 0 ? (
        <motion.div 
          className="py-10 text-center text-slate-500"
          variants={itemVariants}
        >
          No disaster data available for comparison
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Disaster Type Selector */}
          <motion.div variants={itemVariants} className="bg-indigo-50/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100/50 shadow-sm">
            <p className="mb-2 text-sm font-medium text-indigo-800">Select disasters to compare:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {disasters.map((disaster, index) => (
                <motion.div
                  key={disaster.type}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge 
                    variant={selectedDisasters.includes(disaster.type) ? "default" : "outline"}
                    className="cursor-pointer text-sm font-medium"
                    onClick={() => toggleDisaster(disaster.type)}
                    style={{
                      backgroundColor: selectedDisasters.includes(disaster.type) 
                        ? getDisasterTypeColor(disaster.type) 
                        : 'transparent',
                      borderColor: getDisasterTypeColor(disaster.type),
                      color: selectedDisasters.includes(disaster.type) ? 'white' : getDisasterTypeColor(disaster.type)
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      {getDisasterIcon(disaster.type, { className: "h-3.5 w-3.5" })}
                      {disaster.type} ({disaster.postCount})
                    </span>
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Sentiment Distribution Details */}
          {selectedDisasters.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="pt-2 pb-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {disasters
                  .filter(d => selectedDisasters.includes(d.type))
                  .map((disaster, index) => (
                    <motion.div 
                      key={disaster.type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-md border border-slate-100/80 overflow-hidden"
                    >
                      <div className="p-3 bg-gradient-to-r border-b border-slate-100"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${getDisasterTypeColor(disaster.type)}15, ${getDisasterTypeColor(disaster.type)}05)`
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full" 
                            style={{ backgroundColor: `${getDisasterTypeColor(disaster.type)}30` }}
                          >
                            {getDisasterIcon(disaster.type, { className: "h-4 w-4 text-slate-700" })}
                          </div>
                          <h3 className="text-sm font-semibold text-slate-800">{disaster.type}</h3>
                          <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                            {disaster.postCount} posts
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <span className="px-2 py-1 text-xs font-medium bg-rose-100 text-rose-800 rounded-full flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                              Panic
                            </div>
                            <span className="font-bold">{disaster.panicCount}</span>
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              Fear/Anxiety
                            </div>
                            <span className="font-bold">{disaster.fearCount}</span>
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                              Disbelief
                            </div>  
                            <span className="font-bold">{disaster.disbeliefCount}</span>
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Resilience
                            </div>
                            <span className="font-bold">{disaster.resilienceCount}</span>
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded-full flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                              Neutral
                            </div>
                            <span className="font-bold">{disaster.neutralCount}</span>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                }
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}