import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePaymentOrders } from "@/hooks/usePaymentOrders";
import { Check, X, Eye, FileText, CreditCard, User, MapPin, Package, AlertCircle, CheckCircle, Clock } from "lucide-react";
type PaymentOrderWithDetails = {
  id: string;
  amount: number;
  bank_account_holder: string;
  bank_name: string;
  bank_account_type: string;
  bank_account_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  notes?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  packages?: {
    item_description: string;
    trips?: {
      from_city: string;
      to_city: string;
    };
  };
};
const AdminTravelerPaymentsTab = () => {
  const {
    paymentOrders,
    loading,
    updatePaymentOrder
  } = usePaymentOrders();

  // Filter out null/undefined orders and ensure they have proper structure
  const orders = (paymentOrders || []).filter(order => order && order.id) // Remove null/undefined orders
  .map(order => ({
    ...order,
    profiles: (order as any)?.profiles || null,
    packages: (order as any)?.packages || null
  })) as PaymentOrderWithDetails[];
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'complete' | 'reject';
    order: any;
  }>({
    isOpen: false,
    action: 'complete',
    order: null
  });
  const [notes, setNotes] = useState("");
  const {
    toast
  } = useToast();
  const pendingOrders = orders.filter(order => order && order.status === 'pending');
  const processedOrders = orders.filter(order => order && order.status !== 'pending');
  const handlePaymentAction = async () => {
    if (!confirmDialog.order) return;
    try {
      const newStatus = confirmDialog.action === 'complete' ? 'completed' : 'rejected';
      const updateData: any = {
        status: newStatus,
        notes: notes.trim() || undefined
      };
      if (confirmDialog.action === 'complete') {
        updateData.completed_at = new Date().toISOString();
      }
      await updatePaymentOrder(confirmDialog.order.id, updateData);
      toast({
        title: confirmDialog.action === 'complete' ? "Pago completado" : "Pago rechazado",
        description: `La orden de pago ha sido ${confirmDialog.action === 'complete' ? 'completada' : 'rechazada'} exitosamente.`,
        variant: confirmDialog.action === 'complete' ? "default" : "destructive"
      });
      setConfirmDialog({
        isOpen: false,
        action: 'complete',
        order: null
      });
      setNotes("");
    } catch (error) {
      console.error('Error updating payment order:', error);
    }
  };
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const OrderDetailModal = ({
    order,
    isOpen,
    onClose
  }: any) => {
    // Early return if order is null or undefined
    if (!order) {
      return null;
    }
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la orden de pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Viajero</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4" />
                  <span>{order.profiles?.first_name || 'N/A'} {order.profiles?.last_name || ''}</span>
                </div>
                <p className="text-sm text-muted-foreground">{order.profiles?.email || 'Sin email'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Monto</Label>
                <div className="flex items-center gap-2 mt-1">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-lg font-bold">{formatCurrency(order.amount || 0)}</span>
                </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Información bancaria</Label>
            <div className="bg-muted/30 rounded p-3 mt-1">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Titular:</span> {order.bank_account_holder || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Banco:</span> {order.bank_name || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Tipo:</span> {order.bank_account_type || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Número:</span> {order.bank_account_number || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {order.packages && <div>
              <Label className="text-sm font-medium">Información del viaje</Label>
              <div className="bg-muted/30 rounded p-3 mt-1">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">
                    {order.packages.trips?.from_city || 'N/A'} → {order.packages.trips?.to_city || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Paquete: {order.packages.item_description || 'N/A'}</span>
                </div>
              </div>
            </div>}

          {order.notes && <div>
              <Label className="text-sm font-medium">Notas</Label>
              <div className="bg-muted/30 rounded p-3 mt-1">
                <p className="text-sm">{order.notes}</p>
              </div>
            </div>}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-sm font-medium">Fecha de creación</Label>
              <p className="mt-1">{new Date(order.created_at).toLocaleString('es-GT')}</p>
            </div>
            {order.completed_at && <div>
                <Label className="text-sm font-medium">Fecha de completado</Label>
                <p className="mt-1">{new Date(order.completed_at).toLocaleString('es-GT')}</p>
              </div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>;
  };
  if (loading) {
    return <div className="flex justify-center py-8">Cargando órdenes de pago...</div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold">Órdenes de Pago a Viajeros</h3>
        {pendingOrders.length > 0 && <Badge variant="destructive" className="ml-2">
            {pendingOrders.length} pendientes
          </Badge>}
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="relative flex items-center gap-2">
            Órdenes Pendientes
            {pendingOrders.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {pendingOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center gap-2">
            Órdenes Procesadas
            <Badge variant="outline" className="ml-1 text-xs">
              {processedOrders.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay órdenes de pago pendientes</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Órdenes Pendientes de Pago</CardTitle>
                <CardDescription>
                  Gestiona los pagos pendientes a viajeros por entregas completadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {order.profiles?.first_name || 'N/A'} {order.profiles?.last_name || ''}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              Pendiente
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.profiles?.email || 'Sin email'} • 
                            Creada el {new Date(order.created_at).toLocaleDateString('es-GT')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            {order.amount} GTQ
                          </div>
                        </div>
                      </div>

                      {/* Trip and Package Info */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
                        <div>
                          <h5 className="text-sm font-medium mb-2">Información del Viaje</h5>
                          <p className="text-sm text-muted-foreground">
                            <strong>Ruta:</strong> {(order as any).trips?.from_city} → {(order as any).trips?.to_city}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Fechas:</strong> {(order as any).trips?.departure_date ? new Date((order as any).trips.departure_date).toLocaleDateString('es-GT') : 'No especificado'} - {(order as any).trips?.arrival_date ? new Date((order as any).trips.arrival_date).toLocaleDateString('es-GT') : 'No especificado'}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium mb-3 flex items-center">
                            📋 Detalle de Facturación - Paquetes Entregados
                          </h5>
                          {(order as any).trips?.packages && (order as any).trips.packages.length > 0 ? (
                            <div className="bg-white border rounded-lg p-3">
                              <div className="space-y-3 max-h-40 overflow-y-auto">
                                {(order as any).trips.packages
                                  .filter((pkg: any) => ['delivered_to_office', 'ready_for_pickup', 'ready_for_delivery', 'completed'].includes(pkg.status))
                                  .map((pkg: any, index: number) => (
                                  <div key={pkg.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                                    <div className="flex justify-between items-start mb-1">
                                      <div className="flex-1 pr-2">
                                        <p className="text-sm font-medium text-gray-800">{pkg.item_description}</p>
                                        <p className="text-xs text-gray-500">ID: {pkg.id.slice(0, 8)}...</p>
                                        <p className="text-xs text-green-600 capitalize">{pkg.status.replace(/_/g, ' ')}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-800">${pkg.estimated_price}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Invoice Summary */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm text-gray-600">Subtotal ({(order as any).trips.packages.filter((pkg: any) => ['delivered_to_office', 'ready_for_pickup', 'ready_for_delivery', 'completed'].includes(pkg.status)).length} paquetes):</span>
                                  <span className="text-sm font-medium">
                                    ${(order as any).trips.packages
                                      .filter((pkg: any) => ['delivered_to_office', 'ready_for_pickup', 'ready_for_delivery', 'completed'].includes(pkg.status))
                                      .reduce((sum: number, pkg: any) => sum + (pkg.estimated_price || 0), 0).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm text-gray-600">Comisión de servicio:</span>
                                  <span className="text-sm">Incluida</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                  <span className="text-base font-semibold text-gray-800">Total a Pagar:</span>
                                  <span className="text-base font-bold text-green-600">${order.amount}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border rounded-lg p-4 text-center">
                              <p className="text-sm text-gray-500">Sin paquetes para facturar</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="text-sm font-medium mb-1">Información Bancaria</h5>
                          <p className="text-sm text-muted-foreground">
                            <strong>Banco:</strong> {order.bank_name || 'No especificado'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Titular:</strong> {order.bank_account_holder || 'No especificado'}
                          </p>
                          <p className="text-sm text-muted-foreground font-mono">
                            <strong>Cuenta:</strong> {order.bank_account_number || 'No especificado'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Tipo:</strong> {order.bank_account_type || 'No especificado'}
                          </p>
                          {(order as any).bank_swift_code && (
                            <p className="text-sm text-muted-foreground font-mono">
                              <strong>SWIFT:</strong> {(order as any).bank_swift_code}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => setConfirmDialog({
                            isOpen: true,
                            action: 'complete',
                            order
                          })}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Completar Pago
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => setConfirmDialog({
                            isOpen: true,
                            action: 'reject',
                            order
                          })}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
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
              <CardTitle>Historial de Órdenes Procesadas</CardTitle>
            </CardHeader>
            <CardContent>
              {processedOrders.length === 0 ? <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay órdenes procesadas aún</p>
                </div> : <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Viajero</TableHead>
                      <TableHead>Viaje</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedOrders.map(order => <TableRow key={order.id}>
                         <TableCell>
                           <div>
                             <p className="font-medium">
                               {order.profiles?.first_name || 'N/A'} {order.profiles?.last_name || ''}
                             </p>
                             <p className="text-sm text-muted-foreground">
                               {order.profiles?.email || 'Sin email'}
                             </p>
                           </div>
                         </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {order.packages?.trips?.from_city} → {order.packages?.trips?.to_city}
                            </p>
                            <p className="text-muted-foreground">
                              {order.packages?.item_description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(order.amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(order.updated_at).toLocaleDateString('es-GT')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver detalle
                          </Button>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Detail Modal */}
      <OrderDetailModal order={selectedOrder} isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} />

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={open => !open && setConfirmDialog({
      isOpen: false,
      action: 'complete',
      order: null
    })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === 'complete' ? 'Completar' : 'Rechazar'} Orden de Pago
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              ¿Estás seguro de que deseas {confirmDialog.action === 'complete' ? 'completar' : 'rechazar'} 
              esta orden de pago por {formatCurrency(confirmDialog.order?.amount || 0)}?
            </p>
            
            {/* Banking Information */}
            {confirmDialog.order && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-sm">Información Bancaria del Viajero</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Titular:</span>
                    <p className="text-muted-foreground">
                      {confirmDialog.order.bank_account_holder || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Banco:</span>
                    <p className="text-muted-foreground">
                      {confirmDialog.order.bank_name || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Tipo de Cuenta:</span>
                    <p className="text-muted-foreground">
                      {confirmDialog.order.bank_account_type || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Número de Cuenta:</span>
                    <p className="text-muted-foreground font-mono">
                      {confirmDialog.order.bank_account_number || 'No especificado'}
                    </p>
                  </div>
                  {(confirmDialog.order as any).bank_swift_code && (
                    <div className="md:col-span-2">
                      <span className="font-medium">Código SWIFT:</span>
                      <p className="text-muted-foreground font-mono">
                        {(confirmDialog.order as any).bank_swift_code}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea id="notes" placeholder={`Agregar notas sobre la ${confirmDialog.action === 'complete' ? 'transferencia' : 'rechazo'}...`} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDialog({
              isOpen: false,
              action: 'complete',
              order: null
            })}>
                Cancelar
              </Button>
              <Button variant={confirmDialog.action === 'complete' ? 'default' : 'destructive'} onClick={handlePaymentAction}>
                {confirmDialog.action === 'complete' ? 'Completar Pago' : 'Rechazar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default AdminTravelerPaymentsTab;