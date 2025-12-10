import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Package, MapPin, ExternalLink, X, FileText, AlertTriangle, Star, Home, Crown, Trash2, DollarSign, Calculator, Sparkles, Banknote, Gift, CheckCircle2, Plane, Phone, Edit } from "lucide-react";
import { formatDateUTC } from "@/lib/formatters";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePersistedFormState } from "@/hooks/usePersistedFormState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import PrimeModal from "./PrimeModal";
import TravelerRejectionModal from "./TravelerRejectionModal";
import QuoteCountdown from "./dashboard/QuoteCountdown";
import { REJECTION_REASONS } from "@/lib/constants";
import QuoteActionsForm from "./forms/QuoteActionsForm";
import { formatCurrency } from "@/lib/formatters";
import { calculateQuoteTotal, getPriceBreakdown, calculateServiceFee } from '@/lib/pricing';
import { createNormalizedQuote } from '@/lib/quoteHelpers';
import { supabase } from "@/integrations/supabase/client";
import './ui/mobile-input-fix.css';
import { resolveSignedUrl } from "@/lib/storageUrls";
interface QuoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quoteData: any) => void;
  packageDetails: {
    item_description: string;
    estimated_price: number;
    item_link?: string;
    deliveryAddress?: any;
    delivery_method?: string;
    quote_expires_at?: string;
    products_data?: any[];
    admin_assigned_tip?: string;
    status?: string;
    traveler_address?: any;
    additional_notes?: string;
    shopper_trust_level?: string;
    package_destination?: string;
  };
  userType: 'user' | 'admin' | 'operations';
  existingQuote?: any;
  tripDates?: {
    first_day_packages: string;
    last_day_packages: string;
    delivery_date: string;
    arrival_date: string;
  };
  tripInfo?: {
    id: string;
    from_city: string;
    from_country?: string;
    to_city: string;
    arrival_date: string;
    first_day_packages: string;
    last_day_packages: string;
    delivery_date: string;
    package_receiving_address?: any;
  };
  onEditTrip?: () => void;
}
const ResolvedImage = ({ src, alt, className, onClick }: { src: any; alt: string; className?: string; onClick?: () => void }) => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    let active = true;

    const getRawUrl = (input: any): string | null => {
      if (!input) return null;
      if (typeof input === 'string') return input;
      if (typeof input === 'object') {
        if (input.filePath && input.bucket) return `${input.bucket}/${input.filePath}`;
        if (input.filePath) return input.filePath;
        if (input.url) return input.url;
        if (input.image_url?.url) return input.image_url.url;
      }
      return null;
    };

    (async () => {
      const raw = getRawUrl(src);
      if (!raw) return;
      setUrl(raw);
      const resolved = await resolveSignedUrl(raw);
      if (active && resolved) setUrl(resolved);
    })();

    return () => { active = false; };
  }, [src]);

  if (!url) return null;

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      onClick={onClick}
    />
  );
};

const QuoteDialog = ({
  isOpen,
  onClose,
  onSubmit,
  packageDetails,
  userType,
  existingQuote,
  tripDates,
  tripInfo,
  onEditTrip
}: QuoteDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [imageModalState, setImageModalState] = useState<{ isOpen: boolean; imageUrl: string; title: string }>({
    isOpen: false,
    imageUrl: '',
    title: ''
  });
  
  // Create unique storage key based on package details
  const getPackageId = () => {
    return `${packageDetails.item_description}_${packageDetails.estimated_price}_${userType}`;
  };

  // Persisted form state
  const {
    state: formState,
    setState: setFormState,
    clearPersistedState
  } = usePersistedFormState({
    key: `quote_form_${getPackageId()}`,
    initialState: {
      price: existingQuote?.price || '',
      message: '',
      rejectionReason: '',
      wantsRequote: false,
      additionalComments: '',
      acceptedTerms: false,
      confirmedDeliveryTime: false,
      discountCode: '',
      discountAmount: 0,
      discountCodeId: '',
      originalTotal: 0,
      finalTotal: 0
    },
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    encrypt: true // Encrypt since this contains financial data
  });

  // Local state for UI components that don't need persistence
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrimeModal, setShowPrimeModal] = useState(false);
  const [showTravelerRejectionModal, setShowTravelerRejectionModal] = useState(false);
  const [showTripConfirmation, setShowTripConfirmation] = useState(false);
  
  // Selected products state for multi-product orders (shoppers can remove products)
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  
  // Initialize selected products when modal opens
  useEffect(() => {
    if (isOpen && packageDetails.products_data && Array.isArray(packageDetails.products_data)) {
      setSelectedProducts([...packageDetails.products_data]);
    }
  }, [isOpen, packageDetails.products_data]);
  
  // Discount code validation state
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountSuccess, setDiscountSuccess] = useState(false);
  
  // Mobile detection and input control
  const isMobile = useIsMobile();
  const [mobileInputsReady, setMobileInputsReady] = useState(false);

  // Destructure form state for easier access with safe defaults
  const { 
    price, 
    message, 
    rejectionReason, 
    wantsRequote, 
    additionalComments, 
    acceptedTerms, 
    confirmedDeliveryTime, 
    discountCode = '', 
    discountAmount = 0, 
    discountCodeId = '', 
    originalTotal = 0, 
    finalTotal = 0 
  } = formState;

  // Helper functions to update form state
  const updateFormField = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  // Validate discount code
  const validateDiscountCode = async () => {
    if (!discountCode || !discountCode.trim()) return;
    
    setIsValidatingCode(true);
    setDiscountError(null);
    setDiscountSuccess(false);
    
    try {
      const baseTotal = displayAmount || 0;
      
      const { data, error } = await supabase.rpc('validate_discount_code', {
        _code: discountCode.trim().toUpperCase(),
        _order_amount: baseTotal,
        _user_id: profile?.id
      });
      
      if (error) throw error;
      
      const result = data as any;
      
      if (result?.valid) {
        // Apply discount
        const discount = result.calculatedDiscount;
        const newTotal = Math.max(0, baseTotal - discount);
        
        updateFormField('discountAmount', discount);
        updateFormField('discountCodeId', result.discountCodeId);
        updateFormField('originalTotal', baseTotal);
        updateFormField('finalTotal', newTotal);
        setDiscountSuccess(true);
        
        toast({
          title: "¡Código aplicado!",
          description: `Descuento de ${formatCurrency(discount)} aplicado correctamente.`,
        });
      } else {
        setDiscountError(result?.error || 'Código inválido');
      }
    } catch (error: any) {
      console.error('Error validating discount code:', error);
      setDiscountError('Error al validar el código. Intenta de nuevo.');
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Remove discount
  const removeDiscount = () => {
    updateFormField('discountCode', '');
    updateFormField('discountAmount', 0);
    updateFormField('discountCodeId', '');
    updateFormField('originalTotal', 0);
    updateFormField('finalTotal', 0);
    setDiscountSuccess(false);
    setDiscountError(null);
  };

  // Clear persisted state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      // Clear state when modal is closed unless form has content
      const hasContent = formState.price || formState.message || formState.acceptedTerms;
      if (!hasContent) {
        clearPersistedState();
      }
      // Reset mobile inputs ready state when modal closes
      setMobileInputsReady(false);
    } else if (isOpen && isMobile) {
      // Delay input focus availability on mobile to prevent auto-keyboard
      const timer = setTimeout(() => {
        setMobileInputsReady(true);
      }, 300); // Small delay to prevent immediate focus
      return () => clearTimeout(timer);
    } else if (isOpen && !isMobile) {
      // Desktop can focus immediately
      setMobileInputsReady(true);
    }
  }, [isOpen, formState.price, formState.message, formState.acceptedTerms, clearPersistedState, isMobile]);
  const isQuoteExpired = packageDetails.quote_expires_at && new Date(packageDetails.quote_expires_at) < new Date();
  console.log('🔍 Quote Debug Info:', {
    quote_expires_at: packageDetails.quote_expires_at,
    currentDate: new Date().toISOString(),
    isQuoteExpired,
    acceptedTerms,
    userType,
    buttonDisabled: userType === 'user' && !acceptedTerms || isQuoteExpired
  });

  // Check if shopper is viewing a quote (not traveler context)
  const isShopperContext = existingQuote && userType === 'user' && packageDetails.status !== 'matched';
  
  // Get admin tip amount - use selectedProducts for shoppers, products_data otherwise
  const getTipAmount = () => {
    // For shoppers, use selectedProducts (which may have items removed)
    const productsToUse = isShopperContext && selectedProducts.length > 0 
      ? selectedProducts 
      : packageDetails.products_data;
    
    if (productsToUse && Array.isArray(productsToUse) && productsToUse.length > 0) {
      const totalTip = productsToUse.reduce((sum: number, product: any) => {
        return sum + parseFloat(product.adminAssignedTip || '0');
      }, 0);
      return totalTip > 0 ? totalTip : null;
    }
    // Fallback to admin_assigned_tip for backward compatibility
    const fallbackTip = parseFloat(packageDetails.admin_assigned_tip || '0');
    return fallbackTip > 0 ? fallbackTip : null;
  };
  
  // Calculate subtotal for a single product (tip + service fee)
  const calculateProductSubtotal = (product: any): number => {
    const tip = parseFloat(product.adminAssignedTip || '0');
    const serviceFee = calculateServiceFee(tip, packageDetails.shopper_trust_level);
    return tip + serviceFee;
  };
  
  // Calculate total from selected products with delivery fee
  const calculateSelectedProductsTotal = (): number => {
    if (selectedProducts.length === 0) return 0;
    const totalTip = selectedProducts.reduce((sum, p) => sum + parseFloat(p.adminAssignedTip || '0'), 0);
    const breakdown = getPriceBreakdown(totalTip, packageDetails.delivery_method, packageDetails.shopper_trust_level, packageDetails.package_destination);
    return breakdown.totalPrice;
  };
  
  // Remove a product from selection (minimum 1 product required)
  const removeProduct = (indexToRemove: number) => {
    if (selectedProducts.length <= 1) return;
    setSelectedProducts(prev => prev.filter((_, i) => i !== indexToRemove));
    // Clear any applied discount when products change
    if (discountSuccess) {
      removeDiscount();
    }
  };
  
  const adminTipAmount = getTipAmount();

  // Check if this is a matched package with admin assigned tip (traveler needs to accept/reject)
  const isAdminAssignedTip = packageDetails.status === 'matched' && (packageDetails.admin_assigned_tip || adminTipAmount) && userType === 'user';

  // Determine if this is a traveler viewing admin assigned tip or shopper viewing quote
  const isTravelerContext = isAdminAssignedTip;
  const isShopperViewingQuote = existingQuote && userType === 'user' && !isTravelerContext;

  // Get display amount based on context
  const getDisplayAmount = () => {
    if (!adminTipAmount && !existingQuote) return null;
    if (isTravelerContext) {
      // Traveler sees base tip amount
      return adminTipAmount;
    }
    if (isShopperViewingQuote && existingQuote) {
      // Shopper sees quote total recalculated with shopper trust level
      const base = parseFloat(existingQuote.price || String(adminTipAmount || '0')) || 0;
      return calculateQuoteTotal(base, packageDetails.delivery_method, packageDetails.shopper_trust_level, packageDetails.package_destination);
    }
    if (adminTipAmount && isShopperViewingQuote) {
      // If shopper is viewing admin assigned tip as quote, calculate total using centralized logic
      return calculateQuoteTotal(adminTipAmount, packageDetails.delivery_method, packageDetails.shopper_trust_level, packageDetails.package_destination);
    }
    return adminTipAmount;
  };
  const displayAmount = getDisplayAmount();
  const handleSubmit = () => {
    if (existingQuote) {
      if (isQuoteExpired) {
        return; // Prevent submission if quote is expired
      }
      clearPersistedState(); // Clear form data on successful submission
      
      // Include discount data if applied
      const submitData: any = {
        message: 'accepted'
      };
      
      if (discountSuccess && discountCodeId) {
        submitData.discountCode = discountCode;
        submitData.discountCodeId = discountCodeId;
        submitData.discountAmount = discountAmount;
        submitData.originalTotalPrice = originalTotal;
        submitData.finalTotalPrice = finalTotal;
      }
      
      // Check if shopper removed any products
      const originalProducts = packageDetails.products_data || [];
      if (originalProducts.length > 1 && selectedProducts.length < originalProducts.length) {
        const removedProducts = originalProducts.filter(
          (p: any) => !selectedProducts.some((sp: any) => 
            sp.itemDescription === p.itemDescription && sp.estimatedPrice === p.estimatedPrice
          )
        );
        
        submitData.updatedProducts = selectedProducts;
        submitData.removedProducts = removedProducts.map((p: any) => p.itemDescription || 'Producto sin nombre');
        
        // Recalculate quote with remaining products
        const newTotalTip = selectedProducts.reduce((sum: number, p: any) => 
          sum + parseFloat(p.adminAssignedTip || '0'), 0
        );
        const recalculatedQuote = createNormalizedQuote(
          newTotalTip,
          packageDetails.delivery_method,
          packageDetails.shopper_trust_level,
          existingQuote.message,
          true,
          packageDetails.package_destination
        );
        submitData.recalculatedQuote = recalculatedQuote;
        
        // Update final total if discount was applied
        if (submitData.finalTotalPrice) {
          submitData.originalTotalPrice = recalculatedQuote.totalPrice;
          submitData.finalTotalPrice = Math.max(0, recalculatedQuote.totalPrice - discountAmount);
        }
      }
      
      onSubmit(submitData);
    } else if (isAdminAssignedTip) {
      // Traveler accepting admin assigned tip - show trip confirmation first if tripInfo available
      if (tripInfo && !showTripConfirmation) {
        setShowTripConfirmation(true);
        return;
      }
      
      const basePrice = parseFloat(packageDetails.admin_assigned_tip);
      const normalizedQuote = createNormalizedQuote(
        basePrice, 
        packageDetails.delivery_method, 
        packageDetails.shopper_trust_level,
        message || '',
        true,
        packageDetails.package_destination
      );
      
      clearPersistedState(); // Clear form data on successful submission
      setShowTripConfirmation(false);
      onSubmit(normalizedQuote);
    } else {
      const basePrice = parseFloat(price);
      const shopperTrustLevel = packageDetails.shopper_trust_level;
      const normalizedQuote = createNormalizedQuote(
        basePrice,
        packageDetails.delivery_method,
        shopperTrustLevel,
        message,
        undefined,
        packageDetails.package_destination
      );
      
      // Logging for verification
      console.log('🔍 Quote calculation:', {
        basePrice,
        shopperTrustLevel,
        serviceFee: normalizedQuote.serviceFee,
        totalPrice: normalizedQuote.totalPrice
      });
      
      clearPersistedState(); // Clear form data on successful submission
      onSubmit(normalizedQuote);
    }
  };
  const handleReject = () => {
    // Only show rejection form for shoppers rejecting quotes, not for travelers rejecting admin tips
    if (existingQuote && !rejectionReason) {
      setShowRejectionForm(true);
      return;
    }

    // For travelers rejecting admin-assigned tips, show the traveler rejection modal
    if (isTravelerContext) {
      setShowTravelerRejectionModal(true);
      return;
    }

    // For admin-assigned tips, travelers can reject directly without justification (fallback)
    clearPersistedState(); // Clear form data on successful rejection
    onSubmit({
      message: 'rejected',
      rejectionReason: existingQuote ? rejectionReason : undefined,
      wantsRequote: existingQuote ? wantsRequote : undefined,
      additionalNotes: existingQuote ? additionalComments : undefined
    });
  };

  const handleTravelerRejectionConfirm = (reason: string, comments: string) => {
    clearPersistedState();
    onSubmit({
      message: 'rejected',
      rejectionReason: reason || undefined,
      additionalNotes: comments || undefined
    });
    setShowTravelerRejectionModal(false);
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[85vh] m-2 p-3 rounded-lg' : 'sm:max-w-2xl max-w-[98vw] max-h-[92vh] m-1 sm:m-4'} overflow-y-auto p-4 sm:p-6`}>

        <DialogHeader className="pr-12">
          {isTravelerContext ? (
            <div>
              <DialogTitle className="text-lg font-bold text-left bg-gradient-to-r from-success to-emerald-600 bg-clip-text text-transparent">
                Tip Asignado
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground text-left">
                Revisa y decide si aceptas
              </DialogDescription>
            </div>
          ) : (
            <>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-left">
                {!existingQuote ? '💰 Enviar Cotización' : '✅ Responder Cotización'}
              </DialogTitle>
              <DialogDescription className="text-base sm:text-sm text-muted-foreground leading-relaxed text-left">
                {!existingQuote ? 'Proporciona tu mejor cotización para este Favorón' : 'Revisa los detalles y responde a la cotización del viajero'}
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 overflow-x-hidden">{/* Force no horizontal overflow */}
          
          {/* TRIP CONFIRMATION STEP - For travelers confirming their trip info */}
          {isTravelerContext && showTripConfirmation && tripInfo ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Plane className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Confirma tu información de viaje</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Verifica que estos datos sean correctos antes de enviar la cotización
                </p>
              </div>
              
              {/* Route */}
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">{tripInfo.from_country || tripInfo.from_city}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold text-foreground">{tripInfo.to_city}</span>
                </div>
              </div>
              
              {/* Dates */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-muted/40">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Fechas del viaje</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Llegada:</span>
                    <span className="font-medium text-foreground">{formatDateUTC(tripInfo.arrival_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recibo paquetes:</span>
                    <span className="font-medium text-foreground">
                      {formatDateUTC(tripInfo.first_day_packages)} - {formatDateUTC(tripInfo.last_day_packages)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entrega en oficina:</span>
                    <span className="font-medium text-foreground">{formatDateUTC(tripInfo.delivery_date)}</span>
                  </div>
                </div>
              </div>
              
              {/* Delivery Address */}
              {tripInfo.package_receiving_address && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-2 border border-muted/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">Dirección de recepción de paquetes</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {tripInfo.package_receiving_address.recipientName && (
                      <p className="font-semibold text-foreground">{tripInfo.package_receiving_address.recipientName}</p>
                    )}
                    {tripInfo.package_receiving_address.streetAddress && (
                      <p className="text-muted-foreground">{tripInfo.package_receiving_address.streetAddress}</p>
                    )}
                    {tripInfo.package_receiving_address.streetAddress2 && (
                      <p className="text-muted-foreground">{tripInfo.package_receiving_address.streetAddress2}</p>
                    )}
                    {tripInfo.package_receiving_address.cityArea && (
                      <p className="text-muted-foreground">{tripInfo.package_receiving_address.cityArea}</p>
                    )}
                    {tripInfo.package_receiving_address.postalCode && (
                      <p className="text-muted-foreground">CP: {tripInfo.package_receiving_address.postalCode}</p>
                    )}
                    {tripInfo.package_receiving_address.hotelAirbnbName && (
                      <p className="text-muted-foreground">🏨 {tripInfo.package_receiving_address.hotelAirbnbName}</p>
                    )}
                    {tripInfo.package_receiving_address.contactNumber && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{tripInfo.package_receiving_address.contactNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowTripConfirmation(false);
                    onClose();
                    onEditTrip?.();
                  }}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar viaje
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-success via-emerald-500 to-green-600 hover:from-success/90 hover:via-emerald-500/90 hover:to-green-600/90 text-white shadow-lg shadow-success/25"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar y enviar
                </Button>
              </div>
            </div>
          ) : (
          <>
          {/* COMPACT HERO TIP CARD - Only for travelers */}
          {isTravelerContext && displayAmount && (
            <div className="rounded-xl bg-gradient-to-r from-success/10 via-emerald-50/80 to-green-50/60 dark:from-success/20 dark:via-emerald-900/20 dark:to-green-900/10 border border-success/30 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Tu tip por llevarte este paquete</span>
                    <p className="text-2xl font-bold bg-gradient-to-r from-success to-emerald-600 bg-clip-text text-transparent">
                      Q{displayAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Package Details - Clear product view for travelers, detailed for shoppers */}
          <div className={`${isTravelerContext ? 'bg-muted/30 border border-muted/40' : 'bg-muted/50 border'} rounded-lg p-4 max-w-full`}>
            {isTravelerContext ? (
              /* Clear structured view for travelers */
              <div className="space-y-3">
                {/* Section Header */}
                <div className="flex items-center gap-2 pb-2 border-b border-muted/40">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Producto solicitado</span>
                </div>

                {packageDetails.products_data && Array.isArray(packageDetails.products_data) && packageDetails.products_data.length > 0 ? (
                  <div className="space-y-3">
                    {packageDetails.products_data.map((product: any, index: number) => {
                      const quantity = parseInt(product.quantity || '1');
                      const unitPrice = parseFloat(product.estimatedPrice || '0');
                      const isPersonalOrder = product.requestType === 'personal';
                      const productLink = product.itemLink || packageDetails.item_link;
                      
                      return (
                        <div key={index} className="bg-background/60 rounded-lg p-3 border border-muted/30">
                          {/* Product Name */}
                          <div className="flex items-start gap-2 mb-2">
                            <h4 className="text-base font-semibold text-foreground leading-snug flex-1">
                              {product.itemDescription || packageDetails.item_description}
                            </h4>
                            {isPersonalOrder && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 shrink-0">Personal</Badge>
                            )}
                          </div>
                          
                          {/* Price and Quantity */}
                          <p className="text-sm text-muted-foreground mb-2">
                            ${unitPrice.toFixed(2)} USD × {quantity} {quantity === 1 ? 'unidad' : 'unidades'}
                          </p>
                          
                          {/* Tip asignado para este producto */}
                          {product.adminAssignedTip && (
                            <div className="flex items-center gap-1.5 mb-3 text-sm">
                              <Gift className="h-4 w-4 text-emerald-600" />
                              <span className="text-gray-500">Tu tip por este producto:</span>
                              <span className="font-bold text-emerald-600">
                                Q{parseFloat(product.adminAssignedTip).toFixed(2)}
                              </span>
                            </div>
                          )}
                          
                          {/* Product Link Button */}
                          {productLink && (
                            <a 
                              href={productLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Ver producto en tienda
                              <span className="text-primary/70">→</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-background/60 rounded-lg p-3 border border-muted/30">
                    {/* Product Name */}
                    <h4 className="text-base font-semibold text-foreground leading-snug mb-2">
                      {packageDetails.item_description}
                    </h4>
                    
                    {/* Price and Quantity */}
                    <p className="text-sm text-muted-foreground mb-3">
                      ${packageDetails.estimated_price} USD × 1 unidad
                    </p>
                    
                    {/* Product Link Button */}
                    {packageDetails.item_link && (
                      <a 
                        href={packageDetails.item_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ver producto en tienda
                        <span className="text-primary/70">→</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Additional Notes */}
                {packageDetails.additional_notes && (
                  <p className="text-xs text-muted-foreground italic mt-2 px-1">
                    📝 {packageDetails.additional_notes}
                  </p>
                )}
              </div>
            ) : (
            /* Detailed view for shoppers - UNIFIED: Product details + Quote per product */
              <>
                {/* Show unified section for multi-product with existing quote */}
                {selectedProducts.length > 1 && existingQuote ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-5 w-5 text-green-700" />
                      <p className="text-base font-semibold text-green-800">Tu Pedido</p>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        {selectedProducts.length} productos
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedProducts.map((product: any, index: number) => {
                        const quantity = parseInt(product.quantity || '1');
                        const unitPrice = parseFloat(product.estimatedPrice || '0');
                        const tip = parseFloat(product.adminAssignedTip || '0');
                        const serviceFee = calculateServiceFee(tip, packageDetails.shopper_trust_level);
                        const subtotal = tip + serviceFee;
                        const canRemove = selectedProducts.length > 1;
                        const productLink = product.itemLink || packageDetails.item_link;
                        
                        return (
                          <div key={index} className="bg-white/90 border border-green-200 rounded-lg p-3 relative">
                            {/* Header: number + name + delete */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="flex items-center justify-center w-6 h-6 rounded bg-green-100 text-green-700 font-bold text-xs shrink-0">
                                  {index + 1}
                                </span>
                                <p className="font-medium text-green-800 text-sm truncate">
                                  {product.itemDescription || `Producto ${index + 1}`}
                                </p>
                              </div>
                              {canRemove && (
                                <button
                                  onClick={() => removeProduct(index)}
                                  className="p-1 rounded-full hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors shrink-0"
                                  title="Eliminar producto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            
                            {/* Price USD + quantity + link */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              <span>${unitPrice.toFixed(2)} × {quantity}</span>
                              {productLink && (
                                <a 
                                  href={productLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Ver en tienda
                                </a>
                              )}
                            </div>
                            
                            {/* Separator */}
                            <div className="border-t border-green-200 my-2" />
                            
                            {/* Subtotal in Quetzales */}
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-green-700">Subtotal a pagar:</span>
                              <span className="font-semibold text-green-800">{formatCurrency(subtotal)}</span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Footer totals */}
                      <div className="bg-green-100/50 border border-green-200 rounded-lg p-3 mt-2 space-y-2">
                        
                        {/* Delivery fee (if applicable) */}
                        {packageDetails.delivery_method === 'delivery' && (
                          <div className="flex justify-between text-sm text-green-700">
                            <span>🚚 Entrega a domicilio:</span>
                            <span>{formatCurrency(getPriceBreakdown(0, 'delivery', packageDetails.shopper_trust_level, packageDetails.package_destination).deliveryFee)}</span>
                          </div>
                        )}
                        
                        {/* Total to pay */}
                        <div className="flex justify-between font-bold text-lg text-green-800 pt-2 border-t border-green-300">
                          <span>💰 TOTAL A PAGAR:</span>
                          <span>{formatCurrency(calculateSelectedProductsTotal())}</span>
                        </div>
                      </div>
                      
                      {/* Warning note */}
                      <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded p-2">
                        ⚠️ Tú eres el encargado de hacer la compra. La cotización no incluye el precio de tus productos.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Original detailed view for single product or no quote */
                  <>
                    <div className="flex items-start space-x-2 mb-2">
                      <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-base sm:text-sm font-semibold text-foreground">Detalles del Producto</p>
                    </div>
                    <div className="text-sm ml-4 sm:ml-7 space-y-3 overflow-x-hidden">
                      <div className="bg-background/80 rounded-lg p-3 space-y-4 max-w-full overflow-hidden">
                        <div>
                          <p className="font-medium text-foreground mb-2">
                            <strong>{packageDetails.products_data?.[0]?.requestType === 'personal' ? 'Pedido:' : 'Producto:'}</strong>
                          </p>
                          <p className="text-foreground leading-relaxed">{packageDetails.item_description}</p>
                        </div>

                        <div>
                          <p className="font-medium text-foreground mb-3"><strong>Información del producto:</strong></p>
                          {packageDetails.products_data && Array.isArray(packageDetails.products_data) && packageDetails.products_data.length > 0 ? (
                            <div className="space-y-4">
                              {packageDetails.products_data.map((product: any, index: number) => {
                                const quantity = parseInt(product.quantity || '1');
                                const unitPrice = parseFloat(product.estimatedPrice || '0');
                                const totalPrice = quantity * unitPrice;
                                const isPersonalOrder = product.requestType === 'personal';
                                
                                return (
                                  <div 
                                    key={index} 
                                    className="group relative bg-gradient-to-br from-background to-muted/20 border border-muted/50 rounded-lg overflow-hidden shadow-sm hover:shadow hover:border-primary/20 transition-all duration-200"
                                  >
                                    <div className="flex items-center gap-2 px-3 py-2 border-b border-muted/30 bg-muted/10">
                                      <span className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary font-bold text-xs shrink-0">
                                        {index + 1}
                                      </span>
                                      {isPersonalOrder && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                                          Personal
                                        </Badge>
                                      )}
                                      <p className="text-sm font-medium text-foreground truncate flex-1">
                                        {product.itemDescription || `Producto ${index + 1}`}
                                      </p>
                                    </div>
                                    
                                    <div className="px-3 py-2">
                                      {isPersonalOrder ? (
                                        <div className="space-y-2">
                                          {product.instructions && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{product.instructions}</p>
                                          )}
                                          <div className="flex items-center gap-3 text-xs">
                                            {product.weight && (
                                              <span className="text-muted-foreground">Peso: <span className="text-foreground font-medium">{product.weight}kg</span></span>
                                            )}
                                            <span className="text-muted-foreground">Precio: <span className="text-foreground font-medium">${unitPrice.toFixed(2)}</span></span>
                                          </div>
                                          {product.productPhotos && product.productPhotos.length > 0 && (
                                            <div className="flex gap-1">
                                              {product.productPhotos.slice(0, 4).map((photo: any, photoIndex: number) => (
                                                <ResolvedImage 
                                                  key={photoIndex}
                                                  src={photo}
                                                  alt={`Foto ${photoIndex + 1}`}
                                                  className="w-10 h-10 object-cover rounded border border-muted/40 cursor-pointer hover:border-primary/50 transition-colors"
                                                  onClick={() => {
                                                    const getRawUrl = (input: any): string | null => {
                                                      if (!input) return null;
                                                      if (typeof input === 'string') return input;
                                                      if (typeof input === 'object') {
                                                        if (input.filePath && input.bucket) return `${input.bucket}/${input.filePath}`;
                                                        if (input.filePath) return input.filePath;
                                                        if (input.url) return input.url;
                                                      }
                                                      return null;
                                                    };
                                                    const url = getRawUrl(photo);
                                                    if (url) {
                                                      setImageModalState({
                                                        isOpen: true,
                                                        imageUrl: url,
                                                        title: `Foto ${photoIndex + 1} del producto`
                                                      });
                                                    }
                                                  }}
                                                />
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-3 text-xs">
                                            <span className="text-muted-foreground">${unitPrice.toFixed(2)} × {quantity}</span>
                                            {(product.itemLink || packageDetails.item_link) && (
                                              <a 
                                                href={product.itemLink || packageDetails.item_link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                                              >
                                                <ExternalLink className="h-3 w-3" />
                                                Ver en tienda
                                              </a>
                                            )}
                                          </div>
                                          <span className="text-sm font-semibold text-foreground">${totalPrice.toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {packageDetails.products_data.length > 1 && (
                                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mt-1">
                                  <span className="text-sm text-muted-foreground">Total del pedido</span>
                                  <span className="text-base font-bold text-primary">
                                    ${packageDetails.products_data.reduce((sum: number, product: any) => {
                                      const quantity = parseInt(product.quantity || '1');
                                      const unitPrice = parseFloat(product.estimatedPrice || '0');
                                      return sum + quantity * unitPrice;
                                    }, 0).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-foreground">
                                <p><strong>Precio unitario:</strong> ${packageDetails.estimated_price}</p>
                                <p><strong>Cantidad:</strong> 1 unidad</p>
                                {packageDetails.item_link && (
                                  <a 
                                    href={packageDetails.item_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-2"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Ver en tienda
                                  </a>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">${packageDetails.estimated_price}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {packageDetails.additional_notes && (
                          <div>
                            <p className="font-medium text-foreground mb-2"><strong>Notas adicionales:</strong></p>
                            <p className="text-foreground leading-relaxed">{packageDetails.additional_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* UNIFIED IMPORTANT INFO - Show for shoppers viewing quotes */}
          {existingQuote && tripDates && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 shadow-md">
              <div className="flex items-start space-x-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 animate-pulse" />
                <p className="text-sm font-medium text-amber-800">📋 Información importante previo a aceptar cotización</p>
              </div>
              <div className="text-sm text-amber-700 ml-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span><strong>Ventana de recepción:</strong> {(() => {
                    const dateFirst = new Date(tripDates.first_day_packages);
                    const dateLast = new Date(tripDates.last_day_packages);
                    return `${new Date(dateFirst.getUTCFullYear(), dateFirst.getUTCMonth(), dateFirst.getUTCDate()).toLocaleDateString('es-GT')} - ${new Date(dateLast.getUTCFullYear(), dateLast.getUTCMonth(), dateLast.getUTCDate()).toLocaleDateString('es-GT')}`;
                  })()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span><strong>Fecha de entrega del paquete:</strong> {(() => {
                    const addBusinessDays = (date: Date, days: number) => {
                      const result = new Date(date);
                      let addedDays = 0;
                      while (addedDays < days) {
                        result.setDate(result.getDate() + 1);
                        // Skip weekends (0 = Sunday, 6 = Saturday)
                        if (result.getDay() !== 0 && result.getDay() !== 6) {
                          addedDays++;
                        }
                      }
                      return result;
                    };
                    const packageDeliveryDate = addBusinessDays(new Date(tripDates.delivery_date), 2);
                    return packageDeliveryDate.toLocaleDateString('es-GT');
                  })()}</span>
                </div>
                
                {/* Traveler location info if available */}
                {userType === 'user' && !isTravelerContext && packageDetails.traveler_address?.streetAddress && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Home className="h-3 w-3" />
                      <span className="text-red-600 font-semibold"><strong>Dirección #1:</strong> {packageDetails.traveler_address.streetAddress}{packageDetails.traveler_address.city && `, ${packageDetails.traveler_address.city}`}{packageDetails.traveler_address.state && `, ${packageDetails.traveler_address.state}`}</span>
                    </div>
                    {packageDetails.traveler_address?.cityArea && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3" />
                        <span className="text-red-600 font-semibold"><strong>Ciudad/Estado:</strong> {packageDetails.traveler_address.cityArea}</span>
                      </div>
                    )}
                    {(packageDetails.traveler_address?.postalCode || existingQuote?.traveler_postal_code) && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3" />
                        <span><strong>Código postal:</strong> {packageDetails.traveler_address?.postalCode || existingQuote?.traveler_postal_code}</span>
                      </div>
                    )}
                  </>
                )}
                
                <div className="bg-amber-100 border border-amber-300 rounded p-3 mt-3">
                  <p className="text-xs text-amber-800 font-medium space-y-1">
                    
                    {userType === 'user' && !isTravelerContext && packageDetails.traveler_address?.streetAddress && (
                      <span className="block">⚠️ <strong>IMPORTANTE:</strong> Esta es información parcial del viajero. La dirección completa y datos del destinatario se proporcionarán después de confirmar el pago.</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Existing Quote Display */}
          {existingQuote && <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 space-y-1">
                  {/* Traveler's message */}
                  {existingQuote.message && (
                    <div className="mb-3 pb-2 border-b border-green-300">
                      <p className="font-medium text-green-800 mb-1">💬 Mensaje del viajero:</p>
                      <p className="text-green-700 italic bg-green-100 rounded p-2">"{existingQuote.message}"</p>
                    </div>
                  )}
                  
                  
                  {/* Single product or standard breakdown */}
                  {(selectedProducts.length <= 1 || userType !== 'user') && (
                    <div className="mt-2 pt-2 border-t border-green-300">
                       <p className="font-medium text-lg">
                         {(() => {
                      const base = parseFloat(existingQuote.price || String(adminTipAmount || '0')) || 0;
                      const breakdown = getPriceBreakdown(base, packageDetails.delivery_method, packageDetails.shopper_trust_level, packageDetails.package_destination);
                      return (
                        <>
                          <strong>Total a pagar:</strong> {formatCurrency(breakdown.totalPrice)}
                             </>
                           );
                         })()}
                       </p>
                      <p className="text-xs text-green-600 mt-1">
                        Este precio incluye todos los servicios: plataforma Favorón, seguro y compensación del viajero.
                        {packageDetails.delivery_method === 'delivery' && ' Incluye costo de envío a domicilio.'}
                      </p>
                       <p className="text-xs text-red-600 mt-1 font-medium">
                         Tú eres el encargado de hacer la compra del producto y la cotización no incluye el precio de tu producto.
                       </p>
                       
                       {/* Price Breakdown */}
                       <div className="mt-3 pt-2 border-t border-green-200">
                         <p className="text-sm font-medium text-green-700 mb-2">📋 Desglose de factura:</p>
                          <div className="space-y-1 text-sm text-green-700">
                             {(() => {
                               const base = parseFloat(existingQuote.price || String(adminTipAmount || '0')) || 0;
                               const breakdown = getPriceBreakdown(base, packageDetails.delivery_method, packageDetails.shopper_trust_level, packageDetails.package_destination);
                               const isPrime = packageDetails.shopper_trust_level === 'prime';
                               
                                // Calculate standard pricing (40% fee) to show original price
                                const standardBreakdown = getPriceBreakdown(
                                  base, 
                                  packageDetails.delivery_method, 
                                  'basic',
                                  packageDetails.package_destination
                                );
                               
                                 return (
                                   <>
                                      {isPrime ? (
                                        <>
                                          <div className="flex justify-between font-medium">
                                            <span>Precio total estándar:</span>
                                            <span>{formatCurrency(standardBreakdown.totalPrice)}</span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="ml-3">• Favorón:</span>
                                            <span>{formatCurrency(base + standardBreakdown.serviceFee)}</span>
                                          </div>
                                          {packageDetails.delivery_method === 'delivery' && (
                                            <div className="flex justify-between text-sm">
                                              <span className="ml-3">• Envío a domicilio:</span>
                                              <span>{formatCurrency(standardBreakdown.deliveryFee)}</span>
                                            </div>
                                          )}
                                          <div className="flex justify-between text-prime font-medium">
                                            <span>Descuento Prime:</span>
                                            <span>-{formatCurrency(standardBreakdown.totalPrice - breakdown.totalPrice)}</span>
                                          </div>
                                          <div className="flex justify-between pt-2 border-t border-green-200 font-bold text-lg">
                                            <span>Total a pagar:</span>
                                            <span>{formatCurrency(breakdown.totalPrice)}</span>
                                          </div>
                                        </>
                                      ) : (
                                          <>
                                            {packageDetails.delivery_method === 'delivery' && !breakdown.isPrime && (
                                              <div className="flex justify-between">
                                                <span>Entrega a domicilio:</span>
                                                <span>{formatCurrency(breakdown.deliveryFee)}</span>
                                              </div>
                                            )}
                                            {packageDetails.delivery_method === 'delivery' && breakdown.isPrime && (
                                              <div className="flex justify-between">
                                                <span>Entrega a domicilio:</span>
                                                <span className="text-green-600">Gratis (Prime)</span>
                                              </div>
                                            )}
                                           <div className="flex justify-between pt-2 border-t border-green-200 font-medium">
                                             <span>Total:</span>
                                             <span>{formatCurrency(breakdown.totalPrice)}</span>
                                           </div>
                                           {/* Prime savings message for non-Prime users */}
                                           {!breakdown.isPrime && (() => {
                                             const primeBreakdown = getPriceBreakdown(base, packageDetails.delivery_method, 'prime', packageDetails.package_destination);
                                             const savings = breakdown.totalPrice - primeBreakdown.totalPrice;
                                             return savings > 0 ? (
                                               <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                 <div className="flex items-center justify-between gap-3">
                                                   <div>
                                                     <p className="text-sm text-purple-800">
                                                       <span className="font-semibold">⭐ Con Prime ahorrarías:</span>{" "}
                                                       <span className="font-bold text-purple-900">{formatCurrency(savings)}</span>
                                                     </p>
                                                     <p className="text-xs text-purple-700 mt-1">
                                                       Los usuarios Prime pagan menores comisiones y envío gratis.
                                                     </p>
                                                   </div>
                                                   <Button
                                                     onClick={() => setShowPrimeModal(true)}
                                                     size="sm"
                                                     className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                                                   >
                                                     <Crown className="w-4 h-4 mr-2" />
                                                     Obtener Prime
                                                   </Button>
                                                 </div>
                                               </div>
                                             ) : null;
                                           })()}
                                         </>
                                     )}
                                  </>
                                );
                            })()}
                          </div>
                        </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Discount Code Section - Only for shoppers accepting quotes */}
              {existingQuote && userType === 'user' && !isQuoteExpired && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-lg p-4 shadow-sm">
                  <Label className="text-sm font-semibold text-amber-900 mb-2 block">
                    💳 ¿Tienes un código de descuento?
                  </Label>
                  
                  {!discountSuccess ? (
                    <>
                      <div className="flex gap-2 mt-2">
                        <Input 
                          placeholder="Ingresa tu código"
                          value={discountCode}
                          onChange={(e) => {
                            updateFormField('discountCode', e.target.value.toUpperCase());
                            setDiscountError(null);
                          }}
                          className="flex-1 uppercase font-mono"
                          disabled={isValidatingCode}
                        />
                        <Button 
                          onClick={validateDiscountCode} 
                          disabled={!discountCode.trim() || isValidatingCode}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          {isValidatingCode ? 'Validando...' : 'Aplicar'}
                        </Button>
                      </div>
                      {discountError && (
                        <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          {discountError}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="mt-2 bg-white/80 rounded-lg p-3 border border-green-300">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-green-700 font-semibold text-sm flex items-center gap-2">
                            ✅ Código aplicado: <span className="font-mono">{discountCode}</span>
                          </p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total original:</span>
                              <span className="line-through text-muted-foreground">{formatCurrency(originalTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600 font-medium">
                              <span>Descuento:</span>
                              <span>-{formatCurrency(discountAmount)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-green-700 pt-2 border-t">
                              <span>Nuevo total:</span>
                              <span>{formatCurrency(finalTotal)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeDiscount}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Live countdown for shoppers viewing quotes */}
              {packageDetails.quote_expires_at && userType === 'user' && ['quote_sent', 'quote_accepted', 'payment_pending'].includes(packageDetails.status) && <QuoteCountdown expiresAt={packageDetails.quote_expires_at} onExpire={() => {
            // The dialog will need to be refreshed when quote expires
            console.log('Quote expired in dialog');
          }} />}
            </div>}


          {/* Quote Form - Show when sending a quote (not admin assigned tip) */}
          {!existingQuote && !displayAmount && <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="price">Precio del servicio en Quetzales (Q) *</Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    💰 Esta es tu compensación como viajero por realizar el Favorón
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-sans">Q</span>
                    <Input 
                      id="price" 
                      type="number" 
                      placeholder="0.00" 
                      value={price} 
                      onChange={e => updateFormField('price', e.target.value)} 
                      className={`pl-8 w-32 ${isMobile ? 'mobile-safe-form' : ''}`}
                      style={{ fontFamily: 'Arial, sans-serif' }}
                      autoFocus={false}
                      readOnly={isMobile && !mobileInputsReady}
                      onFocus={(e) => {
                        if (isMobile && !mobileInputsReady) {
                          e.target.blur();
                        }
                      }}
                      required 
                    />
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Asegúrate de considerar cualquier costo adicional por recibir el paquete (algunos hoteles cobran por este servicio)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="message">Mensaje (opcional)</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Añade cualquier información adicional..." 
                    value={message} 
                    onChange={e => updateFormField('message', e.target.value)} 
                    rows={3}
                    className={isMobile ? 'mobile-safe-form' : ''}
                    autoFocus={false}
                    readOnly={isMobile && !mobileInputsReady}
                    onFocus={(e) => {
                      if (isMobile && !mobileInputsReady) {
                        e.target.blur();
                      }
                    }}
                  />
                </div>
              </div>
            </div>}

          {/* Message for admin assigned tip acceptance - Modern design for travelers */}
          {displayAmount && (
            <div className={`${isTravelerContext ? 'bg-card border-2 border-muted/60 rounded-xl' : ''} p-4`}>
              <div className="max-w-full overflow-hidden space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg ${isTravelerContext ? 'bg-primary/10' : 'bg-muted'} flex items-center justify-center`}>
                    <FileText className={`w-3.5 h-3.5 ${isTravelerContext ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <Label htmlFor="message" className="text-sm font-medium">
                    {isTravelerContext ? "Mensaje para el shopper" : "Mensaje para el viajero"}
                  </Label>
                  <span className="text-xs text-muted-foreground">(opcional)</span>
                </div>
                <Textarea 
                  id="message" 
                  placeholder={isTravelerContext ? "Escribe un mensaje para el shopper..." : "Añade cualquier información adicional..."}
                  value={message} 
                  onChange={e => updateFormField('message', e.target.value)} 
                  rows={2}
                  className={`${isMobile ? 'mobile-safe-form' : ''} resize-none border-muted/60 focus:border-primary/40`}
                  autoFocus={false}
                  readOnly={isMobile && !mobileInputsReady}
                  onFocus={(e) => {
                    if (isMobile && !mobileInputsReady) {
                      e.target.blur();
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Terms and Conditions Checkbox - Only for shoppers accepting quotes */}
          {existingQuote && userType === 'user' && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox id="acceptTerms" checked={acceptedTerms} onCheckedChange={checked => updateFormField('acceptedTerms', !!checked)} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="acceptTerms" className="text-sm font-medium text-blue-900 cursor-pointer">
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
                  <Checkbox id="confirmedDeliveryTime" checked={confirmedDeliveryTime} onCheckedChange={checked => updateFormField('confirmedDeliveryTime', !!checked)} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="confirmedDeliveryTime" className="text-sm font-medium text-blue-900 cursor-pointer">
                      He revisado que el paquete llega a tiempo a la dirección proporcionada
                    </Label>
                  </div>
                </div>
              </div>
            </div>}

          {existingQuote && showRejectionForm && <QuoteActionsForm initialValues={{
          rejection_reason: rejectionReason as any || undefined,
          wants_requote: wantsRequote,
          additional_comments: additionalComments
        }} onChange={values => {
          updateFormField('rejectionReason', values.rejection_reason);
          updateFormField('wantsRequote', values.wants_requote ?? false);
          updateFormField('additionalComments', values.additional_comments ?? "");
        }} />}

          {/* Action Buttons - Modern design for travelers */}
          <div className={`flex justify-end gap-3 pt-4 ${isTravelerContext ? 'border-t-2 border-muted/40' : 'border-t'}`}>            
            {!existingQuote ? <>
                <Button 
                  variant="outline" 
                  onClick={handleReject} 
                  className={`flex-1 sm:flex-none ${isTravelerContext ? 'border-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200' : ''}`}
                >
                  Rechazar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!displayAmount && !price} 
                  className={`flex-1 sm:flex-none ${isTravelerContext 
                    ? 'bg-gradient-to-r from-success via-emerald-500 to-green-600 hover:from-success/90 hover:via-emerald-500/90 hover:to-green-600/90 text-white shadow-lg shadow-success/25 hover:shadow-success/40 hover:scale-[1.02] transition-all duration-200' 
                    : 'bg-green-600 hover:bg-green-700 text-white'}`}
                >
                  {displayAmount ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {isTravelerContext ? `Aceptar Q${displayAmount.toFixed(2)}` : `Aceptar Cotización Q${displayAmount.toFixed(2)}`}
                    </span>
                  ) : 'Enviar Cotización'}
                </Button>
              </> : <>
                {!showRejectionForm ? <>
                    <Button variant="outline" onClick={handleReject} className="flex-1 sm:flex-none border-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200">
                      Rechazar
                    </Button>
                    <Button variant="default" onClick={handleSubmit} disabled={userType === 'user' && (!acceptedTerms || !confirmedDeliveryTime) || isQuoteExpired} className="flex-1 sm:flex-none bg-gradient-to-r from-success via-emerald-500 to-green-600 hover:from-success/90 hover:via-emerald-500/90 hover:to-green-600/90 text-white shadow-lg shadow-success/25 disabled:opacity-50 disabled:shadow-none transition-all duration-200">
                      {isQuoteExpired ? 'Cotización Expirada' : 'Aceptar Cotización'}
                    </Button>
                  </> : <>
                    <Button variant="outline" onClick={() => setShowRejectionForm(false)} className="flex-1 sm:flex-none">
                      Volver
                    </Button>
                    <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason} className="flex-1 sm:flex-none">
                      {rejectionReason === 'no_longer_want' || !wantsRequote ? 'Rechazar Definitivamente' : 'Rechazar y Solicitar Nueva Cotización'}
                    </Button>
                  </>}
              </>}
          </div>
          </>
          )}
        </div>
        
        {/* Terms and Conditions Modal */}
        <TermsAndConditionsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
        
        {/* Prime Modal */}
        <PrimeModal
          isOpen={showPrimeModal}
          onClose={() => setShowPrimeModal(false)}
          user={profile}
        />
        
        {/* Traveler Rejection Modal */}
        <TravelerRejectionModal
          isOpen={showTravelerRejectionModal}
          onClose={() => setShowTravelerRejectionModal(false)}
          onConfirm={handleTravelerRejectionConfirm}
          packageDescription={packageDetails.item_description}
        />
      </DialogContent>

      <ImageViewerModal 
        isOpen={imageModalState.isOpen}
        onClose={() => setImageModalState({ isOpen: false, imageUrl: '', title: '' })}
        imageUrl={imageModalState.imageUrl}
        title={imageModalState.title}
      />
    </Dialog>;
};
export default QuoteDialog;