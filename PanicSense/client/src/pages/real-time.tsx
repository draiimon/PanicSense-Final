import { RealtimeMonitor } from "@/components/realtime/realtime-monitor";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb, Zap, MessageSquareText, ClipboardCheck } from "lucide-react";

export default function RealTime() {
  // Animation variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Enhanced background - EXACTLY LIKE DASHBOARD */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-violet-50 to-pink-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-teal-500/10 to-rose-500/15 animate-gradient"
          style={{ backgroundSize: "200% 200%" }} />
          
        <div className="absolute inset-0 opacity-15 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM1MDUwRjAiIGZpbGwtb3BhY2l0eT0iMC41Ij48cGF0aCBkPSJNMzYgMzR2Nmg2di02aC02em02IDZ2Nmg2di02aC02em0tMTIgMGg2djZoLTZ2LTZ6bTEyIDBoNnY2aC02di02eiIvPjwvZz48L2c+PC9zdmc+')]" />
        
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(120,80,255,0.8)_0%,transparent_70%)]" />
        
        <div className="absolute h-72 w-72 rounded-full bg-purple-500/25 filter blur-3xl animate-float-1 will-change-transform"
          style={{ top: "15%", left: "8%" }} />
          
        <div className="absolute h-64 w-64 rounded-full bg-teal-500/20 filter blur-3xl animate-float-2 will-change-transform"
          style={{ bottom: "15%", right: "15%" }} />
          
        <div className="absolute h-52 w-52 rounded-full bg-purple-500/25 filter blur-3xl animate-float-3 will-change-transform"
          style={{ top: "45%", right: "20%" }} />
        
        <div className="absolute h-48 w-48 rounded-full bg-pink-500/20 filter blur-3xl animate-float-4 will-change-transform"
          style={{ top: "65%", left: "25%" }} />
          
        <div className="absolute h-40 w-40 rounded-full bg-yellow-400/15 filter blur-3xl animate-float-5 will-change-transform"
          style={{ top: "30%", left: "40%" }} />
          
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      
      <div className="relative pb-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative space-y-8 mx-auto max-w-7xl pt-10 px-4"
        >
          {/* Real-Time Header */}
          <motion.div 
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border-none shadow-lg bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 p-4 sm:p-4"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 animate-gradient" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">
                    Real-Time Analysis
                  </h1>
                  <p className="text-xs sm:text-sm text-indigo-100 mt-0.5 sm:mt-1">
                    Analyze disaster-related text in real-time with detailed emotion analysis
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <div className="text-sm font-medium text-white">
                  Instant sentiment detection
                </div>
              </div>
            </div>
          </motion.div>

          {/* Realtime Monitor Component */}
          <motion.div variants={itemVariants}>
            <RealtimeMonitor />
          </motion.div>

          {/* Instructions Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none mb-2 sm:mb-4 overflow-hidden shadow-lg rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/40">
              <CardHeader className="p-4 bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 border-b border-gray-200/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                    <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-white">
                      How to Use Real-Time Analysis
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-indigo-100 mt-0.5 sm:mt-1">
                      Follow these steps to get the most out of the real-time sentiment analyzer
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-5">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                      <span className="text-white font-medium">1</span>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-indigo-900">Enter Text</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Enter disaster-related text in the input field on the left. You can type in English or Filipino.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                      <span className="text-white font-medium">2</span>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-indigo-900">Process Analysis</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Click the "Analyze Sentiment" button to process the text, or enable auto-analyze mode.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                      <span className="text-white font-medium">3</span>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-indigo-900">View Results</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        View the results in the right panel, showing the detected sentiment, confidence level, and additional insights.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                      <span className="text-white font-medium">4</span>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-indigo-900">Build Analysis History</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Continue adding more text samples to build a comprehensive real-time analysis history that you can export or review.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-5 bg-gradient-to-r from-indigo-100/80 via-blue-100/80 to-purple-100/80 border border-indigo-200/40 rounded-lg shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-indigo-500/90 shadow-inner flex-shrink-0">
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-indigo-900">Tips for Better Analysis</h3>
                      <p className="mt-2 text-sm text-indigo-800">
                        For more accurate results, provide detailed context in your text. Mention specific disaster types (earthquake, flood, typhoon, etc.), locations, and emotional reactions. Analysis works best with text between 20-200 words.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div className="bg-white/60 backdrop-blur-sm p-3 rounded border border-indigo-200/40 text-sm text-indigo-800 shadow-sm">
                          <span className="font-medium">✓ Good Example:</span> "May nagsasabing nagkakaroon ng lindol sa Maynila. Natatakot ako at hindi ko alam kung safe na lumabas ng bahay."
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm p-3 rounded border border-indigo-200/40 text-sm text-indigo-800 shadow-sm">
                          <span className="font-medium">✓ Good Example:</span> "The flood in Bacolod City is getting worse. People are trapped on rooftops waiting for rescue. I'm worried about my family there."
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}