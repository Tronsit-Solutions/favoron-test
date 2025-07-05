import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap } from "lucide-react";

interface AdminMatchDialogProps {
  showMatchDialog: boolean;
  setShowMatchDialog: (show: boolean) => void;
  selectedPackage: any;
  matchingTrip: string;
  setMatchingTrip: (trip: string) => void;
  availableTrips: any[];
  onMatch: () => void;
}

const AdminMatchDialog = ({ 
  showMatchDialog, 
  setShowMatchDialog, 
  selectedPackage, 
  matchingTrip, 
  setMatchingTrip, 
  availableTrips, 
  onMatch 
}: AdminMatchDialogProps) => {
  return (
    <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Hacer Match de solicitud</DialogTitle>
          <DialogDescription>
            Selecciona un viaje compatible para hacer match con esta solicitud
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {selectedPackage && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h4 className="font-medium text-blue-900">Solicitud seleccionada:</h4>
              <p className="text-sm text-blue-800">{selectedPackage.itemDescription}</p>
              <p className="text-xs text-blue-700">
                Precio: ${selectedPackage.estimatedPrice}
              </p>
              <div className="mt-2 flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="font-medium">📦 Compra en:</span>
                  <span className="bg-blue-100 px-2 py-1 rounded">
                    {selectedPackage.purchaseOrigin || 'No especificado'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-medium">🎯 Envío a:</span>
                  <span className="bg-green-100 px-2 py-1 rounded">
                    {selectedPackage.packageDestination || 'Guatemala'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="matchingTrip">Seleccionar viaje compatible:</Label>
            <Select value={matchingTrip} onValueChange={setMatchingTrip}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Seleccionar viaje compatible" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {availableTrips.map(trip => (
                  <SelectItem key={trip.id} value={trip.id.toString()} className="p-4 h-auto">
                    <div className="w-full space-y-2">
                      {/* Header with traveler and destination */}
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm">
                          👤 Viajero ID: {trip.userId}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-primary">
                            🎯 {trip.toCity}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {trip.toCountry}
                          </div>
                        </div>
                      </div>
                      
                      {/* Package receiving window */}
                      <div className="bg-blue-50 rounded-md p-2 space-y-1">
                        <div className="text-xs font-medium text-blue-900">
                          📦 Ventana de recepción de paquetes:
                        </div>
                        <div className="text-xs text-blue-800 grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">Primer día:</span>
                            <br />
                            {trip.firstDayPackages ? new Date(trip.firstDayPackages).toLocaleDateString() : 'No especificado'}
                          </div>
                          <div>
                            <span className="font-medium">Último día:</span>
                            <br />
                            {trip.lastDayPackages ? new Date(trip.lastDayPackages).toLocaleDateString() : 'No especificado'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delivery info */}
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="bg-green-100 px-2 py-1 rounded font-medium">
                            🚚 {trip.deliveryMethod === 'oficina' ? 'Oficina Zona 14' : 'Mensajero'}
                          </span>
                          <span className="text-muted-foreground">
                            Entrega: {trip.deliveryDate ? new Date(trip.deliveryDate).toLocaleDateString() : 'No especificado'}
                          </span>
                        </div>
                        <div className="bg-purple-100 px-2 py-1 rounded text-purple-800 font-medium">
                          📏 {trip.availableSpace}kg disponible
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={onMatch} 
              className="flex-1"
              disabled={!matchingTrip}
            >
              <Zap className="h-4 w-4 mr-1" />
              Confirmar Match
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowMatchDialog(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMatchDialog;