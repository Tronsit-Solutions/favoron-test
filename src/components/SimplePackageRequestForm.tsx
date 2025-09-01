import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CalendarIcon, Minus, Plus, X, Package, Link, DollarSign, Hash, MapPin, ShoppingCart, Truck, Home, Building } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import AddressForm from './AddressForm';
import { toast } from '@/hooks/use-toast';

interface Product {
  itemLink: string;
  itemDescription: string;
  estimatedPrice: string;
  quantity: string;
}

interface PackageRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (packageData: any) => void;
  editMode?: boolean;
  initialData?: any;
}

const SimplePackageRequestForm: React.FC<PackageRequestFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editMode = false,
  initialData
}) => {
  const isMobile = useIsMobile();
  
  // Multi-product state with dynamic add/remove functionality
  const [products, setProducts] = useState<Product[]>(() => {
    if (editMode && initialData?.products && initialData.products.length > 0) {
      return initialData.products;
    }
    return [{ itemDescription: '', estimatedPrice: '', itemLink: '', quantity: '1' }];
  });

  const [formData, setFormData] = useState(() => ({
    packageDestination: editMode ? initialData?.packageDestination || '' : '',
    purchaseOrigin: editMode ? initialData?.purchaseOrigin || '' : '',
    deliveryMethod: editMode ? initialData?.deliveryMethod || '' : '',
    deliveryDeadline: editMode ? (initialData?.deliveryDeadline ? new Date(initialData.deliveryDeadline) : undefined) : undefined,
    additionalNotes: editMode ? initialData?.additionalNotes || '' : ''
  }));

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [packageReceivingAddress, setPackageReceivingAddress] = useState(() => 
    editMode ? initialData?.packageReceivingAddress || {} : {}
  );

  // Multi-product helper functions
  const addProduct = () => {
    setProducts([...products, { itemDescription: '', estimatedPrice: '', itemLink: '', quantity: '1' }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: string) => {
    const updatedProducts = products.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    );
    setProducts(updatedProducts);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Show address form when Guatemala is selected
    if (field === 'packageDestination' && value === 'Guatemala') {
      setShowAddressForm(true);
    }
  };

  const calculateTotalEstimated = () => {
    return products.reduce((total, product) => {
      const price = parseFloat(product.estimatedPrice) || 0;
      const quantity = parseInt(product.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.packageDestination) {
      toast({
        title: "Error",
        description: "Por favor selecciona el destino del paquete",
        variant: "destructive"
      });
      return;
    }

    if (!formData.purchaseOrigin) {
      toast({
        title: "Error", 
        description: "Por favor selecciona el origen de compra",
        variant: "destructive"
      });
      return;
    }

    if (!formData.deliveryMethod) {
      toast({
        title: "Error",
        description: "Por favor selecciona el método de entrega",
        variant: "destructive"
      });
      return;
    }

    // Validate products
    const hasValidProduct = products.some(product => product.itemDescription.trim());
    if (!hasValidProduct) {
      toast({
        title: "Error",
        description: "Por favor agrega al menos un producto con descripción",
        variant: "destructive"
      });
      return;
    }

    if (formData.packageDestination === 'Guatemala' && Object.keys(packageReceivingAddress).length === 0) {
      toast({
        title: "Error",
        description: "Por favor completa la dirección de entrega",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      ...formData,
      products,
      packageReceivingAddress: formData.packageDestination === 'Guatemala' ? packageReceivingAddress : null,
      totalEstimatedPrice: calculateTotalEstimated()
    };

    onSubmit(submitData);
  };

  const handleAddressSubmit = (addressData: any) => {
    setPackageReceivingAddress(addressData);
    setShowAddressForm(false);
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Products Section Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Productos a Comprar</h3>
            <p className="text-sm text-muted-foreground">Agrega los productos que quieres solicitar</p>
          </div>
        </div>

        {/* Product Cards */}
        <div className="space-y-4">
          {products.map((product, index) => (
            <Card key={index} className="group relative overflow-hidden border-2 border-border hover:border-primary/30 transition-all duration-200">
              {products.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProduct(index)}
                  className="absolute top-3 right-3 h-8 w-8 z-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Producto #{index + 1}</span>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Package className="h-4 w-4 text-primary" />
                      Descripción del producto *
                    </Label>
                    <Textarea
                      placeholder="Ejemplo: iPhone 15 Pro Max 256GB Color Azul Titanio"
                      value={product.itemDescription}
                      onChange={(e) => updateProduct(index, 'itemDescription', e.target.value)}
                      className="resize-none bg-background"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Link className="h-4 w-4 text-primary" />
                      Link del producto (opcional)
                    </Label>
                    <Input
                      placeholder="https://amazon.com/product..."
                      value={product.itemLink}
                      onChange={(e) => updateProduct(index, 'itemLink', e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Precio estimado (USD)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={product.estimatedPrice}
                        onChange={(e) => updateProduct(index, 'estimatedPrice', e.target.value)}
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Hash className="h-4 w-4 text-primary" />
                        Cantidad
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const currentQty = parseInt(product.quantity) || 1;
                            if (currentQty > 1) {
                              updateProduct(index, 'quantity', (currentQty - 1).toString());
                            }
                          }}
                          className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                          disabled={parseInt(product.quantity) <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <Input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => {
                            const value = Math.max(1, parseInt(e.target.value) || 1);
                            updateProduct(index, 'quantity', value.toString());
                          }}
                          className="w-20 text-center bg-background"
                        />
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const currentQty = parseInt(product.quantity) || 1;
                            updateProduct(index, 'quantity', (currentQty + 1).toString());
                          }}
                          className="h-9 w-9 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Product Subtotal */}
                  {product.estimatedPrice && product.quantity && (
                    <div className="pt-3 border-t border-border">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Subtotal producto #{index + 1}:</span>
                        <span className="font-medium">
                          ${((parseFloat(product.estimatedPrice) || 0) * (parseInt(product.quantity) || 1)).toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Product Button */}
          <Button
            type="button"
            variant="outline"
            onClick={addProduct}
            className="w-full h-12 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar otro producto
          </Button>

          {/* Total */}
          {calculateTotalEstimated() > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Estimado:</span>
                  <span className="text-2xl font-bold text-primary">${calculateTotalEstimated().toFixed(2)} USD</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Destination and Origin Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/50 text-secondary-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Configuración de Envío</h3>
            <p className="text-sm text-muted-foreground">Selecciona origen y destino del paquete</p>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">Destino del paquete *</Label>
            <RadioGroup
              value={formData.packageDestination}
              onValueChange={(value) => updateFormData('packageDestination', value)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <Card className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                formData.packageDestination === "Guatemala" 
                  ? "ring-2 ring-primary bg-primary/5 border-primary/30" 
                  : "hover:border-primary/30"
              )}>
                <Label htmlFor="guatemala" className="cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="Guatemala" id="guatemala" />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🇬🇹</span>
                        <span className="font-medium">Guatemala</span>
                      </div>
                    </div>
                  </CardContent>
                </Label>
              </Card>
              
              <Card className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                formData.packageDestination === "Estados Unidos" 
                  ? "ring-2 ring-primary bg-primary/5 border-primary/30" 
                  : "hover:border-primary/30"
              )}>
                <Label htmlFor="usa" className="cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="Estados Unidos" id="usa" />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🇺🇸</span>
                        <span className="font-medium">Estados Unidos</span>
                      </div>
                    </div>
                  </CardContent>
                </Label>
              </Card>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Origen de compra *</Label>
            <RadioGroup
              value={formData.purchaseOrigin}
              onValueChange={(value) => updateFormData('purchaseOrigin', value)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <Card className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                formData.purchaseOrigin === "Estados Unidos" 
                  ? "ring-2 ring-primary bg-primary/5 border-primary/30" 
                  : "hover:border-primary/30"
              )}>
                <Label htmlFor="origin-usa" className="cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="Estados Unidos" id="origin-usa" />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🇺🇸</span>
                        <span className="font-medium">Estados Unidos</span>
                      </div>
                    </div>
                  </CardContent>
                </Label>
              </Card>
              
              <Card className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                formData.purchaseOrigin === "Guatemala" 
                  ? "ring-2 ring-primary bg-primary/5 border-primary/30" 
                  : "hover:border-primary/30"
              )}>
                <Label htmlFor="origin-guatemala" className="cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="Guatemala" id="origin-guatemala" />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🇬🇹</span>
                        <span className="font-medium">Guatemala</span>
                      </div>
                    </div>
                  </CardContent>
                </Label>
              </Card>
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Address Form */}
      {showAddressForm && (
        <AddressForm
          onSubmit={handleAddressSubmit}
          onCancel={() => setShowAddressForm(false)}
          initialData={packageReceivingAddress}
        />
      )}

      {/* Delivery Method Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/50 text-accent-foreground">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Método de Entrega</h3>
            <p className="text-sm text-muted-foreground">Elige cómo quieres recibir tu paquete</p>
          </div>
        </div>

        <RadioGroup
          value={formData.deliveryMethod}
          onValueChange={(value) => updateFormData('deliveryMethod', value)}
          className="grid gap-3"
        >
          <Card className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md",
            formData.deliveryMethod === "domicilio" 
              ? "ring-2 ring-primary bg-primary/5 border-primary/30" 
              : "hover:border-primary/30"
          )}>
            <Label htmlFor="domicilio" className="cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="domicilio" id="domicilio" />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                      <Home className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">Entrega a domicilio</div>
                      <div className="text-sm text-muted-foreground">Recibe tu paquete en la comodidad de tu hogar</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Label>
          </Card>
          
          <Card className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md",
            formData.deliveryMethod === "oficina" 
              ? "ring-2 ring-primary bg-primary/5 border-primary/30" 
              : "hover:border-primary/30"
          )}>
            <Label htmlFor="oficina" className="cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="oficina" id="oficina" />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 text-secondary-foreground">
                      <Building className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">Recoger en oficina</div>
                      <div className="text-sm text-muted-foreground">Recoge tu paquete en nuestras oficinas</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Label>
          </Card>
        </RadioGroup>
      </div>

      {/* Delivery Deadline and Notes Section */}
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Fecha límite de entrega (opcional)
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-12 bg-background",
                  !formData.deliveryDeadline && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-3 h-5 w-5" />
                {formData.deliveryDeadline ? (
                  format(formData.deliveryDeadline, "PPP", { locale: es })
                ) : (
                  "Seleccionar fecha límite"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.deliveryDeadline}
                onSelect={(date) => updateFormData('deliveryDeadline', date)}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-3">
          <Label htmlFor="additionalNotes" className="text-base font-medium">
            Notas adicionales (opcional)
          </Label>
          <Textarea
            id="additionalNotes"
            placeholder="Comparte cualquier detalle especial sobre tu solicitud: colores preferidos, tallas, instrucciones especiales, etc."
            value={formData.additionalNotes}
            onChange={(e) => updateFormData('additionalNotes', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className="resize-none bg-background"
            rows={4}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            enterKeyHint="done"
          />
        </div>
      </div>

      {/* Process Info Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-semibold">¿Cómo funciona nuestro servicio?</h4>
          </div>
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium mt-0.5">1</div>
              <div className="text-sm">
                <span className="font-medium">Revisión:</span> Analizamos tu solicitud y te enviamos una cotización detallada
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium mt-0.5">2</div>
              <div className="text-sm">
                <span className="font-medium">Compra:</span> Una vez aprobada, procedemos con la compra de tus productos
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium mt-0.5">3</div>
              <div className="text-sm">
                <span className="font-medium">Seguimiento:</span> Te mantenemos informado del proceso de envío en tiempo real
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium mt-0.5">4</div>
              <div className="text-sm">
                <span className="font-medium">Entrega:</span> Recibes tu paquete en la fecha y lugar acordados
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 h-12 text-base"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {editMode ? 'Actualizar Solicitud' : 'Enviar Solicitud'}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
    <Drawer 
        open={isOpen} 
        onOpenChange={(open) => !open && onClose()}
      >
      <DrawerContent 
        className="max-h-[95vh]"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DrawerTitle>
                {editMode ? 'Editar Solicitud' : 'Nueva Solicitud de Paquete'}
              </DrawerTitle>
            </div>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            <FormContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Editar Solicitud' : 'Nueva Solicitud de Paquete'}
          </DialogTitle>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  );
};

export default SimplePackageRequestForm;