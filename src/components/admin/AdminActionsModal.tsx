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
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const { toast } = useToast();

  if (!pkg) return null;

  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));

  const statusOptions = [
    { value: 'pending_approval', label: 'Pendiente de Aprobación' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'matched', label: 'Match Realizado' },
    { value: 'quote_sent', label: 'Cotización Enviada' },
    { value: 'quote_accepted', label: 'Cotización Aceptada' },
    { value: 'address_confirmed', label: 'Dirección Confirmada' },
    { value: 'payment_pending', label: 'Pago Pendiente' },
    { value: 'payment_confirmed', label: 'Pago Confirmado' },
    { value: 'purchased', label: 'Comprado' },
    { value: 'in_transit', label: 'En Tránsito' },
    { value: 'delivered_to_office', label: 'Entregado en Oficina' },
    { value: 'received_by_traveler', label: 'Recibido por Viajero' },
    { value: 'rejected', label: 'Rechazado' },
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
      const { error } = await supabase
        .from('packages')
        .update({ 
          matched_trip_id: selectedTripId,
          status: 'matched'
        })
        .eq('id', pkg.id);

      if (error) throw error;

      const selectedTrip = availableTrips.find(t => t.id === selectedTripId);
      await logAction('trip_reassigned', `Paquete reasignado al viaje ${selectedTrip?.from_city} → ${selectedTrip?.to_city}`);
      
      toast({
        title: "Viaje reasignado",
        description: "El paquete se asignó al nuevo viaje exitosamente"
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

  return (
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
                <h3 className="font-medium">{pkg.item_description}</h3>
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
                <Badge variant="outline">${pkg.estimated_price}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Estado</TabsTrigger>
            <TabsTrigger value="reassign">Reasignar</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
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
                  <Label htmlFor="status">Estado actual: <Badge>{pkg.status}</Badge></Label>
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
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminActionsModal;