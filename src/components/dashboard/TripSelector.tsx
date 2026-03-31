import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin } from "lucide-react";
import { NotificationBadge } from "@/components/ui/notification-badge";

interface TripSelectorProps {
  trips: any[];
  selectedTripId: string | null;
  onTripSelect: (tripId: string) => void;
  pendingCountByTrip?: Record<string, number>;
}

export const TripSelector = ({ trips, selectedTripId, onTripSelect, pendingCountByTrip }: TripSelectorProps) => {
  if (trips.length <= 1) return null;

  const currentTripId = selectedTripId || trips[0]?.id;
  const totalOtherPending = Object.entries(pendingCountByTrip || {})
    .reduce((acc, [tripId, count]) => tripId !== currentTripId ? acc + (count as number) : acc, 0);

  return (
    <div className="mb-4 flex items-center gap-2">
      <Select value={currentTripId} onValueChange={onTripSelect}>
        <SelectTrigger className="w-full md:w-[420px]">
          <SelectValue placeholder="Seleccionar viaje" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {trips.map((trip) => {
            const pendingCount = pendingCountByTrip?.[trip.id] || 0;
            return (
              <SelectItem key={trip.id} value={trip.id}>
                <div className="flex items-center gap-3 w-full">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{trip.from_city} → {trip.to_city}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(trip.arrival_date), 'd MMM yyyy', { locale: es })}
                  </span>
                  {pendingCount > 0 && (
                    <NotificationBadge count={pendingCount} className="ml-1" />
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};
