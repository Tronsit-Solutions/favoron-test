import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { MetaPixel } from '@/lib/metaPixel';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('payment');
  const packageId = searchParams.get('package_id');
  const amount = searchParams.get('amount');
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'verified' | 'failed' | null>(null);
  
  useEffect(() => {
    // Track purchase event on success
    if (status === 'success') {
      const purchaseAmount = amount ? parseFloat(amount) : 0;
      MetaPixel.trackPurchase(purchaseAmount, 'GTQ', packageId || undefined);

      // Verify payment with Recurrente API as fallback
      if (packageId) {
        setVerificationStatus('verifying');
        supabase.functions.invoke('verify-recurrente-payment', {
          body: { package_id: packageId }
        }).then(({ data, error }) => {
          if (error) {
            console.error('Payment verification error:', error);
            setVerificationStatus('failed');
          } else {
            console.log('Payment verification result:', data);
            setVerificationStatus(data?.verified || data?.already_verified ? 'verified' : 'failed');
          }
        });
      }
    }

    // Send message to parent (iframe)
    if (window.parent !== window) {
      console.log('Sending postMessage to parent:', { status, packageId });
      window.parent.postMessage({
        type: status === 'success' ? 'payment_success' : 'payment_cancelled',
        status: status,
        package_id: packageId
      }, window.location.origin);
    } else {
      // If not in iframe, redirect to dashboard after delay
      const timer = setTimeout(() => {
        navigate(`/dashboard?tab=packages&payment=${status}&package_id=${packageId}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, packageId, amount, navigate]);

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background">
      <div className="text-center p-8 max-w-md">
        {isSuccess ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-700 mb-2">¡Pago Exitoso!</h1>
            <p className="text-muted-foreground">Tu pago ha sido procesado correctamente.</p>
            {verificationStatus === 'verifying' && (
              <p className="text-sm text-muted-foreground mt-2">Verificando pago...</p>
            )}
            {verificationStatus === 'verified' && (
              <p className="text-sm text-green-600 mt-2">Pago verificado ✓</p>
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
