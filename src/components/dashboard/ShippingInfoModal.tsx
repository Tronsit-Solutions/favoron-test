import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package as PackageType } from '@/types';
import AddressDisplay from '@/components/ui/address-display';
import { Calendar, MapPin, Truck, Info, FileText, ChevronDown } from 'lucide-react';
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
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const travelerAddress = pkg.traveler_address as any;
  const tripData = (pkg as any).trips;
  
  // Check scroll position to show/hide scroll indicator
  const checkScrollIndicator = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const hasScrollableContent = scrollHeight > clientHeight;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
      setShowScrollIndicator(hasScrollableContent && !isNearBottom);
    }
  };

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollIndicator);
      // Check initial state
      checkScrollIndicator();
      
      return () => container.removeEventListener('scroll', checkScrollIndicator);
    }
  }, [isOpen, pkg]);

  // Debug logging
  console.log('🔍 ShippingInfoModal - Package:', pkg);
  console.log('🔍 ShippingInfoModal - travelerAddress:', travelerAddress);
  console.log('🔍 ShippingInfoModal - tripData:', tripData);

  if (!travelerAddress && !tripData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden relative">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Información de Envío
          </DialogTitle>
        </DialogHeader>
        
        <div 
          ref={scrollContainerRef}
          className="space-y-6 pb-4 overflow-y-auto max-h-[calc(80vh-120px)]"
        >
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
                variant="info"
              />
            </div>
          )}
          
          {/* Fechas Importantes */}
          {tripData && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fechas Importantes
              </h3>
              <div className="bg-info-muted border-info-border border rounded-lg p-4">
                <div className="space-y-3">
                  {tripData.first_day_packages && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Primer día para recibir paquetes:</p>
                      <p className="text-sm font-semibold text-primary">{new Date(tripData.first_day_packages).toLocaleDateString('es-GT', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  )}
                  {tripData.last_day_packages && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Último día para recibir paquetes:</p>
                      <p className="text-sm font-semibold text-primary">{new Date(tripData.last_day_packages).toLocaleDateString('es-GT', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  )}
                  {tripData.delivery_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de entrega en oficina de Favoron:</p>
                      <p className="text-sm font-semibold text-success">{new Date(tripData.delivery_date).toLocaleDateString('es-GT', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                      
                      <Alert className="mt-3">
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
          {onDocumentUpload && (pkg.status === 'pending_purchase' || pkg.status === 'payment_confirmed' || pkg.status === 'paid' || pkg.status === 'in_transit') && (
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

        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-primary/90 text-primary-foreground px-3 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
              <span className="text-xs font-medium">Más contenido abajo</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShippingInfoModal;