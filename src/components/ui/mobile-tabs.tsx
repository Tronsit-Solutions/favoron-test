import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className={cn("w-full", className)}>
      <ScrollArea className="w-full">
        <Tabs value={value} onValueChange={onValueChange} className="w-full">
          <TabsList className="grid w-full h-auto p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "relative flex items-center justify-center gap-1 px-2 py-2 text-xs sm:text-sm",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground",
                  "data-[state=active]:shadow-sm transition-all"
                )}
              >
                <span className="truncate">{tab.label}</span>
                {tab.badge}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </ScrollArea>
    </div>
  );
};

export default MobileTabs;