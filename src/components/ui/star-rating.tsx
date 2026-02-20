import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const StarRating = ({
  value,
  onChange,
  readonly = false,
  size = "md",
  className,
}: StarRatingProps) => {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            className={cn(
              sizeMap[size],
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
