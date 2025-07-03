import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Eye } from "lucide-react";

interface AdminTripsTabProps {
  trips: any[];
  onViewTripDetail: (trip: any) => void;
  onApproveReject: (type: 'package' | 'trip', id: number, action: 'approve' | 'reject') => void;
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

                  {trip.status === 'pending_approval' && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => onApproveReject('trip', trip.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onApproveReject('trip', trip.id, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTripsTab;