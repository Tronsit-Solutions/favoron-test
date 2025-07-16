import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Zap, AlertCircle, CheckCircle } from "lucide-react";

interface AdminOverviewTabProps {
  packages: any[];
  trips: any[];
  onViewPackageDetail: (pkg: any) => void;
  onOpenMatchDialog: (pkg: any) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: string, status: string) => void;
}

const AdminOverviewTab = ({ 
  packages, 
  trips, 
  onViewPackageDetail, 
  onOpenMatchDialog, 
  onUpdateStatus 
}: AdminOverviewTabProps) => {
  const approvedPackages = packages.filter(p => p.status === 'approved');
  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));

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
                    <p className="font-medium">{pkg.item_description}</p>
                    <p className="text-sm text-muted-foreground">
                      Precio: ${pkg.estimated_price} • Usuario: {pkg.user_id}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      📦 Origen: {pkg.purchase_origin || 'No especificado'} → 🎯 Destino: {pkg.package_destination || 'Guatemala'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Entrega: {pkg.delivery_method === 'delivery' ? '🚚 Envío a domicilio (+Q25)' : '🏢 Recojo en zona 14'}
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

      {/* Payment confirmations section */}
      <Card>
        <CardHeader>
          <CardTitle>Pagos pendientes de confirmación</CardTitle>
          <CardDescription>Solicitudes con comprobantes de pago que requieren revisión</CardDescription>
        </CardHeader>
        <CardContent>
          {packages.filter(pkg => pkg.status === 'payment_pending').length === 0 ? (
            <p className="text-muted-foreground">No hay pagos pendientes de confirmación</p>
          ) : (
            <div className="space-y-2">
              {packages.filter(pkg => pkg.status === 'payment_pending').map(pkg => (
                <div key={pkg.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{pkg.item_description}</p>
                    <p className="text-sm text-muted-foreground">
                      Precio: ${pkg.estimated_price} • Usuario: {pkg.user_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Entrega: {pkg.delivery_method === 'delivery' ? '🚚 Envío a domicilio (+Q25)' : '🏢 Recojo en zona 14'}
                    </p>
                    {pkg.payment_receipt && (
                      <p className="text-xs text-blue-600 mt-1">
                        Comprobante: {pkg.payment_receipt.filename} • 
                        Subido: {new Date(pkg.payment_receipt.uploadedAt).toLocaleDateString()}
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
                      onClick={() => onUpdateStatus('package', pkg.id, 'payment_confirmed')}
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

export default AdminOverviewTab;