import { Request, Response, NextFunction } from 'express';
import { usageTracker } from '../utils/usage-tracker';

// IP-based rate limiting cache
const requestCounts: Record<string, { count: number, resetTime: number }> = {};

// Rate limits by endpoint type
const RATE_LIMITS = {
  // For standard API endpoints (most GET requests)
  standard: { maxRequests: 300, windowMs: 60 * 1000 }, // 300 requests per minute
  
  // For file upload operations (heavier operations)
  upload: { maxRequests: 5, windowMs: 60 * 1000 },     // 5 uploads per minute
  
  // For text analysis (medium weight operations)
  analysis: { maxRequests: 30, windowMs: 60 * 1000 },  // 30 analyses per minute
  
  // For administrative operations
  admin: { maxRequests: 10, windowMs: 60 * 1000 }      // 10 admin requests per minute
};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(requestCounts).forEach(key => {
    if (requestCounts[key].resetTime < now) {
      delete requestCounts[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Rate limiter middleware factory
 * @param limiterType The type of rate limit to apply
 * @returns Express middleware function
 */
export function createRateLimiter(limiterType: keyof typeof RATE_LIMITS = 'standard') {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get client IP (consider X-Forwarded-For for proxy environments)
    const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    
    // Create a unique key for this IP and endpoint type
    const key = `${clientIp}:${limiterType}`;
    const now = Date.now();
    
    // Get the appropriate rate limit config
    const rateLimit = RATE_LIMITS[limiterType];
    
    // Initialize or reset if window expired
    if (!requestCounts[key] || requestCounts[key].resetTime < now) {
      requestCounts[key] = {
        count: 1,
        resetTime: now + rateLimit.windowMs
      };
      
      // Add rate limiting headers
      res.set('X-RateLimit-Limit', rateLimit.maxRequests.toString());
      res.set('X-RateLimit-Remaining', (rateLimit.maxRequests - 1).toString());
      res.set('X-RateLimit-Reset', Math.floor(requestCounts[key].resetTime / 1000).toString());
      
      return next();
    }
    
    // Increment request count
    requestCounts[key].count++;
    
    // Check if limit exceeded
    if (requestCounts[key].count > rateLimit.maxRequests) {
      // Use logarithmic backoff for retry delay calculation: more requests = longer wait
      const overageRatio = requestCounts[key].count / rateLimit.maxRequests;
      const retryAfter = Math.ceil(Math.log10(overageRatio + 1) * 10);
      
      // Add rate limiting headers with retry information
      res.set('Retry-After', retryAfter.toString());
      res.set('X-RateLimit-Limit', rateLimit.maxRequests.toString());
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', Math.floor(requestCounts[key].resetTime / 1000).toString());
      
      // Log rate limit hit (but not too much to prevent log flooding)
      if (requestCounts[key].count % 10 === 0) {
        console.warn(`⚠️ Rate limit exceeded for ${key}: ${requestCounts[key].count} requests`);
      }
      
      return res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: retryAfter,
        resetAt: new Date(requestCounts[key].resetTime).toISOString()
      });
    }
    
    // Add rate limiting headers
    res.set('X-RateLimit-Limit', rateLimit.maxRequests.toString());
    res.set('X-RateLimit-Remaining', (rateLimit.maxRequests - requestCounts[key].count).toString());
    res.set('X-RateLimit-Reset', Math.floor(requestCounts[key].resetTime / 1000).toString());
    
    next();
  };
}

/**
 * Daily usage check middleware - combines with IP rate limiting
 * This is separate from IP-based rate limiting and focuses on the actual data processing volume
 */
export function dailyUsageCheck(req: Request, res: Response, next: NextFunction) {
  // Check if daily limit is reached
  if (usageTracker.hasReachedDailyLimit()) {
    const stats = usageTracker.getUsageStats();
    return res.status(429).json({
      error: 'Daily processing limit reached',
      limit: stats.limit,
      used: stats.used,
      resetAt: stats.resetAt
    });
  }
  
  next();
}