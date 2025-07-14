import { Badge } from "@/components/ui/badge";

interface TripStatsHeaderProps {
  filteredTripsCount: number;
  approvedCount: number;
  activeCount: number;
}

export const TripStatsHeader = ({
  filteredTripsCount,
  approvedCount,
  activeCount
}: TripStatsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">✈️ Viajes disponibles</h3>
        <p className="text-sm text-muted-foreground">
          {filteredTripsCount} viajes disponibles para matching
        </p>
      </div>
      <div className="flex space-x-2">
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          {approvedCount} Aprobados
        </Badge>
        <Badge variant="secondary" className="bg-green-50 text-green-700">
          {activeCount} Activos
        </Badge>
      </div>
    </div>
  );
};