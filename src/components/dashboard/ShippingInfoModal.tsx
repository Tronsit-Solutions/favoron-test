import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package as PackageType } from '@/types';
import AddressDisplay from '@/components/ui/address-display';
import { Calendar, MapPin, Truck, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ShippingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: PackageType;
}

const ShippingInfoModal = ({ isOpen, onClose, pkg }: ShippingInfoModalProps) => {
  const travelerAddress = pkg.traveler_address as any;
  const tripData = (pkg as any).trips;
  
  // Debug logging
  console.log('🔍 ShippingInfoModal - Package:', pkg);
  console.log('🔍 ShippingInfoModal - travelerAddress:', travelerAddress);
  console.log('🔍 ShippingInfoModal - tripData:', tripData);

  if (!travelerAddress && !tripData) {
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

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingInfoModal;