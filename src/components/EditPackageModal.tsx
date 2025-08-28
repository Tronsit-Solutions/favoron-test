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
import { CalendarIcon, Package, Link2, DollarSign, MapPin, Globe, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (packageData: any) => void;
  packageData: any;
}

interface Product {
  itemLink: string;
  itemDescription: string;
  estimatedPrice: string;
}

const EditPackageModal = ({ isOpen, onClose, onSubmit, packageData }: EditPackageModalProps) => {
  const [product, setProduct] = useState<Product>(() => {
    // First try to load from products_data (new format)
    if (packageData?.products_data && Array.isArray(packageData.products_data) && packageData.products_data.length > 0) {
      const firstProduct = packageData.products_data[0];
      return {
        itemLink: firstProduct.itemLink || '',
        itemDescription: firstProduct.itemDescription || '',
        estimatedPrice: firstProduct.estimatedPrice?.toString() || ''
      };
    }
    
    // Fallback to individual fields (old format)
    return {
      itemLink: packageData?.item_link || '',
      itemDescription: packageData?.item_description || '',
      estimatedPrice: packageData?.estimated_price?.toString() || ''
    };
  });

  const [formData, setFormData] = useState({
    deliveryDeadline: packageData?.delivery_deadline ? new Date(packageData.delivery_deadline) : null as Date | null,
    additionalNotes: packageData?.additional_notes || '',
    packageDestination: packageData?.package_destination || '',
    packageDestinationOther: '',
    purchaseOrigin: packageData?.purchase_origin || '',
    purchaseOriginOther: '',
    deliveryMethod: packageData?.delivery_method || ''
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

    // Map form data back to database structure
    const submitData = {
      id: packageData.id,
      item_link: product.itemLink,
      item_description: product.itemDescription,
      estimated_price: parseFloat(product.estimatedPrice),
      products_data: [{
        ...product,
        additionalNotes: formData.additionalNotes || null
      }], // Store single product in array format for compatibility with notes
      package_destination: finalDestination,
      purchase_origin: finalOrigin,
      delivery_method: formData.deliveryMethod || null,
      delivery_deadline: formData.deliveryDeadline?.toISOString(),
      additional_notes: formData.additionalNotes || null
    };

    onSubmit(submitData);
  };

  const updateProduct = (field: keyof Product, value: string) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isGuatemalaDestination = (formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination)?.toLowerCase().includes('guatemala');

  if (!packageData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-primary" />
            <span>Editar Solicitud #{packageData.id?.slice(-8)}</span>
          </DialogTitle>
          <DialogDescription>
            Modifica la información de tu solicitud de paquete.
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

export default EditPackageModal;