import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package as PackageType } from '@/types';
import { Calendar, MapPin, Truck, FileText, Info } from 'lucide-react';
import PurchaseConfirmationUpload from '@/components/PurchaseConfirmationUpload';
import TrackingInfoForm from '@/components/TrackingInfoForm';

interface ShippingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: PackageType;
  onDocumentUpload?: (type: 'confirmation' | 'tracking', data: any) => void;
}

const ShippingInfoModal = ({ isOpen, onClose, pkg, onDocumentUpload }: ShippingInfoModalProps) => {
  const travelerAddress = pkg.traveler_address as any;
  const tripDates = pkg.matched_trip_dates as any;

  if (!travelerAddress && !tripDates) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toLocaleDateString('es-GT', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Información de Envío
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pb-4">
          {/* Important Notice - Subtle style */}
          <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              <strong className="text-foreground">Importante:</strong> Después de completar tu compra, debes subir el comprobante de pago y el número de seguimiento (tracking) para procesar tu pedido.
            </p>
          </div>
          
          {/* Traveler Address */}
          {travelerAddress && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm sm:text-base">Dirección de Entrega</h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-2">
                {travelerAddress.recipientName && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Destinatario:</div>
                    <div className="sm:col-span-2 text-xs sm:text-sm font-semibold">{travelerAddress.recipientName}</div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground">Dirección #1:</div>
                  <div className="sm:col-span-2 text-xs sm:text-sm">{travelerAddress.streetAddress}</div>
                </div>
                {travelerAddress.streetAddress2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Dirección #2:</div>
                    <div className="sm:col-span-2 text-xs sm:text-sm">{travelerAddress.streetAddress2}</div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground">Ciudad:</div>
                  <div className="sm:col-span-2 text-xs sm:text-sm">{travelerAddress.cityArea}</div>
                </div>
                {travelerAddress.postalCode && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Código Postal:</div>
                    <div className="sm:col-span-2 text-xs sm:text-sm">{travelerAddress.postalCode}</div>
                  </div>
                )}
                {travelerAddress.country && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">País:</div>
                    <div className="sm:col-span-2 text-xs sm:text-sm">{travelerAddress.country}</div>
                  </div>
                )}
                {travelerAddress.hotelAirbnbName && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Hotel/Airbnb:</div>
                    <div className="sm:col-span-2 text-xs sm:text-sm font-medium text-primary">{travelerAddress.hotelAirbnbName}</div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground">Teléfono:</div>
                  <div className="sm:col-span-2 text-xs sm:text-sm">{travelerAddress.contactNumber}</div>
                </div>
                {travelerAddress.additionalInstructions && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Instrucciones adicionales:</div>
                    <div className="sm:col-span-2 text-xs sm:text-sm">{travelerAddress.additionalInstructions}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Important Dates */}
          {tripDates && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm sm:text-base">Fechas Importantes</h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-3">
                {tripDates.first_day_packages && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Primer día para recibir:</div>
                    <div className="sm:col-span-2 text-xs sm:text-sm font-semibold">{formatDate(tripDates.first_day_packages)}</div>
                  </div>
                )}
                {tripDates.last_day_packages && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Último día para recibir:</div>
                    <div className="sm:col-span-2 text-xs sm:text-sm font-semibold">{formatDate(tripDates.last_day_packages)}</div>
                  </div>
                )}
                {tripDates.delivery_date && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">Entrega en oficina:</div>
                      <div className="sm:col-span-2 text-xs sm:text-sm font-semibold text-success">{formatDate(tripDates.delivery_date)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      <Info className="h-3 w-3 inline mr-1" />
                      Podrás recoger tu paquete entre 1 y 2 días después de la entrega del viajero.
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Document Upload Section */}
          {onDocumentUpload && (pkg.status === 'pending_purchase' || pkg.status === 'paid' || pkg.status === 'in_transit') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm sm:text-base">Documentos del Paquete</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Purchase Confirmation Upload - always show so users can add more */}
                <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                  <PurchaseConfirmationUpload
                    packageId={pkg.id}
                    currentConfirmation={pkg.purchase_confirmation}
                    onUpload={(data) => onDocumentUpload('confirmation', data)}
                  />
                </div>
                
                {/* Tracking Information */}
                {!pkg.tracking_info && (
                  <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                    <TrackingInfoForm
                      packageId={pkg.id}
                      currentTracking={pkg.tracking_info}
                      onSubmit={(data) => onDocumentUpload('tracking', data)}
                    />
                  </div>
                )}
              </div>
              
              {/* Success Message when both documents are complete */}
              {pkg.purchase_confirmation && pkg.tracking_info && (
                <div className="bg-success/10 rounded-lg p-4 text-center">
                  <div className="text-success text-2xl mb-2">🎉</div>
                  <h4 className="font-semibold text-success mb-1">¡Documentos Completos!</h4>
                  <p className="text-sm text-success/80">
                    Ambos documentos han sido subidos correctamente. Tu pedido está en proceso.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingInfoModal;
