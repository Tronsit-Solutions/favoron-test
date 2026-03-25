import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plane, MapPin, Package, Phone, Building2, Target, Mail, Users, AlertCircle, RotateCcw, Rocket, Check, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Combobox } from "@/components/ui/combobox";
import { COUNTRIES, MAIN_COUNTRIES, COUNTRY_QUICK_OPTIONS } from "@/lib/countries";
import { getCitiesByCountry, countryHasCities } from "@/lib/cities";
import { useDeliveryPoints } from "@/hooks/useDeliveryPoints";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tripData: any) => void;
  tripData: any;
}

interface ValidationErrors {
  fromCity?: string;
  fromCountry?: string;
  toCity?: string;
  arrivalDate?: string;
  availableSpace?: string;
  deliveryMethod?: string;
  deliveryDate?: string;
  accommodationType?: string;
  streetAddress?: string;
  cityArea?: string;
  postalCode?: string;
  contactNumber?: string;
  recipientName?: string;
  firstDayPackages?: string;
  lastDayPackages?: string;
}

const EditTripModal = ({
  isOpen,
  onClose,
  onSubmit,
  tripData
}: EditTripModalProps) => {
  const [formData, setFormData] = useState({
    fromCity: tripData?.from_city || '',
    fromCityOther: tripData?.fromCityOther || '',
    fromCountry: tripData?.from_country || '',
    toCity: tripData?.to_city || '',
    toCityOther: tripData?.toCityOther || '',
    toCountry: tripData?.to_country || 'Guatemala',
    arrivalDate: tripData?.arrival_date ? new Date(tripData.arrival_date) : null as Date | null,
    availableSpace: tripData?.available_space?.toString() || '',
    deliveryMethod: tripData?.delivery_method || '',
    deliveryDate: tripData?.delivery_date ? new Date(tripData.delivery_date) : null as Date | null,
    additionalInfo: tripData?.additionalInfo || '',
    boostCode: tripData?.boost_code || '',
      packageReceivingAddress: {
        accommodationType: tripData?.package_receiving_address?.accommodationType || '',
        streetAddress: tripData?.package_receiving_address?.streetAddress || '',
        streetAddress2: tripData?.package_receiving_address?.streetAddress2 || '',
        cityArea: tripData?.package_receiving_address?.cityArea || '',
        postalCode: tripData?.package_receiving_address?.postalCode || '',
        hotelAirbnbName: tripData?.package_receiving_address?.hotelAirbnbName || '',
        contactNumber: tripData?.package_receiving_address?.contactNumber || '',
        recipientName: tripData?.package_receiving_address?.recipientName || ''
      },
    firstDayPackages: tripData?.first_day_packages ? new Date(tripData.first_day_packages) : null as Date | null,
    lastDayPackages: tripData?.last_day_packages ? new Date(tripData.last_day_packages) : null as Date | null,
    messengerPickupInfo: {
      streetAddress: tripData?.messenger_pickup_info?.streetAddress || '',
      cityArea: tripData?.messenger_pickup_info?.cityArea || '',
      accommodationName: tripData?.messenger_pickup_info?.accommodationName || '',
      contactNumber: tripData?.messenger_pickup_info?.contactNumber || '',
      pickupInstructions: tripData?.messenger_pickup_info?.pickupInstructions || '',
      preferredTime: tripData?.messenger_pickup_info?.preferredTime || ''
    }
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Store original values for change detection
  const originalFormData = useMemo(() => {
    if (!tripData) return null;
    return {
      fromCity: tripData?.from_city || '',
      fromCountry: tripData?.from_country || '',
      toCity: tripData?.to_city || '',
      toCountry: tripData?.to_country || 'Guatemala',
      arrivalDate: tripData?.arrival_date || null,
      availableSpace: tripData?.available_space?.toString() || '',
      deliveryMethod: tripData?.delivery_method || '',
      deliveryDate: tripData?.delivery_date || null,
      additionalInfo: tripData?.additionalInfo || '',
      boostCode: tripData?.boost_code || '',
      recipientName: tripData?.package_receiving_address?.recipientName || '',
      accommodationType: tripData?.package_receiving_address?.accommodationType || '',
      streetAddress: tripData?.package_receiving_address?.streetAddress || '',
      streetAddress2: tripData?.package_receiving_address?.streetAddress2 || '',
      cityArea: tripData?.package_receiving_address?.cityArea || '',
      postalCode: tripData?.package_receiving_address?.postalCode || '',
      hotelAirbnbName: tripData?.package_receiving_address?.hotelAirbnbName || '',
      contactNumber: tripData?.package_receiving_address?.contactNumber || '',
      firstDayPackages: tripData?.first_day_packages || null,
      lastDayPackages: tripData?.last_day_packages || null,
    };
  }, [tripData]);

  const [boostStatus, setBoostStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const boostDebounceRef = useRef<ReturnType<typeof setTimeout>>();

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

  const handleBoostCodeChangeEdit = useCallback((value: string) => {
    handleInputChange('boostCode', value.toUpperCase());
    if (boostDebounceRef.current) clearTimeout(boostDebounceRef.current);
    boostDebounceRef.current = setTimeout(() => validateBoostCode(value), 500);
  }, [validateBoostCode]);

  // Validate existing boost code on mount
  useEffect(() => {
    if (tripData?.boost_code) {
      validateBoostCode(tripData.boost_code);
    } else {
      setBoostStatus('idle');
    }
  }, [tripData?.boost_code]);

  // Check if a field changed
  const isChanged = (field: string, currentValue: any): boolean => {
    if (!originalFormData) return false;
    const orig = (originalFormData as any)[field];
    if (currentValue instanceof Date && orig) {
      return currentValue.toISOString().split('T')[0] !== new Date(orig).toISOString().split('T')[0];
    }
    return String(currentValue || '') !== String(orig || '');
  };

  const changedDot = (field: string, value: any) => {
    if (!isChanged(field, value)) return null;
    return <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-1" title="Campo modificado" />;
  };

  // Detect any changes
  const hasAnyChanges = useMemo(() => {
    if (!originalFormData) return false;
    if (isChanged('fromCity', formData.fromCity)) return true;
    if (isChanged('fromCountry', formData.fromCountry)) return true;
    if (isChanged('toCity', formData.toCity)) return true;
    if (isChanged('toCountry', formData.toCountry)) return true;
    if (isChanged('arrivalDate', formData.arrivalDate)) return true;
    if (isChanged('availableSpace', formData.availableSpace)) return true;
    if (isChanged('deliveryMethod', formData.deliveryMethod)) return true;
    if (isChanged('deliveryDate', formData.deliveryDate)) return true;
    if (isChanged('recipientName', formData.packageReceivingAddress.recipientName)) return true;
    if (isChanged('accommodationType', formData.packageReceivingAddress.accommodationType)) return true;
    if (isChanged('streetAddress', formData.packageReceivingAddress.streetAddress)) return true;
    if (isChanged('cityArea', formData.packageReceivingAddress.cityArea)) return true;
    if (isChanged('postalCode', formData.packageReceivingAddress.postalCode)) return true;
    if (isChanged('contactNumber', formData.packageReceivingAddress.contactNumber)) return true;
    if (isChanged('firstDayPackages', formData.firstDayPackages)) return true;
    if (isChanged('lastDayPackages', formData.lastDayPackages)) return true;
    if (isChanged('additionalInfo', formData.additionalInfo)) return true;
    if (isChanged('boostCode', formData.boostCode)) return true;
    return false;
  }, [formData, originalFormData]);

  // Sync formData with tripData whenever tripData changes
  useEffect(() => {
    if (tripData) {
      setFormData({
        fromCity: tripData?.from_city || '',
        fromCityOther: tripData?.fromCityOther || '',
        fromCountry: tripData?.from_country || '',
        toCity: tripData?.to_city || '',
        toCityOther: tripData?.toCityOther || '',
        toCountry: tripData?.to_country || 'Guatemala',
        arrivalDate: tripData?.arrival_date ? new Date(tripData.arrival_date) : null,
        availableSpace: tripData?.available_space?.toString() || '',
        deliveryMethod: tripData?.delivery_method || '',
        deliveryDate: tripData?.delivery_date ? new Date(tripData.delivery_date) : null,
        additionalInfo: tripData?.additionalInfo || '',
        boostCode: tripData?.boost_code || '',
        packageReceivingAddress: {
          accommodationType: tripData?.package_receiving_address?.accommodationType || '',
          streetAddress: tripData?.package_receiving_address?.streetAddress || '',
          streetAddress2: tripData?.package_receiving_address?.streetAddress2 || '',
          cityArea: tripData?.package_receiving_address?.cityArea || '',
          postalCode: tripData?.package_receiving_address?.postalCode || '',
          hotelAirbnbName: tripData?.package_receiving_address?.hotelAirbnbName || '',
          contactNumber: tripData?.package_receiving_address?.contactNumber || '',
          recipientName: tripData?.package_receiving_address?.recipientName || ''
        },
        firstDayPackages: tripData?.first_day_packages ? new Date(tripData.first_day_packages) : null,
        lastDayPackages: tripData?.last_day_packages ? new Date(tripData.last_day_packages) : null,
        messengerPickupInfo: {
          streetAddress: tripData?.messenger_pickup_info?.streetAddress || '',
          cityArea: tripData?.messenger_pickup_info?.cityArea || '',
          accommodationName: tripData?.messenger_pickup_info?.accommodationName || '',
          contactNumber: tripData?.messenger_pickup_info?.contactNumber || '',
          pickupInstructions: tripData?.messenger_pickup_info?.pickupInstructions || '',
          preferredTime: tripData?.messenger_pickup_info?.preferredTime || ''
        }
      });
      setValidationErrors({});
    }
  }, [tripData]);

  // Get cities dynamically based on selected country
  const originCities = getCitiesByCountry(formData.fromCountry);
  const destinationCities = getCitiesByCountry(formData.toCountry);
  
  // State for showing full country list
  const [showFullCountryListOrigin, setShowFullCountryListOrigin] = useState(false);
  const [showFullCountryListDestination, setShowFullCountryListDestination] = useState(false);
  
  // Check if current country values are in main list
  const isOriginInMainList = MAIN_COUNTRIES.some(c => c.value === formData.fromCountry);
  const isDestinationInMainList = MAIN_COUNTRIES.some(c => c.value === formData.toCountry);
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

  const validate = (): boolean => {
    const errors: ValidationErrors = {};
    const finalFromCity = formData.fromCity === 'Otra ciudad' ? formData.fromCityOther : formData.fromCity;
    const finalToCity = formData.toCity === 'Otra ciudad' ? formData.toCityOther : formData.toCity;
    
    if (!formData.fromCountry) errors.fromCountry = "Obligatorio";
    if (!finalFromCity) errors.fromCity = "Obligatorio";
    if (!finalToCity) errors.toCity = "Obligatorio";
    if (!formData.arrivalDate) errors.arrivalDate = "Obligatorio";
    if (!formData.availableSpace) errors.availableSpace = "Obligatorio";
    if (!formData.deliveryMethod) errors.deliveryMethod = "Obligatorio";
    if (!formData.deliveryDate) errors.deliveryDate = "Obligatorio";
    // Address fields, receiving window dates are optional (aligned with TripForm)

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    const finalFromCity = formData.fromCity === 'Otra ciudad' ? formData.fromCityOther : formData.fromCity;
    const finalToCity = formData.toCity === 'Otra ciudad' ? formData.toCityOther : formData.toCity;
    const submitData = {
      id: tripData.id,
      ...formData,
      fromCity: finalFromCity,
      toCity: finalToCity,
      boostCode: boostStatus === 'valid' ? formData.boostCode : null,
      messengerPickupInfo: formData.deliveryMethod === 'mensajero' 
        ? formData.messengerPickupInfo 
        : null
    };
    onSubmit(submitData);
  };

  const handleResetChanges = () => {
    if (tripData) {
      setFormData({
        fromCity: tripData?.from_city || '',
        fromCityOther: tripData?.fromCityOther || '',
        fromCountry: tripData?.from_country || '',
        toCity: tripData?.to_city || '',
        toCityOther: tripData?.toCityOther || '',
        toCountry: tripData?.to_country || 'Guatemala',
        arrivalDate: tripData?.arrival_date ? new Date(tripData.arrival_date) : null,
        availableSpace: tripData?.available_space?.toString() || '',
        deliveryMethod: tripData?.delivery_method || '',
        deliveryDate: tripData?.delivery_date ? new Date(tripData.delivery_date) : null,
        additionalInfo: tripData?.additionalInfo || '',
        boostCode: tripData?.boost_code || '',
        packageReceivingAddress: {
          accommodationType: tripData?.package_receiving_address?.accommodationType || '',
          streetAddress: tripData?.package_receiving_address?.streetAddress || '',
          streetAddress2: tripData?.package_receiving_address?.streetAddress2 || '',
          cityArea: tripData?.package_receiving_address?.cityArea || '',
          postalCode: tripData?.package_receiving_address?.postalCode || '',
          hotelAirbnbName: tripData?.package_receiving_address?.hotelAirbnbName || '',
          contactNumber: tripData?.package_receiving_address?.contactNumber || '',
          recipientName: tripData?.package_receiving_address?.recipientName || ''
        },
        firstDayPackages: tripData?.first_day_packages ? new Date(tripData.first_day_packages) : null,
        lastDayPackages: tripData?.last_day_packages ? new Date(tripData.last_day_packages) : null,
        messengerPickupInfo: {
          streetAddress: tripData?.messenger_pickup_info?.streetAddress || '',
          cityArea: tripData?.messenger_pickup_info?.cityArea || '',
          accommodationName: tripData?.messenger_pickup_info?.accommodationName || '',
          contactNumber: tripData?.messenger_pickup_info?.contactNumber || '',
          pickupInstructions: tripData?.messenger_pickup_info?.pickupInstructions || '',
          preferredTime: tripData?.messenger_pickup_info?.preferredTime || ''
        }
      });
      setValidationErrors({});
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear validation error
    if ((validationErrors as any)[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      packageReceivingAddress: {
        ...prev.packageReceivingAddress,
        [field]: value
      }
    }));
    if ((validationErrors as any)[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleMessengerInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      messengerPickupInfo: {
        ...prev.messengerPickupInfo,
        [field]: value
      }
    }));
  };
  
  // Fetch delivery points for conditional delivery options
  const { getDeliveryPointByCity } = useDeliveryPoints();
  
  // Determine if destination has official delivery options
  const destinationDeliveryPoint = formData.toCity && formData.toCountry 
    ? getDeliveryPointByCity(formData.toCity, formData.toCountry)
    : null;
  
  const isDestinationGuatemala = formData.toCountry?.toLowerCase() === 'guatemala';
  const hasInternationalDeliveryPoint = !!destinationDeliveryPoint;
  const hasOfficialDeliveryOptions = isDestinationGuatemala || hasInternationalDeliveryPoint;
  
  // Reset delivery method when destination changes and method becomes invalid
  useEffect(() => {
    const guatemalaOptions = ['oficina', 'mensajero'];
    const internationalOptions = ['correo', 'coordinacion_shopper'];
    
    if (hasOfficialDeliveryOptions && internationalOptions.includes(formData.deliveryMethod)) {
      setFormData(prev => ({ ...prev, deliveryMethod: '' }));
    } else if (!hasOfficialDeliveryOptions && guatemalaOptions.includes(formData.deliveryMethod)) {
      setFormData(prev => ({ ...prev, deliveryMethod: '' }));
    }
  }, [formData.toCountry, formData.toCity, hasOfficialDeliveryOptions]);

  // Helper for error styling
  const errorClass = (field: string) => (validationErrors as any)[field] ? "border-destructive" : "";
  const errorMsg = (field: string) => {
    const msg = (validationErrors as any)[field];
    if (!msg) return null;
    return (
      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" />
        {msg}
      </p>
    );
  };

  // Title: "Editar Viaje: Miami → Guatemala" instead of UUID
  const tripTitle = tripData 
    ? `Editar Viaje: ${tripData.from_city || '?'} → ${tripData.to_city || '?'}`
    : 'Editar Viaje';
  
  if (!tripData) return null;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-traveler" />
              <span>{tripTitle}</span>
            </DialogTitle>
            {hasAnyChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
                Cambios sin guardar
              </Badge>
            )}
          </div>
          <DialogDescription>
            Modifica la información de tu viaje. Los campos con <span className="text-destructive">*</span> son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 🟦 1. Información básica del viaje */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-primary/20">
              <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold text-primary">Información básica del viaje</h3>
            </div>

            {/* Sección ORIGEN */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Origen
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    País <span className="text-destructive">*</span>
                    {changedDot('fromCountry', formData.fromCountry)}
                  </Label>
                  {!showFullCountryListOrigin && isOriginInMainList ? (
                    <Select 
                      value={formData.fromCountry}
                      onValueChange={(value) => {
                        if (value === '__otro__') {
                          setShowFullCountryListOrigin(true);
                        } else {
                          handleInputChange('fromCountry', value);
                          handleInputChange('fromCity', '');
                        }
                      }}
                    >
                      <SelectTrigger className={errorClass('fromCountry')}>
                        <SelectValue placeholder="País">
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
                    <Combobox
                      options={COUNTRIES}
                      value={formData.fromCountry}
                      onValueChange={value => {
                        handleInputChange('fromCountry', value);
                        handleInputChange('fromCity', '');
                      }}
                      placeholder="Buscar país..."
                      searchPlaceholder="Buscar país..."
                      emptyMessage="No se encontraron países"
                      className="w-full"
                      portalled={false}
                    />
                  )}
                  {errorMsg('fromCountry')}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Ciudad <span className="text-destructive">*</span>
                    {changedDot('fromCity', formData.fromCity)}
                  </Label>
                  {countryHasCities(formData.fromCountry) ? (
                    <Combobox
                      options={originCities}
                      value={formData.fromCity}
                      onValueChange={value => handleInputChange('fromCity', value)}
                      placeholder="Selecciona ciudad"
                      allowCustomValue={true}
                      portalled={false}
                    />
                  ) : (
                    <Input 
                      placeholder="Ciudad de origen" 
                      value={formData.fromCity}
                      onChange={e => handleInputChange('fromCity', e.target.value)}
                      className={errorClass('fromCity')}
                    />
                  )}
                  {errorMsg('fromCity')}
                </div>
              </div>
            </div>

            {/* Sección DESTINO */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Destino
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    País <span className="text-destructive">*</span>
                    {changedDot('toCountry', formData.toCountry)}
                  </Label>
                  {!showFullCountryListDestination && isDestinationInMainList ? (
                    <Select 
                      value={formData.toCountry}
                      onValueChange={(value) => {
                        if (value === '__otro__') {
                          setShowFullCountryListDestination(true);
                        } else {
                          handleInputChange('toCountry', value);
                          handleInputChange('toCity', '');
                        }
                      }}
                    >
                      <SelectTrigger className={errorClass('toCity')}>
                        <SelectValue placeholder="País">
                          {formData.toCountry && MAIN_COUNTRIES.find(c => c.value === formData.toCountry)?.label}
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
                    <Combobox
                      options={COUNTRIES}
                      value={formData.toCountry}
                      onValueChange={value => {
                        handleInputChange('toCountry', value);
                        handleInputChange('toCity', '');
                      }}
                      placeholder="Buscar país..."
                      searchPlaceholder="Buscar país..."
                      emptyMessage="No se encontraron países"
                      className="w-full"
                      portalled={false}
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Ciudad <span className="text-destructive">*</span>
                    {changedDot('toCity', formData.toCity)}
                  </Label>
                  {countryHasCities(formData.toCountry) ? (
                    <Combobox
                      options={destinationCities}
                      value={formData.toCity}
                      onValueChange={value => handleInputChange('toCity', value)}
                      placeholder="Selecciona ciudad"
                      allowCustomValue={true}
                      portalled={false}
                    />
                  ) : (
                    <Input 
                      placeholder="Ciudad de destino" 
                      value={formData.toCity}
                      onChange={e => handleInputChange('toCity', e.target.value)}
                      className={errorClass('toCity')}
                    />
                  )}
                  {errorMsg('toCity')}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Fecha de llegada a destino <span className="text-destructive">*</span>
                {changedDot('arrivalDate', formData.arrivalDate)}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", errorClass('arrivalDate'))} type="button">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.arrivalDate ? format(formData.arrivalDate, "PPP", {
                    locale: es
                  }) : <span>Selecciona fecha de llegada</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={formData.arrivalDate || undefined} onSelect={date => handleInputChange('arrivalDate', date)} disabled={date => date < new Date()} initialFocus />
                </PopoverContent>
              </Popover>
              {errorMsg('arrivalDate')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="availableSpace">
                Espacio disponible en tu equipaje (en kg) <span className="text-destructive">*</span>
                {changedDot('availableSpace', formData.availableSpace)}
              </Label>
              <div className="relative">
                <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="availableSpace" type="number" step="0.5" placeholder="5.0" value={formData.availableSpace} onChange={e => handleInputChange('availableSpace', e.target.value)} className={cn("pl-10", errorClass('availableSpace'))} required />
              </div>
              {errorMsg('availableSpace')}
            </div>
          </div>

          {/* 🟦 2. Dirección para recibir paquetes en destino */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-primary/20">
              <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold text-primary">Dirección para recibir paquetes en destino</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta información se comparte únicamente con el shopper si el pedido es aprobado.
            </p>

            <div className="space-y-2">
              <Label htmlFor="recipientName">
                Nombre de la persona que recibe los paquetes
                {changedDot('recipientName', formData.packageReceivingAddress.recipientName)}
              </Label>
              <Input id="recipientName" type="text" placeholder="Ej: Juan Pérez" value={formData.packageReceivingAddress.recipientName} onChange={e => handleAddressChange('recipientName', e.target.value)} className={errorClass('recipientName')} required />
              {errorMsg('recipientName')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accommodationType">
                Tipo de alojamiento
                {changedDot('accommodationType', formData.packageReceivingAddress.accommodationType)}
              </Label>
              <Select value={formData.packageReceivingAddress.accommodationType} onValueChange={value => handleAddressChange('accommodationType', value)}>
                <SelectTrigger className={errorClass('accommodationType')}>
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
              {errorMsg('accommodationType')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetAddress">
                Dirección línea 1
                {changedDot('streetAddress', formData.packageReceivingAddress.streetAddress)}
              </Label>
              <Input id="streetAddress" type="text" placeholder="Ej: 123 Main Street" value={formData.packageReceivingAddress.streetAddress} onChange={e => handleAddressChange('streetAddress', e.target.value)} className={errorClass('streetAddress')} required />
              {errorMsg('streetAddress')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetAddress2">Dirección línea 2 (opcional)</Label>
              <Input id="streetAddress2" type="text" placeholder="Ej: Apt 4B, Suite 100" value={formData.packageReceivingAddress.streetAddress2} onChange={e => handleAddressChange('streetAddress2', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cityArea">
                  Ciudad / Estado / Región
                  {changedDot('cityArea', formData.packageReceivingAddress.cityArea)}
                </Label>
                <Input id="cityArea" type="text" placeholder="Ej: Miami, FL" value={formData.packageReceivingAddress.cityArea} onChange={e => handleAddressChange('cityArea', e.target.value)} className={errorClass('cityArea')} required />
                {errorMsg('cityArea')}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">
                  Código postal
                  {changedDot('postalCode', formData.packageReceivingAddress.postalCode)}
                </Label>
                <Input id="postalCode" type="text" placeholder="Ej: 33101" value={formData.packageReceivingAddress.postalCode} onChange={e => handleAddressChange('postalCode', e.target.value)} className={errorClass('postalCode')} required />
                {errorMsg('postalCode')}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotelAirbnbName">
                Nombre del lugar (Ej: Hotel Barceló, Condominio El Prado, etc.)
                {changedDot('hotelAirbnbName', formData.packageReceivingAddress.hotelAirbnbName)}
              </Label>
              <Input id="hotelAirbnbName" type="text" placeholder="Ej: Hotel InterContinental Miami" value={formData.packageReceivingAddress.hotelAirbnbName} onChange={e => handleAddressChange('hotelAirbnbName', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">
                Número de contacto
                {changedDot('contactNumber', formData.packageReceivingAddress.contactNumber)}
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="contactNumber" type="tel" placeholder="+1 (305) 123-4567" value={formData.packageReceivingAddress.contactNumber} onChange={e => handleAddressChange('contactNumber', e.target.value)} className={cn("pl-10", errorClass('contactNumber'))} required />
              </div>
              {errorMsg('contactNumber')}
              <p className="text-xs text-muted-foreground">
                Si te hospedas en hotel, coloca el número del hotel
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Primer día para recibir paquetes
                  {changedDot('firstDayPackages', formData.firstDayPackages)}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", errorClass('firstDayPackages'))} type="button">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.firstDayPackages ? format(formData.firstDayPackages, "dd/MM", {
                      locale: es
                    }) : <span className="text-xs">Fecha inicio</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formData.firstDayPackages || undefined} onSelect={date => handleInputChange('firstDayPackages', date)} disabled={date => date < new Date()} initialFocus />
                  </PopoverContent>
                </Popover>
                {errorMsg('firstDayPackages')}
              </div>

              <div className="space-y-2">
                <Label>
                  Último día para recibir paquetes
                  {changedDot('lastDayPackages', formData.lastDayPackages)}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", errorClass('lastDayPackages'))} type="button">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.lastDayPackages ? format(formData.lastDayPackages, "dd/MM", {
                      locale: es
                    }) : <span className="text-xs">Fecha fin</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formData.lastDayPackages || undefined} onSelect={date => handleInputChange('lastDayPackages', date)} disabled={date => date < new Date() || (formData.firstDayPackages ? date < formData.firstDayPackages : false)} initialFocus />
                  </PopoverContent>
                </Popover>
                {errorMsg('lastDayPackages')}
              </div>
            </div>
          </div>

          {/* 🟦 3. Entrega de paquetes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-primary/20">
              <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold text-primary">
                {hasOfficialDeliveryOptions 
                  ? `Entrega de paquetes en ${isDestinationGuatemala ? 'Guatemala' : formData.toCity || 'destino'}`
                  : 'Entrega de paquetes al shopper'
                }
              </h3>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-medium">
                {hasOfficialDeliveryOptions 
                  ? '¿Cómo vas a entregar los paquetes a Favorón? '
                  : '¿Cómo vas a entregar los paquetes al shopper? '
                }
                <span className="text-destructive">*</span>
                {changedDot('deliveryMethod', formData.deliveryMethod)}
              </Label>
              <RadioGroup value={formData.deliveryMethod} onValueChange={value => handleInputChange('deliveryMethod', value)} className="space-y-3">
                {hasOfficialDeliveryOptions ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="oficina" id="oficina" />
                      <Label htmlFor="oficina" className="cursor-pointer flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {isDestinationGuatemala 
                          ? 'Entrego en oficina de Favorón (zona 14)'
                          : `Entrego en punto de entrega Favorón (${destinationDeliveryPoint?.name || formData.toCity})`
                        }
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mensajero" id="mensajero" />
                      <Label htmlFor="mensajero" className="cursor-pointer flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Entrega a mensajero Favorón (Q25–Q40 según dirección)
                      </Label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="correo" id="correo" />
                      <Label htmlFor="correo" className="cursor-pointer flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Lo envío por correo al shopper
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="coordinacion_shopper" id="coordinacion_shopper" />
                      <Label htmlFor="coordinacion_shopper" className="cursor-pointer flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Me coordino directamente con el shopper
                      </Label>
                    </div>
                  </>
                )}
              </RadioGroup>
              {errorMsg('deliveryMethod')}
              
              {formData.deliveryMethod === 'mensajero' && (
                <div className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/10">
                  <p className="text-sm text-muted-foreground">
                    Información de entrega para el mensajero de Favorón
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="messengerStreetAddress">Dirección completa *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="messengerStreetAddress"
                        type="text"
                        placeholder="Ej: 5ta Avenida 10-50, Zona 10"
                        value={formData.messengerPickupInfo.streetAddress}
                        onChange={(e) => handleMessengerInfoChange('streetAddress', e.target.value)}
                        className="pl-10"
                        required={formData.deliveryMethod === 'mensajero'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messengerCityArea">Ciudad/Zona *</Label>
                    <Input 
                      id="messengerCityArea"
                      type="text"
                      placeholder="Ej: Guatemala, Zona 10"
                      value={formData.messengerPickupInfo.cityArea}
                      onChange={(e) => handleMessengerInfoChange('cityArea', e.target.value)}
                      required={formData.deliveryMethod === 'mensajero'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messengerAccommodationName">Nombre del lugar (opcional)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="messengerAccommodationName"
                        type="text"
                        placeholder="Ej: Edificio Europlaza, Torre 1"
                        value={formData.messengerPickupInfo.accommodationName}
                        onChange={(e) => handleMessengerInfoChange('accommodationName', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messengerContactNumber">Número de contacto *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="messengerContactNumber"
                        type="tel"
                        placeholder="+502 1234-5678"
                        value={formData.messengerPickupInfo.contactNumber}
                        onChange={(e) => handleMessengerInfoChange('contactNumber', e.target.value)}
                        className="pl-10"
                        required={formData.deliveryMethod === 'mensajero'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messengerPreferredTime">Horario preferido (opcional)</Label>
                    <Input 
                      id="messengerPreferredTime"
                      type="text"
                      placeholder="Ej: Entre 2pm y 5pm"
                      value={formData.messengerPickupInfo.preferredTime}
                      onChange={(e) => handleMessengerInfoChange('preferredTime', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messengerPickupInstructions">Instrucciones adicionales (opcional)</Label>
                    <Textarea 
                      id="messengerPickupInstructions"
                      placeholder="Ej: Tocar el timbre del apartamento 301, preguntar por Juan..."
                      value={formData.messengerPickupInfo.pickupInstructions}
                      onChange={(e) => handleMessengerInfoChange('pickupInstructions', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Fecha en la que entregarás los paquetes <span className="text-destructive">*</span>
                {changedDot('deliveryDate', formData.deliveryDate)}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", errorClass('deliveryDate'))} type="button">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deliveryDate ? format(formData.deliveryDate, "PPP", {
                    locale: es
                  }) : <span>Selecciona fecha de entrega</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={formData.deliveryDate || undefined} onSelect={date => handleInputChange('deliveryDate', date)} disabled={date => date < new Date() || (formData.arrivalDate ? date < formData.arrivalDate : false)} initialFocus />
                </PopoverContent>
              </Popover>
              {errorMsg('deliveryDate')}
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
              <Label htmlFor="boostCode" className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-amber-600" />
                Tip Booster Code
                {changedDot('boostCode', formData.boostCode)}
              </Label>
              <Input
                id="boostCode"
                type="text"
                placeholder="Ej: BOOST10"
                value={formData.boostCode}
                onChange={e => handleInputChange('boostCode', e.target.value.toUpperCase())}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Código de boost para incrementar las propinas del viajero
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Comentarios opcionales</Label>
              <Textarea id="additionalInfo" placeholder="Horarios de disponibilidad, restricciones, comentarios especiales..." value={formData.additionalInfo} onChange={e => handleInputChange('additionalInfo', e.target.value)} className="min-h-[80px]" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              {hasAnyChanges && (
                <Button type="button" variant="ghost" size="sm" onClick={handleResetChanges} className="text-xs text-muted-foreground">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Deshacer cambios
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!hasAnyChanges}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};
export default EditTripModal;
