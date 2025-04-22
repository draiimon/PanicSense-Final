/**
 * AI Disaster Detector
 * Uses Groq API through our Python script to provide more intelligent
 * disaster detection and classification than simple keyword matching
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const groqConfig = require('./groq-config');

// Check Groq API key on startup
groqConfig.logGroqStatus();

class AIDisasterDetector {
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
  getCached(newsItem) {
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
  addToCache(newsItem, analysis) {
    const cacheKey = `${newsItem.id || newsItem.title}`;
    this.cache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now()
    });
  }
  
  /**
   * Analyze a news item using our Python script with Groq API
   */
  async analyzeNewsItem(newsItem) {
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
      const result = await new Promise((resolve, reject) => {
        // Create a copy of process.env to avoid modifying the original
        const env = { ...process.env };
        
        // Spawn Python process with environment variables 
        // Use correct argument format for the Python script
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
          } catch (e) {
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
   */
  _fallbackAnalysis(newsItem) {
    const combinedText = `${newsItem.title || ''} ${newsItem.content || ''}`.toLowerCase();
    
    // Simple keyword-based detection
    const disasterKeywords = {
      'typhoon': ['typhoon', 'bagyo', 'storm', 'cyclone'],
      'earthquake': ['earthquake', 'lindol', 'quake', 'tremor', 'magnitude'],
      'flood': ['flood', 'baha', 'rising water', 'overflow'],
      'fire': ['fire', 'sunog', 'blaze', 'burning'],
      'landslide': ['landslide', 'mudslide', 'rockfall', 'erosion'],
      'volcanic eruption': ['volcano', 'eruption', 'ash', 'lava', 'phivolcs', 'bulkan'],
      'drought': ['drought', 'dry', 'water shortage', 'tagtuyot'],
      'extreme heat': ['heat wave', 'extreme heat', 'high temperature']
    };
    
    // Check for disaster types
    let matchedType = 'other';
    let highestConfidence = 0.5; // Default confidence
    
    for (const [type, keywords] of Object.entries(disasterKeywords)) {
      for (const keyword of keywords) {
        if (combinedText.includes(keyword)) {
          matchedType = type;
          highestConfidence = 0.7; // Higher confidence for keyword match
          break;
        }
      }
      if (matchedType !== 'other') break;
    }
    
    // Simple location detection (very basic)
    const locationKeywords = [
      'Manila', 'Quezon City', 'Cebu', 'Davao', 'Luzon', 'Visayas', 'Mindanao',
      'Batangas', 'Laguna', 'Cavite', 'Rizal', 'Pampanga', 'Bulacan', 'Bicol'
    ];
    
    let location = 'Philippines';
    for (const loc of locationKeywords) {
      if (combinedText.includes(loc.toLowerCase())) {
        location = loc;
        break;
      }
    }
    
    const isDisasterRelated = matchedType !== 'other' || 
      ['emergency', 'disaster', 'calamity', 'evacuate', 'evacuation', 'ndrrmc', 'pagasa', 'phivolcs']
        .some(term => combinedText.includes(term));
    
    return {
      is_disaster_related: isDisasterRelated,
      disaster_type: matchedType,
      location: location,
      severity: isDisasterRelated ? 3 : 0,
      confidence: highestConfidence,
      explanation: "Fallback rule-based analysis"
    };
  }
  
  /**
   * Analyze a batch of news items
   * Processes in sequence to avoid rate limits
   */
  async analyzeBatch(newsItems, maxItems = 5) {
    const results = [];
    let count = 0;
    
    for (const item of newsItems) {
      if (count >= maxItems) break;
      
      try {
        const analysis = await this.analyzeNewsItem(item);
        
        // Add the analysis to a copy of the item
        const enrichedItem = {
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
        console.error(`Error analyzing news item: ${error.message}`);
      }
    }
    
    return results;
  }
}

// Singleton instance
const aiDisasterDetector = new AIDisasterDetector();

// For CommonJS
module.exports = aiDisasterDetector;
// For ESM
module.exports.default = aiDisasterDetector;