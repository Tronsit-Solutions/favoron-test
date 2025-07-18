import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePaymentOrders } from "@/hooks/usePaymentOrders";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Eye, FileText, CreditCard, User, MapPin, Package, Upload } from "lucide-react";

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
  receipt_url?: string;
  receipt_filename?: string;
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
  const { paymentOrders, loading, updatePaymentOrder } = usePaymentOrders();
  
  // Filter out null/undefined orders and ensure they have proper structure
  const orders = (paymentOrders || [])
    .filter(order => order && order.id) // Remove null/undefined orders
    .map(order => ({
      ...order,
      profiles: (order as any)?.profiles || null,
      packages: (order as any)?.packages || null
    })) as PaymentOrderWithDetails[];
    
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ 
    isOpen: boolean; 
    action: 'complete' | 'reject'; 
    order: any 
  }>({
    isOpen: false,
    action: 'complete',
    order: null
  });
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const pendingOrders = orders.filter(order => order && order.status === 'pending');
  const processedOrders = orders.filter(order => order && order.status !== 'pending');

  const handlePaymentAction = async () => {
    if (!confirmDialog.order) return;

    try {
      setUploading(true);
      const newStatus = confirmDialog.action === 'complete' ? 'completed' : 'rejected';
      const updateData: any = {
        status: newStatus,
        notes: notes.trim() || undefined,
      };

      if (confirmDialog.action === 'complete') {
        updateData.completed_at = new Date().toISOString();
        
        // Upload receipt if provided
        if (receiptFile) {
          const fileExt = receiptFile.name.split('.').pop();
          const fileName = `${confirmDialog.order.id}_${Date.now()}.${fileExt}`;
          const filePath = `${confirmDialog.order.traveler_id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('payment-receipts')
            .upload(filePath, receiptFile);

          if (uploadError) {
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('payment-receipts')
            .getPublicUrl(filePath);

          updateData.receipt_url = publicUrl;
          updateData.receipt_filename = receiptFile.name;
        }
      }

      await updatePaymentOrder(confirmDialog.order.id, updateData);
      
      toast({
        title: confirmDialog.action === 'complete' ? "Pago completado" : "Pago rechazado",
        description: `La orden de pago ha sido ${confirmDialog.action === 'complete' ? 'completada' : 'rechazada'} exitosamente.${receiptFile ? ' El comprobante ha sido adjuntado.' : ''}`,
        variant: confirmDialog.action === 'complete' ? "default" : "destructive"
      });

      setConfirmDialog({ isOpen: false, action: 'complete', order: null });
      setNotes("");
      setReceiptFile(null);
    } catch (error) {
      console.error('Error updating payment order:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar la acción. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: "Solo se permiten imágenes (JPEG, PNG, WebP) y PDF",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo no puede ser mayor a 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setReceiptFile(file);
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

  const OrderDetailModal = ({ order, isOpen, onClose }: any) => {
    // Early return if order is null or undefined
    if (!order) {
      return null;
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
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

          {order.packages && (
            <div>
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
            </div>
          )}

          {order.receipt_url && (
            <div>
              <Label className="text-sm font-medium">Comprobante de pago</Label>
              <div className="bg-muted/30 rounded p-3 mt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{order.receipt_filename || 'Comprobante'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(order.receipt_url, '_blank')}
                  >
                    Ver comprobante
                  </Button>
                </div>
              </div>
            </div>
          )}

          {order.notes && (
            <div>
              <Label className="text-sm font-medium">Notas</Label>
              <div className="bg-muted/30 rounded p-3 mt-1">
                <p className="text-sm">{order.notes}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-sm font-medium">Fecha de creación</Label>
              <p className="mt-1">{new Date(order.created_at).toLocaleString('es-GT')}</p>
            </div>
            {order.completed_at && (
              <div>
                <Label className="text-sm font-medium">Fecha de completado</Label>
                <p className="mt-1">{new Date(order.completed_at).toLocaleString('es-GT')}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    );
  };

  if (loading) {
    return <div className="flex justify-center py-8">Cargando órdenes de pago...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold">Órdenes de Pago a Viajeros</h3>
        {pendingOrders.length > 0 && (
          <Badge variant="destructive" className="ml-2">
            {pendingOrders.length} pendientes
          </Badge>
        )}
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
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Viajero</TableHead>
                      <TableHead>Viaje</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((order) => (
                      <TableRow key={order.id}>
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
                          <div className="font-medium text-lg">
                            {formatCurrency(order.amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{order.bank_name}</p>
                            <p className="text-muted-foreground">{order.bank_account_holder}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('es-GT')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setConfirmDialog({
                                isOpen: true,
                                action: 'complete',
                                order
                              })}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Completar
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
              <CardTitle>Historial de Órdenes Procesadas</CardTitle>
            </CardHeader>
            <CardContent>
              {processedOrders.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay órdenes procesadas aún</p>
                </div>
              ) : (
                <Table>
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
                    {processedOrders.map((order) => (
                      <TableRow key={order.id}>
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver detalle
                          </Button>
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

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.isOpen} 
        onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, action: 'complete', order: null })}
      >
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
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder={`Agregar notas sobre la ${confirmDialog.action === 'complete' ? 'transferencia' : 'rechazo'}...`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            {confirmDialog.action === 'complete' && (
              <div className="space-y-2">
                <Label htmlFor="receipt">Comprobante de pago (opcional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-center">
                      <Label htmlFor="receipt" className="cursor-pointer text-primary hover:text-primary/80">
                        Seleccionar archivo
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, WebP o PDF (máx. 5MB)
                      </p>
                    </div>
                    <Input
                      id="receipt"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  {receiptFile && (
                    <div className="mt-3 p-2 bg-muted rounded flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">{receiptFile.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReceiptFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmDialog({ isOpen: false, action: 'complete', order: null });
                  setReceiptFile(null);
                  setNotes("");
                }}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button
                variant={confirmDialog.action === 'complete' ? 'default' : 'destructive'}
                onClick={handlePaymentAction}
                disabled={uploading}
              >
                {uploading ? 'Procesando...' : (confirmDialog.action === 'complete' ? 'Completar Pago' : 'Rechazar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTravelerPaymentsTab;