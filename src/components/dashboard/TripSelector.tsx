import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin, Calendar } from "lucide-react";

interface TripSelectorProps {
  trips: any[];
  selectedTripId: string | null;
  onTripSelect: (tripId: string | null) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

export const TripSelector = ({ trips, selectedTripId, onTripSelect, getStatusBadge }: TripSelectorProps) => {
  if (trips.length === 0) return null;

  // Mobile: Horizontal scroll with chips
  const MobileSelector = () => (
    <div className="md:hidden">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => onTripSelect(null)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              selectedTripId === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            <span className="text-sm font-medium">Todos los viajes</span>
          </button>
          {trips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => onTripSelect(trip.id)}
              className={`inline-flex flex-col items-start gap-1 px-4 py-2 rounded-lg border transition-all min-w-[200px] ${
                selectedTripId === trip.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  {trip.from_city} → {trip.to_city}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs opacity-80">
                <Calendar className="h-3 w-3" />
                {format(new Date(trip.arrival_date), 'd MMM', { locale: es })}
              </div>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );

  // Desktop: Dropdown selector
  const DesktopSelector = () => (
    <div className="hidden md:block">
      <Select value={selectedTripId || "all"} onValueChange={(value) => onTripSelect(value === "all" ? null : value)}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Seleccionar viaje" />
        </SelectTrigger>
        <SelectContent>
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

  return (
    <div className="mb-4">
      <MobileSelector />
      <DesktopSelector />
    </div>
  );
};
