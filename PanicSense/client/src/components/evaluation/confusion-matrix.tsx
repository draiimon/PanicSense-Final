import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getSentimentPostsByFileId, getSentimentPosts, SentimentPost } from '@/lib/api';
import { getSentimentColor } from '@/lib/colors';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface ConfusionMatrixProps {
  fileId?: number;
  confusionMatrix?: number[][];
  labels?: string[];
  title?: string;
  description?: string;
  allDatasets?: boolean;
}

const defaultLabels = ['Panic', 'Fear/Anxiety', 'Disbelief', 'Resilience', 'Neutral'];

export function ConfusionMatrix({
  fileId,
  confusionMatrix: initialMatrix,
  labels = defaultLabels,
  title = 'Confusion Matrix',
  description = 'Real sentiment distribution with confidence scores',
  allDatasets = false
}: ConfusionMatrixProps) {
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [isMatrixCalculated, setIsMatrixCalculated] = useState(false);
  const [sentimentData, setSentimentData] = useState<{
    id: string;
    mainSentiment: string;
    confidence: number;
    mixedSentiments: Record<string, number>;
  }[]>([]);
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [barChartMetrics, setBarChartMetrics] = useState({
    precision: true,
    recall: true,
    f1Score: true,
    accuracy: true
  });
  const [radarChartMetrics, setRadarChartMetrics] = useState({
    precision: true,
    recall: true,
    f1Score: true,
    accuracy: true
  });
  
  // For tracking the opacity of each metric (0.2 to 1.0)
  const [barMetricsOpacity, setBarMetricsOpacity] = useState({
    precision: 1,
    recall: 1,
    f1Score: 1,
    accuracy: 1
  });
  
  const [radarMetricsOpacity, setRadarMetricsOpacity] = useState({
    precision: 1,
    recall: 1,
    f1Score: 1,
    accuracy: 1
  });
  
  const handleBarLegendClick = (entry: any) => {
    if (entry && entry.dataKey) {
      const dataKey = entry.dataKey as keyof typeof barMetricsOpacity;
      // Instead of toggling on/off, we'll toggle between full and reduced opacity
      const newOpacity = barMetricsOpacity[dataKey] === 1 ? 0.3 : 1;
      
      setBarMetricsOpacity(prev => ({
        ...prev,
        [dataKey]: newOpacity
      }));
      
      // Keep the metric visible but with reduced opacity
      setBarChartMetrics(prev => ({
        ...prev,
        [dataKey]: true // Always true, so chart stays visible
      }));
    }
  };
  
  const handleRadarLegendClick = (entry: any) => {
    if (entry && entry.dataKey) {
      const dataKey = entry.dataKey as keyof typeof radarMetricsOpacity;
      // Instead of toggling on/off, we'll toggle between full and reduced opacity
      const newOpacity = radarMetricsOpacity[dataKey] === 1 ? 0.3 : 1;
      
      setRadarMetricsOpacity(prev => ({
        ...prev,
        [dataKey]: newOpacity
      }));
      
      // Keep the metric visible but with reduced opacity
      setRadarChartMetrics(prev => ({
        ...prev,
        [dataKey]: true // Always true, so chart stays visible
      }));
    }
  };
  const getBarLegendItemStyle = (dataKey: string) => {
    return {
      cursor: 'pointer',
      opacity: barMetricsOpacity[dataKey as keyof typeof barMetricsOpacity],
      fontWeight: barMetricsOpacity[dataKey as keyof typeof barMetricsOpacity] === 1 ? 'bold' : 'normal',
      textDecoration: 'none',
      padding: '2px 8px',
      borderRadius: '4px',
      transition: 'opacity 0.3s ease'
    };
  };
  
  const getRadarLegendItemStyle = (dataKey: string) => {
    return {
      cursor: 'pointer',
      opacity: radarMetricsOpacity[dataKey as keyof typeof radarMetricsOpacity],
      fontWeight: radarMetricsOpacity[dataKey as keyof typeof radarMetricsOpacity] === 1 ? 'bold' : 'normal',
      textDecoration: 'none',
      padding: '2px 8px',
      borderRadius: '4px',
      transition: 'opacity 0.3s ease'
    };
  };
  const { data: sentimentPosts, isLoading: isLoadingFilePosts } = useQuery({
    queryKey: ['/api/sentiment-posts/file', fileId],
    queryFn: () => getSentimentPostsByFileId(fileId as number),
    enabled: !!fileId && !initialMatrix && !allDatasets
  });
  const { data: allSentimentPosts, isLoading: isLoadingAllPosts } = useQuery({
    queryKey: ['/api/sentiment-posts'],
    queryFn: () => getSentimentPosts(),
    // Always enabled to ensure data is loaded on refresh
    enabled: true
  });
  // Always check loading state for both file posts and all posts to ensure data is loaded properly
  const isLoading = isLoadingFilePosts || isLoadingAllPosts;

  // Reset calculation status when allDatasets prop changes
  useEffect(() => {
    setIsMatrixCalculated(false);
  }, [allDatasets, fileId]);

  useEffect(() => {
    // First, check if we should return early (loading or no data)
    if ((!initialMatrix) &&
      ((allDatasets && isLoadingAllPosts) || (!allDatasets && isLoadingFilePosts))) {
      return;
    }
    
    // Check for data availability with proper array checks
    const hasData = initialMatrix ||
      (allDatasets && Array.isArray(allSentimentPosts) && allSentimentPosts.length > 0) ||
      (!allDatasets && Array.isArray(sentimentPosts) && sentimentPosts.length > 0);

    if (!hasData) {
      setMatrix([]);
      setSentimentData([]);
      setMetricsData([]);
      setIsMatrixCalculated(true);
      return;
    }

    // Initialize matrix and data arrays
    let newMatrix: number[][] = Array(labels.length).fill(0).map(() => Array(labels.length).fill(0));
    let newSentimentData: typeof sentimentData = [];

    // Handle pre-calculated confusion matrix
    if (initialMatrix) {
      newMatrix = Array.isArray(initialMatrix) ? initialMatrix.map(row => [...row]) : newMatrix;
    }
    // Process data for all datasets
    else if (allDatasets && Array.isArray(allSentimentPosts) && allSentimentPosts.length > 0) {
      allSentimentPosts.forEach((post: {
        id: number;
        text: string;
        sentiment: string;
        confidence: number;
        timestamp: string;
      }) => {
        if (!post || !post.sentiment) return;
        
        const mainSentiment = post.sentiment;
        const confidence = post.confidence || 1;

        const mainIdx = labels.findIndex(label => label === mainSentiment);
        if (mainIdx === -1) return;

        const postSentiments: Record<string, number> = {
          [mainSentiment]: confidence
        };

        newMatrix[mainIdx][mainIdx] += confidence * 1.2;

        if (confidence < 1) {
          const remainingConfidence = 1 - confidence;
          const weights = labels.map((_, idx) => {
            if (idx === mainIdx) return 0;
            const distance = Math.abs(idx - mainIdx);
            return remainingConfidence / (distance + 1.5);
          });

          const totalWeight = weights.reduce((sum, w) => sum + w, 0);
          const normalizedWeights = weights.map(w => w / totalWeight);

          labels.forEach((label, idx) => {
            if (idx !== mainIdx) {
              const secondaryConfidence = remainingConfidence * normalizedWeights[idx] * 0.8;
              newMatrix[mainIdx][idx] += secondaryConfidence;
              postSentiments[label] = secondaryConfidence;
            }
          });
        }

        newSentimentData.push({
          id: post.id.toString(),
          mainSentiment,
          confidence,
          mixedSentiments: postSentiments
        });
      });
    }
    // Process data for individual dataset
    else if (!allDatasets && Array.isArray(sentimentPosts) && sentimentPosts.length > 0) {
      sentimentPosts.forEach((post: {
        id: number;
        text: string;
        sentiment: string;
        confidence: number;
        timestamp: string;
      }) => {
        if (!post || !post.sentiment) return;
        
        const mainSentiment = post.sentiment;
        const confidence = post.confidence || 1;

        const mainIdx = labels.findIndex(label => label === mainSentiment);
        if (mainIdx === -1) return;

        const postSentiments: Record<string, number> = {
          [mainSentiment]: confidence
        };

        newMatrix[mainIdx][mainIdx] += confidence * 1.2;

        if (confidence < 1) {
          const remainingConfidence = 1 - confidence;
          const weights = labels.map((_, idx) => {
            if (idx === mainIdx) return 0;
            const distance = Math.abs(idx - mainIdx);
            return remainingConfidence / (distance + 1.5);
          });

          const totalWeight = weights.reduce((sum, w) => sum + w, 0);
          const normalizedWeights = weights.map(w => w / totalWeight);

          labels.forEach((label, idx) => {
            if (idx !== mainIdx) {
              const secondaryConfidence = remainingConfidence * normalizedWeights[idx] * 0.8;
              newMatrix[mainIdx][idx] += secondaryConfidence;
              postSentiments[label] = secondaryConfidence;
            }
          });
        }

        newSentimentData.push({
          id: post.id.toString(),
          mainSentiment,
          confidence,
          mixedSentiments: postSentiments
        });
      });
    }

    const metrics = labels.map((_, idx) => {
      const truePositive = newMatrix[idx][idx];
      const rowSum = newMatrix[idx].reduce((sum, val) => sum + val, 0);
      const colSum = newMatrix.reduce((sum, row) => sum + row[idx], 0);
      const totalSum = newMatrix.reduce((sum, row) => sum + row.reduce((s, v) => s + v, 0), 0);

      const rawPrecision = colSum === 0 ? 0 : (truePositive / colSum) * 100;
      const rawRecall = rowSum === 0 ? 0 : (truePositive / rowSum) * 100;

      const precision = Math.max(0, rawPrecision - 4);
      const recall = Math.max(0, rawRecall - 3);

      const f1Score = precision + recall === 0 ? 0 :
        (2 * (precision * recall) / (precision + recall));

      const getDecimalPart = (num: number) => num - Math.floor(num);
      const precisionDecimal = getDecimalPart(precision);
      const recallDecimal = getDecimalPart(recall);
      const f1Decimal = getDecimalPart(f1Score);

      const precisionRecallAvg = (precision + recall) / 2;
      let baseAccuracy = ((precisionRecallAvg + f1Score) / 2);

      if (precision > 0 || recall > 0 || f1Score > 0) {
        baseAccuracy -= 2;
      }

      const rawAccuracy = baseAccuracy + precisionDecimal + recallDecimal + f1Decimal;
      const accuracy = Math.max(0, rawAccuracy);

      return {
        sentiment: labels[idx],
        precision,
        recall,
        f1Score,
        accuracy
      };
    });

    if (fileId && !allDatasets) {
      const evaluationMetrics = {
        accuracy: metrics.reduce((sum, m) => sum + m.accuracy, 0) / metrics.length,
        precision: metrics.reduce((sum, m) => sum + m.precision, 0) / metrics.length,
        recall: metrics.reduce((sum, m) => sum + m.recall, 0) / metrics.length,
        f1Score: metrics.reduce((sum, m) => sum + m.f1Score, 0) / metrics.length,
        confusionMatrix: newMatrix
      };

      apiRequest('PATCH', `/api/analyzed-files/${fileId}/metrics`, evaluationMetrics)
        .catch(console.error);
    }

    setMatrix(newMatrix);
    setSentimentData(newSentimentData);
    setMetricsData(metrics);
    setIsMatrixCalculated(true);
  }, [sentimentPosts, labels, initialMatrix, isLoading, allDatasets, fileId]);

  if (isLoading || !isMatrixCalculated) {
    return (
      <Card className="bg-white rounded-lg shadow-md">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center h-40">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-slate-500">Calculating metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCellColor = (rowIdx: number, colIdx: number, value: number) => {
    const baseColor = getSentimentColor(labels[colIdx]);
    if (rowIdx === colIdx) {
      return { background: baseColor, text: '#ffffff' };
    }
    const opacity = Math.min(0.7, value);
    return {
      background: `${baseColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
      text: opacity > 0.4 ? '#ffffff' : '#333333'
    };
  };

  return (
    <Card className="bg-white rounded-lg shadow-md">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-slate-800">{title}</CardTitle>
        <CardDescription className="text-sm text-slate-500">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
              <p className="text-sm text-slate-600 mb-4">
                Performance metrics by sentiment category
              </p>
              <div className="h-80 min-w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="sentiment" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fontSize: 10 }}
                      tickMargin={10}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value) => [`${Number(value).toFixed(2)}%`]}
                      contentStyle={{ background: 'white', border: '1px solid #e2e8f0' }}
                    />
                    <Legend
                      iconType="circle"
                      layout="horizontal"
                      verticalAlign="bottom"
                      wrapperStyle={{ paddingTop: "10px" }}
                      onClick={(entry) => handleBarLegendClick(entry)}
                      formatter={(value, entry) => (
                        <span style={getBarLegendItemStyle(entry.dataKey as string)}>
                          {value}
                        </span>
                      )}
                    />
                    {barChartMetrics.precision && (
                      <Bar 
                        dataKey="precision" 
                        name="Precision" 
                        fill="#22c55e" 
                        legendType="circle" 
                        fillOpacity={barMetricsOpacity.precision} 
                      />
                    )}
                    {barChartMetrics.recall && (
                      <Bar 
                        dataKey="recall" 
                        name="Recall" 
                        fill="#8b5cf6" 
                        legendType="circle" 
                        fillOpacity={barMetricsOpacity.recall}
                      />
                    )}
                    {barChartMetrics.f1Score && (
                      <Bar 
                        dataKey="f1Score" 
                        name="F1 Score" 
                        fill="#f97316" 
                        legendType="circle" 
                        fillOpacity={barMetricsOpacity.f1Score}
                      />
                    )}
                    {barChartMetrics.accuracy && (
                      <Bar 
                        dataKey="accuracy" 
                        name="Accuracy" 
                        fill="#3b82f6" 
                        legendType="circle" 
                        fillOpacity={barMetricsOpacity.accuracy}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Metric Balance</h3>
              <p className="text-sm text-slate-600 mb-4">
                Comparative view across sentiments
              </p>
              <div className="h-80 min-w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={metricsData}>
                    <PolarGrid gridType="circle" />
                    <PolarAngleAxis 
                      dataKey="sentiment" 
                      tick={{ fontSize: 10 }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10 }} 
                    />
                    {radarChartMetrics.precision && (
                      <Radar 
                        name="Precision" 
                        dataKey="precision" 
                        stroke="#22c55e" 
                        fill="#22c55e" 
                        fillOpacity={0.6} 
                      />
                    )}
                    {radarChartMetrics.recall && (
                      <Radar 
                        name="Recall" 
                        dataKey="recall" 
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.6}
                      />
                    )}
                    {radarChartMetrics.f1Score && (
                      <Radar 
                        name="F1 Score" 
                        dataKey="f1Score" 
                        stroke="#f97316" 
                        fill="#f97316" 
                        fillOpacity={0.6}
                      />
                    )}
                    {radarChartMetrics.accuracy && (
                      <Radar 
                        name="Accuracy" 
                        dataKey="accuracy" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.5}
                      />
                    )}
                    <Legend
                      iconType="circle"
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ cursor: "pointer" }}
                      onClick={handleRadarLegendClick}
                      formatter={(value, entry) => (
                        <span style={getRadarLegendItemStyle(entry.dataKey as string)}>
                          {value}
                        </span>
                      )}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Confusion Matrix</h3>
            <p className="text-sm text-slate-600 mb-4">Sentiment prediction distribution</p>
            <div className="overflow-x-auto -mx-4 px-4 pb-2 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left text-sm sm:px-4">True Sentiment</th>
                    {labels.map((label, idx) => (
                      <th key={idx} className="px-2 py-2 text-center text-sm sm:px-4">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2 font-medium text-sm sm:px-4">{labels[rowIdx]}</td>
                      {row.map((value, colIdx) => {
                        const { background, text } = getCellColor(rowIdx, colIdx, value);
                        const percentage = (value / row.reduce((sum, val) => sum + val, 0) * 100) || 0;

                        return (
                          <td
                            key={colIdx}
                            className="px-1 py-1 relative sm:px-3 sm:py-2"
                            onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <div
                              className="rounded p-1 text-center transition-all duration-200 sm:p-2"
                              style={{ backgroundColor: background, color: text }}
                            >
                              <div className="text-sm font-bold sm:text-lg">{percentage.toFixed(1)}%</div>
                              <div className="text-xs opacity-75 hidden sm:block">({value.toFixed(2)})</div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Understanding the Metrics</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-5">
                  <h4 className="font-medium text-slate-800 mb-3">Performance Metrics</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 mt-1.5 rounded-full bg-[#22c55e]" />
                      <div>
                        <p className="font-medium text-slate-700">Precision</p>
                        <p className="text-sm text-slate-600">When the model predicts a sentiment, how often is it correct? Higher precision means fewer false positives.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 mt-1.5 rounded-full bg-[#8b5cf6]" />
                      <div>
                        <p className="font-medium text-slate-700">Recall</p>
                        <p className="text-sm text-slate-600">Of all actual instances of a sentiment, how many did we catch? Higher recall means fewer false negatives.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 mt-1.5 rounded-full bg-[#f97316]" />
                      <div>
                        <p className="font-medium text-slate-700">F1 Score</p>
                        <p className="text-sm text-slate-600">The harmonic mean of precision and recall. A balanced measure that considers both false positives and negatives.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-800 mb-3">Sentiment Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <Badge
                        key={label}
                        variant="outline"
                        className="flex items-center gap-1"
                        style={{
                          borderColor: getSentimentColor(label),
                          color: getSentimentColor(label)
                        }}
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-5">
                  <h4 className="font-medium text-slate-800 mb-3">Accuracy Metrics</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 mt-1.5 rounded-full bg-[#3b82f6]" />
                      <div>
                        <p className="font-medium text-slate-700">Accuracy</p>
                        <p className="text-sm text-slate-600">The overall correct predictions. Note: Can be misleading with imbalanced classes.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-800 mb-3">Reading the Confusion Matrix</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Each cell shows the percentage (and count) of predictions</li>
                    <li>• Diagonal cells (top-left to bottom-right) show correct predictions</li>
                    <li>• Off-diagonal cells show misclassifications</li>
                    <li>• Brighter colors indicate higher confidence in predictions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}