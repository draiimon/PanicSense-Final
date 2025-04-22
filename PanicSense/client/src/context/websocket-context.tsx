import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any | null;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {}
});

export function useWebSocket() {
  return useContext(WebSocketContext);
}

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    // Connection opened
    ws.addEventListener('open', () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    });

    // Listen for messages with priority handling for completion events
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 WebSocket message received:', data.type);
        
        // ⭐ Special handling for upload complete messages - highest priority message type
        if (data.type === 'UPLOAD_COMPLETE') {
          console.log('🌟 UPLOAD_COMPLETE WebSocket message received - HIGHEST PRIORITY!');
          
          // Protect against race conditions by checking if we've handled this completion recently
          const lastCompletionTime = parseInt(localStorage.getItem('uploadCompletedTimestamp') || '0');
          const now = Date.now();
          const completionTimeThreshold = 10000; // 10 seconds
          
          // Only process if we haven't seen a completion event recently
          if (now - lastCompletionTime > completionTimeThreshold) {
            console.log('💥 Processing new completion event from WebSocket');
            
            // Save completion state to localStorage for all tabs with current timestamp
            localStorage.setItem('uploadCompleted', 'true');
            localStorage.setItem('uploadCompletedTimestamp', now.toString());
            
            // ⭐⭐⭐ TRIPLE REDUNDANCY APPROACH ⭐⭐⭐
            // 1. Use the regular upload status channel 
            // 2. Use the dedicated completion channel
            // 3. Set the direct localStorage flags
            
            // Force a broadcast to all tabs via the BroadcastChannel API (method 1)
            try {
              const bc = new BroadcastChannel('upload_status');
              bc.postMessage({
                type: 'upload_complete',
                progress: {
                  ...data.progress,
                  processed: data.progress?.total || 10, // Force to 100%
                  stage: 'Analysis complete',           // Force standard completion stage
                  isComplete: true,                    // Add explicit flag
                  source: 'websocket'                 // Track the source
                },
                timestamp: now,
                source: 'websocket'
              });
              
              // Also use the dedicated completion channel (method 2)
              const cc = new BroadcastChannel('upload_completion');
              cc.postMessage({
                type: 'analysis_complete',
                timestamp: now,
                source: 'websocket'
              });
              
              // Close the channels after sending
              setTimeout(() => {
                try { bc.close(); } catch (e) { /* ignore */ }
                try { cc.close(); } catch (e) { /* ignore */ }
              }, 500);
            } catch (e) {
              console.error('Error broadcasting completion via BroadcastChannel:', e);
            }
            
            // Clear any upload state after a delay (but not too soon)
            setTimeout(() => {
              // Force an additional broadcast just before we clean up
              try {
                const bc = new BroadcastChannel('upload_status');
                bc.postMessage({
                  type: 'upload_finished', 
                  timestamp: Date.now(),
                  source: 'websocket_cleanup'
                });
                setTimeout(() => {
                  try { bc.close(); } catch (e) { /* ignore */ }
                }, 200);
              } catch (e) { /* ignore */ }
              
              // Only clear if we're still the most recent completion event
              // This prevents a race condition where a newer completion
              // is interrupted by an older timeout
              const currentCompletionTime = parseInt(localStorage.getItem('uploadCompletedTimestamp') || '0');
              if (currentCompletionTime === now) {
                localStorage.removeItem('isUploading');
                localStorage.removeItem('uploadProgress');
                localStorage.removeItem('uploadSessionId');
              }
            }, 3000);
          } else {
            console.log('🔄 Ignoring duplicate completion event - already handled within the last 10s');
          }
        }
        
        // Still update the context state for other components
        setLastMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    // Connection closed
    ws.addEventListener('close', () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    });

    // Store socket instance
    setSocket(ws);

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, []);

  // Send message function
  const sendMessage = useCallback((message: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}
