
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Plane, Star, CalendarDays, PackageCheck, ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react";
import { formatDateUTC } from "@/lib/formatters";
import type { AssignmentStats, TravelerHistory } from "@/hooks/useTripAssignmentStats";

interface TripCardProps {
  trip: any;
  packagesTotal?: number;
  onViewTripDetail: (trip: any) => void;
  hasBoost?: boolean;
  assignmentStats?: AssignmentStats;
  travelerHistory?: TravelerHistory;
}

export const TripCard = ({
  trip,
  packagesTotal,
  onViewTripDetail,
  hasBoost = false,
  assignmentStats,
  travelerHistory,
}: TripCardProps) => {
  const name = trip.first_name && trip.last_name
    ? `${trip.first_name} ${trip.last_name}`
    : trip.username || 'Usuario sin nombre';

  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Header — Route */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">
            {trip.from_city} → {trip.to_city}
          </span>
          {hasBoost && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0">
              🚀 Boost
            </Badge>
          )}
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onViewTripDetail(trip)}>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Traveler */}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground truncate">{name}</span>
          {trip.traveler_avg_rating && (
            <Badge variant="outline" className="text-xs gap-0.5 px-1.5 py-0 ml-auto shrink-0">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {Number(trip.traveler_avg_rating).toFixed(1)}
            </Badge>
          )}
        </div>

        {/* Traveler history */}
        {travelerHistory && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>{travelerHistory.completedTrips} viajes completados · {travelerHistory.deliveredPackages} entregas</span>
          </div>
        )}

        {/* Assignment stats */}
        {assignmentStats && (
          <div className="flex flex-wrap gap-1.5">
            {assignmentStats.responded > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-300 text-green-700 bg-green-50">
                ✅ {assignmentStats.responded} respondidos
              </Badge>
            )}
            {assignmentStats.noResponse > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive bg-destructive/5">
                ❌ {assignmentStats.noResponse} sin respuesta
              </Badge>
            )}
            {assignmentStats.pending > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-300 text-yellow-700 bg-yellow-50">
                ⏳ {assignmentStats.pending} pendientes
              </Badge>
            )}
            {assignmentStats.cancelled > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted text-muted-foreground">
                🚫 {assignmentStats.cancelled} cancelados
              </Badge>
            )}
          </div>
        )}


        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1 text-primary">
            <CalendarDays className="h-3 w-3" />
            <span>Viaje: {formatDateUTC(new Date(trip.arrival_date))}</span>
          </div>
          <div className="flex items-center gap-1 text-primary font-medium">
            <PackageCheck className="h-3 w-3" />
            <span>Entrega: {formatDateUTC(new Date(trip.delivery_date))}</span>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <ArrowDownToLine className="h-3 w-3" />
            <span>Desde: {formatDateUTC(new Date(trip.first_day_packages))}</span>
          </div>
          <div className="flex items-center gap-1 text-destructive">
            <ArrowUpFromLine className="h-3 w-3" />
            <span>Hasta: {formatDateUTC(new Date(trip.last_day_packages))}</span>
          </div>
        </div>
      </div>

      {/* Footer — Total */}
      {packagesTotal !== undefined && packagesTotal > 0 && (
        <div className="px-4 py-2 bg-green-50 dark:bg-green-950/20 border-t border-green-200 dark:border-green-800">
          <span className="text-xs font-semibold text-green-700 dark:text-green-300">
            💰 Total asignado: ${packagesTotal.toFixed(2)}
          </span>
        </div>
      )}
    </Card>
  );
};
