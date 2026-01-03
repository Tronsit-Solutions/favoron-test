import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, AlertCircle, CreditCard, ArrowLeft, Shield } from 'lucide-react';
import { useRecurrenteCheckout } from '@/hooks/useRecurrenteCheckout';
import { Package } from '@/types';

interface RecurrenteCheckoutProps {
  pkg: Package;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
  onBack?: () => void;
  isEmbedded?: boolean;
}

export default function RecurrenteCheckout({
  pkg,
  amount,
  onSuccess,
  onCancel,
  onError,
  onBack,
  isEmbedded = false
}: RecurrenteCheckoutProps) {
  const { loading, checkoutUrl, error, createCheckout, resetCheckout } = useRecurrenteCheckout();
  const [checkoutInitiated, setCheckoutInitiated] = useState(false);
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

  // Auto-initiate checkout when embedded
  useEffect(() => {
    if (isEmbedded && !checkoutInitiated && !loading && !checkoutUrl) {
      handleInitiateCheckout();
    }
  }, [isEmbedded]);

  const handleInitiateCheckout = async () => {
    setCheckoutInitiated(true);
    
    const result = await createCheckout({
      packageId: pkg.id,
      userId: pkg.user_id,
      amount,
      itemDescription: getItemDescription()
    });

    if (!result?.checkout_url && error) {
      onError?.(error);
    }
  };

  const handleOpenInNewTab = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCancel = () => {
    resetCheckout();
    setCheckoutInitiated(false);
    if (onBack) {
      onBack();
    } else {
      onCancel?.();
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
          handleCancel();
        } else if (event.data?.type === 'error') {
          onError?.(event.data?.message || 'Error en el pago');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onCancel, onError, resetCheckout, onBack]);

  // Error state
  if (error && !loading) {
    return (
      <div className="space-y-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </Button>
        )}
        <div className="p-4 border border-destructive/30 bg-destructive/5 rounded-lg">
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
                  handleInitiateCheckout();
                }}
              >
                Intentar de nuevo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || (isEmbedded && !checkoutUrl && checkoutInitiated)) {
    return (
      <div className="space-y-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </Button>
        )}
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Conectando con pasarela de pago segura...</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Procesado por Recurrente</span>
          </div>
        </div>
      </div>
    );
  }

  // Checkout iframe view (embedded mode)
  if (checkoutUrl && isEmbedded) {
    return (
      <div className="space-y-4">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Pago seguro</span>
          </div>
        </div>

        {/* Amount reminder */}
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="font-medium">Pago con Tarjeta</span>
          </div>
          <span className="text-lg font-bold text-primary">Q{amount.toFixed(2)}</span>
        </div>

        {/* Iframe container */}
        <div className="relative border rounded-lg overflow-hidden bg-background" style={{ minHeight: '450px' }}>
          <iframe
            ref={iframeRef}
            src={checkoutUrl}
            className="w-full h-full border-0"
            style={{ minHeight: '450px' }}
            allow="payment"
            title="Recurrente Checkout"
          />
        </div>

        {/* Open in new tab option */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            ¿Problemas con el formulario?
          </span>
          <Button variant="outline" size="sm" onClick={handleOpenInNewTab} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Abrir en nueva pestaña
          </Button>
        </div>

        {/* Cancel button */}
        <Button 
          variant="ghost" 
          className="w-full"
          onClick={handleCancel}
        >
          Cancelar y usar otro método
        </Button>
      </div>
    );
  }

  // Initial button view (non-embedded mode)
  if (!isEmbedded && !checkoutInitiated) {
    return (
      <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg space-y-4">
        <div className="flex items-center gap-3">
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
        
        <div className="bg-card rounded-lg p-3">
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

        <p className="text-xs text-center text-muted-foreground">
          🔒 Pago procesado de forma segura por Recurrente
        </p>
      </div>
    );
  }

  return null;
}
