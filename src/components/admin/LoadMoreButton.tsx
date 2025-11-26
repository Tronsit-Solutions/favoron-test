import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  currentCount: number;
  totalCount: number;
}

export const LoadMoreButton = ({ 
  onLoadMore, 
  hasMore, 
  isLoading,
  currentCount,
  totalCount 
}: LoadMoreButtonProps) => {
  if (!hasMore) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Mostrando todos los {totalCount} paquetes
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <p className="text-sm text-muted-foreground">
        Mostrando {currentCount} de {totalCount} paquetes
      </p>
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={isLoading}
        className="w-full max-w-xs"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando...
          </>
        ) : (
          `Cargar más paquetes`
        )}
      </Button>
    </div>
  );
};
