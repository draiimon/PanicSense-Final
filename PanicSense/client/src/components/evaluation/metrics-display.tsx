import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Chart from 'chart.js/auto';

// Export the MetricsData interface so it can be used in other components
export interface MetricsData {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

interface MetricsDisplayProps {
  data?: MetricsData;
  title?: string;
  description?: string;
}

export function MetricsDisplay({ 
  data, 
  title = 'Evaluation Metrics',
  description = 'Model performance metrics'
}: MetricsDisplayProps) {
  const metricsChartRef = useRef<HTMLCanvasElement>(null);
  const metricsChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!data) return;

    // Metrics Chart
    if (metricsChartRef.current) {
      if (metricsChartInstance.current) {
        metricsChartInstance.current.destroy();
      }

      const ctx = metricsChartRef.current.getContext('2d');
      if (!ctx) return;

      metricsChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score'],
          datasets: [{
            data: [data.accuracy/100, data.precision/100, data.recall/100, data.f1Score/100],
            backgroundColor: ['#4299e1', '#48bb78', '#ed8936', '#9f7aea'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 1,
              ticks: {
                callback: function(value) {
                  return (value as number * 100).toFixed(0) + '%';
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return (context.raw as number * 100).toFixed(2) + '%';
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (metricsChartInstance.current) {
        metricsChartInstance.current.destroy();
      }
    };
  }, [data]);

  if (!data) {
    return (
      <Card className="bg-white rounded-lg shadow">
        <CardHeader className="p-5 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-slate-800">{title}</CardTitle>
          <CardDescription className="text-sm text-slate-500">{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-5 text-center py-12">
          <p className="text-slate-500">No evaluation metrics available</p>
          <p className="text-sm text-slate-400 mt-2">Upload a CSV file to generate metrics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="p-5 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-slate-800">Performance Metrics</CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Accuracy, Precision, Recall, F1 Score
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <div className="h-60">
          <canvas ref={metricsChartRef} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Accuracy</p>
            <p className="text-xl font-bold text-slate-800">
              {data.accuracy.toFixed(2)}%
            </p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Precision</p>
            <p className="text-xl font-bold text-slate-800">
              {data.precision.toFixed(2)}%
            </p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Recall</p>
            <p className="text-xl font-bold text-slate-800">
              {data.recall.toFixed(2)}%
            </p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">F1 Score</p>
            <p className="text-xl font-bold text-slate-800">
              {data.f1Score.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}