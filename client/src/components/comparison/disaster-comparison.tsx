import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chartColors, getDisasterTypeColor } from '@/lib/colors';
import Chart from 'chart.js/auto';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';


interface DisasterData {
  type: string;
  sentiments: {
    label: string;
    percentage: number;
  }[];
}

interface DisasterComparisonProps {
  disasters: DisasterData[];
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
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [selectedDisasters, setSelectedDisasters] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const sentimentLabels = ['Panic', 'Fear/Anxiety', 'Disbelief', 'Resilience', 'Neutral'];

  // Initialize with first two disasters if available
  useEffect(() => {
    if (disasters.length > 0 && selectedDisasters.length === 0) {
      setSelectedDisasters(disasters.slice(0, Math.min(2, disasters.length)).map(d => d.type));
    }
    setIsLoaded(true); // Set isLoaded to true after initial data load
  }, [disasters]);

  // Update chart when selection changes
  useEffect(() => {
    if (chartRef.current && selectedDisasters.length > 0) {
      // Destroy previous chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Filter selected disasters
      const selectedData = disasters.filter(d => selectedDisasters.includes(d.type));

      // Prepare data for chart
      const datasets = selectedData.map((disaster) => {
        // Create an array for each sentiment label
        const data = sentimentLabels.map(label => {
          const sentiment = disaster.sentiments.find(s => s.label === label);
          return sentiment ? sentiment.percentage : 0;
        });

        // Get color based on disaster type
        const disasterColor = getDisasterTypeColor(disaster.type);
        
        return {
          label: disaster.type,
          data,
          backgroundColor: disasterColor,
          borderColor: disasterColor,
          borderWidth: 1
        };
      });

      // Create chart
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sentimentLabels,
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: false
              },
              ticks: {
                font: {
                  size: 9
                }
              },
              grid: {
                display: false
              }
            },
            x: {
              title: {
                display: false
              },
              ticks: {
                font: {
                  size: 9
                }
              },
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: {
                  size: 10
                }
              }
            },
            tooltip: {
              titleFont: {
                size: 10
              },
              bodyFont: {
                size: 10
              }
            }
          },
          layout: {
            padding: 10
          },
          animation: {
            duration: 800,
            easing: 'easeOutCubic'
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [disasters, selectedDisasters]);

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
      className="w-full"
    >
      {disasters.length === 0 ? (
        <motion.div 
          className="py-4 text-center text-slate-500"
          variants={itemVariants}
        >
          No disaster data available for comparison
        </motion.div>
      ) : (
        <div className="space-y-3">
          {/* Compact Disaster Type Selector */}
          <motion.div variants={itemVariants} className="px-2">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {disasters.map((disaster, index) => (
                <motion.div
                  key={disaster.type}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge 
                    variant={selectedDisasters.includes(disaster.type) ? "default" : "outline"}
                    className="cursor-pointer text-xs font-medium"
                    onClick={() => toggleDisaster(disaster.type)}
                    style={{
                      backgroundColor: selectedDisasters.includes(disaster.type) 
                        ? getDisasterTypeColor(disaster.type) 
                        : 'transparent',
                      borderColor: getDisasterTypeColor(disaster.type),
                      color: selectedDisasters.includes(disaster.type) ? 'white' : getDisasterTypeColor(disaster.type)
                    }}
                  >
                    {disaster.type}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Compact Chart */}
          <motion.div 
            className="px-2 pt-1"
            variants={itemVariants}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="h-[200px]">
              <canvas ref={chartRef}></canvas>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}