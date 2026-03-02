import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plane, MapPin, Package, Phone, Building2, Target, Mail, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Combobox } from "@/components/ui/combobox";
import { COUNTRIES, MAIN_COUNTRIES, COUNTRY_QUICK_OPTIONS } from "@/lib/countries";
import { getCitiesByCountry, countryHasCities } from "@/lib/cities";
import { useDeliveryPoints } from "@/hooks/useDeliveryPoints";
interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tripData: any) => void;
  tripData: any;
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
    // departureDate removed - using arrival_date consistently
    availableSpace: tripData?.available_space?.toString() || '',
    deliveryMethod: tripData?.delivery_method || '',
    deliveryDate: tripData?.delivery_date ? new Date(tripData.delivery_date) : null as Date | null,
    additionalInfo: tripData?.additionalInfo || '',
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFromCity = formData.fromCity === 'Otra ciudad' ? formData.fromCityOther : formData.fromCity;
    const finalToCity = formData.toCity === 'Otra ciudad' ? formData.toCityOther : formData.toCity;
    if (!finalFromCity || !finalToCity || !formData.arrivalDate || !formData.availableSpace || !formData.deliveryMethod || !formData.deliveryDate || !formData.packageReceivingAddress.accommodationType || !formData.packageReceivingAddress.streetAddress || !formData.packageReceivingAddress.cityArea || !formData.packageReceivingAddress.postalCode || !formData.packageReceivingAddress.contactNumber || !formData.packageReceivingAddress.recipientName || !formData.firstDayPackages || !formData.lastDayPackages || !formData.fromCountry) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }
    const submitData = {
      id: tripData.id,
      ...formData,
      fromCity: finalFromCity,
      toCity: finalToCity,
      messengerPickupInfo: formData.deliveryMethod === 'mensajero' 
        ? formData.messengerPickupInfo 
        : null
    };
    onSubmit(submitData);
  };
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      packageReceivingAddress: {
        ...prev.packageReceivingAddress,
        [field]: value
      }
    }));
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
  const displayToCity = formData.toCity === 'Otra ciudad' ? formData.toCityOther : formData.toCity;
  
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
  
  if (!tripData) return null;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plane className="h-5 w-5 text-traveler" />
            <span>Editar Viaje #{tripData.id}</span>
          </DialogTitle>
          <DialogDescription>
            Modifica la información de tu viaje registrado.
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
                  <Label className="text-xs text-muted-foreground">País *</Label>
                  {!showFullCountryListOrigin && isOriginInMainList ? (
                    <Select 
                      value={formData.fromCountry}
                      onValueChange={(value) => {
                        if (value === '__otro__') {
                          setShowFullCountryListOrigin(true);
                        } else {
                          handleInputChange('fromCountry', value);
                          handleInputChange('fromCity', ''); // Clear city when country changes
                        }
                      }}
                    >
                      <SelectTrigger>
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
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Ciudad *</Label>
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
                    />
                  )}
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
                  <Label className="text-xs text-muted-foreground">País *</Label>
                  {!showFullCountryListDestination && isDestinationInMainList ? (
                    <Select 
                      value={formData.toCountry}
                      onValueChange={(value) => {
                        if (value === '__otro__') {
                          setShowFullCountryListDestination(true);
                        } else {
                          handleInputChange('toCountry', value);
                          handleInputChange('toCity', ''); // Clear city when country changes
                        }
                      }}
                    >
                      <SelectTrigger>
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
                  <Label className="text-xs text-muted-foreground">Ciudad *</Label>
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
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha de llegada a destino *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
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
              <h3 className="text-lg font-semibold text-primary">Dirección para recibir paquetes en destino</h3>
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
              <Label htmlFor="hotelAirbnbName">Nombre del lugar (Ej: Hotel Barceló, Condominio El Prado, etc.) *</Label>
              <Input id="hotelAirbnbName" type="text" placeholder="Ej: Hotel InterContinental Miami" value={formData.packageReceivingAddress.hotelAirbnbName} onChange={e => handleAddressChange('hotelAirbnbName', e.target.value)} required />
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
                    <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
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
              </div>

              <div className="space-y-2">
                <Label>Último día para recibir paquetes *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
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
                  ? '¿Cómo vas a entregar los paquetes a Favorón? *'
                  : '¿Cómo vas a entregar los paquetes al shopper? *'
                }
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
              <Label>Fecha en la que entregarás los paquetes *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
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
              <Textarea id="additionalInfo" placeholder="Horarios de disponibilidad, restricciones, comentarios especiales..." value={formData.additionalInfo} onChange={e => handleInputChange('additionalInfo', e.target.value)} className="min-h-[80px]" />
            </div>
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
    </Dialog>;
};
export default EditTripModal;