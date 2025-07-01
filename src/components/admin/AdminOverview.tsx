
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, AlertCircle, Eye, Zap, CheckCircle } from "lucide-react";

interface AdminOverviewProps {
  packages: any[];
  trips: any[];
  onViewPackageDetail: (pkg: any) => void;
  onOpenMatchDialog: (pkg: any) => void;
  onConfirmPayment: (packageId: number) => void;
  availableTrips: any[];
}

const AdminOverview = ({ 
  packages, 
  trips, 
  onViewPackageDetail, 
  onOpenMatchDialog, 
  onConfirmPayment, 
  availableTrips 
}: AdminOverviewProps) => {
  const approvedPackages = packages.filter(p => p.status === 'approved');
  const pendingPayments = packages.filter(pkg => pkg.status === 'payment_pending');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes listas para Match</CardTitle>
          <CardDescription>Solicitudes aprobadas esperando ser emparejadas con viajeros</CardDescription>
        </CardHeader>
        <CardContent>
          {approvedPackages.length === 0 ? (
            <p className="text-muted-foreground">No hay solicitudes pendientes de Match</p>
          ) : (
            <div className="space-y-2">
              {approvedPackages.map(pkg => (
                <div key={pkg.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{pkg.itemDescription}</p>
                    <p className="text-sm text-muted-foreground">
                      Precio: ${pkg.estimatedPrice} • Usuario: {pkg.userId}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      📦 Origen: {pkg.purchaseCountry || 'No especificado'} → 🎯 Destino: {pkg.packageDestination || 'Guatemala'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewPackageDetail(pkg)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => onOpenMatchDialog(pkg)}
                      disabled={availableTrips.length === 0}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Hacer Match
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {availableTrips.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">No hay viajes activos disponibles para hacer Match. Revisa la sección de Viajes para aprobar algunos.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pagos pendientes de confirmación</CardTitle>
          <CardDescription>Solicitudes con comprobantes de pago que requieren revisión</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <p className="text-muted-foreground">No hay pagos pendientes de confirmación</p>
          ) : (
            <div className="space-y-2">
              {pendingPayments.map(pkg => (
                <div key={pkg.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{pkg.itemDescription}</p>
                    <p className="text-sm text-muted-foreground">
                      Precio: ${pkg.estimatedPrice} • Usuario: {pkg.userId}
                    </p>
                    {pkg.paymentReceipt && (
                      <p className="text-xs text-blue-600 mt-1">
                        Comprobante: {pkg.paymentReceipt.filename} • 
                        Subido: {new Date(pkg.paymentReceipt.uploadedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewPackageDetail(pkg)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => onConfirmPayment(pkg.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirmar Pago
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
