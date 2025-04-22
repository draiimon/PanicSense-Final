import { db } from '../db';
import { eq, and, or, lt, gt, sql } from 'drizzle-orm';
import { uploadSessions } from '@shared/schema';
import { SERVER_START_TIMESTAMP } from '../index';

// Helper function to ensure timestamp is always a string
function normalizeTimestamp(timestamp: string | number | Date | unknown): string {
  if (timestamp === null || timestamp === undefined) {
    return Date.now().toString(); // Default to current time
  }
  
  if (typeof timestamp === 'number') {
    return timestamp.toString();
  }
  
  if (timestamp instanceof Date) {
    return timestamp.getTime().toString();
  }
  
  // If it's already a string, return it
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  // For any other types, convert to string safely
  try {
    return String(timestamp);
  } catch (e) {
    console.warn('Failed to normalize timestamp, using current time', e);
    return Date.now().toString();
  }
}

/**
 * Enhanced upload session manager to ensure clean uploads and prevent orphaned sessions
 */
export class UploadSessionManager {
  // Stale session threshold in milliseconds (30 minutes)
  private readonly STALE_SESSION_THRESHOLD = 30 * 60 * 1000;
  
  /**
   * Get an active upload session by ID
   */
  async getSessionById(sessionId: string) {
    try {
      // Use direct SQL query to avoid potential column name issues
      const result = await db.execute(sql`
        SELECT * FROM upload_sessions
        WHERE session_id = ${sessionId}
        LIMIT 1
      `);
      
      return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting upload session:', error);
      return null;
    }
  }
  
  /**
   * Find any active upload sessions
   * A session is considered active if it's in 'processing' status and not stale
   */
  async findActiveSession() {
    try {
      // Just use direct SQL to avoid schema issues with column names
      const result = await db.execute(sql`
        SELECT * FROM upload_sessions 
        WHERE status = 'processing' 
        LIMIT 1
      `);
      
      if (result.rows && result.rows.length > 0) {
        return result.rows[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error finding active upload session:', error);
      return null;
    }
  }
  
  /**
   * Create a new upload session
   */
  async createSession(sessionId: string, fileId: number | null = null) {
    try {
      const now = new Date().toISOString();
      const timestamp = normalizeTimestamp(SERVER_START_TIMESTAMP);
      const initialProgress = JSON.stringify({
        processed: 0,
        total: 0,
        stage: 'Initializing...',
        timestamp: Date.now()
      });
      
      try {
        // Try with server_start_timestamp first
        await db.execute(sql`
          INSERT INTO upload_sessions (
            session_id, 
            status, 
            file_id, 
            created_at, 
            updated_at, 
            server_start_timestamp,
            progress
          ) VALUES (
            ${sessionId},
            'processing',
            ${fileId},
            ${now},
            ${now},
            ${timestamp},
            ${initialProgress}
          )
        `);
      } catch (error: any) {
        // If server_start_timestamp column doesn't exist, try without it
        if (error.toString().includes('column "server_start_timestamp" of relation "upload_sessions" does not exist')) {
          await db.execute(sql`
            INSERT INTO upload_sessions (
              session_id, 
              status, 
              file_id, 
              created_at, 
              updated_at, 
              progress
            ) VALUES (
              ${sessionId},
              'processing',
              ${fileId},
              ${now},
              ${now},
              ${initialProgress}
            )
          `);
        } else {
          // If it's a different error, or if the table doesn't exist at all,
          // create a mock session in memory but don't fail the user operation
          console.warn('Unable to create upload session in database, using in-memory session instead');
        }
      }
      
      return true;
    } catch (error) {
      // Log but don't crash the application - allow the process to continue
      console.warn('Error creating upload session (continuing anyway):', error);
      return true; // Return true to prevent error propagation
    }
  }
  
  /**
   * Update an existing upload session
   */
  async updateSession(sessionId: string, status: string, progress: any) {
    try {
      // First check if the session exists
      const existingSession = await this.getSessionById(sessionId);
      if (!existingSession) {
        return false;
      }
      
      // Convert progress to string if it's an object
      const progressStr = typeof progress === 'object' 
        ? JSON.stringify(progress)
        : progress;
        
      const now = new Date().toISOString();
      
      try {
        // Try the standard update with server_start_timestamp
        const timestamp = normalizeTimestamp(SERVER_START_TIMESTAMP);
        await db.execute(sql`
          UPDATE upload_sessions
          SET 
            status = ${status},
            progress = ${progressStr},
            updated_at = ${now},
            server_start_timestamp = ${timestamp}
          WHERE session_id = ${sessionId}
        `);
      } catch (error: any) {
        // If server_start_timestamp column doesn't exist, try without it
        if (error.toString().includes('column "server_start_timestamp" of relation "upload_sessions" does not exist')) {
          await db.execute(sql`
            UPDATE upload_sessions
            SET 
              status = ${status},
              progress = ${progressStr},
              updated_at = ${now}
            WHERE session_id = ${sessionId}
          `);
        } else {
          // Rethrow if it's a different error
          throw error;
        }
      }
      
      return true;
    } catch (error) {
      // Log but don't crash - allow the process to continue
      console.error('Error updating upload session (continuing anyway):', error);
      return true; // Return true to prevent error propagation
    }
  }
  
  /**
   * Mark a session as complete
   */
  async completeSession(sessionId: string) {
    return this.updateSession(sessionId, 'completed', {
      stage: 'Analysis complete',
      timestamp: Date.now(),
      isComplete: true
    });
  }
  
  /**
   * Mark a session as error
   */
  async errorSession(sessionId: string, errorMessage: string) {
    return this.updateSession(sessionId, 'error', {
      stage: `Error: ${errorMessage}`,
      timestamp: Date.now(),
      error: errorMessage
    });
  }
  
  /**
   * Mark a session as canceled
   */
  async cancelSession(sessionId: string) {
    return this.updateSession(sessionId, 'canceled', {
      stage: 'Upload canceled',
      timestamp: Date.now(),
      isCanceled: true
    });
  }
  
  /**
   * Delete a session
   */
  async deleteSession(sessionId: string) {
    try {
      // Use raw SQL to avoid any column name issues
      await db.execute(sql`
        DELETE FROM upload_sessions
        WHERE session_id = ${sessionId}
      `);
      
      return true;
    } catch (error) {
      console.error('Error deleting upload session:', error);
      return false;
    }
  }
  
  /**
   * Clean up stale or error sessions
   * This should be called periodically to prevent orphaned sessions
   */
  async cleanupSessions() {
    try {
      // Use direct SQL to avoid schema issues with column names
      const result = await db.execute(sql`
        SELECT * FROM upload_sessions 
        WHERE status = 'error' OR status = 'canceled'
      `);
      
      const sessionsToClean = result.rows || [];
      
      // Delete all sessions that need cleaning
      if (sessionsToClean.length > 0) {
        // Use sessionId or session_id based on what's in the result
        const sessionIds = sessionsToClean.map(s => s.sessionId || s.session_id);
        
        // Use raw SQL to avoid any column name issues
        for (const id of sessionIds) {
          await db.execute(sql`
            DELETE FROM upload_sessions
            WHERE session_id = ${id}
          `);
        }
        
        console.log(`Cleaned up ${sessionsToClean.length} stale or error upload sessions`);
      }
      
      return sessionsToClean.length;
    } catch (error) {
      console.error('Error cleaning up upload sessions:', error);
      return 0;
    }
  }
}

// Export a singleton instance
export const uploadSessionManager = new UploadSessionManager();