
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plane } from "lucide-react";

interface RecentActivityProps {
  packages: any[];
  trips: any[];
  getStatusBadge: (status: string) => JSX.Element;
}

const RecentActivity = ({ packages, trips, getStatusBadge }: RecentActivityProps) => {
  const hasActivity = packages.length > 0 || trips.length > 0;

  return (
    <Card>
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
            {packages
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3)
              .map((item) => (
                <div key={`package-${item.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        Paquete: {item.itemDescription || (item.products?.[0]?.itemDescription) || 'Sin descripción'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString('es-GT')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            
            {/* Luego mostrar viajes */}
            {trips
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 2)
              .map((item) => (
                <div key={`trip-${item.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Plane className="h-5 w-5 text-traveler" />
                    <div>
                      <p className="font-medium">
                        Viaje: {item.fromCity || 'Origen'} → {item.toCity || 'Destino'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString('es-GT')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
