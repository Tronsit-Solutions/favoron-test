import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Package, ExternalLink, Calendar, DollarSign, CheckCircle, XCircle } from "lucide-react";
import PaymentReceiptViewer from "./PaymentReceiptViewer";
import PurchaseConfirmationViewer from "./PurchaseConfirmationViewer";
import TrackingInfoViewer from "./TrackingInfoViewer";
import { TravelerConfirmationDisplay } from "@/components/dashboard/TravelerConfirmationDisplay";
import RejectionReasonDisplay from "./RejectionReasonDisplay";
import { useModalState } from "@/contexts/ModalStateContext";

interface PackageDetailModalProps {
  modalId: string;
  trips: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const PackageDetailModal = ({ modalId, trips, onApprove, onReject }: PackageDetailModalProps) => {
  const { isModalOpen, closeModal, getModalData } = useModalState();
  const pkg = getModalData(modalId);
  const isOpen = isModalOpen(modalId);

  console.log('PackageDetailModal render:', { pkg, trips, isOpen, modalId });

  if (!pkg) {
    console.log('No package provided to PackageDetailModal');
    return null;
  }

  // Centralized rejection reason translation function
  const translateRejectionReason = (reason: any): string => {
    if (!reason) return 'Razón no especificada';
    
    const reasonText = typeof reason === 'string' ? reason : reason?.value;
    if (!reasonText) return 'Razón no especificada';
    
    // First check if it's a known enum key from constants
    const REJECTION_REASONS = {
      no_longer_want: 'Ya no quiero el paquete',
      too_expensive: 'La cotización fue muy cara',
      wrong_delivery_time: 'El tiempo de entrega no es el que quería',
      other: 'Otra razón'
    };
    
    if (REJECTION_REASONS[reasonText as keyof typeof REJECTION_REASONS]) {
      return REJECTION_REASONS[reasonText as keyof typeof REJECTION_REASONS];
    }
    
    // Then translate common English rejection reasons
    const translations: Record<string, string> = {
      'Product not available': 'Producto no disponible',
      'Price too high': 'Precio muy alto',
      'Delivery time too long': 'Tiempo de entrega muy largo',
      'Cannot deliver to location': 'No se puede entregar en esa ubicación',
      'Product restrictions': 'Restricciones del producto',
      'Size/weight limitations': 'Limitaciones de tamaño/peso',
      'Other': 'Otro',
      'Item unavailable': 'Artículo no disponible',
      'Too expensive': 'Muy caro',
      'Wrong size': 'Tamaño incorrecto',
      'Wrong color': 'Color incorrecto',
      'Shipping restrictions': 'Restricciones de envío',
      'Quality issues': 'Problemas de calidad',
      'Changed mind': 'Cambié de opinión'
    };
    
    return translations[reasonText] || reasonText;
  };

  // Find the matched trip if this package is matched
  const matchedTrip = pkg.matched_trip_id 
    ? trips.find(trip => trip.id === pkg.matched_trip_id)
    : null;

  console.log('Matched trip found:', matchedTrip);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente de Aprobación', variant: 'secondary' as const },
      'approved': { label: 'Aprobado', variant: 'default' as const },
      'matched': { label: 'Match realizado', variant: 'default' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
      'quote_sent': { label: 'Cotización enviada', variant: 'default' as const },
      'quote_rejected': { label: 'Cotización rechazada', variant: 'destructive' as const },
      'payment_pending': { label: 'Pago pendiente', variant: 'secondary' as const },
      'payment_pending_approval': { label: 'Pago pendiente de aprobación', variant: 'warning' as const },
      'payment_confirmed': { label: 'Pago confirmado', variant: 'default' as const },
      'in_transit': { label: 'En tránsito', variant: 'default' as const },
      'delivered_to_office': { label: 'Entregado en oficina', variant: 'default' as const },
      'out_for_delivery': { label: 'En reparto', variant: 'default' as const },
      'received_by_traveler': { label: 'Recibido por viajero', variant: 'default' as const },
      'completed': { label: 'Completado', variant: 'default' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => closeModal(modalId)}>
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

        <div className="space-y-4">
          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Estado actual:</span>
            {getStatusBadge(pkg.status)}
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Shopper Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <User className="h-4 w-4" />
                  <span>🛒 Información del Shopper</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Nombre</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.profiles ? `${pkg.profiles.first_name || ''} ${pkg.profiles.last_name || ''}`.trim() || pkg.profiles.username || 'Sin nombre' : 'Sin información'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Usuario</p>
                      <p className="text-sm text-muted-foreground">
                        @{pkg.profiles?.username || 'Sin usuario'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.profiles?.email || 'Sin email'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.profiles?.phone_number || 'Sin teléfono'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Usuario ID</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.user_id}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traveler Information */}
            {matchedTrip && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <User className="h-4 w-4" />
                    <span>✈️ Información del Viajero</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Nombre</p>
                        <p className="text-sm text-muted-foreground">
                          {matchedTrip.profiles ? `${matchedTrip.profiles.first_name || ''} ${matchedTrip.profiles.last_name || ''}`.trim() || matchedTrip.profiles.username || 'Sin nombre' : 'Sin información'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Usuario</p>
                        <p className="text-sm text-muted-foreground">
                          @{matchedTrip?.profiles?.username || matchedTrip?.username || 'Sin usuario'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {matchedTrip.profiles?.email || 'Sin email'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Teléfono</p>
                        <p className="text-sm text-muted-foreground">
                          {matchedTrip.profiles?.phone_number || 'Sin teléfono'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Usuario ID</p>
                        <p className="text-sm text-muted-foreground">
                          {matchedTrip.user_id}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800 mb-2">📍 Información del Viaje:</p>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p><strong>Ruta:</strong> {matchedTrip.from_city} → {matchedTrip.to_city}</p>
                        <p><strong>Llegada:</strong> {new Date(matchedTrip.arrival_date).toLocaleDateString('es-GT')}</p>
                        <p><strong>Entrega:</strong> {new Date(matchedTrip.delivery_date).toLocaleDateString('es-GT')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Package Information - Simplified for debugging */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Package className="h-4 w-4" />
                <span>Detalles del Paquete</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-lg">{pkg.item_description || 'Sin descripción'}</p>
                <p className="text-muted-foreground">Descripción del artículo solicitado</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Precio Estimado</p>
                    <p className="text-sm text-muted-foreground">${pkg.estimated_price || '0'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha Límite</p>
                    <p className="text-sm text-muted-foreground">
                      {pkg.delivery_deadline ? new Date(pkg.delivery_deadline).toLocaleDateString('es-GT') : 'No especificada'}
                    </p>
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

              <div className="text-xs text-muted-foreground">
                Solicitud creada el {new Date(pkg.created_at).toLocaleDateString('es-GT')} a las {new Date(pkg.created_at).toLocaleTimeString('es-GT')}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {pkg.status === 'pending_approval' && (
            <div className="flex space-x-2 pt-4 border-t">
              <Button 
                onClick={() => onApprove(pkg.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
