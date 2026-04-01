import React, { useState, useMemo } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getQuoteValues } from "@/lib/quoteHelpers";
import { getPriceBreakdown } from "@/lib/pricing";
import { formatPrice, formatCurrency } from "@/lib/formatters";
import { usePlatformFeesContext } from "@/contexts/PlatformFeesContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TermsAndConditionsModal from "@/components/TermsAndConditionsModal";
import DeliveryAddressSheet, { DeliveryAddressData } from "./DeliveryAddressSheet";
import { Clock, MapPin, DollarSign, Check, Loader2, User, Package, Truck, Home, FileText, AlertTriangle, X, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import QuoteCountdown from "./QuoteCountdown";

interface Assignment {
  id: string;
  trip_id: string;
  status: string;
  quote: any;
  admin_assigned_tip: number | null;
  traveler_address: any;
  matched_trip_dates: any;
  quote_expires_at: string | null;
  traveler_first_name?: string;
  traveler_last_name?: string;
  traveler_avatar_url?: string;
  trip_from_city?: string;
  trip_to_city?: string;
  trip_delivery_date?: string;
}

export interface MultiQuoteAcceptExtras {
  deliveryMethod: string;
  deliveryAddress?: DeliveryAddressData;
  discountData?: {
    code: string;
    codeId: string;
    amount: number;
    originalTotal: number;
    finalTotal: number;
  };
}

export interface MultiQuotePackageDetails {
  delivery_method: string;
  shopper_trust_level?: string;
  cityArea?: string;
  package_destination_country?: string;
  products_data?: any[];
  confirmedDeliveryAddress?: any;
  package_destination?: string;
}

interface MultiQuoteSelectorProps {
  assignments: Assignment[];
  onAcceptQuote: (assignmentId: string, extras: MultiQuoteAcceptExtras) => Promise<void>;
  onRejectAllQuotes?: () => Promise<void>;
  packageDetails: MultiQuotePackageDetails;
  shopperId?: string;
}

const formatDateUTC = (dateString: string) => {
  const date = new Date(dateString);
  return format(
    new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    'dd MMM yyyy',
    { locale: es }
  );
};

const MultiQuoteSelector = ({ assignments, onAcceptQuote, onRejectAllQuotes, packageDetails, shopperId }: MultiQuoteSelectorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState(packageDetails.delivery_method || 'pickup');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmedDeliveryTime, setConfirmedDeliveryTime] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddressData | null>(
    packageDetails.confirmedDeliveryAddress
      ? {
          streetAddress: packageDetails.confirmedDeliveryAddress.streetAddress || '',
          cityArea: packageDetails.confirmedDeliveryAddress.cityArea || '',
          hotelAirbnbName: packageDetails.confirmedDeliveryAddress.hotelAirbnbName || '',
          contactNumber: packageDetails.confirmedDeliveryAddress.contactNumber || '',
        }
      : null
  );

  // Discount code state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const [discountCode, setDiscountCode] = useState('');
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountSuccess, setDiscountSuccess] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountCodeId, setDiscountCodeId] = useState<string | null>(null);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  const { fees, rates } = usePlatformFeesContext();
  const { toast } = useToast();

  const quotedAssignments = assignments.filter(a => a.status === 'bid_submitted' && a.quote);
  const pendingAssignments = assignments.filter(a => a.status === 'bid_pending');

  // Find the nearest expiration among all quoted assignments
  const nearestExpiration = useMemo(() => {
    const validDates = quotedAssignments
      .map(a => a.quote_expires_at)
      .filter((d): d is string => !!d && new Date(d) > new Date());
    if (validDates.length === 0) return null;
    return validDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
  }, [quotedAssignments]);

  const selectedAssignment = quotedAssignments.find(a => a.id === selectedId);

  // Check if selected assignment's quote has expired
  const isSelectedExpired = useMemo(() => {
    if (!selectedAssignment?.quote_expires_at) return false;
    return new Date(selectedAssignment.quote_expires_at) <= new Date();
  }, [selectedAssignment]);

  // Compute delivery fees for the selected quote
  const deliveryFees = useMemo(() => ({
    delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
    delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
    delivery_fee_outside_city: fees.delivery_fee_outside_city,
    prime_delivery_discount: fees.prime_delivery_discount,
  }), [fees]);

  // Use delivery address cityArea when available, fallback to package cityArea
  const effectiveCityArea = (selectedDeliveryMethod === 'delivery' && deliveryAddress?.cityArea)
    ? deliveryAddress.cityArea
    : packageDetails.cityArea;

  // Calculate recalculated total for selected quote
  const recalculatedTotal = useMemo(() => {
    if (!selectedAssignment) return null;
    const quoteValues = getQuoteValues(selectedAssignment.quote);
    // Base price from quote (tip amount)
    const basePrice = quoteValues.price;
    const breakdown = getPriceBreakdown(
      basePrice,
      selectedDeliveryMethod,
      packageDetails.shopper_trust_level,
      effectiveCityArea,
      rates,
      deliveryFees,
      packageDetails.package_destination_country
    );
    return {
      ...breakdown,
      quoteValues,
    };
  }, [selectedAssignment, selectedDeliveryMethod, packageDetails, rates, deliveryFees, effectiveCityArea]);

  const standardDeliveryFee = useMemo(() => {
    if (!selectedAssignment) return 0;
    const quoteValues = getQuoteValues(selectedAssignment.quote);
    const breakdown = getPriceBreakdown(
      quoteValues.price,
      'delivery',
      packageDetails.shopper_trust_level,
      effectiveCityArea,
      rates,
      deliveryFees,
      packageDetails.package_destination_country
    );
    return breakdown.deliveryFee;
  }, [selectedAssignment, packageDetails, rates, deliveryFees, effectiveCityArea]);

  const displayTotal = useMemo(() => {
    if (!recalculatedTotal) return 0;
    const base = recalculatedTotal.totalPrice;
    if (discountSuccess && discountAmount > 0) {
      return Math.max(0, base - discountAmount);
    }
    return base;
  }, [recalculatedTotal, discountSuccess, discountAmount]);

  const removeDiscount = () => {
    setDiscountCode('');
    setDiscountSuccess(false);
    setDiscountAmount(0);
    setDiscountCodeId(null);
    setOriginalTotal(0);
    setFinalTotal(0);
    setDiscountError(null);
  };

  const validateDiscountCode = async () => {
    if (!discountCode.trim() || !recalculatedTotal) return;
    setIsValidatingCode(true);
    setDiscountError(null);
    
    try {
      const favoronSubtotal = recalculatedTotal.basePrice + recalculatedTotal.serviceFee;
      
      const { data, error } = await supabase.rpc('validate_discount_code', {
        _code: discountCode.trim().toUpperCase(),
        _order_amount: favoronSubtotal,
        _user_id: shopperId || null
      });
      
      if (error) throw error;
      const result = data as any;
      
      if (result?.valid) {
        const discount = result.calculatedDiscount;
        const discountedFavoron = Math.max(0, favoronSubtotal - discount);
        const finalTotalWithDelivery = discountedFavoron + recalculatedTotal.deliveryFee;
        
        setDiscountAmount(discount);
        setDiscountCodeId(result.discountCodeId);
        setOriginalTotal(favoronSubtotal);
        setFinalTotal(finalTotalWithDelivery);
        setDiscountSuccess(true);
        
        toast({
          title: "¡Código aplicado!",
          description: `Descuento de ${formatCurrency(discount)} aplicado correctamente.`,
        });
      } else {
        setDiscountError(result?.message || 'Código no válido');
      }
    } catch (err: any) {
      setDiscountError(err.message || 'Error al validar el código');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedId || !recalculatedTotal) return;
    setAcceptingId(selectedId);
    try {
      const extras: MultiQuoteAcceptExtras = {
        deliveryMethod: selectedDeliveryMethod,
        ...(isDeliveryAddressRequired && deliveryAddress ? { deliveryAddress } : {}),
      };
      if (discountSuccess && discountCodeId) {
        extras.discountData = {
          code: discountCode.trim().toUpperCase(),
          codeId: discountCodeId,
          amount: discountAmount,
          originalTotal,
          finalTotal: displayTotal,
        };
      }
      await onAcceptQuote(selectedId, extras);
    } finally {
      setAcceptingId(null);
    }
  };

  if (quotedAssignments.length === 0 && pendingAssignments.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No hay cotizaciones disponibles aún.
      </div>
    );
  }

  const isDeliveryAddressRequired = selectedDeliveryMethod === 'delivery';
  const hasValidAddress = deliveryAddress && deliveryAddress.streetAddress.trim() && deliveryAddress.contactNumber.trim();
  const canAccept = selectedId && acceptedTerms && confirmedDeliveryTime && !acceptingId && !isSelectedExpired && (!isDeliveryAddressRequired || hasValidAddress);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Selecciona una cotización ({quotedAssignments.length})
        </h3>
      </div>

      {nearestExpiration && (
        <QuoteCountdown expiresAt={nearestExpiration} compact={true} />
      )}

      {quotedAssignments.map((assignment) => {
        const quoteValues = getQuoteValues(assignment.quote);
        const travelerFirstName = assignment.traveler_first_name || 'Viajero';
        const travelerLastName = assignment.traveler_last_name || '';
        const initials = assignment.traveler_first_name?.[0] || '';

        const tripDates = assignment.matched_trip_dates as any;
        const travelerAddr = assignment.traveler_address as any;

        const firstDay = tripDates?.first_day_packages || tripDates?.packageReceptionStart;
        const lastDay = tripDates?.last_day_packages || tripDates?.packageReceptionEnd;
        const deliveryDate = tripDates?.delivery_date || tripDates?.officeDeliveryDate;
        const city = travelerAddr?.cityArea || travelerAddr?.city || travelerAddr?.ciudad || null;
        const accommodationType = travelerAddr?.accommodationType || null;
        const streetLine = travelerAddr?.streetAddress || travelerAddr?.firstAddressLine || null;
        const zipCode = travelerAddr?.postalCode || travelerAddr?.zipCode || travelerAddr?.codigoPostal || null;

        const isSelected = selectedId === assignment.id;

        return (
          <Card
            key={assignment.id}
            className={`cursor-pointer transition-all ${
              isSelected
                ? 'ring-2 ring-primary border-primary shadow-md'
                : 'border-muted-foreground/20 hover:border-primary/40'
            }`}
            onClick={() => {
              setSelectedId(assignment.id);
              // Reset discount when switching quotes
              if (assignment.id !== selectedId) {
                removeDiscount();
              }
            }}
          >
            <CardContent className="p-3 space-y-2">
              {/* Traveler info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    {assignment.traveler_avatar_url ? (
                      <AvatarImage src={assignment.traveler_avatar_url} alt={travelerFirstName} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {travelerFirstName}
                  </p>
                  {assignment.trip_from_city && assignment.trip_to_city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {assignment.trip_from_city} → {assignment.trip_to_city}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-primary">{formatCurrency(quoteValues.price + quoteValues.serviceFee)}</span>
                    <span className="text-[10px] text-muted-foreground">+ envío según método</span>
                  </div>
                  {assignment.quote_expires_at && (
                    <QuoteCountdown expiresAt={assignment.quote_expires_at} micro={true} />
                  )}
                  {assignment.trip_delivery_date && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                      {format(new Date(assignment.trip_delivery_date), 'dd MMM', { locale: es })}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Expandable details when selected */}
              {isSelected && (
                <>
                  {/* Traveler details */}
                  <div className="bg-muted/30 rounded-lg p-2.5 space-y-1.5 text-xs">
                    {city && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Home className="h-3 w-3 flex-shrink-0" />
                        <span>{accommodationType ? `${accommodationType} en ${city}` : city}</span>
                      </div>
                    )}
                    {(streetLine || zipCode) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span>{[streetLine, zipCode ? `CP ${zipCode}` : null].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {firstDay && lastDay && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-3 w-3 flex-shrink-0" />
                        <span>
                          Recibe: <span className="font-medium text-foreground">{formatDateUTC(firstDay)} - {formatDateUTC(lastDay)}</span>
                        </span>
                      </div>
                    )}
                    {deliveryDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Truck className="h-3 w-3 flex-shrink-0" />
                        <span>
                          Entrega: <span className="font-medium text-foreground">{formatDateUTC(deliveryDate)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Pending assignments */}
      {pendingAssignments.map((assignment) => {
        const travelerName = assignment.traveler_first_name || 'Viajero';

        return (
          <Card key={assignment.id} className="border-dashed border-muted-foreground/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 opacity-60">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Esperando cotización de <span className="font-medium">{travelerName}</span>
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Pendiente
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Pre-acceptance fields - only show when a quote is selected */}
      {selectedId && recalculatedTotal && (
        <div className="space-y-3 border-t border-muted/50 pt-3">
          {/* Delivery method toggle */}
          <div className="bg-muted/30 border border-muted/50 rounded-lg p-3">
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Método de entrega
            </p>
            <RadioGroup 
              value={selectedDeliveryMethod} 
              onValueChange={(val) => {
                setSelectedDeliveryMethod(val);
                if (discountSuccess) removeDiscount();
              }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pickup" id="mqs-pickup" />
                  <Label htmlFor="mqs-pickup" className="text-sm cursor-pointer">
                    Recoger en punto de entrega
                  </Label>
                </div>
                <span className="text-xs text-emerald-600 font-medium">Gratis</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="delivery" id="mqs-delivery" />
                  <Label htmlFor="mqs-delivery" className="text-sm cursor-pointer">
                    Entrega a domicilio
                  </Label>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {formatCurrency(standardDeliveryFee)}
                </span>
              </div>
            </RadioGroup>
            {selectedDeliveryMethod !== packageDetails.delivery_method && (
              <p className="text-[11px] text-primary mt-1.5 font-medium">
                ✏️ Cambiarás de {packageDetails.delivery_method === 'delivery' ? 'entrega a domicilio' : 'pickup'} a {selectedDeliveryMethod === 'delivery' ? 'entrega a domicilio' : 'pickup'}
              </p>
            )}

            {/* Delivery address summary when delivery is selected */}
            {selectedDeliveryMethod === 'delivery' && (
              <div className="mt-2 bg-background/80 border border-muted/50 rounded-lg p-2.5">
                {deliveryAddress && deliveryAddress.streetAddress ? (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{deliveryAddress.streetAddress}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[deliveryAddress.cityArea, deliveryAddress.hotelAirbnbName].filter(Boolean).join(' · ')}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{deliveryAddress.contactNumber}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setShowAddressSheet(true)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setShowAddressSheet(true)}
                  >
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    Agregar dirección de entrega
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Total display */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal (tip + comisión):</span>
              <span className="font-medium">{formatCurrency(recalculatedTotal.basePrice + recalculatedTotal.serviceFee)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Envío:</span>
              <span className="font-medium">
                {recalculatedTotal.deliveryFee > 0 ? formatCurrency(recalculatedTotal.deliveryFee) : 'Gratis'}
              </span>
            </div>
            {discountSuccess && discountAmount > 0 && (
              <div className="flex justify-between items-center text-sm text-primary">
                <span>Descuento:</span>
                <span className="font-medium">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-primary/20 pt-1.5 flex justify-between items-center">
              <span className="text-sm font-semibold">Total a pagar:</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(displayTotal)}</span>
            </div>
          </div>

          {/* Discount code section */}
          <div className="bg-muted/20 border border-muted/50 rounded-lg p-3">
            <Label className="text-sm font-semibold mb-2 block">
              💳 ¿Tienes un código de descuento?
            </Label>
            
            {!discountSuccess ? (
              <>
                <div className="flex gap-2 mt-2">
                  <Input 
                    placeholder="Ingresa tu código"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value.toUpperCase());
                      setDiscountError(null);
                    }}
                    className="flex-1 uppercase font-mono bg-background"
                    disabled={isValidatingCode}
                  />
                  <Button 
                    onClick={validateDiscountCode} 
                    disabled={!discountCode.trim() || isValidatingCode}
                    size="sm"
                  >
                    {isValidatingCode ? 'Validando...' : 'Aplicar'}
                  </Button>
                </div>
                {discountError && (
                  <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {discountError}
                  </p>
                )}
              </>
            ) : (
              <div className="mt-2 bg-background/80 rounded-lg p-3 border border-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-primary font-semibold text-sm flex items-center gap-2">
                      ✅ Código aplicado: <span className="font-mono">{discountCode}</span>
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="line-through text-muted-foreground">{formatCurrency(originalTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-primary font-medium">
                        <span>Descuento:</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeDiscount}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Terms & Conditions checkboxes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="mqs-acceptTerms" 
                  checked={acceptedTerms} 
                  onCheckedChange={(checked) => setAcceptedTerms(!!checked)} 
                  className="mt-1" 
                />
                <div className="flex-1">
                  <Label htmlFor="mqs-acceptTerms" className="text-sm font-medium text-blue-900 cursor-pointer">
                    Entiendo y acepto los términos y condiciones de Favorón
                  </Label>
                  <p className="text-xs text-blue-700 mt-1">
                    Al aceptar esta cotización, confirmas que has leído y aceptas nuestros términos de servicio.
                  </p>
                  <Button type="button" variant="link" className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800" onClick={() => setShowTermsModal(true)}>
                    <FileText className="h-3 w-3 mr-1" />
                    Leer términos y condiciones
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="mqs-confirmedDeliveryTime" 
                  checked={confirmedDeliveryTime} 
                  onCheckedChange={(checked) => setConfirmedDeliveryTime(!!checked)} 
                  className="mt-1" 
                />
                <div className="flex-1">
                  <Label htmlFor="mqs-confirmedDeliveryTime" className="text-sm font-medium text-blue-900 cursor-pointer">
                    He revisado que el paquete llega a tiempo a la dirección proporcionada
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky confirm button + reject */}
      {quotedAssignments.length > 0 && (
        <div className="sticky bottom-0 pt-3 pb-1 bg-background space-y-2">
          <Button
            variant="shopper"
            className="w-full"
            onClick={handleAccept}
            disabled={!canAccept}
          >
            {acceptingId ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Aceptando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Aceptar esta cotización
              </>
            )}
          </Button>

          {onRejectAllQuotes && (
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={!!acceptingId || isRejecting}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rechazando...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Rechazar y buscar más viajeros
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Reject confirmation dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar cotizaciones?</AlertDialogTitle>
            <AlertDialogDescription>
              Las cotizaciones actuales se descartarán y tu paquete volverá a buscar nuevos viajeros. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRejecting}
              onClick={async (e) => {
                e.preventDefault();
                if (!onRejectAllQuotes) return;
                setIsRejecting(true);
                try {
                  await onRejectAllQuotes();
                  setShowRejectDialog(false);
                } finally {
                  setIsRejecting(false);
                }
              }}
            >
              {isRejecting ? 'Rechazando...' : 'Sí, rechazar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TermsAndConditionsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

      <DeliveryAddressSheet
        isOpen={showAddressSheet}
        onClose={() => setShowAddressSheet(false)}
        onSave={(data) => setDeliveryAddress(data)}
        initialData={deliveryAddress || undefined}
        destinationCountry={packageDetails.package_destination_country}
        destinationCity={packageDetails.package_destination}
        userId={shopperId}
      />
    </div>
  );
};

export default MultiQuoteSelector;
