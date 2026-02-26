import { useState, useEffect } from "react";
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
import { Check, X, Eye, FileText, CreditCard, User, MapPin, Package, AlertCircle, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, Upload, Paperclip, ExternalLink, Receipt, MessageSquare, Save } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/priceHelpers";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { getActiveTipFromPackage } from "@/utils/tipHelpers";

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

const maskAccountUtil = (num?: string) => (num && typeof num === 'string' ? `•••• ${num.slice(-4)}` : 'N/A');

// ─── Extracted Components (defined outside parent to prevent remounting) ───

interface EditableNotesSectionProps {
  order: any;
  updatePaymentOrder: (id: string, data: any) => Promise<any>;
  toast: ReturnType<typeof useToast>['toast'];
}

const EditableNotesSection = ({ order, updatePaymentOrder, toast }: EditableNotesSectionProps) => {
  const [editableNotes, setEditableNotes] = useState(order.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updatePaymentOrder(order.id, { notes: editableNotes.trim() || null });
      toast({
        title: "Nota guardada",
        description: "La nota se actualizó correctamente.",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium flex items-center gap-1">
        <MessageSquare className="h-3.5 w-3.5" />
        Notas
      </Label>
      <Textarea
        value={editableNotes}
        onChange={(e) => setEditableNotes(e.target.value)}
        placeholder="Agregar nota sobre este pago..."
        className="mt-1 min-h-[60px] text-sm"
      />
      <div className="flex justify-end mt-2">
        <Button
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={handleSaveNotes}
          disabled={savingNotes || editableNotes === (order.notes || '')}
        >
          <Save className="h-3 w-3 mr-1" />
          {savingNotes ? 'Guardando...' : 'Guardar nota'}
        </Button>
      </div>
    </div>
  );
};

interface OrderDetailModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  updatePaymentOrder: (id: string, data: any) => Promise<any>;
  toast: ReturnType<typeof useToast>['toast'];
  onViewReceipt: (url: string, filename: string) => void;
}

const OrderDetailModal = ({ order, isOpen, onClose, updatePaymentOrder, toast, onViewReceipt }: OrderDetailModalProps) => {
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

          {order.trips && (
            <div>
              <Label className="text-sm font-medium">Información del Viaje</Label>
              <div className="bg-muted/30 rounded p-3 mt-1">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><span className="font-medium">Origen:</span> {order.trips.from_city}</div>
                  <div><span className="font-medium">Destino:</span> {order.trips.to_city}</div>
                  <div><span className="font-medium">Fecha llegada:</span> {new Date(order.trips.arrival_date).toLocaleDateString('es-GT')}</div>
                </div>
              </div>
            </div>
          )}

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
                    let receiptUrl = url;
                    
                    if (url && !url.startsWith('http')) {
                      const { data, error } = await supabase.storage
                        .from('payment-receipts')
                        .createSignedUrl(url, 3600);
                      if (!error && data?.signedUrl) {
                        receiptUrl = data.signedUrl;
                      }
                    }
                    
                    onViewReceipt(receiptUrl || url, order.receipt_filename || 'Comprobante de Pago');
                  }}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver Comprobante
                </Button>
              </div>
            </div>
          )}

          <EditableNotesSection order={order} updatePaymentOrder={updatePaymentOrder} toast={toast} />

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

interface CompactOrderRowProps {
  order: any;
  isExpanded: boolean;
  onToggleExpansion: (id: string) => void;
  updatePaymentOrder: (id: string, data: any) => Promise<any>;
  toast: ReturnType<typeof useToast>['toast'];
  onConfirmAction: (action: 'complete' | 'reject', order: any) => void;
  onSelectOrder: (order: any) => void;
}

const CompactOrderRow = ({ order, isExpanded, onToggleExpansion, updatePaymentOrder, toast, onConfirmAction, onSelectOrder }: CompactOrderRowProps) => {
  const [editableNotes, setEditableNotes] = useState(order.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  
  const normalizedHistorical = (() => {
    const h = order.historical_packages;
    if (!h) return [];
    try {
      const parsed = typeof h === 'string' ? JSON.parse(h) : h;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      console.warn('historical_packages no es JSON válido', h);
      return [];
    }
  })();
  
  const eligibleStatuses = ['in_transit', 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery', 'completed'];
  const fallbackTripPackages = ((order as any).trips?.packages || []).filter((pkg: any) => 
    eligibleStatuses.includes(pkg.status)
  );
  
  const isProcessed = order.status === 'completed' || order.status === 'rejected';
  const packages = isProcessed && normalizedHistorical.length > 0
    ? normalizedHistorical
    : (normalizedHistorical.length >= fallbackTripPackages.length && normalizedHistorical.length > 0
      ? normalizedHistorical
      : (fallbackTripPackages.length > 0 ? fallbackTripPackages : normalizedHistorical));
  const totalCompensation = packages.reduce((sum: number, pkg: any) => sum + getActiveTipFromPackage(pkg), 0);
  const amountMismatch = totalCompensation > 0 && Math.abs(order.amount - totalCompensation) > 0.01;

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updatePaymentOrder(order.id, { notes: editableNotes.trim() || null });
      toast({
        title: "Nota guardada",
        description: "La nota se actualizó correctamente.",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell className="py-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onToggleExpansion(order.id)}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="py-3">
          <div className="space-y-1">
            <div className="font-medium text-sm flex items-center gap-1">
              {order.profiles?.first_name} {order.profiles?.last_name}
              {order.notes && (
                <span title="Tiene notas"><MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /></span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {order.profiles?.email}
            </div>
          </div>
        </TableCell>
        <TableCell className="py-3">
          <span className="font-mono text-xs text-muted-foreground">{order.trip_id?.slice(0, 8)}</span>
        </TableCell>
        <TableCell className="py-3">
          <div className="text-right">
            <div className={`font-bold text-lg flex items-center justify-end gap-1 ${amountMismatch ? 'text-red-600' : 'text-green-600'}`}>
              {amountMismatch && <AlertCircle className="h-4 w-4" />}
              Q{order.amount}
            </div>
            {amountMismatch && (
              <div className="text-xs text-red-500">Total comp: Q{totalCompensation.toFixed(2)}</div>
            )}
            <div className="text-xs text-muted-foreground">GTQ</div>
          </div>
        </TableCell>
        <TableCell className="py-3">
          <div className="space-y-1">
            <div className="font-medium text-sm">{order.bank_account_holder}</div>
            <div className="text-xs text-muted-foreground">{order.bank_name}</div>
            <div className="text-xs font-mono text-gray-700">{maskAccountUtil(order.bank_account_number)}</div>
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
                  onClick={() => onConfirmAction('complete', order)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Pagar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  className="h-8 px-3 text-xs"
                  onClick={() => onConfirmAction('reject', order)}
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
              onClick={() => onSelectOrder(order)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="bg-muted/20">
          <TableCell colSpan={6} className="py-3">
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
                        Q{getActiveTipFromPackage(pkg).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-medium">Total de Compensaciones:</span>
                  <span className="text-base font-bold text-green-600">Q{totalCompensation.toFixed(2)}</span>
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

              {/* Notes Section */}
              <div className="bg-white border rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notas
                </h4>
                <Textarea
                  value={editableNotes}
                  onChange={(e) => setEditableNotes(e.target.value)}
                  placeholder="Agregar nota sobre este pago..."
                  className="min-h-[60px] text-sm"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={handleSaveNotes}
                    disabled={savingNotes || editableNotes === (order.notes || '')}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {savingNotes ? 'Guardando...' : 'Guardar nota'}
                  </Button>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

// ─── Main Component ───

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
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string>("");
  const [viewingReceiptFilename, setViewingReceiptFilename] = useState<string>("");
  const [packageBreakdown, setPackageBreakdown] = useState<Array<{
    id: string;
    item_description: string;
    status?: string;
    products_data?: any;
    quote?: { price?: number };
    admin_assigned_tip?: number;
    office_delivery?: any;
  }>>([]);
  const [packageBreakdownLoading, setPackageBreakdownLoading] = useState(false);
  const { toast } = useToast();
  
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

  const handleConfirmAction = (action: 'complete' | 'reject', order: any) => {
    setConfirmDialog({ isOpen: true, action, order });
  };

  const handleViewReceipt = (url: string, filename: string) => {
    setViewingReceiptUrl(url);
    setViewingReceiptFilename(filename);
    setImageViewerOpen(true);
  };

  // Fetch packages when dialog opens
  useEffect(() => {
    const fetchPackages = async () => {
      if (!confirmDialog.isOpen || !confirmDialog.order?.trip_id) {
        return;
      }

      setPackageBreakdownLoading(true);
      
      try {
        console.log('📡 Fetching packages from database for trip:', confirmDialog.order.trip_id);
        const eligibleStatuses = [
          'delivered_to_office',
          'ready_for_pickup',
          'ready_for_delivery',
          'out_for_delivery',
          'delivered',
          'completed'
        ];
        
        const { data, error } = await supabase
          .from('packages')
          .select('id, item_description, status, quote, admin_assigned_tip, products_data, office_delivery')
          .eq('matched_trip_id', confirmDialog.order.trip_id)
          .in('status', eligibleStatuses)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Error fetching packages:', error);
          setPackageBreakdown([]);
          return;
        }

        console.log('📦 Packages fetched:', (data || []).length, 'packages');
        console.log('📋 Package statuses:', (data || []).map(p => ({ id: p.id.slice(0, 8), status: p.status })));
        setPackageBreakdown((data || []) as any);
      } catch (err) {
        console.error('❌ Exception fetching packages:', err);
        setPackageBreakdown([]);
      } finally {
        setPackageBreakdownLoading(false);
      }
    };

    fetchPackages();
  }, [confirmDialog.isOpen, confirmDialog.order?.trip_id]);

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
        
        if (receiptPhoto) {
          try {
            const fileExt = receiptPhoto.name.split('.').pop();
            const fileName = `payment-${confirmDialog.order.id}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('payment-receipts')
              .upload(fileName, receiptPhoto);
              
            if (!uploadError) {
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
      if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
      setReceiptPhoto(null);
      setReceiptPreviewUrl(null);
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
                      <TableHead>Trip</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Información Bancaria</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map(order => (
                      <CompactOrderRow
                        key={order.id}
                        order={order}
                        isExpanded={expandedRows.has(order.id)}
                        onToggleExpansion={toggleRowExpansion}
                        updatePaymentOrder={updatePaymentOrder}
                        toast={toast}
                        onConfirmAction={handleConfirmAction}
                        onSelectOrder={setSelectedOrder}
                      />
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
                      <TableHead>Trip</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Información Bancaria</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedOrders.map(order => (
                      <CompactOrderRow
                        key={order.id}
                        order={order}
                        isExpanded={expandedRows.has(order.id)}
                        onToggleExpansion={toggleRowExpansion}
                        updatePaymentOrder={updatePaymentOrder}
                        toast={toast}
                        onConfirmAction={handleConfirmAction}
                        onSelectOrder={setSelectedOrder}
                      />
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
        if (!open) {
          setPackageBreakdown([]);
          setPackageBreakdownLoading(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              
              {/* Trip ID */}
              <div className="mb-3 pb-2 border-b border-muted/20">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">ID del viaje:</span> {confirmDialog.order?.trip_id || 'N/A'}
                </div>
              </div>
              
              {/* Desglose de paquetes */}
              <div className="space-y-2 mb-3">
                {packageBreakdownLoading ? (
                  <div className="text-xs text-muted-foreground py-2 flex items-center justify-center gap-2">
                    <Clock className="h-3 w-3 animate-spin" />
                    Cargando paquetes...
                  </div>
                ) : packageBreakdown.length > 0 ? (
                  packageBreakdown.map((pkg, index) => {
                    let productsArray: any[] = [];
                    try {
                      if (pkg.products_data) {
                        if (typeof pkg.products_data === 'string') {
                          productsArray = JSON.parse(pkg.products_data);
                        } else if (Array.isArray(pkg.products_data)) {
                          productsArray = pkg.products_data;
                        }
                      }
                    } catch (e) {
                      console.error('Error parsing products_data:', e);
                    }

                    if (productsArray.length > 1) {
                      return (
                        <div key={pkg.id || index} className="space-y-1">
                          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground px-2 py-1 bg-muted/20 rounded-t">
                            <Package className="h-3 w-3" />
                            <span className="truncate flex-1">{pkg.item_description}</span>
                          </div>
                          {productsArray.filter((product: any) => !product.cancelled).map((product: any, prodIndex: number) => {
                            const productTip = product.adminAssignedTip || 0;
                            const productDesc = product.itemDescription || product.item_description || product.description || `Producto ${prodIndex + 1}`;
                            
                            return (
                              <div key={`${pkg.id}-${prodIndex}`} className="flex justify-between items-center text-xs py-1 px-2 pl-4 bg-white/50 rounded border-b border-muted/20 last:border-b-0">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  {product.receivedAtOffice ? (
                                    <span title="Recibido en oficina"><CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" /></span>
                                  ) : product.notArrived ? (
                                    <span title="No llegó"><XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" /></span>
                                  ) : (
                                    <span title="Pendiente confirmación"><Clock className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" /></span>
                                  )}
                                  <span className="text-muted-foreground/60">•</span>
                                  <span className="text-muted-foreground truncate">
                                    {productDesc}
                                  </span>
                                </div>
                                <span className="font-medium text-green-600 ml-2 flex-shrink-0">
                                  {formatCurrency(productTip)}
                                </span>
                              </div>
                            );
                          })}
                          {productsArray.filter((product: any) => product.cancelled).map((product: any, prodIndex: number) => {
                            const productDesc = product.itemDescription || product.item_description || product.description || `Producto ${prodIndex + 1}`;
                            return (
                              <div key={`${pkg.id}-cancelled-${prodIndex}`} className="flex justify-between items-center text-xs py-1 px-2 pl-6 bg-red-50/50 rounded border-b border-muted/20 last:border-b-0 opacity-60">
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <span className="text-muted-foreground/60 mr-1">•</span>
                                  <span className="text-muted-foreground truncate line-through">
                                    {productDesc}
                                  </span>
                                  <Badge variant="destructive" className="text-[10px] h-4 px-1 ml-1">cancelado</Badge>
                                </div>
                                <span className="font-medium text-muted-foreground line-through ml-2 flex-shrink-0">
                                  {formatCurrency(product.adminAssignedTip || 0)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    
                    const packageTip = getActiveTipFromPackage(pkg);
                    
                    return (
                      <div key={pkg.id || index} className="flex justify-between items-center text-xs py-1 px-2 bg-white/50 rounded border-b border-muted/20 last:border-b-0">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {(() => {
                            const officeDelivery = pkg.office_delivery as any;
                            const postOfficeStatuses = ['completed', 'ready_for_pickup', 'ready_for_delivery', 'out_for_delivery'];
                            const isConfirmed = postOfficeStatuses.includes(pkg.status || '') || 
                              (pkg.status === 'delivered_to_office' && officeDelivery?.admin_confirmation);
                            const isPending = pkg.status === 'delivered_to_office' && !officeDelivery?.admin_confirmation;
                            
                            if (isConfirmed) return <span title="Oficina confirmó recepción"><CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" /></span>;
                            if (isPending) return <span title="Pendiente confirmación oficina"><Clock className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" /></span>;
                            return null;
                          })()}
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
                    No se encontraron paquetes en estado "entregado a oficina" o posteriores para este viaje
                  </div>
                )}
              </div>
              
              {/* Total */}
              <div className="border-t border-muted/40 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">Total a pagar:</span>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(confirmDialog.order?.amount || 0)}
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
                      if (file) {
                        if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
                        setReceiptPhoto(file);
                        setReceiptPreviewUrl(URL.createObjectURL(file));
                      }
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
                      onClick={() => {
                        if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
                        setReceiptPhoto(null);
                        setReceiptPreviewUrl(null);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {receiptPhoto && receiptPreviewUrl && (
                  <div className="space-y-2">
                    <img
                      src={receiptPreviewUrl}
                      alt="Vista previa del comprobante"
                      className="max-h-[200px] rounded-lg border shadow-sm cursor-pointer object-contain"
                      onClick={() => setReceiptPreviewOpen(true)}
                      title="Click para ver en tamaño completo"
                    />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{receiptPhoto.name}</span>
                    </div>
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
                  if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
                  setReceiptPhoto(null);
                  setReceiptPreviewUrl(null);
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
        updatePaymentOrder={updatePaymentOrder}
        toast={toast}
        onViewReceipt={handleViewReceipt}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={viewingReceiptUrl}
        title="Comprobante de Pago"
        filename={viewingReceiptFilename}
      />

      {/* Receipt Preview Modal */}
      {receiptPreviewUrl && (
        <ImageViewerModal
          isOpen={receiptPreviewOpen}
          onClose={() => setReceiptPreviewOpen(false)}
          imageUrl={receiptPreviewUrl}
          title="Vista previa del comprobante"
          filename={receiptPhoto?.name || 'comprobante'}
        />
      )}
    </div>
  );
};

export default AdminTravelerPaymentsTab;
