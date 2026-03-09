import { cn } from "@/lib/utils";

interface MobileTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: Array<{
    value: string;
    label: string;
    badge?: React.ReactNode;
  }>;
  className?: string;
}

/**
 * MobileTabs - A mobile-friendly tab component that avoids Radix context issues
 * Uses simple buttons instead of TabsTrigger to prevent crashes with nested Tabs
 */
export const MobileTabs = ({ value, onValueChange, tabs, className }: MobileTabsProps) => {
  return (
    <div className={cn("w-full bg-background border-b", className)}>
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex w-max h-auto p-1 gap-1 bg-muted/30 rounded-none">
          {tabs.map((tab) => {
            const isActive = value === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onValueChange(tab.value)}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-fit",
                  "transition-all duration-200 rounded-md touch-manipulation",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                  isActive
                    ? "bg-background text-primary font-medium shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="truncate">{tab.label}</span>
                {tab.badge}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileTabs;
