import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Package, MapPin, ExternalLink, X, FileText } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import TermsAndConditionsModal from "./TermsAndConditionsModal";

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
  const [price, setPrice] = useState(existingQuote?.price || '');
  const [message, setMessage] = useState(existingQuote?.message || '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const isMobile = useIsMobile();

  const isQuoteExpired = packageDetails.quote_expires_at && new Date(packageDetails.quote_expires_at) < new Date();

  const handleSubmit = () => {
    if (existingQuote) {
      if (isQuoteExpired) {
        return; // Prevent submission if quote is expired
      }
      onSubmit({ message: 'accepted' });
    } else {
      const basePrice = parseFloat(price);
      // Add 40% Favorón fee automatically
      const totalWithFee = basePrice * 1.4;
      
      onSubmit({
        price: basePrice,
        serviceFee: 0,
        totalPrice: totalWithFee,
        message
      });
    }
  };

  const handleReject = () => {
    // If we're viewing an existing quote (not sending one), ask for rejection reason
    if (existingQuote && !rejectionReason.trim()) {
      setShowRejectionForm(true);
      return;
    }
    onSubmit({ 
      message: 'rejected',
      rejectionReason: existingQuote ? rejectionReason : undefined
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[85vh] m-2 p-3 rounded-lg' : 'sm:max-w-2xl max-w-[98vw] max-h-[92vh] m-1 sm:m-4'} overflow-y-auto p-4 sm:p-6`}>
        {/* Close button in top right - larger for mobile */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 opacity-70 bg-background border shadow-sm transition-all hover:opacity-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Cerrar</span>
        </button>

        <DialogHeader className="pr-12 pb-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-left">
            {!existingQuote ? '💰 Enviar Cotización' : '✅ Responder Cotización'}
          </DialogTitle>
          <DialogDescription className="text-base sm:text-sm text-muted-foreground leading-relaxed">
            {!existingQuote 
              ? 'Proporciona tu mejor cotización para este Favorón'
              : 'Revisa los detalles y responde a la cotización del viajero'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Package Details */}
          <div className="bg-muted/50 border rounded-lg p-2 sm:p-3">
            <div className="flex items-start space-x-2 mb-3">
              <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-base sm:text-sm font-semibold text-primary">📦 Detalles del Favorón</p>
            </div>
            <div className="text-sm sm:text-sm ml-7 space-y-0.5">
              <div className="bg-background/80 rounded-lg p-2">
                <p className="font-medium text-foreground"><strong>Producto:</strong></p>
                <p className="text-muted-foreground leading-relaxed">{packageDetails.item_description}</p>
              </div>
              <div className="bg-background/80 rounded-lg p-2 flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-2"><strong>Información de precios:</strong></p>
                  {packageDetails.products_data && Array.isArray(packageDetails.products_data) && packageDetails.products_data.length > 0 ? (
                    <div className="space-y-2">
                      {packageDetails.products_data.map((product: any, index: number) => {
                        const quantity = parseInt(product.quantity || '1');
                        const unitPrice = parseFloat(product.estimatedPrice || '0');
                        const totalPrice = quantity * unitPrice;
                        
                        return (
                          <div key={index} className="bg-muted/30 rounded p-2">
                            <p className="text-sm font-medium text-foreground mb-1">
                              Producto {index + 1}: {product.itemDescription}
                            </p>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-muted-foreground">
                                <p><strong>Precio unitario:</strong> ${unitPrice.toFixed(2)}</p>
                                <p><strong>Cantidad:</strong> {quantity} unidad{quantity !== 1 ? 'es' : ''}</p>
                                {quantity > 1 && (
                                  <p className="text-primary font-medium">
                                    ${unitPrice.toFixed(2)} × {quantity} = <strong>${totalPrice.toFixed(2)}</strong>
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">${totalPrice.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">Subtotal</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Total general si hay múltiples productos */}
                      {packageDetails.products_data.length > 1 && (
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-foreground">Total del pedido:</p>
                            <p className="text-xl font-bold text-primary">
                              ${packageDetails.products_data.reduce((sum: number, product: any) => {
                                const quantity = parseInt(product.quantity || '1');
                                const unitPrice = parseFloat(product.estimatedPrice || '0');
                                return sum + (quantity * unitPrice);
                              }, 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Precio unitario:</strong> ${packageDetails.estimated_price}</p>
                        <p><strong>Cantidad:</strong> {(() => {
                          // Mostrar la cantidad del producto que pidió el shopper
                          if (packageDetails.products_data && Array.isArray(packageDetails.products_data) && packageDetails.products_data.length > 0) {
                            const firstProduct = packageDetails.products_data[0];
                            const qty = parseInt(firstProduct.quantity || '1');
                            return `${qty} unidad${qty !== 1 ? 'es' : ''}`;
                          }
                          return '1 unidad';
                        })()} </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">${(() => {
                          // Calcular total considerando cantidades de products_data
                          if (packageDetails.products_data && Array.isArray(packageDetails.products_data) && packageDetails.products_data.length > 0) {
                            return packageDetails.products_data.reduce((sum: number, product: any) => {
                              const quantity = parseInt(product.quantity || '1');
                              const unitPrice = parseFloat(product.estimatedPrice || packageDetails.estimated_price || '0');
                              return sum + (quantity * unitPrice);
                            }, 0).toFixed(2);
                          }
                          return packageDetails.estimated_price;
                        })()}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {packageDetails.item_link && (
                <div className="bg-background/80 rounded-lg p-2">
                  <p className="font-medium text-foreground mb-1"><strong>Enlace del producto:</strong></p>
                  <a 
                    href={packageDetails.item_link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver producto
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* KEY DATES - Show for shoppers viewing quotes */}
          {existingQuote && tripDates && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2 mb-3">
                <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                <p className="text-sm font-medium text-blue-800">Fechas importantes del viaje:</p>
              </div>
              <div className="text-sm text-blue-700 ml-6 space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span><strong>Fecha límite para enviar paquete:</strong> {new Date(tripDates.last_day_packages).toLocaleDateString('es-GT')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span><strong>Entrega en oficina Favorón:</strong> {new Date(tripDates.delivery_date).toLocaleDateString('es-GT')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Existing Quote Display */}
          {existingQuote && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800 mb-2">Cotización del viajero:</p>
                <div className="text-sm text-green-700 space-y-1">
                  {existingQuote.message && (
                    <p><strong>Mensaje:</strong> "{existingQuote.message}"</p>
                  )}
                  <div className="mt-2 pt-2 border-t border-green-300">
                    {(() => {
                      const baseTotal = parseFloat(existingQuote.totalPrice || 0);
                      const deliveryFee = packageDetails.delivery_method === 'delivery' ? 25 : 0;
                      const finalTotal = baseTotal + deliveryFee;
                      
                      return (
                        <>
                          {deliveryFee > 0 && (
                            <div className="text-xs space-y-1 mb-2">
                              <p><strong>Cotización del viajero, fee Favorón y seguro:</strong> Q{baseTotal.toFixed(2)}</p>
                              <p><strong>Envío a domicilio:</strong> Q{deliveryFee.toFixed(2)}</p>
                            </div>
                          )}
                          <p className="font-medium text-lg">
                            <strong>Total a pagar:</strong> Q{finalTotal.toFixed(2)}
                          </p>
                        </>
                      );
                    })()}
                    <p className="text-xs text-green-600 mt-1">
                      Este precio incluye todos los servicios: plataforma Favorón, seguro y compensación del viajero.
                      {packageDetails.delivery_method === 'delivery' && ' Incluye costo de envío a domicilio.'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Show expiration countdown for shoppers viewing quotes */}
              {packageDetails.quote_expires_at && userType === 'user' && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-warning mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Tiempo para completar el pago</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Esta cotización expira el {new Date(packageDetails.quote_expires_at).toLocaleString('es-GT')}
                  </p>
                  {new Date(packageDetails.quote_expires_at) < new Date() && (
                    <p className="text-sm text-destructive mt-1 font-medium">
                      ⚠️ Esta cotización ha expirado
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quote Form - Show when sending a quote */}
          {!existingQuote && (
            <div className="space-y-4">
              {/* Product Link for Travelers */}
              
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
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-8 w-32"
                    style={{ fontFamily: 'Arial, sans-serif' }}
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
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            </div>
          )}

          {/* Terms and Conditions Checkbox - Only for shoppers accepting quotes */}
          {existingQuote && userType === 'user' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(!!checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="acceptTerms" className="text-sm font-medium text-blue-900 cursor-pointer">
                    Entiendo y acepto los términos y condiciones de Favorón
                  </Label>
                  <p className="text-xs text-blue-700 mt-1">
                    Al aceptar esta cotización, confirmas que has leído y aceptas nuestros términos de servicio.
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => setShowTermsModal(true)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Leer términos y condiciones
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {existingQuote && showRejectionForm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <Label htmlFor="rejectionReason" className="text-red-800 font-medium">
                Razón del rechazo (para administración) *
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explica por qué rechazas esta cotización..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="mt-2"
                required
              />
              <p className="text-xs text-red-600 mt-1">
                Este mensaje será enviado al equipo de Favorón para revisión
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">            
            {!existingQuote ? (
              <>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  className="flex-1 sm:flex-none"
                >
                  Rechazar Pedido
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!price}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                >
                  Enviar Cotización
                </Button>
              </>
            ) : (
              <>
                {!showRejectionForm ? (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={handleReject}
                      className="flex-1 sm:flex-none"
                    >
                      Rechazar
                    </Button>
                    <Button 
                      variant="default"
                      onClick={handleSubmit}
                      disabled={(userType === 'user' && !acceptedTerms) || isQuoteExpired}
                      className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {isQuoteExpired ? 'Cotización Expirada' : 'Aceptar Cotización'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowRejectionForm(false)}
                      className="flex-1 sm:flex-none"
                    >
                      Volver
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleReject}
                      disabled={!rejectionReason.trim()}
                      className="flex-1 sm:flex-none"
                    >
                      Confirmar Rechazo
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Terms and Conditions Modal */}
        <TermsAndConditionsModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default QuoteDialog;
