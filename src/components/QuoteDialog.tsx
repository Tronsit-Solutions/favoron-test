import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Package, MapPin, ExternalLink, X, FileText, AlertTriangle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePersistedFormState } from "@/hooks/usePersistedFormState";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import QuoteCountdown from "./dashboard/QuoteCountdown";
import { REJECTION_REASONS } from "@/lib/constants";
import QuoteActionsForm from "./forms/QuoteActionsForm";
import { formatCurrency } from "@/lib/formatters";
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
const QuoteDialog = ({
  isOpen,
  onClose,
  onSubmit,
  packageDetails,
  userType,
  existingQuote,
  tripDates
}: QuoteDialogProps) => {
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
      acceptedTerms: false
    },
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    encrypt: true // Encrypt since this contains financial data
  });

  // Local state for UI components that don't need persistence
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Destructure form state for easier access
  const { price, message, rejectionReason, wantsRequote, additionalComments, acceptedTerms } = formState;

  // Helper functions to update form state
  const updateFormField = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  // Clear persisted state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      // Clear state when modal is closed unless form has content
      const hasContent = formState.price || formState.message || formState.acceptedTerms;
      if (!hasContent) {
        clearPersistedState();
      }
    }
  }, [isOpen, formState.price, formState.message, formState.acceptedTerms, clearPersistedState]);
  const isMobile = useIsMobile();
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
      // Shopper sees quote total (already includes 1.4x multiplier)
      return parseFloat(existingQuote.totalPrice || existingQuote.price || '0');
    }
    if (adminTipAmount && isShopperViewingQuote) {
      // If shopper is viewing admin assigned tip as quote, show 1.4x
      return adminTipAmount * 1.4;
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
      onSubmit({
        message: 'accepted'
      });
    } else if (isAdminAssignedTip) {
      // Traveler accepting admin assigned tip
      const basePrice = parseFloat(packageDetails.admin_assigned_tip);
      const deliveryFee = packageDetails.delivery_method === 'delivery' ? 25 : 0;
      const totalWithFee = basePrice * 1.4 + deliveryFee;
      clearPersistedState(); // Clear form data on successful submission
      onSubmit({
        price: basePrice,
        serviceFee: 0,
        totalPrice: totalWithFee,
        message: message || '',
        adminAssignedTipAccepted: true
      });
    } else {
      const basePrice = parseFloat(price);
      // Add 40% Favorón fee automatically + Q25 delivery if applicable
      const deliveryFee = packageDetails.delivery_method === 'delivery' ? 25 : 0;
      const totalWithFee = basePrice * 1.4 + deliveryFee;
      clearPersistedState(); // Clear form data on successful submission
      onSubmit({
        price: basePrice,
        serviceFee: 0,
        totalPrice: totalWithFee,
        message
      });
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
        {/* Close button in top right - larger for mobile */}
        <button onClick={onClose} className="absolute right-3 top-3 rounded-full p-2 opacity-70 bg-background border shadow-sm transition-all hover:opacity-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10">
          <X className="h-5 w-5" />
          <span className="sr-only">Cerrar</span>
        </button>

        <DialogHeader className="pr-12 pb-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-left">
            {isTravelerContext ? '💰 Tip Asignado por Favorón' : !existingQuote ? '💰 Enviar Cotización' : '✅ Responder Cotización'}
          </DialogTitle>
          <DialogDescription className="text-base sm:text-sm text-muted-foreground leading-relaxed">
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
            <div className="text-sm sm:text-sm ml-4 sm:ml-7 space-y-2 overflow-x-hidden">{/* Reduce left margin and force no overflow */}
                <div className="bg-background/80 rounded-lg p-2 max-w-full break-words">{/* Add break-words for long text */}
                <p className="font-medium text-foreground"><strong>Producto:</strong></p>
                <p className="text-muted-foreground leading-relaxed">{packageDetails.item_description}</p>
              </div>
              <div className="bg-background/80 rounded-lg p-2 max-w-full overflow-hidden">{/* Add overflow control */}
                <div className="w-full space-y-2">{/* Remove flex-1 and make full width */}
                  <p className="font-medium text-foreground mb-2"><strong>Información de precios:</strong></p>
                  {packageDetails.products_data && Array.isArray(packageDetails.products_data) && packageDetails.products_data.length > 0 ? <div className="space-y-2">
                      {packageDetails.products_data.map((product: any, index: number) => {
                    const quantity = parseInt(product.quantity || '1');
                    const unitPrice = parseFloat(product.estimatedPrice || '0');
                    const totalPrice = quantity * unitPrice;

                    // Always use adminAssignedTip from products_data
                    const adminTip = parseFloat(product.adminAssignedTip || '0');
                    return <div key={index} className="bg-muted/30 rounded p-2 max-w-full overflow-hidden">{/* Add overflow control */}
                            <p className="text-sm font-medium text-foreground mb-2">
                              Producto {index + 1}: {product.itemDescription}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">{/* Stack vertically on mobile */}
                              <div className="text-sm text-muted-foreground space-y-1 flex-1 min-w-0">{/* Add min-width 0 to prevent overflow */}
                                <p><strong>Precio unitario:</strong> ${unitPrice.toFixed(2)}</p>
                                <p><strong>Cantidad:</strong> {quantity} unidad{quantity !== 1 ? 'es' : ''}</p>
                                {quantity > 1 && <p className="text-primary font-medium">
                                    ${unitPrice.toFixed(2)} × {quantity} = <strong>${totalPrice.toFixed(2)}</strong>
                                  </p>}
                                {product.itemLink && (
                                  <p>
                                    <strong>Link:</strong>{' '}
                                    <a 
                                      href={product.itemLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline break-all"
                                    >
                                      Ver producto
                                    </a>
                                  </p>
                                )}
                                <p className="text-foreground font-medium">
                                  <strong>Total del producto:</strong> ${totalPrice.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">{/* Prevent shrinking on mobile */}
                                {adminTip > 0 ? <div>
                                    {isTravelerContext ?
                            // Traveler sees base tip
                            <>
                                        <p className="text-lg font-bold text-green-600">Q{adminTip.toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground">Tip asignado</p>
                                      </> :
                            // Shopper sees quote amount (tip × 1.4)
                            <>
                                      </>}
                                  </div> : <p className="text-sm text-muted-foreground">Sin tip</p>}
                              </div>
                            </div>
                          </div>;
                  })}
                      
                      {/* Total general si hay múltiples productos */}
                      {packageDetails.products_data.length > 1 && <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-foreground">
                              <strong>Total del pedido:</strong> ${packageDetails.products_data.reduce((sum: number, product: any) => {
                          const quantity = parseInt(product.quantity || '1');
                          const unitPrice = parseFloat(product.estimatedPrice || '0');
                          return sum + quantity * unitPrice;
                        }, 0).toFixed(2)}
                            </p>
                          </div>
                          {displayAmount && <div className="flex justify-between items-center mt-1">
                              {isTravelerContext ? <>
                                  <p className="font-medium text-green-600">Tip total:</p>
                                  <p className="text-lg font-bold text-green-600">Q{displayAmount.toFixed(2)}</p>
                                </> : <>
                                </>}
                            </div>}
                        </div>}
                    </div> : <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Precio unitario:</strong> ${packageDetails.estimated_price}</p>
                        <p><strong>Cantidad:</strong> 1 unidad</p>
                      </div>
                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-lg font-bold text-primary">${packageDetails.estimated_price}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        {displayAmount && <div>
                            {isTravelerContext ? <>
                                <p className="text-lg font-bold text-green-600">Q{displayAmount.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">Tip asignado</p>
                              </> : <>
                              </>}
                          </div>}
                      </div>
                    </div>}
                </div>
              </div>
              {packageDetails.item_link && <div className="bg-background/80 rounded-lg p-2">
                  <p className="font-medium text-foreground mb-1"><strong>Enlace del producto:</strong></p>
                  <a href={packageDetails.item_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                    <ExternalLink className="h-4 w-4" />
                    Ver producto
                  </a>
                </div>}
              {packageDetails.additional_notes && <div className="bg-background/80 rounded-lg p-2">
                  <p className="font-medium text-foreground mb-1"><strong>Notas adicionales:</strong></p>
                  <p className="text-muted-foreground leading-relaxed">{packageDetails.additional_notes}</p>
                </div>}
            </div>
          </div>

          {/* IMPORTANT INFO - Show for shoppers viewing quotes */}
          {existingQuote && tripDates && <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 shadow-md">
              <div className="flex items-start space-x-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 animate-pulse" />
                <p className="text-sm font-medium text-amber-800">📋 Información importante previo a aceptar cotización:</p>
              </div>
              <div className="text-sm text-amber-700 ml-6 space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span><strong>Primera fecha para recibir paquetes:</strong> {new Date(tripDates.first_day_packages).toLocaleDateString('es-GT')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span><strong>Última fecha para recibir paquetes:</strong> {new Date(tripDates.last_day_packages).toLocaleDateString('es-GT')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span><strong>Fecha de entrega del viajero:</strong> {new Date(tripDates.delivery_date).toLocaleDateString('es-GT')}</span>
                </div>
                {(packageDetails.traveler_address?.postalCode || existingQuote?.traveler_postal_code) && <div className="flex items-center space-x-2">
                    <MapPin className="h-3 w-3" />
                    <span><strong>Código postal del viajero:</strong> {packageDetails.traveler_address?.postalCode || existingQuote?.traveler_postal_code}</span>
                  </div>}
              </div>
            </div>}

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
                       <strong>Total a pagar:</strong> {formatCurrency(parseFloat(existingQuote.totalPrice || '0'))}
                     </p>
                    <p className="text-xs text-green-600 mt-1">
                      Este precio incluye todos los servicios: plataforma Favorón, seguro y compensación del viajero.
                      {packageDetails.delivery_method === 'delivery' && ' Incluye costo de envío a domicilio.'}
                    </p>
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      Tú eres el encargado de hacer la compra del producto y la cotización no incluye el precio de tu producto.
                    </p>
                  </div>
                </div>
              </div>
              
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
                    <Input id="price" type="number" placeholder="0.00" value={price} onChange={e => updateFormField('price', e.target.value)} className="pl-8 w-32" style={{
                  fontFamily: 'Arial, sans-serif'
                }} required />
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Asegúrate de considerar cualquier costo adicional por recibir el paquete (algunos hoteles cobran por este servicio)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="message">Mensaje (opcional)</Label>
                  <Textarea id="message" placeholder="Añade cualquier información adicional..." value={message} onChange={e => updateFormField('message', e.target.value)} rows={3} />
                </div>
              </div>
            </div>}

          {/* Message for admin assigned tip acceptance */}
          {displayAmount && <div className="space-y-4">
              <div className="max-w-full overflow-hidden">{/* Reduce width and prevent overflow */}
                <Label htmlFor="message">Mensaje adicional (opcional)</Label>
                <p className="text-sm text-muted-foreground mb-2">Mensaje para el viajero:</p>
                <Textarea id="message" placeholder="Escribe un mensaje para el shopper..." value={message} onChange={e => updateFormField('message', e.target.value)} rows={3} />
              </div>
            </div>}

          {/* Terms and Conditions Checkbox - Only for shoppers accepting quotes */}
          {existingQuote && userType === 'user' && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                    <Button variant="default" onClick={handleSubmit} disabled={userType === 'user' && !acceptedTerms || isQuoteExpired} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:opacity-50">
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
      </DialogContent>
    </Dialog>;
};
export default QuoteDialog;