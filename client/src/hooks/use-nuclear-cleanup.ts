/**
 * Nuclear Cleanup Utility for Upload Progress Modal
 * 
 * This is a comprehensive storage cleanup utility that will ensure no
 * remnant data remains in localStorage, sessionStorage or memory that
 * could cause ghost popups or analysis complete notifications.
 */

// Force a global window type for our custom field
declare global {
  interface Window {
    _activeEventSources?: Record<string, EventSource>;
    _uploadCancelled?: boolean;
    _forceCleanupCalled?: boolean;
    _lastCleanupTime?: number;
    _cleanupUploadState?: () => void;
    _broadcastChannels?: any[];
  }
}

// Add cleanup to the global window object for emergency access
const registerNuclearCleanupGlobally = () => {
  if (typeof window !== 'undefined') {
    // Save reference to cleanup function globally
    window._cleanupUploadState = nuclearCleanup;
    
    // Keep track of broadcast channels for cleanup
    if (!window._broadcastChannels) {
      window._broadcastChannels = [];
    }
  }
};

/**
 * Execute a nuclear reset of all storage state related to uploads
 */
export const nuclearCleanup = (): void => {
  try {
    if (typeof window === 'undefined') return;
    
    console.log('☢️ NUCLEAR CLEANUP INITIATED');
    
    // Set a timestamp to prevent duplicate cleanups
    const now = Date.now();
    if (window._lastCleanupTime && now - window._lastCleanupTime < 3000) {
      console.log('⏱️ Nuclear cleanup already performed recently, skipping');
      return;
    }
    
    // Mark cleanup timestamp
    window._lastCleanupTime = now;
    window._forceCleanupCalled = true;
    
    // 1. Close all EventSource connections
    if (window._activeEventSources) {
      Object.values(window._activeEventSources).forEach(source => {
        try {
          source.close();
        } catch (e) {
          // Ignore errors on close
        }
      });
      
      window._activeEventSources = {};
      console.log('🔌 Closed all EventSource connections');
    }
    
    // 2. Mark upload as cancelled in memory
    window._uploadCancelled = true;
    
    // 3. Clean up all localStorage keys
    // First get all keys
    const allLocalStorageKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allLocalStorageKeys.push(key);
    }
    
    // Clean up any localStorage items related to uploads
    let keysCleared = 0;
    for (const key of allLocalStorageKeys) {
      if (
        key.toLowerCase().includes('upload') || 
        key.toLowerCase().includes('session') ||
        key.toLowerCase().includes('progress') || 
        key.toLowerCase().includes('batch') ||
        key.toLowerCase().includes('analysis') ||
        key.toLowerCase().includes('leader') ||
        key.toLowerCase().includes('broadcast') ||
        key.toLowerCase().includes('heartbeat') ||
        key.toLowerCase().includes('timestamp') ||
        key.toLowerCase().includes('completion') ||
        key.toLowerCase().includes('completed') ||
        key.toLowerCase().includes('modal') ||
        key.toLowerCase().includes('database')
      ) {
        try {
          localStorage.removeItem(key);
          keysCleared++;
        } catch (e) {
          console.error(`Failed to clear localStorage key: ${key}`, e);
        }
      }
    }
    
    // Remove most common specific keys directly to ensure they're cleared
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
    localStorage.removeItem('upload_active');
    localStorage.removeItem('upload_session_id');
    localStorage.removeItem('upload_progress');
    localStorage.removeItem('upload_completed');
    localStorage.removeItem('upload_completed_timestamp');
    localStorage.removeItem('leader_id');
    localStorage.removeItem('leader_timestamp');
    localStorage.removeItem('heartbeat_timestamp');
    localStorage.removeItem('last_broadcast_time');
    localStorage.removeItem('last_poll_time');
    
    console.log(`🧹 Cleared ${keysCleared} localStorage items`);
    
    // 4. Clean up sessionStorage
    const allSessionStorageKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) allSessionStorageKeys.push(key);
    }
    
    // Clear anything related to upload in sessionStorage too
    let sessionKeysCleared = 0;
    for (const key of allSessionStorageKeys) {
      if (
        key.toLowerCase().includes('upload') || 
        key.toLowerCase().includes('session') ||
        key.toLowerCase().includes('progress') || 
        key.toLowerCase().includes('batch') ||
        key.toLowerCase().includes('analysis')
      ) {
        try {
          sessionStorage.removeItem(key);
          sessionKeysCleared++;
        } catch (e) {
          console.error(`Failed to clear sessionStorage key: ${key}`, e);
        }
      }
    }
    
    console.log(`🧹 Cleared ${sessionKeysCleared} sessionStorage items`);
    
    // 5. Clean up all broadcast channels
    if (window._broadcastChannels && window._broadcastChannels.length > 0) {
      window._broadcastChannels.forEach(channel => {
        try {
          if (channel && typeof channel.close === 'function') {
            channel.close();
          }
        } catch (e) {
          console.error('Error closing broadcast channel:', e);
        }
      });
      
      window._broadcastChannels = [];
      console.log('📡 Closed all broadcast channels');
    }
    
    // 6. Attempt to broadcast cleanup signal to other tabs
    try {
      // Use BroadcastChannel API if available
      const cleanupChannel = new BroadcastChannel('upload_cleanup_nuclear');
      window._broadcastChannels?.push(cleanupChannel);
      
      cleanupChannel.postMessage({
        type: 'nuclear_cleanup',
        timestamp: Date.now()
      });
      
      // Close after sending
      setTimeout(() => {
        try {
          cleanupChannel.close();
        } catch (e) {
          // Ignore
        }
      }, 1000);
      
      console.log('📣 Broadcast nuclear cleanup signal to other tabs');
    } catch (e) {
      console.error('Error broadcasting cleanup:', e);
    }
    
    // 7. Set a cleanup guard in sessionStorage to prevent immediate re-appearance
    sessionStorage.setItem('nuclear_cleanup_timestamp', Date.now().toString());
    
    console.log('☢️ NUCLEAR CLEANUP COMPLETED');
    
    // 8. Return success
    return;
  } catch (e) {
    console.error('Error during nuclear cleanup:', e);
    
    // Emergency default cleanup of common keys
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('isUploading');
        localStorage.removeItem('uploadProgress');
        localStorage.removeItem('uploadSessionId');
      } catch (e2) {
        // Last resort: just ignore
      }
    }
  }
};

/**
 * Listen for nuclear cleanup broadcasts from other tabs
 */
export const listenForNuclearCleanup = (): () => void => {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  try {
    const cleanupChannel = new BroadcastChannel('upload_cleanup_nuclear');
    if (window._broadcastChannels) {
      window._broadcastChannels.push(cleanupChannel);
    }
    
    const handleCleanupMessage = (event: MessageEvent) => {
      if (event.data?.type === 'nuclear_cleanup') {
        console.log('☢️ Received nuclear cleanup signal from another tab');
        nuclearCleanup();
      }
    };
    
    cleanupChannel.addEventListener('message', handleCleanupMessage);
    
    return () => {
      cleanupChannel.removeEventListener('message', handleCleanupMessage);
      cleanupChannel.close();
    };
  } catch (e) {
    console.error('Error setting up nuclear cleanup listener:', e);
    return () => {};
  }
};

/**
 * This function runs automatic deep cleaning when needed
 * It monitors for abnormal upload states and automatically fixes them
 */
export const runAutoCleanupWhenNeeded = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('🔄 Running automatic deep stability check');
    
    // Check if we have any lingering upload state that should be cleaned up
    const hasInconsistentState = () => {
      // Case 1: Upload marked as completed but still showing as active
      const uploadCompleted = localStorage.getItem('uploadCompleted') === 'true';
      const isUploading = localStorage.getItem('isUploading') === 'true';
      
      if (uploadCompleted && isUploading) {
        console.log('🚨 Inconsistent state: Upload marked as both completed and active');
        return true;
      }
      
      // Case 2: Analysis complete state but still showing
      const progressData = localStorage.getItem('uploadProgress');
      if (progressData && isUploading) {
        try {
          const progress = JSON.parse(progressData);
          
          // MUCH STRICTER terminal state detection - ONLY consider "Analysis complete" as terminal
          // NOT "Completed record X/Y" which is a common source of false positives
          const isStrictlyAnalysisComplete = progress.stage && 
            progress.stage.toLowerCase() === 'analysis complete';
            
          const isError = progress.stage && 
            progress.stage.toLowerCase().includes('error');
            
          // If in terminal state for over 10 seconds, this is a stuck UI
          if (
            (isStrictlyAnalysisComplete || isError) && 
            progress.savedAt && 
            Date.now() - progress.savedAt > 10000
          ) {
            console.log('🚨 Terminal state detected but still showing after 10 seconds');
            console.log('🚨 Stage was:', progress.stage);
            return true;
          }
        } catch (e) {
          // Parse error - could be corrupt state
          return true;
        }
      }
      
      // Case 3: No session ID but uploading state is true
      const sessionId = localStorage.getItem('uploadSessionId');
      if (isUploading && !sessionId) {
        console.log('🚨 Inconsistent state: Uploading is true but no session ID');
        return true;
      }
      
      // Case 4: Very old upload progress (over 30 minutes)
      if (progressData && isUploading) {
        try {
          const progress = JSON.parse(progressData);
          const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
          if (progress.savedAt && progress.savedAt < thirtyMinutesAgo) {
            console.log('🚨 Upload data is over 30 minutes old, likely stale');
            return true;
          }
        } catch (e) {
          // Parse error - could be corrupt state
          return true;
        }
      }
      
      return false;
    };
    
    // If inconsistent state detected, run nuclear cleanup
    if (hasInconsistentState()) {
      console.log('☢️ Auto-triggering nuclear cleanup due to inconsistent state');
      nuclearCleanup();
      
      // Also clean server state
      fetch('/api/cleanup-error-sessions', {
        method: 'POST'
      }).catch(e => {
        console.error('Error cleaning up server state:', e);
      });
    }
  } catch (e) {
    console.error('Error in automatic cleaning:', e);
  }
};

// Setup global reference
registerNuclearCleanupGlobally();

// Export a hook version for component use
export const useNuclearCleanup = () => {
  return {
    nuclearCleanup,
    listenForNuclearCleanup,
    runAutoCleanupWhenNeeded
  };
};

export default useNuclearCleanup;