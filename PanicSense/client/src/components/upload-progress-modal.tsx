import { motion } from "framer-motion";
import { 
  CheckCircle, 
  Clock, 
  Database, 
  FileText, 
  Loader2, 
  XCircle,
  AlertCircle,
  BarChart3,
  Server,
  Terminal,
  Trash2
} from "lucide-react";
import { useDisasterContext } from "@/context/disaster-context";
import { createPortal } from "react-dom";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { 
  createBroadcastListener, 
  cleanupUploadState, 
  markUploadCompleted, 
  isUploadCompleted,
  broadcastMessage
} from "@/lib/synchronization-manager";
import { cancelUpload, getCurrentUploadSessionId } from "@/lib/api";
import { nuclearCleanup, listenForNuclearCleanup, runAutoCleanupWhenNeeded } from "@/hooks/use-nuclear-cleanup";

// Add a global TypeScript interface for window
declare global {
  interface Window {
    _activeEventSources?: Record<string, EventSource>;
    _autoCloseTimer?: ReturnType<typeof setTimeout>;  // Add timer reference
  }
}

export function UploadProgressModal() {
  const { isUploading, uploadProgress, setIsUploading, setUploadProgress } = useDisasterContext();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast(); // Initialize toast hook
  
  // Extract values from uploadProgress at the top level
  const { 
    stage = 'Processing...', 
    processed: rawProcessed = 0, 
    total = 100,
    processingStats = {
      successCount: 0,
      errorCount: 0,
      averageSpeed: 0
    },
    batchNumber = 0,
    totalBatches = 0,
    batchProgress = 0,
    currentSpeed = 0,
    timeRemaining = 0,
    error = '',
    autoCloseDelay = 3000 // Default to 3 seconds for auto-close
  } = uploadProgress || {};
  
  // Define processedCount variable using rawProcessed value
  const processedCount = rawProcessed;
  
  // Set up listener for nuclear cleanup broadcasts from other tabs
  // and automatic stability check
  useEffect(() => {
    // Set up cleanup listener
    const removeNuclearListener = listenForNuclearCleanup();
    
    // Run auto cleanup on mount and every 15 seconds
    runAutoCleanupWhenNeeded();
    const autoCleanupInterval = setInterval(() => {
      runAutoCleanupWhenNeeded();
    }, 15000); // Every 15 seconds check for inconsistencies
    
    return () => {
      removeNuclearListener();
      clearInterval(autoCleanupInterval);
    };
  }, []);
  
  // Define a clean-up function that will be used for both direct modal closing and broadcast handling
  const cleanupAndClose = React.useCallback(() => {
    console.log('🧹 Cleanup and close function triggered');
    
    // Try the nuclear cleanup option first to ensure complete cleanup
    nuclearCleanup();
    
    // Fallback to regular cleanup if nuclear fails for any reason
    cleanupUploadState();
    
    // Clean up any existing EventSource connections
    if (window._activeEventSources) {
      Object.values(window._activeEventSources).forEach(source => {
        try {
          source.close();
        } catch (e) {
          // Ignore errors on close
        }
      });
      // Reset the collection
      window._activeEventSources = {};
    }
    
    // Update context state
    setIsUploading(false);
    setIsCancelling(false);
    
    console.log('🧹 MODAL CLOSED - ALL STATE CLEARED');
  }, [setIsUploading, setIsCancelling]);
  
  // Set up broadcast listener using the new synchronization manager
  useEffect(() => {
    // Disable auto-detection of terminal states in progress messages
    const isCompletedState = (status: string) => {
      if (!status) return false;
      // Only consider Analysis complete as a terminal state
      // Don't consider "Completed record X/Y" as terminal
      return status.toLowerCase() === 'analysis complete';
    };
    
    // Create a listener for broadcast messages using our synchronization manager
    const removeListener = createBroadcastListener({
      onUploadProgress: (progress) => {
        console.log('📊 Received progress update from another tab');
        setUploadProgress(progress);
      },
      
      onUploadComplete: (progress) => {
        console.log('🏁 Received completion notification from another tab');
        
        // ⚠️⚠️⚠️ CRITICAL VALIDATION: ABSOLUTELY ONLY PROCESS COMPLETION IF:
        // 1. Tab MUST already be showing an upload modal
        // 2. Tab MUST have a real active sessionId
        // 3. Tab MUST have processed almost all records
        // ⚠️⚠️⚠️ This prevents the "Analysis complete" message showing up on page load
        
        // Check 1: Must be actively uploading with modal already open
        if (!isUploading) {
          console.log('⛔ VALIDATION FAILURE: Ignoring completion - No active upload modal');
          return;
        }
        
        // Check 2: Must have valid sessionId in localStorage
        const sessionId = localStorage.getItem('uploadSessionId');
        if (!sessionId) {
          console.log('⛔ VALIDATION FAILURE: Ignoring completion - No sessionId in localStorage');
          return;
        }
        
        // Check 3: Stage must NOT already be showing 'Analysis complete'
        if (stage && stage.toLowerCase() === 'analysis complete') {
          console.log('⛔ VALIDATION FAILURE: Already showing completion stage, preventing duplicate');
          return;
        }
        
        // Check 4: Stage must contain a processing or loading indicator
        // Only accept completion notices during active processing
        const hasValidPreviousStage = 
          stage && (
            stage.toLowerCase().includes('processing') ||
            stage.toLowerCase().includes('record') ||
            stage.toLowerCase().includes('loading') ||
            stage.toLowerCase().includes('batch')
          );
        
        if (!hasValidPreviousStage) {
          console.log('⛔ VALIDATION FAILURE: No valid processing stage detected:', stage);
          return;
        }
        
        // Check 5: Processing count validation - must have processed almost all records
        const total = uploadProgress?.total || progress.total || 100; 
        const processed = uploadProgress?.processed || progress.processed || 0;
        const processedThreshold = Math.floor(total * 0.95);
        
        // Strict validation to prevent premature notifications
        if (processed < processedThreshold) {
          console.log(`⛔ VALIDATION FAILURE: Premature completion - only processed ${processed}/${total} records`);
          return;
        }
        
        // Check 6: Must not have handled completion recently (debouncing)
        const completionTimestamp = parseInt(localStorage.getItem('uploadCompletedTimestamp') || '0');
        const now = Date.now();
        const completionDebounce = 5000; // 5 seconds
        
        if (now - completionTimestamp < completionDebounce) {
          console.log('⛔ VALIDATION FAILURE: Already handled completion recently');
          return;
        }
        
        // Additional check: Verify with server (if time permits)
        try {
          fetch('/api/upload-complete-check')
            .then(response => response.json())
            .then(data => {
              if (!data.uploadComplete) {
                console.log('⚠️ Server does not confirm completion, but continuing anyway');
              }
            })
            .catch(() => {});
        } catch (e) {
          // Ignore check errors
        }
        
        // 🎯🎯🎯 ALL VALIDATIONS PASSED! This is a genuine completion notification
        console.log('✅✅✅ ALL VALIDATIONS PASSED: Showing Analysis complete');
        
        // Update progress state to show completion
        setUploadProgress({
          ...uploadProgress, // Keep existing settings, just change crucial ones
          stage: 'Analysis complete',
          processed: total,
          total: total,
          currentSpeed: 0,
          timeRemaining: 0
        });
        
        // Store completion timestamp in localStorage to prevent duplicate handling
        localStorage.setItem('uploadCompletedTimestamp', now.toString());
        
        // Set a timer to auto-close EXACTLY 3 seconds from now
        const completionDelay = 3000; // 3 seconds
        console.log(`📊 Will auto-close after EXACTLY ${completionDelay}ms due to completion message`);
        
        // Clear any existing auto-close timers to prevent race conditions
        if (typeof window !== 'undefined' && window._autoCloseTimer) {
          clearTimeout(window._autoCloseTimer);
          window._autoCloseTimer = undefined;
        }
        
        // Set strict auto-close timer at exactly 3 seconds
        const timerRef = setTimeout(() => {
          console.log('⏰ AUTO-CLOSE TRIGGERED BY COMPLETION MESSAGE - EXACTLY 3 SECONDS');
          cleanupAndClose();
        }, completionDelay);
        
        // Store reference to the timer
        if (typeof window !== 'undefined') {
          window._autoCloseTimer = timerRef;
        }
      },
      
      onUploadCleanup: () => {
        console.log('🧹 Received cleanup message from another tab');
        if (isUploading) {
          console.log('Closing this modal due to cleanup message from another tab');
          cleanupAndClose();
        }
      },
      
      onUploadCancelled: () => {
        console.log('🔥 Received cancellation message from another tab');
        cleanupAndClose();
      }
    });
    
    // Return cleanup function
    return removeListener;
  }, [setUploadProgress, cleanupAndClose, isUploading, setIsUploading, uploadProgress]);
  
  // Check for server restart protection flag
  // Only consider server restart protection if explicitly set
  // Check for both server restart AND completion status - never show server restart mode for completed uploads
  const serverRestartDetected = localStorage.getItem('serverRestartProtection') === 'true';
  const serverRestartTime = localStorage.getItem('serverRestartTimestamp');
  const uploadCompleted = isUploadCompleted();
  
  // If upload is completed, ignore server restart protection completely
  if (uploadCompleted && serverRestartDetected) {
    console.log('🏁 Upload completed flag detected - ignoring server restart protection');
    localStorage.removeItem('serverRestartProtection');
    localStorage.removeItem('serverRestartTimestamp');
  }
  
  // We'll determine if we should show server restart mode after we know what stage we're in
  // This will be set after we have the stage value
  
  // Regular check with database boss - if boss says no active sessions but we're showing
  // a modal, boss is right and we should close the modal
  // BUT THIS HAS A SPECIAL EXCEPTION FOR SERVER RESTARTS
  // We need to place this functionality AFTER all variable declarations
  
  useEffect(() => {
    if (!isUploading) return; // No need to check if we're not showing a modal
    
    // Function to verify with database - BUT LOCAL STORAGE IS THE TRUE BOSS NOW!
    const checkWithDatabaseBoss = async () => {
      try {
        // PRIORITY FOR VISIBILITY: LOCAL STORAGE > DATABASE
        // ULTRA-RESILIENT REFRESH PERSISTENCE: First check localStorage with extended expiration
        const storageExpirationMinutes = 45; // EXTENDED from 30 to 45 minutes for better persistence!
        const storedUploadProgress = localStorage.getItem('uploadProgress');
        const storedSessionId = localStorage.getItem('uploadSessionId');
        const storedIsUploading = localStorage.getItem('isUploading');
        
        // RESILIENT UPLOAD PERSISTENCE: If we have ANY active state in localStorage, always show modal first
        if (storedIsUploading === 'true' || storedSessionId) {
          console.log('🔒 LOCAL STORAGE HAS UPLOAD STATE - KEEPING MODAL VISIBLE', storedSessionId);
          
          // Force UI to match localStorage state - this ensures persistence after page refresh
          if (!isUploading) {
            setIsUploading(true);
            
            // Also update progress from localStorage if available
            if (storedUploadProgress) {
              try {
                const progress = JSON.parse(storedUploadProgress);
                setUploadProgress(progress);
              } catch (e) {
                console.error('Failed to parse stored progress', e);
              }
            }
          }
          
          // Now check with database - but ONLY for data updates, not for visibility control
          // This keeps the modal visible while we wait for database confirmation
          console.log('📊 Checking database for progress updates only (not for visibility control)');
          const response = await fetch('/api/active-upload-session');
        
          if (response.ok) {
            const data = await response.json();
            
            if (data.sessionId) {
              console.log('✅ DATABASE CONFIRMS ACTIVE SESSION', data.sessionId);
              // If we already have sessionId in localStorage, update it if different
              if (storedSessionId !== data.sessionId) {
                localStorage.setItem('uploadSessionId', data.sessionId);
              }
              
              // If server has progress data, update UI but keep modal visible
              if (data.progress) {
                try {
                  const newProgress = typeof data.progress === 'string' 
                    ? JSON.parse(data.progress) 
                    : data.progress;
                  setUploadProgress(newProgress);
                } catch (e) {
                  console.error('Failed to parse server progress', e);
                }
              }
            }
          }
        } else {
          // No upload state in localStorage, ask database
          console.log('📊 Upload modal checking with database');
          const response = await fetch('/api/active-upload-session');
          
          if (response.ok) {
            const data = await response.json();
            
            // If database has active session but we don't know about it yet
            if (data.sessionId) {
              console.log('👑 DATABASE HAS ACTIVE SESSION WE DIDNT KNOW ABOUT', data.sessionId);
              
              // Update localStorage with the session ID
              localStorage.setItem('uploadSessionId', data.sessionId);
              localStorage.setItem('isUploading', 'true');
              
              // Show the upload modal
              setIsUploading(true);
            }
            // Otherwise, both localStorage and database agree - no active uploads
          }
        }
      } catch (error) {
        // Silently handle errors to avoid disrupting the UI
        console.error('Error checking database:', error);
      }
    };
    
    // Check with database boss immediately
    checkWithDatabaseBoss();
    
    // Then set up regular checks with the boss
    const intervalId = setInterval(checkWithDatabaseBoss, 5000);
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [isUploading, setIsUploading]);
  
  // Poll the specialized API endpoint for completion status
  useEffect(() => {
    if (!isUploading) return; // No need to check if not uploading
    
    // Anti-flicker prevention: if we already know it's completed, don't check again
    if (isUploadCompleted()) {
      console.log('🏁 Upload already marked as completed, skipping API check');
      return;
    }
    
    // Using stateful vars for debounce without requiring state updates
    const state = {
      lastCheckTime: 0,
      completionVerified: false
    };
    
    // Much more robust completion check with debounce
    const checkCompletionStatus = async () => {
      const now = Date.now();
      const POLL_THROTTLE = 3000; // 3 seconds between polls
      
      // Don't check too frequently to avoid overwhelming the server
      if (now - state.lastCheckTime < POLL_THROTTLE) {
        return;
      }
      
      // Also don't check if we've already verified completion
      if (state.completionVerified || isUploadCompleted()) {
        return;
      }
      
      // Update our check timestamp
      state.lastCheckTime = now;
      
      try {
        const response = await fetch('/api/upload-complete-check');
        if (!response.ok) return;
        
        const data = await response.json();
        
        // If the server says upload is complete, mark it completed
        if (data.uploadComplete && data.sessionId) {
          console.log('🌟 SERVER CONFIRMS UPLOAD IS COMPLETE!', data.sessionId);
          
          // Mark this instance as having verified completion
          state.completionVerified = true;
          
          // Update our local state first
          const finalProgress = {
            ...uploadProgress,
            stage: 'Analysis complete',
            processed: uploadProgress.total || 100,
            total: uploadProgress.total || 100,
            currentSpeed: 0,
            timeRemaining: 0
          };
          
          setUploadProgress(finalProgress);
          
          // Use the synchronization manager to mark it complete and notify other tabs
          markUploadCompleted(finalProgress);
          
          // ENHANCED VALIDATION CHECK: More rigorous validation to prevent premature completion
          // Validate that this is not a premature completion notification
          const hasValidPreviousStage = 
            stage && (
              stage.toLowerCase().includes('processing') ||
              stage.toLowerCase().includes('record') ||
              stage.toLowerCase().includes('loading') ||
              stage.toLowerCase().includes('batch') ||
              stage.toLowerCase().includes('analyzing')
            );
            
          if (!hasValidPreviousStage) {
            console.log('⛔ SERVER VALIDATION FAILURE: No valid processing stage detected:', stage);
            return;
          }
          
          // Check if upload is still in preliminary stages
          const isStillInitializing = 
            stage.toLowerCase().includes('initializing') ||
            stage.toLowerCase().includes('starting') ||
            stage.toLowerCase().includes('preparing') ||
            stage.toLowerCase().includes('loading csv') ||
            stage.toLowerCase().includes('identifying columns');
            
          if (isStillInitializing) {
            console.log('⛔ SERVER VALIDATION FAILURE: Upload still in initialization stage:', stage);
            return;
          }
          
          // Check if there's a Python process actively running this upload
          const sessionId = localStorage.getItem('uploadSessionId');
          if (sessionId) {
            try {
              const pythonResponse = await fetch(`/api/upload-progress/${sessionId}`);
              if (pythonResponse.ok) {
                const pythonStatus = await pythonResponse.json();
                if (pythonStatus && pythonStatus.active) {
                  console.log('⛔ SERVER VALIDATION FAILURE: Python process still active for this session');
                  return;
                }
              }
            } catch (e) {
              // If we can't check, err on the side of caution
              console.log('⛔ SERVER VALIDATION FAILURE: Could not verify Python process status');
              return;
            }
          }
          
          // Verify processed count (increased threshold to 98%)
          const processedThreshold = Math.floor(uploadProgress.total * 0.98);
          if (uploadProgress.processed < processedThreshold) {
            console.log(`⛔ SERVER VALIDATION FAILURE: Processed count too low (${uploadProgress.processed}/${uploadProgress.total})`);
            return;
          }
          
          // Auto-close after a strict 3 second delay
          // Clear any existing auto-close timers to prevent race conditions
          if (typeof window !== 'undefined' && window._autoCloseTimer) {
            clearTimeout(window._autoCloseTimer);
            window._autoCloseTimer = undefined;
          }
          
          // Set strict auto-close timer at exactly 3 seconds
          const timerRef = setTimeout(() => {
            console.log('⏰ SERVER VERIFICATION: AUTO-CLOSE TRIGGERED - EXACTLY 3 SECONDS');
            cleanupAndClose();
          }, 3000);
          
          // Store reference to the timer
          if (typeof window !== 'undefined') {
            window._autoCloseTimer = timerRef;
          }
          
          // Store completion timestamp in localStorage to prevent duplicate handling
          localStorage.setItem('uploadCompletedTimestamp', Date.now().toString());
        }
      } catch (error) {
        console.error('Error checking upload completion status:', error);
      }
    };
    
    // Initial delay before first check to let the UI stabilize
    const initialCheckTimeout = setTimeout(checkCompletionStatus, 1000);
    
    // Check periodically but not too frequently
    const intervalId = setInterval(checkCompletionStatus, 3000);
    
    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(intervalId);
    };
  }, [isUploading, uploadProgress, setUploadProgress, cleanupAndClose]);
  
  // Add auto-close timer for both "Analysis complete" and error states
  // Memoize forceCloseModal to prevent unnecessary re-renders
  const forceCloseModalMemo = React.useCallback(async () => {
    // Set local cancelling state immediately to prevent multiple calls
    setIsCancelling(true);
    
    try {
      // First try to cancel the upload through the API to ensure database cleanup
      // This ensures the server-side cleanup occurs, deleting the session from the database
      const sessionId = localStorage.getItem('uploadSessionId');
      
      // Use the synchronization manager to clean up all state
      cleanupUploadState();
      
      if (sessionId) {
        try {
          // Try to cancel through the API (which will delete the session from the database)
          await cancelUpload();
          console.log('Force close: Upload cancelled through API to ensure database cleanup');
          
          // Make a direct call to cleanup error sessions for immediate cleanup
          await fetch('/api/cleanup-error-sessions', {
            method: 'POST'
          });
          console.log('Force cleanup: Called error session cleanup API');
        } catch (e) {
          console.error('Error during API cleanup (continuing anyway):', e);
        }
      }
    } catch (error) {
      console.error('Error cancelling upload during force close:', error);
    } finally {
      // Clean up any existing EventSource connections
      if (window._activeEventSources) {
        Object.values(window._activeEventSources).forEach(source => {
          try {
            source.close();
          } catch (e) {
            // Ignore errors on close
          }
        });
        // Reset the collection
        window._activeEventSources = {};
      }
      
      // Finally update context state - do this AFTER cleanup is complete
      // to prevent race conditions with new session checks
      setIsUploading(false);
      setIsCancelling(false);
      
      // Also broadcast the cancellation to all tabs
      broadcastMessage('upload_force_cancelled');
      
      console.log('🧹 MODAL FORCED CLOSED - ALL STATE CLEARED');
    }
  }, [setIsUploading, setIsCancelling]);

  // Effect for handling "Analysis complete" and error states
  useEffect(() => {
    // INSTANT CLOSE FOR ERRORS, brief delay for completion
    if (isUploading) {
      // Debug logging for testing the stage
      if (stage?.toLowerCase().includes('complete')) {
        console.log('🔍 Terminal state check in effect:', stage);
      }
      
      if (stage === 'Upload Error') {
        // INSTANT CLEANUP FOR ERRORS - close immediately with tiny delay
        console.log(`🚨 ERROR DETECTED - CLOSING IMMEDIATELY`);
        
        // Use minimal delay (50ms) just to ensure state can be seen
        const closeTimerId = setTimeout(() => {
          console.log(`⏰ ERROR AUTO-CLOSE TRIGGERED IMMEDIATELY`);
          
          // Use synchronization manager for cleanup
          cleanupUploadState();
          
          forceCloseModalMemo(); // Close the modal automatically
        }, 50); // Super short delay
        
        return () => clearTimeout(closeTimerId);
      }
      // STRICT MATCH - only exact match with "Analysis complete"
      // NOT matching "Completed record X/Y" which causes false completion
      else if (stage === 'Analysis complete') {
        // Check if it's a genuine completion by verifying we've processed enough records
        // We use a threshold (95%) rather than exact match to account for any discrepancies
        const processedThreshold = Math.floor(total * 0.95);
        const isActuallyComplete = processedCount >= processedThreshold;
        
        if (!isActuallyComplete) {
          console.log('⚠️ False "Analysis complete" detected - processed count too low:', 
            processedCount, 'of', total, `(need at least ${processedThreshold})`);
          return; // Don't handle as completion if we haven't processed enough records
        }
        
        // Also check if we've already handled completion recently to avoid multiple handlers
        const completionTimestamp = parseInt(localStorage.getItem('uploadCompletedTimestamp') || '0');
        const now = Date.now();
        const completionDebounce = 5000; // 5 seconds
        
        if (now - completionTimestamp < completionDebounce) {
          console.log('⚠️ Ignoring duplicate completion event - already handled recently');
          return;
        }
        
        // For genuine completion, show success briefly (3 seconds)
        const completionDelay = autoCloseDelay || 3000; // Default to 3 seconds
        console.log(`🎯 Analysis complete - will auto-close after ${completionDelay}ms`);
        
        // Create final progress object
        const finalProgress = {
          ...uploadProgress,
          stage: 'Analysis complete',
          processed: total,
          total: total,
          currentSpeed: 0,
          timeRemaining: 0
        };
        
        // Add a message to the console
        console.log('Upload operation completed, the modal will auto-close based on server instructions');
        
        // Use the synchronization manager to mark as complete and broadcast to other tabs
        markUploadCompleted(finalProgress);
        
        // Set a timer to auto-close this tab
        const closeTimerId = setTimeout(() => {
          console.log(`⏰ COMPLETION AUTO-CLOSE TRIGGERED AT ${completionDelay}ms`);
          cleanupAndClose(); // Use the standard cleanup method
        }, completionDelay);
        
        return () => clearTimeout(closeTimerId);
      } 
      // Explicitly detect in-progress "Completed record X/Y" states to avoid false completion
      else if (stage?.toLowerCase().includes('completed record')) {
        console.log('⏳ Processing record detected, NOT a terminal state:', stage);
      }
    }
  }, [isUploading, stage, processedCount, total, uploadProgress, forceCloseModalMemo, cleanupAndClose, autoCloseDelay]);

  // Handle cancel button click with improved UX - uses gentle cancel by default
  // forceCancel = false (default) uses the new gentle cancellation approach
  // Only uses force cancel when explicitly set to true
  const handleCancel = async (forceCancel = false) => {
    if (isCancelling) return;
    
    // If we're not force cancelling and the dialog isn't shown yet, show it first
    if (!forceCancel && !showCancelDialog) {
      setShowCancelDialog(true);
      return;
    }
    
    // Close the confirmation dialog
    setShowCancelDialog(false);
    setIsCancelling(true);
    
    // Change the stage to show cancellation is in progress
    setUploadProgress({
      ...uploadProgress,
      stage: "Upload Canceled",
      currentSpeed: 0,
      timeRemaining: 0
    });
    
    try {
      const result = await cancelUpload(forceCancel);
      
      if (result.success) {
        // Wait 2 seconds to show the "Upload Canceled" message before closing
        setTimeout(() => {
          cleanupAndClose();
        }, 2000);
      } else {
        // If normal cancel failed, show option for force cancel
        if (!forceCancel) {
          toast({
            title: 'Gentle Cancel Failed',
            description: 'Trying force cancel instead...',
            variant: 'destructive',
            action: (
              <ToastAction 
                altText="Force Cancel Now" 
                onClick={() => handleCancel(true)}
              >
                Force Cancel Now
              </ToastAction>
            ),
          });
        } else {
          // Even if server force cancel failed, still close UI
          cleanupAndClose();
          toast({
            title: 'Force Canceled',
            description: 'The upload has been forcefully canceled in this browser tab.',
            variant: 'destructive',
          });
        }
        setIsCancelling(false);
      }
    } catch (error) {
      console.error('Error cancelling upload:', error);
      
      // On force cancel, always close the modal even if there was an error
      if (forceCancel) {
        cleanupAndClose();
        toast({
          title: 'Force Canceled',
          description: 'The upload has been forcefully canceled in this browser tab.',
          variant: 'destructive',
        });
      } else {
        // For regular cancel errors, offer force cancel option
        toast({
          title: 'Cancel Error',
          description: 'Gentle cancel failed. Trying force cancel...',
          variant: 'destructive',
          action: (
            <ToastAction 
              altText="Force Cancel Now" 
              onClick={() => handleCancel(true)}
            >
              Force Cancel Now
            </ToastAction>
          ),
        });
        setIsCancelling(false);
      }
    }
  };

  // Don't render the modal if not uploading
  if (!isUploading) return null;
  
  // ENHANCED STAGE DETECTION LOGIC
  // Convert stage to lowercase once for all checks
  const stageLower = stage.toLowerCase();
  
  // IMPROVED: Check if we're in the initializing phase with stronger prioritization
  // Include the initial loading state when application is started or refreshed
  // and restoring an in-progress upload
  // Force initialization display until proper processing starts
  const isInitializing = (rawProcessed === 0) || 
                        stageLower.includes('initializing') || 
                        stageLower.includes('loading csv file') ||
                        stageLower.includes('file loaded') ||
                        stageLower.includes('identifying columns') || 
                        stageLower.includes('identified data columns') ||
                        stageLower.includes('preparing') ||
                        stageLower.includes('starting');
                        
  // IMPROVED: Make initialization a higher priority state
  // This ensures the initialization UI is always shown during the early phases
  
  // Basic state detection - clear, explicit flags
  const isPaused = stageLower.includes('pause between batches');
  const isLoading = stageLower.includes('loading') || stageLower.includes('preparing');
  const isProcessingRecord = stageLower.includes('processing record') || stageLower.includes('completed record');
  
  // Extract cooldown time if present in stage (e.g., '60-second pause between batches: 42 seconds remaining')
  let cooldownTime = null;
  if (isPaused && stageLower.includes('seconds remaining')) {
    const match = stageLower.match(/(\d+)\s+seconds?\s+remaining/);
    if (match && match[1]) {
      cooldownTime = parseInt(match[1], 10);
    }
  }
  
  // Now that we have stageLower, determine if we should show server restart protection
  // Don't show server restart mode during normal batch pauses or when processing is complete
  const serverRestartProtection = serverRestartDetected && 
                                 !(isPaused || stageLower.includes('batch') || 
                                   stageLower.includes('seconds remaining') || 
                                   stageLower.includes('complete') || 
                                   stageLower.includes('analysis complete'));
  
  // Consider any active work state as "processing"
  const isProcessing = isProcessingRecord || isPaused || stageLower.includes('processing');
  
  // Only set complete when explicitly mentioned OR when we've processed everything
  // Improved completion detection with more specific matches
  const isReallyComplete = stageLower.includes('completed all') || 
                        stageLower.includes('analysis complete') || 
                        stageLower.includes('complete') ||
                        stageLower === 'complete' ||
                        (rawProcessed >= total * 0.99 && total > 0);
  
  // FIXED VERSION - SIMPLER LOGIC:
  // 1. If stage includes "complete" or "analysis complete", it's NEVER an error
  // 2. If stage is explicitly "error" or contains "failed", it IS an error
  // 3. If we have an error message but our progress is complete, DON'T show error
  
  const isCompletionState = stageLower.includes('complete') || stageLower.includes('analysis complete');
  const isErrorStage = stageLower === 'error' || stageLower.includes('failed') || stageLower.includes('critical error');
  
  // Simplified error detection
  const hasError = isErrorStage && !isCompletionState && !isReallyComplete;
                 
  // Final completion state - explicitly check if it's not an error state first AND we've processed all (or nearly all) records
  // Only show "Analysis Complete!" when we've processed at least 99% of records
  const isComplete = isReallyComplete && !hasError && 
                    (total > 0 && processedCount >= total * 0.99) &&
                    !serverRestartProtection;
  
  // Calculate completion percentage safely - ensure it's visible when processing
  const percentComplete = total > 0 
    ? Math.min(100, Math.max(isProcessing ? 1 : 0, Math.round((processedCount / total) * 100)))
    : 0;
  
  // Check for cancellation state
  const isCancelled = stageLower.includes('cancel') || stageLower === "upload canceled";
  
  // Calculate time remaining in human-readable format with improved batch-aware logic
  const formatTimeRemaining = (seconds: number): string => {
    // Initialize with a more realistic estimation based on 3 seconds per record
    // Use a more realistic default based on 3 seconds per record
    const recordsRemaining = total - processedCount;
    // Default to 3 seconds per record as mentioned by the user
    const timePerRecord = 3; 
    
    // Calculate time more accurately 
    let calculatedTimeRemaining = recordsRemaining * timePerRecord;
    
    // If we're in a batch pause state, show cooldown directly
    if (isPaused && cooldownTime !== null) {
      return `${cooldownTime} sec cooldown`;
    }
    
    // Add a very small random value for natural transitions
    // Mas mabagal na transition para sa estimated time
    const randomVariance = Math.random() * 0.02 - 0.01; // -1% to +1% very small changes only
    
    if (currentSpeed > 0 && total > processedCount) {
      try {
        // For normal processing with speed, we'll still use our 3-second-per-record model
        // but we'll consider the actual observed speed as a minor factor
        const speedBasedTime = recordsRemaining / currentSpeed;
        
        // Use a weighted average: 80% based on our 3-second model, 20% on observed speed
        let baseTime = (calculatedTimeRemaining * 0.8) + (speedBasedTime * 0.2);
        
        // Add batch cooldown estimation based on remaining batches
        let cooldownEstimate = 0;
        if (totalBatches > 1) {
          const remainingBatches = Math.ceil(recordsRemaining / 30);
          if (remainingBatches > 0) {
            cooldownEstimate = (remainingBatches - 1) * 60; // 60 sec cooldown between batches
          }
        }
        
        // Calculate total time with our model plus cooldown
        baseTime = baseTime + cooldownEstimate;
        
        // Add small random variance to make it look more natural
        calculatedTimeRemaining = baseTime * (1 + randomVariance);
      } catch (e) {
        // If calculation error, fall back to our 3-second model
        calculatedTimeRemaining = (recordsRemaining * timePerRecord) * (1 + randomVariance);
      }
    } else if (seconds > 0) {
      // If server provides time, use it as a factor but still prioritize our model
      calculatedTimeRemaining = (calculatedTimeRemaining * 0.7) + (seconds * 0.3);
    }
    
    // Ensure we have a reasonable positive value
    const actualSeconds = Math.max(1, calculatedTimeRemaining);
    
    // Less than a minute - show seconds
    if (actualSeconds < 60) return `${Math.ceil(actualSeconds)} seconds`;
    
    // Calculate days, hours, minutes, seconds
    const days = Math.floor(actualSeconds / 86400); // 86400 seconds in a day
    const hours = Math.floor((actualSeconds % 86400) / 3600); // 3600 seconds in an hour
    const minutes = Math.floor((actualSeconds % 3600) / 60);
    
    // Format based on duration with PRIORITY for showing minutes and hours as requested
    if (days > 0) {
      // If we have days, show days and hours
      return `${days} ${days === 1 ? 'day' : 'days'} ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else if (hours > 0) {
      // If we have hours, show hours and minutes
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else {
      // Just minutes (don't show seconds as requested - focus on minutes for cleaner display)
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 flex items-center justify-center z-[9999]"
    >
      {/* Simple backdrop */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Content Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden w-full max-w-md mx-4 shadow-xl border border-gray-200 dark:border-gray-800 transform-gpu sm:max-w-lg"
      >
        {/* Enhanced Header with Gradient */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-4 md:p-5 text-white relative overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
          
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5"></div>
          
          {/* Title with enhanced styling */}
          <h3 className="text-xl md:text-2xl font-bold text-center mb-4 relative text-white drop-shadow-sm">
            {isComplete ? 'Analysis Complete!' : hasError ? 'Upload Error' : `Processing Records`}
          </h3>
          
          {/* Counter with animations */}
          <motion.div 
            className="flex flex-col items-center justify-center relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {isInitializing ? (
              <div className="py-5 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-white mb-3" />
                <span className="text-lg font-medium text-white">Preparing Your Dataset...</span>
                <span className="text-sm text-white/70 mt-1">Setting up the processing system</span>
              </div>
            ) : isComplete ? (
              <motion.div 
                className="py-6 flex flex-col items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 260 }}
                >
                  <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm mb-3 shadow-lg">
                    <CheckCircle className="h-14 w-14 text-white" />
                  </div>
                </motion.div>
                <motion.span 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg font-medium text-white"
                >
                  Analysis Successfully Completed
                </motion.span>
                <motion.span 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-sm text-white/70 mt-1"
                >
                  You can now view the results
                </motion.span>
              </motion.div>
            ) : isCancelled ? (
              <motion.div 
                className="py-6 flex flex-col items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 260 }}
                >
                  <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm mb-3 shadow-lg">
                    <Trash2 className="h-14 w-14 text-white" />
                  </div>
                </motion.div>
                <motion.span 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg font-medium text-white"
                >
                  Upload Canceled
                </motion.span>
                <motion.span 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-white/70 mt-1"
                >
                  You can upload again when ready
                </motion.span>
              </motion.div>
            ) : hasError ? (
              <motion.div 
                className="py-5 flex flex-col items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
              >
                <motion.div
                  animate={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ repeat: 1, duration: 0.5 }}
                >
                  <div className="bg-red-500/30 p-3 rounded-full backdrop-blur-sm mb-3 shadow-inner">
                    <XCircle className="h-12 w-12 text-white" />
                  </div>
                </motion.div>
                <span className="text-lg font-medium text-white">Processing Error</span>
                <span className="text-sm text-white/70 mt-1">{error || "An unexpected error occurred"}</span>
              </motion.div>
            ) : serverRestartProtection ? (
              <div className="py-5 flex flex-col items-center justify-center">
                <Server className="h-12 w-12 text-white mb-3" />
                <span className="text-lg font-medium text-white">Server Restarted</span>
                <span className="text-sm text-white/70 mt-1">Restoring your upload...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="text-center mr-4">
                  <div className="text-3xl font-bold">{percentComplete}%</div>
                  <div className="text-sm text-white/80">Complete</div>
                </div>
                <div className="h-14 w-[1px] bg-white/20 mx-2"></div>
                <div className="text-center ml-4">
                  <div className="text-3xl font-bold">{processedCount}</div>
                  <div className="text-sm text-white/80">of {total} Records</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Progress Content - Enhanced for mobile */}
        <div className="p-4 sm:p-5 md:p-6">
          {/* Progress bar */}
          {!isComplete && !hasError && (
            <div className="mb-4">
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentComplete}%` }}
                  transition={{ duration: 0.5 }}
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'gradientShift 2s linear infinite'
                  }}
                ></motion.div>
              </div>
            </div>
          )}
          
          {/* Status information */}
          <div className="space-y-3">
            {/* Current stage */}
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Stage</h4>
                <p className="text-base font-medium text-gray-900 dark:text-gray-200 mt-0.5">{stage}</p>
              </div>
            </div>
            
            {/* Server stats - only show if processing */}
            {isProcessing && !isComplete && !hasError && (
              <>
                {/* Processing speed */}
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing Speed</h4>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-200 mt-0.5">
                      {currentSpeed > 0 ? 
                        // Format with less decimal places and more stable feeling
                        // Round to nearest 0.05 to reduce jitter
                        `${(Math.round(currentSpeed * 20) / 20).toFixed(2)} records/sec` 
                        : 'Calculating...'}
                    </p>
                  </div>
                </div>
                
                {/* Time remaining */}
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Estimated Time</h4>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-200 mt-0.5">
                      {isPaused ? (
                        cooldownTime !== null ? 
                          `Resume in ${cooldownTime} seconds` : 
                          'Paused between batches'
                      ) : (
                        formatTimeRemaining(timeRemaining)
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Batch information - only show if we have multiple batches */}
                {totalBatches > 1 && batchNumber > 0 && (
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Batch Progress</h4>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-200 mt-0.5">
                        Batch {batchNumber} of {totalBatches} 
                        {batchProgress ? ` (${Math.round(batchProgress * 100)}%)` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Stats summary - show for completion */}
            {isComplete && (
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing Summary</h4>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-200 mt-0.5">
                    {processingStats.successCount} Records Analyzed
                    {processingStats.errorCount > 0 && `, ${processingStats.errorCount} Errors`}
                  </p>
                </div>
              </div>
            )}
            
            {/* Error details */}
            {hasError && error && (
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Terminal className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Details</h4>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                    {error}
                  </p>
                  
                  {/* Close & cancel button for errors */}
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        const sessionId = localStorage.getItem('uploadSessionId');
                        
                        // Try to ensure server-side cleanup too if possible
                        if (sessionId) {
                          cancelUpload(true)
                            .then(() => {
                              console.log('Cancelled upload due to error');
                              forceCloseModalMemo();
                            })
                            .catch(err => {
                              console.error('Error cancelling upload:', err);
                              // Force close anyway
                              forceCloseModalMemo();
                            });
                        } else {
                          // No sessionId, just close
                          forceCloseModalMemo();
                        }
                      }}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white px-4"
                    >
                      Close & Cancel
                    </Button>
                  </div>
                  
                  {/* No buttons here anymore - using automatic cleanup */}
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            {!isComplete && !hasError && (
              <div className="mt-4">
                <div className="flex justify-center">
                  {/* Single Enhanced Cancel Button with force cancel functionality */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-full px-6 py-5 font-medium shadow-md transition-all hover:shadow-lg hover-scale"
                    onClick={() => {
                      setShowCancelDialog(true); // Show confirmation dialog instead of direct cancel
                    }}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-base">Cancelling...</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" />
                        <span className="text-base">Cancel Upload</span>
                      </>
                    )}
                  </Button>
                </div>
                

              </div>
            )}
            
            {/* Success message and close button */}
            {isComplete && (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full px-5 py-2 hover-scale shadow-md"
                  onClick={() => forceCloseModalMemo()}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete - Close</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Enhanced Cancel confirmation dialog with gradient */}
      {showCancelDialog && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000]" onClick={() => setShowCancelDialog(false)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden w-full max-w-xs mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 transform-gpu" 
            onClick={e => e.stopPropagation()}
          >
            {/* Enhanced gradient header for cancel dialog */}
            <div className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 p-4 text-white relative overflow-hidden">
              {/* Animated decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-70 animate-pulse"></div>
              
              {/* Decorative circles */}
              <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/10"></div>
              <div className="absolute top-10 -right-4 w-8 h-8 rounded-full bg-white/5"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm shadow-inner border border-white/10">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ repeat: 2, duration: 0.5, delay: 0.2 }}
                  >
                    <AlertCircle className="h-5 w-5 text-white" />
                  </motion.div>
                </div>
                <h3 className="text-lg font-bold text-white">Cancel Upload?</h3>
              </div>
            </div>
            
            <div className="p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                This will stop the current processing job. Progress will be lost and you'll need to start over.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-5">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCancelDialog(false)}
                  className="w-full sm:w-auto bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 border-gray-200 dark:border-gray-700 rounded-full px-5 py-2 hover:scale-105 transition-transform duration-200 shadow-sm"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>Continue</span>
                  </span>
                </Button>
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancel(false)} 
                  className="w-full sm:w-auto bg-gradient-to-r from-red-500 via-pink-600 to-purple-600 hover:from-red-600 hover:via-pink-700 hover:to-purple-700 text-white border-none rounded-full px-5 py-2 hover:scale-105 transition-transform duration-200 shadow-md"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Cancel</span>
                  </span>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
      
      {/* Enhanced Animations */}
      <style>
        {`
          @keyframes gradientShift {
            0% {
              background-position: 100% 0;
            }
            100% {
              background-position: -100% 0;
            }
          }

          .bg-gradient-to-r {
            background-size: 200% 100%;
            animation: gradientBackground 8s linear infinite;
          }

          @keyframes gradientBackground {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          /* Make buttons pop on hover */
          .hover-scale {
            transition: transform 0.2s ease-in-out;
          }
          .hover-scale:hover {
            transform: scale(1.05);
          }
        `}
      </style>
    </motion.div>,
    document.body
  );
}