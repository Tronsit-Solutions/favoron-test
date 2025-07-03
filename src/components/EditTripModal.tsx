import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plane, MapPin, Package, Phone, Building2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tripData: any) => void;
  tripData: any;
}

const EditTripModal = ({ isOpen, onClose, onSubmit, tripData }: EditTripModalProps) => {
  const [formData, setFormData] = useState({
    fromCity: tripData?.fromCity || '',
    fromCityOther: tripData?.fromCityOther || '',
    fromCountry: tripData?.fromCountry || '',
    toCity: tripData?.toCity || '',
    toCityOther: tripData?.toCityOther || '',
    toCountry: tripData?.toCountry || 'Guatemala',
    arrivalDate: tripData?.arrivalDate ? new Date(tripData.arrivalDate) : null as Date | null,
    availableSpace: tripData?.availableSpace?.toString() || '',
    deliveryMethod: tripData?.deliveryMethod || '',
    deliveryDate: tripData?.deliveryDate ? new Date(tripData.deliveryDate) : null as Date | null,
    additionalInfo: tripData?.additionalInfo || '',
    packageReceivingAddress: {
      accommodationType: tripData?.packageReceivingAddress?.accommodationType || '',
      streetAddress: tripData?.packageReceivingAddress?.streetAddress || '',
      cityArea: tripData?.packageReceivingAddress?.cityArea || '',
      postalCode: tripData?.packageReceivingAddress?.postalCode || '',
      hotelAirbnbName: tripData?.packageReceivingAddress?.hotelAirbnbName || '',
      contactNumber: tripData?.packageReceivingAddress?.contactNumber || ''
    },
    firstDayPackages: tripData?.firstDayPackages ? new Date(tripData.firstDayPackages) : null as Date | null,
    lastDayPackages: tripData?.lastDayPackages ? new Date(tripData.lastDayPackages) : null as Date | null,
    messengerPickupLocation: tripData?.messengerPickupLocation || ''
  });

  const popularCities = [
    'Miami, FL',
    'Los Angeles, CA',
    'New York, NY',
    'Houston, TX',
    'Madrid, España',
    'Barcelona, España',
    'Ciudad de México',
    'San Salvador',
    'Otra ciudad'
  ];

  const guatemalanCities = [
    'Guatemala City',
    'Antigua Guatemala',
    'Quetzaltenango',
    'Escuintla',
    'Otra ciudad'
  ];

  const countries = [
    'Estados Unidos',
    'España',
    'México',
    'El Salvador',
    'Honduras',
    'Costa Rica',
    'Otro país'
  ];

  const accommodationTypes = [
    { value: 'hotel', label: 'Hotel/Hostal' },
    { value: 'airbnb', label: 'Airbnb' },
    { value: 'casa', label: 'Casa/Apartamento' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalFromCity = formData.fromCity === 'Otra ciudad' ? formData.fromCityOther : formData.fromCity;
    const finalToCity = formData.toCity === 'Otra ciudad' ? formData.toCityOther : formData.toCity;
    
    if (!finalFromCity || !finalToCity || !formData.arrivalDate || !formData.availableSpace || 
        !formData.deliveryMethod || !formData.deliveryDate || !formData.packageReceivingAddress.accommodationType ||
        !formData.packageReceivingAddress.streetAddress || !formData.packageReceivingAddress.cityArea || 
        !formData.packageReceivingAddress.postalCode || !formData.packageReceivingAddress.contactNumber || 
        !formData.firstDayPackages || !formData.lastDayPackages || !formData.fromCountry) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const submitData = {
      id: tripData.id,
      ...formData,
      fromCity: finalFromCity,
      toCity: finalToCity
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      packageReceivingAddress: {
        ...prev.packageReceivingAddress,
        [field]: value
      }
    }));
  };

  const displayToCity = formData.toCity === 'Otra ciudad' ? formData.toCityOther : formData.toCity;

  if (!tripData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plane className="h-5 w-5 text-accent" />
            <span>Editar Viaje #{tripData.id}</span>
          </DialogTitle>
          <DialogDescription>
            Modifica la información de tu viaje registrado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fromCountry">País de origen *</Label>
            <Select value={formData.fromCountry} onValueChange={(value) => handleInputChange('fromCountry', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el país de origen" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{country}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromCity">Ciudad de origen *</Label>
            <Select value={formData.fromCity} onValueChange={(value) => handleInputChange('fromCity', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la ciudad de origen" />
              </SelectTrigger>
              <SelectContent>
                {popularCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{city}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.fromCity === 'Otra ciudad' && (
              <Input
                placeholder="Escribe tu ciudad de origen"
                value={formData.fromCityOther}
                onChange={(e) => handleInputChange('fromCityOther', e.target.value)}
                className="mt-2"
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="toCity">Ciudad de destino *</Label>
            <Select value={formData.toCity} onValueChange={(value) => handleInputChange('toCity', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la ciudad de destino" />
              </SelectTrigger>
              <SelectContent>
                {guatemalanCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{city}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.toCity === 'Otra ciudad' && (
              <Input
                placeholder="Escribe tu ciudad de destino"
                value={formData.toCityOther}
                onChange={(e) => handleInputChange('toCityOther', e.target.value)}
                className="mt-2"
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Fecha de llegada a {displayToCity || 'destino'} *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.arrivalDate ? (
                    format(formData.arrivalDate, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona fecha de llegada</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.arrivalDate || undefined}
                  onSelect={(date) => handleInputChange('arrivalDate', date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="availableSpace">Espacio disponible (kg) *</Label>
            <div className="relative">
              <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="availableSpace"
                type="number"
                step="0.5"
                placeholder="5.0"
                value={formData.availableSpace}
                onChange={(e) => handleInputChange('availableSpace', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Package Receiving Address Section */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
            <div className="flex items-center space-x-2 mb-3">
              <Package className="h-5 w-5 text-primary" />
              <Label className="text-lg font-medium">Dirección para recibir paquetes *</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accommodationType">Tipo de alojamiento *</Label>
              <Select value={formData.packageReceivingAddress.accommodationType} onValueChange={(value) => handleAddressChange('accommodationType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de alojamiento" />
                </SelectTrigger>
                <SelectContent>
                  {accommodationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetAddress">Dirección completa *</Label>
              <Input
                id="streetAddress"
                type="text"
                placeholder="Ej: 123 Main Street, Apt 4B"
                value={formData.packageReceivingAddress.streetAddress}
                onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cityArea">Ciudad/Estado *</Label>
                <Input
                  id="cityArea"
                  type="text"
                  placeholder="Ej: Miami, FL"
                  value={formData.packageReceivingAddress.cityArea}
                  onChange={(e) => handleAddressChange('cityArea', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Código postal *</Label>
                <Input
                  id="postalCode"
                  type="text"
                  placeholder="Ej: 33101"
                  value={formData.packageReceivingAddress.postalCode}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotelAirbnbName">Nombre del {formData.packageReceivingAddress.accommodationType === 'hotel' ? 'hotel/hostal' : formData.packageReceivingAddress.accommodationType === 'airbnb' ? 'Airbnb' : 'lugar'} *</Label>
              <Input
                id="hotelAirbnbName"
                type="text"
                placeholder="Ej: Hotel InterContinental Miami"
                value={formData.packageReceivingAddress.hotelAirbnbName}
                onChange={(e) => handleAddressChange('hotelAirbnbName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Número de contacto *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="+1 (305) 123-4567"
                  value={formData.packageReceivingAddress.contactNumber}
                  onChange={(e) => handleAddressChange('contactNumber', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primer día para recibir paquetes *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.firstDayPackages ? (
                        format(formData.firstDayPackages, "dd/MM", { locale: es })
                      ) : (
                        <span className="text-xs">Fecha inicio</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.firstDayPackages || undefined}
                      onSelect={(date) => handleInputChange('firstDayPackages', date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Último día para recibir paquetes *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.lastDayPackages ? (
                        format(formData.lastDayPackages, "dd/MM", { locale: es })
                      ) : (
                        <span className="text-xs">Fecha fin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.lastDayPackages || undefined}
                      onSelect={(date) => handleInputChange('lastDayPackages', date)}
                      disabled={(date) => date < new Date() || (formData.firstDayPackages ? date < formData.firstDayPackages : false)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Delivery Method Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Método de entrega en Guatemala *</Label>
            <RadioGroup 
              value={formData.deliveryMethod} 
              onValueChange={(value) => handleInputChange('deliveryMethod', value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="cursor-pointer">
                  Recojo en zona 14 (Oficina Favorón)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="cursor-pointer">
                  Entrega a domicilio
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Fecha estimada de entrega en oficina Favorón *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deliveryDate ? (
                    format(formData.deliveryDate, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona fecha de entrega</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.deliveryDate || undefined}
                  onSelect={(date) => handleInputChange('deliveryDate', date)}
                  disabled={(date) => date < new Date() || (formData.arrivalDate ? date < formData.arrivalDate : false)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Información adicional</Label>
            <Textarea
              id="additionalInfo"
              placeholder="Horarios de disponibilidad, restricciones, comentarios especiales..."
              value={formData.additionalInfo}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTripModal;