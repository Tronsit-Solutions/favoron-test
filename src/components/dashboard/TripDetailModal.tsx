
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import EditTripModal from "@/components/EditTripModal";
import { TripEditSelectionModal } from "./TripEditSelectionModal";
import { TripEditReceivingWindowModal } from "./TripEditReceivingWindowModal";
import { TripEditDeliveryDateModal } from "./TripEditDeliveryDateModal";
import { TripEditAddressModal } from "./TripEditAddressModal";
import { useTripEditNotifications } from "@/hooks/useTripEditNotifications";
import { 
  Calendar, 
  MapPin, 
  Home, 
  Plane, 
  Package,
  Edit,
  ExternalLink,
  DollarSign,
  Hash,
  ChevronDown,
  Truck
} from "lucide-react";
import { formatDateUTC } from "@/lib/formatters";

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

  const { hasActivePackages: checkActivePackages } = useTripEditNotifications();
  
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReceivingWindowModal, setShowReceivingWindowModal] = useState(false);
  const [showDeliveryDateModal, setShowDeliveryDateModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [hasActivePackages, setHasActivePackages] = useState(false);
  
  const address = trip.package_receiving_address;
  const canEdit = ['pending_approval', 'approved'].includes(trip.status);
  const isOwner = currentUser?.id === trip.user_id;

  useEffect(() => {
    const checkPackages = async () => {
      if (trip?.id) {
        const hasActive = await checkActivePackages(trip.id);
        setHasActivePackages(hasActive);
      }
    };
    if (isOpen) {
      checkPackages();
    }
  }, [isOpen, trip?.id]);

  const handleEditOptionSelect = (option: 'receiving_window' | 'delivery_date' | 'address' | 'other') => {
    setShowSelectionModal(false);
    switch (option) {
      case 'receiving_window': setShowReceivingWindowModal(true); break;
      case 'delivery_date': setShowDeliveryDateModal(true); break;
      case 'address': setShowAddressModal(true); break;
      case 'other': setShowEditModal(true); break;
    }
  };

  const handleReceivingWindowSubmit = (data: { firstDayPackages: Date; lastDayPackages: Date }) => {
    if (onEditTrip) {
      onEditTrip({ id: trip.id, ...trip, firstDayPackages: data.firstDayPackages, lastDayPackages: data.lastDayPackages });
    }
    setShowReceivingWindowModal(false);
  };

  const handleDeliveryDateSubmit = (data: { deliveryDate: Date }) => {
    if (onEditTrip) {
      onEditTrip({ id: trip.id, ...trip, deliveryDate: data.deliveryDate });
    }
    setShowDeliveryDateModal(false);
  };

  const handleAddressSubmit = (data: { packageReceivingAddress: any }) => {
    if (onEditTrip) {
      onEditTrip({ id: trip.id, ...trip, packageReceivingAddress: data.packageReceivingAddress });
    }
    setShowAddressModal(false);
  };

  const handleEditSubmit = (editedData: any) => {
    if (onEditTrip) onEditTrip(editedData);
    setShowEditModal(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[95vh] overflow-y-auto mx-auto">
        <DialogHeader className="px-2 sm:px-6 pt-4 pb-1">
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
                  onClick={() => setShowSelectionModal(true)}
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

        <div className="space-y-3 sm:space-y-4 px-2 sm:px-6 pb-4 sm:pb-6">
          {/* Ruta inline */}
          <div className="bg-muted/30 rounded-lg p-2.5 sm:p-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm sm:text-base font-medium break-words">
              {trip.from_city} → {trip.to_city}
            </span>
            {trip.from_country && (
              <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
                Desde: {trip.from_country}
              </span>
            )}
          </div>

          {/* Fechas + Ventana + Método + Capacidad en grid compacto */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-sm">Fechas y Detalles</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-muted/30 rounded-lg p-2.5">
                <div className="text-[11px] text-muted-foreground">Llegada</div>
                <div className="text-xs sm:text-sm font-medium">{formatDateUTC(new Date(trip.arrival_date))}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5">
                <div className="text-[11px] text-muted-foreground">Entrega</div>
                <div className="text-xs sm:text-sm font-medium">{formatDateUTC(new Date(trip.delivery_date))}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5">
                <div className="text-[11px] text-muted-foreground">Recibe desde</div>
                <div className="text-xs sm:text-sm font-medium">{formatDateUTC(new Date(trip.first_day_packages))}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5">
                <div className="text-[11px] text-muted-foreground">Recibe hasta</div>
                <div className="text-xs sm:text-sm font-medium">{formatDateUTC(new Date(trip.last_day_packages))}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="bg-muted/30 rounded-lg p-2.5 flex items-center gap-2 flex-1 min-w-[140px]">
                <Truck className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-[11px] text-muted-foreground">Método</div>
                  <div className="text-xs sm:text-sm font-medium">
                    {trip.delivery_method === 'oficina' ? 'Oficina Favorón' : 'Domicilio'}
                  </div>
                </div>
              </div>
              {trip.available_space && (
                <div className="bg-muted/30 rounded-lg p-2.5 flex items-center gap-2 flex-1 min-w-[140px]">
                  <Package className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-[11px] text-muted-foreground">Capacidad</div>
                    <div className="text-xs sm:text-sm font-medium">{trip.available_space} kg</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dirección de recepción */}
          {address && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-sm">Dirección de Recepción</h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 sm:p-3 space-y-1.5 text-xs sm:text-sm">
                <div><span className="text-muted-foreground">Nombre:</span> {address.recipientName}</div>
                <div>
                  <span className="text-muted-foreground">Dirección:</span> {address.streetAddress}
                  {address.streetAddress2 && `, ${address.streetAddress2}`}
                </div>
                <div><span className="text-muted-foreground">Ciudad:</span> {address.cityArea}</div>
                {address.postalCode && (
                  <div><span className="text-muted-foreground">Código Postal:</span> {address.postalCode}</div>
                )}
                <div><span className="text-muted-foreground">Teléfono:</span> {address.contactNumber}</div>
                {address.hotelAirbnbName && (
                  <div>
                    <span className="text-muted-foreground">
                      {address.accommodationType === 'hotel' ? 'Hotel:' : 'Airbnb:'}
                    </span> {address.hotelAirbnbName}
                  </div>
                )}
                {address.additionalInstructions && (
                  <div className="bg-background rounded p-2 mt-1">
                    <div className="text-[11px] text-muted-foreground">Instrucciones:</div>
                    <div className="break-words">{address.additionalInstructions}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messenger info */}
          {trip.messenger_pickup_info && (
            <div className="bg-muted/30 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm space-y-1">
              <div className="font-semibold text-sm mb-1">Información del Messenger</div>
              {trip.messenger_pickup_info.name && (
                <div><span className="text-muted-foreground">Nombre:</span> {trip.messenger_pickup_info.name}</div>
              )}
              {trip.messenger_pickup_info.phone && (
                <div><span className="text-muted-foreground">Teléfono:</span> {trip.messenger_pickup_info.phone}</div>
              )}
              {trip.messenger_pickup_info.instructions && (
                <div><span className="text-muted-foreground">Instrucciones:</span> {trip.messenger_pickup_info.instructions}</div>
              )}
            </div>
          )}

          {/* Paquetes asignados - Collapsible */}
          {packages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-sm">Paquetes Asignados ({packages.length})</h3>
              </div>
              <div className="space-y-1.5">
                {packages.map((pkg: any, index: number) => (
                  <Collapsible key={pkg.id}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between bg-muted/30 rounded-lg p-2.5 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          <span className="text-sm font-medium truncate">{pkg.item_description}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {pkg.estimated_price && (
                            <span className="text-xs font-medium">${parseFloat(pkg.estimated_price).toFixed(2)}</span>
                          )}
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {pkg.status}
                          </Badge>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-muted/20 rounded-b-lg px-3 py-2.5 space-y-2 text-xs border-t border-border/50 -mt-1">
                        <div className="text-muted-foreground">ID: {pkg.id.substring(0, 8)}</div>

                        {pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0 && (
                          <div className="space-y-1.5 pl-2 border-l-2 border-muted">
                            {pkg.products_data.map((product: any, prodIndex: number) => (
                              <div key={prodIndex} className="space-y-0.5">
                                <div className="font-medium break-words">{product.name || product.description}</div>
                                <div className="flex flex-wrap gap-3 text-muted-foreground">
                                  {product.quantity && <span>Cant: {product.quantity}</span>}
                                  {product.price && <span>Q{parseFloat(product.price).toFixed(2)}</span>}
                                </div>
                                {product.link && (
                                  <a href={product.link} target="_blank" rel="noopener noreferrer"
                                    className="text-primary hover:underline break-all">
                                    Ver producto
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {pkg.item_link && (
                          <div className="flex items-center gap-1.5">
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            <a href={pkg.item_link} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:underline">
                              Enlace del producto
                            </a>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-muted-foreground pt-1 border-t border-border/30">
                          <span>Origen: {pkg.purchase_origin}</span>
                          <span>Destino: {pkg.package_destination}</span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end px-2 sm:px-6 pb-4 sm:pb-6">
          <Button onClick={onClose} variant="outline" className="text-sm">
            Cerrar
          </Button>
        </div>
      </DialogContent>

      <TripEditSelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        onSelectOption={handleEditOptionSelect}
        hasActivePackages={hasActivePackages}
      />
      <TripEditReceivingWindowModal
        isOpen={showReceivingWindowModal}
        onClose={() => setShowReceivingWindowModal(false)}
        onSubmit={handleReceivingWindowSubmit}
        tripData={trip}
        hasActivePackages={hasActivePackages}
      />
      <TripEditDeliveryDateModal
        isOpen={showDeliveryDateModal}
        onClose={() => setShowDeliveryDateModal(false)}
        onSubmit={handleDeliveryDateSubmit}
        tripData={trip}
        hasActivePackages={hasActivePackages}
      />
      <TripEditAddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSubmit={handleAddressSubmit}
        tripData={trip}
        hasActivePackages={hasActivePackages}
      />
      <EditTripModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        tripData={trip}
      />
    </Dialog>
  );
};
