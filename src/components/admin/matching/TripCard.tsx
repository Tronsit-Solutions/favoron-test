
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, CalendarDays, Plane, Star } from "lucide-react";
import { formatPrice, formatDateUTC } from "@/lib/formatters";

interface TripCardProps {
  trip: any;
  packagesTotal?: number;
  onViewTripDetail: (trip: any) => void;
}

export const TripCard = ({
  trip,
  packagesTotal,
  onViewTripDetail
}: TripCardProps) => {
  console.log("TripCard trip data:", trip);
  console.log("TripCard profiles data:", trip.public_profiles);
  
  return <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-2">
            {/* Main route info */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Plane className="h-4 w-4 text-blue-500" />
                  <h4 className="font-medium text-sm">
                    {trip.from_city} → {trip.to_city}
                  </h4>
                </div>
                
                {/* Traveler name + rating */}
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <span>👤 {trip.first_name && trip.last_name 
                    ? `${trip.first_name} ${trip.last_name}` 
                    : trip.username || 'Usuario sin nombre'}</span>
                  {trip.traveler_avg_rating && (
                    <Badge variant="outline" className="text-xs gap-0.5 px-1.5 py-0">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {Number(trip.traveler_avg_rating).toFixed(1)}
                    </Badge>
                  )}
                </div>
                
                {/* Packages total badge */}
                {packagesTotal !== undefined && packagesTotal > 0 && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      💰 Total: ${packagesTotal.toFixed(2)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Important dates - chronological order */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-1">
                <CalendarDays className="h-3 w-3 text-blue-500" />
                <span className="text-blue-600">
                  Fecha de viaje: {formatDateUTC(new Date(trip.arrival_date))}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-green-600">
                  📥 Primer día: {formatDateUTC(new Date(trip.first_day_packages))}
                </span>
                <span className="text-red-600">
                  📤 Último día: {formatDateUTC(new Date(trip.last_day_packages))}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <CalendarDays className="h-3 w-3 text-primary" />
                <span className="text-primary font-medium">
                  Entrega: {formatDateUTC(new Date(trip.delivery_date))}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="ml-4">
            <Button size="sm" variant="outline" onClick={() => onViewTripDetail(trip)}>
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
};
