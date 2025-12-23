import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Building, Shield, CheckCircle, Edit, Eye, Receipt, Package } from "lucide-react";
import { formatCurrency } from "@/utils/priceHelpers";
import { getPackageTipFromQuote } from "@/utils/tipHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useFinancialData } from "@/hooks/useFinancialData";
interface TripBankingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bankingInfo: any) => void;
  amount: number;
  currentBankingInfo: any;
  title?: string;
  description?: string;
  tripId?: string;
  travelerId?: string;
}
const TripBankingConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  currentBankingInfo,
  title = "Confirmación de pago",
  description,
  tripId,
  travelerId
}: TripBankingConfirmationModalProps) => {
  const { financialData, loading: financialLoading } = useFinancialData();
  const [packageBreakdown, setPackageBreakdown] = useState<Array<{
    id: string;
    item_description: string;
    quote?: any;
    status?: string;
    office_delivery?: any;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bankingInfo, setBankingInfo] = useState({
    bank_account_holder: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_type: ''
  });

  // Determinar si tiene información bancaria completa desde la DB
  const hasCompleteBankingInfo = financialData?.bank_account_holder && financialData?.bank_name && financialData?.bank_account_number && financialData?.bank_account_type;

  // Función para obtener paquetes del viajero
  const fetchPackageBreakdown = async () => {
    if (!tripId || !travelerId) return;
    
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('id, item_description, quote, status, office_delivery')
        .eq('matched_trip_id', tripId)
        .in('status', ['delivered_to_office', 'completed', 'ready_for_pickup', 'ready_for_delivery']);
      
      if (error) throw error;
      setPackageBreakdown(data || []);
    } catch (error) {
      console.error('Error fetching package breakdown:', error);
      setPackageBreakdown([]);
    }
  };

  // Establecer modo inicial basado en si tiene información completa
  useEffect(() => {
    setIsEditing(!hasCompleteBankingInfo);
  }, [hasCompleteBankingInfo]);

  // Obtener paquetes cuando se abra el modal
  useEffect(() => {
    if (isOpen) {
      fetchPackageBreakdown();
    }
  }, [isOpen, tripId, travelerId]);

  // Actualizar información cuando cambie la data financiera de la DB
  useEffect(() => {
    if (financialData) {
      setBankingInfo({
        bank_account_holder: financialData.bank_account_holder || '',
        bank_name: financialData.bank_name || '',
        bank_account_number: financialData.bank_account_number || '',
        bank_account_type: financialData.bank_account_type || ''
      });
    }
  }, [financialData]);
  const handleConfirmPayment = async () => {
    console.log('🔍 TripBankingConfirmationModal - handleConfirmPayment called');
    console.log('📋 Banking info:', bankingInfo);
    console.log('✅ Form valid:', isFormValid);
    
    if (!bankingInfo.bank_account_holder || !bankingInfo.bank_name || !bankingInfo.bank_account_number || !bankingInfo.bank_account_type) {
      console.error('❌ Banking info incomplete:', {
        holder: bankingInfo.bank_account_holder,
        bank: bankingInfo.bank_name,
        number: bankingInfo.bank_account_number,
        type: bankingInfo.bank_account_type
      });
      return;
    }
    setLoading(true);
    try {
      console.log('🚀 Calling onConfirm with banking info');
      await onConfirm(bankingInfo);
      console.log('✅ onConfirm completed successfully');
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
    } finally {
      setLoading(false);
    }
  };
  const isFormValid = bankingInfo.bank_account_holder && bankingInfo.bank_name && bankingInfo.bank_account_number && bankingInfo.bank_account_type;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] mx-auto max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {title}
          </DialogTitle>
          {description && <DialogDescription className="text-sm">{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          <div className="space-y-2">
          

          <div className="bg-muted/30 border rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Receipt className="h-3 w-3 text-primary" />
              <span className="font-medium text-xs">Desglose de pago:</span>
            </div>
            
            {/* Desglose estilo factura */}
            <div className="space-y-1 mb-2">
              {packageBreakdown.length > 0 ? (
                (() => {
                  const eligiblePackages = packageBreakdown.filter((pkg) =>
                    pkg.status === 'completed' ||
                    pkg.status === 'ready_for_pickup' ||
                    pkg.status === 'ready_for_delivery' ||
                    (pkg.status === 'delivered_to_office' && pkg.office_delivery && (pkg.office_delivery as any).admin_confirmation)
                  );

                  if (eligiblePackages.length === 0) {
                    return (
                      <div className="text-xs text-muted-foreground py-1">
                        No hay paquetes elegibles para pago aún.
                      </div>
                    );
                  }

                  return eligiblePackages.map((pkg) => {
                    const packageTip = getPackageTipFromQuote(pkg);
                    return (
                      <div key={pkg.id} className="flex justify-between items-start text-xs py-1 border-b border-muted/20 last:border-b-0">
                        <div className="flex items-start gap-1 flex-1 min-w-0">
                          <Package className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs truncate">
                              {pkg.item_description}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Tip ganado por entrega
                            </div>
                          </div>
                        </div>
                        <span className="font-medium text-green-600 ml-2 flex-shrink-0">
                          {formatCurrency(packageTip)}
                        </span>
                      </div>
                    );
                  });
                })()
              ) : packageBreakdown.length === 0 ? (
                <div className="text-xs text-muted-foreground py-1">
                  {tripId ? "No hay paquetes elegibles para este viaje" : "Cargando desglose de paquetes..."}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground py-1">
                  Procesando información de paquetes...
                </div>
              )}
            </div>
            
            {/* Total */}
            <div className="border-t border-muted/40 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">Total a solicitar:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Vista de confirmación - mostrar información guardada */}
          {hasCompleteBankingInfo && !isEditing && <div className="space-y-2">
              <div className="flex items-center gap-1 mb-1">
                <Eye className="h-3 w-3 text-primary" />
                <span className="font-medium text-xs">Información bancaria:</span>
              </div>
              
              <div className="bg-muted/20 border rounded-lg p-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                   <Label className="text-xs text-muted-foreground">Titular</Label>
                    <p className="font-medium truncate text-xs">{financialData?.bank_account_holder}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Banco</Label>
                    <p className="font-medium truncate text-xs">{financialData?.bank_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cuenta</Label>
                    <p className="font-medium truncate text-xs">{financialData?.bank_account_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <p className="font-medium capitalize truncate text-xs">{financialData?.bank_account_type}</p>
                  </div>
                </div>
              </div>
            </div>}

          {/* Vista de edición - formulario de información bancaria */}
          {(!hasCompleteBankingInfo || isEditing) && <div className="space-y-2">
              <div className="flex items-center gap-1 mb-1">
                <Edit className="h-3 w-3 text-primary" />
                <span className="font-medium text-xs">
                  {hasCompleteBankingInfo ? "Editar:" : "Ingresa información:"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="bankAccountHolder" className="text-xs font-medium">
                    Titular
                  </Label>
                  <div className="relative">
                    <CreditCard className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input id="bankAccountHolder" value={bankingInfo.bank_account_holder} onChange={e => setBankingInfo(prev => ({
                    ...prev,
                    bank_account_holder: e.target.value
                  }))} placeholder="Nombre completo" className="pl-8 h-8 text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="bankName" className="text-xs font-medium">
                      Banco
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                      <Input id="bankName" value={bankingInfo.bank_name} onChange={e => setBankingInfo(prev => ({
                      ...prev,
                      bank_name: e.target.value
                    }))} placeholder="ej: BI" className="pl-8 h-8 text-xs" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="bankAccountType" className="text-xs font-medium">
                      Tipo
                    </Label>
                    <Select value={bankingInfo.bank_account_type} onValueChange={value => setBankingInfo(prev => ({
                    ...prev,
                    bank_account_type: value
                  }))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monetaria">Monetaria</SelectItem>
                        <SelectItem value="ahorros">Ahorros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bankAccountNumber" className="text-xs font-medium">
                    Número de cuenta
                  </Label>
                  <Input id="bankAccountNumber" value={bankingInfo.bank_account_number} onChange={e => setBankingInfo(prev => ({
                  ...prev,
                  bank_account_number: e.target.value
                }))} placeholder="Número de cuenta" className="h-8 text-xs" />
                </div>
              </div>
            </div>}
          </div>
        </div>
        
        {/* Fixed Footer with Actions */}
        <div className="flex-shrink-0 border-t pt-4 mt-4">
          {hasCompleteBankingInfo && !isEditing ? <div className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 h-10">
                  Cancelar
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(true)} disabled={loading} className="flex-1 h-10">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
              <Button onClick={handleConfirmPayment} disabled={loading} className="w-full h-10 bg-green-600 hover:bg-green-700">
                {loading ? "Procesando..." : "Crear orden de pago"}
              </Button>
            </div> : <div className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 h-10">
                  Cancelar
                </Button>
                {hasCompleteBankingInfo && <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading} className="flex-1 h-10">
                    Ver guardada
                  </Button>}
              </div>
              <Button onClick={handleConfirmPayment} disabled={loading || !isFormValid} className="w-full h-10 bg-green-600 hover:bg-green-700">
                {loading ? "Procesando..." : "Crear orden de pago"}
              </Button>
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
};
export default TripBankingConfirmationModal;