import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  showZero?: boolean;
}

export const NotificationBadge = ({ count, className, showZero = false }: NotificationBadgeProps) => {
  if (!showZero && count === 0) return null;

  return (
    <span className={cn(
      "inline-flex items-center justify-center min-w-[18px] h-[18px] text-xs font-medium text-white bg-destructive rounded-full",
      count > 99 ? "px-1.5" : "px-1",
      className
    )}>
      {count > 99 ? "99+" : count}
    </span>
  );
};