import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, PieChart, InfoIcon, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Chart from 'chart.js/auto';

interface RealTimeInsightsProps {
  data: {
    recentSentiments: { sentiment: string; count: number; percentage: number }[];
    trendingSentiment: string;
    totalPosts: number;
    positiveChange: boolean;
    changePercentage: number;
    latestSentimentsByDisaster: {
      disasterType: string;
      sentiment: string;
      count: number;
      timestamp: string;
    }[];
  };
}

export function RealTimeInsights({ data }: RealTimeInsightsProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  // Sentinel to control animation to avoid flickering
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure proper animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Create the chart when the component mounts or when data changes
  useEffect(() => {
    if (!chartRef.current || !data.recentSentiments.length) return;
    
    // Clean up existing chart if there is one
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Create the new chart
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.recentSentiments.map(item => item.sentiment),
        datasets: [{
          data: data.recentSentiments.map(item => item.percentage),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',   // Red for Panic
            'rgba(249, 115, 22, 0.8)',  // Orange for Fear
            'rgba(139, 92, 246, 0.8)',  // Purple for Disbelief
            'rgba(16, 185, 129, 0.8)',  // Green for Resilience
            'rgba(156, 163, 175, 0.8)', // Gray for Neutral
          ],
          borderColor: [
            'rgba(239, 68, 68, 1)',   // Red for Panic
            'rgba(249, 115, 22, 1)',  // Orange for Fear  
            'rgba(139, 92, 246, 1)',  // Purple for Disbelief
            'rgba(16, 185, 129, 1)',  // Green for Resilience
            'rgba(156, 163, 175, 1)', // Gray for Neutral
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
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
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw}%`;
              }
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
    
    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data]);
  
  // Get color based on sentiment
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'panic':
        return { bg: 'bg-rose-100', text: 'text-rose-600' };
      case 'fear':
      case 'fear/anxiety':
      case 'anxiety':
        return { bg: 'bg-orange-100', text: 'text-orange-600' };
      case 'disbelief':
        return { bg: 'bg-purple-100', text: 'text-purple-600' };
      case 'resilience':
        return { bg: 'bg-green-100', text: 'text-green-600' };
      case 'neutral':
      case 'calm':
        return { bg: 'bg-slate-100', text: 'text-slate-600' };
      default:
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
    }
  };
  
  // Format timestamp to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };
  
  return (
    <Card className="overflow-hidden shadow-lg border-0 bg-white/90 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="bg-gradient-to-r from-indigo-600/90 via-violet-600/90 to-purple-600/90 border-b border-indigo-700/50 py-2 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
              <InfoIcon className="h-3.5 w-3.5 text-white" />
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
      
      <CardContent className="p-0 flex-grow flex flex-col">
        <div className="p-3 flex-grow flex flex-col">
          {/* Current Sentiment Overview */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-medium text-sm text-slate-800">Current Sentiment</h3>
              <div className="flex items-center mt-1">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getSentimentColor(data.trendingSentiment).bg} ${getSentimentColor(data.trendingSentiment).text}`}>
                  {data.trendingSentiment}
                </span>
                <div className="flex items-center ml-2 text-xs">
                  {data.positiveChange ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      +{data.changePercentage}%
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      -{data.changePercentage}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Total Posts</span>
              <div className="text-lg font-bold text-slate-800">{data.totalPosts}</div>
            </div>
          </div>
          
          {/* Sentiment Distribution Chart */}
          <div className="h-[120px] mb-2 mt-2">
            <canvas ref={chartRef}></canvas>
          </div>
          
          {/* Latest Updates Section */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex-grow flex flex-col">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Activity className="h-3.5 w-3.5 text-indigo-500" />
              <h3 className="font-medium text-sm text-slate-800">Latest Updates</h3>
            </div>
            
            <div className="space-y-1.5 flex-grow overflow-y-auto pr-1 flex flex-col">
              {data.latestSentimentsByDisaster.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  className="flex items-center justify-between bg-slate-50 p-1.5 rounded-md"
                >
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${getSentimentColor(item.sentiment).bg}`}></div>
                    <span className="text-xs font-medium text-slate-700">{item.disasterType}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${getSentimentColor(item.sentiment).text}`}>
                      {item.sentiment}
                    </span>
                    <span className="text-xs text-slate-500">{formatRelativeTime(item.timestamp)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}