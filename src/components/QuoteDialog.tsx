import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Package, MapPin, ExternalLink, X, FileText, AlertTriangle, Star, Home, Crown } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePersistedFormState } from "@/hooks/usePersistedFormState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import PrimeModal from "./PrimeModal";
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
  userType: 'user' | 'admin';
  existingQuote?: any;
  tripDates?: {
    first_day_packages: string;
    last_day_packages: string;
    delivery_date: string;
    arrival_date: string;
  };
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
  tripDates
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

  // Get admin tip amount - always from products_data first
  const getTipAmount = () => {
    if (packageDetails.products_data && Array.isArray(packageDetails.products_data) && packageDetails.products_data.length > 0) {
      const totalTip = packageDetails.products_data.reduce((sum: number, product: any) => {
        return sum + parseFloat(product.adminAssignedTip || '0');
      }, 0);
      return totalTip > 0 ? totalTip : null;
    }
    // Fallback to admin_assigned_tip for backward compatibility
    const fallbackTip = parseFloat(packageDetails.admin_assigned_tip || '0');
    return fallbackTip > 0 ? fallbackTip : null;
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
      
      onSubmit(submitData);
    } else if (isAdminAssignedTip) {
      // Traveler accepting admin assigned tip
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

    // For admin-assigned tips, travelers can reject directly without justification
    clearPersistedState(); // Clear form data on successful rejection
    onSubmit({
      message: 'rejected',
      rejectionReason: existingQuote ? rejectionReason : undefined,
      wantsRequote: existingQuote ? wantsRequote : undefined,
      additionalNotes: existingQuote ? additionalComments : undefined
    });
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[85vh] m-2 p-3 rounded-lg' : 'sm:max-w-2xl max-w-[98vw] max-h-[92vh] m-1 sm:m-4'} overflow-y-auto p-4 sm:p-6`}>

        <DialogHeader className="pr-12">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-left">
            {isTravelerContext ? '💰 Tip Asignado por Favorón' : !existingQuote ? '💰 Enviar Cotización' : '✅ Responder Cotización'}
          </DialogTitle>
          <DialogDescription className="text-base sm:text-sm text-muted-foreground leading-relaxed text-left">
            {isTravelerContext ? 'Favorón ha asignado un tip específico para este pedido. Revisa y decide si aceptas.' : !existingQuote ? 'Proporciona tu mejor cotización para este Favorón' : 'Revisa los detalles y responde a la cotización del viajero'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 overflow-x-hidden">{/* Force no horizontal overflow */}
          {/* Package Details */}
          <div className="bg-muted/50 border rounded-lg p-3 sm:p-4 max-w-full">{/* Reduce padding and add max-width */}
            <div className="flex items-start space-x-2 mb-2">
              <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-base sm:text-sm font-semibold text-primary">📦 Detalles del Favorón</p>
            </div>
            <div className="text-sm ml-4 sm:ml-7 space-y-3 overflow-x-hidden">
              {/* Unified container for all package details */}
              <div className="bg-background/80 rounded-lg p-3 space-y-4 max-w-full overflow-hidden">
                {/* Product Description */}
                <div>
                  <p className="font-medium text-foreground mb-2">
                    <strong>{packageDetails.products_data?.[0]?.requestType === 'personal' ? 'Pedido:' : 'Producto:'}</strong>
                  </p>
                  <p className="text-foreground leading-relaxed">{packageDetails.item_description}</p>
                </div>

                {/* Pricing Information */}
                <div>
                  <p className="font-medium text-foreground mb-3"><strong>Información del producto:</strong></p>
                  {packageDetails.products_data && Array.isArray(packageDetails.products_data) && packageDetails.products_data.length > 0 ? (
                    <div className="space-y-3">
                      {packageDetails.products_data.map((product: any, index: number) => {
                        const quantity = parseInt(product.quantity || '1');
                        const unitPrice = parseFloat(product.estimatedPrice || '0');
                        const totalPrice = quantity * unitPrice;
                        const adminTip = parseFloat(product.adminAssignedTip || '0');
                        const isPersonalOrder = product.requestType === 'personal';
                        
                        return (
                          <div key={index} className="border border-muted rounded-lg p-3 bg-muted/20">
                            
                            {isPersonalOrder ? (
                              /* Vista para pedidos personales */
                              <div className="space-y-3">
                                {/* Descripción */}
                                {product.itemDescription && (
                                  <div>
                                    <p className="text-sm font-medium text-foreground"><strong>Descripción:</strong></p>
                                    <p className="text-sm text-foreground">{product.itemDescription}</p>
                                  </div>
                                )}
                                
                                {/* Instrucción */}
                                {product.instructions && (
                                  <div>
                                    <p className="text-sm font-medium text-foreground"><strong>Instrucciones de compra:</strong></p>
                                    <p className="text-sm text-foreground">{product.instructions}</p>
                                  </div>
                                )}
                                
                                {/* Peso */}
                                {product.weight && (
                                  <div>
                                    <p className="text-sm font-medium text-foreground"><strong>Peso estimado:</strong></p>
                                    <p className="text-sm text-foreground">{product.weight} kg</p>
                                  </div>
                                )}
                                
                                {/* Fotos del paquete */}
                                {product.productPhotos && product.productPhotos.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-foreground mb-2"><strong>Fotos del producto:</strong></p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {product.productPhotos.map((photo: any, photoIndex: number) => (
                                        <ResolvedImage 
                                          key={photoIndex}
                                          src={photo}
                                          alt={`Foto ${photoIndex + 1} del producto`}
                                          className="w-full h-24 object-cover rounded border border-muted cursor-pointer hover:opacity-80 transition-opacity"
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
                                  </div>
                                )}
                                
                                {/* Precio */}
                                <div className="flex justify-between items-center pt-2 border-t">
                                  <p className="text-sm text-foreground font-medium">
                                    <strong>Precio estimado:</strong> ${unitPrice.toFixed(2)}
                                  </p>
                                  {adminTip > 0 && isTravelerContext && (
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-green-600">Q{adminTip.toFixed(2)}</p>
                                      <p className="text-xs text-muted-foreground">Tip asignado</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* Vista para pedidos online normales */
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                                <div className="text-sm text-foreground space-y-2 flex-1 min-w-0">
                                  <p><strong>Precio unitario:</strong> ${unitPrice.toFixed(2)}</p>
                                  <p><strong>Cantidad:</strong> {quantity} unidad{quantity !== 1 ? 'es' : ''}</p>
                                  {quantity > 1 && (
                                    <p className="text-sm text-primary font-medium">
                                      ${unitPrice.toFixed(2)} × {quantity} = <strong>${totalPrice.toFixed(2)}</strong>
                                    </p>
                                  )}
                                  {(product.itemLink || packageDetails.item_link) && (
                                    <div className="pt-1 pb-1">
                                      <a 
                                        href={product.itemLink || packageDetails.item_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Ver producto en tienda
                                      </a>
                                    </div>
                                  )}
                                  <p className="text-sm text-foreground font-medium">
                                    <strong>Total del producto:</strong> ${totalPrice.toFixed(2)}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  {adminTip > 0 ? (
                                    <div>
                                      {isTravelerContext ? (
                                        <>
                                          <p className="text-lg font-bold text-green-600">Q{adminTip.toFixed(2)}</p>
                                          <p className="text-xs text-muted-foreground">Tip asignado</p>
                                        </>
                                      ) : (
                                        <></>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">Sin tip</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Total general si hay múltiples productos */}
                      {packageDetails.products_data.length > 1 && (
                        <div className="border-t pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-foreground">
                              <strong>Total del pedido:</strong> ${packageDetails.products_data.reduce((sum: number, product: any) => {
                                const quantity = parseInt(product.quantity || '1');
                                const unitPrice = parseFloat(product.estimatedPrice || '0');
                                return sum + quantity * unitPrice;
                              }, 0).toFixed(2)}
                            </p>
                          </div>
                          {displayAmount && (
                            <div className="flex justify-between items-center mt-1">
                              {isTravelerContext ? (
                                <>
                                  <p className="font-medium text-green-600">Tip total:</p>
                                  <p className="text-lg font-bold text-green-600">Q{displayAmount.toFixed(2)}</p>
                                </>
                              ) : (
                                <></>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-foreground">
                        <p><strong>Precio unitario:</strong> ${packageDetails.estimated_price}</p>
                        <p><strong>Cantidad:</strong> 1 unidad</p>
                      </div>
                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-lg font-bold text-primary">${packageDetails.estimated_price}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        {displayAmount && (
                          <div>
                            {isTravelerContext ? (
                              <>
                                <p className="text-lg font-bold text-green-600">Q{displayAmount.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">Tip asignado</p>
                              </>
                            ) : (
                              <></>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                {packageDetails.additional_notes && (
                  <div>
                    <p className="font-medium text-foreground mb-2"><strong>Notas adicionales:</strong></p>
                    <p className="text-foreground leading-relaxed">{packageDetails.additional_notes}</p>
                  </div>
                )}
              </div>
            </div>
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

          {/* Admin Assigned Tip Display - When traveler needs to accept/reject */}
          {displayAmount && isTravelerContext && <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-2 mb-3">
                <Package className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-base sm:text-sm font-semibold text-green-800">💰 Tip</p>
              </div>
              <div className="text-sm sm:text-sm ml-7 space-y-2">
                <div className="bg-background/80 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-700 mb-2">Q{displayAmount.toFixed(2)}</p>
                  <p className="text-green-600 font-medium">
                    Este es el tip que ganarás si aceptas llevar este paquete.
                  </p>
                  {(['payment_confirmed', 'pending_purchase', 'purchase_confirmed', 'paid', 'shipped', 'in_transit', 'received_by_traveler', 'delivered', 'delivered_to_office'].includes(packageDetails.status || '')) && (
                    <p className="text-blue-600 font-medium text-sm mt-2">
                      ✅ Este paquete ya fue pagado. Al aceptar, procederás directamente a la compra.
                    </p>
                  )}
                </div>
              </div>
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

          {/* Message for admin assigned tip acceptance */}
          {displayAmount && <div className="space-y-4">
              <div className="max-w-full overflow-hidden">{/* Reduce width and prevent overflow */}
                <Label htmlFor="message">Mensaje adicional (opcional)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {isTravelerContext ? "Mensaje para el shopper:" : "Mensaje para el viajero:"}
                </p>
                <Textarea 
                  id="message" 
                  placeholder="Escribe un mensaje para el shopper..." 
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
            </div>}

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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">            
            {!existingQuote ? <>
                <Button variant="destructive" onClick={handleReject} className="flex-1 sm:flex-none">
                  Rechazar Pedido
                </Button>
                <Button onClick={handleSubmit} disabled={!displayAmount && !price} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white">
                  {displayAmount ? isTravelerContext ? `Aceptar Tip Q${displayAmount.toFixed(2)}` : `Aceptar Cotización Q${displayAmount.toFixed(2)}` : 'Enviar Cotización'}
                </Button>
              </> : <>
                {!showRejectionForm ? <>
                    <Button variant="destructive" onClick={handleReject} className="flex-1 sm:flex-none">
                      Rechazar
                    </Button>
                    <Button variant="default" onClick={handleSubmit} disabled={userType === 'user' && (!acceptedTerms || !confirmedDeliveryTime) || isQuoteExpired} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:opacity-50">
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
        </div>
        
        {/* Terms and Conditions Modal */}
        <TermsAndConditionsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
        
        {/* Prime Modal */}
        <PrimeModal
          isOpen={showPrimeModal}
          onClose={() => setShowPrimeModal(false)}
          user={profile}
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