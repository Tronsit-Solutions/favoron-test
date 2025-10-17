import React, { useState, useRef, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import { Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SwipeableCardProps {
  children: React.ReactNode;
  onArchive?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  canArchive?: boolean;
  className?: string;
}

export const SwipeableCard = ({
  children,
  onArchive,
  onDelete,
  canDelete = false,
  canArchive = true,
  className,
}: SwipeableCardProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Action buttons width (total width of visible buttons)
  const ACTION_WIDTH = 140; // Width for both buttons
  const SWIPE_THRESHOLD = 60; // Minimum swipe to reveal buttons

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      // Only allow left swipe (negative delta)
      if (eventData.deltaX < 0) {
        setIsSwiping(true);
        // Limit swipe to ACTION_WIDTH
        const newOffset = Math.max(Math.min(eventData.deltaX, 0), -ACTION_WIDTH);
        setSwipeOffset(newOffset);
      }
    },
    onSwiped: (eventData) => {
      setIsSwiping(false);
      
      // If swiped left past threshold, reveal buttons
      if (eventData.deltaX < -SWIPE_THRESHOLD) {
        setSwipeOffset(-ACTION_WIDTH);
      } else {
        // Otherwise, snap back
        setSwipeOffset(0);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 10,
    touchEventOptions: { passive: false }, // Permite preventDefault en touch events
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        swipeOffset !== 0
      ) {
        setSwipeOffset(0);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [swipeOffset]);

  const handleAction = (action: () => void) => {
    action();
    setSwipeOffset(0); // Close after action
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-full min-w-0", className)}
      style={{ overflow: 'hidden', isolation: 'isolate', touchAction: 'pan-y' }}
      {...handlers}
    >
      {/* Action buttons - positioned absolutely behind the card */}
      <div className="absolute top-0 right-0 h-full flex items-center gap-1 pr-2 pointer-events-none" style={{ right: `-${ACTION_WIDTH}px` }}>
        {canArchive && onArchive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-16 px-3 bg-muted hover:bg-muted/80 flex flex-col items-center justify-center gap-1 rounded-md transition-all pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onArchive);
            }}
            style={{
              opacity: Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1),
              transform: `scale(${Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1)})`,
            }}
          >
            <Archive className="h-4 w-4" />
            <span className="text-xs">Archivar</span>
          </Button>
        )}
        
        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onDelete);
            }}
            className="h-16 px-3 bg-destructive/10 hover:bg-destructive/20 text-destructive flex flex-col items-center justify-center gap-1 rounded-md transition-all pointer-events-auto"
            style={{
              opacity: Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1),
              transform: `scale(${Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1)})`,
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-xs">Cancelar</span>
          </Button>
        )}
      </div>

      {/* Card content - slides left to reveal buttons */}
      <div
        className="relative z-10 bg-background w-full max-w-full min-w-0 overflow-x-hidden"
        style={{
          width: '100%',
          maxWidth: '100%',
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          contain: 'layout paint',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  );
};

