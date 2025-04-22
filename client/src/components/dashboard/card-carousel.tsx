import { ReactNode, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CardCarouselProps {
  children: ReactNode[];
  autoRotate?: boolean;
  interval?: number;
  showControls?: boolean;
  className?: string;
}

export function CardCarousel({
  children,
  autoRotate = true,
  interval = 8000,
  showControls = true,
  className = '',
}: CardCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const totalSlides = children.length;
  
  // Navigation functions
  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % totalSlides);
  };
  
  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + totalSlides) % totalSlides);
  };
  
  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };
  
  // Auto-rotation
  useEffect(() => {
    if (!autoRotate || isPaused || totalSlides <= 1) return;
    
    const carouselElement = document.querySelector('.card-carousel');
    const shouldAutoRotate = carouselElement?.getAttribute('data-auto-rotate') !== 'false';
    
    if (!shouldAutoRotate) return;
    
    const timer = setInterval(() => {
      goToNext();
    }, interval);
    
    return () => clearInterval(timer);
  }, [autoRotate, isPaused, interval, totalSlides]);
  
  if (totalSlides === 0) return null;
  if (totalSlides === 1) return <>{children[0]}</>;
  
  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children[activeIndex]}
        </motion.div>
      </AnimatePresence>
      
      {showControls && totalSlides > 1 && (
        <>
          {/* Carousel Controls */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeIndex
                    ? 'bg-blue-600 w-4' // All active pagination dots are blue
                    : 'bg-blue-300/40 hover:bg-blue-400/50' // Now inactive dots are also blue
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Previous/Next buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 -translate-y-1/2 left-2 rounded-full w-8 h-8 bg-white/80 hover:bg-white shadow-md z-10"
            onClick={goToPrevious}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 -translate-y-1/2 right-2 rounded-full w-8 h-8 bg-white/80 hover:bg-white shadow-md z-10"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}