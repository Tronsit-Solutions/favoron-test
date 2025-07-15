import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Home, Building2 } from "lucide-react";

interface AddressFormProps {
  onSubmit: (addressData: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const AddressForm = ({ onSubmit, onCancel, initialData }: AddressFormProps) => {
  const [formData, setFormData] = useState({
    streetAddress: initialData?.streetAddress || '',
    cityArea: initialData?.cityArea || '',
    hotelAirbnbName: initialData?.hotelAirbnbName || '',
    contactNumber: initialData?.contactNumber || ''
  });

  const handleSubmit = () => {
    
    if (!formData.streetAddress || !formData.cityArea || !formData.contactNumber) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <MapPin className="h-5 w-5 text-orange-600" />
        <h3 className="font-medium text-orange-800">Información de entrega a domicilio</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="streetAddress" className="text-sm font-medium">
            Dirección completa *
          </Label>
          <div className="relative">
            <Home className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="streetAddress"
              placeholder="Ej: 15 Avenida 14-44, Zona 10"
              value={formData.streetAddress}
              onChange={(e) => handleInputChange('streetAddress', e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Incluye número de casa, avenida/calle, zona
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cityArea" className="text-sm font-medium">
            Ciudad/Municipio *
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="cityArea"
              placeholder="Ej: Guatemala, Mixco, Villa Nueva"
              value={formData.cityArea}
              onChange={(e) => handleInputChange('cityArea', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hotelAirbnbName" className="text-sm font-medium">
            Nombre del hotel/edificio/referencia (opcional)
          </Label>
          <Input
            id="hotelAirbnbName"
            placeholder="Ej: Hotel Real InterContinental, Edificio Europlaza"
            value={formData.hotelAirbnbName}
            onChange={(e) => handleInputChange('hotelAirbnbName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactNumber" className="text-sm font-medium">
            Número de contacto *
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="contactNumber"
              type="tel"
              placeholder="Ej: +502 1234-5678"
              value={formData.contactNumber}
              onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Número donde pueden contactarte para coordinar la entrega
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-3">
          <p className="text-sm text-amber-800">
            📍 <strong>Importante:</strong> Verifica que tu dirección sea correcta. 
            El costo de envío adicional será entre Q25-Q40 dependiendo de la ubicación.
          </p>
        </div>

        <div className="flex space-x-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="button" variant="shopper" className="flex-1" onClick={handleSubmit}>
            Confirmar Dirección
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddressForm;