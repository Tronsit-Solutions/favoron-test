import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin } from "lucide-react";

interface TripSelectorProps {
  trips: any[];
  selectedTripId: string | null;
  onTripSelect: (tripId: string) => void;
}

export const TripSelector = ({ trips, selectedTripId, onTripSelect }: TripSelectorProps) => {
  if (trips.length <= 1) return null;

  return (
    <div className="mb-4">
      <Select value={selectedTripId || trips[0]?.id} onValueChange={onTripSelect}>
        <SelectTrigger className="w-full md:w-[380px]">
          <SelectValue placeholder="Seleccionar viaje" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {trips.map((trip) => (
            <SelectItem key={trip.id} value={trip.id}>
              <div className="flex items-center gap-3 w-full">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">{trip.from_city} → {trip.to_city}</span>
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
