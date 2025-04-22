import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, FileText, BarChart3, AlertTriangle, MapPin, Clock, Database, ArrowRight, Info, ExternalLink, Shield, Users, BellRing, Star, Award, Heart, Globe, Activity, Check, Sparkles, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FeaturesCarousel from '@/components/landing/features-carousel';

// Import tutorial images directly
import uploadDataImg from '../assets/upload-disaster-data.png';
import analyzeSentimentImg from '../assets/analyze-sentiment.png';
import geographicAnalysisImg from '../assets/geographic-analysis.png';
import realTimeMonitoringImg from '../assets/real-time-monitoring.png';

// Create a twinkling stars effect
const TwinklingStars = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 50 }).map((_, i) => {
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const delay = Math.random() * 10;
        const size = Math.random() * 3 + 1;
        const duration = Math.random() * 4 + 3;
        
        return (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkling ${duration}s infinite ${delay}s`
            }}
          />
        );
      })}
    </div>
  );
};

// Interactive Philippines Map Animation
const AnimatedMap = () => {
  return (
    <div className="absolute inset-0 w-full h-full opacity-20 pointer-events-none overflow-hidden">
      {/* Philippines map outline */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <svg viewBox="0 0 800 800" width="1200" height="1200" className="opacity-30">
          <path 
            d="M400,120 C420,160 500,140 520,170 C540,200 550,250 530,270 C510,290 490,320 500,350 C510,380 540,400 520,430 C500,460 480,480 450,500 C420,520 400,550 380,540 C360,530 340,490 320,480 C300,470 280,450 270,420 C260,390 240,370 250,340 C260,310 280,280 310,260 C340,240 350,200 380,170 C410,140 380,80 400,120 Z" 
            fill="none" 
            stroke="url(#philippinesGradient)" 
            strokeWidth="6"
            className="animate-pulse-slow"
          />
          
          {/* Islands and regions */}
          <path 
            d="M350,140 C360,150 380,130 390,150 C400,170 380,190 370,180 C360,170 340,130 350,140 Z" 
            fill="rgba(59, 130, 246, 0.3)" 
            stroke="rgba(59, 130, 246, 0.8)" 
            strokeWidth="2"
            className="animate-float-1"
          />
          
          <path 
            d="M420,220 C430,210 450,220 460,230 C470,240 480,260 470,270 C460,280 440,270 430,260 C420,250 410,230 420,220 Z" 
            fill="rgba(99, 102, 241, 0.3)" 
            stroke="rgba(99, 102, 241, 0.8)" 
            strokeWidth="2"
            className="animate-float-2"
          />
          
          <path 
            d="M380,300 C400,290 420,310 430,330 C440,350 430,380 410,390 C390,400 370,380 360,360 C350,340 360,310 380,300 Z" 
            fill="rgba(79, 70, 229, 0.3)" 
            stroke="rgba(79, 70, 229, 0.8)" 
            strokeWidth="2"
            className="animate-float-3"
          />
          
          <path 
            d="M330,400 C340,380 370,390 380,410 C390,430 380,460 360,470 C340,480 310,470 300,450 C290,430 320,420 330,400 Z" 
            fill="rgba(147, 51, 234, 0.3)" 
            stroke="rgba(147, 51, 234, 0.8)" 
            strokeWidth="2"
            className="animate-float-4"
          />
          
          {/* Connection lines between islands */}
          <g className="connection-lines">
            <path 
              d="M370,170 C390,210 410,250 400,280" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.3)" 
              strokeWidth="1" 
              strokeDasharray="5,5"
              className="animate-dash"
            />
            
            <path 
              d="M440,240 C430,270 410,300 390,320" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.3)" 
              strokeWidth="1" 
              strokeDasharray="5,5"
              className="animate-dash-reverse"
            />
            
            <path 
              d="M380,350 C360,380 340,410 330,430" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.3)" 
              strokeWidth="1" 
              strokeDasharray="5,5"
              className="animate-dash"
            />
          </g>
          
          {/* Pulse locations (disaster areas) */}
          <circle cx="370" cy="170" r="8" fill="rgba(239, 68, 68, 0.7)" className="animate-ping-slow" />
          <circle cx="440" cy="240" r="6" fill="rgba(245, 158, 11, 0.7)" className="animate-ping-slow delay-300" />
          <circle cx="380" cy="350" r="7" fill="rgba(59, 130, 246, 0.7)" className="animate-ping-slow delay-600" />
          <circle cx="330" cy="430" r="5" fill="rgba(139, 92, 246, 0.7)" className="animate-ping-slow delay-900" />
          
          {/* Data flow animations */}
          <g className="data-flow">
            <path 
              d="M370,170 Q420,200 440,240" 
              fill="none" 
              stroke="url(#dataFlow1)" 
              strokeWidth="2" 
              className="animate-data-flow"
            />
            
            <path 
              d="M440,240 Q410,290 380,350" 
              fill="none" 
              stroke="url(#dataFlow2)" 
              strokeWidth="2" 
              className="animate-data-flow delay-300"
            />
            
            <path 
              d="M380,350 Q355,390 330,430" 
              fill="none" 
              stroke="url(#dataFlow3)" 
              strokeWidth="2" 
              className="animate-data-flow delay-600"
            />
          </g>
          
          {/* Gradients for various elements */}
          <defs>
            <linearGradient id="philippinesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
            
            <linearGradient id="dataFlow1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb">
                <animate attributeName="offset" from="-1" to="1" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent">
                <animate attributeName="offset" from="0" to="2" dur="3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            
            <linearGradient id="dataFlow2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed">
                <animate attributeName="offset" from="-1" to="1" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent">
                <animate attributeName="offset" from="0" to="2" dur="3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            
            <linearGradient id="dataFlow3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#db2777">
                <animate attributeName="offset" from="-1" to="1" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent">
                <animate attributeName="offset" from="0" to="2" dur="3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Grid overlay for the tech feeling */}
      <div className="absolute inset-0 bg-grid-pattern-white opacity-5"></div>
      
      {/* Floating data points */}
      <div className="absolute top-1/4 left-1/3 h-2 w-2 rounded-full bg-blue-500 shadow-glow-blue animate-float-1"></div>
      <div className="absolute top-1/3 right-1/4 h-3 w-3 rounded-full bg-indigo-500 shadow-glow-indigo animate-float-2"></div>
      <div className="absolute bottom-1/4 left-1/4 h-2 w-2 rounded-full bg-purple-500 shadow-glow-purple animate-float-3"></div>
      <div className="absolute bottom-1/3 right-1/3 h-2 w-2 rounded-full bg-cyan-500 shadow-glow-cyan animate-float-4"></div>
    </div>
  );
};

// Animated text effect
const AnimatedText = ({ 
  text, 
  className = "", 
  delay = 0 
}: { 
  text: string; 
  className?: string; 
  delay?: number 
}) => {
  const controls = useAnimation();
  
  useEffect(() => {
    controls.start(i => ({
      opacity: 1,
      y: 0,
      transition: { delay: delay + i * 0.05 }
    }));
  }, [controls, delay]);
  
  return (
    <span className={`inline-block ${className}`}>
      {text.split("").map((char: string, i: number) => (
        <motion.span
          key={i}
          custom={i}
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
};

// Floating elements effect
const FloatingElement = ({ 
  delay = 0, 
  duration = 3, 
  children, 
  className = "" 
}: { 
  delay?: number; 
  duration?: number; 
  children: React.ReactNode; 
  className?: string 
}) => {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{
        y: [0, -10, 0],
        transition: {
          delay,
          duration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Live Time Counter for video effect
const LiveTimeCounter = () => {
  const [time, setTime] = useState("00:00:00");
  
  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <span className="video-time-counter">{time}</span>
  );
};

// Philippines Map Component - More detailed
const PhilippinesMap = () => {
  return (
    <div className="relative w-full h-full">
      {/* Grid background */}
      <div className="absolute inset-0 bg-blue-50 grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(20,1fr)] opacity-50">
        {Array.from({ length: 400 }).map((_, i) => (
          <div key={i} className="border border-blue-100"></div>
        ))}
      </div>
      
      {/* Philippines Map Outline - More accurate */}
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Luzon */}
        <path 
          d="M220,80 C230,70 250,75 265,95 C280,115 295,130 290,150 C285,170 270,175 260,190 C250,205 260,220 255,235 C250,250 235,260 220,255 C205,250 195,235 200,220 C205,205 215,195 205,180 C195,165 180,170 185,155 C190,140 210,130 210,115 C210,100 210,90 220,80Z" 
          fill="rgba(59, 130, 246, 0.15)" 
          stroke="rgba(59, 130, 246, 0.8)" 
          strokeWidth="2"
        />
        
        {/* Visayas Islands */}
        <path 
          d="M290,200 C300,195 310,205 315,215 C320,225 315,235 305,240 C295,245 285,240 280,230 C275,220 280,205 290,200Z" 
          fill="rgba(99, 102, 241, 0.15)" 
          stroke="rgba(99, 102, 241, 0.8)" 
          strokeWidth="1.5"
        />
        
        <path 
          d="M320,230 C330,225 340,230 345,240 C350,250 345,265 335,270 C325,275 315,270 310,260 C305,250 310,235 320,230Z" 
          fill="rgba(99, 102, 241, 0.15)" 
          stroke="rgba(99, 102, 241, 0.8)" 
          strokeWidth="1.5"
        />
        
        <path 
          d="M270,240 C280,235 290,245 295,255 C300,265 295,280 285,285 C275,290 265,280 260,270 C255,260 260,245 270,240Z" 
          fill="rgba(99, 102, 241, 0.15)" 
          stroke="rgba(99, 102, 241, 0.8)" 
          strokeWidth="1.5"
        />
        
        {/* Mindanao */}
        <path 
          d="M300,290 C320,280 340,290 350,310 C360,330 355,350 340,365 C325,380 305,385 285,375 C265,365 255,345 265,325 C275,305 290,295 300,290Z" 
          fill="rgba(79, 70, 229, 0.15)" 
          stroke="rgba(79, 70, 229, 0.8)" 
          strokeWidth="2"
        />
        
        {/* Disaster Points */}
        <circle cx="235" cy="140" r="5" fill="rgba(239, 68, 68, 0.7)" className="animate-ping-slow" />
        <circle cx="320" cy="235" r="5" fill="rgba(245, 158, 11, 0.7)" className="animate-ping-slow delay-500" />
        <circle cx="310" cy="330" r="5" fill="rgba(139, 92, 246, 0.7)" className="animate-ping-slow delay-1000" />
        
        {/* Data Flow Lines */}
        <path 
          d="M235,140 Q270,170 320,235" 
          stroke="rgba(59, 130, 246, 0.5)" 
          strokeWidth="1" 
          strokeDasharray="3,3"
          className="animate-dash" 
        />
        
        <path 
          d="M320,235 Q315,280 310,330" 
          stroke="rgba(99, 102, 241, 0.5)" 
          strokeWidth="1" 
          strokeDasharray="3,3"
          className="animate-dash-reverse" 
        />
      </svg>
      
      {/* Radar Scan Effect */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-[200px] h-[200px] border-2 border-blue-400/30 rounded-full animate-ping-slow"></div>
        <div className="w-[100px] h-[100px] border border-blue-500/50 rounded-full animate-ping-slow delay-700"></div>
      </div>
      
      {/* Data points */}
      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
      <div className="absolute top-2/4 right-1/4 w-3 h-3 bg-orange-500 rounded-full animate-ping delay-300"></div>
      <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-purple-500 rounded-full animate-ping delay-700"></div>
    </div>
  );
};

// Interactive Tutorial Component with better animations
const Tutorial = ({ onClose }: { onClose: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 500 : -500,
      opacity: 0
    })
  };
  
  const steps = [
    {
      title: "Upload Disaster Data",
      description: "Upload CSV files containing social media posts or messages about disasters to begin analysis.",
      icon: <FileText size={24} />,
      image: uploadDataImg
    },
    {
      title: "Analyze Sentiment",
      description: "The system automatically analyzes emotions and classifies each message using advanced AI models.",
      icon: <BarChart3 size={24} />,
      image: analyzeSentimentImg
    },
    {
      title: "Geographic Analysis",
      description: "View disaster locations plotted on interactive maps to identify affected areas.",
      icon: <MapPin size={24} />,
      image: geographicAnalysisImg
    },
    {
      title: "Real-time Monitoring",
      description: "Monitor new disaster reports in real-time for faster emergency response and coordination.",
      icon: <Clock size={24} />,
      image: realTimeMonitoringImg
    }
  ];
  
  const nextStep = () => {
    setDirection(1);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };
  
  const prevStep = () => {
    setDirection(-1);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-3xl lg:max-w-5xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1">
          <div 
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        {/* Responsive layout - Single column for mobile, dual column for desktop */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-4 md:p-6 lg:p-8">          
          <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start mt-1 mb-4 px-2">
            {steps.map((_, index) => {
              // Randomize position styling for each number (for mobile)
              const positionClasses = [
                "self-start", // Top position
                "self-center", // Center position
                "self-end",    // Bottom position
                "mt-3"         // Different top margin
              ];
              const randomPosition = positionClasses[index % positionClasses.length];
              
              return (
                <motion.div 
                  key={index}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ 
                    scale: currentStep === index ? 1.2 : 0.85,
                    opacity: currentStep === index ? 1 : 0.5
                  }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setDirection(index > currentStep ? 1 : -1);
                    setCurrentStep(index);
                  }}
                  className={`flex items-center justify-center rounded-full w-8 h-8 md:w-10 md:h-10 cursor-pointer transition-all ${randomPosition} md:self-auto ${
                    currentStep === index 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-lg md:shadow-xl' 
                      : 'bg-white/20 text-white/70 hover:bg-white/30'
                  }`}
                >
                  <span className="text-sm md:text-base">{index + 1}</span>
                </motion.div>
              );
            })}
          </div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start md:gap-8 lg:gap-12">
            {/* Tutorial Image - Column 1 - WIDER but with good height too */}
            <div 
              className="tutorial-image-container slide-up-animation w-full max-w-[300px] md:max-w-[450px] lg:max-w-[500px] mx-auto md:mx-0 md:aspect-[4/3] overflow-hidden"
            >
              <div className="tutorial-dynamic-content h-full">
                <img 
                  src={steps[currentStep].image} 
                  alt={steps[currentStep].title} 
                  className="tutorial-image object-contain w-full h-[350px] rounded-lg shadow-lg"
                />
              </div>
            </div>
            
            {/* Tutorial Content - Column 2 */}
            <div className="text-white p-4 md:p-0 max-w-lg md:ml-8 mt-4 md:mt-0">
              <motion.div 
                key={`step-${currentStep}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-lg">
                    {steps[currentStep].icon}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold">{steps[currentStep].title}</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-white/90 text-lg">{steps[currentStep].description}</p>
                  
                  <div className="space-y-3 mt-6">
                    {/* Step Information */}
                    <div className="space-y-2">
                      {currentStep === 0 && (
                        <>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-300" />
                            <p className="text-white/80">Upload single or batch CSV files</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-300" />
                            <p className="text-white/80">Supports multiple languages including Filipino and English</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-300" />
                            <p className="text-white/80">Automatic source detection (Twitter, Facebook, etc.)</p>
                          </div>
                        </>
                      )}
                      
                      {currentStep === 1 && (
                        <>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-300" />
                            <p className="text-white/80">Advanced emotion detection (Panic, Fear/Anxiety, Disbelief)</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-300" />
                            <p className="text-white/80">AI-powered disaster type classification</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-300" />
                            <p className="text-white/80">Confidence scoring for each analysis</p>
                          </div>
                        </>
                      )}
                      
                      {currentStep === 2 && (
                        <>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-300" />
                            <p className="text-white/80">Interactive mapping of disaster locations</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-300" />
                            <p className="text-white/80">Location clustering for multiple reports</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-300" />
                            <p className="text-white/80">Regional sentiment heatmaps</p>
                          </div>
                        </>
                      )}
                      
                      {currentStep === 3 && (
                        <>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-300" />
                            <p className="text-white/80">Live monitoring dashboard with real-time updates</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-300" />
                            <p className="text-white/80">Smart alerting for critical situations</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-300" />
                            <p className="text-white/80">Timeline view of disaster progression</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <div className="mt-8 flex justify-between items-center">
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {currentStep > 0 ? (
                    <Button 
                      onClick={prevStep}
                      className="relative overflow-hidden bg-gradient-to-r from-white/20 to-white/5 border-0 backdrop-blur-md text-white hover:from-white/30 hover:to-white/10 px-6 rounded-full font-medium shadow-lg group"
                    >
                      <span className="relative z-10 flex items-center">
                        <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Previous
                      </span>
                      <span className="absolute inset-0 overflow-hidden rounded-full">
                        <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      </span>
                    </Button>
                  ) : (
                    <div className="w-28"></div>
                  )}
                </motion.div>
                
                {/* Step indicators */}
                <div className="flex space-x-1.5">
                  {steps.map((_, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => {
                        setDirection(idx > currentStep ? 1 : -1);
                        setCurrentStep(idx);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentStep 
                          ? 'w-6 bg-white shadow-glow-white' 
                          : 'w-1.5 bg-white/40 hover:bg-white/60'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label={`Go to step ${idx + 1}`}
                    />
                  ))}
                </div>
                
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Button 
                    onClick={nextStep}
                    className={`relative overflow-hidden px-8 py-2.5 rounded-full font-medium shadow-lg group ${
                      currentStep === steps.length - 1
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white'
                        : 'bg-white text-indigo-600 hover:text-indigo-800'
                    }`}
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                    <span className="relative z-10 flex items-center font-bold">
                      {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                      {currentStep !== steps.length - 1 && 
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      }
                      {currentStep === steps.length - 1 && (
                        <Sparkles className="ml-2 h-4 w-4 animate-pulse" />
                      )}
                    </span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Update notification banner component
const UpdateNotification = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed top-20 right-5 z-50 w-80 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-xl overflow-hidden transform transition-all duration-500 animate-fade-in-down">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-300 animate-pulse"></div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-white mr-2" />
            <h3 className="text-white font-semibold">April 2025 Updates</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 text-white/90 text-sm space-y-1">
          <p className="flex items-center"><Check className="h-3 w-3 mr-1.5 text-cyan-300" /> Fixed news image loading issues</p>
          <p className="flex items-center"><Check className="h-3 w-3 mr-1.5 text-cyan-300" /> Enhanced UI consistency across all pages</p>
          <p className="flex items-center"><Check className="h-3 w-3 mr-1.5 text-cyan-300" /> Added Newspaper icon for News section</p>
          <p className="flex items-center"><Check className="h-3 w-3 mr-1.5 text-cyan-300" /> Optimized Render.com deployment</p>
          <p className="flex items-center"><Check className="h-3 w-3 mr-1.5 text-cyan-300" /> Cleaned up codebase and removed duplicates</p>
        </div>
        <div className="mt-3 flex justify-end">
          <Link href="/dashboard" className="text-xs bg-white/20 hover:bg-white/30 text-white rounded px-2 py-1 inline-flex items-center">
            Check it out <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [activeFeature, setActiveFeature] = useState<'monitoring' | 'geographic' | 'analytics'>('monitoring');
  const parallaxRef = useRef<HTMLDivElement>(null);
  
  // Auto-dismiss update notification after 12 seconds
  useEffect(() => {
    if (showUpdateNotification) {
      const timer = setTimeout(() => {
        setShowUpdateNotification(false);
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [showUpdateNotification]);
  
  // Auto-rotate feature cards
  useEffect(() => {
    const features: ('monitoring' | 'geographic' | 'analytics')[] = ['monitoring', 'geographic', 'analytics'];
    let currentIndex = 0;
    
    // Initial delay before starting rotation
    const initialTimeout = setTimeout(() => {
      // Set up interval for continuous rotation
      const intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % features.length;
        setActiveFeature(features[currentIndex]);
      }, 5000); // Switch every 5 seconds
      
      return () => clearInterval(intervalId);
    }, 4000); // Wait 4 seconds before first switch
    
    return () => clearTimeout(initialTimeout);
  }, []);
  
  // Parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!parallaxRef.current) return;
      
      const elements = parallaxRef.current.querySelectorAll('.parallax-element');
      
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      elements.forEach((el) => {
        const speed = parseFloat((el as HTMLElement).dataset.speed || '0');
        const moveX = (x - 0.5) * speed;
        const moveY = (y - 0.5) * speed;
        
        (el as HTMLElement).style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return (
    <div className="min-h-screen overflow-hidden bg-slate-50">
      {/* Show update notification */}
      <AnimatePresence>
        {showUpdateNotification && (
          <UpdateNotification onClose={() => setShowUpdateNotification(false)} />
        )}
      </AnimatePresence>
      
      {/* Header with same style as main pages */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-lg py-3 px-4">
        <div className="max-w-[2000px] mx-auto flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div className="relative w-11 h-11 sm:w-14 sm:h-14">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-indigo-600/30 to-purple-600/30 rounded-xl shadow-lg"
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                <img src="/favicon.png" alt="PanicSense PH Logo" className="w-7 h-7 sm:w-9 sm:h-9 drop-shadow" />
              </div>
            </div>
            
            <div>
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                PanicSense PH
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium">
                Real-time Disaster Analysis
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center space-x-4"
          >
            <Button 
              onClick={() => setShowTutorial(true)}
              className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all rounded-full px-5 py-2.5"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-30 -translate-x-full animate-shimmer"/>
              <span className="relative flex items-center">
                Tutorial
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </span>
            </Button>
          </motion.div>
        </div>
      </header>
      
      {/* Hero Section with Animated Background */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-slate-900 overflow-hidden">
          <TwinklingStars />
          
          {/* Background geometric elements */}
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-grid-dark-pattern opacity-[0.03] dark:opacity-[0.07]"></div>
          
          {/* Add the Philippines map animation */}
          <AnimatedMap />
          
          {/* Add more visual elements */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[800px] h-[800px] border-[1px] border-blue-400/10 rounded-full animate-spin-slow"></div>
            <div className="absolute w-[600px] h-[600px] border-[1px] border-indigo-500/10 rounded-full animate-spin-slower"></div>
            <div className="absolute w-[400px] h-[400px] border-[1px] border-purple-500/10 rounded-full animate-spin-reverse"></div>
          </div>
          
          {/* Animated floating bubbles */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
            animate={{ 
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ 
              repeat: Infinity,
              duration: 15,
              ease: "easeInOut" 
            }}
          />
          
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
            animate={{ 
              x: [0, -50, 0],
              y: [0, -30, 0]
            }}
            transition={{ 
              repeat: Infinity,
              duration: 18,
              ease: "easeInOut",
              delay: 1 
            }}
          />
          
          {/* New animated elements */}
          <motion.div 
            className="absolute top-1/3 right-1/3 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl"
            animate={{ 
              x: [0, -30, 0],
              y: [0, 20, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              repeat: Infinity,
              duration: 10,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          
          <motion.div 
            className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-pink-500/10 rounded-full blur-2xl"
            animate={{ 
              x: [0, 40, 0],
              y: [0, -25, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              repeat: Infinity,
              duration: 12,
              ease: "easeInOut",
              delay: 1.5
            }}
          />
          
          {/* Particle effects */}
          <div className="absolute inset-0">
            {Array.from({ length: 15 }).map((_, i) => {
              const size = Math.random() * 6 + 2;
              const top = Math.random() * 100;
              const left = Math.random() * 100;
              const delay = Math.random() * 5;
              const duration = Math.random() * 15 + 10;
              
              return (
                <motion.div 
                  key={i}
                  className="absolute rounded-full bg-white/50 shadow-glow z-0"
                  style={{ 
                    width: size, 
                    height: size, 
                    top: `${top}%`, 
                    left: `${left}%` 
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    y: [0, -100, 0],
                    x: [0, Math.random() * 50 - 25, 0],
                    scale: [0, 1, 0],
                    opacity: [0, 0.5, 0]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration,
                    delay,
                    ease: "easeInOut"
                  }}
                />
              );
            })}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10" ref={parallaxRef}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div 
                className="mb-6 inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge className="py-1.5 px-4 text-sm bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-800 dark:text-blue-300 shadow-sm">
                  <Star className="h-3.5 w-3.5 mr-1" />
                  Next-Gen Disaster Intelligence
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-none mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="block">Advanced Disaster</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500">
                  Monitoring & Analysis
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Real-time disaster monitoring for the Philippines using advanced NLP and sentiment analysis for faster emergency response and coordination.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.3 }
                  }}
                >
                  <Link href="/dashboard">
                    <Button 
                      size="lg"
                      className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-12 py-8 text-xl font-bold tracking-wide rounded-full"
                    >
                      <span className="relative flex items-center">
                        Get Started Now
                        <ArrowRight className="ml-3 h-5 w-5" />
                      </span>
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
              className="rounded-2xl shadow-2xl overflow-hidden relative border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-indigo-50 p-8"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10"></div>
              
              {/* Auto-transitioning Disaster Features Section - ENHANCED DESIGN */}
              <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 mb-6 h-[400px] relative overflow-hidden group">
                {/* Colorful glowing border */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-xl"></div>
                
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-grid-pattern-white opacity-5"></div>
                <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700"></div>
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all duration-700"></div>
                
                {/* Feature navigation indicators - Enhanced */}
                <div className="absolute top-3 right-3 flex space-x-3 z-20">
                  {['monitoring', 'geographic', 'analytics'].map((feature, index) => (
                    <button
                      key={feature}
                      onClick={() => setActiveFeature(feature as any)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        activeFeature === feature 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-400/30 scale-125' 
                          : 'bg-gray-300/70 backdrop-blur-sm hover:bg-gray-400 hover:scale-110'
                      }`}
                      aria-label={`Show ${feature} feature`}
                    />
                  ))}
                </div>
                
                <div className="absolute inset-0 overflow-hidden">
                  <AnimatePresence initial={false} mode="wait">
                    {/* FEATURE 1: Live Disaster Monitoring */}
                    {activeFeature === 'monitoring' && (
                      <motion.div 
                        key="live-monitoring"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 p-6"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-200 mr-3">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                              Live Disaster Monitoring
                              <span className="ml-3 text-xs font-medium px-2 py-0.5 bg-red-100 text-red-700 rounded-full animate-pulse">LIVE</span>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Real-time disaster intelligence for community resilience</p>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex flex-col h-[280px]">
                          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md p-3 border border-gray-100 dark:border-gray-700 mb-4">
                            <div className="mb-2 flex justify-between items-center">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Active Alerts</h4>
                              <span className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</span>
                            </div>
                            
                            <div className="space-y-3 max-h-[150px] overflow-auto hide-scrollbar">
                              {[
                                { event: "Typhoon Warning", location: "Northern Luzon", level: "High", time: "10m ago" },
                                { event: "Flash Flood", location: "Cagayan Valley", level: "Medium", time: "25m ago" },
                                { event: "Earthquake", location: "Bicol Region", level: "High", time: "45m ago" }
                              ].map((alert, i) => (
                                <motion.div 
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.1 + (i * 0.1) }}
                                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`h-3 w-3 rounded-full animate-pulse ${
                                      alert.level === "High" ? "bg-red-500" : 
                                      alert.level === "Medium" ? "bg-orange-500" : "bg-yellow-500"
                                    }`}></div>
                                    <div>
                                      <div className="text-sm font-medium">{alert.event}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">{alert.location}</div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <div className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">{alert.level}</div>
                                    <div className="text-xs text-gray-500 mt-1">{alert.time}</div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md p-3 border border-gray-100 dark:border-gray-700 flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Activity Monitor</h4>
                              <div className="flex items-center">
                                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                                <span className="text-xs text-gray-500">Recording</span>
                              </div>
                            </div>
                            
                            {/* Activity graph with animation */}
                            <div className="h-16 w-full relative mt-2">
                              <div className="absolute inset-0 flex items-end justify-between gap-[1px]">
                                {Array.from({ length: 40 }).map((_, i) => {
                                  const height = Math.floor(Math.random() * 70) + 30;
                                  return (
                                    <motion.div 
                                      key={i}
                                      initial={{ height: 0 }}
                                      animate={{ height: `${height}%` }}
                                      transition={{ 
                                        duration: 0.5, 
                                        delay: i * 0.02,
                                        ease: "easeOut" 
                                      }}
                                      className={`w-[2.4%] rounded-t ${
                                        height > 80 ? "bg-red-500" :
                                        height > 60 ? "bg-orange-500" :
                                        height > 40 ? "bg-yellow-500" : "bg-blue-500"
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Total Alerts</div>
                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">273</div>
                              </div>
                              <div className="bg-red-50 dark:bg-red-900/20 rounded p-2 text-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Critical Events</div>
                                <div className="text-lg font-bold text-red-600 dark:text-red-400">14</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* FEATURE 2: Geographic Analysis */}
                    {activeFeature === 'geographic' && (
                      <motion.div 
                        key="geographic-analysis"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 p-6"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 mr-3">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Geographic Analysis</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Interactive maps for visualizing disaster impact zones</p>
                          </div>
                        </div>
                        
                        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl overflow-hidden h-[280px] shadow-inner border border-blue-100 dark:border-blue-900/50 relative">
                          {/* Real Philippines map with disaster indicators */}
                          <div className="absolute inset-0">
                            <PhilippinesMap />
                          </div>
                          
                          {/* Map overlay with labels */}
                          <div className="absolute inset-0 pointer-events-none">
                            {/* Region labels */}
                            <div className="absolute top-[25%] left-[20%] bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-2 py-1 rounded text-xs shadow-sm">
                              Luzon
                            </div>
                            <div className="absolute top-[40%] right-[30%] bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-2 py-1 rounded text-xs shadow-sm">
                              Visayas
                            </div>
                            <div className="absolute bottom-[30%] left-[40%] bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-2 py-1 rounded text-xs shadow-sm">
                              Mindanao
                            </div>
                            
                            {/* Floating stats panel */}
                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700 w-[120px]">
                              <h5 className="text-xs font-semibold border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">Disaster Zones</h5>
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-xs">Severe</span>
                                  </div>
                                  <span className="text-xs font-semibold">3</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                    <span className="text-xs">Moderate</span>
                                  </div>
                                  <span className="text-xs font-semibold">7</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span className="text-xs">Minor</span>
                                  </div>
                                  <span className="text-xs font-semibold">12</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* FEATURE 3: Advanced Analytics */}
                    {activeFeature === 'analytics' && (
                      <motion.div 
                        key="advanced-analytics"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 p-6"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200 mr-3">
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Advanced Analytics</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Sentiment analysis with Filipino language processing</p>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex flex-col sm:flex-row gap-4 h-[280px]">
                          <div className="flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700">
                            <h4 className="text-sm font-semibold mb-4">Emotion Distribution</h4>
                            
                            <div className="h-[200px] flex items-end justify-between gap-3 px-2 pt-2">
                              {[
                                {label: "Panic", value: 35, color: "bg-red-500 shadow-red-200"},
                                {label: "Fear/Anxiety", value: 30, color: "bg-orange-500 shadow-orange-200"},
                                {label: "Disbelief", value: 15, color: "bg-purple-500 shadow-purple-200"},
                                {label: "Resilience", value: 10, color: "bg-green-500 shadow-green-200"},
                                {label: "Neutral", value: 10, color: "bg-blue-500 shadow-blue-200"}
                              ].map((item, i) => (
                                <motion.div 
                                  key={i}
                                  className="flex flex-col items-center group"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 + (i * 0.1) }}
                                >
                                  <div className="text-xs font-medium text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.value}%
                                  </div>
                                  <motion.div 
                                    className={`w-8 rounded-t-lg ${item.color} shadow-lg`}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${item.value * 3.5}px` }}
                                    transition={{ 
                                      duration: 0.8, 
                                      delay: 0.2 + (i * 0.1),
                                      ease: "easeOut" 
                                    }}
                                  />
                                  <div className="text-xs mt-2 text-gray-600 dark:text-gray-400 text-center">
                                    {item.label}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700">
                            <h4 className="text-sm font-semibold mb-3">Recent Insights</h4>
                            
                            <div className="space-y-3 max-h-[200px] overflow-auto hide-scrollbar">
                              {[
                                { type: "Trending", text: "Rising flood concern in Pangasinan area", sentiment: "Panic", confidence: 87 },
                                { type: "Language", text: "Mixed Filipino/English messages for earthquake reports", sentiment: "Fear/Anxiety", confidence: 92 },
                                { type: "Pattern", text: "Increased tsunami mentions after seismic activity", sentiment: "Disbelief", confidence: 78 }
                              ].map((insight, i) => (
                                <motion.div 
                                  key={i}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2 + (i * 0.15) }}
                                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-100 dark:border-gray-600"
                                >
                                  <div className="flex justify-between mb-1">
                                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{insight.type}</span>
                                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 rounded text-gray-700 dark:text-gray-300">{insight.confidence}%</span>
                                  </div>
                                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">{insight.text}</p>
                                  <div className="flex items-center mt-1">
                                    <span className="text-xs text-gray-500 mr-2">Dominant emotion:</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      insight.sentiment === "Panic" ? "bg-red-100 text-red-700" :
                                      insight.sentiment === "Fear/Anxiety" ? "bg-orange-100 text-orange-700" :
                                      insight.sentiment === "Disbelief" ? "bg-purple-100 text-purple-700" :
                                      "bg-yellow-100 text-yellow-700"
                                    }`}>
                                      {insight.sentiment}
                                    </span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Removing the Latest Updates section entirely as requested */}
        </div>
      </section>
      
      {/* Features Section with Draggable Carousel */}
      <section className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
        <motion.div 
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          initial={{ scaleX: 0, originX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Powerful
              </span> Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              PanicSense PH provides a comprehensive suite of tools to better understand and monitor disasters in the Philippines.
            </p>
          </motion.div>
          
          <FeaturesCarousel />
        </div>
      </section>
      
      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern-white opacity-10"></div>
          <TwinklingStars />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">Powerful Impact Metrics</h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              PanicSense PH is making a real difference in disaster response and preparedness
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "95%", label: "Accuracy in Disaster Classification", icon: <Shield /> },
              { value: "Fast", label: "Data Processing Speed", icon: <Users /> },
              { value: "24/7", label: "Real-time Monitoring Coverage", icon: <Clock /> },
              { value: "15min", label: "Average Response Time Reduction", icon: <BellRing /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-colors duration-300"
              >
                <div className="p-3 bg-white/10 rounded-full w-fit mb-4">
                  {stat.icon}
                </div>
                <h3 className="text-4xl font-bold mb-2">{stat.value}</h3>
                <p className="text-white/80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer - Matching main layout style */}
      <footer className="bg-white border-t border-slate-200 py-2 sm:py-4 z-50 relative">
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-slate-600">
          <div className="flex items-center gap-1 sm:gap-2">
            <img src="/favicon.png" alt="PanicSense PH Logo" className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>PanicSense PH © {new Date().getFullYear()}</span>
          </div>
          <div className="mt-1 sm:mt-0 flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
            <span>Advanced Disaster Sentiment Analysis Platform</span>
            <div className="flex space-x-3">
              {["Dashboard", "Geographic Analysis", "About"].map((item, index) => (
                <Link 
                  key={index} 
                  href={item === "Dashboard" ? "/dashboard" : `/${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-slate-500 hover:text-blue-600 transition-colors text-xs"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
      
      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Tutorial onClose={() => setShowTutorial(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Inject CSS for animations */}
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .skew-x-30 {
          transform: skewX(30deg);
        }
        @keyframes twinkling {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        
        .animate-spin-slow {
          animation: spin 35s linear infinite;
        }
        
        .animate-spin-slower {
          animation: spin 45s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin 30s linear infinite reverse;
        }
        
        .shadow-glow-blue {
          box-shadow: 0 0 15px 5px rgba(59, 130, 246, 0.5);
        }
        
        .shadow-glow-indigo {
          box-shadow: 0 0 15px 5px rgba(99, 102, 241, 0.5);
        }
        
        .shadow-glow-cyan {
          box-shadow: 0 0 15px 5px rgba(6, 182, 212, 0.5);
        }
        
        .shadow-glow-purple {
          box-shadow: 0 0 15px 5px rgba(168, 85, 247, 0.5);
        }
        
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
          background-size: 40px 40px;
        }
        
        .bg-grid-dark-pattern {
          background-image: 
            linear-gradient(to right, #4b5563 1px, transparent 1px),
            linear-gradient(to bottom, #4b5563 1px, transparent 1px);
          background-size: 40px 40px;
        }
        
        .bg-grid-pattern-white {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        
        .animate-ping-slow {
          animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .animate-float-1 {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-2 {
          animation: float 8s ease-in-out infinite 1s;
        }
        
        .animate-float-3 {
          animation: float 7s ease-in-out infinite 2s;
        }
        
        .animate-float-4 {
          animation: float 9s ease-in-out infinite 3s;
        }
        
        .animate-dash {
          animation: dash 15s linear infinite;
        }
        
        .animate-dash-reverse {
          animation: dash 15s linear infinite reverse;
        }
        
        @keyframes dash {
          to {
            stroke-dashoffset: 1000;
          }
        }
        
        .geo-coordinate-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}