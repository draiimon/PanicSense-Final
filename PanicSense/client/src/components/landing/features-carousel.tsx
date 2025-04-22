import React, { useCallback, useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { BarChart3, AlertTriangle, MapPin, BellRing, Clock, Database, Info, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FeaturesCarousel = () => {
  const features = [
    {
      title: "Sentiment Analysis",
      description: "Automatically detect emotions and sentiment in disaster-related text using advanced processing models.",
      icon: <BarChart3 />,
      color: "blue",
      delay: 0
    },
    {
      title: "Disaster Classification",
      description: "Automatically identify and classify different types of disasters and emergencies.",
      icon: <AlertTriangle />,
      color: "red",
      delay: 0.1
    },
    {
      title: "Geographic Mapping",
      description: "Visual representation of disaster locations plotted on interactive maps.",
      icon: <MapPin />,
      color: "green",
      delay: 0.2
    },
    {
      title: "News Monitoring",
      description: "Real-time news articles with enhanced image loading and improved UI consistency.",
      icon: <BellRing />,
      color: "cyan",
      delay: 0.3
    },
    {
      title: "Real-time Monitoring",
      description: "Live monitoring of disaster reports from various sources for immediate response.",
      icon: <Clock />,
      color: "purple",
      delay: 0.4
    },
    {
      title: "Secure Data Storage",
      description: "Secure and scalable storage of disaster data with advanced search capabilities.",
      icon: <Database />,
      color: "orange",
      delay: 0.5
    },
    {
      title: "Multilingual Support",
      description: "Support for Filipino, English, and other regional languages used in the Philippines.",
      icon: <Info />,
      color: "indigo",
      delay: 0.6
    }
  ];

  // Combined feature array for seamless looping
  const loopedFeatures = [...features, ...features, ...features];
  
  const [isPaused, setIsPaused] = useState(false);
  const autoplayInterval = 2000; // Auto-scroll every 2 seconds

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    dragFree: true,
    containScroll: false
  });
  
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Automatic scrolling with useEffect
  useEffect(() => {
    if (!emblaApi || isPaused) return;
    
    const intervalId = setInterval(() => {
      scrollNext();
    }, autoplayInterval);
    
    return () => clearInterval(intervalId);
  }, [emblaApi, isPaused, scrollNext, autoplayInterval]);

  return (
    <div 
      className="relative mb-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex gap-6 py-4 cursor-grab active:cursor-grabbing ticker-scroll">
          {loopedFeatures.map((feature, index) => (
            <div key={`feature-${index}`} className="flex-[0_0_320px] min-w-0 md:flex-[0_0_400px]">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * (index % features.length), duration: 0.5 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group h-full"
              >
                <Card className="border-0 h-full shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-${feature.color}-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                  
                  <CardHeader className="pb-2">
                    <div className={`p-3 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300 text-${feature.color}-600 dark:text-${feature.color}-400`}>
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                    
                    <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Learn more</span>
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Removed left and right indicators as requested */}
      
      <div className="absolute -z-10 -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-gradient-to-r from-blue-300/20 via-purple-300/20 to-pink-300/20 blur-3xl"></div>
    </div>
  );
};

export default FeaturesCarousel;