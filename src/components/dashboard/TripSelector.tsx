import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin } from "lucide-react";

interface TripSelectorProps {
  trips: any[];
  selectedTripId: string | null;
  onTripSelect: (tripId: string | null) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

export const TripSelector = ({ trips, selectedTripId, onTripSelect, getStatusBadge }: TripSelectorProps) => {
  if (trips.length === 0) return null;

  return (
    <div className="mb-4">
      <Select value={selectedTripId || "all"} onValueChange={(value) => onTripSelect(value === "all" ? null : value)}>
        <SelectTrigger className="w-full md:w-[380px]">
          <SelectValue placeholder="Seleccionar viaje" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <span className="font-medium">Todos los viajes</span>
              <Badge variant="secondary">{trips.length}</Badge>
            </div>
          </SelectItem>
          {trips.map((trip) => (
            <SelectItem key={trip.id} value={trip.id}>
              <div className="flex items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{trip.from_city} → {trip.to_city}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(trip.arrival_date), 'd MMM yyyy', { locale: es })}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
