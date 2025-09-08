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

  if (!travelerAddress && !matchedTripDates) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Información de Envío
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
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
                title="Destinatario"
                variant="info"
              />
            </div>
          )}

          {/* Trip Dates */}
          {matchedTripDates && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fechas Importantes
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cronograma del Viaje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {matchedTripDates.firstDayPackages && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">Primer día para recibir paquetes:</span>
                      <span className="text-sm">
                        {new Date(matchedTripDates.firstDayPackages).toLocaleDateString('es-GT')}
                      </span>
                    </div>
                  )}
                  {matchedTripDates.lastDayPackages && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">Último día para recibir paquetes:</span>
                      <span className="text-sm">
                        {new Date(matchedTripDates.lastDayPackages).toLocaleDateString('es-GT')}
                      </span>
                    </div>
                  )}
                  {matchedTripDates.deliveryDate && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium">Fecha de entrega en oficina:</span>
                      <span className="text-sm font-semibold text-primary">
                        {new Date(matchedTripDates.deliveryDate).toLocaleDateString('es-GT')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingInfoModal;