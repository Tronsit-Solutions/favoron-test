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
                    {selectedPackage.purchaseCountry || 'No especificado'}
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
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar viaje" />
              </SelectTrigger>
              <SelectContent>
                {availableTrips.map(trip => (
                  <SelectItem key={trip.id} value={trip.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {trip.fromCountry || 'País no especificado'} ({trip.fromCity}) → {trip.toCountry || 'Guatemala'} ({trip.toCity})
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Llegada: {new Date(trip.arrivalDate).toLocaleDateString()} • Espacio: {trip.availableSpace}kg
                      </span>
                      <div className="flex space-x-2 mt-1">
                        <span className="text-xs bg-blue-100 px-1 rounded">
                          ✈️ Desde: {trip.fromCountry || 'País no especificado'}
                        </span>
                        <span className="text-xs bg-green-100 px-1 rounded">
                          🏠 Hacia: {trip.toCountry || 'Guatemala'}
                        </span>
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