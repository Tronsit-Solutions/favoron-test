import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Eye, Edit2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminTripsTabProps {
  trips: any[];
  onViewTripDetail: (trip: any) => void;
  onApproveReject: (type: 'package' | 'trip', id: string, action: 'approve' | 'reject') => void;
  getStatusBadge: (status: string) => JSX.Element;
  onTripsUpdate?: () => void;
}

const AdminTripsTab = ({ 
  trips, 
  onViewTripDetail, 
  onApproveReject, 
  getStatusBadge,
  onTripsUpdate
}: AdminTripsTabProps) => {
  const [editingTrip, setEditingTrip] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const { toast } = useToast();

  const handleEdit = (trip: any) => {
    setEditingTrip(trip.id);
    setEditData({
      fromCity: trip.fromCity,
      toCity: trip.toCity,
      arrivalDate: trip.arrivalDate,
      availableSpace: trip.availableSpace,
      deliveryDate: trip.deliveryDate,
      firstDayPackages: trip.firstDayPackages,
      lastDayPackages: trip.lastDayPackages
    });
  };

  const handleSave = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          from_city: editData.fromCity,
          to_city: editData.toCity,
          arrival_date: editData.arrivalDate,
          available_space: editData.availableSpace,
          delivery_date: editData.deliveryDate,
          first_day_packages: editData.firstDayPackages,
          last_day_packages: editData.lastDayPackages
        })
        .eq('id', tripId);

      if (error) throw error;

      toast({
        title: "Viaje actualizado",
        description: "Los datos del viaje se han actualizado correctamente.",
      });

      setEditingTrip(null);
      if (onTripsUpdate) onTripsUpdate();
    } catch (error) {
      console.error('Error updating trip:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el viaje.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingTrip(null);
    setEditData({});
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Viajes</CardTitle>
          <CardDescription>Todos los viajes registrados en el sistema - Haz clic en editar para modificar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trips.map(trip => (
              <div key={trip.id} className="border rounded-lg p-4">
                {editingTrip === trip.id ? (
                  // Editing mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Ciudad origen</label>
                        <Input
                          value={editData.fromCity}
                          onChange={(e) => setEditData({...editData, fromCity: e.target.value})}
                          placeholder="Ciudad de origen"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Ciudad destino</label>
                        <Input
                          value={editData.toCity}
                          onChange={(e) => setEditData({...editData, toCity: e.target.value})}
                          placeholder="Ciudad de destino"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Fecha de llegada</label>
                        <Input
                          type="date"
                          value={editData.arrivalDate}
                          onChange={(e) => setEditData({...editData, arrivalDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Espacio disponible (kg)</label>
                        <Input
                          type="number"
                          value={editData.availableSpace}
                          onChange={(e) => setEditData({...editData, availableSpace: e.target.value})}
                          placeholder="Espacio en kg"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Fecha de entrega</label>
                        <Input
                          type="date"
                          value={editData.deliveryDate}
                          onChange={(e) => setEditData({...editData, deliveryDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Primer día paquetes</label>
                        <Input
                          type="date"
                          value={editData.firstDayPackages}
                          onChange={(e) => setEditData({...editData, firstDayPackages: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Último día paquetes</label>
                        <Input
                          type="date"
                          value={editData.lastDayPackages}
                          onChange={(e) => setEditData({...editData, lastDayPackages: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleSave(trip.id)}>
                        <Save className="h-4 w-4 mr-1" />
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{trip.fromCity} → {trip.toCity}</h4>
                        <p className="text-sm text-muted-foreground">
                          Llegada: {new Date(trip.arrivalDate).toLocaleDateString()} • 
                          Espacio: {trip.availableSpace}kg • Usuario: {trip.userId}
                          {trip.status === 'approved' && trip.deliveryDate && (
                            <> • <span className="font-medium text-primary">Entrega en oficina: {new Date(trip.deliveryDate).toLocaleDateString()}</span></>
                          )}
                        </p>
                      </div>
                      {getStatusBadge(trip.status)}
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onViewTripDetail(trip)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(trip)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTripsTab;