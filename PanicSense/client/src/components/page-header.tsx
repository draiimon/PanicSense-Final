import { cn } from "@/lib/utils";

interface PageHeaderProps {
  heading: string;
  subheading?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  heading,
  subheading,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 py-6", className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {heading}
          </h1>
          {subheading && (
            <p className="text-sm text-muted-foreground sm:text-base">
              {subheading}
            </p>
          )}
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
    </div>
  );
}