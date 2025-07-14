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
      <DialogContent className="sm:max-w-lg max-w-[98vw] max-h-[98vh] overflow-y-auto p-2 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4 border-b">
          <DialogTitle className="flex items-center space-x-2 text-base sm:text-xl">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="truncate">Nueva Solicitud</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
            Completa la información del producto que necesitas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6 pt-2 sm:pt-4">
          <div className="space-y-2 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
              <Label className="text-sm font-medium">Productos *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProduct}
                className="flex items-center justify-center space-x-1 w-full sm:w-auto h-8 text-xs"
              >
                <Plus className="h-3 w-3" />
                <span>Agregar</span>
              </Button>
            </div>
            
            {products.map((product, index) => (
              <div key={index} className="border border-border rounded-lg p-2 sm:p-4 space-y-2 sm:space-y-3 relative bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Producto {index + 1}
                  </span>
                  {products.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="text-destructive hover:text-destructive h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor={`itemLink-${index}`} className="text-xs sm:text-sm font-medium">Link *</Label>
                  <div className="relative">
                    <Link2 className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground z-10" />
                    <Input
                      id={`itemLink-${index}`}
                      type="url"
                      placeholder="https://amazon.com/producto..."
                      value={product.itemLink}
                      onChange={(e) => updateProduct(index, 'itemLink', e.target.value)}
                      className="pl-7 sm:pl-10 h-9 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  {index === 0 && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                      Link desde Amazon, eBay, etc.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`itemDescription-${index}`} className="text-xs sm:text-sm font-medium">Descripción *</Label>
                  <Textarea
                    id={`itemDescription-${index}`}
                    placeholder="iPhone 15 Pro Max 256GB Azul"
                    value={product.itemDescription}
                    onChange={(e) => updateProduct(index, 'itemDescription', e.target.value)}
                    className="min-h-[50px] sm:min-h-[60px] resize-y text-xs sm:text-sm"
                    rows={2}
                    required
                  />
                  {index === 0 && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                      Marca, modelo, color, talla, etc.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`estimatedPrice-${index}`} className="text-xs sm:text-sm font-medium">Precio USD *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground z-10" />
                    <Input
                      id={`estimatedPrice-${index}`}
                      type="number"
                      step="0.01"
                      placeholder="299.99"
                      value={product.estimatedPrice}
                      onChange={(e) => updateProduct(index, 'estimatedPrice', e.target.value)}
                      className="pl-7 sm:pl-10 h-9 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  {index === 0 && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                      Precio sin envío
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageDestination" className="text-xs sm:text-sm font-medium">Destino *</Label>
            <Select value={formData.packageDestination} onValueChange={(value) => handleInputChange('packageDestination', value)}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Destino del paquete" />
              </SelectTrigger>
              <SelectContent>
                {destinationCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs">{city}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.packageDestination === 'Otra ciudad' && (
              <Input
                placeholder="Escribe la ciudad"
                value={formData.packageDestinationOther}
                onChange={(e) => handleInputChange('packageDestinationOther', e.target.value)}
                className="h-9 text-xs"
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseOrigin" className="text-xs sm:text-sm font-medium">Origen *</Label>
            <Select value={formData.purchaseOrigin} onValueChange={(value) => handleInputChange('purchaseOrigin', value)}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="País de compra" />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrigins.map((origin) => (
                  <SelectItem key={origin.value} value={origin.value}>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-3 w-3" />
                      <span className="text-xs">{origin.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.purchaseOrigin === 'Otro' && (
              <Input
                placeholder="Escribe el país"
                value={formData.purchaseOriginOther}
                onChange={(e) => handleInputChange('purchaseOriginOther', e.target.value)}
                className="h-9 text-xs"
                required
              />
            )}
          </div>

          {/* Delivery method for Guatemala only */}
          {isGuatemalaDestination && (
            <div className="space-y-2 p-2 sm:p-4 bg-accent/50 rounded-lg border">
              <Label className="text-xs sm:text-sm font-medium">Entrega en Guatemala *</Label>
              <RadioGroup 
                value={formData.deliveryMethod} 
                onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                className="space-y-2"
              >
                <div className="flex items-start space-x-2 p-2 border rounded bg-background">
                  <RadioGroupItem value="pickup" id="pickup" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="pickup" className="cursor-pointer font-medium text-xs">
                      Recojo en zona 14
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Sin costo adicional
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 p-2 border rounded bg-background">
                  <RadioGroupItem value="delivery" id="delivery" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="delivery" className="cursor-pointer font-medium text-xs">
                      Envío a domicilio
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      +Q25-Q40
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
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-xs font-medium text-green-800 mb-1">✓ Dirección confirmada</p>
                  <p className="text-[10px] text-green-700 mb-2">{addressData.streetAddress}, {addressData.cityArea}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressForm(true)}
                    className="w-full h-7 text-xs"
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-medium">Fecha límite</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-9 justify-start text-left font-normal text-xs sm:text-sm"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {formData.deliveryDeadline ? (
                      format(formData.deliveryDeadline, "dd/MM/yyyy", { locale: es })
                    ) : (
                      "Opcional"
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes" className="text-xs sm:text-sm font-medium">Notas</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Información adicional, instrucciones especiales..."
              value={formData.additionalNotes}
              onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
              className="min-h-[60px] sm:min-h-[100px] text-xs sm:text-sm"
              rows={2}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-blue-800">
                <p className="font-medium mb-1">¿Cómo funciona?</p>
                <ul className="space-y-1 text-[10px] sm:text-xs leading-tight">
                  <li>• Revisión en 24-48h</li>
                  <li>• Te conectamos con viajeros</li>
                  <li>• Recibes cotizaciones</li>
                  <li>• Pagas solo si aceptas</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 sm:pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-9 text-xs">
              Cancelar
            </Button>
            <Button type="submit" variant="shopper" className="flex-1 h-9 text-xs">
              Enviar Solicitud
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PackageRequestForm;
