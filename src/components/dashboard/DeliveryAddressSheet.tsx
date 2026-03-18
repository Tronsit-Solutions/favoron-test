import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Home, Building2 } from "lucide-react";
import { GUATEMALA_MUNICIPALITIES, SPAIN_PROVINCES } from "@/lib/cities";

export interface DeliveryAddressData {
  streetAddress: string;
  cityArea: string;
  hotelAirbnbName: string;
  contactNumber: string;
}

interface DeliveryAddressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DeliveryAddressData) => void;
  initialData?: Partial<DeliveryAddressData>;
  destinationCountry?: string;
  destinationCity?: string;
}

const DeliveryAddressSheet = ({ isOpen, onClose, onSave, initialData, destinationCountry, destinationCity }: DeliveryAddressSheetProps) => {
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
    ? GUATEMALA_MUNICIPALITIES.map(m => ({ value: m.value, label: m.isCapital ? `${m.label} (Q25)` : m.label }))
    : isSpain
    ? SPAIN_PROVINCES
    : [];

  const locationLabel = isGuatemalaCityDept ? 'Ciudad/Municipio' : isSpain ? 'Provincia' : 'Ciudad/Municipio';

  const [formData, setFormData] = useState<DeliveryAddressData>({
    streetAddress: initialData?.streetAddress || '',
    cityArea: initialData?.cityArea || '',
    hotelAirbnbName: initialData?.hotelAirbnbName || '',
    contactNumber: initialData?.contactNumber || '',
  });

  const handleInputChange = (field: keyof DeliveryAddressData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.streetAddress || !formData.cityArea || !formData.contactNumber) {
      return;
    }
    onSave(formData);
    onClose();
  };

  const isValid = formData.streetAddress.trim() && formData.cityArea.trim() && formData.contactNumber.trim();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Dirección de entrega
          </SheetTitle>
          <SheetDescription>
            Ingresa la dirección donde deseas recibir tu paquete.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Street address */}
          <div className="space-y-2">
            <Label htmlFor="sheet-streetAddress" className="text-sm font-medium">
              Dirección completa *
            </Label>
            <div className="relative">
              <Home className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="sheet-streetAddress"
                placeholder="Ej: 15 Avenida 14-44, Zona 10"
                value={formData.streetAddress}
                onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Incluye número de casa, avenida/calle, zona
            </p>
          </div>

          {/* City / Area */}
          <div className="space-y-2">
            <Label htmlFor="sheet-cityArea" className="text-sm font-medium">
              {locationLabel} *
            </Label>
            {hasDropdown ? (
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Select
                  value={formData.cityArea}
                  onValueChange={(value) => handleInputChange('cityArea', value)}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder={`Selecciona ${isGuatemalaCityDept ? 'tu municipio' : 'tu provincia'}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-[60]">
                    {locationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="sheet-cityArea"
                  placeholder="Ej: Ciudad, provincia o estado"
                  value={formData.cityArea}
                  onChange={(e) => handleInputChange('cityArea', e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="sheet-hotelAirbnbName" className="text-sm font-medium">
              Referencia / Condominio / Edificio (opcional)
            </Label>
            <Input
              id="sheet-hotelAirbnbName"
              placeholder="Ej: Edificio Europlaza, Torre 2"
              value={formData.hotelAirbnbName}
              onChange={(e) => handleInputChange('hotelAirbnbName', e.target.value)}
            />
          </div>

          {/* Contact number */}
          <div className="space-y-2">
            <Label htmlFor="sheet-contactNumber" className="text-sm font-medium">
              Número de contacto *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="sheet-contactNumber"
                type="tel"
                placeholder="Ej: +502 1234-5678"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Número donde pueden contactarte para coordinar la entrega
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="button"
              variant="shopper"
              className="flex-1"
              onClick={handleSave}
              disabled={!isValid}
            >
              Confirmar Dirección
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DeliveryAddressSheet;
