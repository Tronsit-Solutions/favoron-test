import { Package, Trip } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Package as PackageIcon, MapPin, DollarSign } from "lucide-react";

interface UserActivityTimelineProps {
  packages: Package[];
  trips: Trip[];
}

const UserActivityTimeline = ({ packages, trips }: UserActivityTimelineProps) => {
  // Combine and sort activities by date
  const activities = [
    ...packages.map(pkg => ({
      type: 'package' as const,
      id: pkg.id,
      title: pkg.itemDescription || pkg.products?.[0]?.itemDescription || 'Paquete',
      status: pkg.status,
      date: pkg.createdAt,
      price: pkg.estimatedPrice
    })),
    ...trips.map(trip => ({
      type: 'trip' as const,
      id: trip.id,
      title: `${trip.fromCity} → ${trip.toCity}`,
      status: trip.status,
      date: trip.createdAt,
      price: null
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente', variant: 'secondary' as const },
      'approved': { label: 'Aprobado', variant: 'default' as const },
      'matched': { label: 'Emparejado', variant: 'default' as const },
      'completed': { label: 'Completado', variant: 'default' as const },
      'active': { label: 'Activo', variant: 'default' as const }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No hay actividad registrada
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Actividad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-3 p-3 border rounded-lg">
            <div className="mt-1">
              {activity.type === 'package' ? (
                <PackageIcon className="h-4 w-4 text-primary" />
              ) : (
                <MapPin className="h-4 w-4 text-secondary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                {getStatusBadge(activity.status)}
              </div>
              
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.date), { addSuffix: true, locale: es })}
                </p>
                
                {activity.price && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3 mr-1" />
                    ${activity.price}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UserActivityTimeline;