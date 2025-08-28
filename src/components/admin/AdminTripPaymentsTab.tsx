import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/priceHelpers';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, CheckCircle, XCircle, Banknote, MapPin, Calendar, FileText } from 'lucide-react';
import PaymentOrderDetailModal from './PaymentOrderDetailModal';

interface AdminTripPaymentsTabProps {
  paymentOrders: any[];
  onUpdatePaymentStatus: (orderId: string, status: string) => void;
  onViewPaymentDetail?: (order: any) => void;
}

export const AdminTripPaymentsTab: React.FC<AdminTripPaymentsTabProps> = ({
  paymentOrders,
  onUpdatePaymentStatus,
  onViewPaymentDetail
}) => {
  const [confirmAction, setConfirmAction] = useState<{ action: string; order: any } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { toast } = useToast();
  const maskAccount = (num?: string) => (num && typeof num === 'string' ? `•••• ${num.slice(-4)}` : 'N/A');

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // Filtrar órdenes de pago por viaje (tienen trip_id)
  const tripPaymentOrders = paymentOrders.filter(order => order.trip_id);
  
  const pendingTripPayments = tripPaymentOrders.filter(order => order.status === 'pending');
  const processedTripPayments = tripPaymentOrders.filter(order => 
    order.status === 'completed' || order.status === 'rejected'
  );

  const handlePaymentAction = async (orderId: string, action: string) => {
    try {
      const newStatus = action === 'approve' ? 'completed' : 'rejected';
      
      if (action === 'approve') {
        // Para aprobar, necesitamos subir el comprobante de pago
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf';
        
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          
          setIsUploading(true);
          
          try {
            // Subir archivo a Supabase Storage
            const fileName = `payment_receipt_${orderId}_${Date.now()}.${file.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('payment-receipts')
              .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Actualizar la orden con el comprobante (guardamos filePath) y marcar como completada
            const { error: updateError } = await supabase
              .from('payment_orders')
              .update({
                status: 'completed',
                receipt_url: fileName,
                receipt_filename: file.name,
                completed_at: new Date().toISOString()
              })
              .eq('id', orderId);

            if (updateError) throw updateError;

            onUpdatePaymentStatus(orderId, 'completed');
            
            toast({
              title: "¡Éxito!",
              description: "Pago aprobado y comprobante subido correctamente",
            });
          } catch (error: any) {
            console.error('Error uploading receipt:', error);
            toast({
              title: "Error",
              description: "Error al subir el comprobante de pago",
              variant: "destructive",
            });
          } finally {
            setIsUploading(false);
          }
        };
        
        input.click();
      } else {
        // Para rechazar, solo actualizar el estado
        const { error } = await supabase
          .from('payment_orders')
          .update({ status: newStatus })
          .eq('id', orderId);

        if (error) throw error;

        onUpdatePaymentStatus(orderId, newStatus);
        
        toast({
          title: "Pago rechazado",
          description: "La orden de pago ha sido rechazada",
        });
      }
      
      setConfirmAction(null);
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pago",
        variant: "destructive",
      });
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      case 'completed':
        return <Badge variant="default">Completado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const TripPaymentCard = ({ order, showActions = false }: { order: any; showActions?: boolean }) => (
    <Card key={order.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Pago por Viaje - {formatCurrency(order.amount)}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {order.trips?.from_city} → {order.trips?.to_city}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {order.trips?.departure_date && format(new Date(order.trips.departure_date), 'dd MMM yyyy', { locale: es })}
              </div>
            </div>
          </div>
          {getPaymentStatusBadge(order.status)}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Viajero:</span>
              <p className="font-medium">
                {order.profiles?.first_name} {order.profiles?.last_name}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Fecha de solicitud:</span>
              <p>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Banco:</span>
              <p className="font-medium">{order.profiles?.bank_name || order.bank_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Cuenta:</span>
              <p className="font-medium">{maskAccount(order.profiles?.bank_account_number || order.bank_account_number)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Titular:</span>
              <p className="font-medium">{order.profiles?.bank_account_holder || order.bank_account_holder}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo de cuenta:</span>
              <p className="font-medium capitalize">{order.profiles?.bank_account_type || order.bank_account_type}</p>
            </div>
            {(order.profiles?.bank_swift_code || order.bank_swift_code) && (
              <div>
                <span className="text-muted-foreground">Código SWIFT:</span>
                <p className="font-medium">{order.profiles?.bank_swift_code || order.bank_swift_code}</p>
              </div>
            )}
          </div>

          {showActions && (
            <div className="flex gap-2 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(order)}
              >
                <FileText className="h-4 w-4 mr-1" />
                Ver Trazabilidad
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmAction({ action: 'approve', order })}
                disabled={isUploading}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {isUploading ? 'Procesando...' : 'Aprobar'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmAction({ action: 'reject', order })}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rechazar
              </Button>
            </div>
          )}

          {order.status === 'completed' && order.receipt_url && (
            <div className="pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const url = order.receipt_url;
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
              >
                Ver comprobante de pago
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pendientes ({pendingTripPayments.length})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Procesados ({processedTripPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagos por Viaje Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingTripPayments.length === 0 ? (
                <p className="text-muted-foreground">No hay pagos por viaje pendientes</p>
              ) : (
                <div className="space-y-4">
                  {pendingTripPayments.map(order => (
                    <TripPaymentCard key={order.id} order={order} showActions />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagos por Viaje Procesados</CardTitle>
            </CardHeader>
            <CardContent>
          {processedTripPayments.length === 0 ? (
                <p className="text-muted-foreground">No hay pagos por viaje procesados</p>
              ) : (
                <div className="space-y-4">
                  {processedTripPayments.map(order => (
                    <div key={order.id} className="space-y-2">
                      <TripPaymentCard order={order} />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(order)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Ver Trazabilidad Completa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === 'approve' ? 'Aprobar Pago' : 'Rechazar Pago'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'approve' 
                ? 'Se te pedirá subir el comprobante de pago después de confirmar.'
                : '¿Estás seguro de que quieres rechazar este pago?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && handlePaymentAction(confirmAction.order.id, confirmAction.action)}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PaymentOrderDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        paymentOrder={selectedOrder}
      />
    </div>
  );
};