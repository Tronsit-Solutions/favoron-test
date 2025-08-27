import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle } from "lucide-react";

interface PaymentsTabProps {
  packages: any[];
  onViewPackageDetail: (pkg: any) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: string, status: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const PaymentsTab = ({ 
  packages, 
  onViewPackageDetail, 
  onUpdateStatus, 
  getStatusBadge 
}: PaymentsTabProps) => {
  const [activeTab, setActiveTab] = useState("pending");

  // Separate payments by status - updated to use payment_pending_approval
  const pendingPayments = packages.filter(pkg => 
    (pkg.status === 'payment_pending_approval' || pkg.status === 'payment_confirmed') && pkg.payment_receipt
  );
  const approvedPayments = packages.filter(pkg => 
    (pkg.status === 'pending_purchase' || pkg.status === 'paid') && pkg.payment_receipt
  );

  const renderPaymentCard = (pkg: any, showConfirmButton: boolean = false) => (
    <Card key={pkg.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2 gap-1 sm:gap-0">
              <h4 className="font-medium truncate pr-2">{pkg.item_description}</h4>
              <div className="flex-shrink-0">
                {getStatusBadge(pkg.status)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Precio: ${pkg.estimated_price} • Usuario: {pkg.user_id}
            </p>
            {pkg.payment_receipt && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="text-xs text-blue-800 font-medium">Comprobante de pago:</p>
                <p className="text-xs text-blue-600 truncate">
                  📄 {pkg.payment_receipt.filename}
                </p>
                <p className="text-xs text-blue-600">
                  📅 Subido: {new Date(pkg.payment_receipt.uploadedAt).toLocaleDateString('es-GT')}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-shrink-0">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onViewPackageDetail(pkg)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Eye className="h-4 w-4 mr-1" />
              <span className="sm:inline">Ver Comprobante</span>
            </Button>
            {showConfirmButton && (
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-xs sm:text-sm"
                onClick={() => onUpdateStatus('package', pkg.id, 'pending_purchase')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="sm:inline">Confirmar Pago</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
              <div className="text-xs text-muted-foreground">Pendientes de Aprobar</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{approvedPayments.length}</div>
              <div className="text-xs text-muted-foreground">Pagos Aprobados</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="relative">
            ⏳ Pendientes de Aprobar
            {pendingPayments.length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {pendingPayments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="relative">
            ✅ Aprobados
            {approvedPayments.length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {approvedPayments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>💳 Pagos Pendientes de Aprobación</CardTitle>
              <CardDescription>Revisa y confirma los comprobantes de pago subidos</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-muted-foreground">No hay pagos pendientes de aprobación</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPayments.map(pkg => renderPaymentCard(pkg, true))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>✅ Pagos Aprobados</CardTitle>
              <CardDescription>Historial de pagos confirmados</CardDescription>
            </CardHeader>
            <CardContent>
              {approvedPayments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-muted-foreground">No hay pagos aprobados aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedPayments.map(pkg => renderPaymentCard(pkg, false))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentsTab;