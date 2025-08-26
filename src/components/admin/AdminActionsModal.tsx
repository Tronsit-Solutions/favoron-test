import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  FileText, 
  Upload, 
  RefreshCcw, 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  User,
  Phone,
  ExternalLink,
  Save,
  X,
  CheckCircle,
  Package,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePaymentOrders } from "@/hooks/usePaymentOrders";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import ProductTipAssignmentModal from "./ProductTipAssignmentModal";

interface AdminActionsModalProps {
  package: any;
  trips: any[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const AdminActionsModal = ({ package: pkg, trips, isOpen, onClose, onRefresh }: AdminActionsModalProps) => {
  const [activeTab, setActiveTab] = useState("status");
  const [isLoading, setIsLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [internalNote, setInternalNote] = useState(pkg?.internal_notes || "");
  const [selectedTripId, setSelectedTripId] = useState(pkg?.matched_trip_id || "");
  const [adminNotes, setAdminNotes] = useState("");
  const [showProductTipModal, setShowProductTipModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { createPaymentOrder } = usePaymentOrders();
  const { getStatusBadge } = useStatusHelpers();

  if (!pkg) return null;

  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));
  
  // Check if package has multiple products
  const hasMultipleProducts = pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 1;
  const products = pkg.products_data || [{
    itemDescription: pkg.item_description,
    estimatedPrice: pkg.estimated_price?.toString() || '0',
    itemLink: pkg.item_link,
    quantity: '1'
  }];

  const statusOptions = [
    { value: 'pending_approval', label: 'Pendiente de Aprobación' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'rejected', label: 'Rechazado' },
    { value: 'matched', label: 'Match Realizado' },
    { value: 'quote_sent', label: 'Cotización Enviada' },
    { value: 'quote_accepted', label: 'Cotización Aceptada' },
    { value: 'awaiting_payment', label: 'Esperando Pago' },
    { value: 'payment_confirmed', label: 'Pago Confirmado' },
    { value: 'pending_purchase', label: 'Pendiente de Compra' },
    { value: 'purchased', label: 'Comprado' },
    { value: 'in_transit', label: 'En Tránsito' },
    { value: 'received_by_traveler', label: 'Recibido por Viajero' },
    { value: 'pending_office_confirmation', label: 'Esperando Confirmación Oficina' },
    { value: 'delivered_to_office', label: 'Entregado en Oficina' },
    { value: 'ready_for_pickup', label: 'Listo para Recoger' },
    { value: 'ready_for_delivery', label: 'Listo para Entrega' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  const logAction = async (actionType: string, description: string, additionalData?: any) => {
    if (user) {
      await supabase.rpc('log_admin_action', {
        _package_id: pkg.id,
        _admin_id: user.id,
        _action_type: actionType,
        _action_description: description,
        _additional_data: additionalData
      });
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) {
      toast({
        title: "Error",
        description: "Selecciona un nuevo estado",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('packages')
        .update({ status: newStatus })
        .eq('id', pkg.id);

      if (error) throw error;

      await logAction('status_changed', `Estado cambiado de ${pkg.status} a ${newStatus}`);
      
      toast({
        title: "Estado actualizado",
        description: `El estado se cambió a ${statusOptions.find(s => s.value === newStatus)?.label}`
      });

      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTripReassignment = async () => {
    if (!selectedTripId) {
      toast({
        title: "Error",
        description: "Selecciona un viaje",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Determinar tip ya pagado (si existe) para asignarlo al nuevo viajero
      const adminAssignedTip = pkg?.quote?.price ? parseFloat(pkg.quote.price) : undefined;

      // Preparar actualización: mover a 'matched' y limpiar datos dependientes del viajero previo
      const updatePayload: any = {
        matched_trip_id: selectedTripId,
        status: 'matched', // Requiere aceptación del nuevo viajero
        traveler_address: null,
        matched_trip_dates: null,
        // Limpiar documentos que podrían corresponder al viajero previo
        purchase_confirmation: null,
        tracking_info: null,
        // Guardar tip asignado administrativamente si existe
        ...(adminAssignedTip ? { admin_assigned_tip: adminAssignedTip } : {}),
        // Dejar que el trigger set_assignment_expiration establezca vencimiento de 24h
        matched_assignment_expires_at: null,
        quote_expires_at: null,
      };

      const { error } = await supabase
        .from('packages')
        .update(updatePayload)
        .eq('id', pkg.id);

      if (error) throw error;

      const selectedTrip = availableTrips.find(t => t.id === selectedTripId);
      await logAction(
        'trip_reassigned',
        `Paquete reasignado al viaje ${selectedTrip?.from_city} → ${selectedTrip?.to_city}`,
        {
          new_trip_id: selectedTripId,
          requires_traveler_acceptance: true,
          admin_assigned_tip: adminAssignedTip ?? null,
        }
      );
      
      toast({
        title: "Reasignado correctamente",
        description: "El nuevo viajero tiene 24h para aceptar. El shopper verá instrucciones cuando el viajero acepte.",
      });

      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Error reassigning trip:', error);
      toast({
        title: "Error",
        description: "No se pudo reasignar el viaje",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInternalNote = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('packages')
        .update({ internal_notes: internalNote })
        .eq('id', pkg.id);

      if (error) throw error;

      await logAction('internal_note_added', 'Nota interna agregada/actualizada');
      
      toast({
        title: "Nota guardada",
        description: "La nota interna se guardó correctamente"
      });

      onRefresh?.();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la nota",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIncidentFlag = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('packages')
        .update({ incident_flag: !pkg.incident_flag })
        .eq('id', pkg.id);

      if (error) throw error;

      await logAction(
        pkg.incident_flag ? 'incident_unmarked' : 'incident_marked',
        pkg.incident_flag ? 'Incidencia removida' : 'Marcado como incidencia'
      );
      
      toast({
        title: pkg.incident_flag ? "Incidencia removida" : "Marcado como incidencia",
        description: pkg.incident_flag ? "El paquete ya no está marcado como incidencia" : "El paquete se marcó como incidencia"
      });

      onRefresh?.();
    } catch (error) {
      console.error('Error toggling incident flag:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la incidencia",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = () => {
    if (pkg.profiles?.phone_number) {
      const phone = pkg.profiles.phone_number.replace(/[^\d]/g, '');
      const message = `Hola! Te contacto desde Favorón respecto a tu pedido #${pkg.id.slice(0, 8)}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleConfirmDelivery = async (action: 'confirm' | 'reject') => {
    setIsLoading(true);
    try {
      if (action === 'confirm') {
        // Confirmar entrega y crear payment order
        const travelerBankInfo = pkg.office_delivery?.traveler_declaration?.bank_info;
        const travelerDeclaration = pkg.office_delivery?.traveler_declaration;
        
        if (!travelerBankInfo || !travelerDeclaration) {
          throw new Error('Información bancaria o declaración del viajero no encontrada');
        }

        // Crear la confirmación del admin
        const adminConfirmation = {
          timestamp: new Date().toISOString(),
          admin_id: user?.id,
          notes: adminNotes,
          confirmed: true
        };

        // Actualizar el paquete con la confirmación del admin
        const updatedOfficeDelivery = {
          ...pkg.office_delivery,
          admin_confirmation: adminConfirmation,
          status: 'confirmed'
        };

        await supabase
          .from('packages')
          .update({
            status: 'delivered_to_office',
            office_delivery: updatedOfficeDelivery
          })
          .eq('id', pkg.id);

        // Crear orden de pago si hay quote
        if (pkg.quote?.price) {
          await createPaymentOrder({
            trip_id: pkg.matched_trip_id,
            traveler_id: travelerDeclaration.traveler_id,
            amount: parseFloat(pkg.quote.price),
            bank_account_holder: travelerBankInfo.bank_account_holder,
            bank_name: travelerBankInfo.bank_name,
            bank_account_type: travelerBankInfo.bank_account_type,
            bank_account_number: travelerBankInfo.bank_account_number,
            notes: `Entrega confirmada por admin. ${adminNotes}`.trim(),
            status: 'pending'
          });
        }

        await logAction('delivery_confirmed', 'Entrega confirmada por admin y orden de pago creada');

        toast({
          title: "Entrega confirmada",
          description: "La entrega se confirmó y se creó la orden de pago para el viajero",
        });

      } else {
        // Rechazar entrega - volver a in_transit
        const adminConfirmation = {
          timestamp: new Date().toISOString(),
          admin_id: user?.id,
          notes: adminNotes,
          confirmed: false
        };

        const updatedOfficeDelivery = {
          ...pkg.office_delivery,
          admin_confirmation: adminConfirmation,
          status: 'rejected'
        };

        await supabase
          .from('packages')
          .update({
            status: 'in_transit',
            office_delivery: updatedOfficeDelivery
          })
          .eq('id', pkg.id);

        await logAction('delivery_rejected', 'Entrega rechazada por admin');

        toast({
          title: "Entrega rechazada",
          description: "La entrega fue rechazada. El viajero puede volver a declarar entrega.",
          variant: "destructive"
        });
      }

      onRefresh?.();
      onClose();

    } catch (error) {
      console.error('Error processing delivery confirmation:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la confirmación de entrega",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductTipSave = async (productsWithTips: any[], totalTip: number) => {
    setIsLoading(true);
    try {
      // Update the package with the new products data including individual tips
      const { error } = await supabase
        .from('packages')
        .update({
          products_data: productsWithTips,
          admin_assigned_tip: totalTip,
          status: 'matched' // Set to matched so traveler can accept
        })
        .eq('id', pkg.id);

      if (error) throw error;

      await logAction('product_tips_assigned', `Tips asignados por producto. Total: Q${totalTip.toFixed(2)}`);
      
      toast({
        title: "Tips asignados",
        description: `Se asignaron tips individuales por un total de Q${totalTip.toFixed(2)}`,
      });

      onRefresh?.();
      setShowProductTipModal(false);
    } catch (error) {
      console.error('Error saving product tips:', error);
      toast({
        title: "Error",
        description: "No se pudieron asignar los tips",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ProductTipAssignmentModal
        isOpen={showProductTipModal}
        onClose={() => setShowProductTipModal(false)}
        onSave={handleProductTipSave}
        products={products}
        packageId={pkg.id}
      />
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Acciones Administrativas - #{pkg.id.slice(0, 8)}</span>
          </DialogTitle>
          <DialogDescription>
            Gestiona este pedido con herramientas administrativas
          </DialogDescription>
        </DialogHeader>

        {/* Package Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">
                  {hasMultipleProducts 
                    ? `Pedido de ${products.length} productos`
                    : pkg.item_description
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  {pkg.profiles ? `${pkg.profiles.first_name} ${pkg.profiles.last_name}` : `Usuario: ${pkg.user_id.slice(0, 8)}`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {pkg.incident_flag && (
                  <Badge variant="destructive" className="flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Incidencia</span>
                  </Badge>
                )}
                {hasMultipleProducts && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Package className="h-3 w-3" />
                    <span>{products.length} productos</span>
                  </Badge>
                )}
                <Badge variant="outline">
                  ${hasMultipleProducts 
                    ? products.reduce((sum: number, p: any) => {
                        const price = parseFloat(p.estimatedPrice || '0');
                        const quantity = parseInt(p.quantity || '1');
                        return sum + (price * quantity);
                      }, 0).toFixed(2)
                    : pkg.estimated_price
                  }
                </Badge>
              </div>
            </div>
            
            {/* Quick tip assignment for multiple products */}
            {hasMultipleProducts && (
              <div className="mt-3 pt-3 border-t">
                <Button
                  onClick={() => setShowProductTipModal(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Asignar Tips por Producto</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${pkg.status === 'pending_office_confirmation' ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="status">Estado</TabsTrigger>
            <TabsTrigger value="reassign">Reasignar</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
            {pkg.status === 'pending_office_confirmation' && (
              <TabsTrigger value="delivery">Confirmar Entrega</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCcw className="h-4 w-4" />
                  <span>Cambiar Estado Manualmente</span>
                </CardTitle>
                <CardDescription>
                  Actualiza el estado del pedido para resolver incidencias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Estado actual: {getStatusBadge(pkg.status)}</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecciona nuevo estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleStatusChange} 
                  disabled={isLoading || !newStatus}
                  className="w-full"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Cambiar Estado
                </Button>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={toggleIncidentFlag}
                    variant={pkg.incident_flag ? "outline" : "destructive"}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {pkg.incident_flag ? 'Quitar Marca de Incidencia' : 'Marcar como Incidencia'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reassign" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCcw className="h-4 w-4" />
                  <span>Reasignar a Otro Viaje</span>
                </CardTitle>
                <CardDescription>
                  Cambia el viaje asignado a este pedido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pkg.matched_trip_id && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm font-medium text-blue-800">Viaje actual asignado</p>
                    <p className="text-sm text-blue-700">ID: {pkg.matched_trip_id.slice(0, 8)}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="trip">Seleccionar nuevo viaje</Label>
                  <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecciona un viaje disponible" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTrips.map(trip => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.from_city} → {trip.to_city} | 
                          Salida: {new Date(trip.departure_date).toLocaleDateString('es-GT')} |
                          Llegada: {new Date(trip.arrival_date).toLocaleDateString('es-GT')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableTrips.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      No hay viajes disponibles para reasignar
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleTripReassignment}
                  disabled={isLoading || !selectedTripId || availableTrips.length === 0}
                  className="w-full"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reasignar Viaje
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Notas Internas</span>
                </CardTitle>
                <CardDescription>
                  Agrega notas internas para seguimiento administrativo (no visibles para el usuario)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="internal-note">Nota interna</Label>
                  <Textarea
                    id="internal-note"
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Agregar nota interna sobre este pedido..."
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleSaveInternalNote}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Nota
                </Button>

                {/* Action Log */}
                {pkg.admin_actions_log && pkg.admin_actions_log.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Historial de Acciones Administrativas</span>
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {pkg.admin_actions_log.map((action: any, index: number) => (
                        <div key={index} className="text-xs bg-muted p-2 rounded">
                          <p className="font-medium">{action.description}</p>
                          <p className="text-muted-foreground">
                            {new Date(action.timestamp).toLocaleString('es-GT')} • 
                            Admin: {action.admin_id.slice(0, 8)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Información de Contacto</span>
                </CardTitle>
                <CardDescription>
                  Herramientas rápidas para contactar al cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pkg.profiles && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{pkg.profiles.first_name} {pkg.profiles.last_name}</p>
                        <p className="text-sm text-muted-foreground">{pkg.profiles.email}</p>
                        {pkg.profiles.phone_number && (
                          <p className="text-sm text-muted-foreground">{pkg.profiles.phone_number}</p>
                        )}
                      </div>
                    </div>

                    {pkg.profiles.phone_number && (
                      <Button 
                        onClick={openWhatsApp}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Abrir WhatsApp
                      </Button>
                    )}

                    <Button 
                      onClick={() => window.open(`mailto:${pkg.profiles.email}?subject=Favorón - Pedido #${pkg.id.slice(0, 8)}`, '_blank')}
                      variant="outline"
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Enviar Email
                    </Button>
                  </div>
                )}

                {pkg.item_link && (
                  <div className="pt-4 border-t">
                    <Label>Link del producto</Label>
                    <Button 
                      onClick={() => window.open(pkg.item_link, '_blank')}
                      variant="outline"
                      className="w-full mt-2"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Producto Original
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {pkg.status === 'pending_office_confirmation' && (
            <TabsContent value="delivery" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Confirmar Recepción de Entrega</span>
                  </CardTitle>
                  <CardDescription>
                    El viajero declaró que entregó este paquete. Confirma o rechaza la recepción.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Información de la declaración del viajero */}
                  {pkg.office_delivery?.traveler_declaration && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Declaración del Viajero
                      </h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p><strong>Método:</strong> {pkg.office_delivery.traveler_declaration.delivery_method === 'oficina' ? 'Oficina Favorón' : 'Mensajero'}</p>
                        <p><strong>Fecha:</strong> {new Date(pkg.office_delivery.traveler_declaration.timestamp).toLocaleString('es-GT')}</p>
                        {pkg.office_delivery.traveler_declaration.notes && (
                          <p><strong>Notas:</strong> {pkg.office_delivery.traveler_declaration.notes}</p>
                        )}
                        <p><strong>Pago a procesar:</strong> Q{pkg.quote?.price || '0.00'}</p>
                      </div>
                    </div>
                  )}

                  {/* Notas del admin */}
                  <div>
                    <Label htmlFor="admin-notes">Notas administrativas</Label>
                    <Textarea
                      id="admin-notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Agregar notas sobre la confirmación/rechazo de la entrega..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  {/* Botones de acción */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => handleConfirmDelivery('reject')}
                      disabled={isLoading}
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rechazar Entrega
                    </Button>
                    <Button 
                      onClick={() => handleConfirmDelivery('confirm')}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isLoading ? "Procesando..." : "Confirmar y Pagar"}
                    </Button>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      <strong>Importante:</strong> Al confirmar, se creará automáticamente la orden de pago para el viajero 
                      y se acumulará en su cuenta para la próxima transferencia.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default AdminActionsModal;