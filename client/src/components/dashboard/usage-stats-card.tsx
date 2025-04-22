import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, AlertTriangle, Database, Timer, BarChart4 } from "lucide-react";

interface UsageStats {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

export function UsageStatsCard() {
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  
  // Get the usage stats
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/usage-stats"],
    refetchInterval: refreshInterval || false,
  });
  
  const stats: UsageStats = data as UsageStats;
  
  // Auto-refresh more frequently when a file is being processed
  useEffect(() => {
    // Set a default 1-minute refresh interval
    setRefreshInterval(60000);
    
    return () => {
      setRefreshInterval(null);
    };
  }, []);
  
  // Calculate percentage of limit used
  const percentUsed = stats ? Math.min(100, Math.round((stats.used / stats.limit) * 100)) : 0;
  
  // Format the reset time
  const resetTimeFormatted = stats?.resetAt 
    ? formatDistanceToNow(new Date(stats.resetAt), { addSuffix: true })
    : 'Unknown';
    
  // Get gradient colors based on percentage
  const getGradientColors = () => {
    if (percentUsed >= 100) return 'from-red-600 to-red-500';
    if (percentUsed >= 80) return 'from-amber-500 to-orange-500';
    if (percentUsed >= 60) return 'from-yellow-500 to-amber-500';
    return 'from-green-500 to-emerald-600';
  };
  
  return (
    <Card className="overflow-hidden shadow-lg border-none hover:shadow-xl transition-all duration-300 group">
      <div className={`flex flex-col relative overflow-hidden rounded-xl`}>
        {/* Gradient background - Better colors */}
        <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 opacity-90`}></div>
        
        {/* Pattern overlay - Improved patterns */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0xMiAwaDZ2NmgtNnYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        
        {/* Animated gradient overlay for a more vibrant look */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-violet-500/20 animate-gradient-slow"></div>
        
        {/* Content - More compact layout */}
        <CardContent className="p-4 relative z-10 flex flex-col">
          {isLoading ? (
            <div className="flex space-y-2 animate-pulse">
              <div className="flex items-center justify-between w-full">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-white/20 rounded"></div>
                  <div className="h-6 w-16 bg-white/20 rounded"></div>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Compact horizontal layout */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center shadow-lg`}>
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-white/80">Daily Usage</p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-lg font-bold text-white">{stats?.used}</span>
                      <span className="text-xs text-white/60">/ {stats?.limit} rows processed</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-white/80 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>Resets {resetTimeFormatted}</span>
                  </div>
                </div>
              </div>
              
              {/* Custom progress bar */}
              <div className="h-1.5 rounded-full bg-black/10 backdrop-blur-sm overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${getGradientColors()} transition-all duration-500`}
                  style={{ width: `${percentUsed}%` }}
                ></div>
              </div>
              
              {/* Compact bottom row with warning and remaining count */}
              <div className="flex justify-between items-center mt-2 text-[10px] text-white/60">
                <div className="flex items-center gap-1">
                  <BarChart4 className="h-3 w-3" />
                  <span>{stats?.remaining} rows remaining</span>
                </div>
                
                {percentUsed >= 90 ? (
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    <span>
                      {percentUsed >= 100 
                        ? "Daily limit reached!" 
                        : "Approaching limit"}
                    </span>
                  </div>
                ) : (
                  <span className="italic">* Counter persists after data deletion</span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </div>
    </Card>
  );
}