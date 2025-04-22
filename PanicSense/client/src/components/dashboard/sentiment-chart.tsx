import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { chartColors } from '@/lib/colors';
import Chart from 'chart.js/auto';

interface SentimentChartProps {
  data: {
    labels: string[];
    values: number[];
    title?: string;
    description?: string;
  };
  type?: 'doughnut' | 'bar' | 'line';
  height?: string;
}

export function SentimentChart({ 
  data, 
  type = 'doughnut',
  height = 'h-80'
}: SentimentChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Destroy previous chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Custom colors for disaster response effectiveness (adjusted for positive metrics)
      const getColorBasedOnScore = (score: number) => {
        if (score >= 90) return '#10b981'; // Green for excellent
        if (score >= 75) return '#3b82f6'; // Blue for good
        if (score >= 60) return '#f59e0b'; // Amber for moderate
        return '#ef4444';                 // Red for poor
      };
      
      // Generate colors based on disaster type or use score-based colors
      const generateColors = () => {
        // Check if the chart appears to be for disaster response effectiveness
        const isResponseChart = data.title?.includes('Response') || data.description?.includes('effectiveness');
        
        if (isResponseChart) {
          return data.values.map(value => getColorBasedOnScore(value));
        }
        
        return chartColors.slice(0, data.labels.length);
      };
      
      const barColors = generateColors();

      // Chart configuration based on type
      let chartConfig: any = {
        type,
        data: {
          labels: data.labels,
          datasets: [{
            data: data.values,
            backgroundColor: barColors,
            borderWidth: type === 'bar' ? 1 : 0,
            borderColor: type === 'bar' ? barColors.map(c => c) : undefined,
            borderRadius: type === 'bar' ? 4 : undefined,
            maxBarThickness: type === 'bar' ? 50 : undefined,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              display: type !== 'bar' // Hide legend for bar charts
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  if (data.title?.includes('Response')) {
                    const score = context.raw;
                    let assessment = 'Poor';
                    if (score >= 90) assessment = 'Excellent';
                    else if (score >= 75) assessment = 'Good';
                    else if (score >= 60) assessment = 'Moderate';
                    
                    return `${context.label}: ${score}% (${assessment})`;
                  }
                  return `${context.label}: ${context.raw}`;
                }
              }
            }
          }
        }
      };

      // Type-specific configurations
      if (type === 'doughnut') {
        chartConfig.options.cutout = '70%';
      } else if (type === 'bar' || type === 'line') {
        // Check if the chart is specifically for disaster response
        const isResponseChart = data.title?.includes('Response') || data.description?.includes('effectiveness');
        
        const yMax = isResponseChart ? 100 : Math.max(...data.values) * 1.2;
        
        chartConfig.options.scales = {
          y: {
            beginAtZero: true,
            max: yMax,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              borderDash: [5, 5]
            },
            ticks: {
              callback: function(value: any) {
                return isResponseChart ? value + '%' : value;
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        };
        
        if (type === 'line') {
          chartConfig.data.datasets[0].tension = 0.4;
          chartConfig.data.datasets[0].fill = true;
          chartConfig.data.datasets = data.labels.map((label, index) => ({
            label,
            data: [data.values[index]],
            borderColor: barColors[index],
            backgroundColor: `${barColors[index]}33`,
            tension: 0.4,
            fill: true
          }));
        }
      }

      chartInstance.current = new Chart(ctx, chartConfig);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type]);

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="p-5 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-slate-800">
          {data.title || 'Sentiment Distribution'}
        </CardTitle>
        <CardDescription className="text-sm text-slate-500">
          {data.description || 'Across all active disasters'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <div className={height}>
          <canvas ref={chartRef} />
        </div>
      </CardContent>
    </Card>
  );
}
