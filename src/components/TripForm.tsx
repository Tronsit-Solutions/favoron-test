import { useState, useEffect, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { CalendarIcon, Plane, MapPin, Package, AlertCircle, Phone, Building2, FileText, Target } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import MessengerPickupForm from "@/components/MessengerPickupForm";
import TermsAndConditionsModal from "@/components/TermsAndConditionsModal";

import { COUNTRIES } from "@/lib/countries";
import { logFormError, logFormValidationError } from "@/lib/formErrorLogger";
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
  const { openModal, closeModal } = useModalState();
  useTabVisibilityProtection({ preventNavigationWithModals: true });

  // Auto-persist form open state to maintain modal across tab switches
  const { state: isFormOpen, setState: setIsFormOpen } = usePersistedFormState({
    key: 'trip-form-open',
    initialState: false,
    encrypt: false // Disable encryption for faster, more reliable form restoration
  });

  // Sync modal state with URL/persistence
  useEffect(() => {
    if (isOpen && !isFormOpen) {
      setIsFormOpen(true);
    } else if (!isOpen && isFormOpen) {
      setIsFormOpen(false);
    }
  }, [isOpen, isFormOpen, setIsFormOpen]);

  // Generate a client request id each time the modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        setRequestId(crypto.randomUUID());
      } catch {
        // Fallback simple id
        setRequestId(String(Date.now()));
      }
    }
  }, [isOpen]);

  // Use persisted form state to maintain data across tab switches
  const { state: persistedFormData, setState: setPersistedFormData, clearPersistedState: clearFormData } = usePersistedFormState({
    key: 'trip-form-data',
    initialState: {
      fromCity: '',
      fromCountry: '',
      toCity: '',
      toCityOther: '',
      toCountry: 'Guatemala',
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
        contactNumber: ''
      },
      firstDayPackages: null as Date | null,
      lastDayPackages: null as Date | null,
      messengerPickupLocation: ''
    },
    encrypt: false // Disable encryption for faster, more reliable form restoration
  });

  const { state: persistedMessengerData, setState: setPersistedMessengerData, clearPersistedState: clearMessenger } = usePersistedFormState({
    key: 'trip-form-messenger',
    initialState: null,
    encrypt: false // Disable encryption for faster, more reliable form restoration
  });

  // Local state
  const [formData, setFormData] = useState(persistedFormData);
  const [showMessengerForm, setShowMessengerForm] = useState(false);
  const [messengerData, setMessengerData] = useState(persistedMessengerData);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string>('');

  // Register modal with ModalStateContext for tab protection
  useEffect(() => {
    if (isOpen) {
      openModal('trip-form', 'form');
    } else {
      closeModal('trip-form');
    }
    
    return () => {
      closeModal('trip-form');
    };
  }, [isOpen, openModal, closeModal]);

  // Restore form data when modal reopens (after tab switch)
  useEffect(() => {
    if (!isOpen) return;

    const hasPersistedForm = !!(persistedFormData?.fromCity || persistedFormData?.toCity || persistedFormData?.arrivalDate);
    const hasPersistedMessenger = !!persistedMessengerData;

    console.log('🔄 Restore check (trip):', { isOpen, hasPersistedForm, hasPersistedMessenger });

    if (hasPersistedForm) setFormData(persistedFormData);
    if (hasPersistedMessenger) setMessengerData(persistedMessengerData);
  }, [isOpen, persistedFormData, persistedMessengerData]);

  // Sync local state with persisted state
  useEffect(() => {
    setPersistedFormData(formData);
  }, [formData, setPersistedFormData]);

  useEffect(() => {
    setPersistedMessengerData(messengerData);
  }, [messengerData, setPersistedMessengerData]);
  
  const guatemalanCities = ['Guatemala City', 'Antigua Guatemala', 'Quetzaltenango', 'Escuintla', 'Otra ciudad'];
  const countries = ['Estados Unidos', 'España', 'México', 'El Salvador', 'Honduras', 'Costa Rica', 'Otro país'];
  const accommodationTypes = [{
    value: 'hotel',
    label: 'Hotel/Hostal'
  }, {
    value: 'airbnb',
    label: 'Airbnb'
  }, {
    value: 'casa',
    label: 'Casa/Apartamento'
  }];
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) {
      console.log('🚫 Submission already in progress, ignoring');
      return;
    }

    setIsSubmitting(true);

    // Prevent double submission
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
      
      // Enhanced validation with specific error messages
      const requiredFields = [
        { field: finalFromCity, name: 'ciudad de origen' },
        { field: finalToCity, name: 'ciudad de destino' },
        { field: formData.arrivalDate, name: 'fecha de llegada' },
        { field: formData.availableSpace, name: 'espacio disponible' },
        { field: formData.deliveryMethod, name: 'método de entrega' },
        { field: formData.deliveryDate, name: 'fecha de entrega' },
        { field: formData.packageReceivingAddress.recipientName, name: 'nombre del recipiente' },
        { field: formData.packageReceivingAddress.accommodationType, name: 'tipo de alojamiento' },
        { field: formData.packageReceivingAddress.streetAddress, name: 'dirección' },
        { field: formData.packageReceivingAddress.cityArea, name: 'ciudad/estado' },
        { field: formData.packageReceivingAddress.postalCode, name: 'código postal' },
        { field: formData.packageReceivingAddress.contactNumber, name: 'número de contacto' },
        { field: formData.firstDayPackages, name: 'primer día para recibir paquetes' },
        { field: formData.lastDayPackages, name: 'último día para recibir paquetes' },
        { field: formData.fromCountry, name: 'país de origen' }
      ];

      const missingFields = requiredFields.filter(({ field }) => !field).map(({ name }) => name);
      if (missingFields.length > 0) {
        const errorMsg = `Por favor completa los campos: ${missingFields.join(', ')}`;
        console.error('❌ Form validation failed:', errorMsg);
        logFormValidationError(missingFields, 'traveler-form');
        alert(errorMsg);
        setIsSubmitting(false);
        return;
      }

      if (!acceptedTerms) {
        const errorMsg = 'Debes aceptar los términos y condiciones para continuar';
        console.error('❌ Terms not accepted');
        alert(errorMsg);
        setIsSubmitting(false);
        return;
      }

      // Validar información de mensajero si seleccionó mensajero
      if (formData.deliveryMethod === 'mensajero' && !messengerData) {
        const errorMsg = 'Por favor completa la información de recolección por mensajero';
        console.error('❌ Messenger data missing');
        alert(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        ...formData,
        fromCity: finalFromCity,
        toCity: finalToCity,
        messengerPickupInfo: formData.deliveryMethod === 'mensajero' ? messengerData : null,
        client_request_id: requestId // Add idempotency key
      };

      console.log('✅ Form validation passed, submitting data');
      
      // Use await to handle potential async submission
      await Promise.resolve(onSubmit(submitData));
      
      console.log('✅ Form submitted successfully');
      
      // Close modal after successful submission
      onClose();

      // Reset form and clear persisted data on success
      const initialFormData = {
        fromCity: '',
        fromCountry: '',
        toCity: '',
        toCityOther: '',
        toCountry: 'Guatemala',
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
          contactNumber: ''
        },
        firstDayPackages: null as Date | null,
        lastDayPackages: null as Date | null,
        messengerPickupLocation: ''
      };
      
      setFormData(initialFormData);
      setShowMessengerForm(false);
      setMessengerData(null);
      setAcceptedTerms(false);
      setShowTermsModal(false);
      
      // Clear persisted states
      clearFormData();
      clearMessenger();
      
    } catch (error) {
      console.error('💥 Error submitting traveler form:', error);
      
      // Enhanced error logging with Safari iOS context
      const contextualFormData = {
        ...formData,
        packageReceivingAddress: '[REDACTED]', // Don't log sensitive data
        isSafariIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent),
        formFieldsCount: Object.keys(formData).length,
        hasMessengerData: !!messengerData,
        acceptedTerms
      };
      
      logFormError(error, 'traveler-form', contextualFormData);
      
      // User-friendly error message for Safari iOS
      const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
      const errorMessage = isSafariIOS 
        ? 'Error al enviar el formulario. Si usas Safari en iPhone, intenta: 1) Refrescar la página, 2) Usar Chrome/Firefox, o 3) Contactar soporte.'
        : 'Hubo un error al enviar el formulario. Por favor intenta nuevamente o contacta soporte si el problema persiste.';
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Mostrar formulario de mensajero si selecciona mensajero
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

  // Helper function to get the current origin city for display
  const getDisplayFromCity = () => {
    if (formData.fromCity) {
      // Clean up city text by removing state/country abbreviations
      return formData.fromCity.split(',')[0];
    }
    return 'destino';
  };
  const displayToCity = formData.toCity === 'Otra ciudad' ? formData.toCityOther : formData.toCity;
  
  const renderTripForm = () => (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto px-6 md:px-8">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plane className="h-5 w-5 text-traveler" />
            <span>Registrar Nuevo Viaje</span>
          </DialogTitle>
          <DialogDescription>
            Llévate paquetes en tu próximo viaje y ayuda a otros mientras ganas dinero extra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 mobile-safe-form">
          {/* 🟦 1. Información básica del viaje */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 border-b border-primary/20">
              <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold text-primary">Información básica del viaje</h3>
            </div>
            <p className="text-sm text-destructive -mt-1 mb-1">
              Recomendamos registrar únicamente viajes con destino a Guatemala. Ejemplo: USA → Guatemala, México → Guatemala.
            </p>

            {/* Sección ORIGEN */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-primary">
                <MapPin className="h-4 w-4" />
                <h4 className="text-sm font-semibold uppercase tracking-wide">ORIGEN DEL VIAJE</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-1 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromCountry" className="text-xs sm:text-sm">País de origen *</Label>
                  <div className="mobile-safe-combobox">
                    <Combobox
                      key="fromCountry-combobox"
                      options={COUNTRIES}
                      value={formData.fromCountry}
                      onValueChange={value => handleInputChange('fromCountry', value)}
                      placeholder="País"
                      searchPlaceholder="Buscar país..."
                      emptyMessage="No se encontraron países"
                      className="w-full text-sm h-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromCity" className="text-xs sm:text-sm">Ciudad de origen *</Label>
                  <Input 
                    id="fromCity"
                    type="text" 
                    placeholder="Ciudad" 
                    value={formData.fromCity} 
                    onChange={e => handleInputChange('fromCity', e.target.value)} 
                    required 
                    className="w-full text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Sección DESTINO */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-primary">
                <Target className="h-4 w-4" />
                <h4 className="text-sm font-semibold uppercase tracking-wide">DESTINO DEL VIAJE</h4>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="toCity">Ciudad de destino *</Label>
                <Select value={formData.toCity} onValueChange={value => handleInputChange('toCity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la ciudad de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {guatemalanCities.map(city => <SelectItem key={city} value={city}>
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4" />
                          <span>{city}</span>
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {formData.toCity === 'Otra ciudad' && <Input placeholder="Escribe tu ciudad de destino" value={formData.toCityOther} onChange={e => handleInputChange('toCityOther', e.target.value)} className="mt-2" required />}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha de llegada a {displayToCity || 'destino'} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal touch-manipulation">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.arrivalDate ? format(formData.arrivalDate, "PPP", {
                    locale: es
                  }) : <span>Selecciona fecha de llegada</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar 
                    mode="single" 
                    selected={formData.arrivalDate || undefined} 
                    onSelect={date => {
                      console.log('📅 Arrival date selected:', date);
                      handleInputChange('arrivalDate', date);
                    }} 
                    disabled={date => date < new Date()} 
                    initialFocus 
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availableSpace">Espacio disponible en tu equipaje (en kg) *</Label>
              <div className="relative">
                <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="availableSpace" type="number" step="0.5" placeholder="5.0" value={formData.availableSpace} onChange={e => handleInputChange('availableSpace', e.target.value)} className="pl-10" required />
              </div>
            </div>
          </div>

          {/* 🟦 2. Dirección para recibir paquetes en destino */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-primary/20">
              <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold text-primary">Dirección para recibir paquetes en {getDisplayFromCity()}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta información se comparte únicamente con el shopper si el pedido es aprobado.
            </p>

            <div className="space-y-2">
              <Label htmlFor="recipientName">Nombre de la persona que recibe los paquetes *</Label>
              <Input id="recipientName" type="text" placeholder="Ej: Juan Pérez" value={formData.packageReceivingAddress.recipientName} onChange={e => handleAddressChange('recipientName', e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accommodationType">Tipo de alojamiento *</Label>
              <Select value={formData.packageReceivingAddress.accommodationType} onValueChange={value => handleAddressChange('accommodationType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de alojamiento" />
                </SelectTrigger>
                <SelectContent>
                  {accommodationTypes.map(type => <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetAddress">Dirección línea 1 *</Label>
              <Input id="streetAddress" type="text" placeholder="Ej: 123 Main Street" value={formData.packageReceivingAddress.streetAddress} onChange={e => handleAddressChange('streetAddress', e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetAddress2">Dirección línea 2 (opcional)</Label>
              <Input id="streetAddress2" type="text" placeholder="Ej: Apt 4B, Suite 100" value={formData.packageReceivingAddress.streetAddress2} onChange={e => handleAddressChange('streetAddress2', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cityArea">Ciudad / Estado / Región *</Label>
                <Input id="cityArea" type="text" placeholder="Ej: Miami, FL" value={formData.packageReceivingAddress.cityArea} onChange={e => handleAddressChange('cityArea', e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Código postal *</Label>
                <Input id="postalCode" type="text" placeholder="Ej: 33101" value={formData.packageReceivingAddress.postalCode} onChange={e => handleAddressChange('postalCode', e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotelAirbnbName">Nombre del lugar (Ej: Hotel Barceló, Condominio FAV, etc.)</Label>
              <Input id="hotelAirbnbName" type="text" placeholder="Ej: Hotel InterContinental Miami" value={formData.packageReceivingAddress.hotelAirbnbName} onChange={e => handleAddressChange('hotelAirbnbName', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Número de contacto *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="contactNumber" type="tel" placeholder="+1 (305) 123-4567" value={formData.packageReceivingAddress.contactNumber} onChange={e => handleAddressChange('contactNumber', e.target.value)} className="pl-10" required />
              </div>
              <p className="text-xs text-muted-foreground">
                Si te hospedas en hotel, coloca el número del hotel
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primer día para recibir paquetes *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal touch-manipulation">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.firstDayPackages ? format(formData.firstDayPackages, "dd/MM", {
                      locale: es
                    }) : <span className="text-xs">Fecha inicio</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar 
                      mode="single" 
                      selected={formData.firstDayPackages || undefined} 
                      onSelect={date => {
                        console.log('📅 First day selected:', date);
                        handleInputChange('firstDayPackages', date);
                      }} 
                      disabled={date => date < new Date()} 
                      initialFocus 
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Último día para recibir paquetes *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal touch-manipulation">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.lastDayPackages ? format(formData.lastDayPackages, "dd/MM", {
                      locale: es
                    }) : <span className="text-xs">Fecha fin</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar 
                      mode="single" 
                      selected={formData.lastDayPackages || undefined} 
                      onSelect={date => {
                        console.log('📅 Last day selected:', date);
                        handleInputChange('lastDayPackages', date);
                      }} 
                      disabled={date => date < new Date() || (formData.firstDayPackages ? date < formData.firstDayPackages : false)} 
                      initialFocus 
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* 🟦 3. Entrega de paquetes en Guatemala */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-primary/20">
              <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold text-primary">Entrega de paquetes en Guatemala</h3>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-medium">¿Cómo vas a entregar los paquetes a Favorón? *</Label>
              <div className="grid grid-cols-1 gap-3">
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    formData.deliveryMethod === 'oficina' 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
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
                      <p className="text-sm text-muted-foreground">Zona 14, Ciudad de Guatemala</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    formData.deliveryMethod === 'mensajero' 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
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
              </div>
              
              
              {/* Mostrar formulario de mensajero si seleccionó mensajero */}
              {showMessengerForm && <MessengerPickupForm onSubmit={handleMessengerSubmit} onCancel={handleMessengerCancel} initialData={messengerData} />}
              
              {/* Mostrar resumen de información si ya la completó */}
              {formData.deliveryMethod === 'mensajero' && messengerData && !showMessengerForm && <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm font-medium text-green-800 mb-1">✓ Información de recolección confirmada</p>
                  <p className="text-xs text-green-700">{messengerData.streetAddress}, {messengerData.cityArea}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowMessengerForm(true)} className="mt-2">
                    Editar información
                  </Button>
                </div>}
            </div>

            <div className="space-y-2">
              <Label>Fecha estimada en que entregarás los paquetes *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal touch-manipulation">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deliveryDate ? format(formData.deliveryDate, "PPP", {
                    locale: es
                  }) : <span>Selecciona fecha de entrega</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar 
                    mode="single" 
                    selected={formData.deliveryDate || undefined} 
                    onSelect={date => {
                      console.log('📅 Delivery date selected:', date);
                      handleInputChange('deliveryDate', date);
                    }} 
                    disabled={date => date < new Date()} 
                    initialFocus 
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 🟦 4. Información adicional */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-primary/20">
              <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-bold">4</span>
              </div>
              <h3 className="text-lg font-semibold text-primary">Información adicional</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Comentarios opcionales</Label>
              <Textarea id="additionalInfo" placeholder="Horarios disponibles, zonas de entrega, experiencia previa, etc." value={formData.additionalInfo} onChange={e => handleInputChange('additionalInfo', e.target.value)} className="min-h-[80px]" />
            </div>
          </div>

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
                  <li>• Ganas entre Q150-800+ por viaje</li>
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
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20 rounded-lg p-3 hover:border-primary/40 transition-all duration-200 group">
            <div className="flex items-start space-x-3">
              <Checkbox id="acceptTerms" checked={acceptedTerms} onCheckedChange={checked => setAcceptedTerms(!!checked)} className="mt-1" />
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

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
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
        </form>
        
        {/* Terms and Conditions Modal */}
        <TermsAndConditionsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      </DialogContent>
    </Dialog>
  );

  return renderTripForm();
};

export default TripForm;