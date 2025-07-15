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
import { CalendarIcon, Plane, MapPin, Package, AlertCircle, Phone, Building2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TripFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tripData: any) => void;
}

const TripForm = ({ isOpen, onClose, onSubmit }: TripFormProps) => {
  const [formData, setFormData] = useState({
    fromCity: '',
    fromCityOther: '',
    fromCountry: '',
    toCity: '',
    toCityOther: '',
    toCountry: 'Guatemala',
    arrivalDate: null as Date | null,
    availableSpace: '',
    deliveryMethod: '',
    deliveryDate: null as Date | null,
    additionalInfo: '',
    packageReceivingAddress: {
      recipientName: '',
      accommodationType: '',
      streetAddress: '',
      cityArea: '',
      postalCode: '',
      hotelAirbnbName: '',
      contactNumber: ''
    },
    firstDayPackages: null as Date | null,
    lastDayPackages: null as Date | null,
    messengerPickupLocation: ''
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
        !formData.deliveryMethod || !formData.deliveryDate || !formData.packageReceivingAddress.recipientName ||
        !formData.packageReceivingAddress.accommodationType || !formData.packageReceivingAddress.streetAddress || 
        !formData.packageReceivingAddress.cityArea || !formData.packageReceivingAddress.postalCode || 
        !formData.packageReceivingAddress.contactNumber || !formData.firstDayPackages || !formData.lastDayPackages || !formData.fromCountry) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const submitData = {
      ...formData,
      fromCity: finalFromCity,
      toCity: finalToCity
    };

    onSubmit(submitData);
    
    // Reset form
    setFormData({
      fromCity: '',
      fromCityOther: '',
      fromCountry: '',
      toCity: '',
      toCityOther: '',
      toCountry: 'Guatemala',
      arrivalDate: null,
      availableSpace: '',
      deliveryMethod: '',
      deliveryDate: null,
      additionalInfo: '',
      packageReceivingAddress: {
        recipientName: '',
        accommodationType: '',
        streetAddress: '',
        cityArea: '',
        postalCode: '',
        hotelAirbnbName: '',
        contactNumber: ''
      },
      firstDayPackages: null,
      lastDayPackages: null,
      messengerPickupLocation: ''
    });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-w-[98vw] max-h-[98vh] overflow-y-auto p-2 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4 border-b">
          <DialogTitle className="flex items-center space-x-2 text-base sm:text-xl">
            <Plane className="h-4 w-4 sm:h-5 sm:w-5 text-traveler flex-shrink-0" />
            <span className="truncate">Nuevo Viaje</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
            Registra tu viaje y gana dinero llevando paquetes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="fromCountry" className="text-xs font-medium">País de origen *</Label>
            <Select value={formData.fromCountry} onValueChange={(value) => handleInputChange('fromCountry', value)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="País de origen" />
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

          <div className="space-y-1">
            <Label htmlFor="fromCity" className="text-xs font-medium">Ciudad de origen *</Label>
            <Select value={formData.fromCity} onValueChange={(value) => handleInputChange('fromCity', value)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Ciudad de origen" />
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
                placeholder="Escribe tu ciudad"
                value={formData.fromCityOther}
                onChange={(e) => handleInputChange('fromCityOther', e.target.value)}
                className="h-9 text-sm"
                required
              />
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="toCity" className="text-xs font-medium">Ciudad de destino *</Label>
            <Select value={formData.toCity} onValueChange={(value) => handleInputChange('toCity', value)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Ciudad de destino" />
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
                placeholder="Escribe ciudad de destino"
                value={formData.toCityOther}
                onChange={(e) => handleInputChange('toCityOther', e.target.value)}
                className="h-9 text-sm"
                required
              />
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Fecha de llegada *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-9 text-sm"
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {formData.arrivalDate ? (
                    format(formData.arrivalDate, "dd/MM/yy", { locale: es })
                  ) : (
                    <span>Fecha de llegada</span>
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

          <div className="space-y-1">
            <Label htmlFor="availableSpace" className="text-xs font-medium">Espacio disponible (kg) *</Label>
            <div className="relative">
              <Package className="absolute left-3 top-2.5 h-3 w-3 text-muted-foreground" />
              <Input
                id="availableSpace"
                type="number"
                step="0.5"
                placeholder="5.0"
                value={formData.availableSpace}
                onChange={(e) => handleInputChange('availableSpace', e.target.value)}
                className="pl-9 h-9 text-sm"
                required
              />
            </div>
          </div>

          {/* Package Receiving Address Section */}
          <div className="border rounded-lg p-3 space-y-3 bg-muted/10">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Dirección para recibir paquetes *</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Importante:</strong> Los paquetes se enviarán aquí.
            </p>

            <div className="space-y-1">
              <Label htmlFor="recipientName" className="text-xs font-medium">Nombre del receptor *</Label>
              <Input
                id="recipientName"
                type="text"
                placeholder="Juan Pérez"
                value={formData.packageReceivingAddress.recipientName}
                onChange={(e) => handleAddressChange('recipientName', e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="accommodationType" className="text-xs font-medium">Tipo de alojamiento *</Label>
              <Select value={formData.packageReceivingAddress.accommodationType} onValueChange={(value) => handleAddressChange('accommodationType', value)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Tipo de alojamiento" />
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

            <div className="space-y-1">
              <Label htmlFor="streetAddress" className="text-xs font-medium">Dirección completa *</Label>
              <Input
                id="streetAddress"
                type="text"
                placeholder="123 Main Street, Apt 4B"
                value={formData.packageReceivingAddress.streetAddress}
                onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cityArea" className="text-xs font-medium">Ciudad/Estado *</Label>
                <Input
                  id="cityArea"
                  type="text"
                  placeholder="Miami, FL"
                  value={formData.packageReceivingAddress.cityArea}
                  onChange={(e) => handleAddressChange('cityArea', e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="postalCode" className="text-xs font-medium">Código postal *</Label>
                <Input
                  id="postalCode"
                  type="text"
                  placeholder="33101"
                  value={formData.packageReceivingAddress.postalCode}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="hotelAirbnbName" className="text-xs font-medium">Nombre del {formData.packageReceivingAddress.accommodationType === 'hotel' ? 'hotel' : formData.packageReceivingAddress.accommodationType === 'airbnb' ? 'Airbnb' : 'lugar'} *</Label>
              <Input
                id="hotelAirbnbName"
                type="text"
                placeholder="Hotel InterContinental Miami"
                value={formData.packageReceivingAddress.hotelAirbnbName}
                onChange={(e) => handleAddressChange('hotelAirbnbName', e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contactNumber" className="text-xs font-medium">Número de contacto *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="+1 (305) 123-4567"
                  value={formData.packageReceivingAddress.contactNumber}
                  onChange={(e) => handleAddressChange('contactNumber', e.target.value)}
                  className="pl-9 h-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Primer día *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-9 text-sm"
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {formData.firstDayPackages ? (
                        format(formData.firstDayPackages, "dd/MM", { locale: es })
                      ) : (
                        <span className="text-xs">Inicio</span>
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

              <div className="space-y-1">
                <Label className="text-xs font-medium">Último día *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-9 text-sm"
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {formData.lastDayPackages ? (
                        format(formData.lastDayPackages, "dd/MM", { locale: es })
                      ) : (
                        <span className="text-xs">Fin</span>
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
          <div className="space-y-2">
            <Label className="text-xs font-medium">¿Cómo vas a entregar los paquetes? *</Label>
            <RadioGroup 
              value={formData.deliveryMethod} 
              onValueChange={(value) => handleInputChange('deliveryMethod', value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 border rounded p-2">
                <RadioGroupItem value="oficina" id="oficina" />
                <Label htmlFor="oficina" className="cursor-pointer text-sm">
                  A la oficina
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded p-2">
                <RadioGroupItem value="mensajero" id="mensajero" />
                <Label htmlFor="mensajero" className="cursor-pointer text-sm">
                  Mensajero
                </Label>
              </div>
            </RadioGroup>
            
            {formData.deliveryMethod === 'mensajero' && displayToCity?.toLowerCase().includes('guatemala') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <Label htmlFor="messengerPickup" className="text-xs font-medium text-yellow-800">
                  ¿Dónde recoger?
                </Label>
                <Input
                  id="messengerPickup"
                  type="text"
                  placeholder="Hotel Casa Santo Domingo, zona 10"
                  value={formData.messengerPickupLocation}
                  onChange={(e) => handleInputChange('messengerPickupLocation', e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>
            )}
            
            <p className="text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 rounded p-2">
              📌 Mensajero cuesta Q25-40 (solo Guatemala)
            </p>
          </div>

          {/* Delivery Date Field */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Fecha de entrega *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-9 text-sm"
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {formData.deliveryDate ? (
                    format(formData.deliveryDate, "dd/MM/yy", { locale: es })
                  ) : (
                    <span>Fecha de entrega</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.deliveryDate || undefined}
                  onSelect={(date) => handleInputChange('deliveryDate', date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label htmlFor="additionalInfo" className="text-xs font-medium">Información adicional</Label>
            <Textarea
              id="additionalInfo"
              placeholder="Horarios, experiencia previa, etc."
              value={formData.additionalInfo}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>

          <div className="bg-traveler/10 border border-traveler/30 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-traveler mt-0.5" />
              <div className="text-xs text-traveler">
                <p className="font-medium mb-1">¿Cómo funciona?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Paquetes llegan a tu alojamiento</li>
                  <li>• Cotizas precio por traer cada uno</li>
                  <li>• Entregas según método seleccionado</li>
                  <li>• Ganas $20-100+ por viaje</li>
                </ul>
                <p className="text-xs font-medium text-traveler mt-2">
                  🔒 Dirección privada hasta aprobar pedido
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-9 text-sm">
              Cancelar
            </Button>
            <Button type="submit" variant="secondary" className="flex-1 h-9 text-sm">
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TripForm;
