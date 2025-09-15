import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Eye, Plane, Package } from "lucide-react";
import LastMileTab from "./LastMileTab";

interface AdminTripsTabProps {
  trips: any[];
  onViewTripDetail: (trip: any) => void;
  onApproveReject: (type: 'package' | 'trip', id: string, action: 'approve' | 'reject') => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const AdminTripsTab = ({ 
  trips, 
  onViewTripDetail, 
  onApproveReject, 
  getStatusBadge 
}: AdminTripsTabProps) => {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Plane className="h-4 w-4" />
            <span>Gestión General</span>
          </TabsTrigger>
          <TabsTrigger value="lastmile" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Última Milla</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Viajes</CardTitle>
              <CardDescription>Todos los viajes registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trips.map(trip => (
                  <div key={trip.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{trip.fromCity} → {trip.toCity}</h4>
                        <p className="text-sm text-muted-foreground">
                          Llegada: {new Date(trip.arrivalDate).toLocaleDateString()} • 
                          Espacio: {trip.availableSpace}kg • Usuario: {trip.userId}
                          {trip.status === 'approved' && trip.deliveryDate && (
                            <> • <span className="font-medium text-primary">Entrega en oficina: {new Date(trip.deliveryDate).toLocaleDateString()}</span></>
                          )}
                        </p>
                      </div>
                      {getStatusBadge(trip.status)}
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onViewTripDetail(trip)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="lastmile" className="mt-4">
          <LastMileTab 
            trips={trips}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTripsTab;