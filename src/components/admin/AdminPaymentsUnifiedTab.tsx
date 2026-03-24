import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, RotateCcw, Banknote, Clock, FileSpreadsheet } from "lucide-react";
import { usePaymentOrders } from "@/hooks/usePaymentOrders";
import { useAdminRefundOrders } from "@/hooks/useRefundOrders";
import AdminTravelerPaymentsTab from "./AdminTravelerPaymentsTab";
import AdminRefundsTab from "./AdminRefundsTab";
import AdminBankFileTab from "./AdminBankFileTab";
import { formatCurrency } from "@/lib/formatters";

const AdminPaymentsUnifiedTab = () => {
  const [activeSection, setActiveSection] = useState("traveler-payments");
  
  // Get counts for badges
  const { paymentOrders } = usePaymentOrders();
  const { refundOrders } = useAdminRefundOrders();
  
  const pendingTravelerPayments = (paymentOrders || []).filter(o => o?.status === 'pending').length;
  const pendingRefunds = (refundOrders || []).filter(r => r?.status === 'pending').length;
  
  const totalPendingTravelerAmount = (paymentOrders || [])
    .filter(o => o?.status === 'pending')
    .reduce((sum, o) => sum + (o?.amount || 0), 0);
    
  const totalPendingRefundAmount = (refundOrders || [])
    .filter(r => r?.status === 'pending')
    .reduce((sum, r) => sum + (r?.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${activeSection === 'traveler-payments' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setActiveSection('traveler-payments')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pagos a Viajeros</p>
                  <p className="text-2xl font-bold">{pendingTravelerPayments}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Monto pendiente</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPendingTravelerAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${activeSection === 'refunds' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setActiveSection('refunds')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <RotateCcw className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reembolsos</p>
                  <p className="text-2xl font-bold">{pendingRefunds}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Monto pendiente</p>
                <p className="text-lg font-semibold text-orange-600">{formatCurrency(totalPendingRefundAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="traveler-payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagos Viajeros
            {pendingTravelerPayments > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                {pendingTravelerPayments}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reembolsos
            {pendingRefunds > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                {pendingRefunds}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="traveler-payments" className="mt-4">
          <AdminTravelerPaymentsTab />
        </TabsContent>

        <TabsContent value="refunds" className="mt-4">
          <AdminRefundsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPaymentsUnifiedTab;
