
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Plane, Calendar, MapPin, Package, Truck, CheckCircle, XCircle, Home } from "lucide-react";

interface TripDetailModalProps {
  trip: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

const TripDetailModal = ({ trip, isOpen, onClose, onApprove, onReject }: TripDetailModalProps) => {
  if (!trip) return null;

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente de Aprobación', variant: 'secondary' as const },
      'approved': { label: 'Aprobado', variant: 'default' as const },
      'active': { label: 'Activo', variant: 'default' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDeliveryMethodIcon = (method: string) => {
    return method === 'pickup' ? <Home className="h-4 w-4" /> : <Truck className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plane className="h-5 w-5" />
            <span>Detalles de Viaje #{trip.id}</span>
          </DialogTitle>
          <DialogDescription>
            Información completa del viaje y del viajero
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Estado actual:</span>
            {getStatusBadge(trip.status)}
          </div>

          {/* Traveler Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="h-4 w-4" />
                <span>Información del Viajero</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Nombre</p>
                    <p className="text-sm text-muted-foreground">{trip.user.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{trip.user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">{trip.user.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Plane className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Experiencia</p>
                    <p className="text-sm text-muted-foreground">
                      {trip.user.totalTrips} viajes | {trip.user.completedDeliveries} entregas
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Plane className="h-4 w-4" />
                <span>Detalles del Viaje</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Route */}
              <div>
                <p className="font-medium text-lg flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{trip.fromCity} → {trip.toCity}</span>
                </p>
                <p className="text-muted-foreground">Ruta de viaje</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha de Llegada</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trip.arrivalDate).toLocaleDateString('es-GT')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Espacio Disponible</p>
                    <p className="text-sm text-muted-foreground">{trip.availableSpace} kg</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getDeliveryMethodIcon(trip.deliveryMethod)}
                  <div>
                    <p className="text-sm font-medium">Método de Entrega</p>
                    <p className="text-sm text-muted-foreground">
                      {trip.deliveryMethod === 'pickup' ? 'Recoger en oficina' : 'Entrega con mensajero'}
                    </p>
                  </div>
                </div>

                {trip.estimatedDeliveryDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Entrega Estimada</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trip.estimatedDeliveryDate).toLocaleDateString('es-GT')}
                      </p>
                    </div>
                  </div>
                )}

                {(trip.officeDeliveryDate || trip.deliveryDate) && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-primary">Entrega en Oficina Favorón</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trip.officeDeliveryDate || trip.deliveryDate).toLocaleDateString('es-GT')}
                      </p>
                      <p className="text-xs text-muted-foreground">Zona 14, Guatemala</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              {trip.deliveryAddress && (
                <div className="bg-muted/50 border rounded-lg p-3">
                  <div className="flex items-start space-x-2 mb-2">
                    <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm font-medium">Dirección de Entrega:</p>
                  </div>
                  <div className="text-sm text-muted-foreground ml-6">
                    <p>{trip.deliveryAddress.streetAddress}</p>
                    <p>{trip.deliveryAddress.cityArea}</p>
                    {trip.deliveryAddress.hotelAirbnbName && (
                      <p><strong>Hotel/Airbnb:</strong> {trip.deliveryAddress.hotelAirbnbName}</p>
                    )}
                    <p><strong>Contacto:</strong> {trip.deliveryAddress.contactNumber}</p>
                  </div>
                </div>
              )}

              {trip.additionalInfo && (
                <div>
                  <p className="text-sm font-medium mb-1">Información Adicional:</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {trip.additionalInfo}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Viaje registrado el {new Date(trip.createdAt).toLocaleDateString('es-GT')} a las {new Date(trip.createdAt).toLocaleTimeString('es-GT')}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {trip.status === 'pending_approval' && (
            <div className="flex space-x-2 pt-4 border-t">
              <Button 
                onClick={() => onApprove(trip.id)}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar Viaje
              </Button>
              <Button 
                variant="destructive"
                onClick={() => onReject(trip.id)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar Viaje
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripDetailModal;
