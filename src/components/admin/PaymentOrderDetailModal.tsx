import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Calendar, 
  User, 
  Package, 
  DollarSign, 
  CreditCard, 
  FileText,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface PaymentOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentOrder: any;
}

const PaymentOrderDetailModal: React.FC<PaymentOrderDetailModalProps> = ({
  isOpen,
  onClose,
  paymentOrder
}) => {
  if (!paymentOrder) return null;

  const trip = paymentOrder.trips;
  const traveler = paymentOrder.profiles;
  const historicalPackages = paymentOrder.historical_packages || [];

  const maskAccount = (num?: string) => (num && typeof num === 'string' ? `•••• ${num.slice(-4)}` : 'N/A');

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'outline' as const, color: 'text-orange-600' },
      completed: { variant: 'default' as const, color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, color: 'text-red-600' },
      cancelled: { variant: 'secondary' as const, color: 'text-gray-600' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status === 'pending' ? 'Pendiente' : 
         status === 'completed' ? 'Completado' : 
         status === 'rejected' ? 'Rechazado' : 'Cancelado'}
      </Badge>
    );
  };

  const totalPackageValue = historicalPackages.reduce((sum: number, pkg: any) => {
    const quotePrice = pkg.quote?.price ? parseFloat(pkg.quote.price) : 0;
    return sum + quotePrice;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detalle de Orden de Pago #{paymentOrder.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Estado de la Orden
                </span>
                {getStatusBadge(paymentOrder.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monto Total</p>
                <p className="font-semibold text-lg">{formatCurrency(paymentOrder.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha Creación</p>
                <p className="font-medium">
                  {format(new Date(paymentOrder.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
              {paymentOrder.completed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Completado</p>
                  <p className="font-medium">
                    {format(new Date(paymentOrder.completed_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              )}
              {paymentOrder.receipt_url && (
                <div>
                  <p className="text-sm text-muted-foreground">Comprobante</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      const url = paymentOrder.receipt_url as string | undefined;
                      if (url?.startsWith('http')) {
                        window.open(url, '_blank');
                      } else if (url) {
                        const { data, error } = await supabase.storage
                          .from('payment-receipts')
                          .createSignedUrl(url, 3600);
                        if (!error && data?.signedUrl) {
                          window.open(data.signedUrl, '_blank');
                        }
                      }
                    }}
                    className="mt-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trip Information */}
          {trip && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Información del Viaje
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Ruta</p>
                    <p className="font-medium">{trip.from_city} → {trip.to_city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge variant="outline">{trip.status}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha Salida</p>
                    <p className="font-medium">
                      {format(new Date(trip.departure_date), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha Llegada</p>
                    <p className="font-medium">
                      {format(new Date(trip.arrival_date), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Traveler Information */}
          {traveler && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Viajero
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre Completo</p>
                    <p className="font-medium">
                      {traveler.first_name} {traveler.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{traveler.email}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Información Bancaria</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Titular</p>
                      <p className="font-medium">{paymentOrder.bank_account_holder}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Banco</p>
                      <p className="font-medium">{paymentOrder.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Cuenta</p>
                      <p className="font-medium">{paymentOrder.bank_account_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Número de Cuenta</p>
                      <p className="font-medium">{maskAccount(paymentOrder.bank_account_number)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historical Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Paquetes Transportados ({historicalPackages.length})
                </span>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-semibold">{formatCurrency(totalPackageValue)}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {historicalPackages.length > 0 ? (
                historicalPackages.map((pkg: any, index: number) => (
                  <div key={pkg.id || index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{pkg.item_description}</h4>
                        <p className="text-sm text-muted-foreground">
                          {pkg.purchase_origin} → {pkg.package_destination}
                        </p>
                      </div>
                      <Badge variant="outline">{pkg.status}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Shopper</p>
                        <p className="font-medium">
                          {pkg.shopper_info?.first_name} {pkg.shopper_info?.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Precio Estimado</p>
                        <p className="font-medium">{formatCurrency(pkg.estimated_price || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Propina Final</p>
                        <p className="font-medium">
                          {pkg.quote?.price ? formatCurrency(parseFloat(pkg.quote.price)) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Estado Entrega</p>
                        <div className="flex items-center gap-1">
                          {pkg.delivery_confirmed_at && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          <span className="text-xs">
                            {pkg.delivery_confirmed_at ? 'Entregado' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {(pkg.traveler_confirmed_at || pkg.delivery_confirmed_at) && (
                      <div className="pt-2 border-t text-xs space-y-1">
                        {pkg.traveler_confirmed_at && (
                          <p className="text-muted-foreground">
                            Confirmado por viajero: {format(new Date(pkg.traveler_confirmed_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                        )}
                        {pkg.delivery_confirmed_at && (
                          <p className="text-muted-foreground">
                            Entregado en oficina: {format(new Date(pkg.delivery_confirmed_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No se encontró información histórica de paquetes</p>
                  <p className="text-sm">Esta orden fue creada antes del sistema de trazabilidad</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Resumen Financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monto Bruto</p>
                <p className="font-semibold">{formatCurrency(totalPackageValue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comisión Favorón (15%)</p>
                <p className="font-semibold">{formatCurrency(totalPackageValue * 0.15)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monto a Viajero</p>
                <p className="font-semibold text-green-600">{formatCurrency(paymentOrder.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paquetes Entregados</p>
                <p className="font-semibold">
                  {historicalPackages.filter((pkg: any) => pkg.delivery_confirmed_at).length} / {historicalPackages.length}
                </p>
              </div>
            </CardContent>
          </Card>

          {paymentOrder.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notas Administrativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{paymentOrder.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentOrderDetailModal;