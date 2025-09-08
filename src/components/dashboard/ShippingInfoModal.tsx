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
                tripDates={matchedTripDates ? {
                  firstDayPackages: matchedTripDates.firstDayPackages,
                  lastDayPackages: matchedTripDates.lastDayPackages,
                  deliveryDate: matchedTripDates.deliveryDate
                } : undefined}
              />
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingInfoModal;