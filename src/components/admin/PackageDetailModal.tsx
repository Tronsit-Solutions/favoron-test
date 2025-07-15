
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Package, ExternalLink, Calendar, DollarSign, CheckCircle, XCircle } from "lucide-react";
import PaymentReceiptViewer from "./PaymentReceiptViewer";
import PurchaseConfirmationViewer from "./PurchaseConfirmationViewer";
import { TravelerConfirmationDisplay } from "@/components/dashboard/TravelerConfirmationDisplay";

interface PackageDetailModalProps {
  package: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const PackageDetailModal = ({ package: pkg, isOpen, onClose, onApprove, onReject }: PackageDetailModalProps) => {
  if (!pkg) return null;

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente de Aprobación', variant: 'secondary' as const },
      'approved': { label: 'Aprobado', variant: 'default' as const },
      'matched': { label: 'Match realizado', variant: 'default' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Detalles de Solicitud #{pkg.id}</span>
          </DialogTitle>
          <DialogDescription>
            Información completa de la solicitud y del usuario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Estado actual:</span>
            {getStatusBadge(pkg.status)}
          </div>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="h-4 w-4" />
                <span>Información del Usuario</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Nombre</p>
                    <p className="text-sm text-muted-foreground">{pkg.user.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{pkg.user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">{pkg.user.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Historial</p>
                    <p className="text-sm text-muted-foreground">
                      {pkg.user.totalRequests} solicitudes | {pkg.user.completedRequests} completadas
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Package className="h-4 w-4" />
                <span>
                  {pkg.products && pkg.products.length > 0 
                    ? `Productos Solicitados (${pkg.products.length})`
                    : 'Detalles del Artículo'
                  }
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Multiple products display */}
              {pkg.products && pkg.products.length > 0 ? (
                <div className="space-y-4">
                  {pkg.products.map((product: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-lg">Producto #{index + 1}</p>
                        <Badge variant="outline">${product.estimatedPrice}</Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Descripción:</p>
                        <p className="text-sm text-muted-foreground">{product.itemDescription}</p>
                      </div>

                      {product.itemLink && (
                        <div>
                          <p className="text-sm font-medium mb-1">Link del producto:</p>
                          <a 
                            href={product.itemLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-primary hover:underline text-sm"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Ver producto en línea</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Total price summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Estimado:</span>
                      <span className="text-lg font-bold text-blue-800">
                        ${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Single product display (backward compatibility)
                <div>
                  <div>
                    <p className="font-medium text-lg">{pkg.item_description}</p>
                    <p className="text-muted-foreground">Descripción del artículo solicitado</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Precio Estimado</p>
                        <p className="text-sm text-muted-foreground">${pkg.estimated_price}</p>
                      </div>
                    </div>
                  </div>

                  {pkg.item_link && (
                    <div>
                      <p className="text-sm font-medium mb-2">Link del Producto:</p>
                      <a 
                        href={pkg.item_link}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Ver producto en línea</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Additional package details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha Límite</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
                    </p>
                  </div>
                </div>

                {pkg.package_destination && (
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Destino</p>
                      <p className="text-sm text-muted-foreground">{pkg.package_destination}</p>
                    </div>
                  </div>
                )}

                {pkg.purchase_origin && (
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Origen de compra</p>
                      <p className="text-sm text-muted-foreground">{pkg.purchase_origin}</p>
                    </div>
                  </div>
                )}

                {pkg.deliveryMethod && (
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Método de entrega</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.deliveryMethod === 'pickup' ? 'Recojo en zona 14' : 'Envío a domicilio'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {pkg.additional_notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notas Adicionales:</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {pkg.additional_notes}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Solicitud creada el {new Date(pkg.created_at).toLocaleDateString('es-GT')} a las {new Date(pkg.created_at).toLocaleTimeString('es-GT')}
              </div>
            </CardContent>
          </Card>

          {/* Payment Receipt Section */}
          {pkg.payment_receipt && (
            <PaymentReceiptViewer 
              paymentReceipt={pkg.payment_receipt} 
              packageId={pkg.id}
              quote={pkg.quote}
              estimatedPrice={pkg.estimated_price}
            />
          )}

          {/* Purchase Confirmation Section */}
          {pkg.purchase_confirmation && (
            <PurchaseConfirmationViewer
              purchaseConfirmation={pkg.purchase_confirmation}
              packageId={pkg.id}
            />
          )}

          {/* Traveler Confirmation Section */}
          <TravelerConfirmationDisplay pkg={pkg} />

          {/* Rejection Information */}
          {['rejected', 'quote_rejected'].includes(pkg.status) && pkg.rejectionReason && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg text-red-700">
                  <XCircle className="h-4 w-4" />
                  <span>Información del Rechazo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    {pkg.status === 'quote_rejected' ? 'Razón del rechazo de cotización:' : 'Razón del rechazo por el shopper:'}
                  </p>
                  <p className="text-sm text-red-700">
                    {typeof pkg.rejectionReason === 'string' 
                      ? pkg.rejectionReason 
                      : pkg.rejectionReason?.value || 'No especificada'
                    }
                  </p>
                  <div className="text-xs text-red-600 mt-2">
                    Rechazado el {new Date(pkg.rejectedAt || pkg.updated_at).toLocaleDateString('es-GT')} a las {new Date(pkg.rejectedAt || pkg.updated_at).toLocaleTimeString('es-GT')}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Show rejection debug for any rejected package */}
          {['rejected', 'quote_rejected'].includes(pkg.status) && !pkg.rejectionReason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Debug: Paquete rechazado sin razón</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Este paquete está marcado como rechazado pero no tiene rejectionReason.</p>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
                  {JSON.stringify(pkg, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {pkg.status === 'pending_approval' && (
            <div className="flex space-x-2 pt-4 border-t">
              <Button 
                onClick={() => onApprove(pkg.id)}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar Solicitud
              </Button>
              <Button 
                variant="destructive"
                onClick={() => onReject(pkg.id)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar Solicitud
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageDetailModal;
