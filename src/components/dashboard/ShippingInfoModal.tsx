import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package as PackageType } from '@/types';
import AddressDisplay from '@/components/ui/address-display';
import { Calendar, MapPin, Truck, Info, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  
  // Debug logging
  console.log('🔍 ShippingInfoModal - Package:', pkg);
  console.log('🔍 ShippingInfoModal - travelerAddress:', travelerAddress);
  console.log('🔍 ShippingInfoModal - tripDates:', tripDates);

  if (!travelerAddress && !tripDates) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Información de Envío
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pb-4">
          {/* Important Notice for Document Upload */}
          <Alert className="border-warning/30 bg-warning/10">
            <Info className="h-4 w-4 text-warning" />
            <AlertDescription className="text-foreground">
              <strong>Importante:</strong> Después de completar tu compra, debes subir el comprobante de pago y el número de seguimiento (tracking) para procesar tu pedido.
            </AlertDescription>
          </Alert>
          
          {/* Traveler Address */}
          {travelerAddress && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Dirección de Entrega
              </h3>
              <AddressDisplay
                address={{
                  streetAddress: travelerAddress.streetAddress,
                  streetAddress2: travelerAddress.streetAddress2,
                  cityArea: travelerAddress.cityArea,
                  hotelAirbnbName: travelerAddress.hotelAirbnbName,
                  contactNumber: travelerAddress.contactNumber,
                  recipientName: travelerAddress.recipientName,
                  additionalInstructions: travelerAddress.additionalInstructions,
                  country: travelerAddress.country,
                  postalCode: travelerAddress.postalCode
                }}
                title="Información de envío"
                variant="success"
              />
            </div>
          )}
          
          {/* Fechas Importantes */}
          {tripDates && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fechas Importantes
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="space-y-3">
                  {tripDates.first_day_packages && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Primer día para recibir paquetes:</p>
                      <p className="text-sm font-semibold text-foreground">{(() => {
                        const date = new Date(tripDates.first_day_packages);
                        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toLocaleDateString('es-GT', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                      })()}</p>
                    </div>
                  )}
                  {tripDates.last_day_packages && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Último día para recibir paquetes:</p>
                      <p className="text-sm font-semibold text-foreground">{(() => {
                        const date = new Date(tripDates.last_day_packages);
                        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toLocaleDateString('es-GT', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                      })()}</p>
                    </div>
                  )}
                  {tripDates.delivery_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de entrega en oficina de Favoron:</p>
                      <p className="text-sm font-semibold text-success">{(() => {
                        const date = new Date(tripDates.delivery_date);
                        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toLocaleDateString('es-GT', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                      })()}</p>
                      
                      <Alert className="mt-3 bg-muted/50 border-border">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Podrás recoger tu paquete entre 1 y 2 días después de la entrega del viajero.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Document Upload Section */}
          {onDocumentUpload && (pkg.status === 'pending_purchase' || pkg.status === 'paid' || pkg.status === 'in_transit') && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos del Paquete
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Purchase Confirmation Upload */}
                {!pkg.purchase_confirmation && (
                  <div className="border border-primary/30 rounded-lg p-4">
                    <PurchaseConfirmationUpload
                      packageId={pkg.id}
                      currentConfirmation={pkg.purchase_confirmation}
                      onUpload={(data) => onDocumentUpload('confirmation', data)}
                    />
                  </div>
                )}
                
                {/* Tracking Information */}
                {!pkg.tracking_info && (
                  <div className="border border-primary/30 rounded-lg p-4">
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
                <div className="text-center p-3 bg-success/10 border border-success/20 rounded-lg mt-4">
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