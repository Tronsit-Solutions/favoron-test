import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="relative flex items-center gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Órdenes Pendientes
              {pendingOrders.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {pendingOrders.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Órdenes Procesadas
              <Badge variant="outline" className="ml-1 text-xs">
                {processedOrders.length}
              </Badge>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {pendingOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="bg-muted rounded-full p-4 mb-4">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay órdenes pendientes</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Todas las órdenes de pago han sido procesadas. Las nuevas órdenes aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {pendingOrders.map(order => (
                <Card key={order.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendiente
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Creada el {new Date(order.created_at).toLocaleDateString('es-GT', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-green-600">
                          {formatCurrency(order.amount)} GTQ
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setConfirmDialog({
                            isOpen: true,
                            action: 'complete',
                            order
                          })}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Completar Pago
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => setConfirmDialog({
                            isOpen: true,
                            action: 'reject',
                            order
                          })}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Traveler Information */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 rounded-full p-2">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Información del Viajero</h4>
                            <p className="text-sm text-muted-foreground">Datos del beneficiario</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre Completo</label>
                            <p className="text-sm font-medium">
                              {order.profiles?.first_name || 'N/A'} {order.profiles?.last_name || ''}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                            <p className="text-sm text-muted-foreground">
                              {order.profiles?.email || 'Sin email registrado'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Trip Information */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 rounded-full p-2">
                            <MapPin className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Información del Viaje</h4>
                            <p className="text-sm text-muted-foreground">Detalles de la entrega</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ruta</label>
                            <p className="text-sm font-medium">
                              {order.packages?.trips?.from_city} → {order.packages?.trips?.to_city}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Paquete</label>
                            <p className="text-sm text-muted-foreground">
                              {order.packages?.item_description || 'Sin descripción'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Banking Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 rounded-full p-2">
                          <CreditCard className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Información Bancaria</h4>
                          <p className="text-sm text-muted-foreground">Datos para la transferencia</p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Banco</label>
                            <p className="text-sm font-medium">{order.bank_name || 'No especificado'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Titular</label>
                            <p className="text-sm font-medium">{order.bank_account_holder || 'No especificado'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo de Cuenta</label>
                            <p className="text-sm font-medium">{order.bank_account_type || 'No especificado'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Número de Cuenta</label>
                            <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                              {order.bank_account_number || 'No especificado'}
                            </p>
                          </div>
                          {(order as any).bank_swift_code && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Código SWIFT</label>
                              <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                                {(order as any).bank_swift_code}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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