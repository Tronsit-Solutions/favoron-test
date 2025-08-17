
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
          <TabsList className="inline-flex h-auto p-1 w-max">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "relative flex items-center justify-center gap-2 px-4 py-2 text-sm whitespace-nowrap",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground",
                  "data-[state=active]:shadow-sm transition-all"
                )}
              >
                <span>{tab.label}</span>
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
