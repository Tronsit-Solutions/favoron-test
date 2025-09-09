
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Plane, Calendar, MapPin, Package, Truck, CheckCircle, XCircle, Home, ShoppingBag } from "lucide-react";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useModalState } from "@/contexts/ModalStateContext";
import { useAuth } from "@/hooks/useAuth";
import RejectionReasonModal from "./RejectionReasonModal";

interface TripDetailModalProps {
  modalId: string;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
}

const TripDetailModal = ({ modalId, onApprove, onReject }: TripDetailModalProps) => {
  const { isModalOpen, closeModal, getModalData } = useModalState();
  const { user, userRole } = useAuth();
  const trip = getModalData(modalId);
  const isOpen = isModalOpen(modalId);
  
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const { getStatusBadge } = useStatusHelpers();

  // Security: Only allow admin access
  if (!user || userRole?.role !== 'admin') {
    console.warn('🔒 Unauthorized access to TripDetailModal:', { 
      userId: user?.id, 
      role: userRole?.role 
    });
    return null;
  }

  // Fetch packages associated with this trip
  useEffect(() => {
    if (trip?.id && isOpen) {
      setLoadingPackages(true);
      const fetchPackages = async () => {
        try {
          const { data, error } = await supabase
            .from('packages')
            .select(`
              *,
              profiles:user_id (
                first_name,
                last_name,
                email
              )
            `)
            .eq('matched_trip_id', trip.id)
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('Error fetching trip packages:', error);
          } else {
            setPackages(data || []);
          }
        } catch (error) {
          console.error('Error fetching trip packages:', error);
        } finally {
          setLoadingPackages(false);
        }
      };
      
      fetchPackages();
    }
  }, [trip?.id, isOpen]);

  if (!trip) return null;

  // Debug logging to see what data we have
  console.log('Trip data in TripDetailModal:', trip);
  console.log('Available space value:', trip.available_space);
  console.log('All trip keys:', Object.keys(trip));

  const getTripStatusBadge = (status: string) => {
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

  // Handle reject action with reason
  const handleReject = (reason: string) => {
    onReject(trip.id, reason);
    closeModal(modalId);
  };

  // Open rejection modal
  const handleRejectClick = () => {
    setRejectionModalOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => closeModal(modalId)}>
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
            {getTripStatusBadge(trip.status)}
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
                    <p className="text-sm text-muted-foreground">
                      {trip.first_name && trip.last_name 
                        ? `${trip.first_name} ${trip.last_name}` 
                        : trip.username || 'No disponible'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{trip.email || 'No disponible'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">{trip.phone_number || 'No disponible'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">ID del Viajero</p>
                    <p className="text-sm text-muted-foreground">
                      <code className="font-mono text-xs">{trip.user_id}</code>
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
                {trip.from_country && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">País de origen:</span> {trip.from_country}
                  </p>
                )}
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
                    <p className="text-sm text-muted-foreground">
                      {trip.available_space ? `${trip.available_space} kg` : 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Method - Prominente */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {getDeliveryMethodIcon(trip.delivery_method)}
                  <p className="text-base font-semibold text-blue-800">Método de Entrega en Guatemala</p>
                </div>
                <div className="ml-6">
                  <p className="text-sm text-blue-700">
                    {trip.delivery_method === 'oficina' ? '🏢 Llevar paquetes a la oficina de Favorón' : 
                     trip.delivery_method === 'mensajero' ? '🚚 Un mensajero recogerá los paquetes' : 
                     trip.delivery_method === 'pickup' ? '🏢 Recoger en oficina' : 
                     trip.delivery_method || 'No especificado'}
                  </p>
                  {!trip.delivery_method && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Método de entrega no especificado en este viaje</p>
                  )}
                </div>
              </div>

              {/* Messenger Pickup Information */}
              {trip.delivery_method === 'mensajero' && trip.messenger_pickup_info && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2 mb-3">
                    <Truck className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <p className="text-sm font-medium text-yellow-800">Información de Recolección por Mensajero:</p>
                  </div>
                  <div className="text-sm text-muted-foreground ml-7 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="font-medium text-gray-700">Dirección de recolección:</p>
                        <p>{trip.messenger_pickup_info.streetAddress}</p>
                        <p>{trip.messenger_pickup_info.cityArea}</p>
                      </div>
                      
                      {trip.messenger_pickup_info.accommodationName && (
                        <div>
                          <p className="font-medium text-gray-700">Lugar:</p>
                          <p>{trip.messenger_pickup_info.accommodationName}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="font-medium text-gray-700">Contacto:</p>
                        <p>{trip.messenger_pickup_info.contactNumber}</p>
                      </div>
                      
                      {trip.messenger_pickup_info.preferredTime && (
                        <div>
                          <p className="font-medium text-gray-700">Horario preferido:</p>
                          <p>{trip.messenger_pickup_info.preferredTime}</p>
                        </div>
                      )}
                    </div>
                    
                    {trip.messenger_pickup_info.pickupInstructions && (
                      <div className="mt-3 pt-3 border-t border-yellow-200">
                        <p className="font-medium text-gray-700">Instrucciones adicionales:</p>
                        <p className="mt-1 bg-white p-2 rounded border">{trip.messenger_pickup_info.pickupInstructions}</p>
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
                      {typeof trip.package_receiving_address === 'object' ? (
                        <div className="space-y-2">
                          {trip.package_receiving_address?.recipientName && (
                            <div>
                              <p className="font-medium text-gray-700">Nombre del destinatario:</p>
                              <p className="ml-2">{trip.package_receiving_address.recipientName}</p>
                            </div>
                          )}
                          
                          <div>
                            <p className="font-medium text-gray-700">Dirección:</p>
                            <div className="ml-2 space-y-1">
                              <p>{trip.package_receiving_address?.streetAddress || ''}</p>
                              {trip.package_receiving_address?.streetAddress2 && (
                                <p>{trip.package_receiving_address.streetAddress2}</p>
                              )}
                              <p>{trip.package_receiving_address?.cityArea || ''}</p>
                              {trip.package_receiving_address?.postalCode && (
                                <p>Código Postal: {trip.package_receiving_address.postalCode}</p>
                              )}
                            </div>
                          </div>

                          {trip.package_receiving_address?.hotelAirbnbName && (
                            <div>
                              <p className="font-medium text-gray-700">
                                {trip.package_receiving_address?.accommodationType === 'hotel' ? 'Hotel:' : 'Lugar:'}
                              </p>
                              <p className="ml-2">{trip.package_receiving_address.hotelAirbnbName}</p>
                            </div>
                          )}
                          
                          <div>
                            <p className="font-medium text-gray-700">Número de contacto:</p>
                            <p className="ml-2">{trip.package_receiving_address?.contactNumber || ''}</p>
                          </div>
                        </div>
                      ) : (
                        <p>{trip.package_receiving_address}</p>
                      )}
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

          {/* Packages Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <ShoppingBag className="h-4 w-4" />
                <span>Paquetes Asignados ({packages.length})</span>
              </CardTitle>
              <CardDescription>
                Paquetes que lleva este viajero en su viaje
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPackages ? (
                <div className="text-center text-muted-foreground py-4">
                  Cargando paquetes...
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Este viaje no tiene paquetes asignados aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{pkg.item_description}</h4>
                          <p className="text-sm text-muted-foreground">
                            Shopper: {pkg.profiles?.first_name && pkg.profiles?.last_name 
                              ? `${pkg.profiles.first_name} ${pkg.profiles.last_name}`
                              : pkg.profiles?.email || 'No disponible'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(pkg.status, { 
                            packageDestination: pkg.package_destination,
                            pkg: pkg
                          })}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Origen:</p>
                          <p>{pkg.purchase_origin}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Destino:</p>
                          <p>{pkg.package_destination}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Precio estimado:</p>
                          <p className="font-semibold text-green-600">${pkg.estimated_price}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}</span>
                          <span>ID: {pkg.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                onClick={handleRejectClick}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar Viaje
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        onConfirm={handleReject}
        type="trip"
        itemName={`${trip?.from_city} → ${trip?.to_city}` || 'Viaje'}
      />
    </Dialog>
  );
};

export default TripDetailModal;
