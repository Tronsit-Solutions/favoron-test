import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
}

const RefreshButton = ({ onRefresh, isRefreshing = false, className = "" }: RefreshButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`h-8 w-8 p-0 ${className}`}
      title="Actualizar datos"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>
  );
};

export default RefreshButton;