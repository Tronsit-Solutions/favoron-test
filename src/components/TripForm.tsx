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
import MessengerPickupForm from "@/components/MessengerPickupForm";

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
      streetAddress2: '',
      cityArea: '',
      postalCode: '',
      hotelAirbnbName: '',
      contactNumber: ''
    },
    firstDayPackages: null as Date | null,
    lastDayPackages: null as Date | null,
    messengerPickupLocation: ''
  });
  
  const [showMessengerForm, setShowMessengerForm] = useState(false);
  const [messengerData, setMessengerData] = useState(null);

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

    // Validar información de mensajero si seleccionó mensajero
    if (formData.deliveryMethod === 'mensajero' && !messengerData) {
      alert('Por favor completa la información de recolección por mensajero');
      return;
    }

    const submitData = {
      ...formData,
      fromCity: finalFromCity,
      toCity: finalToCity,
      messengerPickupInfo: formData.deliveryMethod === 'mensajero' ? messengerData : null
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
        streetAddress2: '',
        cityArea: '',
        postalCode: '',
        hotelAirbnbName: '',
        contactNumber: ''
      },
      firstDayPackages: null,
      lastDayPackages: null,
      messengerPickupLocation: ''
    });
    setShowMessengerForm(false);
    setMessengerData(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mostrar formulario de mensajero si selecciona mensajero
    if (field === 'deliveryMethod') {
      if (value === 'mensajero') {
        setShowMessengerForm(true);
      } else {
        setShowMessengerForm(false);
        setMessengerData(null);
      }
    }
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

  const handleMessengerSubmit = (pickupData: any) => {
    setMessengerData(pickupData);
    setShowMessengerForm(false);
  };

  const handleMessengerCancel = () => {
    setShowMessengerForm(false);
    setFormData(prev => ({ ...prev, deliveryMethod: '' }));
  };

  const displayToCity = formData.toCity === 'Otra ciudad' ? formData.toCityOther : formData.toCity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plane className="h-5 w-5 text-traveler" />
            <span>Registrar Nuevo Viaje</span>
          </DialogTitle>
          <DialogDescription>
            Llévate paquetes en tu próximo viaje y ayuda a otros mientras ganas dinero extra.
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
            <p className="text-xs text-muted-foreground">
              ¿Desde dónde viajas?
            </p>
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
            <p className="text-xs text-muted-foreground">
              ¿Cuántos kilos puedes cargar? (Promedio: 3-8 kg)
            </p>
          </div>

          {/* Package Receiving Address Section - UPDATED with separated postal code */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
            <div className="flex items-center space-x-2 mb-3">
              <Package className="h-5 w-5 text-primary" />
              <Label className="text-lg font-medium">Dirección para recibir paquetes *</Label>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Importante:</strong> Los paquetes se enviarán aquí. Esta información solo se compartirá con los shoppers cuando apruebes sus pedidos.
            </p>

            <div className="space-y-2">
              <Label htmlFor="recipientName">Nombre de la persona que recibe el paquete *</Label>
              <Input
                id="recipientName"
                type="text"
                placeholder="Ej: Juan Pérez"
                value={formData.packageReceivingAddress.recipientName}
                onChange={(e) => handleAddressChange('recipientName', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Nombre completo de quien recibirá los paquetes en tu {formData.packageReceivingAddress.accommodationType || 'alojamiento'}
              </p>
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
              <Label htmlFor="streetAddress">Dirección línea 1 *</Label>
              <Input
                id="streetAddress"
                type="text"
                placeholder="Ej: 123 Main Street"
                value={formData.packageReceivingAddress.streetAddress}
                onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetAddress2">Dirección línea 2 (opcional)</Label>
              <Input
                id="streetAddress2"
                type="text"
                placeholder="Ej: Apt 4B, Suite 100"
                value={formData.packageReceivingAddress.streetAddress2}
                onChange={(e) => handleAddressChange('streetAddress2', e.target.value)}
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
                <p className="text-xs text-muted-foreground">
                  Muy importante para el envío internacional
                </p>
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
              <Label htmlFor="contactNumber">Número de contacto en {formData.fromCity === 'Otra ciudad' ? formData.fromCityOther : formData.fromCity || 'ciudad de origen'} *</Label>
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
              <div className="text-xs text-muted-foreground space-y-1">
                <p>(Si te quedas en hotel, pon el número del hotel)</p>
                <p>Esta información solo se compartirá con los shoppers cuando apruebes sus pedidos.</p>
              </div>
            </div>

            {/* New package receiving date fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primer día para recibir paquetes *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
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
            <Label className="text-base font-medium">¿Cómo vas a entregar los paquetes en {displayToCity || 'destino'}? *</Label>
            <RadioGroup 
              value={formData.deliveryMethod} 
              onValueChange={(value) => handleInputChange('deliveryMethod', value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oficina" id="oficina" />
                <Label htmlFor="oficina" className="cursor-pointer">
                  Llevaré los paquetes a la oficina de Favorón
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mensajero" id="mensajero" />
                <Label htmlFor="mensajero" className="cursor-pointer">
                  Que los recoja un mensajero
                </Label>
              </div>
            </RadioGroup>
            
            
            {/* Mostrar formulario de mensajero si seleccionó mensajero */}
            {showMessengerForm && (
              <MessengerPickupForm
                onSubmit={handleMessengerSubmit}
                onCancel={handleMessengerCancel}
                initialData={messengerData}
              />
            )}
            
            {/* Mostrar resumen de información si ya la completó */}
            {formData.deliveryMethod === 'mensajero' && messengerData && !showMessengerForm && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm font-medium text-green-800 mb-1">✓ Información de recolección confirmada</p>
                <p className="text-xs text-green-700">{messengerData.streetAddress}, {messengerData.cityArea}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMessengerForm(true)}
                  className="mt-2"
                >
                  Editar información
                </Button>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 rounded p-3">
              📌 <strong>Nota:</strong> El servicio de mensajero tiene un costo de Q25 a Q40 para el remitente (válido solo en Ciudad de Guatemala y municipios cercanos).
            </p>
          </div>

          {/* Delivery Date Field */}
          <div className="space-y-2">
            <Label>¿En qué fecha vas a entregar los paquetes? *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
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
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Información adicional</Label>
            <Textarea
              id="additionalInfo"
              placeholder="Horarios disponibles, zonas de entrega, experiencia previa, etc."
              value={formData.additionalInfo}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="bg-traveler/10 border border-traveler/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-traveler mt-0.5" />
              <div className="text-sm text-traveler">
                <p className="font-medium mb-1">¿Cómo funciona para viajeros?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Los compradores enviarán paquetes a tu {formData.packageReceivingAddress.accommodationType || 'alojamiento'} en {formData.fromCity === 'Otra ciudad' ? formData.fromCityOther : formData.fromCity || 'tu ciudad de origen'}</li>
                  <li>• Podrás cotizar el precio por traer cada paquete</li>
                  <li>• Al llegar a {displayToCity || 'destino'}, entregas según el método seleccionado</li>
                  <li>• Nosotros coordinamos la entrega final al comprador</li>
                  <li>• Ganas entre $20-100+ por viaje</li>
                </ul>
                <div className="mt-3 pt-2 border-t border-traveler/20">
                  <p className="text-xs font-medium text-traveler">
                    🔒 Tu dirección no será compartida con nadie hasta que apruebes un pedido.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="secondary" className="flex-1">
              Registrar Viaje
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TripForm;
