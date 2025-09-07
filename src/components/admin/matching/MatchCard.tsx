
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { 
  Eye, 
  CalendarDays, 
  Link as LinkIcon, 
  CheckCircle, 
  XCircle, 
  MessageCircle, 
  ChevronDown, 
  ChevronRight,
  Settings
} from "lucide-react";
import { MatchStatusBadge, getStatusInfo } from "./MatchStatusBadge";
import QuoteCountdown from "../../dashboard/QuoteCountdown";
import { useIsMobile } from "@/hooks/use-mobile";

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
  onOpenActionsModal?: (packageId: string) => void;
  unreadCount?: number;
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
  onConfirmShopperReceived,
  onOpenActionsModal,
  unreadCount = 0
}: MatchCardProps) => {
  const isMobile = useIsMobile();
  const statusInfo = getStatusInfo(pkg.status);
  const showCompleteButton = ['delivered_to_office', 'out_for_delivery'].includes(pkg.status);
  const showOfficeReceptionButton = pkg.status === 'received_by_traveler';
  const showAdminOfficeConfirmButton = pkg.status === 'pending_office_confirmation' && !!pkg.office_delivery?.traveler_declaration;
  const showShopperReceivedButton = pkg.status === 'ready_for_pickup' || pkg.status === 'ready_for_delivery';

  // Check if we should show timers - including payment_pending
  const showQuoteTimer = (['quote_sent', 'payment_pending'].includes(pkg.status)) && pkg.quote_expires_at;
  const showAssignmentTimer = pkg.status === 'matched' && pkg.matched_assignment_expires_at;

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
        ? 'Confirmar entrega' 
        : 'Confirmar pick-up';
    }
    return 'Confirmar entrega';
  };

  const getShopperReceivedButtonText = () => {
    if (pkg.delivery_method === 'pickup') {
      return 'Confirmar pick-up';
    } else {
      return 'Confirmar entrega';
    }
  };

  const getTravelerName = () => {
    if (matchedTrip?.public_profiles?.first_name || matchedTrip?.public_profiles?.last_name) {
      return `${matchedTrip.public_profiles.first_name || ''} ${matchedTrip.public_profiles.last_name || ''}`.trim();
    }
    return matchedTrip?.public_profiles?.username || `Usuario ${matchedTrip?.user_id || 'N/A'}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CardContent className="p-4">
          {/* Header */}
          <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
            <div className={`cursor-pointer ${isMobile ? "space-y-2" : "flex-1 min-w-0"}`} onClick={onToggle}>
              <div className={`flex items-center ${isMobile ? "space-x-2" : "space-x-2 mb-1"}`}>
                <div className="flex items-center">
                  {isExpanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </div>
                <h4 className={`font-medium truncate ${isMobile ? "text-base" : "text-sm"}`}>{pkg.item_description}</h4>
                <MatchStatusBadge status={pkg.status} />
              </div>
              
              {/* Mobile: Stack info vertically */}
              {isMobile ? (
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span>🛍️ {pkg.profiles?.first_name} {pkg.profiles?.last_name}</span>
                  </div>
                  {matchedTrip && (
                    <div className="flex items-center space-x-2">
                      <span>🤝 {getTravelerName()} ✈️</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary text-base">${pkg.estimated_price}</span>
                    <span>📅 {new Date(pkg.updated_at).toLocaleDateString('es-GT')}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  <span>
                    🛍️ {pkg.profiles?.first_name} {pkg.profiles?.last_name} 
                    {matchedTrip && (
                      <>
                        {' '} 🤝 {getTravelerName()} ✈️
                      </>
                    )}
                  </span>
                  <span className="font-medium text-primary">${pkg.estimated_price}</span>
                  <span>📅 {new Date(pkg.updated_at).toLocaleDateString('es-GT')}</span>
                </div>
              )}
            </div>
            
            {/* Timers in mobile - expanded view */}
            {isMobile && (showQuoteTimer || showAssignmentTimer) && (
              <div className="space-y-2">
                {showQuoteTimer && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-1 md:p-2">
                    <span className="text-sm text-orange-700 font-medium block mb-1">Tiempo para pago</span>
                    <QuoteCountdown 
                      expiresAt={pkg.quote_expires_at} 
                      compact={false}
                    />
                  </div>
                )}
                
                {showAssignmentTimer && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <span className="text-sm text-blue-700 font-medium block mb-1">Tiempo para aceptar</span>
                    <QuoteCountdown 
                      expiresAt={pkg.matched_assignment_expires_at} 
                      compact={false}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Quick Actions */}
            <div className={isMobile ? "space-y-2" : "flex items-center space-x-1 ml-4"}>
              {/* Desktop: Micro timers next to buttons */}
              {!isMobile && showQuoteTimer && (
                <div className="flex flex-col items-end space-y-1">
                  <span className="text-xs text-orange-700 font-medium">Pago</span>
                  <QuoteCountdown 
                    expiresAt={pkg.quote_expires_at} 
                    micro={true}
                  />
                </div>
              )}
              
              {!isMobile && showAssignmentTimer && (
                <div className="flex flex-col items-end space-y-1">
                  <span className="text-xs text-blue-700 font-medium">Aceptar</span>
                  <QuoteCountdown 
                    expiresAt={pkg.matched_assignment_expires_at} 
                    micro={true}
                  />
                </div>
              )}

              {/* Mobile: Large buttons in rows */}
              {isMobile ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={onViewDetail} 
                      className="min-h-[44px] text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalles
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={onOpenChat} 
                      className="min-h-[44px] text-sm relative"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                      {unreadCount > 0 && (
                        <NotificationBadge 
                          count={unreadCount} 
                          className="absolute -top-1 -right-1" 
                        />
                      )}
                    </Button>
                    {onOpenActionsModal && (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => onOpenActionsModal(pkg.id)} 
                        className="min-h-[44px] text-sm"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Acciones
                      </Button>
                    )}
                  </div>
                  
                  {showCompleteButton && (
                    <Button 
                      size="sm" 
                      onClick={onConfirmDeliveryComplete}
                      className="w-full min-h-[44px] bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                      title="Confirmar entrega completada"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      COMPLETAR ENTREGA
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={onViewDetail} className="px-2">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={onOpenChat} className="px-2 relative">
                    <MessageCircle className="h-3 w-3" />
                    {unreadCount > 0 && (
                      <NotificationBadge 
                        count={unreadCount} 
                        className="absolute -top-1 -right-1" 
                      />
                    )}
                  </Button>
                  {onOpenActionsModal && (
                    <Button size="sm" variant="secondary" onClick={() => onOpenActionsModal(pkg.id)} className="px-2" title="Acciones administrativas">
                      <Settings className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {showCompleteButton && (
                    <Button 
                      size="sm" 
                      onClick={onConfirmDeliveryComplete}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium"
                      title="Confirmar entrega completada"
                    >
                      COMPLETAR
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Detailed Information */}
          <CollapsibleContent className="space-y-3 mt-4">
            {/* Current Status */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Estado Actual</span>
                <span className="text-xs text-gray-500 font-mono">
                  ID: {pkg.id}
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

            {/* Show compact timer details in expanded view */}
            {isExpanded && (showQuoteTimer || showAssignmentTimer) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <CalendarDays className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-800">Timers</span>
                </div>
                
                <div className="space-y-1">
                  {showQuoteTimer && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-700">Cotización:</span>
                      <QuoteCountdown 
                        expiresAt={pkg.quote_expires_at}
                        compact={true}
                      />
                    </div>
                  )}
                  
                  {showAssignmentTimer && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-700">Asignación:</span>
                      <QuoteCountdown 
                        expiresAt={pkg.matched_assignment_expires_at}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Match Info */}
            {matchedTrip && !['rejected', 'quote_rejected'].includes(pkg.status) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <LinkIcon className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">Match activo</span>
                </div>
                <div className="text-xs text-blue-700">
                  <p>🛫 {matchedTrip.from_city} → {matchedTrip.to_city}</p>
                  <p>👤 Viajero: {getTravelerName()}</p>
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
                  <p>👤 Viajero: {getTravelerName()}</p>
                  {pkg.rejectionReason && typeof pkg.rejectionReason === 'string' && (
                    <p className="font-medium">📝 Razón: {pkg.rejectionReason}</p>
                  )}
                  {pkg.rejectionReason && typeof pkg.rejectionReason === 'object' && pkg.rejectionReason.value && (
                    <p className="font-medium">📝 Razón: {pkg.rejectionReason.value}</p>
                  )}
                </div>
              </div>
            )}

            {/* Financial Info & Important Dates */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {pkg.quote && (
                <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                  💰 Cotización: Q{(parseFloat(pkg.quote.price || 0) + parseFloat(pkg.quote.serviceFee || 0)).toFixed(2)}
                </span>
              )}
              
              {pkg.delivery_deadline && (
                <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
                </span>
              )}
              
              {matchedTrip?.delivery_date && (
                <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Entrega: {new Date(matchedTrip.delivery_date).toLocaleDateString('es-GT')}
                </span>
              )}
            </div>

            {/* Additional Actions */}
            <div className={`pt-2 border-t ${isMobile ? "space-y-2" : "flex space-x-2"}`}>
              {isMobile ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={onViewDetail} 
                      className="min-h-[44px] text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={onOpenChat} 
                      className="min-h-[44px] text-sm"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Ver Chat
                    </Button>
                  </div>
                  
                  {showOfficeReceptionButton && (
                    <Button 
                      size="sm" 
                      onClick={onConfirmOfficeReception} 
                      className="w-full min-h-[44px] text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirmar recepción
                    </Button>
                  )}

                  {showAdminOfficeConfirmButton && (
                    <Button 
                      size="sm" 
                      onClick={onAdminConfirmOfficeDelivery} 
                      className="w-full min-h-[44px] bg-green-600 hover:bg-green-700 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirmar recepción en oficina
                    </Button>
                  )}

                  {showShopperReceivedButton && (
                    <Button 
                      size="sm" 
                      onClick={onConfirmShopperReceived} 
                      className="w-full min-h-[44px] bg-green-700 hover:bg-green-800 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {getShopperReceivedButtonText()}
                    </Button>
                  )}

                  {showCompleteButton && (
                    <Button 
                      size="sm" 
                      onClick={onConfirmDeliveryComplete}
                      className="w-full min-h-[44px] bg-green-600 hover:bg-green-700 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {getCompleteButtonText()}
                    </Button>
                  )}
                </div>
              ) : (
                <>
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
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirmar recepción en oficina
                    </Button>
                  )}

                  {showShopperReceivedButton && (
                    <Button 
                      size="sm" 
                      onClick={onConfirmShopperReceived} 
                      className="flex-1 bg-green-700 hover:bg-green-800"
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
                </>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
