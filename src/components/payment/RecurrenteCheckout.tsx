import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, AlertCircle, CreditCard } from 'lucide-react';
import { useRecurrenteCheckout } from '@/hooks/useRecurrenteCheckout';
import { Package } from '@/types';

interface RecurrenteCheckoutProps {
  pkg: Package;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

export default function RecurrenteCheckout({
  pkg,
  amount,
  onSuccess,
  onCancel,
  onError
}: RecurrenteCheckoutProps) {
  const { loading, checkoutUrl, error, createCheckout, resetCheckout } = useRecurrenteCheckout();
  const [checkoutInitiated, setCheckoutInitiated] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Get item description from products_data or item_description
  const getItemDescription = () => {
    const productsData = (pkg.products_data as any[]) || [];
    if (productsData.length > 0) {
      const activeProducts = productsData.filter(p => p.cancelled !== true && p.cancelled !== 'true');
      if (activeProducts.length === 1) {
        return activeProducts[0].itemDescription || activeProducts[0].item_description || pkg.item_description;
      }
      return `${activeProducts.length} productos de Favorón`;
    }
    return pkg.item_description || 'Paquete Favorón';
  };

  const handleInitiateCheckout = async () => {
    setCheckoutInitiated(true);
    
    const result = await createCheckout({
      packageId: pkg.id,
      userId: pkg.user_id,
      amount,
      itemDescription: getItemDescription()
    });

    if (result?.checkout_url) {
      // Open in new tab for better UX (Recurrente checkout works better this way)
      setShowIframe(true);
    } else if (error) {
      onError?.(error);
    }
  };

  const handleOpenInNewTab = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle messages from iframe (if Recurrente supports postMessage)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only process messages from Recurrente domain
      if (event.origin.includes('recurrente.com')) {
        console.log('Recurrente message:', event.data);
        
        if (event.data?.type === 'success' || event.data?.status === 'paid') {
          onSuccess?.();
        } else if (event.data?.type === 'cancel' || event.data?.status === 'cancelled') {
          onCancel?.();
          resetCheckout();
        } else if (event.data?.type === 'error') {
          onError?.(event.data?.message || 'Error en el pago');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onCancel, onError, resetCheckout]);

  if (error && !loading) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Error al procesar el pago</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => {
                  resetCheckout();
                  setCheckoutInitiated(false);
                }}
              >
                Intentar de nuevo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!checkoutInitiated) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Pago con Tarjeta</p>
              <p className="text-sm text-muted-foreground">
                Serás redirigido a nuestra pasarela de pago segura
              </p>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monto a pagar:</span>
              <span className="text-lg font-bold text-primary">Q{amount.toFixed(2)}</span>
            </div>
          </div>

          <Button 
            onClick={handleInitiateCheckout} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparando pago...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar Q{amount.toFixed(2)} con tarjeta
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-3">
            🔒 Pago procesado de forma segura por Recurrente
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Conectando con pasarela de pago...</p>
        </CardContent>
      </Card>
    );
  }

  if (checkoutUrl && showIframe) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Option to open in new tab if iframe doesn't work */}
          <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Completa tu pago en la ventana segura
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleOpenInNewTab}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Abrir en nueva pestaña
            </Button>
          </div>
          
          {/* Iframe for embedded checkout */}
          <div className="relative w-full" style={{ minHeight: '500px' }}>
            <iframe
              ref={iframeRef}
              src={checkoutUrl}
              className="w-full h-full border-0"
              style={{ minHeight: '500px' }}
              allow="payment"
              title="Recurrente Checkout"
            />
          </div>

          {/* Cancel option */}
          <div className="p-3 bg-muted/30 border-t text-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                resetCheckout();
                setCheckoutInitiated(false);
                setShowIframe(false);
                onCancel?.();
              }}
            >
              Cancelar y usar otro método
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
