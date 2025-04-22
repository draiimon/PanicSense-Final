
import React, { useState } from "react";
import { cn } from "@/lib/utils";

export const RippleContainer = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-0 animate-ripple-slow rounded-full bg-blue-500/20" />
          <div className="absolute inset-0 animate-ripple-slow animation-delay-1000 rounded-full bg-blue-500/20" />
          <div className="absolute inset-0 animate-ripple-slow animation-delay-2000 rounded-full bg-blue-500/20" />
        </div>
      )}
    </div>
  );
};
