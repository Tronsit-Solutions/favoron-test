import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export const MobileTabs = ({ value, onValueChange, tabs, className }: MobileTabsProps) => {
  return (
    <div className={cn("w-full bg-background border-b", className)}>
      <ScrollArea className="w-full">
        <TabsList className="flex w-full h-auto p-1 gap-1 bg-muted/30 rounded-none overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "relative flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-fit",
                "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:font-medium",
                "data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50",
                "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground",
                "transition-all duration-200 rounded-md touch-manipulation",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1"
              )}
            >
              <span className="truncate">{tab.label}</span>
              {tab.badge}
            </TabsTrigger>
          ))}
        </TabsList>
      </ScrollArea>
    </div>
  );
};

export default MobileTabs;
