import { useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminRefundOrders } from '@/hooks/useRefundOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';
import { 
  RefreshCw, 
  Check, 
  X, 
  Eye, 
  Loader2,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';

const AdminRefundsTab = () => {
  const { refundOrders, loading, updateRefundStatus, uploadRefundReceipt, refreshRefundOrders } = useAdminRefundOrders();
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [actionModal, setActionModal] = useState<{
    type: 'complete' | 'reject';
    refund: any;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [completeFile, setCompleteFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const pendingRefunds = refundOrders.filter(r => r.status === 'pending');
  const completedRefunds = refundOrders.filter(r => r.status === 'completed');
  const rejectedRefunds = refundOrders.filter(r => r.status === 'rejected');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleReject = async () => {
    if (!actionModal) return;
    setProcessing(true);
    await updateRefundStatus(actionModal.refund.id, 'rejected', notes || undefined);
    setProcessing(false);
    setActionModal(null);
    setNotes('');
  };

  const handleComplete = async () => {
    if (!actionModal) return;
    setProcessing(true);
    
    let receiptUrl: string | undefined;
    let receiptFilename: string | undefined;
    
    if (completeFile) {
      const uploadedPath = await uploadRefundReceipt(actionModal.refund.id, completeFile);
      if (uploadedPath) {
        receiptUrl = uploadedPath;
        receiptFilename = completeFile.name;
      }
    }
    
    await updateRefundStatus(actionModal.refund.id, 'completed', notes || undefined, receiptUrl, receiptFilename);
    setProcessing(false);
    setActionModal(null);
    setNotes('');
    setCompleteFile(null);
  };

  const RefundTable = ({ refunds, showActions = true }: { refunds: any[]; showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Paquete</TableHead>
          <TableHead>Shopper</TableHead>
          <TableHead>Producto(s)</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Banco</TableHead>
          <TableHead>Estado</TableHead>
          {showActions && <TableHead>Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {refunds.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 8 : 7} className="text-center text-muted-foreground py-8">
              No hay reembolsos en esta categoría
            </TableCell>
          </TableRow>
        ) : (
          refunds.map((refund) => (
            <TableRow key={refund.id}>
              <TableCell className="text-sm">
                {new Date(refund.created_at).toLocaleDateString('es-GT')}
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono font-medium">
                  {refund.package?.label_number ? `#${refund.package.label_number}` : refund.package_id?.slice(0, 8)}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">
                    {refund.shopper?.first_name} {refund.shopper?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{refund.shopper?.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-[250px]">
                  {(() => {
                    const isFullCancellation = refund.reason?.startsWith('Cancelación completa') || refund.package?.status === 'cancelled';
                    const totalProducts = Array.isArray(refund.package?.products_data) ? refund.package.products_data.length : 0;
                    const cancelledCount = refund.cancelled_products?.length || 0;
                    return (
                      <p className="text-xs font-medium mb-0.5">
                        {isFullCancellation ? (
                          <span className="text-destructive">Completa</span>
                        ) : (
                          <span className="text-yellow-600">Parcial ({cancelledCount} de {totalProducts})</span>
                        )}
                      </p>
                    );
                  })()}
                  {refund.cancelled_products?.map((p: any, i: number) => {
                    const productName = p.description || p.itemDescription || 'Producto';
                    const qty = p.quantity && p.quantity > 1 ? ` (x${p.quantity})` : '';
                    return (
                      <p key={i} className="text-xs truncate" title={productName}>
                        {productName}{qty}
                      </p>
                    );
                  })}
                </div>
              </TableCell>
              <TableCell className="font-semibold text-green-600">
                {formatCurrency(refund.amount)}
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <p className="font-medium">{refund.bank_name}</p>
                  <p className="text-muted-foreground">{refund.bank_account_number}</p>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(refund.status)}</TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRefund(refund)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {refund.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => setActionModal({ type: 'complete', refund })}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setActionModal({ type: 'reject', refund })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingRefunds.length}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{completedRefunds.length}</p>
                <p className="text-xs text-muted-foreground">Completados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(completedRefunds.reduce((sum, r) => sum + r.amount, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Total Reembolsado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Órdenes de Reembolso
          </CardTitle>
          <Button variant="outline" size="sm" onClick={refreshRefundOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending" className="relative">
                  Pendientes
                  {pendingRefunds.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {pendingRefunds.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">Completados ({completedRefunds.length})</TabsTrigger>
                <TabsTrigger value="rejected">Rechazados ({rejectedRefunds.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <RefundTable refunds={pendingRefunds} />
              </TabsContent>
              <TabsContent value="completed">
                <RefundTable refunds={completedRefunds} showActions={false} />
              </TabsContent>
              <TabsContent value="rejected">
                <RefundTable refunds={rejectedRefunds} showActions={false} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Detalle de Reembolso</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <ScrollArea className="flex-1 overflow-hidden min-h-0 pr-4">
              <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Shopper</p>
                  <p className="font-medium">{selectedRefund.shopper?.first_name} {selectedRefund.shopper?.last_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRefund.shopper?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monto</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(selectedRefund.amount)}</p>
                </div>
              </div>

              {/* Cancellation type indicator */}
              {(() => {
                const isFullCancellation = selectedRefund.reason?.startsWith('Cancelación completa') || selectedRefund.package?.status === 'cancelled';
                const totalProducts = Array.isArray(selectedRefund.package?.products_data) ? selectedRefund.package.products_data.length : 0;
                const cancelledCount = selectedRefund.cancelled_products?.length || 0;
                return (
                  <div>
                    {isFullCancellation ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelación completa del pedido
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Cancelación parcial ({cancelledCount} de {totalProducts} productos)
                      </Badge>
                    )}
                  </div>
                );
              })()}

              <div>
                <p className="text-xs text-muted-foreground mb-1">Datos Bancarios</p>
                <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                  <p><strong>Banco:</strong> {selectedRefund.bank_name}</p>
                  <p><strong>Titular:</strong> {selectedRefund.bank_account_holder}</p>
                  <p><strong>Cuenta:</strong> {selectedRefund.bank_account_number}</p>
                  <p><strong>Tipo:</strong> {selectedRefund.bank_account_type === 'monetary' ? 'Monetaria' : 'Ahorro'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Productos Cancelados</p>
                <div className="space-y-3">
                  {selectedRefund.cancelled_products?.map((p: any, i: number) => {
                    const productName = p.description || p.itemDescription || 'Producto sin descripción';
                    const quantity = p.quantity || 1;
                    const tip = p.tip || p.adminAssignedTip || 0;
                    const serviceFee = p.serviceFee ?? Math.round(tip * 0.5 * 100) / 100;
                    const serviceFeePercent = tip > 0 ? Math.round((serviceFee / tip) * 100) : 50;
                    const isPrimeExempt = p.isPrimeExempt || false;
                    const penalty = isPrimeExempt ? 0 : (p.cancellationPenalty ?? p.penaltyApplied ?? 5);
                    const estimatedPrice = p.estimatedPrice;
                    const deliveryFee = p.deliveryFee || 0;
                    const calculatedTotal = tip + serviceFee + deliveryFee - penalty;
                    const totalRefund = p.totalRefund || p.grossRefund || calculatedTotal;
                    
                    return (
                      <div key={i} className="bg-muted p-3 rounded text-sm">
                        <p className="font-medium mb-2">{productName}</p>
                        
                        <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                          {quantity > 1 && (
                            <p>Cantidad: <span className="text-foreground">{quantity}</span></p>
                          )}
                          {estimatedPrice && (
                            <p>Precio estimado: <span className="text-foreground">{formatCurrency(estimatedPrice)}</span></p>
                          )}
                        </div>
                        
                        <div className="border-t border-border/50 pt-2 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Desglose del Reembolso:</p>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Tip del viajero:</span>
                            <span className="text-foreground">{formatCurrency(tip)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Fee de Favoron ({serviceFeePercent}%):</span>
                            <span className="text-foreground">+{formatCurrency(serviceFee)}</span>
                          </div>
                          {deliveryFee > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Delivery:</span>
                              <span className="text-foreground">+{formatCurrency(deliveryFee)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Penalización por cancelación:</span>
                            <span className={penalty > 0 ? "text-destructive" : "text-muted-foreground"}>
                              {penalty > 0 ? `-${formatCurrency(penalty)}` : formatCurrency(0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border/50 mt-1">
                            <span>Total Reembolso:</span>
                            <span className="text-green-600">{formatCurrency(totalRefund)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Razón</p>
                <p className="text-sm">{selectedRefund.reason}</p>
              </div>

              {selectedRefund.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notas</p>
                  <p className="text-sm">{selectedRefund.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Creado: {new Date(selectedRefund.created_at).toLocaleString('es-GT')}
                </p>
                {getStatusBadge(selectedRefund.status)}
              </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={!!actionModal} onOpenChange={() => { setActionModal(null); setNotes(''); setCompleteFile(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal?.type === 'complete' && 'Completar Reembolso'}
              {actionModal?.type === 'reject' && 'Rechazar Reembolso'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {actionModal && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">{formatCurrency(actionModal.refund.amount)}</p>
                <p className="text-sm text-muted-foreground">
                  {actionModal.refund.shopper?.first_name} {actionModal.refund.shopper?.last_name}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar notas..."
                rows={3}
              />
            </div>

            {actionModal?.type === 'complete' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Comprobante de transferencia (opcional)</label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setCompleteFile(e.target.files?.[0] || null)}
                  disabled={processing}
                />
                {completeFile && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {completeFile.name}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionModal(null); setNotes(''); setCompleteFile(null); }} disabled={processing}>
              Cancelar
            </Button>
            {actionModal?.type === 'complete' && (
              <Button onClick={handleComplete} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Completar Reembolso
              </Button>
            )}
            {actionModal?.type === 'reject' && (
              <Button variant="destructive" onClick={handleReject} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Rechazar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRefundsTab;
