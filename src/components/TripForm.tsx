import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { CalendarIcon, Plane, MapPin, Package, AlertCircle, Phone, Building2, FileText, Target, ChevronLeft, ChevronRight, Home, Info, Users, User, DollarSign, Truck, Rocket, Check, Loader2, X } from "lucide-react";
import OnboardingBottomSheet from "@/components/onboarding/OnboardingBottomSheet";
import type { OnboardingSlide } from "@/components/onboarding/OnboardingBottomSheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import MessengerPickupForm from "@/components/MessengerPickupForm";
import TermsAndConditionsModal from "@/components/TermsAndConditionsModal";
import { toast } from "sonner";
import { GoogleAddressInput } from "@/components/ui/google-address-input";

import { COUNTRIES, MAIN_COUNTRIES, COUNTRY_QUICK_OPTIONS } from "@/lib/countries";
import { getCitiesByCountry, countryHasCities } from "@/lib/cities";
import { useDeliveryPoints } from "@/hooks/useDeliveryPoints";
import { logFormError, logFormValidationError } from "@/lib/formErrorLogger";
import { MetaPixel } from "@/lib/metaPixel";
import "./ui/mobile-safe-form.css";

interface TripFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tripData: any) => void;
}

const TripForm = ({
  isOpen,
  onClose,
  onSubmit
}: TripFormProps) => {
  const isMobile = useIsMobile();
  const { openModal, closeModal } = useModalState();
  const { profile, updateProfile } = useAuth();
  useTabVisibilityProtection({ preventNavigationWithModals: true });

  // Estado inicial del formulario completo (starts at step 1, no more step 0)
  const getInitialFormState = () => ({
    currentStep: 1,
    formData: {
      fromCity: '',
      fromCountry: '',
      toCity: '',
      toCityOther: '',
      toCountry: '',
      arrivalDate: null as Date | null,
      availableSpace: '',
      deliveryMethod: '',
      deliveryDate: null as Date | null,
      additionalInfo: '',
      packageReceivingAddress: {
        recipientName: '',
        accommodationType: '',
        streetAddress: '',
        streetAddress2: '',
        cityArea: '',
        postalCode: '',
        hotelAirbnbName: '',
        contactNumber: '',
        additionalInstructions: ''
      },
      firstDayPackages: null as Date | null,
      lastDayPackages: null as Date | null,
      messengerPickupLocation: '',
      boostCode: ''
    },
    messengerData: null as any,
    acceptedTerms: false,
    showTermsModal: false,
    showMessengerForm: false
  });

  // Auto-guardado del formulario completo
  const formKey = `trip-form-create:${window.location.pathname}`;
  const { values: formState, setValues: setFormState, updateField, reset: resetFormDraft, isDirty } = useFormAutosave(
    formKey,
    getInitialFormState(),
    { debounceMs: 400, storage: 'local' }
  );

  // Wizard step state - ahora persistido en formState
  const currentStep = formState.currentStep ?? 1;
  const setCurrentStep = (step: number | ((prev: number) => number)) => {
    if (typeof step === 'function') {
      setFormState(prev => ({ ...prev, currentStep: step(prev.currentStep ?? 1) }));
    } else {
      updateField('currentStep', step);
    }
  };
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [boostStatus, setBoostStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const boostDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const totalSteps = 4;

  // Traveler onboarding slides
  const travelerOnboardingSlides: OnboardingSlide[] = [
    {
      icon: Plane,
      title: "¡Conviértete en Viajero!",
      description: "Registra tu viaje: de dónde vienes, cuándo llegas y cuánto espacio tienes.",
    },
    {
      icon: Users,
      title: "Recibe solicitudes",
      description: "Recibirás solicitudes con la propina asignada. Tú decides cuáles aceptar y cuáles rechazar.",
    },
    {
      icon: DollarSign,
      title: "Cotización y pago",
      description: "Envía tu cotización al shopper. Si no realiza el pago, el pedido no se completa.",
    },
    {
      icon: Package,
      title: "Recibe el paquete",
      description: "El shopper hará la compra y la enviará a tu dirección con comprobante y tracking. Si te cobran impuestos en aduana, se te reembolsarán con factura.",
    },
    {
      icon: Truck,
      title: "Entrega y cobra",
      description: "Entrega en nuestra oficina o programa recolección. Recibirás tu pago al completar la entrega.",
    },
  ];

  // Show onboarding when modal opens if not skipped
  useEffect(() => {
    if (isOpen) {
      const hasSavedStep = formState.currentStep !== undefined && formState.currentStep > 1;
      if (!hasSavedStep) {
        const shouldShowOnboarding = profile?.ui_preferences?.skip_trip_intro !== true;
        setShowOnboarding(shouldShowOnboarding);
      }
    }
  }, [isOpen]);

  // Desestructurar estado para facilitar acceso
  const formData = formState.formData;
  const messengerData = formState.messengerData;
  const acceptedTerms = formState.acceptedTerms;
  const showTermsModal = formState.showTermsModal;
  const showMessengerForm = formState.showMessengerForm;

  const validateBoostCode = useCallback(async (code: string) => {
    if (!code.trim()) { setBoostStatus('idle'); return; }
    setBoostStatus('checking');
    const { data } = await supabase
      .from('boost_codes')
      .select('id')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle();
    setBoostStatus(data ? 'valid' : 'invalid');
  }, []);

  const handleBoostCodeChange = useCallback((value: string) => {
    updateField('formData', { ...formData, boostCode: value.toUpperCase() });
    if (boostDebounceRef.current) clearTimeout(boostDebounceRef.current);
    boostDebounceRef.current = setTimeout(() => validateBoostCode(value), 500);
  }, [formData, validateBoostCode, updateField]);

  // Helpers para actualizar partes específicas del estado (soportan callbacks)
  const setFormData = (newFormData: typeof formData | ((prev: typeof formData) => typeof formData)) => {
    if (typeof newFormData === 'function') {
      setFormState(prev => ({ ...prev, formData: newFormData(prev.formData) }));
    } else {
      updateField('formData', newFormData);
    }
  };

  const setMessengerData = (newData: typeof messengerData) => updateField('messengerData', newData);
  const setAcceptedTerms = (value: boolean) => updateField('acceptedTerms', value);
  const setShowTermsModal = (show: boolean) => updateField('showTermsModal', show);
  const setShowMessengerForm = (show: boolean) => updateField('showMessengerForm', show);

  // Fetch delivery points for international destinations
  const { deliveryPoints, getDeliveryPointByCity } = useDeliveryPoints();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string>('');
  
  // Estado para mostrar lista completa de países
  const [showFullCountryListOrigin, setShowFullCountryListOrigin] = useState(false);
  const [showFullCountryListDestination, setShowFullCountryListDestination] = useState(false);

  // Generate a client request id each time the modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        setRequestId(crypto.randomUUID());
      } catch {
        setRequestId(String(Date.now()));
      }
    }
  }, [isOpen]);

  // Confirmar salida si hay cambios sin guardar
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro que quieres salir?';
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);
  
  // Use centralized city data
  const originCities = getCitiesByCountry(formData.fromCountry);
  const destinationCities = getCitiesByCountry(formData.toCountry);
  
  // Check if destination has a delivery point configured
  const destinationDeliveryPoint = formData.toCity && formData.toCountry 
    ? getDeliveryPointByCity(formData.toCity, formData.toCountry)
    : null;
  
  // Determine if we should show the Guatemala delivery section
  const isDestinationGuatemala = formData.toCountry === 'guatemala';
  const hasInternationalDeliveryPoint = !!destinationDeliveryPoint;
  const hasOfficialDeliveryOptions = isDestinationGuatemala || hasInternationalDeliveryPoint;
  const showDeliverySection = true;

  const accommodationTypes = [{
    value: 'hotel',
    label: 'Hotel'
  }, {
    value: 'airbnb',
    label: 'Airbnb'
  }, {
    value: 'casa',
    label: 'Casa/Apartamento'
  }];

  // Step 1 validation (Viaje)
  const validateStep1 = (): { valid: boolean; missingFields: string[] } => {
    const finalToCity = formData.toCity === 'Otra ciudad' ? formData.toCityOther : formData.toCity;
    
    const requiredFields = [
      { field: formData.fromCountry, name: 'país de origen' },
      { field: formData.fromCity, name: 'ciudad de origen' },
      { field: formData.toCountry, name: 'país de destino' },
      { field: finalToCity, name: 'ciudad de destino' },
      { field: formData.arrivalDate, name: 'fecha de llegada' },
      { field: formData.availableSpace, name: 'espacio disponible' },
    ];

    const missingFields = requiredFields.filter(({ field }) => !field).map(({ name }) => name);
    return { valid: missingFields.length === 0, missingFields };
  };

  // Step 2 validation (Dirección y Fechas)
  const validateStep2 = (): { valid: boolean; missingFields: string[] } => {
    const requiredFields = [
      { field: formData.packageReceivingAddress.recipientName, name: 'nombre del recipiente' },
      { field: formData.packageReceivingAddress.accommodationType, name: 'tipo de alojamiento' },
      { field: formData.packageReceivingAddress.streetAddress, name: 'dirección' },
      { field: formData.packageReceivingAddress.cityArea, name: 'ciudad/estado' },
      { field: formData.packageReceivingAddress.postalCode, name: 'código postal' },
      { field: formData.packageReceivingAddress.contactNumber, name: 'número de contacto' },
      { field: formData.firstDayPackages, name: 'primer día para recibir paquetes' },
      { field: formData.lastDayPackages, name: 'último día para recibir paquetes' },
    ];

    const missingFields = requiredFields.filter(({ field }) => !field).map(({ name }) => name);
    return { valid: missingFields.length === 0, missingFields };
  };

  // Step 3 validation (Entrega)
  const validateStep3 = (): { valid: boolean; missingFields: string[] } => {
    const requiredFields = [
      { field: formData.deliveryMethod, name: 'método de entrega' },
      { field: formData.deliveryDate, name: 'fecha de entrega' },
    ];

    // Validar información de mensajero si seleccionó mensajero
    if (formData.deliveryMethod === 'mensajero' && !messengerData) {
      requiredFields.push({ field: null, name: 'información de recolección por mensajero' });
    }

    const missingFields = requiredFields.filter(({ field }) => !field).map(({ name }) => name);
    return { valid: missingFields.length === 0, missingFields };
  };

  // Free navigation - no validation required to move between steps
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      console.log('🚫 Submission already in progress, ignoring');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📱 Traveler form submission started (mobile compatible)', {
        userAgent: navigator.userAgent,
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        formData: { ...formData, packageReceivingAddress: '[REDACTED]' }
      });

      const finalFromCity = formData.fromCity;
      const finalToCity = formData.toCity === 'Otra ciudad' ? formData.toCityOther : formData.toCity;
      
      // Validate ALL steps before submitting
      const { valid: step1Valid, missingFields: step1Missing } = validateStep1();
      const { valid: step2Valid, missingFields: step2Missing } = validateStep2();
      const { valid: step3Valid, missingFields: step3Missing } = validateStep3();
      
      const allMissingFields = [...step1Missing, ...step2Missing, ...step3Missing];
      
      if (allMissingFields.length > 0) {
        console.error('❌ Form validation failed:', allMissingFields);
        logFormValidationError(allMissingFields, 'traveler-form-complete');
        toast.error(`Campos faltantes: ${allMissingFields.join(', ')}`);
        
        // Navigate to the first step with errors
        if (!step1Valid) {
          setCurrentStep(1);
        } else if (!step2Valid) {
          setCurrentStep(2);
        } else if (!step3Valid) {
          setCurrentStep(3);
        } else {
          setCurrentStep(4);
        }
        
        setIsSubmitting(false);
        return;
      }

      if (!acceptedTerms) {
        toast.error('Debes aceptar los términos y condiciones para continuar');
        console.error('❌ Terms not accepted');
        setCurrentStep(4);
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        ...formData,
        fromCity: finalFromCity,
        toCity: finalToCity,
        messengerPickupInfo: formData.deliveryMethod === 'mensajero' ? messengerData : null,
        client_request_id: requestId,
        boostCode: boostStatus === 'valid' ? (formData.boostCode?.trim() || null) : null
      };

      console.log('✅ Form validation passed, submitting data');
      
      await Promise.resolve(onSubmit(submitData));
      
      console.log('✅ Form submitted successfully');
      
      MetaPixel.trackTripLead({
        from: `${finalFromCity}, ${formData.fromCountry}`,
        to: `${finalToCity}, ${formData.toCountry}`
      });
      
      onClose();

      const initialFormData = {
        fromCity: '',
        fromCountry: '',
        toCity: '',
        toCityOther: '',
        toCountry: '',
        arrivalDate: null as Date | null,
        availableSpace: '',
        deliveryMethod: '',
        deliveryDate: null as Date | null,
        additionalInfo: '',
        packageReceivingAddress: {
          recipientName: '',
          accommodationType: '',
          streetAddress: '',
          streetAddress2: '',
          cityArea: '',
          postalCode: '',
          hotelAirbnbName: '',
          contactNumber: '',
          additionalInstructions: ''
        },
        firstDayPackages: null as Date | null,
        lastDayPackages: null as Date | null,
        messengerPickupLocation: '',
        boostCode: ''
      };
      
      setFormData(initialFormData);
      setShowMessengerForm(false);
      setMessengerData(null);
      setAcceptedTerms(false);
      setShowTermsModal(false);
      setShowFullCountryListOrigin(false);
      setShowFullCountryListDestination(false);
      setCurrentStep(1);
      
      resetFormDraft();
      
    } catch (error) {
      console.error('💥 Error submitting traveler form:', error);
      
      const contextualFormData = {
        ...formData,
        packageReceivingAddress: '[REDACTED]',
        isSafariIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent),
        formFieldsCount: Object.keys(formData).length,
        hasMessengerData: !!messengerData,
        acceptedTerms
      };
      
      logFormError(error, 'traveler-form', contextualFormData);
      
      const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
      const errorMessage = isSafariIOS 
        ? 'Error al enviar el formulario. Si usas Safari en iPhone, intenta: 1) Refrescar la página, 2) Usar Chrome/Firefox, o 3) Contactar soporte.'
        : 'Hubo un error al enviar el formulario. Por favor intenta nuevamente o contacta soporte si el problema persiste.';
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'deliveryMethod') {
      if (value === 'mensajero') {
        setShowMessengerForm(true);
      } else {
        setShowMessengerForm(false);
        setMessengerData(null);
      }
    }
  }, []);

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      packageReceivingAddress: {
        ...prev.packageReceivingAddress,
        [field]: value
      }
    }));
  };

  const handleMessengerSubmit = (pickupData: any) => {
    setMessengerData(pickupData);
    setShowMessengerForm(false);
  };

  const handleMessengerCancel = () => {
    setShowMessengerForm(false);
    setFormData(prev => ({
      ...prev,
      deliveryMethod: ''
    }));
  };

  const getDisplayFromCity = () => {
    if (formData.fromCity) {
      return formData.fromCity.split(',')[0];
    }
    return 'destino';
  };

  const displayToCity = formData.toCity === 'Otra ciudad' ? formData.toCityOther : formData.toCity;

  // Handle onboarding continue
  const handleOnboardingContinue = async (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      try {
        await updateProfile({
          ui_preferences: {
            ...profile?.ui_preferences,
            skip_trip_intro: true,
          },
        });
      } catch (error) {
        console.error('Error saving preference:', error);
      }
    }
    setShowOnboarding(false);
  };

  // Progress indicator component - now clickable for free navigation
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Step 1 */}
        <button
          type="button"
          onClick={() => goToStep(1)}
          className="flex items-center cursor-pointer group"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all sm:hover:ring-2 sm:hover:ring-primary/50 ${
            currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <span className={`ml-2 text-sm font-medium hidden sm:inline transition-colors group-hover:text-primary ${
            currentStep === 1 ? 'text-primary' : 'text-muted-foreground'
          }`}>
            Viaje
          </span>
        </button>

        {/* Connector 1-2 */}
        <div className={`w-6 sm:w-10 h-0.5 transition-colors ${
          currentStep >= 2 ? 'bg-primary' : 'bg-muted'
        }`} />

        {/* Step 2 */}
        <button
          type="button"
          onClick={() => goToStep(2)}
          className="flex items-center cursor-pointer group"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all sm:hover:ring-2 sm:hover:ring-primary/50 ${
            currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
          <span className={`ml-2 text-sm font-medium hidden sm:inline transition-colors group-hover:text-primary ${
            currentStep === 2 ? 'text-primary' : 'text-muted-foreground'
          }`}>
            Dirección
          </span>
        </button>

        {/* Connector 2-3 */}
        <div className={`w-6 sm:w-8 h-0.5 transition-colors ${
          currentStep >= 3 ? 'bg-primary' : 'bg-muted'
        }`} />

        {/* Step 3 */}
        <button
          type="button"
          onClick={() => goToStep(3)}
          className="flex items-center cursor-pointer group"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all sm:hover:ring-2 sm:hover:ring-primary/50 ${
            currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            3
          </div>
          <span className={`ml-2 text-sm font-medium hidden sm:inline transition-colors group-hover:text-primary ${
            currentStep === 3 ? 'text-primary' : 'text-muted-foreground'
          }`}>
            Entrega
          </span>
        </button>

        {/* Connector 3-4 */}
        <div className={`w-6 sm:w-8 h-0.5 transition-colors ${
          currentStep >= 4 ? 'bg-primary' : 'bg-muted'
        }`} />

        {/* Step 4 */}
        <button
          type="button"
          onClick={() => goToStep(4)}
          className="flex items-center cursor-pointer group"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all sm:hover:ring-2 sm:hover:ring-primary/50 ${
            currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            4
          </div>
          <span className={`ml-2 text-sm font-medium hidden sm:inline transition-colors group-hover:text-primary ${
            currentStep === 4 ? 'text-primary' : 'text-muted-foreground'
          }`}>
            Confirmar
          </span>
        </button>
      </div>
    </div>
  );

  // Step 1 content
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      {/* 🟦 1. Información básica del viaje */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium">Información básica del viaje</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Si tu viaje es de ida y vuelta, registra dos viajes separados
          </p>
        </div>

        {/* Sección ORIGEN */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Origen</Label>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="space-y-1">
              <Label htmlFor="fromCountry" className="text-xs text-muted-foreground">País *</Label>
              {!showFullCountryListOrigin ? (
                <Select 
                  value={MAIN_COUNTRIES.some(c => c.value === formData.fromCountry) ? formData.fromCountry : ''}
                  onValueChange={(value) => {
                    if (value === '__otro__') {
                      setShowFullCountryListOrigin(true);
                    } else {
                      handleInputChange('fromCountry', value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full text-sm h-9">
                    <SelectValue placeholder="País de origen">
                      {formData.fromCountry && MAIN_COUNTRIES.find(c => c.value === formData.fromCountry)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {COUNTRY_QUICK_OPTIONS.map(country => (
                      <SelectItem key={country.value} value={country.value}>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{country.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mobile-safe-combobox">
                  <Combobox
                    key="fromCountry-combobox"
                    options={COUNTRIES}
                    value={formData.fromCountry}
                    onValueChange={value => handleInputChange('fromCountry', value)}
                    placeholder="Buscar país..."
                    searchPlaceholder="Buscar país..."
                    emptyMessage="No se encontraron países"
                    className="w-full text-sm h-8"
                    portalled={false}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="fromCity" className="text-xs text-muted-foreground">Ciudad *</Label>
              {countryHasCities(formData.fromCountry) ? (
                <div className="mobile-safe-combobox">
                  <Combobox
                    key="fromCity-combobox"
                    options={originCities}
                    value={formData.fromCity}
                    onValueChange={value => handleInputChange('fromCity', value)}
                    placeholder="Escribe o selecciona tu ciudad"
                    searchPlaceholder="Buscar ciudad..."
                    emptyMessage="No encontrada"
                    className="w-full text-sm h-8"
                    allowCustomValue={true}
                    portalled={false}
                  />
                </div>
              ) : (
                <Input 
                  id="fromCity"
                  type="text" 
                  placeholder="Ciudad" 
                  value={formData.fromCity} 
                  onChange={e => handleInputChange('fromCity', e.target.value)} 
                  required 
                  className="w-full text-sm"
                />
              )}
            </div>
          </div>
        </div>

        {/* Sección DESTINO */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Destino</Label>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="space-y-1">
              <Label htmlFor="toCountry" className="text-xs text-muted-foreground">País *</Label>
              {!showFullCountryListDestination ? (
                <Select 
                  value={MAIN_COUNTRIES.some(c => c.value === formData.toCountry) ? formData.toCountry : ''}
                  onValueChange={(value) => {
                    if (value === '__otro__') {
                      setShowFullCountryListDestination(true);
                    } else {
                      handleInputChange('toCountry', value);
                      handleInputChange('toCity', '');
                      handleInputChange('deliveryMethod', '');
                    }
                  }}
                >
                  <SelectTrigger className="w-full text-sm h-9">
                    <SelectValue placeholder="País de destino">
                      {formData.toCountry && MAIN_COUNTRIES.find(c => c.value === formData.toCountry)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {COUNTRY_QUICK_OPTIONS.map(country => (
                      <SelectItem key={country.value} value={country.value}>
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4" />
                          <span>{country.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mobile-safe-combobox">
                  <Combobox
                    key="toCountry-combobox"
                    options={COUNTRIES}
                    value={formData.toCountry}
                    onValueChange={value => {
                      handleInputChange('toCountry', value);
                      handleInputChange('toCity', '');
                      handleInputChange('deliveryMethod', '');
                    }}
                    placeholder="Buscar país..."
                    searchPlaceholder="Buscar país..."
                    emptyMessage="No se encontraron países"
                    className="w-full text-sm h-8"
                    portalled={false}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="toCity" className="text-xs text-muted-foreground">Ciudad *</Label>
              {countryHasCities(formData.toCountry) ? (
                <div className="mobile-safe-combobox">
                  <Combobox
                    key="toCity-combobox"
                    options={destinationCities}
                    value={formData.toCity}
                    onValueChange={value => handleInputChange('toCity', value)}
                    placeholder="Ciudad"
                    searchPlaceholder="Buscar ciudad..."
                    emptyMessage="No encontrada"
                    className="w-full text-sm h-8"
                    allowCustomValue={true}
                    portalled={false}
                  />
                </div>
              ) : (
                <Input 
                  id="toCity"
                  type="text" 
                  placeholder="Ciudad" 
                  value={formData.toCity} 
                  onChange={e => handleInputChange('toCity', e.target.value)} 
                  required 
                  className="w-full text-sm"
                />
              )}
            </div>
          </div>
          {formData.toCity === 'Otra ciudad' && (
            <Input 
              placeholder="Escribe tu ciudad de destino" 
              value={formData.toCityOther} 
              onChange={e => handleInputChange('toCityOther', e.target.value)} 
              className="mt-2" 
              required 
            />
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Fecha de llegada *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal touch-manipulation">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.arrivalDate ? format(formData.arrivalDate, "PPP", { locale: es }) : <span>Selecciona fecha de llegada</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar 
                mode="single" 
                selected={formData.arrivalDate || undefined} 
                onSelect={date => handleInputChange('arrivalDate', date)} 
                disabled={date => date < new Date()} 
                initialFocus 
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <Label htmlFor="availableSpace" className="text-xs text-muted-foreground">Espacio disponible (kg) *</Label>
          <Input 
            id="availableSpace" 
            type="number" 
            step="0.5" 
            placeholder="5.0" 
            value={formData.availableSpace} 
            onChange={e => handleInputChange('availableSpace', e.target.value)} 
            required 
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="button" variant="traveler" onClick={handleNextStep} className="flex-1">
          Siguiente
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Step 2 content
  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h3 className="text-base font-medium">Dirección para recibir paquetes en {getDisplayFromCity()}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Esta información se comparte únicamente con el shopper si el pedido es aprobado
        </p>
      </div>

      {/* Sección 1: Información del receptor */}
      <div className="bg-muted/30 rounded-xl border border-border/50 p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-traveler">
          <User className="h-4 w-4" />
          Información del receptor
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="recipientName" className="text-xs text-muted-foreground">Nombre del receptor *</Label>
            <Input 
              id="recipientName" 
              type="text" 
              placeholder="Ej: Juan Pérez" 
              value={formData.packageReceivingAddress.recipientName} 
              onChange={e => handleAddressChange('recipientName', e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accommodationType" className="text-xs text-muted-foreground">Tipo de alojamiento *</Label>
            <Select value={formData.packageReceivingAddress.accommodationType} onValueChange={value => handleAddressChange('accommodationType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {accommodationTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactNumber" className="text-xs text-muted-foreground">Número de contacto *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="contactNumber" 
              type="tel" 
              placeholder="+1 (305) 123-4567" 
              value={formData.packageReceivingAddress.contactNumber} 
              onChange={e => handleAddressChange('contactNumber', e.target.value)} 
              className="pl-10" 
              required 
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Este número se usará para coordinar la entrega del paquete. Si te hospedas en hotel, coloca el número del hotel.
          </p>
        </div>
      </div>

      {/* Sección 2: Dirección de recepción */}
      <div className="bg-muted/30 rounded-xl border border-border/50 p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-traveler">
          <MapPin className="h-4 w-4" />
          Dirección de recepción
        </div>

        <div className="space-y-2">
          <Label htmlFor="streetAddress" className="text-xs text-muted-foreground">Dirección línea 1 *</Label>
          <GoogleAddressInput
            value={formData.packageReceivingAddress.streetAddress}
            onChange={(value) => handleAddressChange('streetAddress', value)}
            onPlaceSelected={(addressData) => {
              handleAddressChange('streetAddress', addressData.streetAddress);
              if (addressData.cityArea) {
                handleAddressChange('cityArea', addressData.cityArea);
              }
              handleAddressChange('postalCode', addressData.postalCode || '');
            }}
            countryRestriction={formData.fromCountry}
            placeholder="Buscar dirección..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="streetAddress2" className="text-xs text-muted-foreground">Dirección línea 2 (opcional)</Label>
          <Input 
            id="streetAddress2" 
            type="text" 
            placeholder="Ej: Apt 4B, Suite 100" 
            value={formData.packageReceivingAddress.streetAddress2} 
            onChange={e => handleAddressChange('streetAddress2', e.target.value)} 
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="cityArea" className="text-xs text-muted-foreground">Ciudad / Estado *</Label>
            <Input 
              id="cityArea" 
              type="text" 
              placeholder="Ej: Miami, FL" 
              value={formData.packageReceivingAddress.cityArea} 
              onChange={e => handleAddressChange('cityArea', e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode" className="text-xs text-muted-foreground">Código postal *</Label>
            <Input 
              id="postalCode" 
              type="text" 
              placeholder="Ej: 33101" 
              value={formData.packageReceivingAddress.postalCode} 
              onChange={e => handleAddressChange('postalCode', e.target.value)} 
              required 
              className={cn(
                !formData.packageReceivingAddress.postalCode && 
                formData.packageReceivingAddress.streetAddress 
                  ? "border-amber-500 focus:ring-amber-500" 
                  : ""
              )}
            />
            {!formData.packageReceivingAddress.postalCode && 
             formData.packageReceivingAddress.streetAddress && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Ingresa código postal
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hotelAirbnbName" className="text-xs text-muted-foreground">Nombre del lugar (opcional)</Label>
          <Input 
            id="hotelAirbnbName" 
            type="text" 
            placeholder="Ej: Hotel InterContinental Miami" 
            value={formData.packageReceivingAddress.hotelAirbnbName} 
            onChange={e => handleAddressChange('hotelAirbnbName', e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInstructions" className="text-xs text-muted-foreground">
            Instrucciones adicionales para envío (opcional)
          </Label>
          <Textarea 
            id="additionalInstructions" 
            placeholder="Ej: Dejar paquete en recepción, llamar al llegar, horarios específicos de entrega..."
            value={formData.packageReceivingAddress.additionalInstructions || ''} 
            onChange={e => handleAddressChange('additionalInstructions', e.target.value)} 
            className="min-h-[60px]"
            maxLength={300}
          />
          <p className="text-xs text-muted-foreground">
            Esta información será visible para el shopper
          </p>
        </div>
      </div>

      {/* Sección 3: Ventana de recepción */}
      <div className="bg-muted/30 rounded-xl border border-border/50 p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-traveler">
          <CalendarIcon className="h-4 w-4" />
          Fechas disponibles para recibir
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button">
                  <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>Indica las fechas en las que estarás disponible para recibir paquetes en tu dirección de destino.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Primer día *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal touch-manipulation h-10">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.firstDayPackages ? format(formData.firstDayPackages, "dd/MM/yy", { locale: es }) : <span className="text-muted-foreground">Seleccionar</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar 
                  mode="single" 
                  selected={formData.firstDayPackages || undefined} 
                  onSelect={date => handleInputChange('firstDayPackages', date)} 
                  disabled={date => date < new Date()} 
                  initialFocus 
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Último día *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal touch-manipulation h-10">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.lastDayPackages ? format(formData.lastDayPackages, "dd/MM/yy", { locale: es }) : <span className="text-muted-foreground">Seleccionar</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar 
                  mode="single" 
                  selected={formData.lastDayPackages || undefined} 
                  onSelect={date => handleInputChange('lastDayPackages', date)} 
                  disabled={date => date < new Date() || (formData.firstDayPackages ? date < formData.firstDayPackages : false)} 
                  initialFocus 
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>
        <Button type="button" variant="traveler" onClick={handleNextStep} className="flex-1">
          Siguiente
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Step 3 content (Solo Entrega)
  const renderStep3 = () => (
    <div className="space-y-8 animate-fade-in">
      {/* 🟦 Entrega de paquetes */}
      {showDeliverySection && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium">
              {hasOfficialDeliveryOptions 
                ? `Entrega de paquetes en ${isDestinationGuatemala ? 'Guatemala' : destinationDeliveryPoint?.name || 'destino'}`
                : `¿Cómo entregarás los paquetes en ${formData.toCity || 'destino'}?`
              }
            </h3>
          </div>
          
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {hasOfficialDeliveryOptions 
                ? '¿Cómo vas a entregar los paquetes a Favorón? *'
                : 'Selecciona cómo planeas entregar los paquetes *'
              }
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {hasOfficialDeliveryOptions && (
                <>
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 touch-manipulation ${
                      formData.deliveryMethod === 'oficina' 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border sm:hover:border-primary/50 sm:hover:bg-primary/5'
                    }`}
                    onClick={() => handleInputChange('deliveryMethod', 'oficina')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.deliveryMethod === 'oficina' ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {formData.deliveryMethod === 'oficina' && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Entrego en oficina de Favorón</p>
                        <p className="text-sm text-muted-foreground">
                          {isDestinationGuatemala 
                            ? 'Zona 14, Ciudad de Guatemala'
                            : destinationDeliveryPoint?.instructions || destinationDeliveryPoint?.city || 'Punto de entrega'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Opción 2: Mensajero - SOLO para Guatemala */}
                  {isDestinationGuatemala && (
                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 touch-manipulation ${
                        formData.deliveryMethod === 'mensajero' 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-border sm:hover:border-primary/50 sm:hover:bg-primary/5'
                      }`}
                      onClick={() => handleInputChange('deliveryMethod', 'mensajero')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.deliveryMethod === 'mensajero' ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                          {formData.deliveryMethod === 'mensajero' && (
                            <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Entrega a mensajero Favorón</p>
                          <p className="text-sm text-muted-foreground">Q25–Q40 según dirección</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Opción 2 alternativa: Coordinación - para destinos internacionales con delivery point */}
                  {!isDestinationGuatemala && (
                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 touch-manipulation ${
                        formData.deliveryMethod === 'coordinacion' 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-border sm:hover:border-primary/50 sm:hover:bg-primary/5'
                      }`}
                      onClick={() => handleInputChange('deliveryMethod', 'coordinacion')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.deliveryMethod === 'coordinacion' ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                          {formData.deliveryMethod === 'coordinacion' && (
                            <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">🤝 Me coordino con el shopper</p>
                          <p className="text-sm text-muted-foreground">Acordaré la entrega directamente con el comprador</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {!hasOfficialDeliveryOptions && (
                <>
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 touch-manipulation ${
                      formData.deliveryMethod === 'correo' 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border sm:hover:border-primary/50 sm:hover:bg-primary/5'
                    }`}
                    onClick={() => handleInputChange('deliveryMethod', 'correo')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.deliveryMethod === 'correo' ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {formData.deliveryMethod === 'correo' && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">📦 Lo enviaré por correo</p>
                        <p className="text-sm text-muted-foreground">Enviaré el paquete por servicio postal desde mi destino</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 touch-manipulation ${
                      formData.deliveryMethod === 'coordinacion_shopper' 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border sm:hover:border-primary/50 sm:hover:bg-primary/5'
                    }`}
                    onClick={() => handleInputChange('deliveryMethod', 'coordinacion_shopper')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.deliveryMethod === 'coordinacion_shopper' ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {formData.deliveryMethod === 'coordinacion_shopper' && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">🤝 Me coordino con el shopper</p>
                        <p className="text-sm text-muted-foreground">Acordaré la entrega directamente con el comprador</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {showMessengerForm && (
              <MessengerPickupForm 
                onSubmit={handleMessengerSubmit} 
                onCancel={handleMessengerCancel} 
                initialData={messengerData} 
              />
            )}
            
            {formData.deliveryMethod === 'mensajero' && messengerData && !showMessengerForm && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm font-medium text-green-800 mb-1">✓ Información de recolección confirmada</p>
                <p className="text-xs text-green-700">{messengerData.streetAddress}, {messengerData.cityArea}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowMessengerForm(true)} className="mt-2">
                  Editar información
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              {hasOfficialDeliveryOptions 
                ? 'Fecha en la que entregarás los paquetes *'
                : 'Fecha estimada de entrega *'
              }
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal touch-manipulation">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deliveryDate ? format(formData.deliveryDate, "PPP", { locale: es }) : <span>Selecciona fecha de entrega</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar 
                  mode="single" 
                  selected={formData.deliveryDate || undefined} 
                  onSelect={date => handleInputChange('deliveryDate', date)} 
                  disabled={date => date < new Date()} 
                  initialFocus 
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>
        <Button type="button" variant="traveler" onClick={handleNextStep} className="flex-1">
          Siguiente
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Step 4 content (Resumen y Confirmación)
  const renderStep4 = () => {
    const getDeliveryMethodLabel = () => {
      switch (formData.deliveryMethod) {
        case 'oficina': return 'Entrega en oficina Favorón';
        case 'mensajero': return 'Entrega a mensajero Favorón';
        case 'correo': return 'Envío por correo';
        case 'coordinacion_shopper': return 'Coordinación con shopper';
        default: return 'No seleccionado';
      }
    };

    return (
      <div className="space-y-6 animate-fade-in">
        {/* 🟦 Resumen del viaje */}
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-medium">Resumen del viaje</h3>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ruta:</span>
              <span className="text-sm font-medium">
                {formData.fromCity || '-'} → {displayToCity || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Fecha de llegada:</span>
              <span className="text-sm font-medium">
                {formData.arrivalDate ? format(formData.arrivalDate, "PPP", { locale: es }) : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Espacio disponible:</span>
              <span className="text-sm font-medium">{formData.availableSpace || '-'} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Método de entrega:</span>
              <span className="text-sm font-medium">{getDeliveryMethodLabel()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Fecha de entrega:</span>
              <span className="text-sm font-medium">
                {formData.deliveryDate ? format(formData.deliveryDate, "PPP", { locale: es }) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* 🟦 Resumen de dirección */}
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-medium">Dirección de recepción</h3>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Recipiente:</span>
              <span className="text-sm font-medium text-right">
                {formData.packageReceivingAddress.recipientName || '-'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Dirección:</span>
              <span className="text-sm font-medium text-right max-w-[60%]">
                {formData.packageReceivingAddress.streetAddress || '-'}
                {formData.packageReceivingAddress.streetAddress2 && `, ${formData.packageReceivingAddress.streetAddress2}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ciudad/Estado:</span>
              <span className="text-sm font-medium">{formData.packageReceivingAddress.cityArea || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Código postal:</span>
              <span className="text-sm font-medium">{formData.packageReceivingAddress.postalCode || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Contacto:</span>
              <span className="text-sm font-medium">{formData.packageReceivingAddress.contactNumber || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ventana de recepción:</span>
              <span className="text-sm font-medium">
                {formData.firstDayPackages ? format(formData.firstDayPackages, "dd/MM", { locale: es }) : '-'} 
                {' - '}
                {formData.lastDayPackages ? format(formData.lastDayPackages, "dd/MM", { locale: es }) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Boost Code (opcional) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Rocket className="h-4 w-4 text-primary" />
            Código de Tip Boost (opcional)
          </Label>
          <div className="relative">
            <Input
              value={formData.boostCode || ''}
              onChange={(e) => handleBoostCodeChange(e.target.value)}
              placeholder="Ej: BOOST10 (opcional)"
              className={cn(
                "font-mono pr-10",
                boostStatus === 'valid' && "border-green-500 focus-visible:ring-green-500",
                boostStatus === 'invalid' && "border-destructive focus-visible:ring-destructive"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {boostStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {boostStatus === 'valid' && <Check className="h-4 w-4 text-green-500" />}
              {boostStatus === 'invalid' && <X className="h-4 w-4 text-destructive" />}
            </div>
          </div>
          {boostStatus === 'valid' && (
            <p className="text-xs text-green-600 font-medium">✓ Código de boost válido</p>
          )}
          {boostStatus === 'invalid' && (
            <p className="text-xs text-destructive">Código no encontrado o inactivo</p>
          )}
          {boostStatus === 'idle' && (
            <p className="text-xs text-muted-foreground">
              ¿Tienes un código de boost? Ingrésalo para aumentar tus ganancias en este viaje
            </p>
          )}
        </div>

        {/* Info box - Cómo funciona */}
        <div className="bg-traveler/10 border border-traveler/30 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-traveler mt-0.5" />
            <div className="text-sm text-traveler">
              <p className="font-medium mb-1">¿Cómo funciona para viajeros?</p>
              <ul className="space-y-1 text-xs">
                <li>• Recibirás solicitudes con propina asignada - tú decides si aceptar o rechazar cada paquete</li>
                <li>• Los paquetes llegaran a tu {formData.packageReceivingAddress.accommodationType || 'alojamiento'} en {formData.fromCity || 'tu ciudad de origen'}</li>
                <li>• Al llegar a {displayToCity || 'destino'}, entregas según el método seleccionado</li>
                <li>• Favorón coordina la entrega final al comprador</li>
                <li>• Ganas entre Q100-1,500 por viaje</li>
              </ul>
              <div className="mt-3 pt-2 border-t border-traveler/20">
                <p className="text-xs font-medium text-traveler">
                  🔒 Tu dirección nunca se comparte hasta que apruebes un pedido.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20 rounded-lg p-3 sm:hover:border-primary/40 transition-all duration-200 group">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="acceptTerms" 
              checked={acceptedTerms} 
              onCheckedChange={checked => setAcceptedTerms(!!checked)} 
              className="mt-1" 
            />
            <div className="flex-1">
              <Label htmlFor="acceptTerms" className="text-sm font-medium text-black cursor-pointer group-hover:text-black/80 transition-colors">
                Entiendo y acepto los términos y condiciones de Favorón
              </Label>
              <p className="text-xs text-black/70 mt-1">
                Al registrar este viaje, confirmas que has leído y aceptas nuestros términos de servicio.
              </p>
              <Button type="button" variant="link" className="h-auto p-0 text-xs text-black hover:text-black/80" onClick={() => setShowTermsModal(true)}>
                <FileText className="h-3 w-3 mr-1" />
                Leer términos y condiciones
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>
          <Button 
            type="submit" 
            variant="traveler" 
            className="flex-1" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Registrar Viaje'}
          </Button>
        </div>
      </div>
    );
  };
  
  const renderTripForm = () => (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto px-6 md:px-8">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plane className="h-5 w-5 text-traveler" />
            <span>Registrar Nuevo Viaje</span>
          </DialogTitle>
          <DialogDescription>
            Llévate paquetes en tu próximo viaje y ayuda a otros mientras ganas dinero extra.
          </DialogDescription>
        </DialogHeader>

        <StepIndicator />

        <form onSubmit={handleSubmit} className="mobile-safe-form">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </form>
        
        <TermsAndConditionsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {renderTripForm()}
      <OnboardingBottomSheet
        isOpen={showOnboarding}
        onContinue={handleOnboardingContinue}
        onClose={() => setShowOnboarding(false)}
        slides={travelerOnboardingSlides}
        gradientClassName="from-traveler via-traveler/80 to-traveler/60"
        variant="traveler"
      />
    </>
  );
};

export default TripForm;
