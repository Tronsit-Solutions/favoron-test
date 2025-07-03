import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye } from "lucide-react";

interface AdminPackagesTabProps {
  packages: any[];
  onViewPackageDetail: (pkg: any) => void;
  onApproveReject: (type: 'package' | 'trip', id: number, action: 'approve' | 'reject') => void;
  onUpdateStatus: (type: 'package' | 'trip', id: number, status: string) => void;
  onConfirmOfficeReception: (packageId: number) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const AdminPackagesTab = ({ 
  packages, 
  onViewPackageDetail, 
  onApproveReject, 
  onUpdateStatus, 
  onConfirmOfficeReception,
  getStatusBadge 
}: AdminPackagesTabProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Solicitudes</CardTitle>
          <CardDescription>Todas las solicitudes de paquetes del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {packages.map(pkg => (
              <div key={pkg.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">
                      {pkg.products && pkg.products.length > 0 
                        ? `${pkg.products.length} producto${pkg.products.length > 1 ? 's' : ''}: ${pkg.products[0].itemDescription}${pkg.products.length > 1 ? ' y más...' : ''}`
                        : pkg.itemDescription
                      }
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {pkg.products && pkg.products.length > 0 
                        ? `Total estimado: $${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)} • Usuario: ${pkg.userId}`
                        : `Precio: ${pkg.estimatedPrice} • Usuario: ${pkg.userId}`
                      }
                    </p>
                    {pkg.paymentReceipt && (
                      <p className="text-xs text-blue-600">
                        Comprobante de pago subido: {new Date(pkg.paymentReceipt.uploadedAt).toLocaleDateString()}
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

                  {pkg.status === 'pending_approval' && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => onApproveReject('package', pkg.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onApproveReject('package', pkg.id, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </>
                  )}

                  {pkg.status === 'payment_pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => onUpdateStatus('package', pkg.id, 'payment_confirmed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirmar Pago
                    </Button>
                  )}
                  
                  {(pkg.status === 'paid' || pkg.status === 'purchased') && (
                    <Button 
                      size="sm" 
                      onClick={() => onUpdateStatus('package', pkg.id, 'in_transit')}
                    >
                      Marcar en tránsito
                    </Button>
                  )}
                  
                  {pkg.status === 'in_transit' && (
                    <Button 
                      size="sm" 
                      onClick={() => onUpdateStatus('package', pkg.id, 'delivered')}
                    >
                      Marcar como entregado
                    </Button>
                  )}
                  
                  {pkg.status === 'received_by_traveler' && (
                    <Button 
                      size="sm" 
                      onClick={() => onConfirmOfficeReception(pkg.id)}
                    >
                      Confirmar recepción en oficina Favorón
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPackagesTab;