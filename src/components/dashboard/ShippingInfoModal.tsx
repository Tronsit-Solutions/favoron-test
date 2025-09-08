import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package as PackageType } from '@/types';
import AddressDisplay from '@/components/ui/address-display';
import { Calendar, MapPin, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ShippingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: PackageType;
}

const ShippingInfoModal = ({ isOpen, onClose, pkg }: ShippingInfoModalProps) => {
  const travelerAddress = pkg.traveler_address as any;
  const matchedTripDates = pkg.matched_trip_dates as any;
  
  // Debug logging
  console.log('🔍 ShippingInfoModal - Package:', pkg);
  console.log('🔍 ShippingInfoModal - travelerAddress:', travelerAddress);
  console.log('🔍 ShippingInfoModal - matchedTripDates:', matchedTripDates);

  if (!travelerAddress && !matchedTripDates) {
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
          {matchedTripDates && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fechas Importantes
              </h3>
              <div className="bg-info-muted border-info-border border rounded-lg p-4">
                <div className="space-y-3">
                  {matchedTripDates.firstDayPackages && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Primer día para recibir paquetes:</p>
                      <p className="text-sm font-semibold text-primary">{new Date(matchedTripDates.firstDayPackages).toLocaleDateString('es-GT', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  )}
                  {matchedTripDates.lastDayPackages && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Último día para recibir paquetes:</p>
                      <p className="text-sm font-semibold text-primary">{new Date(matchedTripDates.lastDayPackages).toLocaleDateString('es-GT', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  )}
                  {matchedTripDates.deliveryDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de entrega en oficina de Favoron:</p>
                      <p className="text-sm font-semibold text-success">{new Date(matchedTripDates.deliveryDate).toLocaleDateString('es-GT', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  )}
                  
                  {/* Debug: Show all data from matched_trip_dates */}
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Debug - matched_trip_dates data:</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(matchedTripDates, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingInfoModal;