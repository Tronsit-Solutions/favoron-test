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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
            <Zap className="h-6 w-6 text-primary" />
            <span>Hacer Match de Solicitud</span>
          </DialogTitle>
          <DialogDescription className="text-base">
            Conecta esta solicitud con un viaje compatible para completar el match
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* Package Information Section */}
          {selectedPackage && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-6">
              <h4 className="font-semibold text-lg text-blue-900 mb-3 flex items-center space-x-2">
                <span>📦</span>
                <span>Solicitud Seleccionada</span>
              </h4>
              
              <div className="bg-white rounded-lg p-4 space-y-3">
                <p className="font-medium text-gray-900">{selectedPackage.itemDescription}</p>
                <div className="flex items-center space-x-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    💰 ${selectedPackage.estimatedPrice}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span>🛒</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">COMPRAR EN</p>
                      <p className="font-medium text-gray-900">
                        {selectedPackage.purchaseOrigin || 'No especificado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span>🎯</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">ENTREGAR EN</p>
                      <p className="font-medium text-gray-900">
                        {selectedPackage.packageDestination || 'Guatemala'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Trip Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span>✈️</span>
              </div>
              <div>
                <Label htmlFor="matchingTrip" className="text-lg font-semibold text-gray-900">
                  Seleccionar Viaje Compatible
                </Label>
                <p className="text-sm text-gray-600">
                  Elige el viaje que mejor coincida con los requerimientos de la solicitud
                </p>
              </div>
            </div>
            
            <Select value={matchingTrip} onValueChange={setMatchingTrip}>
              <SelectTrigger className="h-16 border-2 border-gray-200 hover:border-primary/50 transition-colors">
                <SelectValue placeholder="👆 Haz clic para ver los viajes disponibles" />
              </SelectTrigger>
              <SelectContent className="max-h-96 w-full min-w-[600px]">
                {availableTrips.map(trip => (
                  <SelectItem key={trip.id} value={trip.id.toString()} className="p-0 h-auto">
                    <div className="w-full p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      {/* Trip Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                            {trip.userId.toString().slice(-2)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Viajero #{trip.userId}</p>
                            <p className="text-sm text-gray-500">ID del viaje: {trip.id}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs text-gray-500">RUTA:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium">
                              🛫 {trip.fromCity || 'No especificado'}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                              🛬 {trip.toCity}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{trip.toCountry}</p>
                        </div>
                      </div>
                      
                      {/* Package Window */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-blue-600">📦</span>
                          <span className="text-sm font-semibold text-blue-900">Ventana de Recepción</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center">
                            <p className="text-xs text-blue-600 font-medium">PRIMER DÍA</p>
                            <p className="font-semibold text-blue-900">
                              {trip.firstDayPackages ? new Date(trip.firstDayPackages).toLocaleDateString('es-GT') : 'No especificado'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-blue-600 font-medium">ÚLTIMO DÍA</p>
                            <p className="font-semibold text-blue-900">
                              {trip.lastDayPackages ? new Date(trip.lastDayPackages).toLocaleDateString('es-GT') : 'No especificado'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Delivery Info */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              🚚 {trip.deliveryMethod === 'oficina' ? 'Oficina Zona 14' : 'Mensajero'}
                            </span>
                          </div>
                          <div className="text-sm">
                            <p className="text-gray-500">Entrega:</p>
                            <p className="font-medium text-gray-900">
                              {trip.deliveryDate ? new Date(trip.deliveryDate).toLocaleDateString('es-GT') : 'No especificado'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                            📏 {trip.availableSpace}kg disponible
                          </div>
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <Button 
              onClick={onMatch} 
              className="flex-1 h-12 text-base font-semibold"
              disabled={!matchingTrip}
              variant="shopper"
            >
              <Zap className="h-5 w-5 mr-2" />
              Confirmar Match
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowMatchDialog(false)}
              className="flex-1 h-12 text-base"
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