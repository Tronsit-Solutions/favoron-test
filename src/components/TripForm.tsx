import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePersistedFormState } from "@/hooks/usePersistedFormState";
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
import { cn } from "@/lib/utils";
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
  
  // Auto-persist form open state to maintain modal across tab switches
  const { state: isFormOpen, setState: setIsFormOpen } = usePersistedFormState({
    key: 'trip-form-open',
    initialState: false
  });

  // Sync modal state with URL/persistence
  useEffect(() => {
    if (isOpen && !isFormOpen) {
      setIsFormOpen(true);
    } else if (!isOpen && isFormOpen) {
      setIsFormOpen(false);
    }
  }, [isOpen, isFormOpen, setIsFormOpen]);

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
    }
  });

  const { state: persistedMessengerData, setState: setPersistedMessengerData, clearPersistedState: clearMessenger } = usePersistedFormState({
    key: 'trip-form-messenger',
    initialState: null
  });

  // Local state (only for non-persisted data)
  const [showMessengerForm, setShowMessengerForm] = useState(false);
  const [messengerData, setMessengerData] = useState(persistedMessengerData);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
    
    try {
      console.log('📱 Traveler form submission started (mobile compatible)', {
        userAgent: navigator.userAgent,
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        formData: { ...persistedFormData, packageReceivingAddress: '[REDACTED]' }
      });

      const finalFromCity = persistedFormData.fromCity;
      const finalToCity = persistedFormData.toCity === 'Otra ciudad' ? persistedFormData.toCityOther : persistedFormData.toCity;
      
      // Enhanced validation with specific error messages
      const requiredFields = [
        { field: finalFromCity, name: 'ciudad de origen' },
        { field: finalToCity, name: 'ciudad de destino' },
        { field: persistedFormData.arrivalDate, name: 'fecha de llegada' },
        { field: persistedFormData.availableSpace, name: 'espacio disponible' },
        { field: persistedFormData.deliveryMethod, name: 'método de entrega' },
        { field: persistedFormData.deliveryDate, name: 'fecha de entrega' },
        { field: persistedFormData.packageReceivingAddress.recipientName, name: 'nombre del recipiente' },
        { field: persistedFormData.packageReceivingAddress.accommodationType, name: 'tipo de alojamiento' },
        { field: persistedFormData.packageReceivingAddress.streetAddress, name: 'dirección' },
        { field: persistedFormData.packageReceivingAddress.cityArea, name: 'ciudad/estado' },
        { field: persistedFormData.packageReceivingAddress.postalCode, name: 'código postal' },
        { field: persistedFormData.packageReceivingAddress.contactNumber, name: 'número de contacto' },
        { field: persistedFormData.firstDayPackages, name: 'primer día para recibir paquetes' },
        { field: persistedFormData.lastDayPackages, name: 'último día para recibir paquetes' },
        { field: persistedFormData.fromCountry, name: 'país de origen' }
      ];

      const missingFields = requiredFields.filter(({ field }) => !field).map(({ name }) => name);
      if (missingFields.length > 0) {
        const errorMsg = `Por favor completa los campos: ${missingFields.join(', ')}`;
        console.error('❌ Form validation failed:', errorMsg);
        logFormValidationError(missingFields, 'traveler-form');
        alert(errorMsg);
        return;
      }

      if (!acceptedTerms) {
        const errorMsg = 'Debes aceptar los términos y condiciones para continuar';
        console.error('❌ Terms not accepted');
        alert(errorMsg);
        return;
      }

      // Validar información de mensajero si seleccionó mensajero
      if (persistedFormData.deliveryMethod === 'mensajero' && !messengerData) {
        const errorMsg = 'Por favor completa la información de recolección por mensajero';
        console.error('❌ Messenger data missing');
        alert(errorMsg);
        return;
      }

      const submitData = {
        ...persistedFormData,
        fromCity: finalFromCity,
        toCity: finalToCity,
        messengerPickupInfo: persistedFormData.deliveryMethod === 'mensajero' ? messengerData : null
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
      
      setPersistedFormData(initialFormData);
      setShowMessengerForm(false);
      setMessengerData(null);
      setAcceptedTerms(false);
      setShowTermsModal(false);
      
      // Clear persisted states
      clearFormData();
      clearMessenger();
      
    } catch (error) {
      console.error('💥 Error submitting traveler form:', error);
      logFormError(error, 'traveler-form', persistedFormData);
      alert('Hubo un error al enviar el formulario. Por favor intenta nuevamente o contacta soporte si el problema persiste.');
    }
  };
  const handleInputChange = (field: string, value: any) => {
    const newFormData = {
      ...persistedFormData,
      [field]: value
    };
    
    setPersistedFormData(newFormData);

    // Mostrar formulario de mensajero si selecciona mensajero
    if (field === 'deliveryMethod') {
      if (value === 'mensajero') {
        setShowMessengerForm(true);
      } else {
        setShowMessengerForm(false);
        setMessengerData(null);
      }
    }
  };
  const handleAddressChange = (field: string, value: string) => {
    const newFormData = {
      ...persistedFormData,
      packageReceivingAddress: {
        ...persistedFormData.packageReceivingAddress,
        [field]: value
      }
    };
    setPersistedFormData(newFormData);
  };
  const handleMessengerSubmit = (pickupData: any) => {
    setMessengerData(pickupData);
    setShowMessengerForm(false);
  };
  const handleMessengerCancel = () => {
    setShowMessengerForm(false);
    setPersistedFormData(prev => ({
      ...prev,
      deliveryMethod: ''
    }));
  };

  // Helper function to get the current origin city for display
  const getDisplayFromCity = () => {
    if (persistedFormData.fromCity) {
      // Clean up city text by removing state/country abbreviations
      return persistedFormData.fromCity.split(',')[0];
    }
    return 'destino';
  };
  const displayToCity = persistedFormData.toCity === 'Otra ciudad' ? persistedFormData.toCityOther : persistedFormData.toCity;
  
  // Header component  
  const Header = () => (
    <DialogHeader>
      <DialogTitle className="flex items-center space-x-2">
        <Plane className="h-5 w-5 text-traveler" />
        <span>Registrar Nuevo Viaje</span>
      </DialogTitle>
      <DialogDescription>
        Llévate paquetes en tu próximo viaje y ayuda a otros mientras ganas dinero extra.
      </DialogDescription>
    </DialogHeader>
  );

  // Form content component
  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fromCountry">País de origen *</Label>
            <div>
              <Combobox
                options={COUNTRIES}
                value={persistedFormData.fromCountry}
                onValueChange={value => {
                  console.log('🌍 Country selected:', value);
                  handleInputChange('fromCountry', value);
                }}
                placeholder="Selecciona el país de origen"
                searchPlaceholder="Buscar país..."
                emptyMessage="No se encontraron países"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromCity">Ciudad de origen *</Label>
            <Input 
              id="fromCity"
              type="text" 
              placeholder="Escribe tu ciudad de origen" 
              value={persistedFormData.fromCity} 
              onChange={e => handleInputChange('fromCity', e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="toCity">Ciudad de destino *</Label>
          <Select value={persistedFormData.toCity} onValueChange={value => handleInputChange('toCity', value)}>
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
          {persistedFormData.toCity === 'Otra ciudad' && <Input placeholder="Escribe tu ciudad de destino" value={persistedFormData.toCityOther} onChange={e => handleInputChange('toCityOther', e.target.value)} className="mt-2" required />}
        </div>

        <div className="space-y-2">
          <Label>Fecha de llegada a {displayToCity || 'destino'} *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal touch-manipulation">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {persistedFormData.arrivalDate ? format(persistedFormData.arrivalDate, "PPP", {
                locale: es
              }) : <span>Selecciona fecha de llegada</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar 
                mode="single" 
                selected={persistedFormData.arrivalDate || undefined} 
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
            <Input id="availableSpace" type="number" step="0.5" placeholder="5.0" value={persistedFormData.availableSpace} onChange={e => handleInputChange('availableSpace', e.target.value)} className="pl-10" required />
          </div>
        </div>
      </div>

      <div className="space-y-6 border-t border-gray-200 pt-6">
        <div className="space-y-1">
          <Label className="text-base font-medium">Dirección para recibir paquetes en {getDisplayFromCity()}</Label>
          <p className="text-sm text-muted-foreground">
            Esta información se comparte únicamente con el shopper si el pedido es aprobado.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipientName">Nombre de la persona que recibe los paquetes *</Label>
          <Input id="recipientName" type="text" placeholder="Ej: Juan Pérez" value={persistedFormData.packageReceivingAddress.recipientName} onChange={e => handleAddressChange('recipientName', e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accommodationType">Tipo de alojamiento *</Label>
          <Select value={persistedFormData.packageReceivingAddress.accommodationType} onValueChange={value => handleAddressChange('accommodationType', value)}>
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
          <Input id="streetAddress" type="text" placeholder="Ej: 123 Main Street" value={persistedFormData.packageReceivingAddress.streetAddress} onChange={e => handleAddressChange('streetAddress', e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="streetAddress2">Dirección línea 2 (opcional)</Label>
          <Input id="streetAddress2" type="text" placeholder="Ej: Apt 4B, Suite 100" value={persistedFormData.packageReceivingAddress.streetAddress2} onChange={e => handleAddressChange('streetAddress2', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cityArea">Ciudad / Estado / Región *</Label>
            <Input id="cityArea" type="text" placeholder="Ej: Miami, FL" value={persistedFormData.packageReceivingAddress.cityArea} onChange={e => handleAddressChange('cityArea', e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">Código postal *</Label>
            <Input id="postalCode" type="text" placeholder="Ej: 33101" value={persistedFormData.packageReceivingAddress.postalCode} onChange={e => handleAddressChange('postalCode', e.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hotelAirbnbName">Nombre del lugar (Ej: Hotel Barceló, Condominio FAV, etc.)</Label>
          <Input id="hotelAirbnbName" type="text" placeholder="Ej: Hotel InterContinental Miami" value={persistedFormData.packageReceivingAddress.hotelAirbnbName} onChange={e => handleAddressChange('hotelAirbnbName', e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactNumber">Número de contacto *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="contactNumber" type="tel" placeholder="+1 (305) 123-4567" value={persistedFormData.packageReceivingAddress.contactNumber} onChange={e => handleAddressChange('contactNumber', e.target.value)} className="pl-10" required />
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
                  {persistedFormData.firstDayPackages ? format(persistedFormData.firstDayPackages, "dd/MM", {
                  locale: es
                }) : <span className="text-xs">Fecha inicio</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar 
                  mode="single" 
                  selected={persistedFormData.firstDayPackages || undefined} 
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
                  {persistedFormData.lastDayPackages ? format(persistedFormData.lastDayPackages, "dd/MM", {
                  locale: es
                }) : <span className="text-xs">Fecha fin</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar 
                  mode="single" 
                  selected={persistedFormData.lastDayPackages || undefined} 
                  onSelect={date => {
                    console.log('📅 Last day selected:', date);
                    handleInputChange('lastDayPackages', date);
                  }} 
                  disabled={date => date < new Date() || (persistedFormData.firstDayPackages ? date < persistedFormData.firstDayPackages : false)} 
                  initialFocus 
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-gray-200 pt-6">
        <Label className="text-base font-medium">Entrega de paquetes en Guatemala</Label>
        
        <div className="space-y-3">
          <Label className="text-base font-medium">¿Cómo vas a entregar los paquetes a Favorón? *</Label>
          <RadioGroup value={persistedFormData.deliveryMethod} onValueChange={value => handleInputChange('deliveryMethod', value)} className="space-y-2 sm:space-y-3">
            <div 
              className="mobile-radio-card"
              data-state={persistedFormData.deliveryMethod === "oficina" ? "checked" : "unchecked"}
              onClick={() => handleInputChange('deliveryMethod', 'oficina')}
            >
              <RadioGroupItem value="oficina" id="oficina" className="sr-only" />
              <div className="flex-1 flex items-start space-x-3 sm:space-x-2 p-4 sm:p-3">
                <div className="flex-1">
                  <Label htmlFor="oficina" className="cursor-pointer text-sm sm:text-base font-medium">
                    Entrego en oficina de Favorón (zona 14)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 sm:hidden">
                    Ubicación fija en zona 14, Guatemala
                  </p>
                </div>
              </div>
            </div>
            <div 
              className="mobile-radio-card"
              data-state={persistedFormData.deliveryMethod === "mensajero" ? "checked" : "unchecked"}
              onClick={() => handleInputChange('deliveryMethod', 'mensajero')}
            >
              <RadioGroupItem value="mensajero" id="mensajero" className="sr-only" />
              <div className="flex-1 flex items-start space-x-3 sm:space-x-2 p-4 sm:p-3">
                <div className="flex-1">
                  <Label htmlFor="mensajero" className="cursor-pointer text-sm sm:text-base font-medium">
                    Entrega a mensajero Favorón (Q25–Q40 según dirección)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 sm:hidden">
                    Recolección a domicilio con costo adicional
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
          
          
          {/* Mostrar formulario de mensajero si seleccionó mensajero */}
          {showMessengerForm && <MessengerPickupForm onSubmit={handleMessengerSubmit} onCancel={handleMessengerCancel} initialData={messengerData} />}
          
          {/* Mostrar resumen de información si ya la completó */}
          {persistedFormData.deliveryMethod === 'mensajero' && messengerData && !showMessengerForm && <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm font-medium text-green-800 mb-1">✓ Información de recolección confirmada</p>
              <p className="text-xs text-green-700">{messengerData.streetAddress}, {messengerData.cityArea}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowMessengerForm(true)} className="mt-2">
                Editar información
              </Button>
            </div>}
        </div>

        <div className="space-y-2">
          <Label>Fecha en que entregarás los paquetes *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal touch-manipulation">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {persistedFormData.deliveryDate ? format(persistedFormData.deliveryDate, "PPP", {
                locale: es
              }) : <span>Selecciona fecha de entrega</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar 
                mode="single" 
                selected={persistedFormData.deliveryDate || undefined} 
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

      <div className="space-y-4 border-t border-gray-200 pt-6">
        <Label className="text-base font-medium">Información adicional</Label>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">Comentarios opcionales</Label>
          <Textarea id="additionalInfo" placeholder="Horarios disponibles, zonas de entrega, experiencia previa, etc." value={persistedFormData.additionalInfo} onChange={e => handleInputChange('additionalInfo', e.target.value)} className="min-h-[80px]" />
        </div>
      </div>

      <div className="bg-traveler/10 border border-traveler/30 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-traveler mt-0.5" />
          <div className="text-sm text-traveler">
            <p className="font-medium mb-1">¿Cómo funciona para viajeros?</p>
            <ul className="space-y-1 text-xs">
              <li>• Los compradores enviarán paquetes a tu {persistedFormData.packageReceivingAddress.accommodationType || 'alojamiento'} en {persistedFormData.fromCity || 'tu ciudad de origen'}</li>
              <li>• Podrás cotizar el precio por traer cada paquete</li>
              <li>• Al llegar a {displayToCity || 'destino'}, entregas según el método seleccionado</li>
              <li>• Nosotros coordinamos la entrega final al comprador</li>
              <li>• Ganas entre Q150-800+ por viaje</li>
            </ul>
            <div className="mt-3 pt-2 border-t border-traveler/20">
              <p className="text-xs font-medium text-traveler">
                🔒 Tu dirección no será compartida con nadie hasta que apruebes un pedido.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Checkbox */}
      <div 
        className={cn(
          "mobile-checkbox-card bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl p-4 sm:p-3 transition-all duration-300 cursor-pointer",
          acceptedTerms 
            ? "checked border-primary bg-primary/8" 
            : "hover:border-primary/50 hover:bg-primary/3"
        )}
        onClick={() => setAcceptedTerms(!acceptedTerms)}
      >
        <div className="flex items-start space-x-4 sm:space-x-3">
          <Checkbox 
            id="acceptTerms" 
            checked={acceptedTerms} 
            onCheckedChange={checked => setAcceptedTerms(!!checked)} 
            className="mt-1 sm:mt-0.5" 
          />
          <div className="flex-1">
            <Label htmlFor="acceptTerms" className="text-base sm:text-sm font-semibold text-foreground cursor-pointer transition-colors">
              Entiendo y acepto los términos y condiciones de Favorón
            </Label>
            <p className="text-sm sm:text-xs text-muted-foreground mt-2 sm:mt-1 leading-relaxed">
              Al registrar este viaje, confirmas que has leído y aceptas nuestros términos de servicio.
            </p>
            <Button 
              type="button" 
              variant="link" 
              className="h-auto p-0 text-sm sm:text-xs text-primary hover:text-primary/80 mt-2 sm:mt-1" 
              onClick={(e) => {
                e.stopPropagation();
                setShowTermsModal(true);
              }}
            >
              <FileText className="h-4 w-4 sm:h-3 sm:w-3 mr-1" />
              Leer términos y condiciones
            </Button>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" variant="traveler" className="flex-1">
          Registrar Viaje
        </Button>
      </div>
    </form>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <Header />
        <div className="px-1">
          <FormContent />
        </div>
        <TermsAndConditionsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      </DialogContent>
    </Dialog>
  );
};
export default TripForm;