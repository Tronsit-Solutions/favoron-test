
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Package, DollarSign, MessageSquare } from "lucide-react";

interface QuoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quote: { price: number; message: string; serviceFee?: number }) => void;
  packageDetails: {
    itemDescription: string;
    estimatedPrice: string;
    deliveryAddress?: any;
  };
  userType: 'traveler' | 'shopper';
  existingQuote?: {
    price: number;
    message: string;
    serviceFee?: number;
  };
}

const QuoteDialog = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  packageDetails, 
  userType,
  existingQuote 
}: QuoteDialogProps) => {
  const [price, setPrice] = useState(existingQuote?.price || 0);
  const [serviceFee, setServiceFee] = useState(existingQuote?.serviceFee || 0);
  const [message, setMessage] = useState(existingQuote?.message || '');

  const handleSubmit = () => {
    if (price > 0) {
      onSubmit({ price, message, serviceFee });
      onClose();
      // Reset form
      setPrice(0);
      setServiceFee(0);
      setMessage('');
    }
  };

  const handleAccept = () => {
    onSubmit({ price: 0, message: 'accepted' });
    onClose();
  };

  const handleReject = () => {
    onSubmit({ price: 0, message: 'rejected' });
    onClose();
  };

  const totalCost = price + serviceFee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span>
              {userType === 'traveler' ? 'Enviar Cotización' : 'Revisar Cotización'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {userType === 'traveler' 
              ? 'Envía tu precio para traer este paquete' 
              : 'Revisa la cotización del viajero'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Package Info */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <Package className="h-4 w-4 text-primary mt-1" />
                <div>
                  <h4 className="font-medium mb-1">Paquete solicitado:</h4>
                  <p className="text-sm text-muted-foreground">{packageDetails.itemDescription}</p>
                  <p className="text-sm font-medium">Precio estimado: ${packageDetails.estimatedPrice}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {userType === 'traveler' ? (
            // Traveler form to send quote
            <div className="space-y-4">
              <div>
                <Label htmlFor="quotePrice">Tu precio por el servicio ($)</Label>
                <Input
                  id="quotePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price || ''}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 25.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Precio por traer el paquete (sin incluir el costo del producto)
                </p>
              </div>

              <div>
                <Label htmlFor="serviceFee">Costos adicionales ($) - Opcional</Label>
                <Input
                  id="serviceFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceFee || ''}
                  onChange={(e) => setServiceFee(parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 5.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Hotel charges, extra handling, etc.
                </p>
              </div>

              {(price > 0 || serviceFee > 0) && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-green-800">
                      Costo total del servicio: ${totalCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-green-600">
                      + Costo del producto (${packageDetails.estimatedPrice})
                    </p>
                  </CardContent>
                </Card>
              )}

              <div>
                <Label htmlFor="quoteMessage">Mensaje adicional</Label>
                <Textarea
                  id="quoteMessage"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ej: Mi hotel cobra $5 por cada paquete recibido, incluido en el precio..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={price <= 0}>
                Enviar Cotización
              </Button>
            </div>
          ) : (
            // Shopper view to accept/reject quote
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Cotización recibida:</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Servicio de traslado:</span>
                    <span className="font-medium">${existingQuote?.price || 0}</span>
                  </div>
                  
                  {(existingQuote?.serviceFee || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Costos adicionales:</span>
                      <span className="font-medium">${existingQuote?.serviceFee}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Total del servicio:</span>
                    <span>${((existingQuote?.price || 0) + (existingQuote?.serviceFee || 0)).toFixed(2)}</span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    + Costo del producto (${packageDetails.estimatedPrice}) = Total a pagar
                  </p>
                </div>

                {existingQuote?.message && (
                  <div className="mt-3 p-3 bg-muted rounded">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Mensaje del viajero:</p>
                        <p className="text-sm text-muted-foreground">{existingQuote.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleReject} className="flex-1">
                  Rechazar
                </Button>
                <Button onClick={handleAccept} className="flex-1">
                  Aceptar Cotización
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteDialog;
