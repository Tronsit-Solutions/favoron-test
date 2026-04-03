import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, Package, MapPin, ExternalLink, X, FileText, AlertTriangle, Star, Home, Crown, Trash2, DollarSign, Calculator, Sparkles, Banknote, Gift, CheckCircle2, Plane, Phone, Edit, Plus, Truck, CreditCard, ArrowLeft } from "lucide-react";
import { formatDateUTC } from "@/lib/formatters";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePersistedFormState } from "@/hooks/usePersistedFormState";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformFeesContext } from "@/contexts/PlatformFeesContext";
import { useToast } from "@/hooks/use-toast";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import PrimeModal from "./PrimeModal";
import TravelerRejectionModal from "./TravelerRejectionModal";
import QuoteCountdown from "./dashboard/QuoteCountdown";
import { REJECTION_REASONS } from "@/lib/constants";
import QuoteActionsForm from "./forms/QuoteActionsForm";
import { formatCurrency } from "@/lib/formatters";
import { calculateQuoteTotal, getPriceBreakdown, calculateServiceFee, getDeliveryZone } from '@/lib/pricing';
import { createNormalizedQuote } from '@/lib/quoteHelpers';
import { supabase } from "@/integrations/supabase/client";
import './ui/mobile-input-fix.css';
import { resolveSignedUrl } from "@/lib/storageUrls";
import { TripEditSelectionModal } from "./dashboard/TripEditSelectionModal";
import { TripEditReceivingWindowModal } from "./dashboard/TripEditReceivingWindowModal";
import { TripEditDeliveryDateModal } from "./dashboard/TripEditDeliveryDateModal";
import { TripEditAddressModal } from "./dashboard/TripEditAddressModal";
import EditTripModal from "./EditTripModal";
import QuotePaymentStep from "./quote/QuotePaymentStep";
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
    package_destination_country?: string;
    cityArea?: string;
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
  // Wizard props for payment step
  fullPackage?: any; // Full package object for payment step
  onQuoteAccepted?: (pkg: any) => void; // Callback when quote is accepted, to transition to payment
  onPaymentComplete?: (pkg: any) => void; // Callback when payment is complete
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
  onEditTrip,
  fullPackage,
  onQuoteAccepted,
  onPaymentComplete
}: QuoteDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { rates, fees, getDeliveryFee: getContextDeliveryFee } = usePlatformFeesContext();
  const deliveryFees = {
    delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
    delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
    delivery_fee_outside_city: fees.delivery_fee_outside_city,
    prime_delivery_discount: fees.prime_delivery_discount,
  };
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
      confirmedProductReview: false,
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
  
  // Wizard step state: 'quote' or 'payment'
  const [wizardStep, setWizardStep] = useState<'quote' | 'payment'>('quote');
  const [acceptedPackage, setAcceptedPackage] = useState<any>(null);
  
  // Reset wizard step when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setWizardStep('quote');
      setAcceptedPackage(null);
    }
  }, [isOpen]);
  
  // Inline trip editing state
  const [showInlineEditSelection, setShowInlineEditSelection] = useState(false);
  const [showInlineReceivingWindow, setShowInlineReceivingWindow] = useState(false);
  const [showInlineDeliveryDate, setShowInlineDeliveryDate] = useState(false);
  const [showInlineAddress, setShowInlineAddress] = useState(false);
  const [showInlineFullEdit, setShowInlineFullEdit] = useState(false);
  const [tripEditPending, setTripEditPending] = useState(false);
  const [localTripInfo, setLocalTripInfo] = useState(tripInfo);
  
  // Keep localTripInfo in sync with tripInfo prop
  useEffect(() => {
    setLocalTripInfo(tripInfo);
  }, [tripInfo]);
  const [showTripConfirmation, setShowTripConfirmation] = useState(false);
  
  // Selected products state for multi-product orders (shoppers can remove products)
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  
  // Delivery method toggle for shoppers
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<string>(packageDetails.delivery_method || 'pickup');
  
  // Initialize selected products when modal opens
  useEffect(() => {
    if (isOpen && packageDetails.products_data && Array.isArray(packageDetails.products_data)) {
      setSelectedProducts([...packageDetails.products_data]);
    }
    if (isOpen) {
      setSelectedDeliveryMethod(packageDetails.delivery_method || 'pickup');
    }
  }, [isOpen, packageDetails.products_data, packageDetails.delivery_method]);
  
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
    confirmedProductReview = false,
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
        // Calculate Favorón subtotal (tip + service fee) WITHOUT delivery - discount only applies to this
      const activeProducts = selectedProducts.filter(p => !p.excluded && !p.cancelled);
      const totalTip = activeProducts.reduce((sum, p) => sum + parseFloat(p.adminAssignedTip || '0'), 0);
      const cityArea = packageDetails.cityArea || packageDetails.deliveryAddress?.cityArea;
      const breakdown = getPriceBreakdown(totalTip, selectedDeliveryMethod, packageDetails.shopper_trust_level, cityArea, rates, deliveryFees, packageDetails.package_destination_country);
      
      // Favorón subtotal = tip + service fee (no delivery)
      const favoronSubtotal = breakdown.basePrice + breakdown.serviceFee;
      
      const { data, error } = await supabase.rpc('validate_discount_code', {
        _code: discountCode.trim().toUpperCase(),
        _order_amount: favoronSubtotal, // Validate against Favorón subtotal only
        _user_id: profile?.id
      });
      
      if (error) throw error;
      
      const result = data as any;
      
      if (result?.valid) {
        // Apply discount to Favorón subtotal only
        const discount = result.calculatedDiscount;
        const discountedFavoron = Math.max(0, favoronSubtotal - discount);
        // Final total = discounted Favorón + delivery fee
        const finalTotalWithDelivery = discountedFavoron + breakdown.deliveryFee;
        
        updateFormField('discountAmount', discount);
        updateFormField('discountCodeId', result.discountCodeId);
        updateFormField('originalTotal', favoronSubtotal); // Store Favorón subtotal, not total with delivery
        updateFormField('finalTotal', finalTotalWithDelivery);
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
      // Exclude cancelled and excluded products from tip calculation
      const activeProducts = productsToUse.filter((p: any) => 
        !(p.excluded === true || p.excluded === 'true') && 
        !(p.cancelled === true || p.cancelled === 'true')
      );
      const totalTip = activeProducts.reduce((sum: number, product: any) => {
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
    const serviceFee = calculateServiceFee(tip, packageDetails.shopper_trust_level, rates);
    return tip + serviceFee;
  };
  
  // Calculate total from selected products with delivery fee (excluding excluded and cancelled products)
  const calculateSelectedProductsTotal = (): number => {
    const activeProducts = selectedProducts.filter(p => 
      !(p.excluded === true || p.excluded === 'true') && 
      !(p.cancelled === true || p.cancelled === 'true')
    );
    if (activeProducts.length === 0) return 0;
    const totalTip = activeProducts.reduce((sum, p) => sum + parseFloat(p.adminAssignedTip || '0'), 0);
    const cityArea = packageDetails.cityArea || packageDetails.deliveryAddress?.cityArea;
    const breakdown = getPriceBreakdown(totalTip, selectedDeliveryMethod, packageDetails.shopper_trust_level, cityArea, rates, deliveryFees, packageDetails.package_destination_country);
    return breakdown.totalPrice;
  };
  
  // Get count of active (non-excluded, non-cancelled) products
  const activeProductsCount = selectedProducts.filter(p => 
    !(p.excluded === true || p.excluded === 'true') && 
    !(p.cancelled === true || p.cancelled === 'true')
  ).length;
  
  // Get count of cancelled products (by admin)
  const cancelledProductsCount = selectedProducts.filter(p => 
    p.cancelled === true || p.cancelled === 'true'
  ).length;
  
  // Toggle product exclusion (strike-through) instead of removing - not allowed for cancelled products
  const toggleProductExclusion = (indexToToggle: number) => {
    const product = selectedProducts[indexToToggle];
    
    // Cannot toggle cancelled products
    if (product.cancelled === true || product.cancelled === 'true') return;
    
    const currentActiveCount = selectedProducts.filter(p => !p.excluded && !p.cancelled).length;
    
    // Cannot exclude if it's the last active product
    if (!product.excluded && currentActiveCount <= 1) return;
    
    setSelectedProducts(prev => 
      prev.map((p, i) => i === indexToToggle ? { ...p, excluded: !p.excluded } : p)
    );
    
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
      const cityArea = packageDetails.cityArea || (packageDetails.deliveryAddress as any)?.cityArea;
      return calculateQuoteTotal(base, selectedDeliveryMethod, packageDetails.shopper_trust_level, packageDetails.package_destination, cityArea, undefined, undefined, packageDetails.package_destination_country);
    }
    if (adminTipAmount && isShopperViewingQuote) {
      // If shopper is viewing admin assigned tip as quote, calculate total using centralized logic
      const cityArea = packageDetails.cityArea || (packageDetails.deliveryAddress as any)?.cityArea;
      return calculateQuoteTotal(adminTipAmount, selectedDeliveryMethod, packageDetails.shopper_trust_level, packageDetails.package_destination, cityArea, undefined, undefined, packageDetails.package_destination_country);
    }
    return adminTipAmount;
  };
  const displayAmount = getDisplayAmount();
  const handleSubmit = async () => {
    if (existingQuote) {
      if (isQuoteExpired) {
        return; // Prevent submission if quote is expired
      }
      clearPersistedState(); // Clear form data on successful submission
      
      // Include discount data if applied
      const submitData: any = {
        message: 'accepted'
      };
      
      // If traveler is accepting admin-assigned tip via existing quote, include flag
      if (isTravelerContext) {
        submitData.adminAssignedTipAccepted = true;
        submitData.price = displayAmount || adminTipAmount || 0;
      }
      
      if (discountSuccess && discountCodeId) {
        submitData.discountCode = discountCode;
        submitData.discountCodeId = discountCodeId;
        submitData.discountAmount = discountAmount;
        submitData.originalTotalPrice = originalTotal;
        submitData.finalTotalPrice = finalTotal;
      }
      
      // Include delivery method change if shopper changed it
      if (selectedDeliveryMethod !== packageDetails.delivery_method) {
        submitData.deliveryMethodChange = selectedDeliveryMethod;
      }
      
      // Check if shopper excluded (struck-through) any products
      const activeProducts = selectedProducts.filter((p: any) => !p.excluded);
      const excludedProducts = selectedProducts.filter((p: any) => p.excluded);
      
      if (excludedProducts.length > 0) {
        submitData.updatedProducts = activeProducts;
        submitData.removedProducts = excludedProducts.map((p: any) => p.itemDescription || 'Producto sin nombre');
        
        // Recalculate quote with remaining active products
        const newTotalTip = activeProducts.reduce((sum: number, p: any) => 
          sum + parseFloat(p.adminAssignedTip || '0'), 0
        );
        const recalculatedQuote = createNormalizedQuote(
          newTotalTip,
          selectedDeliveryMethod,
          packageDetails.shopper_trust_level,
          existingQuote.message,
          true,
          packageDetails.cityArea || packageDetails.deliveryAddress?.cityArea || packageDetails.package_destination,
          rates,
          deliveryFees,
          packageDetails.package_destination_country
        );
        submitData.recalculatedQuote = recalculatedQuote;
        
        // Update final total if discount was applied
        if (submitData.finalTotalPrice) {
          submitData.originalTotalPrice = recalculatedQuote.totalPrice;
          submitData.finalTotalPrice = Math.max(0, recalculatedQuote.totalPrice - discountAmount);
        }
      }
      
      // If fullPackage is available and this is a shopper accepting a quote, 
      // call onSubmit first (to trigger RPC), then transition to payment
      onSubmit(submitData);
      
      if (fullPackage && userType === 'user' && !isTravelerContext) {
        // Wait a moment for the RPC to complete, then fetch updated package
        setTimeout(async () => {
          try {
            const { data: updatedPkg } = await supabase
              .from('packages')
              .select('*')
              .eq('id', fullPackage.id)
              .single();
            
            if (updatedPkg) {
              toast({
                title: "¡Cotización aceptada!",
                description: "Ahora completa el pago para confirmar tu pedido."
              });
              handleQuoteAccepted(updatedPkg);
            }
          } catch (e) {
            console.error('Error fetching updated package for payment step:', e);
          }
        }, 500); // Small delay to ensure RPC completes
      }
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
        packageDetails.cityArea || packageDetails.deliveryAddress?.cityArea || packageDetails.package_destination,
        rates,
        deliveryFees,
        packageDetails.package_destination_country
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
        packageDetails.cityArea || packageDetails.deliveryAddress?.cityArea || packageDetails.package_destination,
        rates,
        deliveryFees,
        packageDetails.package_destination_country
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

  // Handle inline trip edit selection
  const handleInlineEditSelection = (option: 'receiving_window' | 'delivery_date' | 'address' | 'other') => {
    setShowInlineEditSelection(false);
    switch (option) {
      case 'receiving_window':
        setShowInlineReceivingWindow(true);
        break;
      case 'delivery_date':
        setShowInlineDeliveryDate(true);
        break;
      case 'address':
        setShowInlineAddress(true);
        break;
      case 'other':
        setShowInlineFullEdit(true);
        break;
    }
  };

  // Handle inline trip edit submission
  const handleInlineTripEdit = async (editData: any) => {
    try {
      if (localTripInfo?.id) {
        const updateData: any = {
          status: 'pending_approval',
          ...editData
        };
        
        const { error } = await supabase
          .from('trips')
          .update(updateData)
          .eq('id', localTripInfo.id);
        
        if (error) throw error;
        
        // Update local trip info with new data
        setLocalTripInfo((prev: any) => prev ? { ...prev, ...editData } : prev);
        
        // Mark that trip edit is pending admin approval
        setTripEditPending(true);
        
        toast({
          title: "Viaje actualizado",
          description: "Los cambios requieren aprobación del administrador antes de continuar.",
        });
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el viaje.",
        variant: "destructive"
      });
    }
  };
  
  // Handle transition to payment step after quote acceptance
  const handleQuoteAccepted = (updatedPkg: any) => {
    setAcceptedPackage(updatedPkg);
    setWizardStep('payment');
    onQuoteAccepted?.(updatedPkg);
  };

  // Handle payment completion
  const handlePaymentComplete = (updatedPkg: any) => {
    onPaymentComplete?.(updatedPkg);
    onClose();
  };
  
  return <Dialog open={isOpen} onOpenChange={(open) => {
    if (!open) {
      // Reset wizard state when closing
      setWizardStep('quote');
      setAcceptedPackage(null);
    }
    onClose();
  }}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[85vh] m-2 p-3 rounded-lg' : 'sm:max-w-2xl max-w-[98vw] max-h-[92vh] m-1 sm:m-4'} flex flex-col overflow-hidden p-4 sm:p-6`}>

        {/* PAYMENT STEP - Wizard step 2 */}
        {wizardStep === 'payment' && acceptedPackage ? (
          <>
            <DialogHeader className="pr-12 shrink-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-left flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                Completar Pago
              </DialogTitle>
              <DialogDescription className="text-base sm:text-sm text-muted-foreground leading-relaxed text-left">
                Tu cotización fue aceptada. Ahora completa el pago para continuar.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-1">
              <QuotePaymentStep
                pkg={acceptedPackage}
                onPaymentComplete={handlePaymentComplete}
                onClose={onClose}
              />
            </div>
          </>
        ) : (
        <>
        {/* QUOTE STEP - Wizard step 1 (original content) */}
        <DialogHeader className="pr-12 shrink-0">
          {isTravelerContext ? (
            <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-3'}`}>
              <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl bg-success/10 flex items-center justify-center shrink-0`}>
                <Gift className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-success`} />
              </div>
              <div>
                <DialogTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-foreground text-left`}>
                  Tip Asignado
                </DialogTitle>
                <DialogDescription className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground text-left`}>
                  Revisa los detalles y decide si aceptas este encargo
                </DialogDescription>
              </div>
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

        <div className={`flex-1 overflow-y-auto ${isMobile ? 'space-y-3' : 'space-y-4 sm:space-y-6'} pr-1`}>{/* Single scroll container */}
          
          {/* TRIP CONFIRMATION STEP - For travelers confirming their trip info */}
          {isTravelerContext && showTripConfirmation && localTripInfo ? (
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
                  <span className="text-muted-foreground">{localTripInfo.from_country || localTripInfo.from_city}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold text-foreground">{localTripInfo.to_city}</span>
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
                    <span className="font-medium text-foreground">{formatDateUTC(localTripInfo.arrival_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recibo paquetes:</span>
                    <span className="font-medium text-foreground">
                      {formatDateUTC(localTripInfo.first_day_packages)} - {formatDateUTC(localTripInfo.last_day_packages)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entrega en oficina:</span>
                    <span className="font-medium text-foreground">{formatDateUTC(localTripInfo.delivery_date)}</span>
                  </div>
                </div>
              </div>
              
              {/* Delivery Address */}
              {localTripInfo.package_receiving_address && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-2 border border-muted/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">Dirección de recepción de paquetes</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {localTripInfo.package_receiving_address.recipientName && (
                      <p className="font-semibold text-foreground">{localTripInfo.package_receiving_address.recipientName}</p>
                    )}
                    {localTripInfo.package_receiving_address.streetAddress && (
                      <p className="text-muted-foreground">{localTripInfo.package_receiving_address.streetAddress}</p>
                    )}
                    {localTripInfo.package_receiving_address.streetAddress2 && (
                      <p className="text-muted-foreground">{localTripInfo.package_receiving_address.streetAddress2}</p>
                    )}
                    {localTripInfo.package_receiving_address.cityArea && (
                      <p className="text-muted-foreground">{localTripInfo.package_receiving_address.cityArea}</p>
                    )}
                    {localTripInfo.package_receiving_address.postalCode && (
                      <p className="text-muted-foreground">CP: {localTripInfo.package_receiving_address.postalCode}</p>
                    )}
                    {localTripInfo.package_receiving_address.hotelAirbnbName && (
                      <p className="text-muted-foreground">🏨 {localTripInfo.package_receiving_address.hotelAirbnbName}</p>
                    )}
                    {localTripInfo.package_receiving_address.contactNumber && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{localTripInfo.package_receiving_address.contactNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Trip Edit Pending Warning */}
              {tripEditPending && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">Cambios pendientes de aprobación</p>
                    <p className="text-xs mt-1">
                      Has modificado la información del viaje. El administrador debe aprobar los cambios 
                      antes de que la cotización se envíe al shopper.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowTripConfirmation(false)}
                  className="self-start"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a detalles
                </Button>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowInlineEditSelection(true)}
                    className="flex-1"
                    disabled={tripEditPending}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar viaje
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-success via-emerald-500 to-green-600 hover:from-success/90 hover:via-emerald-500/90 hover:to-green-600/90 text-white shadow-lg shadow-success/25"
                    disabled={tripEditPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {tripEditPending ? 'Esperando aprobación' : 'Confirmar y enviar'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
          <>
          {/* COMPACT HERO TIP CARD - Only for travelers */}
          {isTravelerContext && displayAmount && (
            <div className="rounded-xl bg-gradient-to-r from-success/10 via-emerald-50 to-green-50 dark:from-success/20 dark:via-emerald-900/20 dark:to-green-900/10 border border-success/20 p-3 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success flex items-center justify-center shadow-sm">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-medium">Tu tip por llevarte este paquete</span>
                  <p className="text-2xl font-bold text-success">
                    Q{displayAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Package Details - Clear product view for travelers, detailed for shoppers */}
          <div className={`${isTravelerContext ? 'bg-muted/30 border border-muted/40' : 'bg-muted/50 border'} rounded-lg ${isMobile ? 'p-3' : 'p-4'} max-w-full`}>
            {isTravelerContext ? (
              /* Clear structured view for travelers */
              <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
                {/* Section Header */}
                <div className={`flex items-center ${isMobile ? 'gap-1.5 pb-2' : 'gap-2 pb-3'} border-b border-muted/40`}>
                  <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg bg-primary/10 flex items-center justify-center`}>
                    <Package className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-primary`} />
                  </div>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-foreground`}>Producto solicitado</span>
                </div>

                {packageDetails.products_data && Array.isArray(packageDetails.products_data) && packageDetails.products_data.length > 0 ? (
                  <div className="space-y-3">
                    {packageDetails.products_data.map((product: any, index: number) => {
                      const quantity = parseInt(product.quantity || '1');
                      const unitPrice = parseFloat(product.estimatedPrice || '0');
                      const isPersonalOrder = product.requestType === 'personal';
                      const productLink = product.itemLink || packageDetails.item_link;
                      
                      return (
                        <div key={index} className={`bg-background/60 rounded-lg ${isMobile ? 'p-2.5' : 'p-3'} border border-muted/30`}>
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
                          
                          {/* Indicador de empaque original */}
                          <p className={`text-xs flex items-center gap-1.5 mb-3 ${
                            product.needsOriginalPackaging 
                              ? 'text-amber-600' 
                              : 'text-muted-foreground'
                          }`}>
                            📦 {product.needsOriginalPackaging ? 'Conservar empaque original del producto' : 'No requiere empaque original'}
                            <span className="block text-[10px] text-muted-foreground font-normal ml-5">
                              {product.needsOriginalPackaging 
                                ? 'Se refiere al empaque de la marca, no a la caja de cartón del envío/delivery.' 
                                : 'Puedes descartar el empaque de la marca y enviar solo el producto.'}
                            </span>
                          </p>
                          
                          {/* Product Link Button */}
                          {productLink && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full"
                              onClick={() => window.open(productLink, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver producto en tienda
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`bg-background/60 rounded-lg ${isMobile ? 'p-2.5' : 'p-3'} border border-muted/30`}>
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(packageDetails.item_link, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver producto en tienda
                      </Button>
                    )}
                  </div>
                )}

                {/* Additional Notes */}
                {packageDetails.additional_notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                    <p className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                      📝 Nota Adicional del Shopper:
                    </p>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      {packageDetails.additional_notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
            /* Detailed view for shoppers - UNIFIED: Product details + Quote per product */
              <>
                {/* Warning note - Outside green container for cleaner hierarchy */}
                {existingQuote && (
                  <p className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                    ⚠️ Tú eres el encargado de hacer la compra. La cotización no incluye el precio de tus productos.
                  </p>
                )}
                
                {/* Show unified section for all products with existing quote */}
                {existingQuote ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-5 w-5 text-slate-600" />
                      <p className="text-base font-semibold text-slate-800">Tu Pedido</p>
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                        {activeProductsCount} de {selectedProducts.length - cancelledProductsCount} producto{(selectedProducts.length - cancelledProductsCount) !== 1 ? 's' : ''}
                        {cancelledProductsCount > 0 && (
                          <span className="text-red-500 ml-1">({cancelledProductsCount} cancelado{cancelledProductsCount !== 1 ? 's' : ''})</span>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedProducts.map((product: any, index: number) => {
                        const isExcluded = product.excluded === true || product.excluded === 'true';
                        const isCancelled = product.cancelled === true || product.cancelled === 'true';
                        const isInactive = isExcluded || isCancelled;
                        const quantity = parseInt(product.quantity || '1');
                        const unitPrice = parseFloat(product.estimatedPrice || '0');
                        const tip = parseFloat(product.adminAssignedTip || '0');
                        const serviceFee = calculateServiceFee(tip, packageDetails.shopper_trust_level, rates);
                        const subtotal = isCancelled ? 0 : (tip + serviceFee);
                        
                        // Diagnóstico temporal - revisar en consola
                        console.log(`🔍 Producto ${index}: ${product.itemDescription}`, {
                          cancelled: product.cancelled,
                          cancelledType: typeof product.cancelled,
                          isCancelled,
                          excluded: product.excluded,
                          isExcluded
                        });
                        const nonCancelledProducts = selectedProducts.filter(p => !(p.cancelled === true || p.cancelled === 'true'));
                        const canToggle = nonCancelledProducts.length > 1 && !isCancelled;
                        const productLink = product.itemLink || packageDetails.item_link;
                        
                        return (
                          <div 
                            key={index} 
                            className={`rounded-lg p-3 relative transition-all ${
                              isCancelled
                                ? "bg-red-50 border border-red-200 opacity-70"
                                : isExcluded 
                                  ? "bg-gray-100 border border-gray-300 opacity-60" 
                                  : "bg-white border border-slate-200"
                            }`}
                          >
                            {/* "Cancelado" badge overlay for admin-cancelled products */}
                            {isCancelled && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white text-xs px-3 py-1 rounded-full font-medium z-10">
                                Cancelado
                              </div>
                            )}
                            
                            {/* "Quitado" badge overlay for shopper-excluded products */}
                            {isExcluded && !isCancelled && (
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-500/80 text-white text-xs px-3 py-1 rounded-full font-medium z-10">
                                Quitado
                              </div>
                            )}
                            
                            {/* Header: number + name + toggle button */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`flex items-center justify-center w-6 h-6 rounded font-bold text-xs shrink-0 ${
                                  isCancelled
                                    ? "bg-red-100 text-red-500"
                                    : isExcluded 
                                      ? "bg-gray-200 text-gray-500" 
                                      : "bg-primary/10 text-primary"
                                }`}>
                                  {index + 1}
                                </span>
                                <p className={`font-medium text-sm truncate ${
                                  isCancelled
                                    ? "line-through text-red-500"
                                    : isExcluded 
                                      ? "line-through text-gray-500" 
                                      : "text-slate-800"
                                }`}>
                                  {product.itemDescription || `Producto ${index + 1}`}
                                </p>
                              </div>
                              {/* Toggle button - only for non-cancelled products */}
                              {canToggle && (
                                <button
                                  onClick={() => toggleProductExclusion(index)}
                                  className={`p-1.5 rounded-full transition-colors shrink-0 ${
                                    isExcluded
                                      ? "hover:bg-green-100 text-gray-500 hover:text-green-600"
                                      : "hover:bg-red-100 text-muted-foreground hover:text-red-600"
                                  }`}
                                  title={isExcluded ? "Restaurar producto" : "Quitar producto"}
                                  disabled={!isExcluded && activeProductsCount <= 1}
                                >
                                  {isExcluded ? <Plus className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                            
                            {/* Price USD + quantity + link */}
                            <div className={`flex items-center gap-3 text-xs mb-2 ${
                              isInactive ? "text-gray-400 line-through" : "text-muted-foreground"
                            }`}>
                              <span>${unitPrice.toFixed(2)} × {quantity}</span>
                              {productLink && !isInactive && (
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
                            
                          </div>
                        );
                      })}
                      
                      
                      {/* CARD 2: Cotización del Viajero - INDEPENDIENTE */}
                      {existingQuote && tripDates && localTripInfo && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
                          {/* Header con avatar, nombre y ruta */}
                          <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-11 w-11 border-2 border-slate-200 shrink-0">
                              {(localTripInfo as any)?.profiles?.avatar_url ? (
                                <AvatarImage 
                                  src={(localTripInfo as any).profiles.avatar_url} 
                                  alt={(localTripInfo as any)?.profiles?.first_name || 'Viajero'} 
                                />
                              ) : null}
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                {((localTripInfo as any)?.profiles?.first_name?.charAt(0) || 'V').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-800">
                                  {(localTripInfo as any)?.profiles?.first_name || 'Viajero'}
                                  {(localTripInfo as any)?.profiles?.last_name && (
                                    <span className="ml-1">
                                      {(localTripInfo as any).profiles.last_name.charAt(0)}
                                      <span className="blur-[3px] select-none">●●●●●●</span>
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Plane className="h-3 w-3" />
                                <span>{localTripInfo?.from_country || localTripInfo?.from_city} → {localTripInfo?.to_city}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Detalles del viaje */}
                          <div className="space-y-2.5 text-sm">
                            {/* Ventana de recepción */}
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                              <span className="text-slate-600">Ventana de recepción:</span>
                              <span className="font-medium text-slate-800">
                                {(() => {
                                  const dateFirst = new Date(tripDates.first_day_packages);
                                  const dateLast = new Date(tripDates.last_day_packages);
                                  return `${new Date(dateFirst.getUTCFullYear(), dateFirst.getUTCMonth(), dateFirst.getUTCDate()).toLocaleDateString('es-GT')} - ${new Date(dateLast.getUTCFullYear(), dateLast.getUTCMonth(), dateLast.getUTCDate()).toLocaleDateString('es-GT')}`;
                                })()}
                              </span>
                            </div>
                            
                            {/* Fecha de entrega */}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                              <span className="text-slate-600">Fecha de entrega:</span>
                              <span className="font-medium text-slate-800">
                                {(() => {
                                  const addBusinessDays = (date: Date, days: number) => {
                                    const result = new Date(date);
                                    let addedDays = 0;
                                    while (addedDays < days) {
                                      result.setDate(result.getDate() + 1);
                                      if (result.getDay() !== 0 && result.getDay() !== 6) {
                                        addedDays++;
                                      }
                                    }
                                    return result;
                                  };
                                  const packageDeliveryDate = addBusinessDays(new Date(tripDates.delivery_date), 2);
                                  return packageDeliveryDate.toLocaleDateString('es-GT');
                                })()}
                              </span>
                            </div>
                            
                            {/* Ciudad de origen (donde enviar paquete) */}
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-slate-400 shrink-0" />
                              <span className="text-slate-600">Ciudad:</span>
                              <span className="font-medium text-slate-800">
                                {packageDetails.traveler_address?.city || 
                                 packageDetails.traveler_address?.cityArea || 
                                 localTripInfo?.from_city || 'Ciudad no especificada'}
                              </span>
                            </div>
                            
                            {/* Dirección parcial */}
                            {userType === 'user' && !isTravelerContext && packageDetails.traveler_address?.streetAddress && (
                              <>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-slate-600">Dirección:</span>
                                    <span className="font-medium text-slate-800 ml-1">
                                      {packageDetails.traveler_address.streetAddress}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Dirección 2 - mostrar borrosa para indicar info parcial */}
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5 opacity-50" />
                                  <div>
                                    <span className="text-slate-600">Dirección 2:</span>
                                    <span className="ml-1 blur-[4px] select-none text-slate-400">
                                      {packageDetails.traveler_address?.streetAddress2 || 'Información adicional'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Ciudad/Estado */}
                                {(packageDetails.traveler_address.city || packageDetails.traveler_address.state) && (
                                  <div className="flex items-center gap-2">
                                    <Home className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span className="text-slate-600">Ciudad/Estado:</span>
                                    <span className="font-medium text-slate-800">
                                      {packageDetails.traveler_address.city}
                                      {packageDetails.traveler_address.state && `, ${packageDetails.traveler_address.state}`}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Código postal */}
                                {(packageDetails.traveler_address?.postalCode || existingQuote?.traveler_postal_code) && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span className="text-slate-600">Código postal:</span>
                                    <span className="font-medium text-slate-800">
                                      {packageDetails.traveler_address?.postalCode || existingQuote?.traveler_postal_code}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          
                          {/* Sección de precios completa dentro del card del viajero */}
                          {(() => {
                            const cityArea = packageDetails.cityArea || packageDetails.deliveryAddress?.cityArea;
                            const activeProducts = selectedProducts.filter(p => 
                              !(p.excluded === true || p.excluded === 'true') && 
                              !(p.cancelled === true || p.cancelled === 'true')
                            );
                            const totalTip = activeProducts.reduce((sum, p) => sum + parseFloat(p.adminAssignedTip || '0'), 0);
                            const isPrime = packageDetails.shopper_trust_level === 'prime';
                            const isDelivery = selectedDeliveryMethod === 'delivery';
                            const zone = getDeliveryZone(cityArea, packageDetails.package_destination_country);
                            
                            // Calculate service fees using dynamic rates from DB
                            const standardServiceFee = totalTip * rates.standard;
                            const primeServiceFee = totalTip * rates.prime;
                            const serviceFeeSavings = isPrime ? standardServiceFee - primeServiceFee : 0;
                            
                            // Calculate delivery fees using context (DB-driven)
                            const standardDeliveryFee = isDelivery ? getContextDeliveryFee('delivery', 'basic', cityArea, packageDetails.package_destination_country) : 0;
                            const primeDeliveryFee = isDelivery ? getContextDeliveryFee('delivery', 'prime', cityArea, packageDetails.package_destination_country) : 0;
                            const actualDeliveryFee = isDelivery ? (isPrime ? primeDeliveryFee : standardDeliveryFee) : 0;
                            const deliverySavings = isDelivery && isPrime ? standardDeliveryFee - primeDeliveryFee : 0;
                            
                            const totalSavings = serviceFeeSavings + deliverySavings;
                            const total = calculateSelectedProductsTotal();
                            const wholePart = Math.floor(total);
                            const decimalPart = (total % 1).toFixed(2).slice(2);
                            
                            return (
                              <div className="mt-4 pt-3 space-y-2">
                                {/* Favorón = tip + service fee */}
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600">Favorón:</span>
                                  <span className="font-medium text-slate-800">
                                    {formatCurrency(totalTip + (isPrime ? primeServiceFee : standardServiceFee))}
                                  </span>
                                </div>
                                
                                {/* Entrega a domicilio */}
                                {isDelivery && (
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 flex items-center gap-1">
                                      <Truck className="w-3 h-3" /> Entrega a domicilio:
                                    </span>
                                    <span className="font-medium text-slate-800">
                                      {isPrime ? formatCurrency(standardDeliveryFee) : (actualDeliveryFee === 0 ? '¡GRATIS!' : formatCurrency(actualDeliveryFee))}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Delivery method toggle for shoppers */}
                                {isShopperViewingQuote && !isQuoteExpired && (
                                  <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 mt-1">
                                    <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                      <Truck className="w-3.5 h-3.5" /> Método de entrega
                                    </p>
                                    <RadioGroup 
                                      value={selectedDeliveryMethod} 
                                      onValueChange={(val) => {
                                        setSelectedDeliveryMethod(val);
                                        // Clear discount when delivery method changes
                                        if (discountSuccess) removeDiscount();
                                      }}
                                      className="space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <RadioGroupItem value="pickup" id="pickup" />
                                          <Label htmlFor="pickup" className="text-sm text-slate-700 cursor-pointer">
                                            Recoger en punto de entrega
                                          </Label>
                                        </div>
                                        <span className="text-xs text-emerald-600 font-medium">Gratis</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <RadioGroupItem value="delivery" id="delivery" />
                                          <Label htmlFor="delivery" className="text-sm text-slate-700 cursor-pointer">
                                            Entrega a domicilio
                                          </Label>
                                        </div>
                                        <span className="text-xs font-medium text-slate-600">
                                          {formatCurrency(isPrime ? Math.max(0, standardDeliveryFee - (fees.prime_delivery_discount || 0)) : standardDeliveryFee)}
                                        </span>
                                      </div>
                                    </RadioGroup>
                                    {selectedDeliveryMethod === 'delivery' && selectedDeliveryMethod !== packageDetails.delivery_method && (
                                      <p className="text-[11px] text-amber-600 mt-2">
                                        ⚠️ Deberás confirmar tu dirección de entrega después del pago.
                                      </p>
                                    )}
                                    {selectedDeliveryMethod !== packageDetails.delivery_method && (
                                      <p className="text-[11px] text-primary mt-1 font-medium">
                                        ✏️ Cambiarás de {packageDetails.delivery_method === 'delivery' ? 'entrega a domicilio' : 'pickup'} a {selectedDeliveryMethod === 'delivery' ? 'entrega a domicilio' : 'pickup'}
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                {/* Ahorros Prime */}
                                {isPrime && serviceFeeSavings > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-amber-600 flex items-center gap-1">
                                      <Crown className="w-3.5 h-3.5" /> Ahorro Prime (Servicio):
                                    </span>
                                    <span className="text-amber-600 font-semibold">-{formatCurrency(serviceFeeSavings)}</span>
                                  </div>
                                )}
                                
                                {isPrime && isDelivery && deliverySavings > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-amber-600 flex items-center gap-1">
                                      <Crown className="w-3.5 h-3.5" /> Ahorro Prime (Entrega):
                                    </span>
                                    <span className="text-amber-600 font-semibold">-{formatCurrency(deliverySavings)}</span>
                                  </div>
                                )}
                                
                                {/* Total */}
                                <div className="pt-2 mt-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-700 font-semibold text-sm">Total final:</span>
                                    <span className="text-xl font-bold text-primary">
                                      Q{wholePart}<span className="text-base">.{decimalPart}</span>
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Badge Prime si hubo ahorros */}
                                {isPrime && totalSavings > 0 && (
                                  <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 rounded-lg p-2.5 mt-2">
                                    <div className="flex items-center justify-center gap-2">
                                      <Crown className="w-4 h-4 text-amber-500" />
                                      <span className="text-amber-800 font-bold text-xs">
                                        ¡Ahorraste {formatCurrency(totalSavings)} con Prime!
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          
                          {/* Nota informativa */}
                          {userType === 'user' && !isTravelerContext && packageDetails.traveler_address?.streetAddress && (
                            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-xs text-amber-700">
                                ⚠️ Información parcial del viajero. La dirección completa se proporcionará después de confirmar el pago.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      
                      {/* Discount Code Section */}
                      {existingQuote && userType === 'user' && !isQuoteExpired && (
                        <div className="bg-slate-100/50 border border-slate-300 rounded-lg p-3 mt-2">
                          <Label className="text-sm font-semibold text-slate-800 mb-2 block">
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
                                  className="flex-1 uppercase font-mono bg-white"
                                  disabled={isValidatingCode}
                                />
                                <Button 
                                  onClick={validateDiscountCode} 
                                  disabled={!discountCode.trim() || isValidatingCode}
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
                            <div className="mt-2 bg-white/80 rounded-lg p-3 border border-slate-300">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-primary font-semibold text-sm flex items-center gap-2">
                                    ✅ Código aplicado: <span className="font-mono">{discountCode}</span>
                                  </p>
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Subtotal Favorón:</span>
                                      <span className="line-through text-muted-foreground">{formatCurrency(originalTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-primary font-medium">
                                      <span>Descuento:</span>
                                      <span>-{formatCurrency(discountAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-slate-700">
                                      <span>Subtotal con descuento:</span>
                                      <span>{formatCurrency(originalTotal - discountAmount)}</span>
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
                      
                      {/* Final total after discount - clear breakdown with delivery */}
                      {discountSuccess && (
                        <div className="bg-primary/5 border-2 border-primary/30 rounded-lg p-4 mt-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-slate-700">
                              <span>Subtotal con descuento:</span>
                              <span>{formatCurrency(originalTotal - discountAmount)}</span>
                            </div>
                            {selectedDeliveryMethod === 'delivery' && (
                              <div className="flex justify-between text-sm text-slate-700">
                                <span>🚚 Entrega a domicilio:</span>
                                <span>{formatCurrency(getPriceBreakdown(0, 'delivery', packageDetails.shopper_trust_level, packageDetails.cityArea || packageDetails.deliveryAddress?.cityArea, rates, deliveryFees).deliveryFee)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-300">
                              <span className="text-slate-800 font-bold text-base flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                Total a pagar:
                              </span>
                              <span className="text-2xl font-bold text-primary">
                                {formatCurrency(finalTotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
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

          {/* Traveler quote info is now integrated in the unified card above */}

          {/* Existing Quote Display */}
          {existingQuote && <div className="space-y-4">

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
            <div className={`${isTravelerContext ? 'bg-card border-2 border-muted/60 rounded-xl' : ''} ${isMobile ? 'p-3' : 'p-4'}`}>
              <div className="max-w-full overflow-hidden space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded-lg ${isTravelerContext ? 'bg-primary/10' : 'bg-muted'} flex items-center justify-center`}>
                    <FileText className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${isTravelerContext ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <Label htmlFor="message" className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
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

          {/* Traveler confirmation checkbox */}
          {isTravelerContext && !existingQuote && (
            <div className={`bg-muted/30 rounded-lg ${isMobile ? 'p-2.5' : 'p-3'} border border-muted/40`}>
              <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-3'}`}>
                <Checkbox
                  id="confirmedProductReview"
                  checked={confirmedProductReview}
                  onCheckedChange={(checked) => updateFormField('confirmedProductReview', checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="confirmedProductReview" className={`${isMobile ? 'text-xs' : 'text-sm'} cursor-pointer leading-relaxed`}>
                  <span className="font-medium text-foreground">
                    Confirmo que he revisado el producto y que puedo llevarlo en mi maleta
                  </span>
                  <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground mt-0.5`}>
                    Al marcar esta casilla, confirmas que el producto cumple con las restricciones de equipaje y aduanas
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons - Modern design for travelers */}
          <div className={`flex justify-end gap-2 ${isMobile ? 'pt-3' : 'pt-4'} ${isTravelerContext ? 'border-t-2 border-muted/40' : 'border-t'}`}>            
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
                  variant="success"
                  disabled={(!displayAmount && !price) || (isTravelerContext && !confirmedProductReview)} 
                  className={`flex-1 sm:flex-none ${isTravelerContext 
                    ? 'shadow-lg shadow-success/25 hover:shadow-success/40 hover:scale-[1.02] transition-all duration-200' 
                    : ''}`}
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
                    <Button variant="default" onClick={handleSubmit} disabled={userType === 'user' && (!acceptedTerms || !confirmedDeliveryTime) || isQuoteExpired} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-all duration-200">
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
        
        {/* Inline Trip Edit Modals */}
        <TripEditSelectionModal
          isOpen={showInlineEditSelection}
          onClose={() => setShowInlineEditSelection(false)}
          onSelectOption={handleInlineEditSelection}
          hasActivePackages={true}
        />

        <TripEditReceivingWindowModal
          isOpen={showInlineReceivingWindow}
          onClose={() => setShowInlineReceivingWindow(false)}
          onSubmit={async (data) => {
            await handleInlineTripEdit({
              first_day_packages: data.firstDayPackages,
              last_day_packages: data.lastDayPackages
            });
            setShowInlineReceivingWindow(false);
          }}
          tripData={localTripInfo}
          hasActivePackages={true}
        />

        <TripEditDeliveryDateModal
          isOpen={showInlineDeliveryDate}
          onClose={() => setShowInlineDeliveryDate(false)}
          onSubmit={async (data) => {
            await handleInlineTripEdit({
              delivery_date: data.deliveryDate
            });
            setShowInlineDeliveryDate(false);
          }}
          tripData={localTripInfo}
          hasActivePackages={true}
        />

        <TripEditAddressModal
          isOpen={showInlineAddress}
          onClose={() => setShowInlineAddress(false)}
          onSubmit={async (data) => {
            await handleInlineTripEdit({
              package_receiving_address: data.packageReceivingAddress
            });
            setShowInlineAddress(false);
          }}
          tripData={localTripInfo}
          hasActivePackages={true}
        />

        <EditTripModal
          isOpen={showInlineFullEdit}
          onClose={() => setShowInlineFullEdit(false)}
          tripData={localTripInfo}
          onSubmit={async (data) => {
            await handleInlineTripEdit(data);
            setShowInlineFullEdit(false);
          }}
        />
        </>
        )}
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