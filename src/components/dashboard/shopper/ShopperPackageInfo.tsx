import { Package as PackageIcon, MapPin } from "lucide-react";
import { useEffect } from "react";
import { Package } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import PaymentReceiptUpload from "./PaymentReceiptUpload";
import UploadDocuments from "../../UploadDocuments";
interface ShopperPackageInfoProps {
  pkg: Package;
  onPackageUpdate?: (updatedPkg?: Package) => void;
}
const ShopperPackageInfo = ({
  pkg,
  onPackageUpdate
}: ShopperPackageInfoProps) => {
  useEffect(() => {
    const shouldMove = Boolean(pkg.purchase_confirmation) && pkg.status !== 'in_transit' && ['pending_purchase','payment_confirmed','paid'].includes(pkg.status as any);
    if (shouldMove) {
      supabase.from('packages').update({ status: 'in_transit' }).eq('id', pkg.id)
        .then(({ error }) => { if (!error) onPackageUpdate?.({ ...pkg, status: 'in_transit' }); });
    }
  }, [pkg.id, pkg.status, pkg.purchase_confirmation, onPackageUpdate]);
  const renderQuoteInfo = () => {
    if (!pkg.quote) return null;

    // Calculate total with Favorón fee (40%)
    const quote = pkg.quote as any;
    const basePrice = parseFloat(quote?.price || '0');
    const additionalFee = parseFloat(quote?.serviceFee || '0');
    const subtotal = basePrice + additionalFee;
    const totalWithFavoronFee = quote?.totalPrice ? parseFloat(quote.totalPrice) : subtotal * 1.4;
    return <div className="bg-info-muted border border-info-border rounded-lg p-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-info">Cotización recibida:</p>
          <p className="text-lg font-bold text-info">Q{totalWithFavoronFee.toFixed(2)}</p>
        </div>
        <p className="text-xs text-info">
          Este precio ya incluye todo: servicio Favorón + seguro + compensación al viajero.
        </p>
        
      </div>;
  };
  // Comentado - usando ShippingInfoRegistry en su lugar
  // const renderTravelerAddress = () => {
  //   if (!pkg.traveler_address || !['pending_purchase', 'payment_confirmed'].includes(pkg.status)) return null;
  //   return <ShippingInstructions pkg={pkg} />;
  // };
  const renderPaymentUpload = () => {
    console.log('renderPaymentUpload check for package:', pkg.item_description, 'status:', pkg.status, 'shouldRender:', ['payment_pending', 'quote_accepted', 'awaiting_payment'].includes(pkg.status));
    if (!['payment_pending', 'quote_accepted', 'awaiting_payment'].includes(pkg.status)) return null;
    console.log('Rendering PaymentReceiptUpload for package:', pkg.item_description);
    return <div className="mt-2">
        <PaymentReceiptUpload pkg={pkg} onUploadComplete={updatedPkg => {
        // Actualizar solo este paquete específico sin hacer refresh completo
        onPackageUpdate?.(updatedPkg);
      }} />
      </div>;
  };

  const renderDocumentUpload = () => {
    if (!['pending_purchase', 'payment_confirmed', 'in_transit'].includes(pkg.status)) return null;
    return <div className="mt-2">
        <UploadDocuments 
          packageId={pkg.id}
          currentStatus={pkg.status}
          currentConfirmation={pkg.purchase_confirmation}
          currentTracking={pkg.tracking_info}
          onUpload={async (type, data) => {
            console.log('Uploading document:', type, data);
            
            // Guardar en la base de datos según el tipo
            if (type === 'confirmation') {
              const shouldMoveInTransit = ['pending_purchase','payment_confirmed','paid'].includes(pkg.status as any);
              const updateData = { 
                purchase_confirmation: data,
                ...(shouldMoveInTransit ? { status: 'in_transit' } : {})
              };
              const { error } = await supabase
                .from('packages')
                .update(updateData)
                .eq('id', pkg.id);
              
              if (error) {
                console.error('Error saving purchase confirmation:', error);
                return;
              }
            } else if (type === 'tracking') {
              const updateData = {
                tracking_info: data
              };
              const { error } = await supabase
                .from('packages')
                .update(updateData)
                .eq('id', pkg.id);
              if (error) {
                console.error('Error saving tracking info:', error);
                return;
              }
            }
            
            // Actualizar el paquete con los nuevos documentos y posible cambio de status
            const updatedPkg = {
              ...pkg,
              ...(type === 'confirmation' 
                ? { 
                    purchase_confirmation: data,
                    ...(['pending_purchase','payment_confirmed','paid'].includes(pkg.status as any) ? { status: 'in_transit' } : {})
                  } 
                : { tracking_info: data }
              )
            };
            onPackageUpdate?.(updatedPkg);
          }}
        />
      </div>;
  };
  console.log('ShopperPackageInfo rendering for:', pkg.item_description, 'status:', pkg.status);
  return <>
      {renderQuoteInfo()}
      {renderPaymentUpload()}
      {/* Removido renderTravelerAddress() - ahora se usa ShippingInfoRegistry */}
      {['pending_purchase', 'payment_confirmed', 'in_transit'].includes(pkg.status) && renderDocumentUpload()}
    </>;
};
export default ShopperPackageInfo;