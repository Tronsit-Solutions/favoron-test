
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
import { CalendarIcon, Package, Link2, DollarSign, AlertCircle, MapPin, Globe } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PackageRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (packageData: any) => void;
}

const PackageRequestForm = ({ isOpen, onClose, onSubmit }: PackageRequestFormProps) => {
  const [formData, setFormData] = useState({
    itemLink: '',
    itemDescription: '',
    estimatedPrice: '',
    deliveryDeadline: null as Date | null,
    additionalNotes: '',
    packageDestination: '',
    packageDestinationOther: '',
    purchaseOrigin: '',
    purchaseOriginOther: '',
    deliveryMethod: ''
  });

  const destinationCities = [
    'Guatemala City',
    'Antigua Guatemala',
    'Quetzaltenango',
    'Escuintla',
    'Otra ciudad'
  ];

  const purchaseOrigins = [
    { value: 'USA', label: 'USA' },
    { value: 'España', label: 'España' },
    { value: 'México', label: 'México' },
    { value: 'Otro', label: 'Otro' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalDestination = formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination;
    const finalOrigin = formData.purchaseOrigin === 'Otro' ? formData.purchaseOriginOther : formData.purchaseOrigin;
    
    if (!formData.itemLink || !formData.itemDescription || !formData.estimatedPrice || 
        !formData.deliveryDeadline || !finalDestination || !finalOrigin) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar delivery method si destino es Guatemala
    if (finalDestination.toLowerCase().includes('guatemala') && !formData.deliveryMethod) {
      alert('Por favor selecciona cómo quieres recibir tu paquete en Guatemala');
      return;
    }

    const submitData = {
      ...formData,
      packageDestination: finalDestination,
      purchaseOrigin: finalOrigin
    };

    onSubmit(submitData);
    
    // Reset form
    setFormData({
      itemLink: '',
      itemDescription: '',
      estimatedPrice: '',
      deliveryDeadline: null,
      additionalNotes: '',
      packageDestination: '',
      packageDestinationOther: '',
      purchaseOrigin: '',
      purchaseOriginOther: '',
      deliveryMethod: ''
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isGuatemalaDestination = (formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination)?.toLowerCase().includes('guatemala');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-primary" />
            <span>Nueva Solicitud de Paquete</span>
          </DialogTitle>
          <DialogDescription>
            Completa la información del producto que necesitas. Nuestro equipo revisará tu solicitud.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="itemLink">Link del producto *</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="itemLink"
                type="url"
                placeholder="https://amazon.com/producto..."
                value={formData.itemLink}
                onChange={(e) => handleInputChange('itemLink', e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Copia el link del producto desde Amazon, eBay, u otra tienda online
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemDescription">Descripción del producto *</Label>
            <Textarea
              id="itemDescription"
              placeholder="Ejemplo: iPhone 15 Pro Max 256GB Color Azul Titanio"
              value={formData.itemDescription}
              onChange={(e) => handleInputChange('itemDescription', e.target.value)}
              className="min-h-[80px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              Describe detalladamente el producto (marca, modelo, color, talla, etc.)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedPrice">Precio estimado (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="estimatedPrice"
                type="number"
                step="0.01"
                placeholder="299.99"
                value={formData.estimatedPrice}
                onChange={(e) => handleInputChange('estimatedPrice', e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Precio aproximado del producto sin incluir envío
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageDestination">Destino del paquete *</Label>
            <Select value={formData.packageDestination} onValueChange={(value) => handleInputChange('packageDestination', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el destino del paquete" />
              </SelectTrigger>
              <SelectContent>
                {destinationCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{city}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.packageDestination === 'Otra ciudad' && (
              <Input
                placeholder="Escribe la ciudad de destino"
                value={formData.packageDestinationOther}
                onChange={(e) => handleInputChange('packageDestinationOther', e.target.value)}
                className="mt-2"
                required
              />
            )}
            <p className="text-xs text-muted-foreground">
              ¿A dónde necesitas que llegue el paquete?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseOrigin">Origen de la compra *</Label>
            <Select value={formData.purchaseOrigin} onValueChange={(value) => handleInputChange('purchaseOrigin', value)}>
              <SelectTrigger>
                <SelectValue placeholder="¿Desde qué país estás comprando?" />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrigins.map((origin) => (
                  <SelectItem key={origin.value} value={origin.value}>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>{origin.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.purchaseOrigin === 'Otro' && (
              <Input
                placeholder="Escribe el país de origen"
                value={formData.purchaseOriginOther}
                onChange={(e) => handleInputChange('purchaseOriginOther', e.target.value)}
                className="mt-2"
                required
              />
            )}
            <p className="text-xs text-muted-foreground">
              ¿Desde qué país estás comprando tu producto?
            </p>
          </div>

          {/* Delivery method for Guatemala only */}
          {isGuatemalaDestination && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Forma de entrega en Guatemala *</Label>
              <RadioGroup 
                value={formData.deliveryMethod} 
                onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="cursor-pointer">
                    Lo recojo en zona 14
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="cursor-pointer">
                    Enviarlo a mi domicilio
                  </Label>
                </div>
              </RadioGroup>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  📌 <strong>Nota:</strong> El envío a domicilio tiene un costo adicional entre Q25 y Q40 (solo válido en Ciudad de Guatemala y municipios cercanos).
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Fecha límite de entrega *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deliveryDeadline ? (
                    format(formData.deliveryDeadline, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.deliveryDeadline || undefined}
                  onSelect={(date) => handleInputChange('deliveryDeadline', date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              ¿Para cuándo necesitas el producto?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Notas adicionales</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Información adicional, instrucciones especiales, preferencias de entrega, etc."
              value={formData.additionalNotes}
              onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">¿Cómo funciona?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Revisaremos tu solicitud en 24-48 horas</li>
                  <li>• Te conectaremos con viajeros disponibles</li>
                  <li>• Recibirás cotizaciones y podrás elegir</li>
                  <li>• Solo pagas cuando aceptes una cotización</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Enviar Solicitud
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PackageRequestForm;
