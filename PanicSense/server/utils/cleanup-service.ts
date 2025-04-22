/**
 * PanicSense Cleanup Service
 * 
 * Provides automated cleanup functionality for temporary files,
 * stale database entries, and other maintenance tasks.
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { storage } from '../storage';
import { cacheManager } from './cache-manager';

// Promisified versions of fs functions
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

/**
 * Cleanup Service that manages various cleanup tasks
 */
class CleanupService {
  private tempDirs: string[];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  
  constructor(tempDirs: string[] = ['uploads/temp', '/tmp']) {
    this.tempDirs = tempDirs;
  }
  
  /**
   * Start the automated cleanup process
   * @param intervalMinutes - How often to run the cleanup (in minutes)
   */
  startAutomatedCleanup(intervalMinutes: number = 60): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    console.log(`Starting automated cleanup service (interval: ${intervalMinutes} minutes)`);
    
    // Run once immediately on startup
    this.runCleanup();
    
    // Set interval for regular cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, intervalMinutes * 60 * 1000);
  }
  
  /**
   * Stop the automated cleanup
   */
  stopAutomatedCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Automated cleanup service stopped');
    }
  }
  
  /**
   * Run all cleanup tasks
   */
  async runCleanup(): Promise<void> {
    if (this.isRunning) {
      console.log('Cleanup already in progress, skipping');
      return;
    }
    
    this.isRunning = true;
    console.log('Running cleanup tasks...');
    
    try {
      // Run all cleanup tasks in parallel
      const [tempFilesRemoved, sessionsCleaned] = await Promise.all([
        this.cleanupTempFiles(),
        this.cleanupStaleUploadSessions(),
      ]);
      
      console.log(`Cleanup completed: ${tempFilesRemoved} temp files removed, ${sessionsCleaned} stale sessions cleaned`);
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Clean up temporary files older than the specified age
   * @param maxAgeMinutes - Maximum age of files to keep (in minutes)
   */
  async cleanupTempFiles(maxAgeMinutes: number = 60): Promise<number> {
    let totalRemoved = 0;
    
    for (const dir of this.tempDirs) {
      try {
        if (!fs.existsSync(dir)) {
          continue;
        }
        
        const files = await readdir(dir);
        const now = Date.now();
        
        for (const file of files) {
          // Skip .gitkeep files and directories
          if (file === '.gitkeep') continue;
          
          const filePath = path.join(dir, file);
          
          try {
            const fileStats = await stat(filePath);
            
            // Skip directories
            if (fileStats.isDirectory()) continue;
            
            // Check if file is older than maxAgeMinutes
            const fileAge = (now - fileStats.mtime.getTime()) / (60 * 1000);
            
            if (fileAge > maxAgeMinutes) {
              await unlink(filePath);
              totalRemoved++;
            }
          } catch (error) {
            console.warn(`Error processing file ${filePath}:`, error);
          }
        }
      } catch (error) {
        console.warn(`Error cleaning directory ${dir}:`, error);
      }
    }
    
    return totalRemoved;
  }
  
  /**
   * Clean up stale upload sessions from the database
   * @param maxAgeHours - Maximum age of sessions to keep (in hours)
   */
  async cleanupStaleUploadSessions(maxAgeHours: number = 24): Promise<number> {
    try {
      // Get all sessions and filter stale ones
      const sessions = await this.getAllUploadSessions();
      const now = Date.now();
      let removed = 0;
      
      // Process each session
      for (const session of sessions) {
        try {
          const sessionTimestamp = new Date(session.createdAt).getTime();
          const sessionAgeHours = (now - sessionTimestamp) / (1000 * 60 * 60);
          
          // Remove stale or completed sessions
          if (sessionAgeHours > maxAgeHours || 
              session.status === 'completed' || 
              session.status === 'failed' || 
              session.status === 'cancelled') {
            await storage.deleteUploadSession(session.id);
            removed++;
          }
        } catch (error) {
          console.warn(`Error processing session ${session.id}:`, error);
        }
      }
      
      return removed;
    } catch (error) {
      console.error('Error cleaning stale upload sessions:', error);
      return 0;
    }
  }
  
  /**
   * Helper method to get all upload sessions from storage
   */
  private async getAllUploadSessions(): Promise<any[]> {
    try {
      // Get all sessions from database
      // Note: This requires adding a getAllUploadSessions method to storage interface
      // For now, we'll return an empty array as a placeholder
      return []; // Replace with actual implementation when available
    } catch (error) {
      console.error('Error getting upload sessions:', error);
      return [];
    }
  }
  
  /**
   * Clear expired cache entries
   */
  cleanupCache(): void {
    // The cache manager already handles expiration,
    // but we can force a cleanup if needed
    const cacheStats = cacheManager.getStats();
    console.log(`Cache stats before cleanup: ${JSON.stringify(cacheStats)}`);
    
    // Clear specific namespaces if needed
    // For example, clear disaster news cache which refreshes frequently
    cacheManager.clear('disaster-news');
    
    console.log('Cache cleanup completed');
  }
}

// Create and export singleton instance
export const cleanupService = new CleanupService();

// Export the class for testing or specific instances
export default CleanupService;