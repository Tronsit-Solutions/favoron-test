import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { usePersistedFormState } from "@/hooks/usePersistedFormState";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Package, Link2, DollarSign, AlertCircle, MapPin, Globe, Plus, Trash2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AddressForm from "@/components/AddressForm";
import "./ui/mobile-safe-form.css";

interface PackageRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (packageData: any) => void;
  editMode?: boolean;
  initialData?: any;
}

interface Product {
  itemLink: string;
  itemDescription: string;
  estimatedPrice: string;
  quantity: string;
}

const PackageRequestForm = ({ isOpen, onClose, onSubmit, editMode = false, initialData }: PackageRequestFormProps) => {
  const isMobile = useIsMobile();
  
  // Initialize data based on mode
  const getInitialProducts = () => {
    if (editMode && initialData?.products_data) {
      // Handle both old format (single product) and new format (array)
      if (Array.isArray(initialData.products_data)) {
        return initialData.products_data;
      } else {
        // Legacy format - single product object
        return [{
          itemLink: initialData.item_link || '',
          itemDescription: initialData.item_description || '',
          estimatedPrice: initialData.estimated_price || '',
          quantity: '1'
        }];
      }
    }
    return [{
      itemLink: '',
      itemDescription: '',
      estimatedPrice: '',
      quantity: '1'
    }];
  };

  const getInitialFormData = () => {
    if (editMode && initialData) {
      return {
        deliveryDeadline: initialData.delivery_deadline ? new Date(initialData.delivery_deadline) : null,
        additionalNotes: initialData.additional_notes || '',
        packageDestination: initialData.package_destination || '',
        packageDestinationOther: '',
        purchaseOrigin: initialData.purchase_origin || '',
        purchaseOriginOther: '',
        deliveryMethod: initialData.delivery_method || ''
      };
    }
    return {
      deliveryDeadline: null as Date | null,
      additionalNotes: '',
      packageDestination: '',
      packageDestinationOther: '',
      purchaseOrigin: '',
      purchaseOriginOther: '',
      deliveryMethod: ''
    };
  };

  // Only use persisted state in create mode
  const { state: persistedProducts, setState: setPersistedProducts, clearPersistedState: clearProducts } = usePersistedFormState({
    key: 'package-form-products',
    initialState: [{
      itemLink: '',
      itemDescription: '',
      estimatedPrice: '',
      quantity: '1'
    }] as Product[]
  });

  const { state: persistedFormData, setState: setPersistedFormData, clearPersistedState: clearFormData } = usePersistedFormState({
    key: 'package-form-data',
    initialState: {
      deliveryDeadline: null as Date | null,
      additionalNotes: '',
      packageDestination: '',
      packageDestinationOther: '',
      purchaseOrigin: '',
      purchaseOriginOther: '',
      deliveryMethod: ''
    }
  });

  const { state: persistedAddressData, setState: setPersistedAddressData, clearPersistedState: clearAddress } = usePersistedFormState({
    key: 'package-form-address',
    initialState: null
  });

  // Local state for non-critical UI state
  const [products, setProducts] = useState<Product[]>(editMode ? getInitialProducts() : persistedProducts);
  const [formData, setFormData] = useState(editMode ? getInitialFormData() : persistedFormData);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressData, setAddressData] = useState(editMode && initialData?.delivery_address ? initialData.delivery_address : persistedAddressData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync local state with persisted state (only in create mode)
  useEffect(() => {
    if (!editMode) {
      setPersistedProducts(products);
    }
  }, [products, editMode]); // Removed setPersistedProducts dependency

  useEffect(() => {
    if (!editMode) {
      setPersistedFormData(formData);
    }
  }, [formData, editMode]); // Removed setPersistedFormData dependency

  useEffect(() => {
    if (!editMode) {
      setPersistedAddressData(addressData);
    }
  }, [addressData, editMode]); // Removed setPersistedAddressData dependency

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    console.log('📝 FORM SUBMIT DEBUG - Starting form submission...');
    setIsSubmitting(true);
    
    const finalDestination = formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination;
    const finalOrigin = formData.purchaseOrigin === 'Otro' ? formData.purchaseOriginOther : formData.purchaseOrigin;
    
    // Validate products
    const isValidProduct = (p: Product) => p.itemLink && p.itemDescription && p.estimatedPrice;
    if (!products.every(isValidProduct) || !finalDestination || !finalOrigin) {
      alert('Por favor completa todos los campos obligatorios para todos los productos');
      setIsSubmitting(false);
      return;
    }

    // Validar delivery method si destino es Guatemala
    if (finalDestination.toLowerCase().includes('guatemala') && !formData.deliveryMethod) {
      alert('Por favor selecciona cómo quieres recibir tu paquete en Guatemala');
      setIsSubmitting(false);
      return;
    }

    // Validar dirección si seleccionó delivery
    if (formData.deliveryMethod === 'delivery' && !addressData) {
      alert('Por favor completa la información de entrega a domicilio');
      setIsSubmitting(false);
      return;
    }

    const submitData = {
      ...formData,
      products: products,
      packageDestination: finalDestination,
      purchaseOrigin: finalOrigin,
      deliveryAddress: formData.deliveryMethod === 'delivery' ? addressData : null,
      deliveryMethod: formData.deliveryMethod
    };

    console.log('📝 FORM SUBMIT DEBUG - Final submit data:', submitData);
    
    try {
      await onSubmit(submitData);
      console.log('✅ FORM SUBMIT DEBUG - onSubmit completed successfully');
      
      // Reset form and clear persisted data on success (only in create mode)
      if (!editMode) {
        const initialProducts = [{
          itemLink: '',
          itemDescription: '',
          estimatedPrice: '',
          quantity: '1'
        }];
        const initialFormData = {
          deliveryDeadline: null as Date | null,
          additionalNotes: '',
          packageDestination: '',
          packageDestinationOther: '',
          purchaseOrigin: '',
          purchaseOriginOther: '',
          deliveryMethod: ''
        };
        
        setProducts(initialProducts);
        setFormData(initialFormData);
        setShowAddressForm(false);
        setAddressData(null);
        
        // Clear persisted states
        clearProducts();
        clearFormData();
        clearAddress();
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('❌ FORM SUBMIT ERROR:', error);
      alert('Error al enviar la solicitud. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: string) => {
    setProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    ));
  };

  const addProduct = () => {
    if (products.length < 5) {
      setProducts(prev => [...prev, {
        itemLink: '',
        itemDescription: '',
        estimatedPrice: '',
        quantity: '1'
      }]);
    }
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotalEstimated = () => {
    return products.reduce((total, product) => {
      const price = parseFloat(product.estimatedPrice || '0');
      const quantity = parseInt(product.quantity || '1');
      return total + (price * quantity);
    }, 0);
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

  // Mobile Header Component
  const MobileHeader = () => (
    <div className="flex items-center justify-between py-4 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-lg font-semibold text-center flex-1">
        {editMode ? 'Editar Solicitud' : 'Nueva Solicitud'}
      </h2>
      <div className="w-10" /> {/* Spacer for centering */}
    </div>
  );

  // Desktop Header Component
  const DesktopHeader = () => (
    <DialogHeader>
      <DialogTitle className="flex items-center space-x-2">
        <Package className="h-5 w-5 text-primary" />
        <span>{editMode ? `Editar Solicitud ${initialData?.id ? `#${initialData.id}` : ''}` : 'Nueva Solicitud de Paquete'}</span>
      </DialogTitle>
      <DialogDescription>
        {editMode 
          ? 'Modifica la información de tu solicitud. Puedes agregar más productos.'
          : 'Completa la información del producto que necesitas y recibirás una cotización de un viajero.'
        }
      </DialogDescription>
    </DialogHeader>
  );

  // Form Content Component
  const FormContent = () => (
    <form onSubmit={handleSubmit} className="mobile-safe-form space-y-6">
      <p className="text-sm text-muted-foreground mb-4">
        {editMode 
          ? 'Modifica la información de tu solicitud. Puedes agregar más productos.'
          : 'Completa la información del producto que necesitas y recibirás una cotización de un viajero.'
        }
      </p>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Productos * ({products.length}/5)</Label>
          {products.length < 5 && (
            <Button
              type="button"
              variant="shopper"
              size="sm"
              onClick={addProduct}
              className="flex items-center space-x-1 font-semibold shadow-sm text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Agregar</span>
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          {products.map((product, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Producto #{index + 1}</Label>
                {products.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeProduct(index)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 h-7 px-2"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="text-xs">Eliminar</span>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <Label htmlFor={`itemLink-${index}`} className="text-xs text-muted-foreground">Link del producto *</Label>
                  <div className="relative">
                    <Link2 className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input
                      id={`itemLink-${index}`}
                      type="url"
                      placeholder="https://amazon.com/producto..."
                      value={product.itemLink}
                      onChange={(e) => updateProduct(index, 'itemLink', e.target.value)}
                      className="pl-7 h-8 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`itemDescription-${index}`} className="text-xs text-muted-foreground">Descripción del producto *</Label>
                  <Textarea
                    id={`itemDescription-${index}`}
                    placeholder="Ejemplo: iPhone 15 Pro Max 256GB Color Azul Titanio"
                    value={product.itemDescription}
                    onChange={(e) => updateProduct(index, 'itemDescription', e.target.value)}
                    className="min-h-[60px] max-h-[60px] resize-none text-sm overflow-y-auto"
                    rows={2}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`estimatedPrice-${index}`} className="text-xs text-muted-foreground">Precio (USD) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                      <Input
                        id={`estimatedPrice-${index}`}
                        type="number"
                        step="0.01"
                        placeholder="299.99"
                        value={product.estimatedPrice}
                        onChange={(e) => updateProduct(index, 'estimatedPrice', e.target.value)}
                        className="pl-7 h-8 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`quantity-${index}`} className="text-xs text-muted-foreground">Cantidad *</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      placeholder="1"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800">
              Total estimado: ${calculateTotalEstimated().toFixed(2)} USD
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Pedido de {products.length} productos
            </p>
          </div>
        )}
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
            className="space-y-2 sm:space-y-3"
          >
            <div 
              className="mobile-radio-card"
              data-state={formData.deliveryMethod === "pickup" ? "checked" : "unchecked"}
              onClick={() => handleInputChange('deliveryMethod', 'pickup')}
            >
              <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
              <div className="flex-1 flex items-start space-x-3 sm:space-x-2 p-4 sm:p-3">
                <div className="flex-1">
                  <Label htmlFor="pickup" className="cursor-pointer text-sm sm:text-base font-medium">
                    Lo recojo en zona 14
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 sm:hidden">
                    Recogida en oficina de Favorón
                  </p>
                </div>
              </div>
            </div>
            <div 
              className="mobile-radio-card"
              data-state={formData.deliveryMethod === "delivery" ? "checked" : "unchecked"}
              onClick={() => handleInputChange('deliveryMethod', 'delivery')}
            >
              <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
              <div className="flex-1 flex items-start space-x-3 sm:space-x-2 p-4 sm:p-3">
                <div className="flex-1">
                  <Label htmlFor="delivery" className="cursor-pointer text-sm sm:text-base font-medium">
                    Enviarlo a mi domicilio
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 sm:hidden">
                    Entrega a domicilio con costo adicional
                  </p>
                </div>
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
          className="min-h-[80px] max-h-[100px] resize-none overflow-y-auto"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
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
        <Button type="submit" variant="shopper" className="flex-1" disabled={isSubmitting}>
          {isSubmitting 
            ? (editMode ? 'Guardando...' : 'Enviando...') 
            : (editMode ? 'Guardar Cambios' : 'Enviar Solicitud')
          }
        </Button>
      </div>
    </form>
  );

  // Conditional rendering based on device type
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[100dvh] h-[100dvh] overflow-hidden flex flex-col">
          <MobileHeader />
          <div className="flex-1 overflow-y-auto px-4 pb-6 env(safe-area-inset-bottom)">
            <FormContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop version
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DesktopHeader />
        <FormContent />
      </DialogContent>
    </Dialog>
  );
};

export default PackageRequestForm;