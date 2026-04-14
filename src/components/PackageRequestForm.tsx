import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFormAutosave } from "@/hooks/useFormAutosave";
import { useModalState } from "@/contexts/ModalStateContext";
import { useTabVisibilityProtection } from "@/hooks/useTabVisibilityProtection";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Package, Link2, DollarSign, AlertCircle, MapPin, Globe, Plus, Trash2, Weight, ChevronLeft, ChevronRight, Check, ShoppingCart, Truck, Search } from "lucide-react";
import OnboardingBottomSheet from "@/components/onboarding/OnboardingBottomSheet";
import type { OnboardingSlide } from "@/components/onboarding/OnboardingBottomSheet";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import AddressForm from "@/components/AddressForm";
import ProductPhotoUpload from "@/components/ProductPhotoUpload";
import type { Product } from "@/types";
import { inferCountryFromCity } from "@/lib/cities";
import { useDeliveryPoints } from "@/hooks/useDeliveryPoints";
import { MetaPixel } from "@/lib/metaPixel";
import "./ui/mobile-safe-form.css";

interface PackageRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (packageData: any) => void;
  editMode?: boolean;
  initialData?: any;
}

const PackageRequestForm = ({ isOpen, onClose, onSubmit, editMode = false, initialData }: PackageRequestFormProps) => {
  const isMobile = useIsMobile();
  const { openModal, closeModal } = useModalState();
  const { profile, updateProfile, userRole } = useAuth();
  const { getDeliveryPointByCity } = useDeliveryPoints();
  useTabVisibilityProtection({ preventNavigationWithModals: true });
  
  // Onboarding bottom sheet state
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Initialize data based on mode - helper functions
  const getInitialProducts = (): Product[] => {
    if (editMode && initialData?.products_data) {
      if (Array.isArray(initialData.products_data)) {
        return initialData.products_data;
      } else {
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
        internalNotes: initialData.internal_notes || '',
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
      internalNotes: '',
      packageDestination: '',
      packageDestinationOther: '',
      purchaseOrigin: '',
      purchaseOriginOther: '',
      deliveryMethod: '',
      requestType: 'online' as 'online' | 'personal'
    };
  };

  const getInitialFormState = () => ({
    products: editMode ? getInitialProducts() : [{
      itemLink: '',
      itemDescription: '',
      estimatedPrice: '',
      quantity: '1',
      requestType: 'online' as 'online' | 'personal'
    }],
    formData: editMode ? getInitialFormData() : {
      deliveryDeadline: null as Date | null,
      additionalNotes: '',
      internalNotes: '',
      packageDestination: '',
      packageDestinationOther: '',
      purchaseOrigin: '',
      purchaseOriginOther: '',
      deliveryMethod: '',
      requestType: 'online' as 'online' | 'personal'
    },
    addressData: (editMode && initialData?.delivery_address) ? initialData.delivery_address : null,
    formRequestType: editMode ? getInitialRequestType() : 'online' as 'online' | 'personal',
    selectedCountry: (editMode && initialData?.package_destination_country) 
      ? initialData.package_destination_country 
      : '' as string,
    showAddressForm: false,
    isReturn: false,
    shopperNameOverride: (editMode && initialData?.shopper_name_override) ? initialData.shopper_name_override : ''
  });

  // Auto-guardado del formulario completo (solo en modo create)
  const formKey = editMode ? `package-form-edit-${initialData?.id}` : `package-form-create:${window.location.pathname}`;
  const { values: formState, setValues: setFormState, updateField, reset: resetFormDraft, isDirty } = useFormAutosave(
    formKey,
    getInitialFormState(),
    { debounceMs: 400, storage: 'local' }
  );

  // Wizard step state - starts at step 1 (no more step 0)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Shopper onboarding slides
  const shopperOnboardingSlides: OnboardingSlide[] = [
    {
      icon: Search,
      title: "¡Estás a punto de pedir tu primer Favorón!",
      description: "Describe el producto que necesitas y de dónde quieres que lo traigan. Un viajero lo llevará por ti.",
    },
    {
      icon: DollarSign,
      title: "Recibe una cotización",
      description: "Un viajero te enviará el costo de traer tu paquete, que incluye su propina y la tarifa de servicio. Adicionalmente, si el viajero pagó algún impuesto o tasa, deberás cubrir ese costo para recibir tu paquete.",
    },
    {
      icon: ShoppingCart,
      title: "Compra tu producto",
      description: "Una vez aceptada la cotización, compra el producto y envíalo a la dirección del viajero.",
    },
    {
      icon: Package,
      title: "¡Recibe tu paquete!",
      description: "Retíralo en nuestra oficina o solicita envío a domicilio. ¡Así de fácil!",
    },
  ];

  // Reset step when modal opens - show onboarding if needed
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      const shouldShowOnboarding = !editMode && profile?.ui_preferences?.skip_package_intro !== true;
      setShowOnboarding(shouldShowOnboarding);
    }
  }, [isOpen, editMode, profile?.ui_preferences?.skip_package_intro]);

  // Desestructurar estado para facilitar acceso
  const products = formState.products;
  const formData = formState.formData;
  const addressData = formState.addressData;
  const formRequestType = formState.formRequestType;
  const selectedCountry = formState.selectedCountry;
  const showAddressForm = formState.showAddressForm;

  // Helpers para actualizar partes específicas del estado (soportan callbacks)
  const setProducts = (newProducts: typeof products | ((prev: typeof products) => typeof products)) => {
    if (typeof newProducts === 'function') {
      setFormState(prev => ({ ...prev, products: newProducts(prev.products) }));
    } else {
      updateField('products', newProducts);
    }
  };
  
  const setFormData = (newFormData: typeof formData | ((prev: typeof formData) => typeof formData)) => {
    if (typeof newFormData === 'function') {
      setFormState(prev => ({ ...prev, formData: newFormData(prev.formData) }));
    } else {
      updateField('formData', newFormData);
    }
  };
  
  const setAddressData = (newAddress: typeof addressData) => updateField('addressData', newAddress);
  const setFormRequestType = (newType: typeof formRequestType) => updateField('formRequestType', newType);
  const setSelectedCountry = (country: string) => updateField('selectedCountry', country);
  const setShowAddressForm = (show: boolean) => updateField('showAddressForm', show);
  
  // Helper para estado de devolución
  const isReturn = formState.isReturn || false;
  const setIsReturn = (value: boolean) => updateField('isReturn', value);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmar salida si hay cambios sin guardar (solo en modo create)
  useEffect(() => {
    if (editMode) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro que quieres salir?';
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, editMode]);

  // Sync all products' requestType when formRequestType changes
  useEffect(() => {
    setProducts(prev => {
      const updated = prev.map(p => ({ ...p, requestType: formRequestType }));
      if (formRequestType === 'personal' && updated.length > 1) {
        return [updated[0]];
      }
      return updated;
    });
  }, [formRequestType]);

  // Resetear país de destino si es devolución y tenía Guatemala seleccionado
  useEffect(() => {
    if (isReturn && selectedCountry === 'Guatemala') {
      setSelectedCountry('');
      handleInputChange('packageDestination', '');
      handleInputChange('packageDestinationOther', '');
    }
  }, [isReturn, selectedCountry]);

  const destinationCountries = [
    { value: 'Guatemala', label: 'Guatemala' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
    { value: 'España', label: 'España' },
    { value: 'México', label: 'México' },
    { value: 'Otro', label: 'Otro país' }
  ];

  const citiesByCountry: Record<string, string[]> = {
    'Guatemala': [
      'Cualquier ciudad', 'Guatemala City', 'Sacatepéquez', 'Chimaltenango', 'Escuintla',
      'Santa Rosa', 'Sololá', 'Totonicapán', 'Quetzaltenango', 'Suchitepéquez',
      'Retalhuleu', 'San Marcos', 'Huehuetenango', 'Quiché', 'Baja Verapaz',
      'Alta Verapaz', 'Petén', 'Izabal', 'Zacapa', 'Chiquimula',
      'Jalapa', 'Jutiapa', 'El Progreso', 'Otra ciudad'
    ],
    'Estados Unidos': [
      'Cualquier ciudad', 'Miami', 'New York', 'Los Angeles', 'Houston', 'Chicago',
      'San Francisco', 'Dallas', 'Atlanta', 'Phoenix',
      'Las Vegas', 'Orlando', 'Washington D.C.', 'Otra ciudad'
    ],
    'España': [
      'Cualquier ciudad', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga',
      'Bilbao', 'Zaragoza', 'Granada', 'Palma de Mallorca',
      'San Sebastián', 'Otra ciudad'
    ],
    'México': [
      'Cualquier ciudad', 'Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún',
      'Tijuana', 'Puebla', 'León', 'Mérida', 'Querétaro',
      'Toluca', 'Otra ciudad'
    ],
    'Otro': ['Cualquier ciudad', 'Otra ciudad']
  };

  // Para compra online - sin Guatemala (tiendas extranjeras)
  const onlinePurchaseOrigins = [
    { value: 'Estados Unidos', label: 'Estados Unidos' },
    { value: 'España', label: 'España' },
    { value: 'México', label: 'México' },
    { value: 'Colombia', label: 'Colombia' },
    { value: 'Panamá', label: 'Panamá' },
    { value: 'El Salvador', label: 'El Salvador' },
    { value: 'Honduras', label: 'Honduras' },
    { value: 'China', label: 'China' },
    { value: 'Otro', label: 'Otro' }
  ];

  // Para pedido personal - con Guatemala (paquete puede estar localmente)
  const personalPackageOrigins = [
    { value: 'Guatemala', label: 'Guatemala' },
    { value: 'Estados Unidos', label: 'Estados Unidos' },
    { value: 'España', label: 'España' },
    { value: 'México', label: 'México' },
    { value: 'Colombia', label: 'Colombia' },
    { value: 'Panamá', label: 'Panamá' },
    { value: 'El Salvador', label: 'El Salvador' },
    { value: 'Honduras', label: 'Honduras' },
    { value: 'China', label: 'China' },
    { value: 'Otro', label: 'Otro' }
  ];

  // Get the actual destination value
  const actualDestination = formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination;
  const isGuatemalaDestination = !!actualDestination;
  const isGuatemalaCityDestination = actualDestination?.toLowerCase().includes('guatemala city') || 
    actualDestination?.toLowerCase().includes('ciudad de guatemala');

  // ============= STEP VALIDATION =============
  
  // Step 1 validation (Tipo de solicitud + Origen)
  const validateStep1 = (): { valid: boolean; missingFields: string[] } => {
    const finalOrigin = formData.purchaseOrigin === 'Otro' ? formData.purchaseOriginOther : formData.purchaseOrigin;
    const missingFields: string[] = [];
    if (!formRequestType) missingFields.push('tipo de solicitud');
    if (!finalOrigin) missingFields.push('país de origen');
    return { valid: missingFields.length === 0, missingFields };
  };

  // Step 2 validation (Productos)
  const validateStep2 = (): { valid: boolean; missingFields: string[] } => {
    const missingFields: string[] = [];
    
    const isValidProduct = (p: Product) => {
      if (formRequestType === 'personal') {
        return p.itemDescription && p.instructions && p.weight && p.estimatedPrice && p.productPhotos && p.productPhotos.length > 0;
      } else {
        return p.itemLink && p.itemDescription && p.estimatedPrice;
      }
    };
    
    if (!products.every(isValidProduct)) {
      if (formRequestType === 'personal') {
        missingFields.push('descripción, instrucciones, peso, valor y fotos del producto');
      } else {
        missingFields.push('link, descripción y precio de productos');
      }
    }
    
    return { valid: missingFields.length === 0, missingFields };
  };

  // Step 3 validation (Destino + Entrega combinados)
  const validateStep3 = (): { valid: boolean; missingFields: string[] } => {
    const finalDestination = formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination;
    
    const missingFields: string[] = [];
    
    if (!selectedCountry) missingFields.push('país de destino');
    if (!finalDestination) missingFields.push('ciudad de destino');
    if (!formData.deliveryMethod) missingFields.push('método de entrega');
    if (formData.deliveryMethod === 'delivery' && !addressData) {
      missingFields.push('dirección de entrega');
    }

    // Cross-validate: city must belong to the selected country
    if (selectedCountry && finalDestination && finalDestination !== 'Cualquier ciudad') {
      const countryCities = citiesByCountry[selectedCountry] || [];
      const cityBelongsToCountry = countryCities.includes(finalDestination) || formData.packageDestination === 'Otra ciudad';
      if (!cityBelongsToCountry) {
        // Check if the city belongs to a different country
        const inferredCountry = inferCountryFromCity(finalDestination);
        if (inferredCountry && inferredCountry !== selectedCountry) {
          missingFields.push(`la ciudad "${finalDestination}" no corresponde al país "${selectedCountry}" (debería ser "${inferredCountry}")`);
        }
      }
    }
    
    return { valid: missingFields.length === 0, missingFields };
  };

  // Free navigation between steps (0 = intro, 1-4 = form wizard)
  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  // Manual submit handler - no event, no form element
  const handleManualSubmit = async () => {
    console.log('🚨 MANUAL SUBMIT TRIGGERED', { currentStep, totalSteps });
    
    // Double-check we're on step 4
    if (currentStep !== 4) {
      console.log('❌ BLOCKED - Not on final step (step 4)');
      return;
    }
    
    if (isSubmitting) return;
    
    console.log('📝 FORM SUBMIT DEBUG - Starting form submission...');
    setIsSubmitting(true);
    
    const finalDestination = formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination;
    const finalOrigin = formData.purchaseOrigin === 'Otro' ? formData.purchaseOriginOther : formData.purchaseOrigin;
    
    // Validate ALL steps before submitting
    const { valid: step1Valid, missingFields: step1Missing } = validateStep1();
    const { valid: step2Valid, missingFields: step2Missing } = validateStep2();
    const { valid: step3Valid, missingFields: step3Missing } = validateStep3();
    
    const allMissingFields = [...step1Missing, ...step2Missing, ...step3Missing];
    
    if (allMissingFields.length > 0) {
      console.error('❌ Form validation failed:', allMissingFields);
      alert(`Campos faltantes: ${allMissingFields.join(', ')}`);
      
      // Navigate to the first step with errors
      if (!step1Valid) {
        setCurrentStep(1);
      } else if (!step2Valid) {
        setCurrentStep(2);
      } else if (!step3Valid) {
        setCurrentStep(3);
      }
      
      setIsSubmitting(false);
      return;
    }

    const submitData: any = {
      ...formData,
      deliveryDeadline: formData.deliveryDeadline 
        ? (formData.deliveryDeadline instanceof Date 
            ? formData.deliveryDeadline 
            : new Date(formData.deliveryDeadline))
        : null,
      products: products,
      packageDestination: finalDestination,
      packageDestinationCountry: selectedCountry, // Pass the selected country (required field)
      purchaseOrigin: finalOrigin,
      deliveryAddress: formData.deliveryMethod === 'delivery' ? addressData : null,
      deliveryMethod: formData.deliveryMethod,
      internal_notes: formData.internalNotes,
      shopperNameOverride: formState.shopperNameOverride?.trim() || null
    };

    if (editMode && initialData?.id) {
      submitData.id = initialData.id;
    }

    console.log('📝 FORM SUBMIT DEBUG - Final submit data:', submitData);
    
    try {
      await onSubmit(submitData);
      console.log('✅ FORM SUBMIT DEBUG - onSubmit completed successfully');
      
      MetaPixel.trackPackageLead({
        destination: submitData.packageDestination,
        origin: submitData.purchaseOrigin
      });
      
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
          internalNotes: '',
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
        setCurrentStep(1);
        
        resetFormDraft();
      }
      
      onClose();
    } catch (error) {
      console.error('❌ FORM SUBMIT ERROR:', error);
      
      const { logFormError } = await import('@/lib/formErrorLogger');
      logFormError(error, 'package-request-form', {
        productsCount: products.length,
        hasDeliveryMethod: !!formData.deliveryMethod,
        isGuatemalaDestination: isGuatemalaDestination,
        hasAddressData: !!addressData,
        formMode: editMode ? 'edit' : 'create',
        isSafariIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent)
      });
      
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
      const quantity = parseInt(product.quantity || '0');
      return total + (price * quantity);
    }, 0);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
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

  // ============= STEP INDICATOR COMPONENT =============
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-2 overflow-hidden">
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Step 1 - Tipo */}
        <button
          type="button"
          onClick={() => goToStep(1)}
          className="flex items-center cursor-pointer group"
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all sm:hover:ring-2 sm:hover:ring-primary/50",
            currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            1
          </div>
          <span className={cn(
            "ml-2 text-sm font-medium hidden sm:inline transition-colors sm:group-hover:text-primary",
            currentStep === 1 ? 'text-primary' : 'text-muted-foreground'
          )}>
            Tipo
          </span>
        </button>

        {/* Connector 1-2 */}
        <div className={cn("w-2 sm:w-4 h-0.5 transition-colors", currentStep >= 2 ? 'bg-primary' : 'bg-muted')} />

        {/* Step 2 - Productos */}
        <button
          type="button"
          onClick={() => goToStep(2)}
          className="flex items-center cursor-pointer group"
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all sm:hover:ring-2 sm:hover:ring-primary/50",
            currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            2
          </div>
          <span className={cn(
            "ml-2 text-sm font-medium hidden sm:inline transition-colors sm:group-hover:text-primary",
            currentStep === 2 ? 'text-primary' : 'text-muted-foreground'
          )}>
            Productos
          </span>
        </button>

        {/* Connector 2-3 */}
        <div className={cn("w-2 sm:w-4 h-0.5 transition-colors", currentStep >= 3 ? 'bg-primary' : 'bg-muted')} />

        {/* Step 3 - Ruta y Entrega */}
        <button
          type="button"
          onClick={() => goToStep(3)}
          className="flex items-center cursor-pointer group"
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all sm:hover:ring-2 sm:hover:ring-primary/50",
            currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            3
          </div>
          <span className={cn(
            "ml-2 text-sm font-medium hidden sm:inline transition-colors sm:group-hover:text-primary",
            currentStep === 3 ? 'text-primary' : 'text-muted-foreground'
          )}>
            Ruta
          </span>
        </button>

        {/* Connector 3-4 */}
        <div className={cn("w-2 sm:w-4 h-0.5 transition-colors", currentStep >= 4 ? 'bg-primary' : 'bg-muted')} />

        {/* Step 4 - Confirmar */}
        <button
          type="button"
          onClick={() => goToStep(4)}
          className="flex items-center cursor-pointer group"
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all sm:hover:ring-2 sm:hover:ring-primary/50",
            currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            4
          </div>
          <span className={cn(
            "ml-2 text-sm font-medium hidden sm:inline transition-colors sm:group-hover:text-primary",
            currentStep === 4 ? 'text-primary' : 'text-muted-foreground'
          )}>
            Confirmar
          </span>
        </button>
      </div>
    </div>
  );

  // Handle onboarding continue
  const handleOnboardingContinue = async (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      try {
        await updateProfile({
          ui_preferences: {
            ...profile?.ui_preferences,
            skip_package_intro: true,
          },
        });
      } catch (error) {
        console.error('Error saving intro preference:', error);
      }
    }
    setShowOnboarding(false);
  };

  // ============= STEP 1: TIPO DE SOLICITUD =============
  const renderStep1 = () => {
  const handleTypeSelect = (type: 'online' | 'personal') => {
    setFormRequestType(type);
    // Reset isReturn when switching away from personal
    if (type === 'online') {
      setIsReturn(false);
    }
  };

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Admin-only: Shopper name override */}
        {userRole?.role === 'admin' && (
          <div className="p-3 rounded-lg border-2 border-amber-300 bg-amber-50/50">
            <Label htmlFor="shopperNameOverride" className="text-sm font-semibold text-amber-800">
              📋 Nombre del Shopper
            </Label>
            <Input
              id="shopperNameOverride"
              value={formState.shopperNameOverride || ''}
              onChange={(e) => updateField('shopperNameOverride', e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="mt-1 border-amber-300 focus:border-amber-500"
            />
          </div>
        )}

        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">¿Qué tipo de pedido necesitas?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona el tipo de solicitud y el país de origen
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Compra Online Card */}
          <button
            type="button"
            onClick={() => handleTypeSelect('online')}
            className={cn(
              "p-3 rounded-xl border-2 text-left transition-all sm:hover:shadow-md group touch-manipulation",
              formRequestType === 'online' 
                ? 'border-primary bg-primary/5 shadow-md' 
                : 'border-border sm:hover:border-primary/50'
            )}
          >
            <div className="flex flex-row items-center gap-3 space-y-0">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                formRequestType === 'online' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted sm:group-hover:bg-primary/20'
              )}>
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base">Compra en Línea</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Compraré en línea y enviaré el paquete al viajero
                </p>
              </div>
              {formRequestType === 'online' && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
          </button>

          {/* Pedido Personal Card */}
          <button
            type="button"
            onClick={() => handleTypeSelect('personal')}
            className={cn(
              "p-3 rounded-xl border-2 text-left transition-all sm:hover:shadow-md group touch-manipulation",
              formRequestType === 'personal' 
                ? 'border-primary bg-primary/5 shadow-md' 
                : 'border-border sm:hover:border-primary/50'
            )}
          >
            <div className="flex flex-row items-center gap-3 space-y-0">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                formRequestType === 'personal' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted sm:group-hover:bg-primary/20'
              )}>
                <Package className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base">Ya Tengo el Paquete</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ya tengo el artículo y necesito que un viajero lo lleve
                </p>
              </div>
              {formRequestType === 'personal' && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Pregunta de devolución - solo para Pedido Personal */}
        {formRequestType === 'personal' && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <Label className="text-base font-medium">¿Tu pedido es una devolución?</Label>
            <RadioGroup
              value={isReturn ? 'yes' : 'no'}
              onValueChange={(value) => setIsReturn(value === 'yes')}
              className="mt-3 space-y-2"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="no" id="return-no" />
                <Label htmlFor="return-no" className="cursor-pointer">
                  No - Es un pedido normal
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="yes" id="return-yes" />
                <Label htmlFor="return-yes" className="cursor-pointer">
                  Sí - Necesito devolver un producto
                </Label>
              </div>
            </RadioGroup>
            {isReturn && (
              <p className="text-xs text-muted-foreground mt-2 pl-6">
                El viajero entregará tu paquete en un punto de devolución en el país de destino
              </p>
            )}
          </div>
        )}

        {/* Origen del paquete */}
        <div className="space-y-2 pt-2">
          <Label htmlFor="purchaseOrigin">¿En qué país está {formRequestType === 'personal' ? 'tu PAQUETE' : 'la TIENDA'}? *</Label>
          <p className="text-xs text-muted-foreground">
            {formRequestType === 'personal' 
              ? "El país desde donde enviarás tu paquete personal" 
              : "Donde comprarás tu producto (ej: Amazon USA, eBay)"}
          </p>
          <Select value={formData.purchaseOrigin} onValueChange={(value) => handleInputChange('purchaseOrigin', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el país de origen" />
            </SelectTrigger>
            <SelectContent>
              {(formRequestType === 'personal' ? personalPackageOrigins : onlinePurchaseOrigins).map((origin) => (
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

        {/* Fecha límite opcional - movida del paso 3 */}
        <div className="space-y-2 pt-2">
          <Label>Fecha límite de entrega</Label>
          <p className="text-xs text-muted-foreground">
            ¿Para cuándo necesitas el producto? (opcional)
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal touch-manipulation"
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
            <PopoverContent className="w-auto p-0 z-[60]" align="start">
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
      </div>
    );
  };
  // ============= STEP 2: PRODUCTOS =============
  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Products Section */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">
            {formRequestType === 'online' ? `¿Qué vas a comprar? * (${products.length}/5)` : '¿Qué vas a comprar? *'}
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            {formRequestType === 'online' 
              ? 'Agrega los productos que deseas comprar online'
              : 'Describe el producto que necesitas que un viajero recoja'}
          </p>
        </div>
        
        <div className="space-y-3">
          {products.map((product, index) => (
            <div key={index} className={formRequestType === 'online' ? "border border-border rounded-lg p-3 space-y-3" : "space-y-3"}>
              {formRequestType === 'online' && (
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Producto #{index + 1}</Label>
                  {products.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="flex items-center space-x-1 text-destructive sm:hover:text-destructive h-7 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="text-xs">Eliminar</span>
                    </Button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
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
                          placeholder="#"
                          value={product.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                          className="h-8 text-sm"
                          required
                        />
                      </div>
                    </div>

                    {/* Necesita empaque original */}
                    <div className="pt-3 border-t border-border/50 mt-3">
                      <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Package className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Empaque original del producto</Label>
                            <p className="text-xs text-muted-foreground leading-snug">
                              Necesito la caja/empaque de la marca (ej: caja del iPhone, bolsa de Nike). No es la caja de envío.
                            </p>
                          </div>
                        </div>
                        <RadioGroup
                          value={product.needsOriginalPackaging === true ? 'yes' : 'no'}
                          onValueChange={(value) => updateProduct(index, 'needsOriginalPackaging', value === 'yes')}
                          className="grid grid-cols-2 gap-2"
                        >
                          <label htmlFor={`packaging-yes-${index}`} className="flex items-center gap-2 p-2.5 rounded-md border border-border/50 cursor-pointer sm:hover:bg-muted/50 transition-colors min-h-[44px]">
                            <RadioGroupItem value="yes" id={`packaging-yes-${index}`} />
                            <span className="text-sm">Sí, lo necesito</span>
                          </label>
                          <label htmlFor={`packaging-no-${index}`} className="flex items-center gap-2 p-2.5 rounded-md border border-border/50 cursor-pointer sm:hover:bg-muted/50 transition-colors min-h-[44px]">
                            <RadioGroupItem value="no" id={`packaging-no-${index}`} />
                            <span className="text-sm">No lo necesito</span>
                          </label>
                        </RadioGroup>
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

                    {/* Necesita empaque original */}
                    <div className="pt-3 border-t border-border/50 mt-3">
                      <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Package className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Empaque original del producto</Label>
                            <p className="text-xs text-muted-foreground leading-snug">
                              Necesito la caja/empaque de la marca (ej: caja del iPhone, bolsa de Nike). No es la caja de envío.
                            </p>
                          </div>
                        </div>
                        <RadioGroup
                          value={product.needsOriginalPackaging === true ? 'yes' : 'no'}
                          onValueChange={(value) => updateProduct(index, 'needsOriginalPackaging', value === 'yes')}
                          className="grid grid-cols-2 gap-2"
                        >
                          <label htmlFor={`packaging-personal-yes-${index}`} className="flex items-center gap-2 p-2.5 rounded-md border border-border/50 cursor-pointer sm:hover:bg-muted/50 transition-colors min-h-[44px]">
                            <RadioGroupItem value="yes" id={`packaging-personal-yes-${index}`} />
                            <span className="text-sm">Sí, lo necesito</span>
                          </label>
                          <label htmlFor={`packaging-personal-no-${index}`} className="flex items-center gap-2 p-2.5 rounded-md border border-border/50 cursor-pointer sm:hover:bg-muted/50 transition-colors min-h-[44px]">
                            <RadioGroupItem value="no" id={`packaging-personal-no-${index}`} />
                            <span className="text-sm">No lo necesito</span>
                          </label>
                        </RadioGroup>
                      </div>
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
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm font-medium text-primary">
              Total estimado: ${calculateTotalEstimated().toFixed(2)} USD
            </p>
            <p className="text-xs text-primary/80 mt-1">
              Pedido de {products.length} productos
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ============= STEP 3: DESTINO + ENTREGA (COMBINADOS) =============
  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">

      {/* Destino del paquete */}
      <div className="space-y-2">
        <Label>Destino final del paquete *</Label>
        <p className="text-xs text-muted-foreground">
          El país y ciudad donde deseas recibir tu paquete
        </p>
        <Select
          value={selectedCountry} 
          onValueChange={(value) => {
            setSelectedCountry(value);
            handleInputChange('packageDestination', '');
            handleInputChange('packageDestinationOther', '');
            handleInputChange('deliveryMethod', ''); // Reset delivery method when country changes
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el país de destino" />
          </SelectTrigger>
          <SelectContent>
            {destinationCountries
              .filter(country => !isReturn || country.value !== 'Guatemala')
              .map((country) => (
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

      {/* Sección de Entrega - solo se muestra si hay destino seleccionado */}
      {isReturn && isGuatemalaDestination ? (
        /* Opciones de entrega para DEVOLUCIONES */
        <div className="space-y-4 pt-2 border-t border-border">
          <Label className="text-base font-medium">
            ¿Cómo debe entregar el viajero tu paquete en {selectedCountry}? *
          </Label>
          <div className="space-y-3">
            {/* Opción 1: Punto de devolución */}
            <button type="button"
              onClick={() => handleInputChange('deliveryMethod', 'return_dropoff')}
              className={cn(
                "border-2 rounded-lg p-4 cursor-pointer transition-all touch-manipulation",
                formData.deliveryMethod === 'return_dropoff' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border sm:hover:border-muted-foreground'
              )}
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Entregarlo en un punto de devolución</p>
                  <p className="text-sm text-muted-foreground">
                    El viajero lo dejará en UPS Store, FedEx Office, etc.
                  </p>
                </div>
              </div>
              {formData.deliveryMethod === 'return_dropoff' && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center ml-auto -mt-8">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                </div>
              )}
            </button>
            
            {/* Opción 2: Pickup programado */}
            <button type="button"
              onClick={() => handleInputChange('deliveryMethod', 'return_pickup')}
              className={cn(
                "border-2 rounded-lg p-4 cursor-pointer transition-all touch-manipulation",
                formData.deliveryMethod === 'return_pickup' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border sm:hover:border-muted-foreground'
              )}
            >
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Una empresa recogerá el paquete en tu domicilio en {selectedCountry}</p>
                  <p className="text-sm text-muted-foreground">
                    Ya tienes programado un pickup en la dirección del viajero
                  </p>
                </div>
              </div>
              {formData.deliveryMethod === 'return_pickup' && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center ml-auto -mt-8">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                </div>
              )}
            </button>
          </div>
        </div>
      ) : isGuatemalaDestination ? (
        <div className="space-y-4 pt-2 border-t border-border">
          <Label className="text-base font-medium">
            Forma de entrega en {formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination} *
          </Label>
          <div className="space-y-3">
            {/* Pickup option - show if there's a delivery point for the destination OR if it's Guatemala City */}
            {(() => {
              const destinationDeliveryPoint = getDeliveryPointByCity(actualDestination, selectedCountry);
              const showPickup = isGuatemalaCityDestination || !!destinationDeliveryPoint;
              
              if (!showPickup) return null;
              
              const pickupLabel = destinationDeliveryPoint 
                ? `Recoger en ${destinationDeliveryPoint.name}`
                : 'Pickup en Oficina (zona 14)';
              const pickupAddress = destinationDeliveryPoint?.address_line_1;
              const pickupSubtext = destinationDeliveryPoint
                ? `Gratis - ${pickupAddress || 'Ver dirección al confirmar'}`
                : 'Gratis - Recoge en nuestra oficina';

              return (
                <button type="button"
                  onClick={() => handleInputChange('deliveryMethod', 'pickup')}
                  className={cn(
                    "border-2 rounded-lg p-4 cursor-pointer transition-all touch-manipulation",
                    formData.deliveryMethod === 'pickup' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border sm:hover:border-muted-foreground'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{pickupLabel}</p>
                      <p className="text-sm text-muted-foreground">{pickupSubtext}</p>
                    </div>
                    {formData.deliveryMethod === 'pickup' && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })()}
            
            {/* Opción de delivery siempre disponible */}
            <button type="button"
              onClick={() => handleInputChange('deliveryMethod', 'delivery')}
              className={cn(
                "border-2 rounded-lg p-4 cursor-pointer transition-all touch-manipulation",
                formData.deliveryMethod === 'delivery' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border sm:hover:border-muted-foreground'
              )}
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
                    <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                  </div>
                )}
              </div>
            </button>
          </div>
          
          {/* Mostrar formulario de dirección si seleccionó delivery */}
          {showAddressForm && (
            <AddressForm
              onSubmit={handleAddressSubmit}
              onCancel={handleAddressCancel}
              initialData={addressData}
              destinationCountry={selectedCountry}
              destinationCity={formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination}
            />
          )}
          
          {/* Mostrar resumen de dirección si ya la completó */}
          {formData.deliveryMethod === 'delivery' && addressData && !showAddressForm && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded p-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">✓ Dirección de entrega confirmada</p>
              <p className="text-xs text-green-700 dark:text-green-300">{addressData.streetAddress}, {addressData.cityArea}</p>
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
          
          {/* Notas de costos - solo para Guatemala */}
          {selectedCountry === 'Guatemala' && (
            isGuatemalaCityDestination ? (
              <div className="bg-primary/10 border border-primary/20 rounded p-3">
                <p className="text-sm text-primary">
                  📌 <strong>Nota:</strong> El envío a domicilio dentro de Ciudad de Guatemala tiene un costo de Q25 (gratis para usuarios Prime).
                </p>
              </div>
            ) : (
              <div className="bg-primary/10 border border-primary/20 rounded p-3">
                <p className="text-sm text-primary">
                  📌 <strong>Nota:</strong> El costo de envío a domicilio fuera de Ciudad de Guatemala es de Q60 (Q35 para usuarios Prime).
                </p>
              </div>
            )
          )}
        </div>
      ) : selectedCountry ? (
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
          <Truck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Selecciona una ciudad para ver las opciones de entrega
          </p>
        </div>
      ) : null}
    </div>
  );

  // ============= STEP 4: CONFIRMAR =============
  const renderStep4 = () => {
    const finalOrigin = formData.purchaseOrigin === 'Otro' ? formData.purchaseOriginOther : formData.purchaseOrigin;
    const finalDestination = formData.packageDestination === 'Otra ciudad' ? formData.packageDestinationOther : formData.packageDestination;
    
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Resumen visual */}
        <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Resumen de tu solicitud
          </h3>
          
          {/* Productos */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Productos ({products.length})</p>
            <div className="space-y-2">
              {products.map((product, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm py-1">
                  <div className="flex-1 min-w-0 mr-4">
                    <span className="truncate block">{product.itemDescription || 'Sin descripción'}</span>
                    {product.itemLink && (
                      <a 
                        href={product.itemLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary sm:hover:underline"
                      >
                        link
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-muted-foreground">x{product.quantity || 1}</span>
                    <span className="font-medium">${parseFloat(product.estimatedPrice || '0').toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            {products.length > 1 && (
              <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border">
                <span>Total estimado</span>
                <span>${calculateTotalEstimated().toFixed(2)} USD</span>
              </div>
            )}
          </div>
          
          {/* Ruta */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Ruta</p>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-primary" />
              <span>{finalOrigin || 'No seleccionado'}</span>
              <span className="text-muted-foreground">→</span>
              <MapPin className="h-4 w-4 text-primary" />
              <span>
                {selectedCountry 
                  ? `${selectedCountry}${finalDestination ? `, ${finalDestination}` : ''}`
                  : (finalDestination || 'No seleccionado')
                }
              </span>
            </div>
          </div>
          
          {/* Entrega */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Entrega</p>
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-primary" />
              <span>
                {formData.deliveryMethod === 'pickup' 
                  ? 'Recoger en oficina (zona 14)' 
                  : formData.deliveryMethod === 'delivery'
                    ? `Domicilio: ${addressData?.streetAddress || 'Sin dirección'}`
                    : formData.deliveryMethod === 'return_dropoff'
                      ? 'Punto de devolución (UPS/FedEx/etc.)'
                      : formData.deliveryMethod === 'return_pickup'
                        ? 'Pickup programado en domicilio del viajero'
                        : 'No seleccionado'
                }
              </span>
            </div>
          </div>
          
          {/* Fecha límite */}
          {formData.deliveryDeadline && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Fecha límite</p>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span>{format(formData.deliveryDeadline, "PPP", { locale: es })}</span>
              </div>
            </div>
          )}
        </div>

        {/* Notas adicionales */}
        <div className="space-y-2">
          <Label htmlFor="additionalNotes">Notas adicionales para el viajero</Label>
          <Textarea
            id="additionalNotes"
            placeholder="Información adicional, instrucciones especiales, preferencias de entrega, etc."
            value={formData.additionalNotes}
            onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="internalNotes">Notas adicionales para el equipo de Favorón</Label>
          <Textarea
            id="internalNotes"
            placeholder="Información interna que solo Favoron verá (opcional)"
            value={formData.internalNotes}
            onChange={(e) => handleInputChange('internalNotes', e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">¿Cómo funciona?</p>
              <ul className="space-y-1 text-xs">
                <li>• Revisaremos tu solicitud en menos de 24h</li>
                <li>• Te conectaremos con viajeros disponibles</li>
                <li>• Recibirás cotizaciones y podrás elegir</li>
                <li>• Solo pagas cuando aceptes una cotización</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // ============= NAVIGATION BUTTONS =============
  const renderNavigationButtons = () => {
    return (
      <div className="flex space-x-3 pt-4 border-t border-border">
        {currentStep === 1 ? (
          <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Atrás
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Atrás
          </Button>
        )}
        
        {currentStep !== 4 ? (
          <Button type="button" variant="shopper" onClick={handleNextStep} className="flex-1">
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button 
            type="button" 
            variant="shopper" 
            className="flex-1" 
            disabled={isSubmitting}
            onClick={handleManualSubmit}
          >
            {isSubmitting 
              ? (editMode ? 'Guardando...' : 'Enviando...') 
              : (editMode ? 'Guardar Cambios' : 'Enviar Solicitud')
            }
          </Button>
        )}
      </div>
    );
  };

  const formInnerContent = (
    <>
      {/* Step Indicator */}
      {currentStep >= 1 && <div className="flex-shrink-0"><StepIndicator /></div>}

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 min-h-0 px-6 touch-manipulation">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
      
      {/* Sticky navigation buttons */}
      <div className="flex-shrink-0 pt-4 border-t border-border bg-background px-6 pb-6">
        {renderNavigationButtons()}
      </div>
    </>
  );

  const renderPackageForm = () => {
    if (isMobile) {
      return (
        <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
          <SheetContent side="bottom" className="h-[100dvh] max-h-[100dvh] p-0 flex flex-col rounded-t-2xl touch-manipulation [-webkit-tap-highlight-color:transparent]">
            <SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
              <SheetTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary" />
                <span>{editMode ? `Editar Solicitud` : 'Nueva Solicitud de Paquete'}</span>
              </SheetTitle>
              <SheetDescription className="text-left">
                {editMode 
                  ? 'Modifica la información de tu solicitud.'
                  : 'Completa la información del producto que necesitas.'
                }
              </SheetDescription>
            </SheetHeader>
            {formInnerContent}
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden px-6 md:px-8">
          <DialogHeader className="flex-shrink-0">
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

          {/* Step Indicator */}
          {currentStep >= 1 && <div className="flex-shrink-0"><StepIndicator /></div>}

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 min-h-0">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>
          
          {/* Sticky navigation buttons */}
          <div className="flex-shrink-0 pt-4 border-t border-border bg-background">
            {renderNavigationButtons()}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      {renderPackageForm()}
      <OnboardingBottomSheet
        isOpen={showOnboarding}
        onContinue={handleOnboardingContinue}
        onClose={() => setShowOnboarding(false)}
        slides={shopperOnboardingSlides}
        gradientClassName="from-primary via-primary/80 to-primary/60"
        variant="shopper"
        modal={false}
      />
    </>
  );
};

export default PackageRequestForm;
