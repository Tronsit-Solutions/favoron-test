import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Calendar, ArrowRight, RefreshCw } from "lucide-react";
import { usePublicTrips } from "@/hooks/usePublicTrips";

interface AvailableTripsCardProps {
  onViewTrips: () => void;
}

const AvailableTripsCard = ({ onViewTrips }: AvailableTripsCardProps) => {
  const { trips, loading, fetching, lastUpdate, refreshTrips } = usePublicTrips();

  const tripsThisWeek = trips.filter(trip => {
    const arrivalDate = new Date(trip.arrival_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999); // End of the 7th day
    
    return arrivalDate >= today && arrivalDate <= nextWeek;
  });

  // Log the counts for debugging
  console.log('📊 Trip counts:', {
    totalTrips: trips.length,
    tripsThisWeek: tripsThisWeek.length,
    loading
  });

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-teal-300 via-cyan-200 to-emerald-300 border-0 shadow-lg mobile-content">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌍</span>
            Hub de Viajes
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshTrips}
            disabled={fetching}
            className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        {lastUpdate && (
          <p className="text-xs text-slate-600">
            Actualizado: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center border border-slate-200 hover:bg-white/70 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-1">
              <span>✈️</span>
              {loading ? "..." : trips.length}
            </div>
            <div className="text-sm text-slate-600">Viajes activos</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center border border-slate-200 hover:bg-white/70 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-1">
              <span>⚡</span>
              {loading ? "..." : tripsThisWeek.length}
            </div>
            <div className="text-sm text-slate-600">Esta semana</div>
          </div>
        </div>


        <Button 
          onClick={onViewTrips} 
          className="w-full bg-white/60 hover:bg-white/70 text-slate-800 border-slate-200 backdrop-blur-sm transition-all duration-300 hover:scale-105" 
          variant="outline"
          disabled={loading}
        >
          <Plane className="h-4 w-4 mr-2" />
          Ver todos los viajes
        </Button>
      </CardContent>
    </Card>
  );
};

export default AvailableTripsCard;