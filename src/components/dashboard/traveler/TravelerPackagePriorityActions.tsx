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

  if (pkg.status === 'pending_office_confirmation') return null;

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
      <div>
        {/* In Transit: compact single-row layout */}
        {pkg.status === 'in_transit' && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">¿Ya recibiste el paquete?</p>
              {pkg.products_data && pkg.products_data.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  💡 Confirma productos individualmente
                </p>
              )}
            </div>
            <Button size="sm" onClick={onConfirmReceived} variant="success" className="font-medium flex-shrink-0 h-9 text-sm">
              <CheckCircle className="h-3 w-3 mr-2" />
              Confirmar recibido
            </Button>
          </div>
        )}

        {/* Received by traveler: compact inline layout */}
        {pkg.status === 'received_by_traveler' && !pkg.office_delivery?.admin_confirmation && (
          <div>
            {!showDeliveryConfirmation ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">¡Paquete listo para entregar!</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {onConfirmOfficeDelivery && (
                    <Button size="sm" onClick={() => setShowDeliveryConfirmation(true)} variant="success" className="font-medium h-9 text-sm">
                      <CheckCircle className="h-3 w-3 mr-2" />
                      Marcar como entregado
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowOfficeModal(true)} className="h-9 text-sm">
                    <MapPin className="h-3 w-3 mr-2" />
                    Ver oficina
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-2 bg-warning/10 border border-warning/30 rounded text-xs text-warning-foreground">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  ¿Confirmas que entregaste el paquete en la oficina?
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { onConfirmOfficeDelivery?.(); setShowDeliveryConfirmation(false); }} variant="success" className="font-medium flex-1 h-9 text-sm">
                    <CheckCircle className="h-3 w-3 mr-2" />
                    Confirmar entrega
                  </Button>
                  <Button size="sm" onClick={() => setShowDeliveryConfirmation(false)} variant="outline" className="font-medium flex-1 h-9 text-sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {pkg.status === 'received_by_traveler' && pkg.office_delivery?.admin_confirmation && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">✅ Entrega confirmada por Favorón</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" disabled className="font-medium h-9 text-sm">
                <CheckCircle className="h-3 w-3 mr-2" />
                Confirmado
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowOfficeModal(true)} className="h-9 text-sm">
                <MapPin className="h-3 w-3 mr-2" />
                Ver oficina
              </Button>
            </div>
          </div>
        )}

        {/* Matched status: vertical layout */}
        {pkg.status === 'matched' && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {(pkg as any)._assignmentStatus === 'quote_sent' 
                  ? '✅ Cotización enviada — esperando al comprador'
                  : 'Revisa el pedido y acéptalo si te parece bien'}
              </p>
            </div>
            <div className="flex-shrink-0">
              {(pkg as any)._assignmentStatus === 'quote_sent' ? (
                <Button size="sm" variant="outline" disabled className="font-medium h-9 text-sm">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Cotización enviada
                </Button>
              ) : pkg.admin_assigned_tip ? (
                <Button size="sm" variant="success" onClick={() => onQuote(pkg, 'user')} className="font-semibold h-9 text-sm">
                  <DollarSign className="h-3 w-3 mr-2" />
                  Ver y Aceptar Tip
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled className="font-medium h-9 text-sm">
                  Esperando tip del admin
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Pending office confirmation */}
        {pkg.status === 'pending_office_confirmation' && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">🔒 Entrega pendiente de confirmación</p>
            </div>
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setShowOfficeModal(true); }} className="font-medium h-9 text-sm flex-shrink-0">
              <MapPin className="h-3 w-3 mr-2" />
              Ver oficina
            </Button>
          </div>
        )}
      </div>
      
      <OfficeAddressModal 
        isOpen={showOfficeModal} 
        onClose={() => setShowOfficeModal(false)} 
      />
    </div>;
};
export default TravelerPackagePriorityActions;