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
import { CalendarIcon, Package, Link2, DollarSign, AlertCircle, MapPin, Globe, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AddressForm from "@/components/AddressForm";

interface PackageRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (packageData: any) => void;
}

interface Product {
  itemLink: string;
  itemDescription: string;
  estimatedPrice: string;
  quantity: string;
}

const PackageRequestForm = ({ isOpen, onClose, onSubmit }: PackageRequestFormProps) => {
  const [product, setProduct] = useState<Product>({
    itemLink: '',
    itemDescription: '',
    estimatedPrice: '',
    quantity: '1'
  });
  const [formData, setFormData] = useState({
    deliveryDeadline: null as Date | null,
    additionalNotes: '',
    packageDestination: '',
    packageDestinationOther: '',
    purchaseOrigin: '',
    purchaseOriginOther: '',
    deliveryMethod: ''
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressData, setAddressData] = useState(null);

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
    
    // Validate product
    if (!product.itemLink || !product.itemDescription || !product.estimatedPrice || !finalDestination || !finalOrigin) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar delivery method si destino es Guatemala
    if (finalDestination.toLowerCase().includes('guatemala') && !formData.deliveryMethod) {
      alert('Por favor selecciona cómo quieres recibir tu paquete en Guatemala');
      return;
    }

    // Validar dirección si seleccionó delivery
    if (formData.deliveryMethod === 'delivery' && !addressData) {
      alert('Por favor completa la información de entrega a domicilio');
      return;
    }

    const submitData = {
      ...formData,
      // Send single product in array format for compatibility
      products: [product],
      packageDestination: finalDestination,
      purchaseOrigin: finalOrigin,
      deliveryAddress: formData.deliveryMethod === 'delivery' ? addressData : null,
      deliveryMethod: formData.deliveryMethod
    };

    onSubmit(submitData);
    
    // Reset form
    setProduct({
      itemLink: '',
      itemDescription: '',
      estimatedPrice: '',
      quantity: '1'
    });
    setFormData({
      deliveryDeadline: null,
      additionalNotes: '',
      packageDestination: '',
      packageDestinationOther: '',
      purchaseOrigin: '',
      purchaseOriginOther: '',
      deliveryMethod: ''
    });
    setShowAddressForm(false);
    setAddressData(null);
  };

  const updateProduct = (field: keyof Product, value: string) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mostrar formulario de dirección si selecciona delivery
    if (field === 'deliveryMethod') {
      if (value === 'delivery') {
        setShowAddressForm(true);
      } else {
        setShowAddressForm(false);
        setAddressData(null);
      }
    }
  };

  const handleAddressSubmit = (address: any) => {
    setAddressData(address);
    setShowAddressForm(false);
  };

  const handleAddressCancel = () => {
    setShowAddressForm(false);
    setFormData(prev => ({ ...prev, deliveryMethod: '' }));
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
          <div className="space-y-4">
            <Label className="text-base font-medium">Producto *</Label>
            
            <div className="border border-gray-200 rounded-lg p-3 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="itemLink" className="text-sm">Link del producto *</Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="itemLink"
                    type="url"
                    placeholder="https://amazon.com/producto..."
                    value={product.itemLink}
                    onChange={(e) => updateProduct('itemLink', e.target.value)}
                    className="pl-10 h-9"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Copia el link del producto desde Amazon, eBay, u otra tienda online
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="itemDescription" className="text-sm">Descripción del producto *</Label>
                <Textarea
                  id="itemDescription"
                  placeholder="Ejemplo: iPhone 15 Pro Max 256GB Color Azul Titanio"
                  value={product.itemDescription}
                  onChange={(e) => updateProduct('itemDescription', e.target.value)}
                  className="min-h-[36px] resize-y"
                  rows={1}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Describe detalladamente el producto (marca, modelo, color, talla, etc.)
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="estimatedPrice" className="text-sm">Precio estimado (USD) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="estimatedPrice"
                    type="number"
                    step="0.01"
                    placeholder="299.99"
                    value={product.estimatedPrice}
                    onChange={(e) => updateProduct('estimatedPrice', e.target.value)}
                    className="pl-10 h-9"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Precio aproximado del producto sin incluir envío
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="quantity" className="text-sm">Cantidad *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={product.quantity}
                  onChange={(e) => updateProduct('quantity', e.target.value)}
                  className="h-9"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  ¿Cuántas unidades necesitas? Si es un pack (varios productos juntos), cuenta como 1 unidad
                </p>
              </div>
            </div>
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
              
              {/* Mostrar formulario de dirección si seleccionó delivery */}
              {showAddressForm && (
                <AddressForm
                  onSubmit={handleAddressSubmit}
                  onCancel={handleAddressCancel}
                  initialData={addressData}
                />
              )}
              
              {/* Mostrar resumen de dirección si ya la completó */}
              {formData.deliveryMethod === 'delivery' && addressData && !showAddressForm && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm font-medium text-green-800 mb-1">✓ Dirección de entrega confirmada</p>
                  <p className="text-xs text-green-700">{addressData.streetAddress}, {addressData.cityArea}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressForm(true)}
                    className="mt-2"
                  >
                    Editar dirección
                  </Button>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  📌 <strong>Nota:</strong> El envío a domicilio tiene un costo adicional de Q25 (solo válido en Ciudad de Guatemala y municipios cercanos).
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Fecha límite de entrega</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deliveryDeadline ? (
                    format(formData.deliveryDeadline, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona una fecha (opcional)</span>
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
              ¿Para cuándo necesitas el producto? (opcional)
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
            <Button type="submit" variant="shopper" className="flex-1">
              Enviar Solicitud
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PackageRequestForm;
