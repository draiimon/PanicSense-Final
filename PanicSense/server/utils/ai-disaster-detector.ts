/**
 * AI Disaster Detector - TypeScript Version
 * Uses Groq API through our Python script to provide more intelligent
 * disaster detection and classification than simple keyword matching
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import * as groqConfig from './groq-config';

// Check Groq API key on startup
groqConfig.logGroqStatus();

export interface NewsItem {
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

export interface DisasterAnalysis {
  is_disaster_related: boolean;
  disaster_type: string;
  location: string;
  severity: number;
  confidence: number;
  explanation: string;
}

export interface AnalyzedNewsItem extends NewsItem {
  analysis: DisasterAnalysis;
  analyzed_at: string;
}

class AIDisasterDetector {
  private pythonScript: string;
  private cache: Map<string, { data: DisasterAnalysis, timestamp: number }>;
  private cacheExpiry: number;
  private scriptExists: boolean;
  
  constructor() {
    this.pythonScript = path.join(process.cwd(), 'python', 'process.py');
    this.cache = new Map(); // Simple memory cache to avoid repeated analysis
    this.cacheExpiry = 60 * 60 * 1000; // Cache expires after 1 hour (in milliseconds)
    
    // Check if Python script exists
    this.scriptExists = fs.existsSync(this.pythonScript);
    
    if (!this.scriptExists) {
      console.error(`Warning: Python disaster analysis script not found at ${this.pythonScript}`);
    } else {
      console.log(`✅ AI Disaster Detector initialized with script at ${this.pythonScript}`);
    }
  }
  
  /**
   * Check if a news item is in our cache
   */
  getCached(newsItem: NewsItem): DisasterAnalysis | null {
    const cacheKey = `${newsItem.id || newsItem.title}`;
    const cached = this.cache.get(cacheKey);
    
    if (!cached) return null;
    
    // Check if cache entry has expired
    const now = Date.now();
    if (now - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Add a news item analysis to our cache
   */
  addToCache(newsItem: NewsItem, analysis: DisasterAnalysis): void {
    const cacheKey = `${newsItem.id || newsItem.title}`;
    this.cache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now()
    });
  }
  
  /**
   * Analyze a news item using our Python script with Groq API
   */
  async analyzeNewsItem(newsItem: NewsItem): Promise<DisasterAnalysis> {
    // Check cache first
    const cached = this.getCached(newsItem);
    if (cached) return cached;
    
    if (!this.scriptExists || !groqConfig.isGroqConfigured()) {
      // Fallback to rule-based approach if Python script or API key is unavailable
      console.warn("⚠️ Groq API key not found. Using fallback analysis.");
      return this._fallbackAnalysis(newsItem);
    }
    
    try {
      // Create a temporary file with the news item
      const tempFile = path.join(os.tmpdir(), `news_${Date.now()}.json`);
      fs.writeFileSync(tempFile, JSON.stringify({
        title: newsItem.title || '',
        content: newsItem.content || ''
      }));
      
      // Run the Python script with environment variables
      const result = await new Promise<DisasterAnalysis>((resolve, reject) => {
        // Create a copy of process.env to avoid modifying the original
        const env = { ...process.env };
        
        // Spawn Python process with environment variables
        const pythonProcess = spawn('python3', [this.pythonScript, '--file', tempFile], { env });
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
          // Clean up the temp file
          try {
            fs.unlinkSync(tempFile);
          } catch (e) {
            console.error('Error deleting temp file:', e);
          }
          
          if (code !== 0) {
            console.error(`Python script exited with code ${code}`);
            console.error(`Error output: ${errorOutput}`);
            reject(new Error(`AI analysis failed with code ${code}: ${errorOutput}`));
            return;
          }
          
          try {
            const parsedOutput = JSON.parse(output);
            resolve(parsedOutput);
          } catch (e: any) {
            console.error('Error parsing Python output:', e);
            console.error('Output was:', output);
            reject(new Error(`Failed to parse AI analysis output: ${e.message}`));
          }
        });
      });
      
      // Cache the result
      this.addToCache(newsItem, result);
      
      return result;
    } catch (error) {
      console.error('Error running AI disaster analysis:', error);
      return this._fallbackAnalysis(newsItem);
    }
  }
  
  /**
   * Fallback to rule-based analysis if AI is unavailable
   * Enhanced version with better Filipino-specific keywords and context
   */
  _fallbackAnalysis(newsItem: NewsItem): DisasterAnalysis {
    const combinedText = `${newsItem.title || ''} ${newsItem.content || ''}`.toLowerCase();
    
    // Enhanced keyword-based detection for Filipino context
    const disasterKeywords: Record<string, string[]> = {
      'typhoon': ['typhoon', 'bagyo', 'storm', 'cyclone', 'hurricane', 'pag-asa', 'signal no.', 'weather disturbance'],
      'earthquake': ['earthquake', 'lindol', 'quake', 'tremor', 'magnitude', 'intensity', 'aftershock', 'phivolcs'],
      'flood': ['flood', 'baha', 'rising water', 'overflow', 'tubig', 'binaha', 'water level', 'pag-apaw'],
      'fire': ['fire', 'sunog', 'blaze', 'burning', 'flame', 'smoke', 'apoy', 'nasusunog', 'nagliliyab'],
      'landslide': ['landslide', 'mudslide', 'rockfall', 'erosion', 'pagguho', 'guho', 'collapsed', 'bumigay'],
      'volcanic eruption': ['volcano', 'eruption', 'ash', 'lava', 'phivolcs', 'bulkan', 'magma', 'ashfall', 'alert level'],
      'tsunami': ['tsunami', 'tidal wave', 'sea level', 'alon', 'daluyong'],
      'drought': ['drought', 'dry', 'water shortage', 'tagtuyot', 'water crisis', 'water supply', 'kakapusan ng tubig'],
      'extreme heat': ['heat wave', 'extreme heat', 'high temperature', 'init', 'mainit', 'temperature']
    };
    
    // Emergency and disaster-related keywords (expanded)
    const emergencyKeywords = [
      'emergency', 'disaster', 'calamity', 'evacuate', 'evacuation', 'ndrrmc', 'pagasa', 'phivolcs',
      'warning', 'alert', 'rescue', 'relief', 'casualty', 'victim', 'damage', 'destroyed', 'affected',
      'state of calamity', 'crisis', 'disaster response', 'kagawaran ng disaster', 'disaster risk reduction',
      'suspension', 'suspende', 'casualties', 'fatalities', 'injured', 'stranded', 'trapped', 'missing',
      'sakuna', 'kalamidad', 'babala', 'ligtas', 'nasalanta', 'nasiraan', 'nawasak', 'evacuation center',
      'red alert', 'orange alert', 'hazard', 'panganib', 'delikado', 'malubha'
    ];
    
    // Check for disaster types
    let matchedType = 'other';
    let highestConfidence = 0.5; // Default confidence
    let severity = 1; // Default severity
    
    // Check for direct keyword matches
    for (const [type, keywords] of Object.entries(disasterKeywords)) {
      for (const keyword of keywords) {
        if (combinedText.includes(keyword)) {
          matchedType = type;
          highestConfidence = 0.7; // Higher confidence for keyword match
          severity = 2; // Moderate severity
          break;
        }
      }
      if (matchedType !== 'other') break;
    }
    
    // Check for emergency keywords to increase confidence and severity
    let emergencyCount = 0;
    for (const keyword of emergencyKeywords) {
      if (combinedText.includes(keyword)) {
        emergencyCount++;
        if (emergencyCount >= 2) {
          highestConfidence = Math.min(0.9, highestConfidence + 0.1);
          severity = Math.min(5, severity + 1);
        }
      }
    }
    
    // If no disaster type is matched but emergency keywords are found
    if (matchedType === 'other' && emergencyCount > 0) {
      matchedType = 'emergency';
      highestConfidence = 0.6; // Moderate confidence for emergency-only detection
      severity = 2; // Low-moderate severity
    }
    
    // Enhanced location detection
    const locationKeywords = [
      // Major cities and urban areas
      'Manila', 'Quezon City', 'Cebu', 'Davao', 'Makati', 'Taguig', 'Pasig',
      'Mandaluyong', 'San Juan', 'Marikina', 'Parañaque', 'Pasay', 'Caloocan',
      'Muntinlupa', 'Las Piñas', 'Valenzuela', 'Navotas', 'Malabon', 'Baguio',
      'Iloilo', 'Bacolod', 'Cagayan de Oro', 'Zamboanga', 'General Santos',
      
      // Major regions and islands
      'Luzon', 'Visayas', 'Mindanao', 'NCR', 'Metro Manila', 'Calabarzon',
      'Central Luzon', 'Western Visayas', 'Central Visayas', 'Eastern Visayas',
      'Northern Mindanao', 'Southern Mindanao', 'ARMM', 'BARMM', 'CAR',
      
      // Provinces
      'Batangas', 'Laguna', 'Cavite', 'Rizal', 'Bulacan', 'Pampanga', 'Nueva Ecija',
      'Pangasinan', 'Ilocos Norte', 'Ilocos Sur', 'La Union', 'Isabela', 'Cagayan',
      'Albay', 'Camarines Sur', 'Camarines Norte', 'Sorsogon', 'Catanduanes',
      'Leyte', 'Southern Leyte', 'Samar', 'Eastern Samar', 'Northern Samar',
      'Iloilo', 'Negros Occidental', 'Negros Oriental', 'Cebu', 'Bohol',
      'Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay',
      'Bukidnon', 'Misamis Oriental', 'Misamis Occidental', 'Lanao del Norte',
      'Lanao del Sur', 'Maguindanao', 'Cotabato', 'Sultan Kudarat', 'South Cotabato',
      'Davao del Norte', 'Davao del Sur', 'Davao Oriental', 'Davao Occidental',
      'Davao de Oro', 'Benguet', 'Ifugao', 'Mountain Province', 'Kalinga', 'Apayao',
      'Abra', 'Bataan', 'Aurora', 'Quirino', 'Nueva Vizcaya', 'Palawan'
    ];
    
    let location = 'Philippines';
    for (const loc of locationKeywords) {
      if (combinedText.includes(loc.toLowerCase())) {
        location = loc;
        break;
      }
    }
    
    // Determine if disaster-related
    const isDisasterRelated = matchedType !== 'other' || emergencyCount > 0;
    
    // Enhance explanation
    let explanation = "Fallback keyword-based analysis: ";
    
    if (isDisasterRelated) {
      if (matchedType !== 'other') {
        explanation += `Identified as ${matchedType} event`;
      } else {
        explanation += "Emergency situation detected";
      }
      
      explanation += ` in ${location} with ${emergencyCount} emergency indicators.`;
    } else {
      explanation = "No disaster-related content detected using keyword analysis.";
    }
    
    return {
      is_disaster_related: isDisasterRelated,
      disaster_type: matchedType,
      location: location,
      severity: severity,
      confidence: highestConfidence,
      explanation: explanation
    };
  }
  
  /**
   * Analyze a batch of news items
   * Processes in sequence to avoid rate limits
   */
  async analyzeBatch(newsItems: NewsItem[], maxItems = 5): Promise<AnalyzedNewsItem[]> {
    const results: AnalyzedNewsItem[] = [];
    let count = 0;
    
    for (const item of newsItems) {
      if (count >= maxItems) break;
      
      try {
        const analysis = await this.analyzeNewsItem(item);
        
        // Add the analysis to a copy of the item
        const enrichedItem: AnalyzedNewsItem = {
          ...item,
          analysis: analysis,
          analyzed_at: new Date().toISOString()
        };
        
        results.push(enrichedItem);
        count++;
        
        // Add a small delay between requests to avoid rate limits
        if (count < newsItems.length && count < maxItems) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error analyzing news item: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return results;
  }
}

// Singleton instance
const aiDisasterDetector = new AIDisasterDetector();

export default aiDisasterDetector;