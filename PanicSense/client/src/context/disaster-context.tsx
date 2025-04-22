import React, { createContext, ReactNode, useContext, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  getSentimentPosts, 
  getDisasterEvents, 
  getAnalyzedFiles,
  SentimentPost,
  DisasterEvent,
  AnalyzedFile,
  getCurrentUploadSessionId,
  checkForActiveSessions
} from "@/lib/api";
import { nuclearCleanup } from "@/hooks/use-nuclear-cleanup";

// Add BroadcastChannel for cross-tab communication
const uploadBroadcastChannel = typeof window !== 'undefined' ? new BroadcastChannel('upload_status') : null;

// Declare the window extension for EventSource tracking
declare global {
  interface Window {
    _activeEventSources?: {
      [key: string]: EventSource;
    };
  }
}

// Type definitions
interface ProcessingStats {
  successCount: number;
  errorCount: number;
  averageSpeed: number;
}

interface UploadProgress {
  processed: number;
  total: number;
  stage: string;
  timestamp?: number;  // Add timestamp to ensure proper ordering of updates
  batchNumber?: number;
  totalBatches?: number;
  batchProgress?: number;
  currentSpeed?: number;
  timeRemaining?: number;
  processingStats?: ProcessingStats;
  error?: string;
  autoCloseDelay?: number; // Time in ms to auto-close "Analysis complete" state
}

interface DisasterContextType {
  // Data
  sentimentPosts: SentimentPost[];
  disasterEvents: DisasterEvent[];
  analyzedFiles: AnalyzedFile[];

  // Loading states
  isLoadingSentimentPosts: boolean;
  isLoadingDisasterEvents: boolean;
  isLoadingAnalyzedFiles: boolean;
  isUploading: boolean;

  // Upload progress
  uploadProgress: UploadProgress;

  // Error states
  errorSentimentPosts: Error | null;
  errorDisasterEvents: Error | null;
  errorAnalyzedFiles: Error | null;

  // Stats
  activeDiastersCount: number;
  analyzedPostsCount: number;
  dominantSentiment: string;
  dominantDisaster: string;
  modelConfidence: number;
  
  // Sentiment statistics
  dominantSentimentPercentage?: number;
  secondDominantSentiment?: string | null;
  secondDominantSentimentPercentage?: number;
  sentimentPercentages?: Record<string, number>;
  
  // Disaster statistics
  dominantDisasterPercentage?: number;
  secondDominantDisaster?: string | null;
  secondDominantDisasterPercentage?: number;
  disasterPercentages?: Record<string, number>;

  // Filters
  selectedDisasterType: string;
  setSelectedDisasterType: (type: string) => void;

  // Upload state management
  setIsUploading: (state: boolean) => void;
  setUploadProgress: (progress: UploadProgress) => void;

  // Refresh function
  refreshData: () => void;
}

const DisasterContext = createContext<DisasterContextType | undefined>(undefined);

// Initial states
const initialProgress: UploadProgress = {
  processed: 0,
  total: 0,
  stage: "Initializing...",
  timestamp: 0,
  batchNumber: 0,
  totalBatches: 0,
  batchProgress: 0,
  currentSpeed: 0,
  timeRemaining: 0
};

export function DisasterContextProvider({ children }: { children: ReactNode }): JSX.Element {
  // Create refs to track state and provide force cancel functionality
  const sessionCheckPerformedRef = useRef(false);
  const databaseCheckCompletedRef = useRef(false);
  const forceCloseRef = useRef(false);
  
  // Load from localStorage for immediate response (but database will be authoritative)
  const storedIsUploading = localStorage.getItem('isUploading') === 'true';
  const storedSessionId = localStorage.getItem('uploadSessionId');
  let storedProgress = localStorage.getItem('uploadProgress');
  
  // Nuclear cleanup at start to clear any lingering upload state on first load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('☢️ DISASTER CONTEXT: Running nuclear cleanup at startup to ensure clean state');
      // Only run once when the app starts
      const cleanupFlag = sessionStorage.getItem('initial_cleanup_performed');
      if (!cleanupFlag) {
        // Run nuclear cleanup to ensure a clean state
        nuclearCleanup();
        // Mark that we've done the cleanup
        sessionStorage.setItem('initial_cleanup_performed', 'true');
        console.log('☢️ Initial nuclear cleanup completed');
      }
    }
  }, []);
  
  // Initialize with localStorage state to improve cross-tab experience
  // But only if not in a force close state
  let initialUploadState = !forceCloseRef.current && storedIsUploading && storedSessionId ? true : false;
  let initialProgressState = initialProgress;
  
  // Parse stored progress if available
  if (storedProgress && initialUploadState) {
    try {
      const parsedProgress = JSON.parse(storedProgress);
      // Check if it's recent data (within last 15 minutes)
      const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
      if (parsedProgress.savedAt && parsedProgress.savedAt > fifteenMinutesAgo) {
        initialProgressState = parsedProgress;
        console.log('✅ Starting with active upload from localStorage');
      }
    } catch (error) {
      console.error('Failed to parse stored progress during init:', error);
    }
  }
  
  // SELECTIVE CLEANUP: Only clear stale upload data, retain active uploads
  useEffect(() => {
    console.log('🧨 DISASTER CONTEXT: SELECTIVE CLEANUP ACTIVATED');
    
    // Check for active uploads in database first before cleaning
    const checkForActiveUploadsBeforeCleaning = async () => {
      try {
        const response = await fetch('/api/active-upload-session');
        const data = await response.json();
        
        // If we have an active upload in database, don't clean localStorage
        if (data && data.sessionId) {
          console.log('⚠️ Active upload detected in database, skipping localStorage cleanup');
          
          // Set the session ID in localStorage
          localStorage.setItem('uploadSessionId', data.sessionId);
          localStorage.setItem('isUploading', 'true');
          
          // If we have progress data from the database, update localStorage
          if (data.progress) {
            localStorage.setItem('uploadProgress', 
              typeof data.progress === 'string' ? data.progress : JSON.stringify(data.progress));
            console.log('Stored database upload progress in localStorage');
          }
          
          // Broadcast the active upload to other tabs
          if (uploadBroadcastChannel) {
            uploadBroadcastChannel.postMessage({
              type: 'upload_progress_update',
              isUploading: true,
              progress: typeof data.progress === 'string' ? JSON.parse(data.progress) : data.progress,
              sessionId: data.sessionId
            });
            console.log('📡 Broadcast active upload to other tabs');
          }
          
          return true; // Active upload exists, don't clean
        }
        
        return false; // No active upload, can clean
      } catch (error) {
        console.error('Error checking for active uploads:', error);
        return false; // On error, proceed with cleanup
      }
    };
    
    // Only clean stale uploads (older than 5 minutes)
    const cleanStaleUploads = () => {
      console.log('Cleaning only stale upload data...');
      
      // Check if upload is stale (older than 5 minutes)
      const progressData = localStorage.getItem('uploadProgress');
      if (progressData) {
        try {
          const parsedProgress = JSON.parse(progressData);
          const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
          
          // If data is recent, don't clean it
          if (parsedProgress.savedAt && parsedProgress.savedAt > fiveMinutesAgo) {
            console.log('Recent upload progress detected, preserving it');
            return;
          }
        } catch (e) {
          // If we can't parse the data, it's probably stale/corrupted
        }
      }
      
      // Clean stale items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('upload') || 
          key.includes('isUploading') || 
          key.includes('session') ||
          key.includes('progress') ||
          key.includes('restart')
        )) {
          localStorage.removeItem(key);
          console.log(`🗑️ Deleted stale localStorage item: ${key}`);
        }
      }
      
      // Force server cleanup of error sessions only (NOT active ones)
      fetch('/api/cleanup-error-sessions', { method: 'POST' })
        .catch(e => console.error('Error during stale session cleanup:', e));
    };
    
    // Run the active check, then conditionally clean
    checkForActiveUploadsBeforeCleaning().then(hasActiveUpload => {
      if (!hasActiveUpload) {
        cleanStaleUploads();
      }
    });
    
    // Clean up BroadcastChannel on unmount
    return () => {
      if (uploadBroadcastChannel) {
        uploadBroadcastChannel.close();
        console.log('🧹 Closed BroadcastChannel on component cleanup');
      }
    };
  }, []);
  
  // If we have stored progress, parse it for immediate UI display
  if (storedProgress) {
    try {
      const parsedProgress = JSON.parse(storedProgress);
      // Check if the stored data is recent (within the last hour)
      const savedAt = parsedProgress.savedAt || 0;
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      if (savedAt >= oneHourAgo) {
        // Use the stored progress for immediate display while we check the database
        initialProgressState = parsedProgress;
        console.log('Using locally cached progress while waiting for database verification');
      } else {
        console.log('Stored progress is too old (>1h), not using for initial display');
      }
    } catch (error) {
      console.error('Failed to parse stored upload progress', error);
    }
  }
  
  // State initialization with potentially localStorage data
  // This gives us immediate UI while we wait for the database check
  const [selectedDisasterType, setSelectedDisasterType] = useState<string>("All");
  // SUPER STRONG DEFAULT - localStorage DICTATES VISIBILITY 
  // This makes it much harder for the database to hide the modal on server restart
  // User must explicitly click cancel button to hide modal
  const [isUploading, setIsUploading] = useState<boolean>(initialUploadState);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>(initialProgressState);

  // Get toast for notifications
  const { toast } = useToast();
  
  // ====== HYBRID APPROACH: LOCALSTORAGE IS AUTHORITATIVE FOR UI STATE, DATABASE FOR DATA ======
  // localStorage controls the UI visibility, DATABASE provides data for display
  // This approach prioritizes UI stability over real-time database accuracy
  useEffect(() => {
    // Define the database verification function - DATABASE IS BOSS!
    const verifyWithDatabase = async () => {
      try {
        console.log('📊 LOCAL is boss for visibility, database for data updates!');
        
        // STABILITY FIRST: Always ensure UI state from localStorage is shown immediately
        // This ensures we never have a flicker or lost initializing state
        if (storedProgress || storedSessionId || storedIsUploading) {
          // Maintain the uploading state from localStorage
          if (!isUploading) {
            setIsUploading(true);
            
            // If we have local progress, use it while waiting for database
            if (storedProgress) {
              try {
                const parsedProgress = JSON.parse(storedProgress);
                setUploadProgress(parsedProgress);
              } catch (e) {
                // If parse error, still show the initializing state
                setUploadProgress(initialProgress);
              }
            } else {
              // No stored progress, but we have a session - show initializing
              setUploadProgress(initialProgress);  
            }
          }
        }
        
        // THEN check with database, but only for data updates
        console.log('📊 Checking database for progress updates...');
        
        // Immediate UI setup from localStorage for fast loading
        // But database will always overrule this if different
        if (storedSessionId && storedIsUploading && storedProgress) {
          try {
            const parsedProgress = JSON.parse(storedProgress);
            // Only show loading state if the stored data is recent (last 15 minutes)
            const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
            if (parsedProgress.savedAt >= fifteenMinutesAgo) {
              // Show immediate UI from localStorage while waiting for database
              setIsUploading(true);
              setUploadProgress(parsedProgress);
              console.log('Showing cached UI while waiting for database verdict...');
            }
          } catch (e) {
            // Ignore parse errors, database will fix things
          }
        }
        
        // Check with the boss (database) for the real status
        console.log('Asking database for the real upload status...');
        const response = await fetch('/api/active-upload-session');
        if (!response.ok) throw new Error('Failed to check for active uploads');
        
        const data = await response.json();
        
        if (data.sessionId) {
          // DATABASE HAS ACTIVE SESSION - BOSS SAYS YES
          console.log('DATABASE BOSS SAYS: Yes, there is an active upload', data.sessionId);
          
          // Save the boss's decision to localStorage 
          localStorage.setItem('uploadSessionId', data.sessionId);
          localStorage.setItem('isUploading', 'true');
          
          // UI must follow the boss's decision
          setIsUploading(true);
          
          // If boss has progress info, that's the official info
          if (data.progress) {
            let dbProgress;
            
            // Parse the progress if needed
            if (typeof data.progress === 'string') {
              try {
                dbProgress = JSON.parse(data.progress);
              } catch (e) {
                console.error('Error parsing progress data from database');
                // Create a basic progress object on error
                dbProgress = {
                  processed: 0,
                  total: 100,
                  stage: "Processing data...",
                  timestamp: Date.now()
                };
              }
            } else {
              dbProgress = data.progress;
            }
            
            // Add timestamps and make official record
            const officialProgress = {
              ...dbProgress,
              timestamp: Date.now(),
              savedAt: Date.now(), 
              officialDbUpdate: true // Mark this as coming from the database
            };
            
            // Update UI with the official data
            setUploadProgress(officialProgress);
            
            // Update localStorage with the official data
            localStorage.setItem('uploadProgress', JSON.stringify(officialProgress));
            console.log('Official database progress saved to localStorage:', officialProgress);
          }
        } else {
          // DATABASE SAYS NO ACTIVE UPLOADS - BUT LOCAL IS THE REAL BOSS!
          // We need to be extremely careful about server restarts
          console.log('DATABASE says: No active uploads, but LOCAL storage still decides visibility');
          
          // CRITICAL: If we have ANY evidence of a recent upload in localStorage
          // we will IGNORE the database and TRUST localStorage
          if (isUploading) {
            // CHECK FOR SERVER RESTART CONDITION
            // If the localStorage has very recent data, it could be due to server restart
            // In that case, KEEP the upload modal showing despite what database says
            const progressData = localStorage.getItem('uploadProgress');
            if (progressData) {
              try {
                const parsedProgress = JSON.parse(progressData);
                const thirtySecondsAgo = Date.now() - (30 * 1000); // Reduced from 2 minutes to 30 seconds
                const lastCompletedTime = localStorage.getItem('uploadCompletedTimestamp');
                const hasUploadCompleted = localStorage.getItem('uploadCompleted') === 'true';
                
                // Only trigger server restart protection if:
                // 1. We have recent localStorage activity (last 30 seconds) AND
                // 2. There's no "upload completed" flag set AND
                // 3. The progress doesn't show 100% completion
                if (parsedProgress.savedAt && 
                    parsedProgress.savedAt > thirtySecondsAgo &&
                    !hasUploadCompleted &&
                    (!parsedProgress.processed || !parsedProgress.total || 
                     parsedProgress.processed < parsedProgress.total)) {
                  
                  console.log('⚠️ IMPORTANT: Recent localStorage activity detected for ACTIVE UPLOAD!');
                  console.log('💪 Ignoring database "no sessions" - possible SERVER RESTART detected');
                  console.log('💪 Keeping upload modal visible to prevent data loss');
                  
                  // CRITICAL: Don't clear localStorage or hide modal on possible server restart
                  // This is our SUPER PROTECTION against server restarts losing UI state
                  
                  // Set flag in localStorage to indicate server restart protection is active
                  localStorage.setItem('serverRestartProtection', 'true');
                  localStorage.setItem('serverRestartTimestamp', Date.now().toString());
                  
                  return; // Exit early WITHOUT clearing anything
                } else {
                  // Check if this was a completed upload (progress at 100%)
                  if (parsedProgress.processed && parsedProgress.total &&
                      parsedProgress.processed >= parsedProgress.total) {
                    console.log('⚠️ Found completed upload in localStorage - no server restart protection needed');
                    console.log('🧹 Finished upload detected - cleaning up localStorage');
                    
                    // This was a completed upload, so we should clean up
                    localStorage.removeItem('isUploading');
                    localStorage.removeItem('uploadProgress');
                    localStorage.removeItem('uploadSessionId');
                    localStorage.removeItem('lastProgressTimestamp');
                    localStorage.removeItem('lastUIUpdateTimestamp');
                    localStorage.removeItem('serverRestartProtection');
                    localStorage.removeItem('serverRestartTimestamp');
                    
                    // Also clear the uploadCompleted flags
                    localStorage.removeItem('uploadCompleted');
                    localStorage.removeItem('uploadCompletedTimestamp');
                    
                    return;
                  }
                }
              } catch (e) {
                // Parse error, proceed with normal cleanup
                console.error('Parse error in server restart check', e);
              }
            }
            
            // Old data - local storage now over 30 seconds with no upload in progress
            // Only in this case we follow database and clean up
            console.log('✂️ Clearing upload state only because LOCAL DATA is old (>30s) or completed');
            
            // Clear localStorage completely (only for old data)
            localStorage.removeItem('isUploading');
            localStorage.removeItem('uploadProgress');
            localStorage.removeItem('uploadSessionId');
            localStorage.removeItem('lastProgressTimestamp');
            localStorage.removeItem('lastUIUpdateTimestamp');
            localStorage.removeItem('serverRestartProtection');
            localStorage.removeItem('serverRestartTimestamp');
            
            // Also clear the uploadCompleted flags
            localStorage.removeItem('uploadCompleted');
            localStorage.removeItem('uploadCompletedTimestamp');
            
            // Update UI state to match database (the boss)
            setIsUploading(false);
            setUploadProgress(initialProgress);
          } else {
            console.log('UI already matches database - no uploads active');
          }
        }
        
        // Mark database check as completed - we listened to the boss
        databaseCheckCompletedRef.current = true;
      } catch (error) {
        console.error('Error checking with database boss:', error);
        // On error, keep current state to avoid flickering, but try again soon
      }
    };
    
    // Start by asking the boss right away
    verifyWithDatabase();
    
    // Keep checking with the boss regularly
    const intervalId = setInterval(() => {
      console.log('Running session check poll...');
      verifyWithDatabase();
    }, 10000); // Every 10 seconds, check with the boss
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Persistence for upload state - save to localStorage when state changes
  // and broadcast to other tabs
  useEffect(() => {
    if (isUploading) {
      try {
        // Only update localStorage if database check has completed
        // This prevents localStorage from overriding database state during startup
        if (databaseCheckCompletedRef.current) {
          // Add timestamp for freshness check
          const dataToStore = {
            ...uploadProgress,
            savedAt: Date.now()
          };
          
          // Store the current upload progress and state
          localStorage.setItem('isUploading', 'true');
          localStorage.setItem('uploadProgress', JSON.stringify(dataToStore));
          
          // Broadcast to other tabs using BroadcastChannel
          if (uploadBroadcastChannel) {
            uploadBroadcastChannel.postMessage({
              type: 'upload_progress_update',
              isUploading: true,
              progress: dataToStore,
              sessionId: localStorage.getItem('uploadSessionId')
            });
          }
          
          // Log persistence for debugging
          console.log('Saved upload progress to localStorage and broadcast to other tabs:', dataToStore);
        }
      } catch (error) {
        // Handle storage errors gracefully
        console.error('Failed to store upload progress:', error);
      }
    } else {
      // Clear storage when upload is finished
      localStorage.removeItem('isUploading');
      localStorage.removeItem('uploadProgress');
      localStorage.removeItem('uploadSessionId');
      localStorage.removeItem('lastProgressTimestamp');
      
      // Broadcast finish to other tabs
      if (uploadBroadcastChannel) {
        uploadBroadcastChannel.postMessage({
          type: 'upload_finished',
          isUploading: false
        });
      }
    }
  }, [isUploading, uploadProgress]);

  // Get current location to detect route changes
  const [location] = useLocation();

  // Prepare refresh function to use with data loading
  const refreshDataRef = useRef<() => void>(() => {});
  
  // Queries for data loading
  const { 
    data: sentimentPosts = [], 
    isLoading: isLoadingSentimentPosts,
    error: errorSentimentPosts,
    refetch: refetchSentimentPosts
  } = useQuery({ 
    queryKey: ['/api/sentiment-posts'],
    queryFn: () => getSentimentPosts(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3 // Retry 3 times if failed
  });

  const { 
    data: disasterEvents = [], 
    isLoading: isLoadingDisasterEvents,
    error: errorDisasterEvents,
    refetch: refetchDisasterEvents
  } = useQuery({ 
    queryKey: ['/api/disaster-events'],
    queryFn: () => getDisasterEvents(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3 // Retry 3 times if failed
  });

  const { 
    data: analyzedFiles = [], 
    isLoading: isLoadingAnalyzedFiles,
    error: errorAnalyzedFiles,
    refetch: refetchAnalyzedFiles
  } = useQuery({ 
    queryKey: ['/api/analyzed-files'],
    queryFn: () => getAnalyzedFiles(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3 // Retry 3 times if failed
  });
  
  // Update refresh function after queries are initialized
  useEffect(() => {
    // Define refresh function using the refetch functions from queries
    refreshDataRef.current = () => {
      if (refetchSentimentPosts && refetchDisasterEvents && refetchAnalyzedFiles) {
        refetchSentimentPosts();
        refetchDisasterEvents();
        refetchAnalyzedFiles();
        
        // Also refresh usage stats data
        queryClient.invalidateQueries({ queryKey: ['/api/usage-stats'] });
      }
    };
  }, [refetchSentimentPosts, refetchDisasterEvents, refetchAnalyzedFiles]);
  
  // Helper function to access the refresh function
  const refreshData = () => refreshDataRef.current();
  
  // The check and reconnect function
  // Improved version with anti-flickering safeguards
  const checkAndReconnectToActiveUploads = async () => {
    // ANTI-FLICKERING: Check localStorage first to maintain UI stability
    const storedSessionId = localStorage.getItem('uploadSessionId');
    const storedIsUploading = localStorage.getItem('isUploading') === 'true';
    let storedProgress = null;
    
    try {
      // If we already have active upload data in localStorage, use it first
      // This prevents flickering while we wait for the database check
      if (storedIsUploading && storedSessionId && !isUploading) {
        setIsUploading(true);
        
        try {
          const progressData = localStorage.getItem('uploadProgress');
          if (progressData) {
            storedProgress = JSON.parse(progressData);
            // Only update if we have data and it's newer than what we have
            if (storedProgress && (!uploadProgress.timestamp || 
                storedProgress.timestamp > uploadProgress.timestamp)) {
              setUploadProgress(storedProgress);
            }
          }
        } catch (e) {
          // Silently handle parse errors
        }
      }
    
      // THEN check database for active uploads - ALWAYS prioritize database for source of truth
      const activeSessionId = await checkForActiveSessions();
      
      // If found an active session in database, this is the authority source of truth
      if (activeSessionId) {
        // Limit logging to reduce console spam
        if (Math.random() < 0.05) {
          console.log('Active upload session found in database:', activeSessionId);
        }
        
        // Make sure the upload modal is shown, but ONLY if it's not already
        // This prevents unnecessary re-renders
        if (!isUploading) {
          setIsUploading(true);
        }
        
        // At this point, localStorage should already be populated with the session data
        // from checkForActiveSessions, but let's validate it
        const storedProgress = localStorage.getItem('uploadProgress');
        if (!storedProgress) {
          console.log('Database session active but no progress in localStorage, fetching data');
          try {
            const response = await fetch(`/api/upload-progress/${activeSessionId}`);
            if (response.ok) {
              const progressEvent = await response.json();
              if (progressEvent) {
                // IMPORTANT: Add timestamp to ensure proper ordering
                progressEvent.timestamp = progressEvent.timestamp || Date.now();
                setUploadProgress(progressEvent);
                localStorage.setItem('uploadProgress', JSON.stringify({
                  ...progressEvent,
                  savedAt: Date.now()
                }));
              }
            }
          } catch (err) {
            // Silently handle errors to prevent console spam
          }
        }
        
        // Set up a more robust EventSource for progress updates with deduplication
        // but ONLY if one doesn't already exist to prevent duplicates
        const handleMessage = (event: MessageEvent) => {
          try {
            if (!event.data) return;
            
            // Parse progress data
            const progress = JSON.parse(event.data);
            
            // Log the progress data
            console.log("Progress event received:", progress);
            
            // Important: Check timestamps - only update if this is newer than our last update
            // This prevents out-of-order updates from causing flickering
            const currentTimestamp = progress.timestamp || Date.now();
            const lastTimestamp = parseInt(localStorage.getItem('lastProgressTimestamp') || '0');
            
            // Anti-flicker protection
            const lastUIUpdate = parseInt(localStorage.getItem('lastUIUpdateTimestamp') || '0');
            const now = Date.now();
            const timeSinceLastUpdate = now - lastUIUpdate;
            
            // Only update if this is a newer message
            if (currentTimestamp >= lastTimestamp) {
              // Store the latest progress in localStorage immediately
              // This ensures we don't lose data even if UI updates are debounced
              localStorage.setItem('uploadProgress', JSON.stringify({
                ...progress,
                savedAt: now
              }));
              localStorage.setItem('lastProgressTimestamp', currentTimestamp.toString());
              
              // DEBOUNCE UI updates - limit to one update per 300ms to prevent flickering
              // BUT make exceptions for important state changes that should be immediate
              const isImportantStateChange = 
                // Always show immediately when batch changes
                progress.batchNumber !== uploadProgress.batchNumber ||
                // Always show immediately when state changes (complete, error, etc)
                progress.stage !== uploadProgress.stage ||
                // Always update if we haven't updated in over 500ms
                timeSinceLastUpdate > 500;
                
              if (isImportantStateChange || timeSinceLastUpdate > 300) {
                // Log what we're sending to the UI
                console.log("Progress being sent to UI:", progress);
                
                // Update UI with progress
                setUploadProgress(progress);
                
                // Record the time of this UI update
                localStorage.setItem('lastUIUpdateTimestamp', now.toString());
              }
            }
            
            // ULTRA-AGGRESSIVE AUTO-CLOSE DETECTION
            // Check for ANY completion/error/cancellation signals
            const stageLower = progress.stage.toLowerCase();
            
            // STRICTER TERMINAL STATE DETECTION - ONLY Analysis complete is a terminal state
            // Not "Completed record X/Y" which is NOT a terminal state
            const isCompleteState = stageLower === 'analysis complete' || 
                                   stageLower === 'upload complete' || 
                                   stageLower === 'processing complete' ||
                                   (stageLower.includes('complete') && !stageLower.includes('record')) ||
                                   (progress.processed >= progress.total && progress.total > 0 && !stageLower.includes('record'));
                                  
            const isErrorState = stageLower.includes('error') || 
                               stageLower.includes('fail') || 
                               stageLower.includes('exception');
                               
            const isCancelledState = stageLower.includes('cancel') || 
                                   stageLower.includes('abort') ||
                                   stageLower.includes('stop');
            
            // FINAL TERMINAL STATE CHECK
            const isTerminalState = isCompleteState || isErrorState || isCancelledState;
            
            if (isTerminalState) {
              console.log('🚨 TERMINAL STATE DETECTED! AUTO-CLOSING!', stageLower);
              
              // Check if eventSource still exists before closing
              if (window._activeEventSources?.[activeSessionId]) {
                console.log('Closing EventSource connection');
                window._activeEventSources[activeSessionId].close();
                if (window._activeEventSources) {
                  delete window._activeEventSources[activeSessionId];
                }
              }
              
              // If it completed successfully, refresh data to show new records
              if (isCompleteState) {
                console.log('Success completion detected - refreshing data');
                // First refresh data, but wait a bit for server to finalize everything
                setTimeout(() => {
                  refreshData();
                }, 500);
              }
              
              // ULTRA-STRICT: Flag to force close due to terminal state
              // This flag tells other systems that local storage should be cleared
              localStorage.setItem('forceCloseUploadModal', 'true');
              localStorage.setItem('forceCloseTimestamp', Date.now().toString());
              
              // Use a timer before closing the modal to prevent abrupt UI changes
              // This gives user time to see the final status
              const completionDelay = isErrorState ? 2000 : 3000;
              
              // For completion states, we'll delay the modal close slightly
              // This prevents abrupt UI changes and makes the experience smoother
              setTimeout(() => {
                console.log('🚪 AUTO-CLOSING UPLOAD MODAL DUE TO TERMINAL STATE');
                // Clear the upload progress from localStorage immediately
                localStorage.removeItem('isUploading');
                localStorage.removeItem('uploadProgress');
                localStorage.removeItem('uploadSessionId');
                localStorage.removeItem('lastProgressTimestamp');
                localStorage.removeItem('lastUIUpdateTimestamp');
                localStorage.removeItem('forceCloseUploadModal');
                localStorage.removeItem('forceCloseTimestamp');
                
                // Finally close the modal after storage is cleared
                // This sequence ensures we don't get flickering from localStorage checks
                setIsUploading(false);
              }, completionDelay);
            }
          } catch (error) {
            console.error('Error parsing progress data:', error);
          }
        };
        
        // Create an error handler function that we can reuse
        const handleError = (event: Event) => {
          console.log('EventSource error, attempting to reconnect...');
          
          // Don't immediately close and end the upload - give it a chance to recover
          // We'll use a timeout to check if we can reconnect
          setTimeout(() => {
            // Make sure we have the global tracking object
            if (!window._activeEventSources) {
              window._activeEventSources = {};
            }
            
            // Get the current EventSource
            const currentSource = window._activeEventSources?.[activeSessionId];
            if (!currentSource) {
              // If we no longer have an EventSource, create a new one
              createNewEventSource();
              return;
            }
            
            // If the connection is in a CLOSED state, try to reopen it
            if (currentSource.readyState === EventSource.CLOSED) {
              console.log('EventSource connection closed, reconnecting...');
              createNewEventSource();
            } else if (currentSource.readyState === EventSource.OPEN) {
              // If it's already reconnected, do nothing
              console.log('EventSource connection recovered');
            } else {
              // Try a final reconnect
              createNewEventSource();
              
              // Set a timeout to check if the reconnection worked
              setTimeout(() => {
                const source = window._activeEventSources?.[activeSessionId];
                if (!source || source.readyState !== EventSource.OPEN) {
                  console.log('EventSource failed to reconnect, closing upload modal');
                  if (source) source.close();
                  if (window._activeEventSources) {
                    delete window._activeEventSources[activeSessionId];
                  }
                  setIsUploading(false);
                }
              }, 3000); // Give it 3 more seconds to connect
            }
          }, 2000);  // Give it 2 seconds before first reconnect attempt
        };
        
        // Function to create a new EventSource with proper setup
        const createNewEventSource = () => {
          // Close any existing source first
          if (window._activeEventSources?.[activeSessionId]) {
            try {
              window._activeEventSources[activeSessionId].close();
            } catch (e) {
              // Ignore errors on close
            }
          }
          
          // Create the global tracking object if it doesn't exist
          if (!window._activeEventSources) {
            window._activeEventSources = {};
          }
          
          // Create new EventSource
          const newSource = new EventSource(`/api/upload-progress/${activeSessionId}`);
          
          // Set event handlers
          newSource.onmessage = handleMessage;
          newSource.onerror = handleError;
          
          // Store in the global registry
          window._activeEventSources[activeSessionId] = newSource;
          
          return newSource;
        };
        
        // Initialize the EventSource
        createNewEventSource();
        
        return;
      }
      
      // Fall back to localStorage check if no active uploads in database
      // But ONLY if there is local storage data (meaning we need to persist it)
      const isUploadingFromStorage = localStorage.getItem('isUploading') === 'true';
      if (isUploadingFromStorage && storedProgress) {
        // Check if the stored progress is fresh (less than 30 minutes old, increased from 5 minutes)
        try {
          const parsedProgress = JSON.parse(storedProgress);
          const savedAt = parsedProgress.savedAt || 0;
          // Use a longer timeout (30 minutes) to ensure modal doesn't disappear too quickly
          const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
          
          // If data is stale (more than 30 minutes old), we'll ignore it
          if (savedAt < thirtyMinutesAgo) {
            console.log('Stored upload progress is stale (older than 30 minutes), clearing local storage');
            localStorage.removeItem('isUploading');
            localStorage.removeItem('uploadProgress');
            localStorage.removeItem('uploadSessionId');
            return;
          }
          
          // Enhanced error detection: Check if the upload has completed or has an error
          const stageLower = parsedProgress.stage?.toLowerCase() || '';
          const isCompleteOrError = stageLower.includes('complete') || 
                                    stageLower.includes('error') || 
                                    stageLower.includes('cancelled');
                                    
          // Also check for error-like conditions that should be cleared
          const isErrorCondition = stageLower === 'error' || 
                                   parsedProgress.total === 0 ||
                                   parsedProgress.error;
                                   
          if (isCompleteOrError || isErrorCondition) {
            console.log('Found completed or error upload in localStorage, clearing data');
            // Clear all localStorage items related to uploads
            localStorage.removeItem('isUploading');
            localStorage.removeItem('uploadProgress');
            localStorage.removeItem('uploadSessionId');
            localStorage.removeItem('lastProgressTimestamp');
            localStorage.removeItem('lastUIUpdateTimestamp');
            localStorage.removeItem('lastDisplayTime');
            return;
          }
          
          console.log('Using localStorage data since database check returned no active sessions');
          // We've already parsed the progress, so use it directly
          setUploadProgress(parsedProgress);
          setIsUploading(true);
          
          // Set a longer display time to ensure modal doesn't disappear too quickly
          localStorage.setItem('lastDisplayTime', Date.now().toString());
          
          // Check if there's an active session ID from localStorage
          const sessionId = getCurrentUploadSessionId();
          if (sessionId) {
            console.log('Reconnecting to upload session from localStorage:', sessionId);
            
            // Set up a more robust EventSource for progress updates
            // Keep a reference for cleanup and reconnection
            // Create a message handler function that we can reuse
            const handleMessage = (event: MessageEvent) => {
              try {
                // Make sure we have valid JSON data
                if (!event.data) {
                  return;
                }
                
                // Parse the progress data
                const progress = JSON.parse(event.data);
                
                // Validate that we have a valid progress object
                if (!progress || typeof progress !== 'object') {
                  return;
                }
                
                // Log the progress data for debugging
                console.log("Progress event received:", progress);
                
                // Important: Check timestamps - only update if this is newer than our last update
                // This prevents out-of-order updates from causing flickering
                const currentTimestamp = progress.timestamp || Date.now();
                const lastTimestamp = parseInt(localStorage.getItem('lastProgressTimestamp') || '0');
                
                // Anti-flicker protection
                const lastUIUpdate = parseInt(localStorage.getItem('lastUIUpdateTimestamp') || '0');
                const now = Date.now();
                const timeSinceLastUpdate = now - lastUIUpdate;
                
                // Only update if this is a newer message
                if (currentTimestamp >= lastTimestamp) {
                  // Store the latest progress in localStorage immediately
                  // This ensures we don't lose data even if UI updates are debounced
                  localStorage.setItem('uploadProgress', JSON.stringify({
                    ...progress,
                    savedAt: now
                  }));
                  localStorage.setItem('lastProgressTimestamp', currentTimestamp.toString());
                  
                  // DEBOUNCE UI updates - limit to one update per 300ms to prevent flickering
                  // BUT make exceptions for important state changes that should be immediate
                  const isImportantStateChange = 
                    // Always show immediately when batch changes
                    progress.batchNumber !== uploadProgress.batchNumber ||
                    // Always show immediately when state changes (complete, error, etc)
                    progress.stage !== uploadProgress.stage ||
                    // Always update if we haven't updated in over 500ms
                    timeSinceLastUpdate > 500;
                    
                  if (isImportantStateChange || timeSinceLastUpdate > 300) {
                    // Log what we're sending to the UI
                    console.log("Progress being sent to UI:", progress);
                    
                    // Update UI with progress
                    setUploadProgress(progress);
                    
                    // Record the time of this UI update
                    localStorage.setItem('lastUIUpdateTimestamp', now.toString());
                  }
                }
                
                // Check for completion states in the stage message
                const stageLower = progress.stage?.toLowerCase() || '';
                const isComplete = stageLower.includes('complete');
                const isError = stageLower.includes('error');
                const isCancelled = stageLower.includes('cancelled');
                
                // If the upload is complete or has an error, close the connection
                if (isComplete || isError || isCancelled) {
                  // Check if eventSource still exists before closing
                  if (window._activeEventSources?.[sessionId]) {
                    try {
                      window._activeEventSources[sessionId].close();
                      if (window._activeEventSources) {
                        delete window._activeEventSources[sessionId];
                      }
                    } catch (e) {
                      // Suppress error
                    }
                  }
                  
                  // If it completed successfully, refresh data to show new records
                  if (isComplete) {
                    // First refresh data, but wait a bit for server to finalize everything
                    setTimeout(() => {
                      refreshData();
                    }, 500);
                  }
                  
                  // Use a timer before closing the modal to prevent abrupt UI changes
                  // This gives user time to see the final status
                  const completionDelay = isError ? 2000 : 3000;
                  
                  // For all completion states, we'll delay the modal close slightly
                  // This prevents abrupt UI changes and makes the experience smoother
                  setTimeout(() => {
                    // Clear the upload progress from localStorage
                    localStorage.removeItem('isUploading');
                    localStorage.removeItem('uploadProgress');
                    localStorage.removeItem('uploadSessionId');
                    localStorage.removeItem('lastProgressTimestamp');
                    localStorage.removeItem('lastUIUpdateTimestamp');
                    
                    // Finally close the modal after storage is cleared
                    setIsUploading(false);
                    
                    // Show a toast or alert to inform the user if there was an error
                    if (isError) {
                      console.error('Upload failed with error:', progress.stage);
                    }
                  }, completionDelay);
                }
              } catch (error) {
                console.error('Error parsing progress data:', error);
              }
            };
            
            // Create an error handler function that we can reuse
            const handleError = (event: Event) => {
              console.log('EventSource error, attempting to reconnect...');
              
              // Store error occurrence timestamp
              const errorTime = new Date();
              
              // Don't immediately close and end the upload - give it a chance to recover
              // We'll use a timeout to check if we can reconnect
              setTimeout(() => {
                try {
                  // Make sure we have the global tracking object
                  if (!window._activeEventSources) {
                    window._activeEventSources = {};
                  }
                  
                  // Get the current EventSource
                  const currentSource = window._activeEventSources?.[sessionId];
                  if (!currentSource) {
                    // If we no longer have an EventSource, create a new one
                    console.log('No active EventSource found, creating new one');
                    createNewEventSource();
                    return;
                  }
                  
                  // If the connection is in a CLOSED state, try to reopen it
                  if (currentSource.readyState === EventSource.CLOSED) {
                    console.log('EventSource connection closed, reconnecting...');
                    createNewEventSource();
                  } else if (currentSource.readyState === EventSource.OPEN) {
                    // If it's already reconnected, do nothing
                    console.log('EventSource connection recovered on its own');
                  } else {
                    // Try a final reconnect
                    console.log('EventSource in connecting state, trying a fresh connection');
                    createNewEventSource();
                    
                    // Set a timeout to check if the reconnection worked
                    setTimeout(() => {
                      try {
                        const source = window._activeEventSources?.[sessionId];
                        if (!source || source.readyState !== EventSource.OPEN) {
                          console.log('EventSource failed to reconnect after multiple attempts, closing upload modal');
                          if (source) {
                            try {
                              source.close();
                            } catch (closeError) {
                              console.error('Error closing EventSource:', closeError);
                            }
                          }
                          
                          // Clean up the reference
                          if (window._activeEventSources) {
                            delete window._activeEventSources[sessionId];
                          }
                          
                          // Show error to user and reset upload state
                          setIsUploading(false);
                          
                          // Clear stored upload data
                          localStorage.removeItem('isUploading');
                          localStorage.removeItem('uploadProgress');
                          localStorage.removeItem('uploadSessionId');
                          
                          // We could show a toast notification here about connection issues
                        } else {
                          console.log('EventSource reconnected successfully');
                        }
                      } catch (innerError) {
                        console.error('Error during reconnection check:', innerError);
                        // Failsafe: reset upload state
                        setIsUploading(false);
                      }
                    }, 5000); // Give it 5 seconds to connect
                  }
                } catch (outerError) {
                  console.error('Error in EventSource reconnection logic:', outerError);
                  // Failsafe: reset upload state on any error in the reconnection logic
                  setIsUploading(false);
                }
              }, 2000);  // Give it 2 seconds before first reconnect attempt
            };
            
            // Function to create a new EventSource with proper setup
            const createNewEventSource = () => {
              // Close any existing source first
              if (window._activeEventSources?.[sessionId]) {
                try {
                  window._activeEventSources[sessionId].close();
                } catch (e) {
                  // Ignore errors on close
                }
              }
              
              // Create the global tracking object if it doesn't exist
              if (!window._activeEventSources) {
                window._activeEventSources = {};
              }
              
              // Create new EventSource
              const newSource = new EventSource(`/api/upload-progress/${sessionId}`);
              
              // Set event handlers
              newSource.onmessage = handleMessage;
              newSource.onerror = handleError;
              
              // Store in the global registry
              window._activeEventSources[sessionId] = newSource;
              
              return newSource;
            };
            
            // Initialize the EventSource
            createNewEventSource();
          } else {
            // No active session found, reset the upload state
            setIsUploading(false);
          }
        } catch (error) {
          // Error silently handled - removed console.error
          setIsUploading(false);
        }
      }
    } catch (error) {
      // Error silently handled - removed console.error
      setIsUploading(false);
    }
  };

  // Now we'll create a useEffect that checks for active uploads on route changes
  // This optimized version avoids polling issues and UI flickering 
  useEffect(() => {
    // Only log once when active routes change
    console.log('Checking for active uploads on route:', location);
    
    // Start with sessionId from localStorage to reduce flickering
    const storedSessionId = localStorage.getItem('uploadSessionId');
    const storedIsUploading = localStorage.getItem('isUploading') === 'true';
    
    // We use a debounced check approach with a more stable polling strategy
    // Set up polling to check for active sessions (reduced frequency - every 20 seconds)
    const pollIntervalId = setInterval(() => {
      // Only run polling check if we're not already showing an upload modal
      // This prevents disrupting an active upload
      if (!isUploading) {
        // Only log 5% of the time to reduce console spam
        if (Math.random() < 0.05) {
          console.log('Running session check poll...');
        }
        
        // Use a debounced version of the check to prevent rapid UI changes
        checkAndReconnectToActiveUploads();
      }
    }, 20000); // Increased to 20 seconds
    
    // Only run initial check if we don't already have active upload
    // This reduces UI flickering when we already know an upload is in progress
    if (!storedIsUploading || !storedSessionId) {
      checkAndReconnectToActiveUploads();
    }
    
    // Clean up polling on unmount
    return () => {
      clearInterval(pollIntervalId);
    };
  }, [location, isUploading]);

  // Listen for BroadcastChannel messages to sync upload state between tabs
  useEffect(() => {
    if (!uploadBroadcastChannel) return;
    
    // Track the last time we processed a broadcast message to prevent flickering
    let lastProcessedTimestamp = 0;
    const DEBOUNCE_TIME = 1000; // 1 second debounce
    
    const handleBroadcastMessage = (event: MessageEvent) => {
      const { type, isUploading: newIsUploading, progress, sessionId, timestamp } = event.data;
      const now = Date.now();
      
      // Prevent processing too many events in quick succession
      if (timestamp && now - lastProcessedTimestamp < DEBOUNCE_TIME) {
        console.log('🛑 Skipping broadcast - too soon after last one:', now - lastProcessedTimestamp, 'ms');
        return;
      }
      
      console.log('📡 Received broadcast from another tab:', type);
      
      if (type === 'upload_progress_update' && newIsUploading) {
        // Update UI state to match other tab
        setIsUploading(true);
        
        // Update progress if we have it and it has a newer timestamp than our current one
        if (progress && (!uploadProgress.timestamp || progress.timestamp > uploadProgress.timestamp)) {
          setUploadProgress(progress);
          lastProcessedTimestamp = now;
        }
        
        // Update sessionId in localStorage if provided
        if (sessionId) {
          localStorage.setItem('uploadSessionId', sessionId);
        }
        
        console.log('📡 Synchronized upload state from another tab');
      } else if (type === 'upload_finished' && !newIsUploading) {
        // Only update if we currently show as uploading
        if (isUploading) {
          // Add a small delay to avoid flickering
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(initialProgress);
            console.log('📡 Upload finished notification from another tab - applying after delay');
          }, 500);
          
          lastProcessedTimestamp = now;
        }
      }
    };
    
    uploadBroadcastChannel.addEventListener('message', handleBroadcastMessage);
    
    return () => {
      uploadBroadcastChannel?.removeEventListener('message', handleBroadcastMessage);
    };
  }, [isUploading, setIsUploading, setUploadProgress]);

  // WebSocket setup for all non-upload messages (like feedback, post updates)
  // We'll keep this separate from the upload progress handling to avoid conflicts
  useEffect(() => {
    // Flag to determine if we're in upload mode - only handle WebSocket progress in this mode
    // We'll use EventSource for the main method of communication during uploads
    const isInUploadMode = localStorage.getItem('isUploading') === 'true';

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle sentiment feedback updates (for real-time UI updates)
        if (data.type === 'feedback-update') {
          // This will trigger a refresh of all data including sentiment posts
          refreshData();
          
          // Display a toast notification about the sentiment update
          toast({
            title: 'Model Updated',
            description: `Sentiment model has been trained with new feedback.`,
            variant: 'default',
          });
        }
        // Handle specific post update messages
        else if (data.type === 'post-updated') {
          // Force an immediate refresh to update the UI with the new sentiment
          refreshData();
          
          // Display a toast notification about the post update
          toast({
            title: 'Post Updated',
            description: `Sentiment has been updated successfully.`,
            variant: 'default',
          });
        }
        // We're now IGNORING progress updates from WebSocket when using EventSource
        // This prevents duplicate updates that cause flickering
      } catch (error) {
        // Error silently handled
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  // This section has been moved after the refreshData function

  // Calculate stats with safety checks for array data
  const activeDiastersCount = Array.isArray(disasterEvents) ? disasterEvents.length : 0;
  const analyzedPostsCount = Array.isArray(sentimentPosts) ? sentimentPosts.length : 0;

  // Calculate dominant sentiment with proper array check and percentages
  const sentimentCounts: Record<string, number> = {};
  const totalPosts = Array.isArray(sentimentPosts) ? sentimentPosts.length : 0;
  
  if (totalPosts > 0) {
    sentimentPosts.forEach((post: SentimentPost) => {
      sentimentCounts[post.sentiment] = (sentimentCounts[post.sentiment] || 0) + 1;
    });
  }

  // Sort sentiments by count from highest to lowest
  const sortedSentiments = Object.entries(sentimentCounts)
    .sort((a, b) => b[1] - a[1]);
    
  // Get the dominant sentiment
  const dominantSentiment = sortedSentiments.length > 0 
    ? sortedSentiments[0]?.[0] 
    : "Neutral";
    
  // Calculate percentages for each sentiment
  const sentimentPercentages = Object.fromEntries(
    Object.entries(sentimentCounts).map(([sentiment, count]) => [
      sentiment, 
      totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0
    ])
  );
  
  // Calculate dominant sentiment percentage
  const dominantSentimentPercentage = sentimentPercentages[dominantSentiment] || 0;
  
  // Calculate second most dominant sentiment if available
  const secondDominantSentiment = sortedSentiments.length > 1 
    ? sortedSentiments[1]?.[0] 
    : null;
  const secondDominantSentimentPercentage = secondDominantSentiment 
    ? sentimentPercentages[secondDominantSentiment] 
    : 0;
    
  // Calculate dominant disaster type with proper array check
  const disasterCounts: Record<string, number> = {};
  let validDisasterPostsCount = 0;
  
  if (totalPosts > 0) {
    sentimentPosts.forEach((post: SentimentPost) => {
      if (post.disasterType && 
          post.disasterType !== "Not Specified" && 
          post.disasterType !== "NONE" && 
          post.disasterType !== "None" && 
          post.disasterType !== "null" && 
          post.disasterType !== "undefined") {
        disasterCounts[post.disasterType] = (disasterCounts[post.disasterType] || 0) + 1;
        validDisasterPostsCount++;
      }
    });
  }
  
  // Sort disaster types by count from highest to lowest
  const sortedDisasters = Object.entries(disasterCounts)
    .sort((a, b) => b[1] - a[1]);
  
  // Get the dominant disaster
  const dominantDisaster = sortedDisasters.length > 0 
    ? sortedDisasters[0]?.[0] 
    : "Unknown";
    
  // Calculate percentages for each disaster type
  const disasterPercentages = Object.fromEntries(
    Object.entries(disasterCounts).map(([disasterType, count]) => [
      disasterType, 
      validDisasterPostsCount > 0 ? Math.round((count / validDisasterPostsCount) * 100) : 0
    ])
  );
  
  // Calculate dominant disaster percentage
  const dominantDisasterPercentage = disasterPercentages[dominantDisaster] || 0;
  
  // Calculate second most dominant disaster if available
  const secondDominantDisaster = sortedDisasters.length > 1 
    ? sortedDisasters[1]?.[0] 
    : null;
  const secondDominantDisasterPercentage = secondDominantDisaster 
    ? disasterPercentages[secondDominantDisaster] 
    : 0;

  // Calculate average model confidence with safety checks
  const totalConfidence = Array.isArray(sentimentPosts) 
    ? sentimentPosts.reduce((sum: number, post: SentimentPost) => sum + (post.confidence || 0), 0)
    : 0;
  const modelConfidence = Array.isArray(sentimentPosts) && sentimentPosts.length > 0 
    ? totalConfidence / sentimentPosts.length 
    : 0;

  return (
    <DisasterContext.Provider
      value={{
        sentimentPosts,
        disasterEvents,
        analyzedFiles,
        isLoadingSentimentPosts,
        isLoadingDisasterEvents,
        isLoadingAnalyzedFiles,
        isUploading,
        uploadProgress,
        errorSentimentPosts: errorSentimentPosts as Error | null,
        errorDisasterEvents: errorDisasterEvents as Error | null,
        errorAnalyzedFiles: errorAnalyzedFiles as Error | null,
        activeDiastersCount,
        analyzedPostsCount,
        dominantSentiment,
        dominantDisaster,
        modelConfidence,
        // Sentiment statistics
        dominantSentimentPercentage,
        secondDominantSentiment,
        secondDominantSentimentPercentage,
        sentimentPercentages,
        // Disaster statistics
        dominantDisasterPercentage,
        secondDominantDisaster,
        secondDominantDisasterPercentage,
        disasterPercentages,
        // Filters
        selectedDisasterType,
        setSelectedDisasterType,
        setIsUploading,
        setUploadProgress,
        refreshData
      }}
    >
      {children}
    </DisasterContext.Provider>
  );
}

export function useDisasterContext() {
  const context = useContext(DisasterContext);
  if (context === undefined) {
    throw new Error("useDisasterContext must be used within a DisasterContextProvider");
  }
  return context;
}