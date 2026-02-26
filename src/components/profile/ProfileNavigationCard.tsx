import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileNavigationCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  badge?: number;
  isActive?: boolean;
}

const ProfileNavigationCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  badge,
  isActive,
}: ProfileNavigationCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition-all",
        "active:scale-[0.98]",
        isActive && "ring-2 ring-primary/30 bg-accent/30"
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
};

export default ProfileNavigationCard;
