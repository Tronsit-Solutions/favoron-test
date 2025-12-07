import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Zap, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { formatFullName } from "@/lib/formatters";
import { getDeliveryFee } from "@/lib/pricing";

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
                <div key={pkg.id} className="border rounded-lg p-4 space-y-4">
                  {/* Header with status badge */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base break-words">
                        {pkg.products && pkg.products.length > 0 
                          ? `${pkg.products.length} producto${pkg.products.length > 1 ? 's' : ''}: ${pkg.products[0].itemDescription}${pkg.products.length > 1 ? ' y más...' : ''}`
                          : pkg.item_description
                        }
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                        {pkg.products && pkg.products.length > 0 
                          ? `Total estimado: $${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)}`
                          : `Precio: $${pkg.estimated_price}`
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Shopper: {formatFullName(pkg.profiles?.first_name, pkg.profiles?.last_name)}
                      </p>
                    </div>
                    <div className="flex justify-end sm:flex-col sm:items-end">
                      {getStatusBadge(pkg.status)}
                    </div>
                  </div>

                  {/* Details section */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs">
                      <span className="text-orange-600 font-medium">
                        📅 Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 break-words">
                      📦 Origen: {pkg.purchase_origin || 'No especificado'} → 🎯 Destino: {pkg.package_destination || 'Guatemala'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Entrega: {pkg.delivery_method === 'delivery' 
                        ? `🚚 Envío a domicilio (+Q${getDeliveryFee(pkg.delivery_method, pkg.profiles?.trust_level, (pkg.confirmed_delivery_address as any)?.cityArea)})` 
                        : '🏢 Recojo en zona 14'}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewPackageDetail(pkg)}
                      className="flex-1 justify-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => onOpenMatchDialog(pkg)}
                      disabled={availableTrips.length === 0}
                      className="flex-1 justify-center"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Hacer Match
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => onApproveReject('package', pkg.id, 'reject')}
                      className="flex-1 justify-center"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
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
                <div key={pkg.id} className="border rounded-lg p-4 space-y-4">
                  {/* Header with status badge */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base break-words">
                        {pkg.products && pkg.products.length > 0 
                          ? `${pkg.products.length} producto${pkg.products.length > 1 ? 's' : ''}: ${pkg.products[0].itemDescription}${pkg.products.length > 1 ? ' y más...' : ''}`
                          : pkg.item_description
                        }
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                        {pkg.products && pkg.products.length > 0 
                          ? `Total estimado: $${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)}`
                          : `Precio: $${pkg.estimated_price}`
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Shopper: {formatFullName(pkg.profiles?.first_name, pkg.profiles?.last_name)}
                      </p>
                    </div>
                    <div className="flex justify-end sm:flex-col sm:items-end">
                      {getStatusBadge(pkg.status)}
                    </div>
                  </div>

                  {/* Details section */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs">
                      <span className="text-orange-600 font-medium">
                        📅 Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Entrega: {pkg.delivery_method === 'delivery' 
                        ? `🚚 Envío a domicilio (+Q${getDeliveryFee(pkg.delivery_method, pkg.profiles?.trust_level, (pkg.confirmed_delivery_address as any)?.cityArea)})` 
                        : '🏢 Recojo en zona 14'}
                    </div>
                    {pkg.payment_receipt && (
                      <div className="text-xs text-blue-600 break-words">
                        Comprobante: {pkg.payment_receipt.filename} • 
                        Subido: {new Date(pkg.payment_receipt.uploadedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewPackageDetail(pkg)}
                      className="flex-1 justify-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                    {pkg.payment_receipt && (
                      <Button 
                        size="sm" 
                        onClick={() => onUpdateStatus('package', pkg.id, 'pending_purchase')}
                        className="flex-1 justify-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
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