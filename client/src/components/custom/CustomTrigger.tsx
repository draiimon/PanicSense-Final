import React from 'react';
import { cn } from '@/lib/utils';

type CustomTriggerProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function CustomTrigger({ 
  children, 
  className, 
  onClick,
  ...props 
}: CustomTriggerProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn("cursor-pointer", className)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}