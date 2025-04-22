import { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SimpleProgressProps {
  isProcessing: boolean;
  onComplete?: () => void;
  stage?: string; // The current stage message from the system
}

export function SimpleProgress({ isProcessing, onComplete, stage }: SimpleProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isProcessing) {
      setProgress(0);
      setIsComplete(false);
      return;
    }

    // Extract numbers from stage message if available
    if (stage) {
      const matches = stage.match(/(\d+)\/(\d+)/);
      if (matches) {
        const current = parseInt(matches[1]);
        const total = parseInt(matches[2]);
        setProgress((current / total) * 100);

        if (current >= total) {
          setIsComplete(true);
          onComplete?.();
        }
      }
    }
  }, [isProcessing, stage, onComplete]);

  return (
    <div className="w-full space-y-2">
      <Progress 
        value={progress} 
        className={cn(
          "transition-all duration-300",
          isComplete && "bg-green-100 [&>[role=progressbar]]:bg-green-500"
        )}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {stage || ''}
        </span>
      </div>
    </div>
  );
}