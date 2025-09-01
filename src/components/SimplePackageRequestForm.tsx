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
import { ArrowLeft, CalendarIcon, Minus, Plus, X } from 'lucide-react';
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
  
  // Ultra-simple individual state for desktop - no re-renders
  const [productDescription, setProductDescription] = useState(() => {
    if (editMode && initialData?.products?.[0]?.itemDescription) {
      return initialData.products[0].itemDescription;
    }
    return '';
  });
  const [productPrice, setProductPrice] = useState(() => {
    if (editMode && initialData?.products?.[0]?.estimatedPrice) {
      return initialData.products[0].estimatedPrice;
    }
    return '';
  });
  const [productLink, setProductLink] = useState(() => {
    if (editMode && initialData?.products?.[0]?.itemLink) {
      return initialData.products[0].itemLink;
    }
    return '';
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

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Show address form when Guatemala is selected
    if (field === 'packageDestination' && value === 'Guatemala') {
      setShowAddressForm(true);
    }
  };

  const calculateTotalEstimated = () => {
    const price = parseFloat(productPrice) || 0;
    return price; // Single product, quantity always 1
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

    if (!productDescription.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa la descripción del producto",
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

    // Convert individual fields back to expected array format for database
    const products = [{
      itemDescription: productDescription,
      estimatedPrice: productPrice,
      itemLink: productLink,
      quantity: '1'
    }];

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
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Simplified Product Section - Desktop Only */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Producto a comprar</h3>

        <Card className="p-4">
          <CardContent className="p-0 space-y-3">
            <div>
              <Label htmlFor="productDescription" className="text-xs text-muted-foreground">
                Descripción del producto *
              </Label>
              <Textarea
                id="productDescription"
                placeholder="Ejemplo: iPhone 15 Pro Max 256GB Color Azul Titanio"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="productLink" className="text-xs text-muted-foreground">
                Link del producto (opcional)
              </Label>
              <Input
                id="productLink"
                placeholder="https://..."
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="productPrice" className="text-xs text-muted-foreground">
                Precio estimado (USD)
              </Label>
              <Input
                id="productPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {calculateTotalEstimated() > 0 && (
          <div className="text-right text-sm font-medium">
            Total estimado: ${calculateTotalEstimated().toFixed(2)} USD
          </div>
        )}
      </div>

      {/* Destination and Origin */}
      <div className="grid gap-4">
        <div>
          <Label className="text-sm font-medium">Destino del paquete *</Label>
          <RadioGroup
            value={formData.packageDestination}
            onValueChange={(value) => updateFormData('packageDestination', value)}
            className="grid grid-cols-2 gap-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Guatemala" id="guatemala" />
              <Label htmlFor="guatemala">Guatemala</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Estados Unidos" id="usa" />
              <Label htmlFor="usa">Estados Unidos</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm font-medium">Origen de compra *</Label>
          <RadioGroup
            value={formData.purchaseOrigin}
            onValueChange={(value) => updateFormData('purchaseOrigin', value)}
            className="grid grid-cols-2 gap-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Estados Unidos" id="origin-usa" />
              <Label htmlFor="origin-usa">Estados Unidos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Guatemala" id="origin-guatemala" />
              <Label htmlFor="origin-guatemala">Guatemala</Label>
            </div>
          </RadioGroup>
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

      {/* Delivery Method */}
      <div>
        <Label className="text-sm font-medium">Método de entrega *</Label>
        <RadioGroup
          value={formData.deliveryMethod}
          onValueChange={(value) => updateFormData('deliveryMethod', value)}
          className="grid gap-2 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="domicilio" id="domicilio" />
            <Label htmlFor="domicilio">Entrega a domicilio</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="oficina" id="oficina" />
            <Label htmlFor="oficina">Recoger en oficina</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Delivery Deadline */}
      <div>
        <Label className="text-sm font-medium">Fecha límite de entrega (opcional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal mt-2",
                !formData.deliveryDeadline && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.deliveryDeadline ? (
                format(formData.deliveryDeadline, "PPP", { locale: es })
              ) : (
                "Seleccionar fecha"
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

      {/* Additional Notes */}
      <div>
        <Label htmlFor="additionalNotes" className="text-sm font-medium">
          Notas adicionales (opcional)
        </Label>
        <Textarea
          id="additionalNotes"
          placeholder="Cualquier información adicional sobre tu solicitud..."
          value={formData.additionalNotes}
          onChange={(e) => updateFormData('additionalNotes', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          className="mt-2"
          rows={3}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          enterKeyHint="done"
        />
      </div>

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2">¿Cómo funciona?</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Revisaremos tu solicitud y te enviaremos una cotización</li>
            <li>• Una vez aprobada, procederemos con la compra</li>
            <li>• Te mantendremos informado del proceso de envío</li>
            <li>• Recibirás tu paquete en la fecha acordada</li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
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