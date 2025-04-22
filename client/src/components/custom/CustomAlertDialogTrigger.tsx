import React from 'react';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { CustomTrigger } from './CustomTrigger';

// Simple component that renders the custom trigger
// without nesting button elements
export const CustomAlertDialogTrigger: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  dialog: React.ReactNode;
}> = ({ children, className, onClick, dialog }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
    </AlertDialog>
  );
};