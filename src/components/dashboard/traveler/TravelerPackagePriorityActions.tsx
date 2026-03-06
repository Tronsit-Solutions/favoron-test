import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign, CheckCircle, AlertTriangle, MapPin } from "lucide-react";
import { OfficeAddressModal } from "@/components/ui/office-address-modal";

interface TravelerPackagePriorityActionsProps {
  pkg: any;
  onQuote: (pkg: any, userType: 'user' | 'admin') => void;
  onConfirmReceived: () => void;
  onConfirmOfficeDelivery?: () => void;
}

const TravelerPackagePriorityActions = ({
  pkg,
  onQuote,
  onConfirmReceived,
  onConfirmOfficeDelivery
}: TravelerPackagePriorityActionsProps) => {
  const [showDeliveryConfirmation, setShowDeliveryConfirmation] = useState(false);
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  if (pkg.status !== 'matched' && pkg.status !== 'in_transit' && pkg.status !== 'received_by_traveler' && pkg.status !== 'pending_office_confirmation') return null;
  return <div className="mb-3 space-y-2">
      {/* Tip/Compensation display - most important for travelers */}
      {false && <div className="bg-muted/30 border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="font-bold text-sm">Q</span>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">
                  💰 {pkg.status === 'matched' ? 'Tip garantizado por Favorón' : 'Tu compensación'}
                </p>
                <p className="text-2xl font-bold">Q0.00</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {pkg.status === 'matched' ? 'Mínimo garantizado' : 'Ganancia por este Favorón'}
              </p>
            </div>
          </div>
        </div>}

      {/* Action section */}
      <div className="p-3 bg-muted/30 border rounded-lg">
        {/* Mobile-first vertical layout */}
        <div className="space-y-3">
          {/* Status message section */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center mt-0.5">
              {pkg.status === 'matched' ? <DollarSign className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
            </div>
            <div className="flex-1 min-w-0 sm:flex sm:items-start sm:justify-between">
              <div className="flex-1">
                {pkg.status === 'matched' && <div>
                    <p className="text-sm font-semibold mb-1">Revisa el pedido y acéptalo si te parece bien</p>
                    
                  </div>}
                {pkg.status === 'in_transit' && <div>
                    <p className="text-sm font-semibold mb-1">¿Ya recibiste el paquete?</p>
                    {pkg.products_data && pkg.products_data.length > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Puedes confirmar productos individualmente a medida que los recibas
                      </p>
                    )}
                  </div>}
                {pkg.status === 'received_by_traveler' && !pkg.office_delivery?.admin_confirmation && <div>
                    <p className="text-sm font-semibold mb-1">¡Paquete listo para entregar!</p>
                    <p className="text-xs text-muted-foreground">¿Ya entregaste el paquete en la oficina de Favorón?</p>
                  </div>}
                {pkg.status === 'received_by_traveler' && pkg.office_delivery?.admin_confirmation && <div>
                    <p className="text-sm font-semibold mb-1">✅ Entrega confirmada por Favorón</p>
                    <p className="text-xs text-muted-foreground">
                      Favorón ha confirmado la recepción del paquete. Tu compensación está siendo procesada.
                    </p>
                  </div>}
                {pkg.status === 'pending_office_confirmation' && <div>
                    <p className="text-sm font-semibold mb-0.5">🔒 Entrega pendiente de confirmación</p>
                    <p className="text-xs text-muted-foreground">
                      Esperando que Favorón confirme la recepción.
                    </p>
                  </div>}
              </div>
              
              {/* Button positioned on the right for desktop, below text for mobile */}
              <div className="mt-3 sm:mt-0 sm:ml-4 sm:flex-shrink-0">
                {pkg.status === 'matched' && pkg.admin_assigned_tip && pkg.matched_trip_id && <Button size="sm" variant="success" onClick={() => onQuote(pkg, 'user')} className="font-semibold w-full sm:w-auto h-9 text-sm">
                    <DollarSign className="h-3 w-3 mr-2" />
                    Ver y Aceptar Tip
                  </Button>}
                {pkg.status === 'matched' && !pkg.admin_assigned_tip && <Button size="sm" variant="outline" disabled className="font-medium w-full sm:w-auto h-9 text-sm">
                    Esperando tip del admin
                  </Button>}
                {pkg.status === 'in_transit' && <Button size="sm" onClick={onConfirmReceived} variant="success" className="font-medium w-full sm:w-auto h-9 text-sm">
                    <CheckCircle className="h-3 w-3 mr-2" />
                    Confirmar recibido
                  </Button>}
                {pkg.status === 'received_by_traveler' && !pkg.office_delivery?.admin_confirmation && onConfirmOfficeDelivery && (
                  <div className="w-full sm:w-auto space-y-2">
                    {!showDeliveryConfirmation ? (
                      <Button 
                        size="sm" 
                        onClick={() => setShowDeliveryConfirmation(true)} 
                        variant="success" 
                        className="font-medium w-full sm:w-auto h-9 text-sm"
                      >
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Marcar como entregado
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-2 bg-warning/10 border border-warning/30 rounded text-xs text-warning-foreground">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          ¿Confirmas que entregaste el paquete en la oficina?
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              onConfirmOfficeDelivery();
                              setShowDeliveryConfirmation(false);
                            }} 
                            variant="success" 
                            className="font-medium flex-1 h-9 text-sm"
                          >
                            <CheckCircle className="h-3 w-3 mr-2" />
                            Confirmar entrega
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => setShowDeliveryConfirmation(false)} 
                            variant="outline" 
                            className="font-medium flex-1 h-9 text-sm"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {pkg.status === 'received_by_traveler' && pkg.office_delivery?.admin_confirmation && <Button size="sm" variant="outline" disabled className="font-medium w-full sm:w-auto h-9 text-sm">
                    <CheckCircle className="h-3 w-3 mr-2" />
                    Confirmado por Favorón
                  </Button>}
                {pkg.status === 'pending_office_confirmation' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => { e.stopPropagation(); setShowOfficeModal(true); }}
                    className="font-medium w-full sm:w-auto h-9 text-sm"
                  >
                    <MapPin className="h-3 w-3 mr-2" />
                    Ver dirección de oficina
                  </Button>
                )}
              </div>
            </div>
          </div>
          
        </div>
        
        {/* Office Address Button - inline for pending_office_confirmation, below for others */}
        {['received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed'].includes(pkg.status) && (
          pkg.status === 'pending_office_confirmation' ? null : (
            <div className="mt-3 pt-3 border-t border-muted/50">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowOfficeModal(true)}
                className="w-full sm:w-auto"
              >
                <MapPin className="h-3 w-3 mr-2" />
                Ver dirección de oficina
              </Button>
            </div>
          )
        )}
      </div>
      
      <OfficeAddressModal 
        isOpen={showOfficeModal} 
        onClose={() => setShowOfficeModal(false)} 
      />
    </div>;
};
export default TravelerPackagePriorityActions;