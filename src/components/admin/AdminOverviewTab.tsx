import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Zap, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { formatFullName } from "@/lib/formatters";

interface AdminOverviewTabProps {
  packages: any[];
  trips: any[];
  onViewPackageDetail: (pkg: any) => void;
  onOpenMatchDialog: (pkg: any) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: string, status: string) => void;
  onApproveReject: (type: 'package' | 'trip', id: string, action: 'approve' | 'reject') => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const AdminOverviewTab = ({ 
  packages, 
  trips, 
  onViewPackageDetail, 
  onOpenMatchDialog, 
  onUpdateStatus,
  onApproveReject,
  getStatusBadge 
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
            <div className="space-y-3">
              {approvedPackages.map(pkg => (
                <div key={pkg.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {pkg.products && pkg.products.length > 0 
                          ? `${pkg.products.length} producto${pkg.products.length > 1 ? 's' : ''}: ${pkg.products[0].itemDescription}${pkg.products.length > 1 ? ' y más...' : ''}`
                          : pkg.item_description
                        }
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {pkg.products && pkg.products.length > 0 
                          ? `Total estimado: $${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)} • Shopper: ${formatFullName(pkg.profiles?.first_name, pkg.profiles?.last_name)}`
                          : `Precio: $${pkg.estimated_price} • Shopper: ${formatFullName(pkg.profiles?.first_name, pkg.profiles?.last_name)}`
                        }
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        📅 Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        📦 Origen: {pkg.purchase_origin || 'No especificado'} → 🎯 Destino: {pkg.package_destination || 'Guatemala'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Entrega: {pkg.delivery_method === 'delivery' ? '🚚 Envío a domicilio (+Q25)' : '🏢 Recojo en zona 14'}
                      </p>
                    </div>
                    {getStatusBadge(pkg.status)}
                  </div>
                  
                  <div className="flex space-x-2 mt-3">
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
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => onApproveReject('package', pkg.id, 'reject')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Descartar
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
          {packages.filter(pkg => pkg.status === 'payment_pending_approval' && pkg.payment_receipt).length === 0 ? (
            <p className="text-muted-foreground">No hay pagos pendientes de confirmación</p>
          ) : (
            <div className="space-y-3">
              {packages.filter(pkg => pkg.status === 'payment_pending_approval' && pkg.payment_receipt).map(pkg => (
                <div key={pkg.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {pkg.products && pkg.products.length > 0 
                          ? `${pkg.products.length} producto${pkg.products.length > 1 ? 's' : ''}: ${pkg.products[0].itemDescription}${pkg.products.length > 1 ? ' y más...' : ''}`
                          : pkg.item_description
                        }
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {pkg.products && pkg.products.length > 0 
                          ? `Total estimado: $${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)} • Shopper: ${formatFullName(pkg.profiles?.first_name, pkg.profiles?.last_name)}`
                          : `Precio: $${pkg.estimated_price} • Shopper: ${formatFullName(pkg.profiles?.first_name, pkg.profiles?.last_name)}`
                        }
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        📅 Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
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
                    {getStatusBadge(pkg.status)}
                  </div>
                  
                  <div className="flex space-x-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewPackageDetail(pkg)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                    {pkg.payment_receipt && (
                      <Button 
                        size="sm" 
                        onClick={() => onUpdateStatus('package', pkg.id, 'payment_confirmed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirmar Pago
                      </Button>
                    )}
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