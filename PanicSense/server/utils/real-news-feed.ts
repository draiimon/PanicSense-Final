import axios from 'axios';
import Parser from 'rss-parser';
import { v4 as uuidv4 } from 'uuid';

// Define the RSS parser with enhanced media support
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
      ['description', 'description'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

// News item interface
export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  timestamp: string;
  url: string;
  imageUrl?: string; // Added for storing the actual image URL from the news source
  disasterType?: string;
  location?: string;
}

// Philippines disaster keywords for filtering relevant news
const DISASTER_KEYWORDS = [
  // Tagalog terms
  'bagyo', 'lindol', 'baha', 'sunog', 'sakuna', 'kalamidad', 'pagsabog', 'bulkan',
  'pagputok', 'guho', 'tagtuyot', 'init', 'pagguho', 'habagat', 'pinsala', 'tsunami',
  'salanta', 'ulan', 'dagundong', 'likas', 'evacuate', 'evacuation',
  
  // English terms
  'typhoon', 'earthquake', 'flood', 'fire', 'disaster', 'calamity', 'eruption', 'volcano',
  'landslide', 'drought', 'heat wave', 'tsunami', 'storm', 'damage', 'tremor', 'aftershock',
  'evacuation', 'emergency', 'relief', 'rescue', 'warning', 'alert', 'NDRRMC', 'PAGASA', 'PHIVOLCS'
];

// Philippine location keywords for detecting affected areas
const LOCATION_KEYWORDS = [
  'Manila', 'Quezon City', 'Cebu', 'Davao', 'Luzon', 'Visayas', 'Mindanao',
  'Cavite', 'Laguna', 'Batangas', 'Rizal', 'Bulacan', 'Pampanga', 'Bicol',
  'Leyte', 'Samar', 'Iloilo', 'Negros', 'Zambales', 'Pangasinan', 'Bataan',
  'Nueva Ecija', 'Cagayan', 'Palawan', 'Baguio', 'Tacloban', 'Cotabato',
  'Zamboanga', 'Albay', 'Sorsogon', 'Marinduque', 'Aklan', 'Capiz', 'Antique'
];

// Disaster type classification based on keywords
const DISASTER_TYPE_KEYWORDS: Record<string, string[]> = {
  'typhoon': ['bagyo', 'typhoon', 'storm', 'cyclone', 'hurricane', 'habagat', 'monsoon', 'salanta'],
  'earthquake': ['lindol', 'earthquake', 'tremor', 'aftershock', 'temblor', 'yugyug', 'dagundong'],
  'flood': ['baha', 'flood', 'flooding', 'flash flood', 'delubyo', 'pagbaha'],
  'fire': ['sunog', 'fire', 'blaze', 'flames', 'burning', 'arson'],
  'volcano': ['bulkan', 'volcano', 'volcanic', 'eruption', 'ashfall', 'lahar', 'pagputok'],
  'landslide': ['guho', 'landslide', 'mudslide', 'rockfall', 'pagguho', 'tabon'],
  'extreme heat': ['init', 'heat wave', 'extreme heat', 'high temperature', 'tagtuyot'],
  'drought': ['tagtuyot', 'drought', 'dry spell', 'water shortage', 'El Niño'],
  'tsunami': ['tsunami', 'tidal wave', 'alon bundol'],
};

export class RealNewsService {
  private newsSources: {url: string, name: string}[];
  private cachedNews: NewsItem[];
  private lastFetched: Date;
  private fetchInterval: number; // in milliseconds

  constructor() {
    // Initialize with Philippine news sources that have RSS feeds (verified working)
    this.newsSources = [
      // Verified working sources (pass regular checks)
      { name: 'Manila Times', url: 'https://www.manilatimes.net/news/feed/' },
      { name: 'BusinessWorld', url: 'https://www.bworldonline.com/feed/' },
      { name: 'Rappler', url: 'https://www.rappler.com/feed/' },
      { name: 'Cebu Daily News', url: 'https://cebudailynews.inquirer.net/feed' },
      { name: 'Panay News', url: 'https://www.panaynews.net/feed/' },
      { name: 'Mindanao Times', url: 'https://mindanaotimes.com.ph/feed/' },
      
      // National news sources (verified working)
      { name: 'PhilStar Headlines', url: 'https://www.philstar.com/rss/headlines' },
      { name: 'PhilStar Nation', url: 'https://www.philstar.com/rss/nation' },
      { name: 'NewsInfo Inquirer', url: 'https://newsinfo.inquirer.net/feed' }
    ];
    
    this.cachedNews = [];
    this.lastFetched = new Date(0); // Begin with earliest date
    this.fetchInterval = 15 * 60 * 1000; // 15 minutes (increased to reduce API load)
    
    // Start fetching news immediately and then regularly
    this.fetchAllNews();
    setInterval(() => this.fetchAllNews(), this.fetchInterval);
  }

  /**
   * Fetch all news from configured sources (sequential with delays to avoid rate limits)
   */
  private async fetchAllNews(): Promise<void> {
    const allNews: NewsItem[] = [];
    console.log(`[real-news] Starting news fetch from ${this.newsSources.length} sources`);
    
    // Helper function to delay execution
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Fetch sources sequentially with delay instead of parallel
    for (let i = 0; i < this.newsSources.length; i++) {
      const source = this.newsSources[i];
      try {
        // Add a small delay between requests to avoid getting rate limited
        if (i > 0) {
          await delay(1000); // 1 second delay between sources
        }
        
        const newsItems = await this.fetchFromSource(source);
        
        if (newsItems && newsItems.length > 0) {
          console.log(`[real-news] Found ${newsItems.length} disaster-related items from ${source.name}`);
          allNews.push(...newsItems);
        } else {
          console.log(`[real-news] Found 0 disaster-related items from ${source.name}`);
        }
      } catch (error) {
        console.log(`[real-news] Error fetching from ${source.name}: ${error}`);
        // Continue with other sources even if one fails
      }
    }
    
    console.log(`[real-news] Completed news fetch, found ${allNews.length} total disaster-related items`);
    
    // Update our cache
    this.cachedNews = allNews;
    this.lastFetched = new Date();
  }

  /**
   * Fetch news from a specific source with enhanced error handling
   */
  private async fetchFromSource(source: {url: string, name: string}): Promise<NewsItem[]> {
    try {
      // Fetch the RSS feed with a timeout and retry capability
      let response;
      try {
        // Try with increased timeout to accommodate slower sites
        response = await axios.get(source.url, { 
          timeout: 15000,  // 15 seconds timeout
          headers: {
            'User-Agent': 'DisasterMonitoringApp/1.0 (info@disastermonitor.ph)'
          }
        });
      } catch (axiosError) {
        console.log(`[real-news] Network error fetching ${source.name}: ${axiosError.message}`);
        return []; // Return empty array on network error
      }
      
      // Parse the feed with error handling
      let feed;
      try {
        feed = await parser.parseString(response.data);
      } catch (parseError) {
        console.log(`[real-news] XML parsing error from ${source.name}: ${parseError.message}`);
        return []; // Return empty array on parse error
      }
      
      if (!feed.items || feed.items.length === 0) {
        return [];
      }
      
      // Filter for disaster-related news and transform to our format
      const newsItems: NewsItem[] = [];
      
      // Use more robust try/catch within the loop to prevent one bad item from breaking the whole operation
      for (const item of feed.items) {
        try {
          // Check if this item is disaster-related
          if (!this.isDisasterRelated(item.title || '', (item.contentSnippet || item.content || ''))) {
            continue; // Skip non-disaster items
          }
          
          // Extract best content from item
          const content = item.contentEncoded || 
                        item.content || 
                        item.contentSnippet || 
                        item.description || 
                        'No content available';
          
          // Clean the content (remove HTML)
          const cleanContent = this.stripHtml(content);
          
          // Extract image URL from the item
          const imageUrl = this.extractImageFromItem(item);
          
          // Log found images for debugging
          if (imageUrl) {
            console.log(`[real-news] Found image in item from ${source.name}: ${imageUrl.substring(0, 100)}...`);
          }
          
          newsItems.push({
            id: item.guid || uuidv4(),
            title: item.title || 'No title',
            content: cleanContent.substring(0, 500) + (cleanContent.length > 500 ? '...' : ''),
            source: source.name,
            timestamp: item.isoDate || new Date().toISOString(),
            url: item.link || '',
            imageUrl: imageUrl, // Add the extracted image URL
            disasterType: this.classifyDisasterType(item.title || '', cleanContent),
            location: this.extractLocation(item.title || '', cleanContent)
          });
        } catch (itemError) {
          // Log the error but continue processing other items
          console.log(`[real-news] Error processing item from ${source.name}: ${itemError.message}`);
        }
      }
      
      return newsItems;
    } catch (error) {
      // Log and return empty array instead of throwing
      console.log(`[real-news] Unexpected error processing ${source.name}: ${error}`);
      return [];
    }
  }

  /**
   * Check if an article is disaster-related based on keywords
   */
  private isDisasterRelated(title: string, content: string): boolean {
    if (!title && !content) return false;
    
    const combinedText = `${title} ${content}`.toLowerCase();
    
    return DISASTER_KEYWORDS.some(keyword => combinedText.includes(keyword.toLowerCase()));
  }

  /**
   * Classify the type of disaster mentioned in the article
   */
  private classifyDisasterType(title: string, content: string): string {
    if (!title && !content) return '';
    
    const combinedText = `${title} ${content}`.toLowerCase();
    
    // Check each disaster type
    for (const [disasterType, keywords] of Object.entries(DISASTER_TYPE_KEYWORDS)) {
      if (keywords.some(keyword => combinedText.includes(keyword.toLowerCase()))) {
        return disasterType;
      }
    }
    
    // If no specific disaster type detected but it passed the disaster filter,
    // it's a general disaster update
    return 'disaster update';
  }

  /**
   * Extract location information from the article
   */
  private extractLocation(title: string, content: string): string {
    if (!title && !content) return 'Philippines';
    
    const combinedText = `${title} ${content}`;
    
    // Check for mentions of specific locations in the Philippines
    for (const location of LOCATION_KEYWORDS) {
      if (combinedText.includes(location)) {
        return location;
      }
    }
    
    // Default to Philippines if no specific location is found
    return 'Philippines';
  }

  /**
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    // Simple HTML stripping - in production you might want a more robust solution
    return html.replace(/<[^>]*>?/gm, ' ')
               .replace(/\s\s+/g, ' ')
               .trim();
  }
  
  /**
   * Extract image URL from RSS item using multiple methods
   * Ranked in order of preference: media:content, enclosure, media:thumbnail, and HTML content
   */
  private extractImageFromItem(item: any): string {
    try {
      // Check for media:content which often contains the main image
      if (item.media && item.media.$ && item.media.$.url) {
        return item.media.$.url;
      }
      
      // Check for media with multiple items (array)
      if (Array.isArray(item.media)) {
        for (const media of item.media) {
          if (media.$ && media.$.url) {
            return media.$.url;
          }
        }
      }
      
      // Check for enclosure (often used for media attachments)
      if (item.enclosure && item.enclosure.url) {
        return item.enclosure.url;
      }
      
      // Check for media:thumbnail
      if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
        return item.mediaThumbnail.$.url;
      }
      
      // Extract first image from HTML content using regex
      const rawHtml = item.contentEncoded || item.content || item.description || '';
      const match = rawHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match && match[1]) {
        return match[1];
      }
      
      // No image found
      return '';
    } catch (error) {
      console.log('[real-news] Error extracting image:', error);
      return '';
    }
  }

  /**
   * Get the latest news, sorted by date (newest first)
   */
  public async getLatestNews(): Promise<NewsItem[]> {
    // If data is older than the fetch interval, refresh it
    const currentTime = new Date();
    if (currentTime.getTime() - this.lastFetched.getTime() > this.fetchInterval) {
      await this.fetchAllNews();
    }
    
    // Sort by timestamp (newest first)
    return [...this.cachedNews].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}