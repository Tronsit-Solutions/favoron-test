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
}

const PackageRequestForm = ({ isOpen, onClose, onSubmit }: PackageRequestFormProps) => {
  const [products, setProducts] = useState<Product[]>([
    { itemLink: '', itemDescription: '', estimatedPrice: '' }
  ]);
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
    
    // Validate products
    const hasEmptyProducts = products.some(product => 
      !product.itemLink || !product.itemDescription || !product.estimatedPrice
    );
    
    if (hasEmptyProducts || !finalDestination || !finalOrigin) {
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
      products,
      packageDestination: finalDestination,
      purchaseOrigin: finalOrigin,
      deliveryAddress: formData.deliveryMethod === 'delivery' ? addressData : null
    };

    onSubmit(submitData);
    
    // Reset form
    setProducts([{ itemLink: '', itemDescription: '', estimatedPrice: '' }]);
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

  const addProduct = () => {
    setProducts([...products, { itemLink: '', itemDescription: '', estimatedPrice: '' }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: string) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setProducts(updatedProducts);
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
      <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[95vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Package className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="truncate">Nueva Solicitud de Paquete</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Completa la información del producto que necesitas. Nuestro equipo revisará tu solicitud.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pt-4">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label className="text-base font-medium">Productos *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProduct}
                className="flex items-center justify-center space-x-1 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar producto</span>
              </Button>
            </div>
            
            {products.map((product, index) => (
              <div key={index} className="border border-border rounded-lg p-3 sm:p-4 space-y-3 relative bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Producto {index + 1}
                  </span>
                  {products.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`itemLink-${index}`} className="text-sm font-medium">Link del producto *</Label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id={`itemLink-${index}`}
                      type="url"
                      placeholder="https://amazon.com/producto..."
                      value={product.itemLink}
                      onChange={(e) => updateProduct(index, 'itemLink', e.target.value)}
                      className="pl-10 h-11 text-sm"
                      required
                    />
                  </div>
                  {index === 0 && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Copia el link del producto desde Amazon, eBay, u otra tienda online
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`itemDescription-${index}`} className="text-sm font-medium">Descripción del producto *</Label>
                  <Textarea
                    id={`itemDescription-${index}`}
                    placeholder="Ejemplo: iPhone 15 Pro Max 256GB Color Azul Titanio"
                    value={product.itemDescription}
                    onChange={(e) => updateProduct(index, 'itemDescription', e.target.value)}
                    className="min-h-[60px] resize-y text-sm"
                    rows={2}
                    required
                  />
                  {index === 0 && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Describe detalladamente el producto (marca, modelo, color, talla, etc.)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`estimatedPrice-${index}`} className="text-sm font-medium">Precio estimado (USD) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id={`estimatedPrice-${index}`}
                      type="number"
                      step="0.01"
                      placeholder="299.99"
                      value={product.estimatedPrice}
                      onChange={(e) => updateProduct(index, 'estimatedPrice', e.target.value)}
                      className="pl-10 h-11 text-sm"
                      required
                    />
                  </div>
                  {index === 0 && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Precio aproximado del producto sin incluir envío
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Label htmlFor="packageDestination" className="text-sm font-medium">Destino del paquete *</Label>
            <Select value={formData.packageDestination} onValueChange={(value) => handleInputChange('packageDestination', value)}>
              <SelectTrigger className="h-11">
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
                className="h-11"
                required
              />
            )}
            <p className="text-xs text-muted-foreground leading-relaxed">
              ¿A dónde necesitas que llegue el paquete?
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="purchaseOrigin" className="text-sm font-medium">Origen de la compra *</Label>
            <Select value={formData.purchaseOrigin} onValueChange={(value) => handleInputChange('purchaseOrigin', value)}>
              <SelectTrigger className="h-11">
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
                className="h-11"
                required
              />
            )}
            <p className="text-xs text-muted-foreground leading-relaxed">
              ¿Desde qué país estás comprando tu producto?
            </p>
          </div>

          {/* Delivery method for Guatemala only */}
          {isGuatemalaDestination && (
            <div className="space-y-4 p-4 bg-accent/50 rounded-lg border">
              <Label className="text-sm font-medium">Forma de entrega en Guatemala *</Label>
              <RadioGroup 
                value={formData.deliveryMethod} 
                onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                className="space-y-4"
              >
                <div className="flex items-start space-x-3 p-3 border rounded-lg bg-background">
                  <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="pickup" className="cursor-pointer font-medium text-sm">
                      Lo recojo en zona 14
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sin costo adicional
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 border rounded-lg bg-background">
                  <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="delivery" className="cursor-pointer font-medium text-sm">
                      Enviarlo a mi domicilio
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Costo adicional Q25-Q40
                    </p>
                  </div>
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
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800 mb-2">✓ Dirección de entrega confirmada</p>
                  <p className="text-xs text-green-700 mb-3 leading-relaxed">{addressData.streetAddress}, {addressData.cityArea}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressForm(true)}
                    className="w-full sm:w-auto"
                  >
                    Editar dirección
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium">Fecha límite de entrega</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-11 justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {formData.deliveryDeadline ? (
                      format(formData.deliveryDeadline, "PPP", { locale: es })
                    ) : (
                      "Selecciona una fecha (opcional)"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.deliveryDeadline || undefined}
                  onSelect={(date) => handleInputChange('deliveryDeadline', date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ¿Para cuándo necesitas el producto? (opcional)
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="additionalNotes" className="text-sm font-medium">Notas adicionales</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Información adicional, instrucciones especiales, preferencias de entrega, etc."
              value={formData.additionalNotes}
              onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
              className="min-h-[100px] text-sm"
              rows={4}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">¿Cómo funciona?</p>
                <ul className="space-y-2 text-xs leading-relaxed">
                  <li>• Revisaremos tu solicitud en 24-48 horas</li>
                  <li>• Te conectaremos con viajeros disponibles</li>
                  <li>• Recibirás cotizaciones y podrás elegir</li>
                  <li>• Solo pagas cuando aceptes una cotización</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">
              Cancelar
            </Button>
            <Button type="submit" variant="shopper" className="flex-1 h-11">
              Enviar Solicitud
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PackageRequestForm;
