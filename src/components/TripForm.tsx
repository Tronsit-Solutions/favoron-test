import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plane, MapPin, Package, Home, AlertCircle, Phone } from "lucide-react";
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
    toCity: 'Guatemala City',
    arrivalDate: null as Date | null,
    availableSpace: '',
    deliveryMethod: '',
    additionalInfo: '',
    deliveryAddress: {
      streetAddress: '',
      cityArea: '',
      hotelAirbnbName: '',
      contactNumber: ''
    }
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

  const deliveryMethods = [
    'Entrega en domicilio',
    'Entrega en hotel/Airbnb',
    'Punto de encuentro público',
    'Oficina de courier'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromCity || !formData.arrivalDate || !formData.availableSpace || !formData.deliveryMethod ||
        !formData.deliveryAddress.streetAddress || !formData.deliveryAddress.cityArea || !formData.deliveryAddress.contactNumber) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    onSubmit(formData);
    setFormData({
      fromCity: '',
      toCity: 'Guatemala City',
      arrivalDate: null,
      availableSpace: '',
      deliveryMethod: '',
      additionalInfo: '',
      deliveryAddress: {
        streetAddress: '',
        cityArea: '',
        hotelAirbnbName: '',
        contactNumber: ''
      }
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryAddress: {
        ...prev.deliveryAddress,
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plane className="h-5 w-5 text-accent" />
            <span>Registrar Nuevo Viaje</span>
          </DialogTitle>
          <DialogDescription>
            Registra tu próximo viaje a Guatemala y ayuda a otros mientras ganas dinero extra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <p className="text-xs text-muted-foreground">
              ¿Desde dónde viajas?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toCity">Ciudad de destino</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="toCity"
                type="text"
                value={formData.toCity}
                onChange={(e) => handleInputChange('toCity', e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Generalmente Guatemala City, pero puedes especificar otra ciudad
            </p>
          </div>

          <div className="space-y-2">
            <Label>Fecha de llegada a Guatemala *</Label>
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

          {/* Delivery Address Section */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
            <div className="flex items-center space-x-2 mb-3">
              <Home className="h-5 w-5 text-primary" />
              <Label className="text-lg font-medium">Dirección de entrega en Guatemala *</Label>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Esta será la dirección donde los compradores enviarán los paquetes. Solo necesitas completarla una vez.
            </p>

            <div className="space-y-2">
              <Label htmlFor="streetAddress">Dirección completa *</Label>
              <Input
                id="streetAddress"
                type="text"
                placeholder="Ej: 5ta Avenida 12-34, Zona 10"
                value={formData.deliveryAddress.streetAddress}
                onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityArea">Ciudad/Área *</Label>
              <Input
                id="cityArea"
                type="text"
                placeholder="Ej: Guatemala City, Zona 10"
                value={formData.deliveryAddress.cityArea}
                onChange={(e) => handleAddressChange('cityArea', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotelAirbnbName">Nombre del hotel/Airbnb (opcional)</Label>
              <Input
                id="hotelAirbnbName"
                type="text"
                placeholder="Ej: Hotel Casa Santo Domingo"
                value={formData.deliveryAddress.hotelAirbnbName}
                onChange={(e) => handleAddressChange('hotelAirbnbName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Número de contacto *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="+502 1234-5678"
                  value={formData.deliveryAddress.contactNumber}
                  onChange={(e) => handleAddressChange('contactNumber', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryMethod">Método de entrega preferido *</Label>
            <Select value={formData.deliveryMethod} onValueChange={(value) => handleInputChange('deliveryMethod', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona método de entrega" />
              </SelectTrigger>
              <SelectContent>
                {deliveryMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4" />
                      <span>{method}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              ¿Cómo prefieres hacer las entregas finales a los compradores?
            </p>
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

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">¿Cómo funciona para viajeros?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Los compradores enviarán paquetes a tu dirección de entrega</li>
                  <li>• Podrás cotizar el precio por traer cada paquete</li>
                  <li>• Ganas entre $20-100+ por viaje</li>
                  <li>• Te ayudamos con el proceso completo de entrega</li>
                </ul>
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
