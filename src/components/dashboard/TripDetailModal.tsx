
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import EditTripModal from "@/components/EditTripModal";
import { 
  Calendar, 
  MapPin, 
  Home, 
  Phone, 
  User, 
  Plane, 
  Package,
  Clock,
  Info,
  Edit
} from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface TripDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: any;
  getStatusBadge: (status: string) => JSX.Element;
  packages?: any[];
  onEditTrip?: (tripData: any) => void;
  currentUser?: any;
}

export const TripDetailModal = ({ isOpen, onClose, trip, getStatusBadge, packages = [], onEditTrip, currentUser }: TripDetailModalProps) => {
  if (!trip) return null;

  const [showEditModal, setShowEditModal] = useState(false);
  const address = trip.package_receiving_address;
  const canEdit = ['pending_approval', 'approved'].includes(trip.status);
  const isOwner = currentUser?.id === trip.user_id;

  const handleEditSubmit = (editedData: any) => {
    if (onEditTrip) {
      onEditTrip(editedData);
    }
    setShowEditModal(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[95vh] overflow-y-auto mx-auto">
        <DialogHeader className="px-2 sm:px-6 pt-4 pb-2">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left">
            <span className="flex items-center gap-2 text-base sm:text-lg">
              <Plane className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Detalles del Viaje</span>
            </span>
            <div className="flex items-center gap-2 justify-start sm:justify-end">
              {canEdit && isOwner && onEditTrip && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                  className="h-7 px-2 sm:h-8 sm:px-3 text-xs sm:text-sm"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Editar
                </Button>
              )}
              <div className="flex-shrink-0">
                {getStatusBadge(trip.status)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 px-2 sm:px-6 pb-4 sm:pb-6">
          {/* Ruta */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-sm sm:text-base">Ruta del Viaje</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
              <div className="text-base sm:text-lg font-medium break-words">
                {trip.from_city} → {trip.to_city}
              </div>
              {trip.from_country && (
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Desde: {trip.from_country}
                </div>
              )}
            </div>
          </div>

          {/* Fechas importantes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-sm sm:text-base">Fechas Importantes</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs sm:text-sm font-medium">Fecha de Viaje</div>
                <div className="text-xs sm:text-sm text-muted-foreground break-words">
                  {formatDate(trip.departure_date)}
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs sm:text-sm font-medium">Fecha de Entrega</div>
                <div className="text-xs sm:text-sm text-muted-foreground break-words">
                  {formatDate(trip.delivery_date)}
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 sm:col-span-2">
                <div className="text-xs sm:text-sm font-medium">Método de Entrega</div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {trip.delivery_method === 'oficina' ? 'Oficina Favorón' : 'Domicilio'}
                </div>
              </div>
            </div>
          </div>

          {/* Ventana para recibir paquetes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-sm sm:text-base">Ventana para Recibir Paquetes</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-medium">Primer día</div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-words">
                    {formatDate(trip.first_day_packages)}
                  </div>
                </div>
                <div className="text-muted-foreground hidden sm:block">—</div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-medium">Último día</div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-words">
                    {formatDate(trip.last_day_packages)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dirección de recepción */}
          {address && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base">Dirección de Recepción</h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                {/* Nombre del destinatario */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground">Nombre:</div>
                  <div className="sm:col-span-2 text-xs sm:text-sm break-words">{address.recipientName}</div>
                </div>

                {/* Dirección */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground">Dirección:</div>
                  <div className="sm:col-span-2 text-xs sm:text-sm break-words">
                    <div>{address.streetAddress}</div>
                    {address.streetAddress2 && <div>{address.streetAddress2}</div>}
                  </div>
                </div>

                {/* Ciudad */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground">Ciudad:</div>
                  <div className="sm:col-span-2 text-xs sm:text-sm break-words">{address.cityArea}</div>
                </div>

                {/* Código Postal */}
                {address.postalCode && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Código Postal:</div>
                    <div className="sm:col-span-2 text-xs sm:text-sm break-words">{address.postalCode}</div>
                  </div>
                )}

                {/* Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground">Teléfono:</div>
                  <div className="sm:col-span-2 text-xs sm:text-sm break-words">{address.contactNumber}</div>
                </div>

                {/* Hotel/Airbnb */}
                {address.hotelAirbnbName && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {address.accommodationType === 'hotel' ? 'Hotel:' : 'Airbnb:'}
                    </div>
                    <div className="sm:col-span-2 text-xs sm:text-sm break-words">{address.hotelAirbnbName}</div>
                  </div>
                )}

                {address.additionalInstructions && (
                  <div className="bg-background rounded p-2">
                    <div className="text-xs text-muted-foreground mb-1">Instrucciones adicionales:</div>
                    <div className="text-xs sm:text-sm break-words">{address.additionalInstructions}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información del Messenger (si existe) */}
          {trip.messenger_pickup_info && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base">Información del Messenger</h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm space-y-1">
                  {trip.messenger_pickup_info.name && (
                    <div className="break-words"><span className="font-medium">Nombre:</span> {trip.messenger_pickup_info.name}</div>
                  )}
                  {trip.messenger_pickup_info.phone && (
                    <div className="break-words"><span className="font-medium">Teléfono:</span> {trip.messenger_pickup_info.phone}</div>
                  )}
                  {trip.messenger_pickup_info.instructions && (
                    <div className="break-words"><span className="font-medium">Instrucciones:</span> {trip.messenger_pickup_info.instructions}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Capacidad disponible */}
          {trip.available_space && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base">Capacidad Disponible</h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                <div className="text-base sm:text-lg font-medium">{trip.available_space} kg</div>
              </div>
            </div>
          )}

          {/* Paquetes asignados */}
          {packages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base">Paquetes Asignados</h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm font-medium mb-2">
                  {packages.length} paquete{packages.length !== 1 ? 's' : ''} asignado{packages.length !== 1 ? 's' : ''}
                </div>
                <div className="space-y-2">
                  {packages.slice(0, 3).map((pkg: any) => (
                    <div key={pkg.id} className="text-xs sm:text-sm text-muted-foreground break-words">
                      • {pkg.item_description}
                    </div>
                  ))}
                  {packages.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      Y {packages.length - 3} más...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-sm sm:text-base">Información Adicional</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="break-words">Registrado el {formatDate(trip.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="break-words">Última actualización: {formatDate(trip.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end px-2 sm:px-6 pb-4 sm:pb-6">
          <Button onClick={onClose} variant="outline" className="text-sm">
            Cerrar
          </Button>
        </div>
      </DialogContent>

      {/* Edit Modal */}
      <EditTripModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        tripData={trip}
      />
    </Dialog>
  );
};
