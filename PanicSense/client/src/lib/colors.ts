export const sentimentColors = {
  'Panic': {
    background: '#ef4444',
    light: '#fef2f2',
    border: '#fee2e2',
    text: '#b91c1c',
    badgeBg: '#fee2e2',
    badgeText: '#ef4444',
  },
  'Fear/Anxiety': {
    background: '#f97316',
    light: '#fff7ed',
    border: '#ffedd5',
    text: '#c2410c',
    badgeBg: '#ffedd5',
    badgeText: '#f97316',
  },
  'Disbelief': {
    background: '#8b5cf6',
    light: '#f5f3ff',
    border: '#ede9fe',
    text: '#6d28d9',
    badgeBg: '#ede9fe',
    badgeText: '#8b5cf6',
  },
  'Resilience': {
    background: '#10b981',
    light: '#ecfdf5',
    border: '#d1fae5',
    text: '#047857',
    badgeBg: '#d1fae5',
    badgeText: '#10b981',
  },
  'Neutral': {
    background: '#6b7280',
    light: '#f9fafb',
    border: '#f3f4f6',
    text: '#4b5563',
    badgeBg: '#f3f4f6',
    badgeText: '#6b7280',
  }
};

// Disaster type colors as per user specification
export const disasterTypeColors = {
  'Flood': '#3b82f6',      // Blue
  'Typhoon': '#1e3a8a',    // Dark Blue
  'Fire': '#f97316',       // Orange
  'Volcanic Eruptions': '#ef4444',    // Red
  'Earthquake': '#92400e', // Brown
  'Landslide': '#78350f',  // Dark Brown
  'Default': '#6b7280'     // Neutral color for other disaster types
};

export const chartColors = [
  '#ef4444', // Panic - Red
  '#f97316', // Fear/Anxiety - Orange
  '#8b5cf6', // Disbelief - Purple
  '#10b981', // Resilience - Green
  '#6b7280'  // Neutral - Gray
];

export function getSentimentColor(sentiment: string | null): string {
  if (!sentiment) return '#6b7280'; // Default gray for null
  
  // Normalize the sentiment string to handle case differences
  const normalizedSentiment = sentiment.toLowerCase();
  
  if (normalizedSentiment.includes('panic')) {
    return '#ef4444';
  } else if (normalizedSentiment.includes('fear') || normalizedSentiment.includes('anxiety')) {
    return '#f97316';
  } else if (normalizedSentiment.includes('disbelief')) {
    return '#8b5cf6';
  } else if (normalizedSentiment.includes('resilience')) {
    return '#10b981';
  } else if (normalizedSentiment.includes('neutral')) {
    return '#6b7280';
  } else {
    // Default case
    return '#6b7280';
  }
}

export function getSentimentBadgeClasses(sentiment: string | null): string {
  if (!sentiment) return 'bg-slate-100 text-slate-600'; // Default for null
  
  // Normalize the sentiment string to handle case differences
  const normalizedSentiment = sentiment.toLowerCase();
  
  if (normalizedSentiment.includes('panic')) {
    return 'bg-red-100 text-red-600';
  } else if (normalizedSentiment.includes('fear') || normalizedSentiment.includes('anxiety')) {
    return 'bg-orange-100 text-orange-600';
  } else if (normalizedSentiment.includes('disbelief')) {
    return 'bg-purple-100 text-purple-600';
  } else if (normalizedSentiment.includes('resilience')) {
    return 'bg-green-100 text-green-600';
  } else if (normalizedSentiment.includes('neutral')) {
    return 'bg-slate-100 text-slate-600';
  } else {
    // Default case
    return 'bg-slate-100 text-slate-600';
  }
}

/**
 * Get color for disaster type according to user specifications:
 * - Flood: Blue
 * - Typhoon: Dark Blue
 * - Fire: Orange
 * - Volcanic Eruptions: Red
 * - Earthquake: Brown
 * - Landslide: Dark Brown
 * - Others: Neutral gray
 * 
 * Note: Tsunami has been completely removed as requested
 */
export function getDisasterTypeColor(disasterType: string | null): string {
  if (!disasterType) return disasterTypeColors.Default;
  
  // Normalize the input by converting to lowercase
  const normalizedType = disasterType.toLowerCase();
  
  // Check for each disaster type, including variations
  if (normalizedType.includes('flood')) return disasterTypeColors.Flood;
  if (normalizedType.includes('typhoon') || normalizedType.includes('storm') || normalizedType.includes('bagyo')) return disasterTypeColors.Typhoon;
  if (normalizedType.includes('fire') || normalizedType.includes('sunog')) return disasterTypeColors.Fire;
  if (normalizedType.includes('volcano') || normalizedType.includes('volcanic') || normalizedType.includes('eruption') || normalizedType.includes('bulkan')) return disasterTypeColors['Volcanic Eruptions'];
  if (normalizedType.includes('earthquake') || normalizedType.includes('quake') || normalizedType.includes('lindol')) return disasterTypeColors.Earthquake;
  if (normalizedType.includes('landslide') || normalizedType.includes('mudslide')) return disasterTypeColors.Landslide;
  
  // Default color for other disaster types
  return disasterTypeColors.Default;
}

/**
 * Creates a gradient background string for progress bars showing multiple sentiments and disaster types
 * The gradient will blend colors proportionally based on the counts of each sentiment/disaster type
 * @param sentiments Record of sentiment types with their counts
 * @param disasterTypes Record of disaster types with their counts
 * @returns CSS gradient string to use as background property
 */
export function createProgressGradient(
  sentiments: Record<string, number>,
  disasterTypes: Record<string, number>
): string {
  // Convert records to arrays of [type, count] for easier processing
  const sentimentEntries = Object.entries(sentiments);
  const disasterEntries = Object.entries(disasterTypes);
  
  // Combine both arrays for total count calculation
  const allEntries = [...sentimentEntries, ...disasterEntries];
  const totalCount = allEntries.reduce((sum, [_, count]) => sum + count, 0);
  
  // If no data, return a default gray gradient
  if (totalCount === 0) {
    return 'linear-gradient(to right, #e5e7eb, #d1d5db)';
  }
  
  // Sort entries by count (highest first) to prioritize dominant colors
  const sortedEntries = allEntries.sort((a, b) => b[1] - a[1]);
  
  // Limit to top 4 entries for cleaner gradients
  const topEntries = sortedEntries.slice(0, 4);
  
  // Calculate percentages and positions for the gradient
  let currentPosition = 0;
  const gradientStops = topEntries.map(([type, count], index) => {
    // Determine if it's a sentiment or disaster type
    const isSentiment = sentiments.hasOwnProperty(type);
    
    // Get appropriate color
    const color = isSentiment ? getSentimentColor(type) : getDisasterTypeColor(type);
    
    // Calculate percentage of total (how much of the bar this entry represents)
    const percentage = (count / totalCount) * 100;
    
    // Calculate the start and end positions for this color
    const startPosition = currentPosition;
    const endPosition = currentPosition + percentage;
    
    // Update current position for next iteration
    currentPosition = endPosition;
    
    // Return gradient stop string with positions
    return `${color} ${startPosition}%, ${color} ${endPosition}%`;
  });
  
  // Construct the full gradient string
  return `linear-gradient(to right, ${gradientStops.join(', ')})`;
}
