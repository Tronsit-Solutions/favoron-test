
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Plane, Calendar, MapPin, Package, Truck, CheckCircle, XCircle, Home } from "lucide-react";

interface TripDetailModalProps {
  trip: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
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
                  <span>{trip.from_city} → {trip.to_city}</span>
                </p>
                <p className="text-muted-foreground">Ruta de viaje</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha de Llegada</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trip.arrival_date).toLocaleDateString('es-GT')}
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
                      {trip.deliveryMethod === 'oficina' ? 'Llevar a oficina de Favorón' : 
                       trip.deliveryMethod === 'mensajero' ? 'Recoger con mensajero' : 
                       trip.deliveryMethod === 'pickup' ? 'Recoger en oficina' : trip.deliveryMethod}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messenger Pickup Information */}
              {trip.deliveryMethod === 'mensajero' && trip.messengerPickupInfo && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2 mb-3">
                    <Truck className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <p className="text-sm font-medium text-yellow-800">Información de Recolección por Mensajero:</p>
                  </div>
                  <div className="text-sm text-muted-foreground ml-7 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="font-medium text-gray-700">Dirección de recolección:</p>
                        <p>{trip.messengerPickupInfo.streetAddress}</p>
                        <p>{trip.messengerPickupInfo.cityArea}</p>
                      </div>
                      
                      {trip.messengerPickupInfo.accommodationName && (
                        <div>
                          <p className="font-medium text-gray-700">Lugar:</p>
                          <p>{trip.messengerPickupInfo.accommodationName}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="font-medium text-gray-700">Contacto:</p>
                        <p>{trip.messengerPickupInfo.contactNumber}</p>
                      </div>
                      
                      {trip.messengerPickupInfo.preferredTime && (
                        <div>
                          <p className="font-medium text-gray-700">Horario preferido:</p>
                          <p>{trip.messengerPickupInfo.preferredTime}</p>
                        </div>
                      )}
                    </div>
                    
                    {trip.messengerPickupInfo.pickupInstructions && (
                      <div className="mt-3 pt-3 border-t border-yellow-200">
                        <p className="font-medium text-gray-700">Instrucciones adicionales:</p>
                        <p className="mt-1 bg-white p-2 rounded border">{trip.messengerPickupInfo.pickupInstructions}</p>
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-yellow-200">
                      <p className="text-xs text-yellow-700 font-medium">
                        💰 Costo del mensajero (Q25-Q40) será descontado de las ganancias del viajero
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {trip.delivery_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-primary">Fecha de Entrega</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trip.delivery_date).toLocaleDateString('es-GT')}
                      </p>
                    </div>
                  </div>
                )}

                {trip.first_day_packages && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-600">Primer Día Recibir Paquetes</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trip.first_day_packages).toLocaleDateString('es-GT')}
                      </p>
                    </div>
                  </div>
                )}

                {trip.last_day_packages && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-600">Último Día Recibir Paquetes</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trip.last_day_packages).toLocaleDateString('es-GT')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Package Receiving Address */}
              {trip.package_receiving_address && (
                <div className="bg-muted/50 border rounded-lg p-4">
                  <div className="flex items-start space-x-2 mb-3">
                    <Package className="h-5 w-5 text-primary mt-0.5" />
                    <p className="text-sm font-medium text-primary">Dirección para Recibir Paquetes:</p>
                  </div>
                  <div className="text-sm text-muted-foreground ml-7 space-y-2">
                    <div>
                      <p><strong>Dirección de recepción de paquetes:</strong></p>
                      <div className="ml-2">
                        {typeof trip.package_receiving_address === 'object' ? (
                          <>
                            <p>{trip.package_receiving_address?.streetAddress || ''}</p>
                            <p>{trip.package_receiving_address?.cityArea || ''}</p>
                            <p>{trip.package_receiving_address?.contactNumber || ''}</p>
                          </>
                        ) : (
                          <p>{trip.package_receiving_address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Address (Guatemala) */}
              {trip.deliveryAddress && (
                <div className="bg-muted/50 border rounded-lg p-3">
                  <div className="flex items-start space-x-2 mb-2">
                    <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm font-medium">Dirección de Entrega en Guatemala:</p>
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
                Viaje registrado el {new Date(trip.created_at).toLocaleDateString('es-GT')} a las {new Date(trip.created_at).toLocaleTimeString('es-GT')}
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
