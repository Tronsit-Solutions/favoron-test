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
import { Check, X, Eye, FileText, CreditCard, User, MapPin, Package, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronRight, Upload, Paperclip, ExternalLink, Receipt } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/priceHelpers";

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
  const { paymentOrders, loading, updatePaymentOrder } = usePaymentOrders();
  
  const orders = (paymentOrders || []).filter(order => order && order.id)
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
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [packageBreakdown, setPackageBreakdown] = useState<Array<{
    id: string;
    item_description: string;
    products_data?: any;
    quote?: { price?: number };
    admin_assigned_tip?: number;
  }>>([]);
  const { toast } = useToast();
  const maskAccount = (num?: string) => (num && typeof num === 'string' ? `•••• ${num.slice(-4)}` : 'N/A');

  // Función para obtener el desglose de paquetes
  const fetchPackageBreakdown = async (tripId: string, travelerId: string) => {
    console.log('🔍 AdminTravelerPaymentsTab - Fetching package breakdown:', { tripId, travelerId });
    
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('id, item_description, products_data, status, matched_trip_id')
        .eq('matched_trip_id', tripId)
        .in('status', ['received_by_traveler', 'completed'])
        .not('products_data', 'is', null)
        .order('updated_at', { ascending: false });
      
      console.log('📦 AdminTravelerPaymentsTab - Package query result:', { 
        data, 
        error, 
        tripId,
        dataLength: data?.length || 0,
        statuses: data?.map(p => p.status) || []
      });
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      setPackageBreakdown(data || []);
      console.log('✅ Package breakdown set:', data?.length || 0, 'packages');
    } catch (error) {
      console.error('❌ Error fetching package breakdown:', error);
      setPackageBreakdown([]);
    }
  };
  
  const pendingOrders = orders.filter(order => order && order.status === 'pending');
  const processedOrders = orders.filter(order => order && order.status !== 'pending');

  const toggleRowExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

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
        
        // Subir foto del recibo si existe
        if (receiptPhoto) {
          try {
            const fileExt = receiptPhoto.name.split('.').pop();
            const fileName = `payment-${confirmDialog.order.id}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('payment-receipts')
              .upload(fileName, receiptPhoto);
              
            if (!uploadError) {
              // Store storage file path (private bucket)
              updateData.receipt_url = fileName;
              updateData.receipt_filename = receiptPhoto.name;
            } else {
              console.error('Error uploading receipt:', uploadError);
              toast({
                title: "Error",
                description: "Error al subir el comprobante, pero el pago se completará.",
                variant: "destructive"
              });
            }
          } catch (uploadError) {
            console.error('Error uploading receipt:', uploadError);
          }
        }
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
      setReceiptPhoto(null);
    } catch (error) {
      console.error('Error updating payment order:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="text-xs">Pendiente</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500 text-xs">Completado</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs">Rechazado</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="text-xs">Cancelado</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const CompactOrderRow = ({ order }: { order: any }) => {
    const isExpanded = expandedRows.has(order.id);
    // Usar historical_packages por defecto, fallback a live packages
    const packages = order.historical_packages || (order as any).trips?.packages?.filter((pkg: any) => 
      ['delivered_to_office', 'ready_for_pickup', 'ready_for_delivery', 'completed'].includes(pkg.status)
    ) || [];
    const totalCompensation = packages.reduce((sum: number, pkg: any) => sum + (pkg.quote?.price || 0), 0);

    return (
      <>
        <TableRow className="hover:bg-muted/50">
          <TableCell className="py-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleRowExpansion(order.id)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </TableCell>
          <TableCell className="py-3">
            <div className="space-y-1">
              <div className="font-medium text-sm">
                {order.profiles?.first_name} {order.profiles?.last_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {order.profiles?.email}
              </div>
            </div>
          </TableCell>
          <TableCell className="py-3">
            <div className="text-right">
              <div className="font-bold text-lg text-green-600">Q{order.amount}</div>
              <div className="text-xs text-muted-foreground">GTQ</div>
            </div>
          </TableCell>
          <TableCell className="py-3">
            <div className="space-y-1">
              <div className="font-medium text-sm">{order.bank_account_holder}</div>
              <div className="text-xs text-muted-foreground">{order.bank_name}</div>
              <div className="text-xs font-mono text-gray-700">{maskAccount(order.bank_account_number)}</div>
              <div className="text-xs text-muted-foreground capitalize">{order.bank_account_type}</div>
            </div>
          </TableCell>
          <TableCell className="py-3">
            <div className="flex gap-1">
              {order.status === 'pending' && (
                <>
                  <Button 
                    size="sm" 
                    className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
                    onClick={() => setConfirmDialog({
                      isOpen: true,
                      action: 'complete',
                      order
                    })}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Pagar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="h-8 px-3 text-xs"
                    onClick={() => setConfirmDialog({
                      isOpen: true,
                      action: 'reject',
                      order
                    })}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Rechazar
                  </Button>
                </>
              )}
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => setSelectedOrder(order)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Ver
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {isExpanded && (
          <TableRow className="bg-muted/20">
            <TableCell colSpan={5} className="py-3">
              <div className="space-y-3">
                {/* Invoice Details */}
                <div className="bg-white border rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Detalle de Compensaciones
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {packages.map((pkg: any, index: number) => (
                      <div key={pkg.package_id || pkg.id || index} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{pkg.item_description}</div>
                          <div className="text-xs text-muted-foreground">
                            {(pkg.package_id || pkg.id || '').toString().slice(0, 8)}... • {(pkg.status || '').replace(/_/g, ' ')}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          Q{pkg.quote?.price || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-medium">Total de Compensaciones:</span>
                    <span className="text-base font-bold text-green-600">Q{totalCompensation}</span>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div><strong>Titular:</strong> {order.bank_account_holder}</div>
                    <div><strong>Tipo de Cuenta:</strong> {order.bank_account_type}</div>
                  </div>
                  <div className="space-y-1">
                    <div><strong>Banco:</strong> {order.bank_name}</div>
                    <div><strong>Número:</strong> {order.bank_account_number}</div>
                  </div>
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}
      </>
    );
  };

  const OrderDetailModal = ({ order, isOpen, onClose }: any) => {
    if (!order) return null;
    
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
                  <span className="text-lg font-bold">Q{order.amount}</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Información bancaria</Label>
              <div className="bg-muted/30 rounded p-3 mt-1">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Titular:</span> {order.bank_account_holder || 'N/A'}</div>
                  <div><span className="font-medium">Banco:</span> {order.bank_name || 'N/A'}</div>
                  <div><span className="font-medium">Tipo:</span> {order.bank_account_type || 'N/A'}</div>
                  <div><span className="font-medium">Número:</span> {order.bank_account_number || 'N/A'}</div>
                </div>
              </div>
            </div>

            {order.receipt_url && (
              <div>
                <Label className="text-sm font-medium">Comprobante de Pago</Label>
                <div className="bg-muted/30 rounded p-3 mt-1">
                  <Button 
                    variant="outline" 
                    size="sm"
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
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Comprobante
                  </Button>
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold">Órdenes de Pago</h3>
        {pendingOrders.length > 0 && (
          <Badge variant="destructive" className="ml-2">
            {pendingOrders.length} pendientes
          </Badge>
        )}
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="relative flex items-center gap-2">
            Pendientes
            {pendingOrders.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {pendingOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center gap-2">
            Procesadas
            <Badge variant="outline" className="ml-1 text-xs">
              {processedOrders.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay órdenes pendientes</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Viajero</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Información Bancaria</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map(order => (
                      <CompactOrderRow key={order.id} order={order} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processed">
          {processedOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay órdenes procesadas</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Viajero</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Información Bancaria</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedOrders.map(order => (
                      <CompactOrderRow key={order.id} order={order} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => {
        setConfirmDialog(prev => ({ ...prev, isOpen: open }));
        // Obtener desglose desde packages con travelerId y tripId cuando se abre el dialog
        if (open && confirmDialog.order) {
          console.log('🔍 AdminTravelerPaymentsTab - Dialog opened with order:', {
            order: confirmDialog.order,
            orderKeys: Object.keys(confirmDialog.order || {}),
            trip_id: confirmDialog.order?.trip_id,
            traveler_id: confirmDialog.order?.traveler_id,
            historical_packages: confirmDialog.order?.historical_packages
          });
          
          // Primero intentar con historical_packages como fallback
          if (confirmDialog.order?.historical_packages && Array.isArray(confirmDialog.order.historical_packages)) {
            console.log('✅ Using historical_packages:', confirmDialog.order.historical_packages);
            setPackageBreakdown(confirmDialog.order.historical_packages.map((pkg: any) => ({
              id: pkg.id,
              item_description: pkg.item_description,
              products_data: pkg.products_data || null
            })));
          } 
          // Si no, intentar consulta con trip_id y traveler_id
          else if (confirmDialog.order?.trip_id && confirmDialog.order?.traveler_id) {
            console.log('⚡ Fetching live packages for trip/traveler:', {
              trip_id: confirmDialog.order.trip_id,
              traveler_id: confirmDialog.order.traveler_id
            });
            fetchPackageBreakdown(confirmDialog.order.trip_id, confirmDialog.order.traveler_id);
          } else {
            console.error('❌ No data source available for package breakdown:', {
              has_historical: !!confirmDialog.order?.historical_packages,
              has_trip_id: !!confirmDialog.order?.trip_id,
              has_traveler_id: !!confirmDialog.order?.traveler_id
            });
            setPackageBreakdown([]);
          }
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === 'complete' ? 'Completar Pago' : 'Rechazar Pago'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Payment Amount Section */}
            <div className="text-center p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Receipt className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Desglose de pago:</span>
              </div>
              
              {/* Desglose de paquetes */}
              <div className="space-y-2 mb-3">
                {(() => {
                  console.log('🎯 AdminTravelerPaymentsTab - Rendering breakdown:', {
                    packageBreakdownLength: packageBreakdown.length,
                    packageBreakdown: packageBreakdown,
                    confirmDialogOrder: confirmDialog.order?.id
                  });
                  return null;
                })()}
                {packageBreakdown.length > 0 ? (
                  packageBreakdown.map((pkg, index) => {
                    // Obtener el tip desde diferentes fuentes posibles
                    let packageTip = 0;
                    
                    // Tip exclusivamente desde products_data (adminAssignedTip por producto)
                    if (pkg.products_data && Array.isArray(pkg.products_data)) {
                      packageTip = pkg.products_data.reduce((sum: number, product: any) => {
                        const tip = product?.adminAssignedTip || 0;
                        return sum + (typeof tip === 'string' ? parseFloat(tip) : tip);
                      }, 0);
                    }
                    
                    // Nota: no usamos admin_assigned_tip ni quote.price aquí por solicitud del usuario
                    
                    return (
                      <div key={pkg.id} className="flex justify-between items-center text-xs py-1 px-2 bg-white/50 rounded border-b border-muted/20 last:border-b-0">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground truncate">
                            {pkg.item_description}
                          </span>
                        </div>
                        <span className="font-medium text-green-600 ml-2 flex-shrink-0">
                          {formatCurrency(packageTip)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground py-2">
                    {packageBreakdown.length === 0 ? 
                      'No se encontraron paquetes entregados para este viaje' : 
                      'Cargando desglose de paquetes...'
                    }
                  </div>
                )}
              </div>
              
              {/* Total */}
              <div className="border-t border-muted/40 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">Total a pagar:</span>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(
                      packageBreakdown.reduce((sum: number, pkg: any) => {
                        if (pkg?.products_data && Array.isArray(pkg.products_data)) {
                          const pkgSum = pkg.products_data.reduce((s: number, product: any) => {
                            const tip = product?.adminAssignedTip || 0;
                            return s + (typeof tip === 'string' ? parseFloat(tip) : tip);
                          }, 0);
                          return sum + pkgSum;
                        }
                        return sum;
                      }, 0)
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {confirmDialog.order?.profiles?.first_name} {confirmDialog.order?.profiles?.last_name}
                </div>
              </div>
            </div>

            {/* Banking Information Section */}
            {confirmDialog.action === 'complete' && confirmDialog.order && (
              <Card className="bg-blue-50/50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    Información Bancaria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-muted-foreground">Titular:</span>
                      <div className="font-medium">{confirmDialog.order.bank_account_holder}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Banco:</span>
                      <div className="font-medium">{confirmDialog.order.bank_name}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Tipo:</span>
                      <div className="font-medium capitalize">{confirmDialog.order.bank_account_type}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Número:</span>
                      <div className="font-mono text-xs bg-white px-1 py-0.5 rounded border">
                        {confirmDialog.order.bank_account_number}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-muted-foreground text-center">
              ¿Estás seguro de que quieres {confirmDialog.action === 'complete' ? 'completar' : 'rechazar'} esta orden de pago?
            </p>
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agrega cualquier nota relevante..."
                className="mt-1"
              />
            </div>
            
            {/* Photo Upload Section */}
            <div>
              <Label htmlFor="receipt-photo">Comprobante de pago (opcional)</Label>
              <div className="mt-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="receipt-photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setReceiptPhoto(file);
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('receipt-photo')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Paperclip className="h-4 w-4" />
                    {receiptPhoto ? 'Cambiar foto' : 'Adjuntar foto'}
                  </Button>
                  {receiptPhoto && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReceiptPhoto(null)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {receiptPhoto && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{receiptPhoto.name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  setNotes("");
                  setReceiptPhoto(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handlePaymentAction}
                variant={confirmDialog.action === 'complete' ? 'default' : 'destructive'}
              >
                {confirmDialog.action === 'complete' ? 'Completar' : 'Rechazar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Detail Modal */}
      <OrderDetailModal 
        order={selectedOrder} 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
      />
    </div>
  );
};

export default AdminTravelerPaymentsTab;