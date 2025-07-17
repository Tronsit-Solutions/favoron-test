import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Package, MapPin, ExternalLink } from "lucide-react";
import { useState } from "react";

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

  const handleSubmit = () => {
    if (existingQuote) {
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {!existingQuote ? 'Enviar Cotización' : 'Responder Cotización'}
          </DialogTitle>
          <DialogDescription>
            {!existingQuote 
              ? 'Proporciona tu cotización para este Favorón'
              : 'Revisa la cotización del viajero'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Package Details */}
          <div className="bg-muted/50 border rounded-lg p-4">
            <div className="flex items-start space-x-2 mb-2">
              <Package className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-sm font-medium text-primary">Detalles del Favorón:</p>
            </div>
            <div className="text-sm ml-6 space-y-2">
              <p><strong>Producto:</strong> {packageDetails.item_description}</p>
              <p><strong>Precio estimado:</strong> ${packageDetails.estimated_price}</p>
              {packageDetails.item_link && (
                <p><strong>Enlace del producto:</strong> <a 
                  href={packageDetails.item_link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline"
                >
                  Ver producto
                </a></p>
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
                            <p><strong>Cotización del viajero:</strong> Q{baseTotal.toFixed(2)}</p>
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
                    className="pl-8"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                    required
                  />
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Incluye gastos extras como hospedaje si necesitas quedarte una noche adicional para recibir el paquete
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
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            
            {!existingQuote ? (
              <div className="space-x-2">
                <Button variant="destructive" onClick={handleReject}>
                  Rechazar Pedido
                </Button>
                <Button onClick={handleSubmit} disabled={!price}>
                  Enviar Cotización
                </Button>
              </div>
            ) : (
              <div className="space-x-2">
                {!showRejectionForm ? (
                  <>
                    <Button variant="destructive" onClick={handleReject}>
                      Rechazar
                    </Button>
                    <Button variant="success" onClick={handleSubmit}>
                      Aceptar Cotización
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setShowRejectionForm(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleReject}
                      disabled={!rejectionReason.trim()}
                    >
                      Confirmar Rechazo
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteDialog;
