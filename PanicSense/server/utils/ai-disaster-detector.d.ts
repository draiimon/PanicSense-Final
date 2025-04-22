/**
 * Type definitions for the AI Disaster Detector
 */

interface NewsItem {
  id?: string;
  title: string;
  content: string;
  timestamp?: string;
  publishedAt?: string;
  source?: string;
  url?: string;
  imageUrl?: string;
  [key: string]: any;
}

interface DisasterAnalysis {
  is_disaster_related: boolean;
  disaster_type: string;
  location: string;
  severity: number;
  confidence: number;
  explanation: string;
}

interface AnalyzedNewsItem extends NewsItem {
  analysis: DisasterAnalysis;
  analyzed_at: string;
}

declare class AIDisasterDetector {
  constructor();
  
  /**
   * Check if a news item is in our cache
   */
  getCached(newsItem: NewsItem): DisasterAnalysis | null;
  
  /**
   * Add a news item analysis to our cache
   */
  addToCache(newsItem: NewsItem, analysis: DisasterAnalysis): void;
  
  /**
   * Analyze a news item using our Python script with OpenAI
   */
  analyzeNewsItem(newsItem: NewsItem): Promise<DisasterAnalysis>;
  
  /**
   * Fallback to rule-based analysis if AI is unavailable
   */
  _fallbackAnalysis(newsItem: NewsItem): DisasterAnalysis;
  
  /**
   * Analyze a batch of news items
   * Processes in sequence to avoid rate limits
   */
  analyzeBatch(newsItems: NewsItem[], maxItems?: number): Promise<AnalyzedNewsItem[]>;
}

declare const aiDisasterDetector: AIDisasterDetector;
export default aiDisasterDetector;