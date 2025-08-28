import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataAgeIndicatorProps {
  lastUpdate: Date | null;
  className?: string;
  showText?: boolean;
}

export const DataAgeIndicator = ({ 
  lastUpdate, 
  className,
  showText = true 
}: DataAgeIndicatorProps) => {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimeAgo = () => {
      const now = Date.now();
      const diff = now - lastUpdate.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 0) {
        setTimeAgo(`${minutes}m`);
        setIsStale(minutes >= 5); // Data is stale after 5 minutes
      } else {
        setTimeAgo(`${seconds}s`);
        setIsStale(false);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  if (!lastUpdate) return null;

  return (
    <div className={cn(
      "flex items-center gap-1 text-xs",
      isStale ? "text-orange-600" : "text-muted-foreground",
      className
    )}>
      <Clock className="h-3 w-3" />
      {showText && (
        <span>
          {isStale ? "Datos antiguos" : "Actualizado"} hace {timeAgo}
        </span>
      )}
      {!showText && <span>{timeAgo}</span>}
    </div>
  );
};