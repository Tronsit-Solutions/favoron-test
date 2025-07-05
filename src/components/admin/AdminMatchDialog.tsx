import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ChevronDown, ChevronRight, User, MapPin, Calendar, Package, Truck } from "lucide-react";
import { useState } from "react";

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
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [expandedTrips, setExpandedTrips] = useState<Set<number>>(new Set());
  const [packageExpanded, setPackageExpanded] = useState<boolean>(false);

  const toggleTripExpansion = (tripId: number) => {
    const newExpanded = new Set(expandedTrips);
    if (newExpanded.has(tripId)) {
      newExpanded.delete(tripId);
    } else {
      newExpanded.add(tripId);
    }
    setExpandedTrips(newExpanded);
  };

  const handleTripSelection = (tripId: number) => {
    setSelectedTripId(tripId);
    setMatchingTrip(tripId.toString());
  };

  const handleMatch = () => {
    if (selectedTripId) {
      onMatch();
    }
  };
  return (
    <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Hacer Match de Solicitud</span>
          </DialogTitle>
          <DialogDescription>
            Selecciona el viaje más compatible con esta solicitud
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Expandable Package Summary */}
          {selectedPackage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-blue-900 font-medium text-sm">📦 Solicitud:</span>
                  <span className="font-medium text-gray-900 text-sm truncate max-w-[200px]">
                    {selectedPackage.itemDescription}
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    ${selectedPackage.estimatedPrice}
                  </Badge>
                  <Badge variant="outline" className="border-gray-300 text-xs">
                    🎯 {selectedPackage.packageDestination || 'Guatemala'}
                  </Badge>
                </div>
                
                {/* Expand Button */}
                <button
                  onClick={() => setPackageExpanded(!packageExpanded)}
                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                >
                  {packageExpanded ? (
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              </div>

              {/* Expandable Package Details */}
              {packageExpanded && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Shopper Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-700">SHOPPER</p>
                          <p className="font-medium text-sm text-blue-900">
                            {selectedPackage.shopperName || `Usuario #${selectedPackage.userId || 'N/A'}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-700">ORIGEN DE COMPRA</p>
                          <p className="font-medium text-sm text-blue-900">
                            {selectedPackage.purchaseOrigin || 'No especificado'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-2">
                      {selectedPackage.productLink && (
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-xs text-blue-700">ENLACE DEL PRODUCTO</p>
                            <a 
                              href={selectedPackage.productLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-sm text-blue-600 hover:underline truncate block"
                            >
                              Ver producto
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedPackage.notes && (
                        <div className="flex items-start space-x-2">
                          <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-xs text-blue-700">NOTAS</p>
                            <p className="font-medium text-sm text-blue-900">
                              {selectedPackage.notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trips List */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <Label className="text-lg font-semibold text-gray-900">
                Viajes Disponibles ({availableTrips.length})
              </Label>
              <p className="text-sm text-gray-600">
                Haz clic en un viaje para seleccionarlo
              </p>
            </div>

            <ScrollArea className="flex-1 w-full" style={{ maxHeight: 'calc(50vh - 100px)' }}>
              <div className="space-y-2 pr-4 pb-4">
                {availableTrips.map((trip) => (
                  <Card 
                    key={trip.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedTripId === trip.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleTripSelection(trip.id)}
                  >
                     <CardContent className="p-3">
                       {/* Main Trip Info Row - More Compact */}
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-3 flex-1">
                           {/* Traveler - Compact */}
                           <div className="flex items-center space-x-2 min-w-[100px]">
                             <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#a0a0a0', color: 'white' }}>
                               {trip.userId.toString().slice(-2)}
                             </div>
                             <div>
                               <p className="font-medium text-xs">Viajero #{trip.userId}</p>
                             </div>
                           </div>

                           {/* Route - Compact */}
                           <div className="flex items-center space-x-2 flex-1 min-w-[180px]">
                             <MapPin className="h-3 w-3 text-gray-400" />
                             <div className="flex items-center space-x-1">
                               <span className="text-xs font-medium text-gray-700 truncate">
                                 {trip.fromCity || 'No especificado'}
                               </span>
                               <span className="text-gray-400 text-xs">→</span>
                               <span className="text-xs font-medium text-gray-900 truncate">
                                 {trip.toCity}
                               </span>
                             </div>
                           </div>

                           {/* Key Dates - Compact */}
                           <div className="flex items-center space-x-3 min-w-[120px]">
                             <div className="text-center">
                               <p className="text-xs text-gray-500">LLEGADA</p>
                               <p className="text-xs font-medium">
                                 {trip.firstDayPackages ? new Date(trip.firstDayPackages).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' }) : 'N/A'}
                               </p>
                             </div>
                             <div className="text-center">
                               <p className="text-xs text-gray-500">ENTREGA</p>
                               <p className="text-xs font-medium">
                                 {trip.deliveryDate ? new Date(trip.deliveryDate).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' }) : 'N/A'}
                               </p>
                             </div>
                           </div>

                           {/* Delivery Method & Space - Compact */}
                           <div className="flex items-center space-x-2 min-w-[120px]">
                             <Badge 
                               variant="outline" 
                               className={`text-xs h-5 ${trip.deliveryMethod === 'oficina' ? 'border-green-300 text-green-700' : 'border-blue-300 text-blue-700'}`}
                             >
                               <Truck className="h-2 w-2 mr-1" />
                               {trip.deliveryMethod === 'oficina' ? 'Oficina' : 'Mensajero'}
                             </Badge>
                             <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs h-5">
                               {trip.availableSpace}kg
                             </Badge>
                           </div>
                         </div>

                         {/* Expand Button */}
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             toggleTripExpansion(trip.id);
                           }}
                           className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                         >
                           {expandedTrips.has(trip.id) ? (
                             <ChevronDown className="h-4 w-4 text-gray-400" />
                           ) : (
                             <ChevronRight className="h-4 w-4 text-gray-400" />
                           )}
                         </button>
                       </div>

                       {/* Expandable Content */}
                       {expandedTrips.has(trip.id) && (
                         <div className="mt-3 pt-3 border-t border-gray-200">
                           <div className="grid grid-cols-2 gap-3">
                             {/* Package Window Details */}
                             <div className="bg-blue-50 rounded-lg p-3">
                               <div className="flex items-center space-x-2 mb-2">
                                 <Package className="h-3 w-3 text-blue-600" />
                                 <span className="font-medium text-blue-900 text-sm">Ventana de Recepción</span>
                               </div>
                               <div className="space-y-1 text-xs">
                                 <div className="flex justify-between">
                                   <span className="text-blue-700">Primer día:</span>
                                   <span className="font-medium text-blue-900">
                                     {trip.firstDayPackages ? new Date(trip.firstDayPackages).toLocaleDateString('es-GT') : 'No especificado'}
                                   </span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-blue-700">Último día:</span>
                                   <span className="font-medium text-blue-900">
                                     {trip.lastDayPackages ? new Date(trip.lastDayPackages).toLocaleDateString('es-GT') : 'No especificado'}
                                   </span>
                                 </div>
                               </div>
                             </div>

                             {/* Additional Details */}
                             <div className="space-y-2">
                               <div className="flex items-center space-x-2">
                                 <Calendar className="h-3 w-3 text-gray-400" />
                                 <div>
                                   <p className="text-xs text-gray-500">PAÍS DE DESTINO</p>
                                   <p className="font-medium text-xs">{trip.toCountry}</p>
                                 </div>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <User className="h-3 w-3 text-gray-400" />
                                 <div>
                                   <p className="text-xs text-gray-500">ID DE VIAJE</p>
                                   <p className="font-medium text-xs">#{trip.id}</p>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                       )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4 flex space-x-3">
          <Button 
            onClick={handleMatch} 
            className="flex-1 h-11"
            disabled={!selectedTripId}
            variant="shopper"
          >
            <Zap className="h-4 w-4 mr-2" />
            Confirmar Match
            {selectedTripId && (
              <span className="ml-2 text-xs opacity-75">
                (Viajero #{availableTrips.find(t => t.id === selectedTripId)?.userId})
              </span>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowMatchDialog(false)}
            className="px-8 h-11"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMatchDialog;