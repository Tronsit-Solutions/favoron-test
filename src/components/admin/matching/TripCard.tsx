
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Eye, CalendarDays, Plane, Edit2, Save, X } from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TripCardProps {
  trip: any;
  packagesTotal?: number;
  onViewTripDetail: (trip: any) => void;
  onTripUpdate?: () => void;
}

export const TripCard = ({
  trip,
  packagesTotal,
  onViewTripDetail,
  onTripUpdate
}: TripCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fromCity: trip.from_city,
    toCity: trip.to_city,
    arrivalDate: trip.arrival_date,
    deliveryDate: trip.delivery_date,
    firstDayPackages: trip.first_day_packages,
    lastDayPackages: trip.last_day_packages
  });
  const { toast } = useToast();

  console.log("TripCard trip data:", trip);
  console.log("TripCard profiles data:", trip.public_profiles);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      fromCity: trip.from_city,
      toCity: trip.to_city,
      arrivalDate: trip.arrival_date,
      deliveryDate: trip.delivery_date,
      firstDayPackages: trip.first_day_packages,
      lastDayPackages: trip.last_day_packages
    });
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          from_city: editData.fromCity,
          to_city: editData.toCity,
          arrival_date: editData.arrivalDate,
          delivery_date: editData.deliveryDate,
          first_day_packages: editData.firstDayPackages,
          last_day_packages: editData.lastDayPackages
        })
        .eq('id', trip.id);

      if (error) throw error;

      toast({
        title: "Viaje actualizado",
        description: "Los datos del viaje se han actualizado correctamente.",
      });

      setIsEditing(false);
      if (onTripUpdate) onTripUpdate();
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
    setIsEditing(false);
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">Ciudad origen</label>
                <Input
                  value={editData.fromCity}
                  onChange={(e) => setEditData({...editData, fromCity: e.target.value})}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Ciudad destino</label>
                <Input
                  value={editData.toCity}
                  onChange={(e) => setEditData({...editData, toCity: e.target.value})}
                  className="text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="text-xs font-medium">Fecha de viaje</label>
                <Input
                  type="date"
                  value={editData.arrivalDate}
                  onChange={(e) => setEditData({...editData, arrivalDate: e.target.value})}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Fecha de entrega</label>
                <Input
                  type="date"
                  value={editData.deliveryDate}
                  onChange={(e) => setEditData({...editData, deliveryDate: e.target.value})}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Primer día paquetes</label>
                <Input
                  type="date"
                  value={editData.firstDayPackages}
                  onChange={(e) => setEditData({...editData, firstDayPackages: e.target.value})}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Último día paquetes</label>
                <Input
                  type="date"
                  value={editData.lastDayPackages}
                  onChange={(e) => setEditData({...editData, lastDayPackages: e.target.value})}
                  className="text-sm"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleSave} className="flex-1">
                <Save className="h-3 w-3 mr-1" />
                Guardar
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1">
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-2">
              {/* Main route info */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Plane className="h-4 w-4 text-blue-500" />
                    <h4 className="font-medium text-sm">
                      {trip.from_city} → {trip.to_city}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground mb-2">
                    <span>👤 Viajero: {
                      trip.public_profiles 
                        ? `${trip.public_profiles.first_name || ''} ${trip.public_profiles.last_name || ''}`.trim() || trip.public_profiles.username || 'Usuario sin nombre'
                        : 'Sin perfil'
                    }</span>
                    <span>📋 Estado: {trip.status}</span>
                  </div>
                  
                  {/* Packages total badge */}
                  {packagesTotal !== undefined && packagesTotal > 0 && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        💰 Total: ${packagesTotal.toFixed(2)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Important dates - chronological order */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-1">
                  <CalendarDays className="h-3 w-3 text-blue-500" />
                  <span className="text-blue-600">
                    Fecha de viaje: {new Date(trip.arrival_date).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-green-600">
                      📥 Primer día: {new Date(trip.first_day_packages).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-red-600">
                      📤 Último día: {new Date(trip.last_day_packages).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <CalendarDays className="h-3 w-3 text-primary" />
                  <span className="text-primary font-medium">
                    Entrega: {new Date(trip.delivery_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="ml-4 flex flex-col space-y-1">
              <Button size="sm" variant="outline" onClick={() => onViewTripDetail(trip)}>
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
              <Button size="sm" variant="outline" onClick={handleEdit}>
                <Edit2 className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
