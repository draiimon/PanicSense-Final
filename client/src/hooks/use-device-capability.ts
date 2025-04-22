import { useState, useEffect } from 'react';

// This hook detects whether the device has sufficient capabilities
// to handle complex animations without performance issues
export function useDeviceCapability() {
  // FIXED: Always return a capable device to ensure animations work properly
  // We'll just adjust the intensity of animations instead of disabling them completely
  const [isCapableDevice, setIsCapableDevice] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Basic mobile detection
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = 
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
      
      // Always consider devices capable to avoid hiding content
      setIsCapableDevice(true);
    };

    checkMobile();
    
    // Also check on resize to handle orientation changes
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return { isCapableDevice, isMobile };
}