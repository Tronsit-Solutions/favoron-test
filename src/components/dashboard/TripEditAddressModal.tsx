import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Building2, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTripEditNotifications } from "@/hooks/useTripEditNotifications";

interface TripEditAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { packageReceivingAddress: any }) => void;
  tripData: any;
  hasActivePackages: boolean;
}

const accommodationTypes = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'casa', label: 'Casa/Apartamento' }
];

export const TripEditAddressModal = ({
  isOpen,
  onClose,
  onSubmit,
  tripData,
  hasActivePackages
}: TripEditAddressModalProps) => {
  const { toast } = useToast();
  const { notifyShoppersOfTripChange } = useTripEditNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [address, setAddress] = useState({
    recipientName: '',
    accommodationType: '',
    streetAddress: '',
    streetAddress2: '',
    cityArea: '',
    postalCode: '',
    hotelAirbnbName: '',
    contactNumber: ''
  });

  useEffect(() => {
    if (tripData?.package_receiving_address) {
      const addr = tripData.package_receiving_address;
      setAddress({
        recipientName: addr.recipientName || '',
        accommodationType: addr.accommodationType || '',
        streetAddress: addr.streetAddress || '',
        streetAddress2: addr.streetAddress2 || '',
        cityArea: addr.cityArea || '',
        postalCode: addr.postalCode || '',
        hotelAirbnbName: addr.hotelAirbnbName || '',
        contactNumber: addr.contactNumber || ''
      });
    }
  }, [tripData]);

  const handleChange = (field: string, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!address.recipientName || !address.accommodationType || 
        !address.streetAddress || !address.cityArea || 
        !address.postalCode || !address.contactNumber) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit the change
      onSubmit({
        packageReceivingAddress: address
      });

      // Notify shoppers if there are active packages
      if (hasActivePackages && tripData?.id) {
        const { notifiedCount } = await notifyShoppersOfTripChange(
          tripData.id,
          'address',
          {
            package_receiving_address: address,
            from_city: tripData.from_city
          }
        );

        if (notifiedCount > 0) {
          toast({
            title: "Shoppers notificados",
            description: `Se notificó a ${notifiedCount} shopper(s) del cambio`,
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('Error updating address:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la dirección",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Dirección para Recibir Paquetes
          </DialogTitle>
          <DialogDescription>
            Actualiza dónde recibirás los productos en destino
          </DialogDescription>
        </DialogHeader>

        {hasActivePackages && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Los shoppers con paquetes activos serán notificados de este cambio.
            </p>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipientName">Nombre de quien recibe *</Label>
            <Input
              id="recipientName"
              value={address.recipientName}
              onChange={(e) => handleChange('recipientName', e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accommodationType">Tipo de alojamiento *</Label>
            <Select
              value={address.accommodationType}
              onValueChange={(value) => handleChange('accommodationType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {accommodationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="streetAddress">Dirección línea 1 *</Label>
            <Input
              id="streetAddress"
              value={address.streetAddress}
              onChange={(e) => handleChange('streetAddress', e.target.value)}
              placeholder="Ej: 123 Main Street"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="streetAddress2">Dirección línea 2 (opcional)</Label>
            <Input
              id="streetAddress2"
              value={address.streetAddress2}
              onChange={(e) => handleChange('streetAddress2', e.target.value)}
              placeholder="Ej: Apt 4B, Suite 100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cityArea">Ciudad / Estado *</Label>
              <Input
                id="cityArea"
                value={address.cityArea}
                onChange={(e) => handleChange('cityArea', e.target.value)}
                placeholder="Ej: Miami, FL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Código postal *</Label>
              <Input
                id="postalCode"
                value={address.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="Ej: 33101"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hotelAirbnbName">Nombre del lugar *</Label>
            <Input
              id="hotelAirbnbName"
              value={address.hotelAirbnbName}
              onChange={(e) => handleChange('hotelAirbnbName', e.target.value)}
              placeholder="Ej: Hotel InterContinental Miami"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber">Número de contacto *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="contactNumber"
                value={address.contactNumber}
                onChange={(e) => handleChange('contactNumber', e.target.value)}
                placeholder="+1 (305) 123-4567"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Si te hospedas en hotel, coloca el número del hotel
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
