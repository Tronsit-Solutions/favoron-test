
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Home, Phone, Edit3, Check } from "lucide-react";

interface AddressConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: any) => void;
  currentAddress: {
    streetAddress: string;
    cityArea: string;
    hotelAirbnbName?: string;
    contactNumber: string;
  };
  packageDetails: {
    itemDescription: string;
    estimatedPrice: string;
  };
}

const AddressConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentAddress, 
  packageDetails 
}: AddressConfirmationModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAddress, setEditedAddress] = useState(currentAddress);

  const handleConfirm = () => {
    onConfirm(isEditing ? editedAddress : currentAddress);
  };

  const handleAddressChange = (field: string, value: string) => {
    setEditedAddress(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span>Confirmar dirección de entrega</span>
          </DialogTitle>
          <DialogDescription>
            Por favor confirma que tu dirección de entrega sigue siendo correcta para este paquete.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Package Info */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Paquete a recibir:</h4>
              <p className="text-sm text-muted-foreground">{packageDetails.itemDescription}</p>
              <p className="text-sm font-medium">Precio estimado: ${packageDetails.estimatedPrice}</p>
            </CardContent>
          </Card>

          {/* Address Display/Edit */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Tu dirección de entrega:</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Listo
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </>
                )}
              </Button>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="editStreetAddress">Dirección completa</Label>
                  <Input
                    id="editStreetAddress"
                    value={editedAddress.streetAddress}
                    onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="editCityArea">Ciudad/Área</Label>
                  <Input
                    id="editCityArea"
                    value={editedAddress.cityArea}
                    onChange={(e) => handleAddressChange('cityArea', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="editHotelName">Hotel/Airbnb (opcional)</Label>
                  <Input
                    id="editHotelName"
                    value={editedAddress.hotelAirbnbName || ''}
                    onChange={(e) => handleAddressChange('hotelAirbnbName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="editContactNumber">Número de contacto</Label>
                  <Input
                    id="editContactNumber"
                    value={editedAddress.contactNumber}
                    onChange={(e) => handleAddressChange('contactNumber', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start space-x-2">
                    <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{currentAddress.streetAddress}</p>
                      <p className="text-sm text-muted-foreground">{currentAddress.cityArea}</p>
                      {currentAddress.hotelAirbnbName && (
                        <p className="text-sm text-muted-foreground">{currentAddress.hotelAirbnbName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{currentAddress.contactNumber}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Importante:</strong> El comprador enviará el paquete a esta dirección. 
              Asegúrate de que esté correcta y que estarás disponible para recibirlo.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              Confirmar dirección
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddressConfirmationModal;
