import React, { useState, useEffect } from 'react';
import { useTutorial } from '@/context/tutorial-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, HelpCircle, Upload, BarChart3, Database, LineChart, Clock, Globe } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  element: string; // ID of the element to highlight
  position: 'top' | 'right' | 'bottom' | 'left';
  icon: React.ReactNode;
}

interface TutorialGuideProps {
  onClose: () => void;
  onComplete: () => void;
}

export const TutorialGuide: React.FC<TutorialGuideProps> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  // Define all tutorial steps
  const tutorialSteps: TutorialStep[] = [
    {
      title: 'Welcome to PanicSensePH',
      description: 'This quick guide will help you navigate through the dashboard. Click "Next" to begin the tour.',
      element: 'dashboard-main', // Main dashboard container
      position: 'top',
      icon: <HelpCircle className="h-5 w-5 text-blue-500" />
    },
    {
      title: 'Upload Data',
      description: 'Upload CSV files with social media posts to analyze sentiment patterns during disaster events.',
      element: 'upload-data-section', // File uploader component
      position: 'bottom',
      icon: <Upload className="h-5 w-5 text-purple-500" />
    },
    {
      title: 'Sentiment Dashboard',
      description: 'View aggregated sentiment analysis across all processed data. Monitor emotion trends during disaster events.',
      element: 'sentiment-stats', // Sentiment statistics card
      position: 'right',
      icon: <BarChart3 className="h-5 w-5 text-green-500" />
    },
    {
      title: 'Raw Data Access',
      description: 'Access and search through all processed posts with their sentiment classifications.',
      element: 'recent-posts', // Recent posts table
      position: 'top',
      icon: <Database className="h-5 w-5 text-amber-500" />
    },
    {
      title: 'Geographic Analysis',
      description: 'Visualize sentiment distribution across geographic locations to identify affected areas.',
      element: 'affected-areas', // Map or geographic visualization
      position: 'left',
      icon: <Globe className="h-5 w-5 text-indigo-500" />
    },
    {
      title: 'Timeline Analysis',
      description: 'Analyze how sentiment changes over time during disaster events.',
      element: 'timeline-link', // Timeline section or link
      position: 'bottom',
      icon: <Clock className="h-5 w-5 text-rose-500" />
    },
    {
      title: 'Comparative Analysis',
      description: 'Compare different disaster events or time periods to identify patterns.',
      element: 'comparison-link', // Comparison section or link
      position: 'bottom',
      icon: <LineChart className="h-5 w-5 text-cyan-500" />
    }
  ];
  
  // Find the target element based on step
  useEffect(() => {
    if (currentStep >= 0 && currentStep < tutorialSteps.length) {
      const step = tutorialSteps[currentStep];
      const element = document.getElementById(step.element);
      
      if (element) {
        setTargetElement(element);
        
        // Calculate position for the tooltip
        const rect = element.getBoundingClientRect();
        const position = calculateTooltipPosition(rect, step.position);
        setTooltipPosition(position);
        
        // Scroll the element into view with a smooth animation
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight class to the target element
        element.classList.add('tutorial-highlight');
        
        return () => {
          element.classList.remove('tutorial-highlight');
        };
      } else {
        // If element doesn't exist, use a fallback position
        setTargetElement(null);
        setTooltipPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2
        });
      }
    }
  }, [currentStep, tutorialSteps]);
  
  // Calculate the tooltip position based on the element's rect and desired position
  const calculateTooltipPosition = (rect: DOMRect, position: 'top' | 'right' | 'bottom' | 'left') => {
    // Adjust tooltip size based on screen size for better mobile experience
    const isMobile = window.innerWidth < 640;
    const tooltipWidth = isMobile ? window.innerWidth * 0.85 : 320; // Responsive width
    const tooltipHeight = isMobile ? window.innerHeight * 0.4 : 200; // Responsive height
    const spacing = isMobile ? 8 : 16; // Reduced spacing on mobile
    
    switch (position) {
      case 'top':
        return {
          top: rect.top - tooltipHeight - spacing,
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
        };
      case 'right':
        return {
          top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
          left: rect.right + spacing
        };
      case 'bottom':
        return {
          top: rect.bottom + spacing,
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
        };
      case 'left':
        return {
          top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
          left: rect.left - tooltipWidth - spacing
        };
      default:
        return {
          top: rect.bottom + spacing,
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
        };
    }
  };
  
  // Navigation functions
  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const goToNextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step completed
      onComplete();
    }
  };
  
  // Ensure tutorial stays within viewport
  useEffect(() => {
    const adjustTooltipPosition = () => {
      if (!tooltipPosition) return;
      
      let { top, left } = tooltipPosition;
      
      // Adjust tooltip size based on screen size for better mobile experience
      const isMobile = window.innerWidth < 640;
      const tooltipWidth = isMobile ? window.innerWidth * 0.85 : 320;
      const tooltipHeight = isMobile ? window.innerHeight * 0.4 : 200;
      const padding = isMobile ? 8 : 16;
      
      // For mobile screens, use fixed positioning from bottom to ensure buttons are always visible
      if (isMobile) {
        // Center horizontally
        left = (window.innerWidth - tooltipWidth) / 2;
        
        // ALWAYS position from top part of screen on mobile for better visibility 
        // and to ensure buttons are visible
        top = 120; // Fixed position from top to ensure it's below the header but visible
      } else {
        // Desktop adjustments
        // Check right boundary
        if (left + tooltipWidth > window.innerWidth) {
          left = window.innerWidth - tooltipWidth - padding;
        }
        
        // Check left boundary
        if (left < padding) {
          left = padding;
        }
        
        // Check bottom boundary
        if (top + tooltipHeight > window.innerHeight) {
          top = window.innerHeight - tooltipHeight - padding;
        }
        
        // Check top boundary
        if (top < padding) {
          top = padding;
        }
      }
      
      if (top !== tooltipPosition.top || left !== tooltipPosition.left) {
        setTooltipPosition({ top, left });
      }
    };
    
    adjustTooltipPosition();
    window.addEventListener('resize', adjustTooltipPosition);
    
    return () => {
      window.removeEventListener('resize', adjustTooltipPosition);
    };
  }, [tooltipPosition]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNextStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevStep();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep, onClose]);
  
  if (currentStep < 0 || currentStep >= tutorialSteps.length) {
    return null;
  }
  
  const currentTutorialStep = tutorialSteps[currentStep];
  
  return (
    <AnimatePresence>
      {/* Tutorial overlay to dim the background */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]" />
      
      {/* Tutorial tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="fixed z-[1001] w-[92vw] sm:w-80 max-w-[92vw] sm:max-w-md bg-white rounded-lg shadow-xl"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: window.innerWidth < 640 ? 'translate(-50%, 0)' : 'none', // Center on mobile
          margin: '0 auto',
        }}
      >
        {/* Tooltip header - Improved for mobile */}
        <div className="flex items-center justify-between bg-blue-600 text-white p-2 sm:p-4 rounded-t-lg">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex-shrink-0">
              {currentTutorialStep.icon}
            </div>
            <h3 className="font-bold text-sm sm:text-lg truncate max-w-[180px] sm:max-w-[230px]">{currentTutorialStep.title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-white transition-colors p-1"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        
        {/* Tooltip body - Better mobile spacing */}
        <div className="p-3 sm:p-4">
          <p className="text-gray-900 dark:text-gray-100 text-sm sm:text-base mb-3 sm:mb-4 font-medium leading-relaxed">{currentTutorialStep.description}</p>
          
          {/* Progress indicators */}
          <div className="flex justify-center gap-1 mb-3 sm:mb-4">
            {tutorialSteps.map((_, index) => (
              <div 
                key={index}
                className={`h-1 sm:h-1.5 rounded-full ${
                  index === currentStep ? 'w-3 sm:w-4 bg-blue-600' : 'w-1.5 sm:w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {/* Navigation buttons - Enhanced for mobile */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={goToPrevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 text-sm sm:text-base"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Back</span>
              <span className="inline sm:hidden">Prev</span>
            </Button>
            
            <Button
              onClick={goToNextStep}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 text-sm sm:text-base"
            >
              {currentStep < tutorialSteps.length - 1 ? (
                <>
                  <span className="hidden sm:inline">Next</span>
                  <span className="inline sm:hidden">Next</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </>
              ) : (
                'Finish'
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};