import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Eye, FileText, DollarSign } from "lucide-react";

interface AdminPaymentsTabProps {
  packages: any[];
  onUpdateStatus: (type: 'package' | 'trip', id: string, status: string) => void;
  onViewPackageDetail: (pkg: any) => void;
}

const AdminPaymentsTab = ({ packages, onUpdateStatus, onViewPackageDetail }: AdminPaymentsTabProps) => {
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; action: 'approve' | 'reject'; payment: any }>({
    isOpen: false,
    action: 'approve',
    payment: null
  });
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  // Filtrar pagos pendientes de aprobación
  const pendingPayments = packages.filter(pkg => 
    pkg.status === 'payment_confirmed' && pkg.payment_receipt
  );

  // Filtrar pagos ya aprobados/procesados
  const processedPayments = packages.filter(pkg => 
    (pkg.status === 'paid' && pkg.payment_receipt) || 
    (pkg.status === 'payment_rejected' && pkg.payment_receipt)
  );

  const handlePaymentAction = async () => {
    if (!confirmDialog.payment) return;

    const newStatus = confirmDialog.action === 'approve' ? 'paid' : 'payment_rejected';
    
    try {
      // Actualizar el estado del paquete
      onUpdateStatus('package', confirmDialog.payment.id, newStatus);
      
      // Si se aprueba el pago, enviar notificación al shopper con información de envío
      if (confirmDialog.action === 'approve') {
        const pkg = confirmDialog.payment;
        
        // Crear notificación con información de envío
        await supabase.rpc('create_notification', {
          _user_id: pkg.user_id,
          _title: '✅ ¡Pago aprobado! Información de envío',
          _message: `Tu pago ha sido aprobado. Ahora puedes enviar el paquete "${pkg.item_description}" a la dirección del viajero.`,
          _type: 'payment_approved',
          _priority: 'high',
          _metadata: {
            package_id: pkg.id,
            traveler_address: pkg.traveler_address,
            shipping_instructions: `Enviar a: ${pkg.traveler_address?.recipientName || 'N/A'} - ${pkg.traveler_address?.streetAddress || 'N/A'}, ${pkg.traveler_address?.cityArea || 'N/A'}`
          }
        });
      }
      
      toast({
        title: confirmDialog.action === 'approve' ? "Pago aprobado" : "Pago rechazado",
        description: confirmDialog.action === 'approve' 
          ? `El pago ha sido aprobado y el shopper ha sido notificado con la información de envío.`
          : `El pago del pedido #${confirmDialog.payment.id} ha sido rechazado.`,
        variant: confirmDialog.action === 'approve' ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error processing payment action:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la acción de pago.",
        variant: "destructive"
      });
    }

    setConfirmDialog({ isOpen: false, action: 'approve', payment: null });
    setComment("");
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getPaymentStatusBadge = (pkg: any) => {
    if (pkg.status === 'paid' && pkg.payment_receipt) {
      return <Badge variant="default" className="bg-green-500">Aprobado</Badge>;
    }
    if (pkg.status === 'payment_confirmed') {
      return <Badge variant="secondary">Pendiente</Badge>;
    }
    if (pkg.status === 'payment_rejected' && pkg.payment_receipt) {
      return <Badge variant="destructive">Rechazado</Badge>;
    }
    return <Badge variant="outline">Sin procesar</Badge>;
  };

  const PaymentProofDialog = ({ payment }: { payment: any }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Ver comprobante
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Comprobante de pago - Pedido #{payment.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {payment.payment_receipt?.publicUrl && payment.payment_receipt?.fileType?.includes('image') ? (
            <img 
              src={payment.payment_receipt.publicUrl} 
              alt="Comprobante de pago" 
              className="w-full rounded-lg border"
            />
          ) : (
            <div className="bg-muted p-8 rounded-lg text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {payment.payment_receipt?.filename || 'Comprobante cargado'}
              </p>
              {payment.payment_receipt?.publicUrl && (
                <a 
                  href={payment.payment_receipt.publicUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-2 block"
                >
                  Descargar archivo
                </a>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold">Gestión de Pagos</h3>
        {pendingPayments.length > 0 && (
          <Badge variant="destructive" className="ml-2">
            {pendingPayments.length} pendientes
          </Badge>
        )}
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="relative flex items-center gap-2">
            Pagos Pendientes
            {pendingPayments.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {pendingPayments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center gap-2">
            Historial de Pagos
            <Badge variant="outline" className="ml-1 text-xs">
              {processedPayments.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingPayments.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay pagos pendientes de aprobación</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pagos Pendientes de Aprobación</span>
                  <Badge variant="outline" className="text-sm">
                    {pendingPayments.length} pendientes
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                      {/* Header row with package info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="link"
                            onClick={() => onViewPackageDetail(payment)}
                            className="p-0 h-auto font-semibold text-base"
                          >
                            #{payment.id.slice(0, 8)}
                          </Button>
                          <div className="text-sm text-muted-foreground">
                            {payment.item_description}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            {payment.quote?.totalPrice ? 
                              formatCurrency(parseFloat(payment.quote.totalPrice)) : 
                              'N/A'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Shopper info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                            {payment.profiles?.first_name?.charAt(0)}{payment.profiles?.last_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {payment.profiles?.first_name} {payment.profiles?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {payment.profiles?.email || `user_${payment.user_id.slice(0, 8)}`}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <PaymentProofDialog payment={payment} />
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setConfirmDialog({
                              isOpen: true,
                              action: 'approve',
                              payment
                            })}
                            className="h-8 px-3"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setConfirmDialog({
                              isOpen: true,
                              action: 'reject',
                              payment
                            })}
                            className="h-8 px-3"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos Procesados</CardTitle>
            </CardHeader>
            <CardContent>
              {processedPayments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay pagos procesados aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processedPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4 space-y-3 opacity-75">
                      {/* Header row with package info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="link"
                            onClick={() => onViewPackageDetail(payment)}
                            className="p-0 h-auto font-semibold text-base"
                          >
                            #{payment.id.slice(0, 8)}
                          </Button>
                          <div className="text-sm text-muted-foreground">
                            {payment.item_description}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div className="font-semibold">
                            {payment.quote?.totalPrice ? 
                              formatCurrency(parseFloat(payment.quote.totalPrice)) : 
                              'N/A'
                            }
                          </div>
                          {getPaymentStatusBadge(payment)}
                        </div>
                      </div>

                      {/* Shopper info and actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                            {payment.profiles?.first_name?.charAt(0)}{payment.profiles?.last_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {payment.profiles?.first_name} {payment.profiles?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {payment.profiles?.email || `user_${payment.user_id.slice(0, 8)}`}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <PaymentProofDialog payment={payment} />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewPackageDetail(payment)}
                            className="h-8 px-3"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver detalle
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmación */}
      <Dialog 
        open={confirmDialog.isOpen} 
        onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, action: 'approve', payment: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === 'approve' ? 'Aprobar' : 'Rechazar'} Pago
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              ¿Estás seguro de que deseas {confirmDialog.action === 'approve' ? 'aprobar' : 'rechazar'} 
              el pago del pedido #{confirmDialog.payment?.id}?
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="comment">Comentario (opcional)</Label>
              <Textarea
                id="comment"
                placeholder={`Agregar comentario sobre la ${confirmDialog.action === 'approve' ? 'aprobación' : 'rechazo'}...`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ isOpen: false, action: 'approve', payment: null })}
              >
                Cancelar
              </Button>
              <Button
                variant={confirmDialog.action === 'approve' ? 'default' : 'destructive'}
                onClick={handlePaymentAction}
              >
                {confirmDialog.action === 'approve' ? 'Aprobar' : 'Rechazar'} Pago
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentsTab;