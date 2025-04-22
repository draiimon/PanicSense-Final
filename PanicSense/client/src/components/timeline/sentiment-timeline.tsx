import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { chartColors, sentimentColors, getSentimentColor } from '@/lib/colors';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { 
  parseISO, 
  format, 
  getYear,
  isFuture
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react';

interface TimelineData {
  labels: string[]; // dates
  datasets: {
    label: string;
    data: number[];
  }[];
}

interface SentimentTimelineProps {
  data: TimelineData;
  title?: string;
  description?: string;
  rawDates?: string[]; // Original ISO date strings from posts
}

export function SentimentTimeline({ 
  data, 
  title = 'Sentiment Evolution',
  description = 'Full Year View',
  rawDates = []
}: SentimentTimelineProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  // Only use 'year' since our data is historical (2025 and earlier)
  const [timeRange, setTimeRange] = useState<'year'>('year');

  // Filter out future dates from rawDates
  const validRawDates = rawDates.filter(dateStr => {
    const date = parseISO(dateStr);
    return !isFuture(date);
  });

  // Get all available years from validRawDates
  const availableYears = validRawDates.length > 0 
    ? Array.from(new Set(validRawDates.map(dateStr => {
        // Ensure dateStr is valid before parsing
        if (!dateStr || typeof dateStr !== 'string') {
          return new Date().getFullYear();
        }
        return getYear(parseISO(dateStr));
      }))).sort((a, b) => a - b)
    : [new Date().getFullYear()];

  // State for selected years - default to most recent year (2025)
  const [selectedYears, setSelectedYears] = useState<number[]>([
    Math.max(...availableYears)
  ]);

  const selectAllYears = () => {
    setSelectedYears(availableYears);
  };

  const selectLatestYear = () => {
    setSelectedYears([availableYears[availableYears.length-1]]);
  };

  // Function to filter the data based on selected years
  const filterDataByYear = () => {
    if (!validRawDates || validRawDates.length === 0) {
      return data; // Return original data if no raw dates
    }

    // Convert all raw dates to Date objects for filtering
    const datePairs = validRawDates.map(dateStr => {
      // Skip invalid date strings
      if (!dateStr || typeof dateStr !== 'string') {
        const currentDate = new Date();
        return { 
          original: currentDate.toISOString(), 
          formatted: format(currentDate, 'MMM dd, yyyy'), 
          date: currentDate, 
          year: getYear(currentDate) 
        };
      }
      
      const date = parseISO(dateStr);
      const formattedDate = format(date, 'MMM dd, yyyy');
      return { original: dateStr, formatted: formattedDate, date, year: getYear(date) };
    });

    // Filter by selected years and ensure no future dates
    const yearFilteredDates = datePairs.filter(pair => 
      selectedYears.includes(pair.year) && !isFuture(pair.date)
    );

    // Get filtered formatted dates for labels
    const filteredLabels = Array.from(new Set(yearFilteredDates.map(pair => pair.formatted)));

    // Sort chronologically
    filteredLabels.sort((a, b) => {
      const dateA = parseISO(datePairs.find(pair => pair.formatted === a)?.original || '');
      const dateB = parseISO(datePairs.find(pair => pair.formatted === b)?.original || '');
      return dateA.getTime() - dateB.getTime();
    });

    // Create new datasets with filtered data
    const filteredDatasets = data.datasets.map(dataset => {
      const newData = filteredLabels.map(label => {
        const originalIndex = data.labels.indexOf(label);
        return originalIndex >= 0 ? dataset.data[originalIndex] : 0;
      });

      return {
        ...dataset,
        data: newData
      };
    });

    return {
      labels: filteredLabels,
      datasets: filteredDatasets
    };
  };

  const filteredData = filterDataByYear();

  useEffect(() => {
    if (chartRef.current) {
      // Destroy previous chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Format datasets with more vibrant sentiment-specific colors
      const formattedDatasets = filteredData.datasets.map((dataset) => {
        const color = getSentimentColor(dataset.label);

        return {
          ...dataset,
          borderColor: color,
          backgroundColor: `${color}20`, // 20% opacity
          borderWidth: 2.5,
          pointBackgroundColor: color,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4 // Smoother lines
        };
      });

      // Create chart
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: filteredData.labels,
          datasets: formattedDatasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animations: {
            tension: {
              duration: 1000,
              easing: 'linear',
              from: 0.8,
              to: 0.4,
              loop: false
            }
          },
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Sentiment Percentage (%)',
                font: {
                  weight: 'bold',
                  size: 13
                },
                color: '#64748b'
              },
              grid: {
                color: 'rgba(226, 232, 240, 0.5)'
              },
              border: {
                display: false
              },
              ticks: {
                color: '#64748b',
                padding: 10,
                font: {
                  size: 11
                },
                callback: function(value) {
                  return value + '%';
                }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date',
                font: {
                  weight: 'bold',
                  size: 13
                },
                color: '#64748b'
              },
              grid: {
                display: false,
                color: 'transparent'
              },
              border: {
                display: false
              },
              ticks: {
                color: '#64748b',
                padding: 5,
                font: {
                  size: 11
                },
                maxRotation: 45,
                minRotation: 45
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                boxWidth: 8,
                boxHeight: 8,
                padding: 15,
                font: {
                  size: 12
                },
                color: '#334155'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              titleColor: '#1e293b',
              bodyColor: '#475569',
              borderColor: 'rgba(148, 163, 184, 0.2)',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              boxPadding: 6,
              usePointStyle: true,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += Math.round(context.parsed.y * 10) / 10 + '%';
                  }
                  return label;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [filteredData, selectedYears]);

  // Get the correct description based on the year
  const getRangeDescription = () => {
    if (filteredData.labels.length === 0) {
      return "No data available";
    }
    
    // Create a readable year range description
    if (selectedYears.length === 1) {
      return `${selectedYears[0]}`;
    } else if (selectedYears.length === availableYears.length) {
      return "All Years";
    } else {
      // Show "All Years" for multiple selected years too
      return "All Years";
    }
  };

  return (
    <div>
      <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center">
            <Button
              onClick={() => {
                const currentIndex = availableYears.indexOf(selectedYears[0]);
                if (currentIndex > 0) {
                  const prevYear = availableYears[currentIndex - 1];
                  setSelectedYears([prevYear]);
                }
              }}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-l-md rounded-r-none border-r-0"
              disabled={selectedYears.length !== 1 || selectedYears[0] === Math.min(...availableYears)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div
              className="h-8 px-3 py-1 rounded-none border border-x-0 border-input flex items-center justify-center font-medium text-slate-800"
            >
              {selectedYears.length === 1 ? selectedYears[0] : "All Years"}
            </div>
            <Button
              onClick={() => {
                const currentIndex = availableYears.indexOf(selectedYears[0]);
                if (currentIndex < availableYears.length - 1) {
                  const nextYear = availableYears[currentIndex + 1];
                  setSelectedYears([nextYear]);
                }
              }}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-r-md rounded-l-none border-l-0"
              disabled={selectedYears.length !== 1 || selectedYears[0] === Math.max(...availableYears)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Data view controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-slate-500" />
            <div className="text-slate-700 text-sm font-medium">
              {getRangeDescription()}
            </div>
          </div>
          
          <Button
            onClick={() => {
              if (selectedYears.length === availableYears.length) {
                selectLatestYear();
              } else {
                selectAllYears();
              }
            }}
            variant={selectedYears.length === availableYears.length ? "default" : "outline"}
            size="sm"
            className="ml-2"
          >
            {selectedYears.length === availableYears.length ? "Latest Year Only" : "All Years"}
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        {filteredData.labels.length === 0 ? (
          <div className="h-80 flex items-center justify-center flex-col">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <CalendarRange className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">No data available</p>
            <p className="text-sm text-slate-500">
              Try selecting a different year or uploading more data
            </p>
          </div>
        ) : (
          <div className="h-80">
            <canvas ref={chartRef} />
          </div>
        )}
      </div>
    </div>
  );
}