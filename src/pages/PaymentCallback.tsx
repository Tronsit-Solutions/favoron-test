import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { MetaPixel } from '@/lib/metaPixel';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 3000;

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('payment');
  const packageId = searchParams.get('package_id');
  const amount = searchParams.get('amount');
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'verified' | 'failed' | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const verifyPayment = useCallback(async () => {
    if (!packageId) return;
    
    setVerificationStatus('verifying');
    const { data, error } = await supabase.functions.invoke('verify-recurrente-payment', {
      body: { package_id: packageId }
    });

    if (error) {
      console.error('Payment verification error:', error);
      setVerificationStatus('failed');
      return false;
    }

    console.log('Payment verification result:', data);
    if (data?.verified || data?.already_verified) {
      setVerificationStatus('verified');
      return true;
    }
    
    setVerificationStatus('failed');
    return false;
  }, [packageId]);

  useEffect(() => {
    if (status !== 'success' || !packageId) return;

    const purchaseAmount = amount ? parseFloat(amount) : 0;
    MetaPixel.trackPurchase(purchaseAmount, 'GTQ', packageId || undefined);

    // Start verification with polling
    let attempt = 0;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      
      const verified = await verifyPayment();
      attempt++;
      setRetryCount(attempt);

      if (!verified && attempt < MAX_RETRIES && !cancelled) {
        setTimeout(poll, RETRY_INTERVAL);
      }
    };

    poll();

    return () => { cancelled = true; };
  }, [status, packageId, amount, verifyPayment]);

  useEffect(() => {
    // Send message to parent (iframe)
    if (window.parent !== window) {
      console.log('Sending postMessage to parent:', { status, packageId });
      window.parent.postMessage({
        type: status === 'success' ? 'payment_success' : 'payment_cancelled',
        status: status,
        package_id: packageId
      }, window.location.origin);
    } else if (verificationStatus === 'verified' || status !== 'success') {
      // Redirect after verified or if cancelled
      const timer = setTimeout(() => {
        navigate(`/dashboard?tab=packages&payment=${status}&package_id=${packageId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, packageId, navigate, verificationStatus]);

  const isSuccess = status === 'success';

  const handleManualRetry = () => {
    setRetryCount(0);
    verifyPayment();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background">
      <div className="text-center p-8 max-w-md">
        {isSuccess ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-700 mb-2">¡Pago Exitoso!</h1>
            <p className="text-muted-foreground">Tu pago ha sido procesado correctamente.</p>
            {verificationStatus === 'verifying' && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verificando pago... (intento {retryCount}/{MAX_RETRIES})</span>
              </div>
            )}
            {verificationStatus === 'verified' && (
              <p className="text-sm text-green-600 mt-3">Pago verificado ✓</p>
            )}
            {verificationStatus === 'failed' && retryCount >= MAX_RETRIES && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-amber-600">
                  La verificación automática no pudo completarse, pero tu pago fue recibido. Será procesado en breve.
                </p>
                <Button variant="outline" size="sm" onClick={handleManualRetry} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reintentar verificación
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-700 mb-2">Pago Cancelado</h1>
            <p className="text-muted-foreground">El pago ha sido cancelado.</p>
          </>
        )}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Redirigiendo...</span>
        </div>
      </div>
    </div>
  );
}
