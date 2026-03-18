import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Phone, Home, Building2, Bookmark, Star } from "lucide-react";
import { GUATEMALA_MUNICIPALITIES, SPAIN_PROVINCES } from "@/lib/cities";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DeliveryAddressData {
  streetAddress: string;
  cityArea: string;
  hotelAirbnbName: string;
  contactNumber: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  streetAddress: string;
  cityArea: string;
  hotelAirbnbName: string;
  contactNumber: string;
  isDefault: boolean;
}

interface DeliveryAddressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DeliveryAddressData) => void;
  initialData?: Partial<DeliveryAddressData>;
  destinationCountry?: string;
  destinationCity?: string;
  userId?: string;
}

const ADDRESS_LABELS = ["Casa", "Oficina", "Otro"];

const DeliveryAddressSheet = ({ isOpen, onClose, onSave, initialData, destinationCountry, destinationCity, userId }: DeliveryAddressSheetProps) => {
  const normalizedCountry = destinationCountry?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
  const isGuatemala = normalizedCountry === 'guatemala';
  const isSpain = normalizedCountry === 'espana' || normalizedCountry === 'españa';
  const isGuatemalaCityDept = isGuatemala;
  const hasDropdown = isGuatemalaCityDept || isSpain;

  const locationOptions = isGuatemalaCityDept
    ? GUATEMALA_MUNICIPALITIES.map(m => ({ value: m.value, label: m.isCapital ? `${m.label} (Q25)` : `${m.label} (Q45)` }))
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

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Casa");
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const { toast } = useToast();

  // Fetch saved addresses when sheet opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchSavedAddresses();
    }
  }, [isOpen, userId]);

  const fetchSavedAddresses = async () => {
    if (!userId) return;
    setLoadingAddresses(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('saved_addresses')
        .eq('id', userId)
        .single();

      if (error) throw error;
      const addresses = (data?.saved_addresses as unknown as SavedAddress[]) || [];
      setSavedAddresses(addresses);

      // Auto-fill with default address if no initial data
      if (!initialData?.streetAddress && addresses.length > 0) {
        const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
        setFormData({
          streetAddress: defaultAddr.streetAddress,
          cityArea: defaultAddr.cityArea,
          hotelAirbnbName: defaultAddr.hotelAirbnbName || '',
          contactNumber: defaultAddr.contactNumber,
        });
      }
    } catch (err) {
      console.error('Error fetching saved addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const selectSavedAddress = (addr: SavedAddress) => {
    setFormData({
      streetAddress: addr.streetAddress,
      cityArea: addr.cityArea,
      hotelAirbnbName: addr.hotelAirbnbName || '',
      contactNumber: addr.contactNumber,
    });
    setSaveAddress(false);
  };

  const handleInputChange = (field: keyof DeliveryAddressData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const persistAddress = async () => {
    if (!userId) return;
    const newAddress: SavedAddress = {
      id: crypto.randomUUID(),
      label: addressLabel,
      streetAddress: formData.streetAddress,
      cityArea: formData.cityArea,
      hotelAirbnbName: formData.hotelAirbnbName,
      contactNumber: formData.contactNumber,
      isDefault: savedAddresses.length === 0,
    };

    const updatedAddresses = [...savedAddresses, newAddress];

    const { error } = await supabase
      .from('profiles')
      .update({ saved_addresses: updatedAddresses as unknown as any })
      .eq('id', userId);

    if (error) {
      console.error('Error saving address:', error);
      toast({ title: "Error al guardar dirección", variant: "destructive" });
    } else {
      setSavedAddresses(updatedAddresses);
      toast({ title: "Dirección guardada", description: `"${addressLabel}" guardada en tu perfil` });
    }
  };

  const handleSave = async () => {
    if (!formData.streetAddress || !formData.cityArea || !formData.contactNumber) {
      return;
    }
    if (saveAddress) {
      await persistAddress();
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
          {/* Saved addresses chips */}
          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Bookmark className="h-3.5 w-3.5" />
                Direcciones guardadas
              </Label>
              <div className="flex flex-wrap gap-2">
                {savedAddresses.map((addr) => (
                  <Button
                    key={addr.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 text-xs ${
                      formData.streetAddress === addr.streetAddress && formData.cityArea === addr.cityArea
                        ? 'border-primary bg-primary/10 text-primary'
                        : ''
                    }`}
                    onClick={() => selectSavedAddress(addr)}
                  >
                    {addr.isDefault && <Star className="h-3 w-3 fill-current" />}
                    {addr.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

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

          {/* Save address checkbox */}
          {userId && (
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="save-address"
                  checked={saveAddress}
                  onCheckedChange={(checked) => setSaveAddress(checked === true)}
                />
                <Label htmlFor="save-address" className="text-sm cursor-pointer">
                  Guardar esta dirección en mi perfil
                </Label>
              </div>
              {saveAddress && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nombre de la dirección</Label>
                  <div className="flex gap-2">
                    {ADDRESS_LABELS.map((l) => (
                      <Button
                        key={l}
                        type="button"
                        variant={addressLabel === l ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => setAddressLabel(l)}
                      >
                        {l}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
