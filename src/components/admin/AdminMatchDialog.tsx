import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ChevronDown, ChevronRight, User, MapPin, Calendar, Package, Truck, DollarSign, Settings, Clock, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { getStatusLabel } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import ProductTipAssignmentModal from "./ProductTipAssignmentModal";

interface AdminMatchDialogProps {
  showMatchDialog: boolean;
  setShowMatchDialog: (show: boolean) => void;
  selectedPackage: any;
  matchingTrip: string;
  setMatchingTrip: (trip: string) => void;
  availableTrips: any[];
  onMatch: (adminTip?: number, productsWithTips?: any[]) => void;
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
  const [travelerProfiles, setTravelerProfiles] = useState<{[key: string]: any}>({});
  const [showTravelerInfo, setShowTravelerInfo] = useState(false);
  const [selectedTraveler, setSelectedTraveler] = useState<any>(null);
  const [travelerPackages, setTravelerPackages] = useState<any[]>([]);
  const [adminTip, setAdminTip] = useState<string>('');
  const [showProductTipModal, setShowProductTipModal] = useState(false);
  const [assignedProductsWithTips, setAssignedProductsWithTips] = useState<any[]>([]);

  // Filter trips to exclude those with past arrival dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const validTrips = availableTrips.filter(trip => {
    const isNotExpired = new Date(trip.arrival_date) >= today;
    return isNotExpired;
  });

  // Fetch traveler profiles when dialog opens and trips are available
  useEffect(() => {
    if (showMatchDialog && validTrips.length > 0) {
      const fetchTravelerProfiles = async () => {
        const userIds = [...new Set(validTrips.map(trip => trip.user_id))];
        
        try {
          // Use admin function to bypass RLS
          const { data, error } = await supabase
            .rpc('admin_view_all_users');
          
          if (error) {
            console.error('Error fetching traveler profiles:', error);
            return;
          }
          
          // Filter only the users we need
          const relevantProfiles = data?.filter(profile => userIds.includes(profile.id)) || [];
          const profilesMap = relevantProfiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
          
          setTravelerProfiles(profilesMap);
        } catch (error) {
          console.error('Error fetching traveler profiles:', error);
        }
      };
      
      fetchTravelerProfiles();
    }
  }, [showMatchDialog, validTrips]);

  const getTravelerName = (userId: string) => {
    const profile = travelerProfiles[userId];
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.username) {
      return profile.username;
    }
    return `Viajero #${userId}`;
  };

  const handleTravelerClick = async (trip: any) => {
    const profile = travelerProfiles[trip.user_id];
    setSelectedTraveler({ ...profile, trip });
    
    // Fetch packages for this trip
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('matched_trip_id', trip.id);
      
      if (error) {
        console.error('Error fetching traveler packages:', error);
        setTravelerPackages([]);
      } else {
        setTravelerPackages(data || []);
      }
    } catch (error) {
      console.error('Error fetching traveler packages:', error);
      setTravelerPackages([]);
    }
    
    setShowTravelerInfo(true);
  };

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

  // Helper functions to detect multi-product orders
  const isMultiProductOrder = () => {
    return selectedPackage?.products_data && 
           Array.isArray(selectedPackage.products_data) && 
           selectedPackage.products_data.length > 1;
  };

  const getProductsForModal = () => {
    console.log('🔍 DEBUG getProductsForModal - selectedPackage:', selectedPackage);
    console.log('🔍 DEBUG products_data:', selectedPackage?.products_data);
    
    if (!selectedPackage?.products_data) {
      console.log('❌ No products_data found');
      return [];
    }
    
    const products = selectedPackage.products_data.map((product: any, index: number) => {
      console.log(`🔍 DEBUG Product ${index}:`, product);
      
      // Handle different data structure possibilities
      const mappedProduct = {
        itemDescription: product.itemDescription || product.item_description || product.description || '',
        estimatedPrice: product.estimatedPrice || product.estimated_price || product.price || '0',
        itemLink: product.itemLink || product.item_link || product.link || '',
        quantity: product.quantity || product.qty || '1',
        adminAssignedTip: product.adminAssignedTip || 0
      };
      
      console.log(`🔍 DEBUG Mapped Product ${index}:`, mappedProduct);
      return mappedProduct;
    });
    
    console.log('🔍 DEBUG Final products for modal:', products);
    return products;
  };

  const getTotalAssignedTip = () => {
    if (isMultiProductOrder() && assignedProductsWithTips.length > 0) {
      return assignedProductsWithTips.reduce((total, product) => total + (product.adminAssignedTip || 0), 0);
    }
    return adminTip ? parseFloat(adminTip) : 0;
  };

  const handleProductTipSave = (productsWithTips: any[], totalTip: number) => {
    setAssignedProductsWithTips(productsWithTips);
    setAdminTip(totalTip.toString());
  };

  const handleMatch = () => {
    if (selectedTripId) {
      const tipAmount = getTotalAssignedTip();
      if (isMultiProductOrder()) {
        onMatch(tipAmount, assignedProductsWithTips);
      } else {
        onMatch(tipAmount);
      }
    }
  };

  // Helper function to get total quantity
  const getTotalQuantity = () => {
    if (selectedPackage?.products_data && Array.isArray(selectedPackage.products_data)) {
      return selectedPackage.products_data.reduce((total, product) => {
        const quantity = parseInt(product.quantity || product.qty || '1');
        return total + quantity;
      }, 0);
    }
    return 1; // Default quantity for single product
  };

  return (
    <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
      <DialogContent className="w-[98vw] max-w-5xl h-[98vh] sm:h-[95vh] overflow-hidden flex flex-col p-2 sm:p-4">
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
          {/* Package Summary */}
          {selectedPackage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-2 sm:mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-900 font-medium text-sm">📦 Solicitud:</span>
                    <span className="font-medium text-gray-900 text-sm">
                      {selectedPackage.item_description}
                    </span>
                  </div>
                  
                  {/* Package Details Row */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      ${selectedPackage.estimated_price}
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                      Cantidad: {getTotalQuantity()}
                    </Badge>
                    <Badge variant="outline" className="border-orange-300 text-orange-700 text-xs">
                      📍 {selectedPackage.purchase_origin || 'No especificado'}
                    </Badge>
                    <Badge variant="outline" className="border-gray-300 text-xs">
                      🎯 {selectedPackage.package_destination || 'Guatemala'}
                    </Badge>
                    {selectedPackage.delivery_deadline && (
                      <Badge variant="outline" className="border-red-300 text-red-700 text-xs">
                        ⏰ Límite: {new Date(selectedPackage.delivery_deadline).toLocaleDateString('es-GT', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Badge>
                    )}
                  </div>

                  {/* Additional Package Information */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    {/* Additional Notes */}
                    {selectedPackage.additional_notes && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <div>
                          <span className="text-xs text-blue-700 font-medium">COMENTARIOS:</span>
                          <span className="text-xs text-blue-900 ml-1">
                            {selectedPackage.additional_notes.length > 30 
                              ? selectedPackage.additional_notes.substring(0, 30) + '...'
                              : selectedPackage.additional_notes
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                 
                {/* Expand Button */}
                <button
                  onClick={() => setPackageExpanded(!packageExpanded)}
                  className="p-1 hover:bg-blue-100 rounded transition-colors self-start"
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
                             {selectedPackage.profiles?.first_name && selectedPackage.profiles?.last_name 
                               ? `${selectedPackage.profiles.first_name} ${selectedPackage.profiles.last_name}`
                               : selectedPackage.profiles?.username || 'Usuario'}
                             <span className="text-xs text-blue-600 ml-2">
                               (ID: {selectedPackage.user_id || 'N/A'})
                             </span>
                           </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-700">ORIGEN DE COMPRA</p>
                           <p className="font-medium text-sm text-blue-900">
                             {selectedPackage.purchase_origin || 'No especificado'}
                           </p>
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-2">
                       {selectedPackage.item_link && (
                         <div className="flex items-center space-x-2">
                           <Package className="h-4 w-4 text-blue-600" />
                           <div className="flex-1">
                             <p className="text-xs text-blue-700">ENLACE DEL PRODUCTO</p>
                             <a 
                               href={selectedPackage.item_link}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-sm text-blue-600 hover:underline truncate block"
                            >
                              Ver producto
                            </a>
                            <p className="text-xs text-blue-700 mt-1">
                              Cantidad: {getTotalQuantity()} unidad{getTotalQuantity() !== 1 ? 'es' : ''}
                            </p>
                          </div>
                        </div>
                      )}
                       {selectedPackage.additional_notes && (
                         <div className="flex items-start space-x-2">
                           <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                           <div>
                             <p className="text-xs text-blue-700">NOTAS</p>
                             <p className="font-medium text-sm text-blue-900">
                               {selectedPackage.additional_notes}
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
                Viajes Disponibles ({validTrips.length})
              </Label>
              <p className="text-sm text-gray-600">
                Haz clic en un viaje para seleccionarlo
              </p>
            </div>

            <ScrollArea className="flex-1 w-full min-h-0">
              <div className="space-y-2 pr-4 pb-4">
                {validTrips.map((trip) => (
                  <Card 
                    key={trip.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedTripId === trip.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleTripSelection(trip.id)}
                  >
                    <CardContent className="p-2 sm:p-3">
                         {/* Main Trip Info - Mobile Responsive Layout */}
                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                           <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-1">
                               {/* Traveler */}
                               <div className="flex items-center space-x-2 min-w-fit">
                                 <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#a0a0a0', color: 'white' }}>
                                   {trip.user_id?.toString().slice(-2) || '00'}
                                 </div>
                                  <div>
                                    <p 
                                      className="font-medium text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTravelerClick(trip);
                                      }}
                                    >
                                      {getTravelerName(trip.user_id)}
                                    </p>
                                  </div>
                               </div>

                              {/* Route */}
                              <div className="flex items-center space-x-2 min-w-fit">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                 <div className="flex items-center space-x-2">
                                   <span className="text-sm font-medium text-gray-700">
                                     {trip.from_city || 'No especificado'}
                                   </span>
                                   <span className="text-gray-400">→</span>
                                   <span className="text-sm font-medium text-gray-900">
                                     {trip.to_city}
                                   </span>
                                 </div>
                              </div>

                              {/* Reception Window */}
                              <div className="flex items-center space-x-2 min-w-fit">
                                <Package className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500 font-medium">VENTANA RECEPCIÓN</p>
                                  <p className="text-sm font-medium text-gray-700">
                                    {trip.first_day_packages && trip.last_day_packages ? 
                                      `${new Date(trip.first_day_packages).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })} - ${new Date(trip.last_day_packages).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}` 
                                      : 'Por confirmar'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Right side - Dates and Badges */}
                           <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                             {/* Key Dates */}
                             <div className="flex items-center justify-between sm:justify-start space-x-4 min-w-fit">
                               <div className="text-center">
                                 <p className="text-xs text-gray-500 font-medium">LLEGADA</p>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {trip.arrival_date ? new Date(trip.arrival_date).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' }) : 'N/A'}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 font-medium">ENTREGA</p>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {trip.delivery_date ? new Date(trip.delivery_date).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' }) : 'N/A'}
                                  </p>
                               </div>
                             </div>

                             {/* Badges */}
                             <div className="flex items-center sm:flex-col sm:items-center justify-between sm:justify-start space-x-2 sm:space-x-0 sm:space-y-1 min-w-fit">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${trip.delivery_method === 'oficina' ? 'border-green-300 text-green-700' : 'border-blue-300 text-blue-700'}`}
                                >
                                  <Truck className="h-3 w-3 mr-1" />
                                  {trip.delivery_method === 'oficina' ? 'Oficina' : 'Mensajero'}
                                </Badge>
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                  {trip.available_space}kg
                                </Badge>
                             </div>

                             {/* Expand Button */}
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 toggleTripExpansion(trip.id);
                               }}
                               className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0 self-end sm:self-center"
                             >
                               {expandedTrips.has(trip.id) ? (
                                 <ChevronDown className="h-4 w-4 text-gray-400" />
                               ) : (
                                 <ChevronRight className="h-4 w-4 text-gray-400" />
                               )}
                             </button>
                           </div>
                         </div>

                       {/* Expandable Content */}
                       {expandedTrips.has(trip.id) && (
                         <div className="mt-3 pt-3 border-t border-gray-200">
                           <ScrollArea className="max-h-[600px] w-full">
                             <div className="grid grid-cols-2 gap-3 pr-2">
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
                                        {trip.first_day_packages ? new Date(trip.first_day_packages).toLocaleDateString('es-GT') : 'No especificado'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-blue-700">Último día:</span>
                                      <span className="font-medium text-blue-900">
                                        {trip.last_day_packages ? new Date(trip.last_day_packages).toLocaleDateString('es-GT') : 'No especificado'}
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
                                      <p className="font-medium text-xs">{trip.to_country || 'Guatemala'}</p>
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
                           </ScrollArea>
                         </div>
                       )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Action Bar: Tip + Buttons */}
        <div className="border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {selectedTripId && (
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Tip asignado por Admin
                </Label>
              </div>
              
              {isMultiProductOrder() ? (
                // Multi-product order: Show button to open modal
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProductTipModal(true)}
                    className="w-full sm:w-auto"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Asignar Tips por Producto ({selectedPackage.products_data.length} productos)
                  </Button>
                  {getTotalAssignedTip() > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800">
                        Tips asignados: Q{getTotalAssignedTip().toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600">
                        {assignedProductsWithTips.length} producto{assignedProductsWithTips.length !== 1 ? 's' : ''} con tips individuales
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Single product order: Show input field
                <div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Q</span>
                    <Input
                      id="admin-tip"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ej: 25.00"
                      value={adminTip}
                      onChange={(e) => setAdminTip(e.target.value)}
                      className="text-sm pl-7 h-11 w-full sm:w-48"
                    />
                  </div>
                  {!adminTip && (
                    <p className="text-xs text-destructive mt-1">Este campo es requerido para confirmar el match.</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Monto en GTQ que se asignará al viajero por este paquete
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex w-full sm:w-auto items-center gap-3">
            <Button 
              onClick={handleMatch} 
              className="flex-1 sm:flex-none sm:w-auto h-11"
              disabled={!selectedTripId || getTotalAssignedTip() <= 0}
              variant="shopper"
            >
              <Zap className="h-4 w-4 mr-2" />
              Confirmar Match
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowMatchDialog(false)}
              className="px-8 h-11"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Traveler Info Modal */}
      <Dialog open={showTravelerInfo} onOpenChange={setShowTravelerInfo}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información del Viajero</span>
            </DialogTitle>
            <DialogDescription>
              Perfil y paquetes del viajero seleccionado
            </DialogDescription>
          </DialogHeader>

          {selectedTraveler && (
            <div className="space-y-6">
              {/* Traveler Profile */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Perfil del Viajero</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Nombre</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.first_name && selectedTraveler.last_name 
                            ? `${selectedTraveler.first_name} ${selectedTraveler.last_name}` 
                            : selectedTraveler.username || `Usuario ID: ${selectedTraveler.trip?.user_id}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Ruta de Viaje</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.trip?.from_city} → {selectedTraveler.trip?.to_city}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Fecha de Llegada</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.trip?.arrival_date 
                            ? new Date(selectedTraveler.trip.arrival_date).toLocaleDateString('es-GT')
                            : 'No especificado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Método de Entrega</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.trip?.delivery_method === 'oficina' ? 'Oficina Favorón' : 'Mensajero'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Traveler's Packages */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">
                    Paquetes en este Viaje ({travelerPackages.length})
                  </h3>
                </CardHeader>
                <CardContent>
                  {travelerPackages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Este viaje no tiene paquetes asignados aún</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {travelerPackages.map((pkg) => (
                        <div key={pkg.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{pkg.item_description}</p>
                              <p className="text-xs text-muted-foreground">
                                De: {pkg.purchase_origin} → Para: {pkg.package_destination}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="text-xs">
                                ${pkg.estimated_price}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Estado: {getStatusLabel(pkg.status)}
                              </p>
                            </div>
                          </div>
                          {pkg.additional_notes && (
                            <p className="text-xs text-muted-foreground bg-white p-2 rounded border">
                              {pkg.additional_notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Tip Assignment Modal */}
      <ProductTipAssignmentModal
        isOpen={showProductTipModal}
        onClose={() => setShowProductTipModal(false)}
        onSave={handleProductTipSave}
        products={getProductsForModal()}
        packageId={selectedPackage?.id || ''}
      />
    </Dialog>
  );
};

export default AdminMatchDialog;
