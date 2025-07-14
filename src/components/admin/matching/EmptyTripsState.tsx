import { Card, CardContent } from "@/components/ui/card";

interface EmptyTripsStateProps {
  hasFilters: boolean;
}

export const EmptyTripsState = ({ hasFilters }: EmptyTripsStateProps) => {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-4xl mb-2">✈️</div>
          <p className="text-muted-foreground">
            {hasFilters 
              ? "No se encontraron viajes con los filtros aplicados"
              : "No hay viajes disponibles"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};