import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Eye, 
  CalendarDays, 
  Link as LinkIcon, 
  CheckCircle, 
  XCircle, 
  MessageCircle, 
  ChevronDown, 
  ChevronRight 
} from "lucide-react";
import { MatchStatusBadge, getStatusInfo } from "./MatchStatusBadge";

interface MatchCardProps {
  pkg: any;
  matchedTrip: any;
  isExpanded: boolean;
  onToggle: () => void;
  onViewDetail: () => void;
  onOpenChat: () => void;
  onConfirmOfficeReception: () => void;
  onConfirmDeliveryComplete: () => void;
  onAdminConfirmOfficeDelivery: () => void;
  onConfirmShopperReceived: () => void;
}

export const MatchCard = ({
  pkg,
  matchedTrip,
  isExpanded,
  onToggle,
  onViewDetail,
  onOpenChat,
  onConfirmOfficeReception,
  onConfirmDeliveryComplete,
  onAdminConfirmOfficeDelivery,
  onConfirmShopperReceived
}: MatchCardProps) => {
  const statusInfo = getStatusInfo(pkg.status);
  const showCompleteButton = ['delivered_to_office', 'out_for_delivery'].includes(pkg.status);
  const showOfficeReceptionButton = pkg.status === 'received_by_traveler';
  const showAdminOfficeConfirmButton = pkg.status === 'pending_office_confirmation';
  const showShopperReceivedButton = pkg.status === 'ready_for_pickup' || pkg.status === 'ready_for_delivery';

  const getStatusDescription = () => {
    switch (pkg.status) {
      case 'delivered_to_office':
        return pkg.confirmed_delivery_address 
          ? '🏢 Recibido en oficina, pendiente de entrega'
          : '🏢 Recibido en oficina, pendiente de recoger';
      case 'out_for_delivery':
        return `🚚 En reparto en ${pkg.package_destination}`;
      default:
        return `${statusInfo.icon} ${statusInfo.label}`;
    }
  };

  const getCompleteButtonText = () => {
    if (pkg.status === 'delivered_to_office') {
      return pkg.confirmed_delivery_address 
        ? '✅ Confirmar entrega' 
        : '✅ Confirmar pick-up';
    }
    return '✅ Confirmar entrega';
  };

  const getShopperReceivedButtonText = () => {
    if (pkg.delivery_method === 'pickup') {
      return 'Confirmar pick-up';
    } else {
      return 'Confirmar entrega';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CardContent className="p-4">
          {/* Compact Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    {isExpanded ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </Button>
                </CollapsibleTrigger>
                <h4 className="font-medium text-sm truncate">{pkg.item_description}</h4>
                <MatchStatusBadge status={pkg.status} />
              </div>
              
              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <span>👤 {pkg.user_id}</span>
                <span className="font-medium text-primary">${pkg.estimated_price}</span>
                <span>📅 {new Date(pkg.updated_at).toLocaleDateString('es-GT')}</span>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-1 ml-4">
              <Button size="sm" variant="outline" onClick={onViewDetail} className="px-2">
                <Eye className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={onOpenChat} className="px-2">
                <MessageCircle className="h-3 w-3" />
              </Button>
              
              {showCompleteButton && (
                <Button 
                  size="sm" 
                  onClick={onConfirmDeliveryComplete}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium"
                  title="Confirmar entrega completada"
                >
                  ✅ COMPLETAR
                </Button>
              )}
            </div>
          </div>

          {/* Detailed Information */}
          <CollapsibleContent className="space-y-3 mt-4">
            {/* Current Status */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Estado Actual</span>
                <span className="text-xs text-gray-500">
                  ID: {pkg.id.split('-')[0]}...
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  ['rejected', 'quote_rejected'].includes(pkg.status) 
                    ? 'bg-red-500' 
                    : pkg.status === 'completed' 
                    ? 'bg-green-500' 
                    : 'bg-yellow-500 animate-pulse'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">
                      {getStatusDescription()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(pkg.updated_at).toLocaleDateString('es-GT')}
                    </span>
                  </div>
                  
                  {/* Status-specific details */}
                  {pkg.status === 'quote_sent' && pkg.quote && (
                    <p className="text-xs text-gray-600 mt-1">
                      💰 Cotización: Q{(parseFloat(pkg.quote.price || 0) + parseFloat(pkg.quote.serviceFee || 0)).toFixed(2)}
                    </p>
                  )}
                  
                  {pkg.status === 'payment_confirmed' && (
                    <p className="text-xs text-gray-600 mt-1">✅ Listo para envío</p>
                  )}
                  
                  {pkg.status === 'in_transit' && (
                    <p className="text-xs text-gray-600 mt-1">
                      🚚 {pkg.tracking_info ? 'Con seguimiento' : 'En camino'}
                    </p>
                  )}
                  
                  {pkg.status === 'delivered_to_office' && (
                    <p className="text-xs text-gray-600 mt-1">
                      {pkg.confirmed_delivery_address 
                        ? '🚚 Será entregado a domicilio'
                        : '👤 Esperando que el shopper recoja'
                      }
                    </p>
                  )}
                  
                  {pkg.status === 'out_for_delivery' && (
                    <p className="text-xs text-gray-600 mt-1">🏠 Entrega a domicilio en progreso</p>
                  )}
                  
                  {['rejected', 'quote_rejected'].includes(pkg.status) && pkg.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">
                      📝 {typeof pkg.rejectionReason === 'string' ? pkg.rejectionReason : pkg.rejectionReason.value}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Match Info */}
            {matchedTrip && !['rejected', 'quote_rejected'].includes(pkg.status) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <LinkIcon className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">Match activo</span>
                </div>
                <div className="text-xs text-blue-700">
                  <p>🛫 {matchedTrip.from_city} → {matchedTrip.to_city}</p>
                  <p>👤 Viajero: {matchedTrip.user_id}</p>
                </div>
              </div>
            )}

            {/* Rejected Match Info */}
            {matchedTrip && ['rejected', 'quote_rejected'].includes(pkg.status) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="h-3 w-3 text-red-600" />
                  <span className="text-xs font-medium text-red-800">
                    {pkg.status === 'quote_rejected' ? 'Cotización rechazada' : 'Match roto'}
                  </span>
                </div>
                <div className="text-xs text-red-700 space-y-1">
                  <p>🛫 {matchedTrip.from_city} → {matchedTrip.to_city}</p>
                  <p>👤 Viajero: {matchedTrip.user_id}</p>
                  {pkg.rejectionReason && typeof pkg.rejectionReason === 'string' && (
                    <p className="font-medium">📝 Razón: {pkg.rejectionReason}</p>
                  )}
                  {pkg.rejectionReason && typeof pkg.rejectionReason === 'object' && pkg.rejectionReason.value && (
                    <p className="font-medium">📝 Razón: {pkg.rejectionReason.value}</p>
                  )}
                </div>
              </div>
            )}

            {/* Financial Info */}
            {pkg.quote && (
              <div className="flex items-center space-x-4 text-xs">
                <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                  💰 Cotización: Q{(parseFloat(pkg.quote.price || 0) + parseFloat(pkg.quote.serviceFee || 0)).toFixed(2)}
                </span>
              </div>
            )}

            {/* Important Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {pkg.delivery_deadline && (
                <div className="flex items-center space-x-1">
                  <CalendarDays className="h-3 w-3 text-orange-500" />
                  <span className="text-orange-600">
                    Límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
                  </span>
                </div>
              )}
              
              {matchedTrip?.delivery_date && (
                <div className="flex items-center space-x-1">
                  <CalendarDays className="h-3 w-3 text-purple-500" />
                  <span className="text-purple-600">
                    Entrega: {new Date(matchedTrip.delivery_date).toLocaleDateString('es-GT')}
                  </span>
                </div>
              )}
            </div>

            {/* Additional Actions */}
            <div className="flex space-x-2 pt-2 border-t">
              <Button size="sm" variant="outline" onClick={onViewDetail} className="flex-1">
                <Eye className="h-4 w-4 mr-1" />
                Ver Detalles
              </Button>

              <Button size="sm" variant="outline" onClick={onOpenChat} className="flex-1">
                <MessageCircle className="h-4 w-4 mr-1" />
                Ver Chat
              </Button>
              
              {showOfficeReceptionButton && (
                <Button size="sm" onClick={onConfirmOfficeReception} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirmar recepción
                </Button>
              )}

              {showAdminOfficeConfirmButton && (
                <Button 
                  size="sm" 
                  onClick={onAdminConfirmOfficeDelivery} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirmar recepción en oficina
                </Button>
              )}

              {showShopperReceivedButton && (
                <Button 
                  size="sm" 
                  onClick={onConfirmShopperReceived} 
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {getShopperReceivedButtonText()}
                </Button>
              )}

              {showCompleteButton && (
                <Button 
                  size="sm" 
                  onClick={onConfirmDeliveryComplete}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {getCompleteButtonText()}
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};