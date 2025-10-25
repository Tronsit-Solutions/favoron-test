import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePersistedFormState } from "@/hooks/usePersistedFormState";
import { useModalState } from "@/contexts/ModalStateContext";
import { useTabVisibilityProtection } from "@/hooks/useTabVisibilityProtection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Package, Link2, DollarSign, AlertCircle, MapPin, Globe, Plus, Trash2, Weight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AddressForm from "@/components/AddressForm";
import ProductPhotoUpload from "@/components/ProductPhotoUpload";
import type { Product } from "@/types";


interface PackageRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (packageData: any) => void;
  editMode?: boolean;
  initialData?: any;
}

// Product interface is now imported from types

const PackageRequestForm = ({ isOpen, onClose, onSubmit, editMode = false, initialData }: PackageRequestFormProps) => {
  const { openModal, closeModal } = useModalState();
  useTabVisibilityProtection({ preventNavigationWithModals: true });

  // Initialize data based on mode
  const getInitialProducts = (): Product[] => {
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
          quantity: '1',
          requestType: 'online'
        }];
      }
    }
    return [{
      itemLink: '',
      itemDescription: '',
      estimatedPrice: '',
      quantity: '1',
      requestType: 'online'
    }];
  };

  const getInitialRequestType = (): 'online' | 'personal' => {
    if (editMode && initialData?.products_data) {
      if (Array.isArray(initialData.products_data) && initialData.products_data.length > 0) {
        return initialData.products_data[0].requestType || 'online';
      }
    }
    return 'online';
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
        deliveryMethod: initialData.delivery_method || '',
        requestType: getInitialRequestType()
      };
    }
    return {
      deliveryDeadline: null as Date | null,
      additionalNotes: '',
      packageDestination: '',
      packageDestinationOther: '',
      purchaseOrigin: '',
      purchaseOriginOther: '',
      deliveryMethod: '',
      requestType: 'online' as 'online' | 'personal'
    };
  };

  // Only use persisted state in create mode - disable encryption for this form
  const { state: persistedProducts, setState: setPersistedProducts, clearPersistedState: clearProducts } = usePersistedFormState({
    key: 'package-form-products',
    initialState: [{
      itemLink: '',
      itemDescription: '',
      estimatedPrice: '',
      quantity: '1',
      requestType: 'online'
    }] as Product[],
    encrypt: false // Disable encryption for faster, more reliable form restoration
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
      deliveryMethod: '',
      requestType: 'online' as 'online' | 'personal'
    },
    encrypt: false // Disable encryption for faster, more reliable form restoration
  });

  const { state: persistedAddressData, setState: setPersistedAddressData, clearPersistedState: clearAddress } = usePersistedFormState({
    key: 'package-form-address',
    initialState: null,
    encrypt: false // Disable encryption for faster, more reliable form restoration
  });

  // Local state for non-critical UI state
  const [products, setProducts] = useState<Product[]>(editMode ? getInitialProducts() : persistedProducts);
  const [formData, setFormData] = useState(editMode ? getInitialFormData() : persistedFormData);
  const [formRequestType, setFormRequestType] = useState<'online' | 'personal'>(editMode ? getInitialRequestType() : (persistedFormData.requestType || 'online'));
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressData, setAddressData] = useState(editMode && initialData?.delivery_address ? initialData.delivery_address : persistedAddressData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  // Sync local state with persisted state (only in create mode)
  useEffect(() => {
    if (!editMode) {
      setPersistedProducts(products);
    }
  }, [products, setPersistedProducts, editMode]);

  useEffect(() => {
    if (!editMode) {
      setPersistedFormData(formData);
    }
  }, [formData, setPersistedFormData, editMode]);

  useEffect(() => {
    if (!editMode) {
      setPersistedAddressData(addressData);
    }
  }, [addressData, setPersistedAddressData, editMode]);

  // Register modal with ModalStateContext for tab protection
  useEffect(() => {
    if (isOpen) {
      openModal('package-request-form', 'form', { editMode, initialData });
    } else {
      closeModal('package-request-form');
    }
    
    return () => {
      closeModal('package-request-form');
    };
  }, [isOpen, editMode, initialData, openModal, closeModal]);

  // Restore persisted data when modal reopens (after tab switch)
  useEffect(() => {
    if (!isOpen) return;

    const hasPersistedProducts =
      Array.isArray(persistedProducts) &&
      persistedProducts.length > 0 &&
      persistedProducts.some(p => p.itemDescription || p.itemLink || p.estimatedPrice);

    const hasPersistedForm =
      !!(persistedFormData &&
        (persistedFormData.packageDestination ||
         persistedFormData.purchaseOrigin ||
         persistedFormData.requestType));

    const hasPersistedAddress = !!persistedAddressData;

    console.log('🔄 Restore check (package):', { isOpen, editMode, hasPersistedProducts, hasPersistedForm, hasPersistedAddress });

    // Avoid overwriting edit mode data
    if (editMode) return;

    if (hasPersistedProducts) setProducts(persistedProducts);
    if (hasPersistedForm) {
      setFormData(persistedFormData);
      setFormRequestType(persistedFormData.requestType || 'online');
    }
    if (hasPersistedAddress) setAddressData(persistedAddressData);
  }, [isOpen, editMode, persistedProducts, persistedFormData, persistedAddressData]);

  // Sync all products' requestType when formRequestType changes
  useEffect(() => {
    setProducts(prev => {
      const updated = prev.map(p => ({ ...p, requestType: formRequestType }));
      // If switching to personal, keep only the first product
      if (formRequestType === 'personal' && updated.length > 1) {
        return [updated[0]];
      }
      return updated;
    });
  }, [formRequestType]);

  const destinationCities = [
    'Guatemala City',
    'Antigua Guatemala',
    'Quetzaltenango',
    'Escuintla',
    'Otra ciudad'
  ];

  const destinationCountries = [
    { value: 'Guatemala', label: 'Guatemala' },
    { value: 'USA', label: 'USA' },
    { value: 'España', label: 'España' },
    { value: 'México', label: 'México' },
    { value: 'Otro', label: 'Otro país' }
  ];

  const citiesByCountry: Record<string, string[]> = {
    'Guatemala': ['Guatemala City', 'Antigua Guatemala', 'Quetzaltenango', 'Escuintla', 'Otra ciudad'],
    'USA': ['Miami', 'New York', 'Los Angeles', 'Houston', 'Otra ciudad'],
    'España': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Otra ciudad'],
    'México': ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún', 'Otra ciudad'],
    'Otro': ['Otra ciudad']
  };

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
    
    // Validate products based on requestType
    const isValidProduct = (p: Product) => {
      if (formRequestType === 'personal') {
        return p.itemDescription && p.instructions && p.weight && p.estimatedPrice && p.productPhotos && p.productPhotos.length > 0;
      } else {
        return p.itemLink && p.itemDescription && p.estimatedPrice;
      }
    };
    
    if (!products.every(isValidProduct) || !finalDestination || !finalOrigin) {
      const invalidProduct = products.find(p => !isValidProduct(p));
      if (invalidProduct) {
        if (formRequestType === 'personal') {
          alert('Para pedidos personales: completa descripción, instrucciones, peso, valor y sube al menos 1 foto');
        } else {
          alert('Para compras online: completa link, descripción y precio estimado');
        }
      } else {
        alert('Por favor selecciona destino y origen del paquete');
      }
      setIsSubmitting(false);
      return;
    }

    // Validar delivery method para cualquier destino
    if (finalDestination && !formData.deliveryMethod) {
      alert('Por favor selecciona cómo quieres recibir tu paquete');
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
      deliveryDeadline: formData.deliveryDeadline 
        ? (formData.deliveryDeadline instanceof Date 
            ? formData.deliveryDeadline 
            : new Date(formData.deliveryDeadline))
        : null,
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
        const initialProducts: Product[] = [{
          itemLink: '',
          itemDescription: '',
          estimatedPrice: '',
          quantity: '1',
          requestType: 'online'
        }];
        const initialFormData = {
          deliveryDeadline: null as Date | null,
          additionalNotes: '',
          packageDestination: '',
          packageDestinationOther: '',
          purchaseOrigin: '',
          purchaseOriginOther: '',
          deliveryMethod: '',
          requestType: 'online' as 'online' | 'personal'
        };
        
        setProducts(initialProducts);
        setFormData(initialFormData);
        setFormRequestType('online');
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
      
      // Enhanced error logging for package request forms
      const { logFormError } = await import('@/lib/formErrorLogger');
      logFormError(error, 'package-request-form', {
        productsCount: products.length,
        hasDeliveryMethod: !!formData.deliveryMethod,
        isGuatemalaDestination: isGuatemalaDestination,
        hasAddressData: !!addressData,
        formMode: editMode ? 'edit' : 'create',
        isSafariIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent)
      });
      
      // Safari iOS specific error handling
      const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
      const errorMessage = isSafariIOS 
        ? 'Error en Safari iPhone. Intenta: 1) Refrescar, 2) Usar Chrome, o 3) Contactar soporte.'
        : 'Error al enviar la solicitud. Por favor intenta de nuevo.';
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
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
        quantity: '1',
        requestType: formRequestType
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

  // Get the actual destination value
  const actualDestination = formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination;
  
  // Show delivery options for ANY destination selected (not just Guatemalan cities)
  const isGuatemalaDestination = !!actualDestination;
  
  // Check specifically for Guatemala City (to enable pickup option)
  const isGuatemalaCityDestination = actualDestination?.toLowerCase().includes('guatemala city') || 
    actualDestination?.toLowerCase().includes('ciudad de guatemala');

  const renderPackageForm = () => (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto px-6 md:px-8">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-primary" />
            <span>{editMode ? `Editar Solicitud ${initialData?.id ? `#${initialData.id}` : ''}` : 'Nueva Solicitud de Paquete'}</span>
          </DialogTitle>
          <DialogDescription className="text-left">
            {editMode 
              ? 'Modifica la información de tu solicitud. Puedes agregar más productos.'
              : 'Completa la información del producto que necesitas. Nuestro equipo revisará tu solicitud.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Type Selector - Applies to entire form */}
          <div className="border-b pb-4">
            <Label className="text-base font-medium">Tipo de solicitud *</Label>
            <RadioGroup
              value={formRequestType}
              onValueChange={(value: 'online' | 'personal') => setFormRequestType(value)}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="type-online" />
                <Label htmlFor="type-online" className="cursor-pointer font-medium">
                  Compra Online
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="personal" id="type-personal" />
                <Label htmlFor="type-personal" className="cursor-pointer font-medium">
                  Pedido Personal
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">
                {formRequestType === 'online' ? `Productos * (${products.length}/5)` : 'Detalles del pedido *'}
              </Label>
            </div>
            
            <div className="space-y-3">
              {products.map((product, index) => (
                <div key={index} className={formRequestType === 'online' ? "border border-gray-200 rounded-lg p-3 space-y-3" : "space-y-3"}>
                  {formRequestType === 'online' && (
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
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    {/* Conditional fields based on requestType */}
                    {formRequestType === 'online' ? (
                      <>
                        {/* Online Purchase Fields */}
                        <div>
                          <Label htmlFor={`itemLink-${index}`} className="text-xs text-muted-foreground">Link del producto *</Label>
                          <div className="relative">
                            <Link2 className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                            <Input
                              id={`itemLink-${index}`}
                              type="url"
                              placeholder="https://amazon.com/producto..."
                              value={product.itemLink || ''}
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
                            className="min-h-[60px] resize-none text-sm"
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
                              value={product.quantity || '1'}
                              onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                              className="h-8 text-sm"
                              required
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Personal Order Fields */}
                        <div>
                          <Label htmlFor={`itemDescription-${index}`} className="text-xs text-muted-foreground">Detalles completos del pedido *</Label>
                          <Textarea
                            id={`itemDescription-${index}`}
                            placeholder="Describe detalladamente el producto, marca, modelo, color, tamaño, etc."
                            value={product.itemDescription}
                            onChange={(e) => updateProduct(index, 'itemDescription', e.target.value)}
                            className="min-h-[80px] resize-none text-sm"
                            rows={3}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`instructions-${index}`} className="text-xs text-muted-foreground">Instrucciones específicas *</Label>
                          <Textarea
                            id={`instructions-${index}`}
                            placeholder='Ej: "Ir a Best Buy en Miami y devolver este producto" o "Recibir paquete en tu domicilio, lo enviaré por USPS"'
                            value={product.instructions || ''}
                            onChange={(e) => updateProduct(index, 'instructions', e.target.value)}
                            className="min-h-[80px] resize-none text-sm"
                            rows={3}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`weight-${index}`} className="text-xs text-muted-foreground">Peso aproximado (kg) *</Label>
                            <div className="relative">
                              <Weight className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                              <Input
                                id={`weight-${index}`}
                                type="number"
                                step="0.1"
                                placeholder="2.5"
                                value={product.weight || ''}
                                onChange={(e) => updateProduct(index, 'weight', e.target.value)}
                                className="pl-7 h-8 text-sm"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor={`declaredValue-${index}`} className="text-xs text-muted-foreground">Valor del producto (USD) *</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                              <Input
                                id={`declaredValue-${index}`}
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
                        </div>

                        <div>
                          <Label htmlFor={`itemLink-${index}`} className="text-xs text-muted-foreground">Link de referencia (opcional)</Label>
                          <div className="relative">
                            <Link2 className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                            <Input
                              id={`itemLink-${index}`}
                              type="url"
                              placeholder=""
                              value={product.itemLink || ''}
                              onChange={(e) => updateProduct(index, 'itemLink', e.target.value)}
                              className="pl-7 h-8 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Fotos del producto (1-5) *</Label>
                          <ProductPhotoUpload
                            photos={product.productPhotos || []}
                            onPhotosChange={(photos) => updateProduct(index, 'productPhotos', photos)}
                            maxPhotos={5}
                            required={true}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {formRequestType === 'online' && products.length < 5 && (
              <Button
                type="button"
                variant="shopper"
                size="sm"
                onClick={addProduct}
                className="flex items-center space-x-1 font-semibold shadow-sm w-fit"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar más productos</span>
              </Button>
            )}

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

          {/* Destination selection - different for personal orders */}
          {formRequestType === 'personal' ? (
            <div className="space-y-2">
              <Label>Destino del paquete *</Label>
              <Select 
                value={selectedCountry} 
                onValueChange={(value) => {
                  setSelectedCountry(value);
                  handleInputChange('packageDestination', '');
                  handleInputChange('packageDestinationOther', '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    formRequestType === 'personal' 
                      ? "¿Cuál es el destino final del paquete?" 
                      : "Selecciona el país"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {destinationCountries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>{country.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCountry && (
                <>
                  <Select value={formData.packageDestination} onValueChange={(value) => handleInputChange('packageDestination', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {citiesByCountry[selectedCountry]?.map((city) => (
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
                </>
              )}
            </div>
          ) : (
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
          )}

          <div className="space-y-2">
            <Label htmlFor="purchaseOrigin">Origen del paquete *</Label>
            <Select value={formData.purchaseOrigin} onValueChange={(value) => handleInputChange('purchaseOrigin', value)}>
              <SelectTrigger>
                <SelectValue placeholder={
                  formRequestType === 'personal' 
                    ? "¿Desde qué país sale el paquete?" 
                    : "¿Desde qué país estás comprando?"
                } />
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

          {/* Delivery method - shown for any destination */}
          {isGuatemalaDestination && (
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Forma de entrega en {formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination} *
              </Label>
               <div className="space-y-3">
                 {/* Solo mostrar opción de pickup si es Guatemala City */}
                 {isGuatemalaCityDestination && (
                   <div 
                     onClick={() => handleInputChange('deliveryMethod', 'pickup')}
                     className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                       formData.deliveryMethod === 'pickup' 
                         ? 'border-primary bg-primary/5' 
                         : 'border-gray-200 hover:border-gray-300'
                     }`}
                   >
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium">Lo recojo en zona 14</p>
                         <p className="text-sm text-muted-foreground">Gratis - Recoge en nuestra oficina</p>
                       </div>
                       {formData.deliveryMethod === 'pickup' && (
                         <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                           <div className="w-2 h-2 rounded-full bg-white"></div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}
                 
                 {/* Opción de delivery siempre disponible */}
                 <div 
                   onClick={() => handleInputChange('deliveryMethod', 'delivery')}
                   className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                     formData.deliveryMethod === 'delivery' 
                       ? 'border-primary bg-primary/5' 
                       : 'border-gray-200 hover:border-gray-300'
                   }`}
                 >
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="font-medium">Enviarlo a mi domicilio</p>
                       {!isGuatemalaCityDestination && (
                         <p className="text-sm text-muted-foreground">El costo varía según ubicación</p>
                       )}
                     </div>
                     {formData.deliveryMethod === 'delivery' && (
                       <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                         <div className="w-2 h-2 rounded-full bg-white"></div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
              
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
              
              {isGuatemalaCityDestination ? (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    📌 <strong>Nota:</strong> El envío a domicilio dentro de Ciudad de Guatemala tiene un costo de Q25 (gratis para usuarios Prime).
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    📌 <strong>Nota:</strong> El costo de envío a domicilio fuera de Ciudad de Guatemala es de Q60 (Q35 para usuarios Prime).
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Fecha límite de entrega</Label>
            <p className="text-xs text-muted-foreground">
              ¿Para cuándo necesitas el producto? (opcional)
            </p>
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
      </DialogContent>
    </Dialog>
  );

  // In edit mode, show form directly (profile already validated during creation)
  if (editMode) {
    return renderPackageForm();
  }

  // In create mode, show form directly (no longer blocking on profile completion)
  return renderPackageForm();
};

export default PackageRequestForm;
