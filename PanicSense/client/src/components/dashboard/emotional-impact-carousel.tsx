import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  HeartPulse, 
  TrendingUp, 
  PieChart,
  BarChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDisasterIcon } from '@/lib/disaster-icons';
import Chart from 'chart.js/auto';

interface EmotionalImpactSeriesItem {
  name: string;
  color: string;
  data: number[];
}

interface EmotionalImpactDataItem {
  name: string;
  panic: number;
  fear: number;
  anxiety: number;
  resilience: number;
}

interface ChartComponentProps {
  categories: string[];
  seriesData: number[];
  seriesColor: string;
  seriesName: string;
}

// Chart component for visualization
function ChartComponent({ categories, seriesData, seriesColor, seriesName }: ChartComponentProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Clean up any existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Create the new chart
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: seriesName,
          data: seriesData,
          backgroundColor: seriesColor,
          borderColor: seriesColor,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',  // Horizontal bar chart
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 9
              }
            }
          },
          x: {
            beginAtZero: true,
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 9
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            titleFont: {
              size: 10
            },
            bodyFont: {
              size: 10
            },
            callbacks: {
              label: function(context) {
                return `${context.parsed.x}%`;
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
      }
    };
  }, [categories, seriesData, seriesColor, seriesName]);
  
  return <canvas ref={chartRef}></canvas>;
}

interface EmotionalImpactCarouselProps {
  data: {
    series: EmotionalImpactSeriesItem[];
    categories: string[];
    data: EmotionalImpactDataItem[];
  };
  sentimentPosts: any[];
}

export function EmotionalImpactCarousel({ data, sentimentPosts }: EmotionalImpactCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSlides, setTotalSlides] = useState(data.series?.length || 0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoPlay || !data.series || data.series.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoPlay, currentIndex, data.series]);

  // Calculate total slides based on series length
  useEffect(() => {
    setTotalSlides(data.series?.length || 0);
  }, [data.series]);

  const scrollToSlide = (index: number) => {
    if (!data.series || index < 0 || index >= data.series.length) return;
    
    // Instead of scrolling the element, we'll update the state
    // which will update the transform in the render
    setCurrentIndex(index);
  };

  const prevSlide = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    scrollToSlide(newIndex);
  };

  const nextSlide = () => {
    if (!data.series) return;
    const newIndex = (currentIndex + 1) % data.series.length;
    scrollToSlide(newIndex);
  };

  // Generate insights based on real data
  const generateInsights = () => {
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
    const resiliencePercent = totalPosts > 0 ? Math.round((resilienceCount / totalPosts) * 100) : 0;

    return {
      hasPositiveTrend: resiliencePercent > (panicPercent + fearPercent),
      totalPosts,
      panicPercent,
      fearPercent,
      resiliencePercent
    };
  };

  const insights = generateInsights();

  const getDisasterWithMostResilience = () => {
    return data.data
      .filter(d => d.resilience > 0)
      .sort((a, b) => b.resilience - a.resilience)[0];
  };

  return (
    <Card className="overflow-hidden shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-violet-600/90 via-blue-600/90 to-pink-600/90 border-b border-violet-700/50 py-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
              <HeartPulse className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-white flex items-center">
                Emotional Impact Analysis
              </CardTitle>
              <CardDescription className="text-violet-100 text-xs mt-0.5">
                Sentiment breakdown by disaster type
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Sentiment Legend */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex flex-wrap gap-2 justify-center">
            {data.series && data.series.map((series) => (
              <div key={series.name} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: series.color }}
                ></div>
                <span className="text-xs font-medium text-slate-700">{series.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Carousel Navigation with buttons only */}
        <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 z-10 flex justify-between px-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full w-8 h-8 bg-white/80 hover:bg-white/90 shadow-sm p-0"
            onClick={prevSlide}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full w-8 h-8 bg-white/80 hover:bg-white/90 shadow-sm p-0"
            onClick={nextSlide}
            disabled={!data.series || currentIndex === data.series.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Carousel Content */}
        <div 
          ref={carouselRef}
          className="overflow-hidden"
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          <motion.div 
            className="flex"
            animate={{ 
              x: `-${(100 / totalSlides) * currentIndex}%` 
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.5
            }}
            style={{ width: `${totalSlides * 100}%` }}
          >
            {data.series && data.series.map((series, seriesIndex) => (
              <div 
                key={seriesIndex} 
                className="flex-1"
              >
                <div className="p-4">
                  <div className="bg-white/95 rounded-lg shadow-md p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: series.color }}></div>
                      <h3 className="text-sm font-semibold text-slate-800">{series.name}</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {data.categories.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="mb-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-700 flex items-center gap-1">
                              {getDisasterIcon(category, { className: "h-3 w-3" })}
                              {category}
                            </span>
                            <span className="font-medium text-slate-800">
                              {series.data[categoryIndex]}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full"
                              style={{ 
                                width: `${series.data[categoryIndex]}%`,
                                backgroundColor: series.color,
                                transition: 'width 1s ease-in-out'
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}