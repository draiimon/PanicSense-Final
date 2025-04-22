/**
 * Cross-Tab Synchronization Manager
 * 
 * This module provides robust coordination between browser tabs for events like upload status updates
 * and completion notifications, preventing race conditions and flickering UIs.
 */

// Track current instance ID to prevent echoing our own messages
const INSTANCE_ID = Math.random().toString(36).substring(2, 15);

// Storage/message keys
const KEYS = {
  // Active instance tracking
  LEADER_ID: 'sync_leader_id',
  LEADER_TIMESTAMP: 'sync_leader_timestamp',
  HEARTBEAT_TIMESTAMP: 'sync_leader_heartbeat',
  
  // Upload status coordination
  UPLOAD_ACTIVE: 'upload_active',
  UPLOAD_SESSION_ID: 'upload_session_id',
  UPLOAD_PROGRESS: 'upload_progress',
  UPLOAD_COMPLETED: 'upload_completed',
  UPLOAD_COMPLETED_TIMESTAMP: 'upload_completed_timestamp',
  UPLOAD_FORCE_CLOSED: 'upload_force_closed',
  
  // Throttling and debounce controls
  LAST_BROADCAST_TIME: 'last_upload_broadcast_time',
  LAST_POLL_TIME: 'last_completion_poll_time',
};

// Timeouts and debounce periods
const TIMEOUTS = {
  LEADER_STALE_MS: 10000, // 10 seconds without heartbeat = leader is stale
  BROADCAST_THROTTLE_MS: 1000, // Minimum time between broadcasts
  POLL_THROTTLE_MS: 5000, // Minimum time between API polls
  COMPLETION_DEBOUNCE_MS: 5000, // Minimum time between completion broadcasts
};

// Channels for cross-tab coordination
let uploadBroadcastChannel: BroadcastChannel | null = null;
let completionChannel: BroadcastChannel | null = null;

// Try to initialize channels safely
try {
  if (typeof window !== 'undefined') {
    uploadBroadcastChannel = new BroadcastChannel('upload_status');
    completionChannel = new BroadcastChannel('upload_completion');
  }
} catch (e) {
  console.error('Failed to initialize broadcast channels:', e);
}

/**
 * Determine if this tab instance is the designated "leader"
 * The leader handles coordination across tabs
 */
function amILeader(): boolean {
  const leaderId = localStorage.getItem(KEYS.LEADER_ID);
  const leaderTimestamp = parseInt(localStorage.getItem(KEYS.LEADER_TIMESTAMP) || '0');
  const now = Date.now();
  
  // No leader or stale leader
  if (!leaderId || (now - leaderTimestamp > TIMEOUTS.LEADER_STALE_MS)) {
    // Claim leadership
    localStorage.setItem(KEYS.LEADER_ID, INSTANCE_ID);
    localStorage.setItem(KEYS.LEADER_TIMESTAMP, now.toString());
    localStorage.setItem(KEYS.HEARTBEAT_TIMESTAMP, now.toString());
    return true;
  }
  
  // I'm already the leader
  return leaderId === INSTANCE_ID;
}

/**
 * Update the leader heartbeat to maintain leadership
 */
function updateLeaderHeartbeat(): void {
  if (amILeader()) {
    localStorage.setItem(KEYS.HEARTBEAT_TIMESTAMP, Date.now().toString());
  }
}

/**
 * Send a message to other tabs with enhanced reliability
 */
export function broadcastMessage(type: string, payload?: any): void {
  try {
    const now = Date.now();
    const lastBroadcastTime = parseInt(localStorage.getItem(KEYS.LAST_BROADCAST_TIME) || '0');
    
    // Throttle broadcasts to prevent flooding
    if (now - lastBroadcastTime < TIMEOUTS.BROADCAST_THROTTLE_MS) {
      console.log(`🛑 Throttling broadcast: ${type} (too soon after last broadcast)`);
      return;
    }
    
    // Update broadcast timestamp
    localStorage.setItem(KEYS.LAST_BROADCAST_TIME, now.toString());
    
    const message = {
      type,
      payload,
      timestamp: now,
      instanceId: INSTANCE_ID
    };
    
    // Send on main channel
    if (uploadBroadcastChannel) {
      try {
        uploadBroadcastChannel.postMessage(message);
      } catch (channelError) {
        console.error(`Error sending message on main channel:`, channelError);
        
        // Attempt to recreate the channel and retry once
        try {
          uploadBroadcastChannel = new BroadcastChannel('upload_status');
          uploadBroadcastChannel.postMessage(message);
          console.log('🔄 Successfully recreated and sent on main channel after error');
        } catch (retryError) {
          console.error('Failed to recreate main channel:', retryError);
        }
      }
    } else if (typeof window !== 'undefined') {
      // If no channel exists, try to create one
      try {
        uploadBroadcastChannel = new BroadcastChannel('upload_status');
        uploadBroadcastChannel.postMessage(message);
        console.log('🔄 Created missing main channel and sent message');
      } catch (createError) {
        console.error('Failed to create missing main channel:', createError);
      }
    }
    
    // Special handling for completion messages with triple redundancy 
    // BUT ONLY FOR GENUINE COMPLETIONS
    if (type === 'upload_complete') {
      // Completeness validation - only broadcast if we have genuine data
      // This helps prevent false positives and ghost "Analysis complete" messages
      const isGenuineCompletion = payload && 
                                 payload.progress && 
                                 payload.progress.total > 0 &&
                                 payload.progress.processed >= payload.progress.total * 0.95;
      
      if (!isGenuineCompletion) {
        console.log('⛔ BLOCKING COMPLETION BROADCAST: Not enough data or processed count too low');
        return; // Don't broadcast incomplete data
      }
      
      // Additional check: needs to come from a session with a sessionId
      const sessionId = localStorage.getItem('uploadSessionId');
      if (!sessionId) {
        console.log('⛔ BLOCKING COMPLETION BROADCAST: No active sessionId in localStorage');
        return; // Don't broadcast without a sessionId
      }
      
      // 1. Try the dedicated completion channel
      if (completionChannel) {
        try {
          // Include much more validation data in the message
          completionChannel.postMessage({
            type: 'analysis_complete',
            timestamp: now,
            instanceId: INSTANCE_ID,
            sessionId: sessionId,
            progress: payload.progress,
            validation: {
              processed: payload.progress.processed,
              total: payload.progress.total,
              stage: payload.progress.stage
            }
          });
        } catch (completionError) {
          console.error('Error sending on completion channel:', completionError);
          
          // Try to recreate the channel
          try {
            completionChannel = new BroadcastChannel('upload_completion');
            completionChannel.postMessage({
              type: 'analysis_complete',
              timestamp: now,
              instanceId: INSTANCE_ID,
              sessionId: sessionId,
              progress: payload.progress
            });
            console.log('🔄 Successfully recreated completion channel after error');
          } catch (retryError) {
            console.error('Failed to recreate completion channel:', retryError);
          }
        }
      } else if (typeof window !== 'undefined') {
        // Try to create the channel if missing
        try {
          completionChannel = new BroadcastChannel('upload_completion');
          completionChannel.postMessage({
            type: 'analysis_complete',
            timestamp: now,
            instanceId: INSTANCE_ID,
            sessionId: sessionId,
            progress: payload.progress
          });
          console.log('🔄 Created missing completion channel and sent message');
        } catch (createError) {
          console.error('Failed to create missing completion channel:', createError);
        }
      }
      
      // 2. Create independent temporary channels for critical messages
      try {
        const tempChannel = new BroadcastChannel('upload_status_backup');
        tempChannel.postMessage({
          type: 'upload_complete',
          payload,
          timestamp: now,
          instanceId: INSTANCE_ID,
          isBackupChannel: true
        });
        
        // Close after short delay to prevent resource leaks
        setTimeout(() => {
          try { tempChannel.close(); } catch (e) { /* ignore */ }
        }, 1000);
      } catch (tempError) {
        console.error('Failed to create temporary backup channel:', tempError);
      }
      
      // 3. Set explicit localStorage flags as final fallback
      try {
        localStorage.setItem(KEYS.UPLOAD_COMPLETED, 'true');
        localStorage.setItem(KEYS.UPLOAD_COMPLETED_TIMESTAMP, now.toString());
        if (payload && payload.progress) {
          localStorage.setItem(KEYS.UPLOAD_PROGRESS, JSON.stringify(payload.progress));
        }
      } catch (storageError) {
        console.error('Failed to set localStorage completion flags:', storageError);
      }
    }
    
    console.log(`📣 Broadcasting: ${type}`);
  } catch (e) {
    console.error(`Error broadcasting message ${type}:`, e);
  }
}

/**
 * Mark upload as completed in a coordinated way
 */
export function markUploadCompleted(progress: any): void {
  try {
    const now = Date.now();
    
    // Check if completion was already processed recently
    const completedTimestamp = parseInt(localStorage.getItem(KEYS.UPLOAD_COMPLETED_TIMESTAMP) || '0');
    if (now - completedTimestamp < TIMEOUTS.COMPLETION_DEBOUNCE_MS) {
      console.log('🔄 Upload completion recently processed, skipping duplicate');
      return;
    }
    
    // Update localStorage with completion status
    localStorage.setItem(KEYS.UPLOAD_COMPLETED, 'true');
    localStorage.setItem(KEYS.UPLOAD_COMPLETED_TIMESTAMP, now.toString());
    
    // Store final progress state
    const finalProgress = {
      ...progress,
      stage: 'Analysis complete',
      processed: progress.total || 100,
      total: progress.total || 100,
      currentSpeed: 0,
      timeRemaining: 0
    };
    
    localStorage.setItem(KEYS.UPLOAD_PROGRESS, JSON.stringify(finalProgress));
    
    // Broadcast to other tabs
    broadcastMessage('upload_complete', { progress: finalProgress });
    
    console.log('🏁 Upload marked as completed and broadcast to all tabs');
  } catch (e) {
    console.error('Error marking upload as completed:', e);
  }
}

/**
 * Check if upload completion state is present
 */
export function isUploadCompleted(): boolean {
  return localStorage.getItem(KEYS.UPLOAD_COMPLETED) === 'true';
}

/**
 * Clean up all upload-related state
 */
export function cleanupUploadState(): void {
  try {
    // First get a full list of all localStorage keys
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allKeys.push(key);
    }
    
    // Clean up all upload-related localStorage items
    localStorage.removeItem(KEYS.UPLOAD_ACTIVE);
    localStorage.removeItem(KEYS.UPLOAD_SESSION_ID);
    localStorage.removeItem(KEYS.UPLOAD_PROGRESS);
    localStorage.removeItem(KEYS.UPLOAD_COMPLETED);
    localStorage.removeItem(KEYS.UPLOAD_COMPLETED_TIMESTAMP);
    localStorage.removeItem(KEYS.UPLOAD_FORCE_CLOSED);
    localStorage.removeItem(KEYS.LEADER_ID);
    localStorage.removeItem(KEYS.LEADER_TIMESTAMP);
    localStorage.removeItem(KEYS.HEARTBEAT_TIMESTAMP);
    localStorage.removeItem(KEYS.LAST_BROADCAST_TIME);
    localStorage.removeItem(KEYS.LAST_POLL_TIME);
    
    // Clean up older keys for backward compatibility
    localStorage.removeItem('isUploading');
    localStorage.removeItem('uploadProgress');
    localStorage.removeItem('uploadSessionId');
    localStorage.removeItem('lastProgressTimestamp');
    localStorage.removeItem('lastDatabaseCheck');
    localStorage.removeItem('serverRestartProtection');
    localStorage.removeItem('serverRestartTimestamp');
    localStorage.removeItem('uploadCompleteBroadcasted');
    localStorage.removeItem('lastUIUpdateTimestamp');
    localStorage.removeItem('uploadStartTime');
    localStorage.removeItem('batchStats');
    localStorage.removeItem('uploadCompleted');
    localStorage.removeItem('uploadCompletedTimestamp');
    localStorage.removeItem('lastCompletionBroadcast');
    
    // Clean up any other keys that might be related to uploads
    for (const key of allKeys) {
      if (key.toLowerCase().includes('upload') || 
          key.toLowerCase().includes('progress') ||
          key.toLowerCase().includes('session') ||
          key.toLowerCase().includes('batch') ||
          key.toLowerCase().includes('analysis')) {
        localStorage.removeItem(key);
      }
    }
    
    // Use sessionStorage as a guard to prevent false triggers
    sessionStorage.setItem('lastCleanupTime', Date.now().toString());
    
    // Broadcast cleanup to other tabs
    broadcastMessage('upload_cleanup');
    
    console.log('🧹 All upload state cleaned up');
  } catch (e) {
    console.error('Error cleaning up upload state:', e);
  }
}

/**
 * Handler for broadcast messages
 */
export function createBroadcastListener(handlers: {
  onUploadProgress?: (progress: any) => void;
  onUploadComplete?: (progress: any) => void;
  onUploadCleanup?: () => void;
  onUploadCancelled?: () => void;
}): () => void {
  
  // Skip if no channels available
  if (!uploadBroadcastChannel && !completionChannel) {
    return () => {};
  }
  
  const handleMessage = (event: MessageEvent) => {
    const { type, payload, instanceId } = event.data;
    
    // Ignore our own messages
    if (instanceId === INSTANCE_ID) {
      return;
    }
    
    console.log(`📡 Received broadcast: ${type}`);
    
    switch (type) {
      case 'upload_progress':
        if (handlers.onUploadProgress && payload.progress) {
          handlers.onUploadProgress(payload.progress);
        }
        break;
        
      case 'upload_complete':
        if (handlers.onUploadComplete && payload && payload.progress) {
          // Update local storage with completion state
          localStorage.setItem(KEYS.UPLOAD_COMPLETED, 'true');
          localStorage.setItem(KEYS.UPLOAD_COMPLETED_TIMESTAMP, Date.now().toString());
          
          handlers.onUploadComplete(payload.progress);
        }
        break;
        
      case 'upload_cleanup':
        if (handlers.onUploadCleanup) {
          handlers.onUploadCleanup();
        }
        break;
        
      case 'upload_cancelled':
        if (handlers.onUploadCancelled) {
          handlers.onUploadCancelled();
        }
        break;
    }
  };
  
  const handleCompletionMessage = (event: MessageEvent) => {
    const { type, instanceId, sessionId, progress, validation } = event.data;
    
    // Ignore our own messages
    if (instanceId === INSTANCE_ID) {
      return;
    }
    
    if (type === 'analysis_complete' && handlers.onUploadComplete) {
      console.log('🏁 Received dedicated completion message');
      
      // ⚠️ CRITICAL VALIDATION FOR COMPLETION MESSAGES
      
      // Verify we only accept completion for tabs with active uploads
      const ourSessionId = localStorage.getItem('uploadSessionId');
      const isUploading = localStorage.getItem('isUploading') === 'true';
      
      if (!isUploading || !ourSessionId) {
        console.log('⛔ REJECTING completion message - no active upload in this tab');
        return;
      }
      
      // Validate the sessionId if present in the message
      if (sessionId && ourSessionId !== sessionId) {
        console.log(`⛔ REJECTING completion message - sessionId mismatch (ours: ${ourSessionId}, message: ${sessionId})`);
        return;
      }
      
      // Use the provided progress data if available, or fallback to standard
      const completionProgress = progress ? {
        ...progress,
        stage: 'Analysis complete',
        processed: progress.total || 100,
        total: progress.total || 100,
        currentSpeed: 0,
        timeRemaining: 0
      } : {
        stage: 'Analysis complete',
        processed: 100,
        total: 100,
        currentSpeed: 0,
        timeRemaining: 0
      };
      
      // Validate based on count if available 
      if (validation && validation.processed && validation.total) {
        const processedThreshold = Math.floor(validation.total * 0.95);
        if (validation.processed < processedThreshold) {
          console.log(`⛔ REJECTING completion message - processed count too low (${validation.processed}/${validation.total})`);
          return;
        }
      }
      
      // Mark as complete in localStorage
      localStorage.setItem(KEYS.UPLOAD_COMPLETED, 'true');
      localStorage.setItem(KEYS.UPLOAD_COMPLETED_TIMESTAMP, Date.now().toString());
      
      console.log('✅✅✅ VALIDATED COMPLETION MESSAGE - Showing Analysis complete');
      handlers.onUploadComplete(completionProgress);
    }
  };
  
  // Add listeners
  if (uploadBroadcastChannel) {
    uploadBroadcastChannel.addEventListener('message', handleMessage);
  }
  
  if (completionChannel) {
    completionChannel.addEventListener('message', handleCompletionMessage);
  }
  
  // Return cleanup function
  return () => {
    if (uploadBroadcastChannel) {
      uploadBroadcastChannel.removeEventListener('message', handleMessage);
    }
    
    if (completionChannel) {
      completionChannel.removeEventListener('message', handleCompletionMessage);
    }
  };
}

// Set up regular heartbeat for leader
if (typeof window !== 'undefined') {
  setInterval(updateLeaderHeartbeat, 2000);
  
  // Initialize leadership on load
  amILeader();
}

// Default export
export default {
  broadcastMessage,
  markUploadCompleted,
  isUploadCompleted,
  cleanupUploadState,
  createBroadcastListener,
  amILeader
};