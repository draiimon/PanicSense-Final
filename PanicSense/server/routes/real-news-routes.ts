import { Express, Request, Response } from 'express';
import { RealNewsService } from '../utils/real-news-feed';
// Import AI disaster detector from TypeScript implementation
import aiDisasterDetector from '../utils/ai-disaster-detector';
// Import the disaster news filter for Groq API validation
import { isDisasterNews } from '../utils/disaster-news-filter';

// Initialize our monitoring services
const realNewsService = new RealNewsService();

// Setup routes for real-time news feeds
export async function registerRealNewsRoutes(app: Express): Promise<void> {
  // Get news updates from official sources
  app.get('/api/real-news/posts', async (req: Request, res: Response) => {
    try {
      const newsItems = await realNewsService.getLatestNews();
      res.json(newsItems);
    } catch (error) {
      console.error(`Error getting real news posts:`, error);
      res.status(500).json({ 
        error: 'Could not retrieve news updates', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Get AI-analyzed disaster news (enhanced with AI classification)
  app.get('/api/ai-disaster-news', async (req: Request, res: Response) => {
    try {
      // Get the latest news
      const newsItems = await realNewsService.getLatestNews();
      
      // Get the limit parameter (default to 5)
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      
      // Filter out non-disaster news using Groq API
      const filteredNewsItems = [];
      
      // Process each news item to check if it's a disaster
      for (const newsItem of newsItems) {
        try {
          const validation = await isDisasterNews(newsItem.title, newsItem.content);
          
          if (validation.isDisaster) {
            // Add additional metadata from the validation
            filteredNewsItems.push({
              ...newsItem,
              validatedAsDisaster: true,
              disasterConfidence: validation.confidence,
              disasterType: validation.disasterType,
              validationDetails: validation.details
            });
          }
        } catch (validationError) {
          console.warn(`Error validating news item: ${newsItem.title}`, validationError);
          // Skip items that failed validation
        }
      }
      
      // Ensure we have at least some news items even if validation fails
      const itemsToAnalyze = filteredNewsItems.length > 0 
        ? filteredNewsItems.slice(0, limit) 
        : newsItems.slice(0, limit);
      
      // Use AI to analyze the news items (limited to avoid rate limits)
      const analyzedItems = await aiDisasterDetector.analyzeBatch(itemsToAnalyze, limit);
      
      // Sort by timestamp (newest first)
      const sorted = [...analyzedItems].sort((a, b) => {
        const dateA = new Date(a.timestamp || (a as any).publishedAt || "").getTime();
        const dateB = new Date(b.timestamp || (b as any).publishedAt || "").getTime();
        return dateB - dateA;
      });
      
      res.json(sorted);
    } catch (error) {
      console.error(`Error getting AI-analyzed disaster news:`, error);
      res.status(500).json({ 
        error: 'Could not retrieve AI-analyzed disaster news', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get combined feed (news only, renamed for backward compatibility)
  app.get('/api/combined-feed', async (req: Request, res: Response) => {
    try {
      const newsItems = await realNewsService.getLatestNews();
      
      // Sort by timestamp (newest first)
      const sorted = [...newsItems].sort((a, b) => {
        const dateA = new Date(a.timestamp || (a as any).publishedAt || "").getTime();
        const dateB = new Date(b.timestamp || (b as any).publishedAt || "").getTime();
        return dateB - dateA;
      });
      
      // Pre-filter using keywords to reduce API calls
      const disasterKeywords = [
        'typhoon', 'earthquake', 'flood', 'fire', 'landslide', 'eruption',
        'tsunami', 'evacuation', 'emergency', 'disaster', 'rescue', 'survivors',
        'bagyo', 'lindol', 'baha', 'sunog', 'pagguho', 'bulkan', 'sakuna',
        'quake', 'tremor', 'blaze', 'collapse', 'explosion', 'storm', 'cyclone',
        'evacuate', 'destroyed', 'damaged', 'submerged', 'trapped', 'killed',
        'casualty', 'casualties', 'injured', 'damages', 'devastation'
      ];
      
      // First pass keyword filtering
      const keywordFilteredItems = sorted.filter(item => {
        return disasterKeywords.some(keyword =>
          item.title.toLowerCase().includes(keyword.toLowerCase()) ||
          item.content.toLowerCase().includes(keyword.toLowerCase())
        );
      });
      
      // Do we have enough items after keyword filtering?
      if (keywordFilteredItems.length >= 5) {
        // Just add disaster confidence info
        const enrichedItems = keywordFilteredItems.map(item => {
          // Find which keyword matched
          let matchedKeyword = null;
          for (const keyword of disasterKeywords) {
            if (item.title.toLowerCase().includes(keyword.toLowerCase())) {
              matchedKeyword = keyword;
              break;
            }
          }
          if (!matchedKeyword) {
            for (const keyword of disasterKeywords) {
              if (item.content.toLowerCase().includes(keyword.toLowerCase())) {
                matchedKeyword = keyword;
                break;
              }
            }
          }
          
          // Add disaster metadata
          return {
            ...item,
            validatedAsDisaster: true,
            disasterConfidence: 0.8,
            disasterType: matchedKeyword ? matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1) : "Emergency",
            validationDetails: `Keyword-matched disaster news (${matchedKeyword || 'unknown'})`
          };
        });
        
        // Combine with any remaining non-filtered items
        const nonFilteredIds = new Set(keywordFilteredItems.map(item => item.id));
        const remainingItems = sorted.filter(item => !nonFilteredIds.has(item.id));
        
        // Construct the new sorted array with filtered disaster news first
        sorted.splice(0, sorted.length, ...enrichedItems, ...remainingItems);
      } else {
        // Not enough keyword matches, try more advanced filtering with Groq API
        try {
          const topLimit = Math.min(10, sorted.length);
          const filteredItems = [];
          
          // Validate each news item to check if it's a disaster
          for (const item of sorted.slice(0, topLimit)) {
            try {
              const validation = await isDisasterNews(item.title, item.content);
              
              if (validation.isDisaster) {
                // Add additional metadata for the validated items
                filteredItems.push({
                  ...item,
                  validatedAsDisaster: true,
                  disasterConfidence: validation.confidence,
                  disasterType: validation.disasterType,
                  validationDetails: validation.details
                });
              }
            } catch (validationError) {
              console.warn(`Error validating combined feed item: ${item.title}`, validationError);
              // Skip items that failed validation
            }
          }
          
          // If we have validated disaster news, use those for the top items
          if (filteredItems.length > 0) {
            // Get the non-top items that weren't filtered
            const nonTopItems = sorted.slice(topLimit);
            
            // Construct the new sorted array with filtered disaster news first
            sorted.splice(0, sorted.length, ...filteredItems, ...nonTopItems);
          } else {
            // If validation didn't yield any disaster news, fall back to AI analysis
            const limit = Math.min(5, sorted.length);
            const topItems = sorted.slice(0, limit);
            const analyzedTopItems = await aiDisasterDetector.analyzeBatch(topItems, limit);
            
            // Replace the original top items with the analyzed ones
            // Use type assertion to handle compatibility
            sorted.splice(0, limit, ...(analyzedTopItems as any[]));
          }
        } catch (analysisError) {
          console.warn('Non-fatal error during news validation/analysis:', analysisError);
          // Continue with unfiltered news if validation/analysis fails
        }
      }
      
      res.json(sorted);
    } catch (error) {
      console.error(`Error getting news feed:`, error);
      res.status(500).json({ 
        error: 'Could not retrieve news updates', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get disaster alerts (high priority news only)
  app.get('/api/disaster-alerts', async (req: Request, res: Response) => {
    try {
      const newsItems = await realNewsService.getLatestNews();
      
      // Define strong disaster alert keywords - prioritizing high urgency
      const highPriorityKeywords = [
        'emergency', 'alert', 'warning', 'evacuate', 'evacuación', 'evacuation',
        'danger', 'severe', 'critical', 'imminent', 'immediate', 'urgent',
        'calamity', 'catastrophe', 'disaster declaration', 'state of emergency',
        'mandatory evacuation', 'major disaster', 'NDRRMC alert'
      ];
      
      // Define disaster type keywords
      const disasterTypeKeywords = [
        'typhoon', 'earthquake', 'flood', 'fire', 'landslide', 'eruption',
        'volcano', 'tsunami', 'drought', 'storm', 'cyclone', 'bagyo', 'lindol',
        'baha', 'sunog', 'pagguho', 'bulkan', 'sakuna', 'quake', 'tremor'
      ];
      
      // Combined keywords for broader matching
      const allDisasterKeywords = [...highPriorityKeywords, ...disasterTypeKeywords];
      
      // First, get high-priority alerts (combination of disaster type + urgency keyword)
      const highPriorityAlerts = newsItems.filter(item => {
        const hasHighPriorityWord = highPriorityKeywords.some(keyword => 
          item.title.toLowerCase().includes(keyword.toLowerCase()) ||
          item.content.toLowerCase().includes(keyword.toLowerCase())
        );
        
        const hasDisasterTypeWord = disasterTypeKeywords.some(keyword => 
          item.title.toLowerCase().includes(keyword.toLowerCase()) ||
          item.content.toLowerCase().includes(keyword.toLowerCase())
        );
        
        return hasHighPriorityWord && hasDisasterTypeWord;
      });
      
      // Enhance high priority alerts with metadata
      const enhancedHighPriorityAlerts = highPriorityAlerts.map(item => {
        // Find which disaster type matched
        let matchedDisasterType = null;
        for (const keyword of disasterTypeKeywords) {
          if (item.title.toLowerCase().includes(keyword.toLowerCase()) || 
              item.content.toLowerCase().includes(keyword.toLowerCase())) {
            matchedDisasterType = keyword;
            break;
          }
        }
        
        // Find which urgency keyword matched
        let matchedUrgencyType = null;
        for (const keyword of highPriorityKeywords) {
          if (item.title.toLowerCase().includes(keyword.toLowerCase()) || 
              item.content.toLowerCase().includes(keyword.toLowerCase())) {
            matchedUrgencyType = keyword;
            break;
          }
        }
        
        return {
          ...item,
          validatedAsDisaster: true,
          disasterConfidence: 0.9, // Very high confidence for combined matches
          disasterType: matchedDisasterType ? 
            matchedDisasterType.charAt(0).toUpperCase() + matchedDisasterType.slice(1) : 
            "Emergency",
          urgencyLevel: matchedUrgencyType ? 
            matchedUrgencyType.charAt(0).toUpperCase() + matchedUrgencyType.slice(1) : 
            "Alert",
          validationDetails: `High-priority disaster alert: ${matchedDisasterType || 'unknown'} (${matchedUrgencyType || 'urgent'})`
        };
      });
      
      // Do we have enough high-priority alerts?
      let validatedAlerts: any[] = [];
      
      if (enhancedHighPriorityAlerts.length >= 3) {
        // We have enough high-priority alerts
        validatedAlerts = enhancedHighPriorityAlerts;
        
        // Optionally add a few regular disaster alerts if needed
        if (validatedAlerts.length < 5) {
          // Get regular disaster items that aren't already in high-priority list
          const highPriorityIds = new Set(enhancedHighPriorityAlerts.map(item => item.id));
          
          const regularDisasterItems = newsItems
            .filter(item => 
              !highPriorityIds.has(item.id) && 
              allDisasterKeywords.some(keyword => 
                item.title.toLowerCase().includes(keyword.toLowerCase()) ||
                item.content.toLowerCase().includes(keyword.toLowerCase())
              )
            )
            .slice(0, 5 - validatedAlerts.length);
          
          // Add these to our alerts with somewhat lower confidence
          const enhancedRegularItems = regularDisasterItems.map(item => {
            // Find which keyword matched
            let matchedKeyword = null;
            for (const keyword of allDisasterKeywords) {
              if (item.title.toLowerCase().includes(keyword.toLowerCase()) || 
                  item.content.toLowerCase().includes(keyword.toLowerCase())) {
                matchedKeyword = keyword;
                break;
              }
            }
            
            return {
              ...item,
              validatedAsDisaster: true,
              disasterConfidence: 0.75,
              disasterType: matchedKeyword ? 
                matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1) : 
                "Emergency",
              validationDetails: `Disaster keyword match: ${matchedKeyword || 'unknown'}`
            };
          });
          
          validatedAlerts = [...validatedAlerts, ...enhancedRegularItems];
        }
      } else {
        // Not enough high-priority matches, try API validation as a backup
        try {
          // First, get regular keyword-filtered items
          const keywordFilteredItems = newsItems.filter(item => {
            return allDisasterKeywords.some(keyword => 
              item.title.toLowerCase().includes(keyword.toLowerCase()) ||
              item.content.toLowerCase().includes(keyword.toLowerCase())
            );
          });
          
          // Add the high priority ones first (even if fewer than 3)
          validatedAlerts = [...enhancedHighPriorityAlerts];
          
          // Do we have enough with just keywords?
          if (keywordFilteredItems.length >= 5) {
            // Add enough keyword-filtered items to reach 5 total
            const highPriorityIds = new Set(enhancedHighPriorityAlerts.map(item => item.id));
            const additionalItems = keywordFilteredItems
              .filter(item => !highPriorityIds.has(item.id))
              .slice(0, 5 - validatedAlerts.length);
              
            // Add keyword metadata
            const enhancedAdditionalItems = additionalItems.map(item => {
              // Find which keyword matched
              let matchedKeyword = null;
              for (const keyword of allDisasterKeywords) {
                if (item.title.toLowerCase().includes(keyword.toLowerCase()) || 
                    item.content.toLowerCase().includes(keyword.toLowerCase())) {
                  matchedKeyword = keyword;
                  break;
                }
              }
              
              return {
                ...item,
                validatedAsDisaster: true,
                disasterConfidence: 0.75,
                disasterType: matchedKeyword ? 
                  matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1) : 
                  "Emergency",
                validationDetails: `Disaster keyword match: ${matchedKeyword || 'unknown'}`
              };
            });
            
            validatedAlerts = [...validatedAlerts, ...enhancedAdditionalItems];
          } else {
            // We don't have enough items with just keyword filtering
            // Try a few API calls for validation
            for (const item of keywordFilteredItems.slice(0, 5)) {
              // Skip items we already validated
              if (validatedAlerts.some(alert => alert.id === item.id)) {
                continue;
              }
              
              try {
                const validation = await isDisasterNews(item.title, item.content);
                
                if (validation.isDisaster && validation.confidence > 0.6) {
                  validatedAlerts.push({
                    ...item,
                    validatedAsDisaster: true,
                    disasterConfidence: validation.confidence,
                    disasterType: validation.disasterType,
                    validationDetails: validation.details
                  });
                  
                  // If we have enough validated alerts, stop making API calls
                  if (validatedAlerts.length >= 5) {
                    break;
                  }
                }
              } catch (validationError) {
                console.warn(`Error validating news item for disaster alerts: ${item.title}`, validationError);
              }
            }
            
            // If we still don't have enough alerts, add more keyword-matched items
            if (validatedAlerts.length < 5) {
              const validatedIds = new Set(validatedAlerts.map(alert => alert.id));
              const remainingKeywordItems = keywordFilteredItems
                .filter(item => !validatedIds.has(item.id))
                .slice(0, 5 - validatedAlerts.length);
              
              // Add metadata to remaining items
              const enhancedRemainingItems = remainingKeywordItems.map(item => {
                // Find which keyword matched
                let matchedKeyword = null;
                for (const keyword of allDisasterKeywords) {
                  if (item.title.toLowerCase().includes(keyword.toLowerCase()) || 
                      item.content.toLowerCase().includes(keyword.toLowerCase())) {
                    matchedKeyword = keyword;
                    break;
                  }
                }
                
                return {
                  ...item,
                  validatedAsDisaster: true,
                  disasterConfidence: 0.65,
                  disasterType: matchedKeyword ? 
                    matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1) : 
                    "Emergency",
                  validationDetails: `Disaster keyword match (fallback): ${matchedKeyword || 'unknown'}`
                };
              });
              
              validatedAlerts = [...validatedAlerts, ...enhancedRemainingItems];
            }
          }
        } catch (validationError) {
          console.warn('Error in disaster alerts validation, using keyword matching only:', validationError);
          
          // Fallback to basic keyword matching
          validatedAlerts = newsItems.filter(item => {
            return allDisasterKeywords.some(keyword => 
              item.title.toLowerCase().includes(keyword.toLowerCase()) ||
              item.content.toLowerCase().includes(keyword.toLowerCase())
            );
          }).slice(0, 10).map(item => {
            // Find which keyword matched
            let matchedKeyword = null;
            for (const keyword of allDisasterKeywords) {
              if (item.title.toLowerCase().includes(keyword.toLowerCase()) || 
                  item.content.toLowerCase().includes(keyword.toLowerCase())) {
                matchedKeyword = keyword;
                break;
              }
            }
            
            return {
              ...item,
              validatedAsDisaster: true,
              disasterConfidence: 0.7,
              disasterType: matchedKeyword ? 
                matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1) : 
                "Emergency",
              validationDetails: `Disaster keyword match (fallback): ${matchedKeyword || 'unknown'}`
            };
          });
        }
      }
      
      // Sort by timestamp (newest first)
      const sorted = [...validatedAlerts].sort((a, b) => {
        const dateA = new Date(a.timestamp || (a as any).publishedAt || "").getTime();
        const dateB = new Date(b.timestamp || (b as any).publishedAt || "").getTime();
        return dateB - dateA;
      });
      
      res.json(sorted);
    } catch (error) {
      console.error(`Error getting disaster alerts:`, error);
      res.status(500).json({ 
        error: 'Could not retrieve disaster alerts', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Enhanced logging for development
  console.log('=== REAL NEWS SERVICE INITIALIZATION ===');
  console.log('✅ Real news feed routes registered successfully');
  
  // Schedule periodic news fetching
  const FETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes
  
  // Initial fetch on startup
  setTimeout(async () => {
    try {
      console.log('🔄 Performing initial news fetch...');
      const news = await realNewsService.getLatestNews();
      console.log(`📰 Retrieved ${news.length} news items from sources`);
      
      // Log sources breakdown
      const sourceCounts: Record<string, number> = {};
      news.forEach(item => {
        const source = item.source || 'unknown';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
      
      Object.entries(sourceCounts).forEach(([source, count]) => {
        console.log(`📊 Source: ${source}, Items: ${count}`);
      });
    } catch (error) {
      console.error('❌ Error during initial news fetch:', error);
    }
  }, 5000); // 5 second delay after server start
  
  // Schedule periodic fetches to keep data fresh
  console.log(`⏰ Scheduling news fetches every ${FETCH_INTERVAL/60000} minutes`);
  setInterval(async () => {
    try {
      console.log('🔄 Performing scheduled news fetch...');
      const news = await realNewsService.getLatestNews();
      console.log(`📰 Retrieved ${news.length} news items`);
    } catch (error) {
      console.error('❌ Error during scheduled news fetch:', error);
    }
  }, FETCH_INTERVAL);
  
  return Promise.resolve();
}