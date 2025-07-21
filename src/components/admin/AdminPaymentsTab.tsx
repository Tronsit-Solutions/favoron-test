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
import { Check, X, Eye, FileText, DollarSign } from "lucide-react";

interface AdminPaymentsTabProps {
  packages: any[];
  onUpdateStatus: (type: 'package' | 'trip', id: number, status: string) => void;
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
    pkg.status === 'paid' && pkg.payment_receipt
  );

  // Filtrar pagos ya aprobados/procesados
  const processedPayments = packages.filter(pkg => 
    (pkg.status === 'approved' && pkg.payment_receipt) || 
    (pkg.status === 'pending_approval' && pkg.payment_receipt)
  );

  const handlePaymentAction = () => {
    if (!confirmDialog.payment) return;

    const newStatus = confirmDialog.action === 'approve' ? 'approved' : 'pending_approval';
    
    // Actualizar el estado del paquete
    onUpdateStatus('package', confirmDialog.payment.id, newStatus);
    
    toast({
      title: confirmDialog.action === 'approve' ? "Pago aprobado" : "Pago rechazado",
      description: `El pago del pedido #${confirmDialog.payment.id} ha sido ${confirmDialog.action === 'approve' ? 'aprobado' : 'rechazado'}.`,
      variant: confirmDialog.action === 'approve' ? "default" : "destructive"
    });

    setConfirmDialog({ isOpen: false, action: 'approve', payment: null });
    setComment("");
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getPaymentStatusBadge = (pkg: any) => {
    if (pkg.status === 'approved' && pkg.payment_receipt) {
      return <Badge variant="default" className="bg-green-500">Aprobado</Badge>;
    }
    if (pkg.status === 'paid') {
      return <Badge variant="secondary">Pendiente</Badge>;
    }
    if (pkg.status === 'pending_approval' && pkg.payment_receipt) {
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
                <CardTitle>Pagos Pendientes de Aprobación</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Shopper</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Comprobante</TableHead>
                      <TableHead>Fecha Pago</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Button
                            variant="link"
                            onClick={() => onViewPackageDetail(payment)}
                            className="p-0 h-auto font-medium"
                          >
                            #{payment.id}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Usuario {payment.userId}</p>
                            <p className="text-sm text-muted-foreground">
                              usuario{payment.userId}@email.com
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {payment.quote?.totalPrice ? 
                              formatCurrency(parseFloat(payment.quote.totalPrice)) : 
                              'N/A'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <PaymentProofDialog payment={payment} />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setConfirmDialog({
                                isOpen: true,
                                action: 'approve',
                                payment
                              })}
                            >
                              <Check className="h-4 w-4 mr-1" />
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
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Shopper</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Procesado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Button
                            variant="link"
                            onClick={() => onViewPackageDetail(payment)}
                            className="p-0 h-auto font-medium"
                          >
                            #{payment.id}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Usuario {payment.userId}</p>
                            <p className="text-sm text-muted-foreground">
                              usuario{payment.userId}@email.com
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {payment.quote?.totalPrice ? 
                              formatCurrency(parseFloat(payment.quote.totalPrice)) : 
                              'N/A'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(payment)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <PaymentProofDialog payment={payment} />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewPackageDetail(payment)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver detalle
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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