import fs from 'fs';
import path from 'path';
import os from 'os';

// Interface for the usage data
interface UsageData {
  date: string;
  rowCount: number;
  lastReset: string;
}

class UsageTracker {
  private dataPath: string;
  private dailyLimit: number = 10000;
  
  constructor() {
    const dataDir = path.join(os.tmpdir(), 'disaster-sentiment');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.dataPath = path.join(dataDir, 'usage-data.json');
    this.initializeUsageData();
  }
  
  private initializeUsageData() {
    if (!fs.existsSync(this.dataPath)) {
      const initialData: UsageData = {
        date: this.getCurrentDate(),
        rowCount: 0,
        lastReset: new Date().toISOString()
      };
      
      fs.writeFileSync(this.dataPath, JSON.stringify(initialData, null, 2));
    }
  }
  
  private getCurrentDate(): string {
    // Use UTC time to avoid timezone issues
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  }
  
  private getUsageData(): UsageData {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(data) as UsageData;
    } catch (error) {
      // If there's an error reading the file, initialize with fresh data
      const initialData: UsageData = {
        date: this.getCurrentDate(),
        rowCount: 0,
        lastReset: new Date().toISOString()
      };
      
      fs.writeFileSync(this.dataPath, JSON.stringify(initialData, null, 2));
      return initialData;
    }
  }
  
  private saveUsageData(data: UsageData) {
    fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
  }
  
  /**
   * Check if the current row count has reached the daily limit
   * @returns True if the limit has been reached, false otherwise
   */
  public hasReachedDailyLimit(): boolean {
    const currentData = this.getUsageData();
    const currentDate = this.getCurrentDate();
    
    // Reset the counter if it's a new day
    if (currentData.date !== currentDate) {
      currentData.date = currentDate;
      currentData.rowCount = 0;
      currentData.lastReset = new Date().toISOString();
      this.saveUsageData(currentData);
      return false;
    }
    
    return currentData.rowCount >= this.dailyLimit;
  }
  
  /**
   * Check if processing the given number of rows would exceed the daily limit
   * @param rowCount The number of rows to process
   * @returns The number of rows that can be processed without exceeding the limit, or 0 if the limit is already reached
   */
  public getProcessableRowCount(rowCount: number): number {
    const currentData = this.getUsageData();
    const currentDate = this.getCurrentDate();
    
    // Reset the counter if it's a new day
    if (currentData.date !== currentDate) {
      currentData.date = currentDate;
      currentData.rowCount = 0;
      currentData.lastReset = new Date().toISOString();
      this.saveUsageData(currentData);
      return Math.min(rowCount, this.dailyLimit);
    }
    
    const remainingQuota = this.dailyLimit - currentData.rowCount;
    return Math.max(0, Math.min(rowCount, remainingQuota));
  }
  
  /**
   * Get the current usage statistics
   * @returns The current usage data
   */
  public getUsageStats(): { used: number, limit: number, remaining: number, resetAt: string } {
    const currentData = this.getUsageData();
    const currentDate = this.getCurrentDate();
    
    // Reset the counter if it's a new day
    if (currentData.date !== currentDate) {
      console.log(`Resetting usage stats for new day: ${currentDate} (was ${currentData.date})`);
      currentData.date = currentDate;
      currentData.rowCount = 0;
      currentData.lastReset = new Date().toISOString();
      this.saveUsageData(currentData);
    }
    
    // Calculate the next reset time - midnight UTC
    const now = new Date();
    const tomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1, // Next day
      0, 0, 0, 0 // Midnight
    ));
    
    return {
      used: currentData.rowCount,
      limit: this.dailyLimit,
      remaining: Math.max(0, this.dailyLimit - currentData.rowCount),
      resetAt: tomorrow.toISOString() // Use tomorrow at midnight as the reset time
    };
  }
  
  /**
   * Increment the row count after processing rows
   * @param count The number of rows processed
   */
  public incrementRowCount(count: number) {
    // Always ensure count is a positive number and is valid
    if (count <= 0 || isNaN(count) || !isFinite(count)) {
      console.warn('⚠️ WARNING: Attempted to increment usage counter with invalid count:', count);
      // Use a minimal value of 1 for invalid inputs to ensure all API calls are counted
      count = 1;
      console.log('📊 FIXED: Using minimum count of 1 instead of invalid value');
    }
    
    // Always use Math.floor to ensure whole numbers
    count = Math.floor(count);
    
    const currentData = this.getUsageData();
    const currentDate = this.getCurrentDate();
    
    // Reset the counter if it's a new day
    if (currentData.date !== currentDate) {
      currentData.date = currentDate;
      currentData.rowCount = count;
      currentData.lastReset = new Date().toISOString();
      console.log(`📊 USAGE RESET: Counter reset for new day (${currentDate}). Starting with count:`, count);
    } else {
      const previousCount = currentData.rowCount;
      
      // Ensure we have a valid previous count
      if (isNaN(previousCount) || !isFinite(previousCount) || previousCount < 0) {
        console.warn('⚠️ WARNING: Previous count is invalid:', previousCount);
        // Reset to this count only if previous was invalid
        currentData.rowCount = count;
        console.log(`📊 FIXED: Reset invalid previous count to current count: ${count}`);
      } else {
        // Normal increment
        currentData.rowCount += count;
        console.log(`📊 USAGE UPDATE: Incrementing by ${count} rows. Previous: ${previousCount}, New: ${currentData.rowCount}`);
      }
    }
    
    // Safety check - ensure the count doesn't exceed a reasonable maximum (e.g., 1 million)
    // This prevents data corruption in case of an error
    if (currentData.rowCount > 1000000) {
      console.warn(`⚠️ WARNING: Usage count exceeds 1 million (${currentData.rowCount}). Capping at 1 million.`);
      currentData.rowCount = 1000000;
    }
    
    // Ensure we properly save the updated count
    this.saveUsageData(currentData);
    
    // Log current usage after update (useful for debugging)
    const usage = this.getUsageStats();
    console.log(`📊 CURRENT USAGE: ${usage.used}/${usage.limit} (${usage.remaining} remaining). Resets: ${usage.resetAt}`);
  }
}

// Export a singleton instance
export const usageTracker = new UsageTracker();