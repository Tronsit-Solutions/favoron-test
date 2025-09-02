
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plane } from "lucide-react";

interface RecentActivityProps {
  packages: any[];
  trips: any[];
  getStatusBadge: (status: string, options?: any) => JSX.Element;
  currentUserId?: string;
}

const RecentActivity = ({ packages, trips, getStatusBadge, currentUserId }: RecentActivityProps) => {
  // Filtrar packages del usuario actual
  const userPackages = packages.filter(pkg => pkg.user_id === currentUserId);
  
  // Filtrar trips del usuario actual
  const userTrips = trips.filter(trip => trip.user_id === currentUserId);
  
  const hasActivity = userPackages.length > 0 || userTrips.length > 0;

  return (
    <Card className="mobile-content">
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Tus últimas solicitudes y viajes</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasActivity ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tienes actividad reciente</p>
            <p className="text-sm">Crea tu primera solicitud o registra un viaje</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Primero mostrar paquetes */}
            {userPackages
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 3)
              .map((item) => (
                <div key={`package-${item.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        Paquete: {item.item_description || 'Sin descripción'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('es-GT')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            
            {/* Luego mostrar viajes */}
            {userTrips
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 2)
              .map((item) => (
                <div key={`trip-${item.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Plane className="h-5 w-5 text-traveler" />
                    <div>
                      <p className="font-medium">
                        Viaje: {item.from_city || 'Origen'} → {item.to_city || 'Destino'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('es-GT')}
                      </p>
                    </div>
                  </div>
                   {getStatusBadge(item.status, { context: 'trip' })}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
