import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Home, Building2 } from "lucide-react";
import { GUATEMALA_MUNICIPALITIES, SPAIN_PROVINCES } from "@/lib/cities";

interface AddressFormProps {
  onSubmit: (addressData: any) => void;
  onCancel: () => void;
  initialData?: any;
  destinationCountry?: string;
  destinationCity?: string;
}

const AddressForm = ({ onSubmit, onCancel, initialData, destinationCountry, destinationCity }: AddressFormProps) => {
  const normalizedCountry = destinationCountry?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
  const isGuatemala = normalizedCountry === 'guatemala';
  const isSpain = normalizedCountry === 'espana' || normalizedCountry === 'españa';
  const isGuatemalaCityDept = isGuatemala && (
    destinationCity?.toLowerCase().includes('guatemala city') ||
    destinationCity?.toLowerCase().includes('ciudad de guatemala') ||
    !destinationCity
  );
  const hasDropdown = isGuatemalaCityDept || isSpain;

  const locationOptions = isGuatemalaCityDept
    ? GUATEMALA_MUNICIPALITIES.map(m => ({ value: m.value, label: m.isCapital ? `${m.label} (Q25)` : `${m.label} (Q45)` }))
    : isSpain
    ? SPAIN_PROVINCES
    : [];

  const locationLabel = isGuatemalaCityDept ? 'Ciudad/Municipio' : isSpain ? 'Provincia' : 'Ciudad/Municipio';

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
            {locationLabel} *
          </Label>
          {hasDropdown ? (
            <>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Select
                  value={formData.cityArea}
                  onValueChange={(value) => handleInputChange('cityArea', value)}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder={`Selecciona ${isGuatemalaCityDept ? 'tu municipio' : 'tu provincia'}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {locationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="cityArea"
                placeholder="Ej: Ciudad, provincia o estado"
                value={formData.cityArea}
                onChange={(e) => handleInputChange('cityArea', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hotelAirbnbName" className="text-sm font-medium">
            Nombre del condominio/edificio/referencia (opcional)
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