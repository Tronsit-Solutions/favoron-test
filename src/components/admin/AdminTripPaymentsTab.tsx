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
import { Eye, CheckCircle, XCircle, Banknote, MapPin, Calendar, FileText, Sparkles } from 'lucide-react';
import PaymentOrderDetailModal from './PaymentOrderDetailModal';

interface AdminTripPaymentsTabProps {
  paymentOrders: any[];
  primeMemberships?: any[];
  combinedPayments?: any[];
  onUpdatePaymentStatus: (orderId: string, status: string, type?: 'trip_payment' | 'prime_membership') => void;
  onViewPaymentDetail?: (order: any) => void;
}

export const AdminTripPaymentsTab: React.FC<AdminTripPaymentsTabProps> = ({
  paymentOrders,
  primeMemberships = [],
  combinedPayments = [],
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

  // Use combined payments if available, otherwise fallback to legacy logic
  const allPayments = combinedPayments.length > 0 ? combinedPayments : [
    ...paymentOrders.map(order => ({
      ...order,
      type: order.payment_type === 'prime_membership' ? 'prime_membership' : 'trip_payment'
    })),
    ...primeMemberships.map(membership => ({
      ...membership,
      type: 'prime_membership',
      traveler_id: membership.user_id
    }))
  ];
  
  const pendingTripPayments = allPayments.filter(order => 
    order.type === 'trip_payment' && order.status === 'pending'
  );
  const processedTripPayments = allPayments.filter(order => 
    order.type === 'trip_payment' && (order.status === 'completed' || order.status === 'rejected' || order.status === 'approved')
  );
  
  const pendingPrimePayments = allPayments.filter(order => 
    order.type === 'prime_membership' && order.status === 'pending'
  );
  const processedPrimePayments = allPayments.filter(order => 
    order.type === 'prime_membership' && (order.status === 'completed' || order.status === 'rejected' || order.status === 'approved')
  );

  const handlePaymentAction = async (orderId: string, action: string, paymentType: 'trip_payment' | 'prime_membership' = 'trip_payment') => {
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      
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

            // Determine which table to update
            const tableName = paymentType === 'prime_membership' ? 'prime_memberships' : 'payment_orders';
            const updateData: any = {
              status: 'approved',
              receipt_url: `payment-receipts/${fileName}`,
              receipt_filename: file.name,
            };

            if (paymentType === 'trip_payment') {
              updateData.completed_at = new Date().toISOString();
            }

            // Actualizar la orden/membresía con el comprobante y marcar como aprobada
            const { error: updateError } = await supabase
              .from(tableName)
              .update(updateData)
              .eq('id', orderId);

            if (updateError) throw updateError;

            onUpdatePaymentStatus(orderId, 'approved', paymentType);
            
            toast({
              title: "¡Éxito!",
              description: paymentType === 'prime_membership' 
                ? "Membresía Prime aprobada exitosamente" 
                : "Pago aprobado y comprobante subido correctamente",
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
        const tableName = paymentType === 'prime_membership' ? 'prime_memberships' : 'payment_orders';
        
        const { error } = await supabase
          .from(tableName)
          .update({ status: newStatus })
          .eq('id', orderId);

        if (error) throw error;

        onUpdatePaymentStatus(orderId, newStatus, paymentType);
        
        toast({
          title: paymentType === 'prime_membership' ? "Membresía rechazada" : "Pago rechazado",
          description: paymentType === 'prime_membership' 
            ? "La solicitud de membresía Prime ha sido rechazada"
            : "La orden de pago ha sido rechazada",
        });
      }
      
      setConfirmAction(null);
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      case 'completed':
      case 'approved':
        return <Badge variant="default">Aprobado</Badge>;
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
                {order.trips?.arrival_date && format(new Date(order.trips.arrival_date), 'dd MMM yyyy', { locale: es })}
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

  const PrimePaymentCard = ({ order, showActions = false }: { order: any; showActions?: boolean }) => (
    <Card key={order.id} className="mb-4 border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-purple-700">Membresía Prime - {formatCurrency(order.amount)}</span>
              <Badge className="bg-purple-100 text-purple-700 text-xs">PRIME</Badge>
            </CardTitle>
            <p className="text-sm text-purple-600 mt-1">
              Membresía anual Favorón Prime
            </p>
          </div>
          {getPaymentStatusBadge(order.status)}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Usuario:</span>
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
              <p className="font-medium">{order.bank_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Cuenta:</span>
              <p className="font-medium">{maskAccount(order.bank_account_number)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Titular:</span>
              <p className="font-medium">{order.bank_account_holder}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo de cuenta:</span>
              <p className="font-medium capitalize">{order.bank_account_type}</p>
            </div>
          </div>

          {showActions && (
            <div className="flex gap-2 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(order)}
              >
                <FileText className="h-4 w-4 mr-1" />
                Ver Detalles
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmAction({ action: 'approve', order })}
                disabled={isUploading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {isUploading ? 'Procesando...' : 'Activar Prime'}
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

  const totalPending = pendingTripPayments.length + pendingPrimePayments.length;
  const totalProcessed = processedTripPayments.length + processedPrimePayments.length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pendientes ({totalPending})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Procesados ({totalProcessed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Prime Membership Payments */}
          {pendingPrimePayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-purple-100 rounded-full flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-purple-700">Membresías Prime Pendientes ({pendingPrimePayments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingPrimePayments.map(order => (
                    <PrimePaymentCard key={order.id} order={order} showActions />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trip Payments */}
          {pendingTripPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pagos por Viaje Pendientes ({pendingTripPayments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTripPayments.map(order => (
                    <TripPaymentCard key={order.id} order={order} showActions />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {totalPending === 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">No hay pagos pendientes</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {/* Processed Prime Payments */}
          {processedPrimePayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-purple-100 rounded-full flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-purple-700">Membresías Prime Procesadas ({processedPrimePayments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processedPrimePayments.map(order => (
                    <div key={order.id} className="space-y-2">
                      <PrimePaymentCard order={order} />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(order)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Ver Detalles Completos
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processed Trip Payments */}
          {processedTripPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pagos por Viaje Procesados ({processedTripPayments.length})</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}

          {totalProcessed === 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">No hay pagos procesados</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === 'approve' 
                ? (confirmAction?.order?.payment_type === 'prime_membership' ? 'Activar Membresía Prime' : 'Aprobar Pago')
                : 'Rechazar Pago'
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'approve' 
                ? (confirmAction?.order?.payment_type === 'prime_membership' 
                    ? 'Se activará la membresía Prime del usuario por 1 año después de subir el comprobante.'
                    : 'Se te pedirá subir el comprobante de pago después de confirmar.'
                  )
                : '¿Estás seguro de que quieres rechazar este pago?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && handlePaymentAction(confirmAction.order.id, confirmAction.action)}
              className={confirmAction?.order?.payment_type === 'prime_membership' && confirmAction?.action === 'approve' 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : ''
              }
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