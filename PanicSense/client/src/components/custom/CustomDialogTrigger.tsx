import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { CustomTrigger } from './CustomTrigger';

// Simple component that renders the custom trigger
// without nesting button elements
export const CustomDialogTrigger: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  dialog: React.ReactNode;
}> = ({ children, className, onClick, dialog }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* No DialogTrigger used to avoid nested button issues */}
      <CustomTrigger
        className={className}
        onClick={() => {
          if (onClick) onClick();
          setOpen(true);
        }}
      >
        {children}
      </CustomTrigger>
      {dialog}
    </Dialog>
  );
};