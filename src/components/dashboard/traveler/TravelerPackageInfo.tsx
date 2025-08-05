import { MapPin, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AddressDisplay from "@/components/ui/address-display";
interface TravelerPackageInfoProps {
  pkg: any;
}
const TravelerPackageInfo = ({
  pkg
}: TravelerPackageInfoProps) => {
  const [paymentReceipt, setPaymentReceipt] = useState<any>(null);
  useEffect(() => {
    const fetchPaymentReceipt = async () => {
      console.log('🔍 TravelerPackageInfo - Package ID:', pkg.id, 'Status:', pkg.status);
      if (pkg.status === 'completed' || pkg.status === 'delivered_to_office') {
        try {
          console.log('🔍 TravelerPackageInfo - Fetching payment receipt for package:', pkg.id);
          const {
            data,
            error
          } = await supabase.from('payment_orders').select('receipt_url, receipt_filename, status, amount').eq('trip_id', pkg.matched_trip_id).eq('status', 'completed').single();
          if (!error && data) {
            console.log('🔍 TravelerPackageInfo - Payment receipt found:', data);
            setPaymentReceipt(data);
          } else {
            console.log('🔍 TravelerPackageInfo - No payment receipt found. Error:', error);
          }
        } catch (error) {
          console.error('🔍 TravelerPackageInfo - Error fetching payment receipt:', error);
        }
      }
    };
    fetchPaymentReceipt();
  }, [pkg.id, pkg.status]);
  return <div className="space-y-2">
      {/* Delivery address if confirmed */}
      {pkg.confirmed_delivery_address && (
        <AddressDisplay 
          address={pkg.confirmed_delivery_address}
          title="Dirección de entrega confirmada"
          variant="success"
        />
      )}

      {/* Payment receipt */}
      {paymentReceipt && paymentReceipt.receipt_url && <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  ¡Pago completado! 💰
                </p>
                <p className="text-xs text-green-600">
                  Compensación: ${paymentReceipt.amount?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.open(paymentReceipt.receipt_url, '_blank')} className="border-green-300 text-green-700 hover:bg-green-100">
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver comprobante
            </Button>
          </div>
        </div>}

    </div>;
};
export default TravelerPackageInfo;