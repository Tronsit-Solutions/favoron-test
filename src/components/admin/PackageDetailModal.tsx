
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Package, ExternalLink, Calendar, DollarSign, CheckCircle, XCircle } from "lucide-react";
import PaymentReceiptViewer from "./PaymentReceiptViewer";
import PurchaseConfirmationViewer from "./PurchaseConfirmationViewer";
import TrackingInfoViewer from "./TrackingInfoViewer";
import { TravelerConfirmationDisplay } from "@/components/dashboard/TravelerConfirmationDisplay";
import RejectionReasonDisplay from "./RejectionReasonDisplay";

interface PackageDetailModalProps {
  package: any;
  trips: any[];
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const PackageDetailModal = ({ package: pkg, trips, isOpen, onClose, onApprove, onReject }: PackageDetailModalProps) => {
  if (!pkg) return null;

  // Find the matched trip if this package is matched
  const matchedTrip = pkg.matched_trip_id 
    ? trips.find(trip => trip.id === pkg.matched_trip_id)
    : null;

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente de Aprobación', variant: 'secondary' as const },
      'approved': { label: 'Aprobado', variant: 'default' as const },
      'matched': { label: 'Match realizado', variant: 'default' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
      'quote_sent': { label: 'Cotización enviada', variant: 'default' as const },
      'quote_rejected': { label: 'Cotización rechazada', variant: 'destructive' as const },
      'payment_pending': { label: 'Pago pendiente', variant: 'secondary' as const },
      'payment_pending_approval': { label: 'Pago pendiente de aprobación', variant: 'warning' as const },
      'payment_confirmed': { label: 'Pago confirmado', variant: 'default' as const },
      'in_transit': { label: 'En tránsito', variant: 'default' as const },
      'delivered_to_office': { label: 'Entregado en oficina', variant: 'default' as const },
      'out_for_delivery': { label: 'En reparto', variant: 'default' as const },
      'received_by_traveler': { label: 'Recibido por viajero', variant: 'default' as const },
      'completed': { label: 'Completado', variant: 'default' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Detalles de Solicitud #{pkg.id}</span>
          </DialogTitle>
          <DialogDescription>
            Información completa de la solicitud y del usuario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Estado actual:</span>
            {getStatusBadge(pkg.status)}
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Shopper Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <User className="h-4 w-4" />
                  <span>🛒 Información del Shopper</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Nombre</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.profiles ? `${pkg.profiles.first_name || ''} ${pkg.profiles.last_name || ''}`.trim() || pkg.profiles.username || 'Sin nombre' : 'Sin información'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Usuario</p>
                      <p className="text-sm text-muted-foreground">
                        @{pkg.profiles?.username || 'Sin usuario'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.profiles?.email || 'Sin email'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.profiles?.phone_number || 'Sin teléfono'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Usuario ID</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.user_id}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traveler Information */}
            {matchedTrip && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <User className="h-4 w-4" />
                    <span>✈️ Información del Viajero</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Nombre</p>
                        <p className="text-sm text-muted-foreground">
                          {matchedTrip.profiles ? `${matchedTrip.profiles.first_name || ''} ${matchedTrip.profiles.last_name || ''}`.trim() || matchedTrip.profiles.username || 'Sin nombre' : 'Sin información'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Usuario</p>
                        <p className="text-sm text-muted-foreground">
                          @{matchedTrip.profiles?.username || 'Sin usuario'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {matchedTrip.profiles?.email || 'Sin email'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Teléfono</p>
                        <p className="text-sm text-muted-foreground">
                          {matchedTrip.profiles?.phone_number || 'Sin teléfono'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Usuario ID</p>
                        <p className="text-sm text-muted-foreground">
                          {matchedTrip.user_id}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800 mb-2">📍 Información del Viaje:</p>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p><strong>Ruta:</strong> {matchedTrip.from_city} → {matchedTrip.to_city}</p>
                        <p><strong>Llegada:</strong> {new Date(matchedTrip.arrival_date).toLocaleDateString('es-GT')}</p>
                        <p><strong>Entrega:</strong> {new Date(matchedTrip.delivery_date).toLocaleDateString('es-GT')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Package Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Package className="h-4 w-4" />
                <span>
                  {pkg.products && pkg.products.length > 0 
                    ? `Productos Solicitados (${pkg.products.length})`
                    : 'Detalles del Artículo'
                  }
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Multiple products display */}
              {pkg.products && pkg.products.length > 0 ? (
                <div className="space-y-4">
                  {pkg.products.map((product: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-lg">Producto #{index + 1}</p>
                        <Badge variant="outline">${product.estimatedPrice}</Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Descripción:</p>
                        <p className="text-sm text-muted-foreground">{product.itemDescription}</p>
                      </div>

                      {product.itemLink && (
                        <div>
                          <p className="text-sm font-medium mb-1">Link del producto:</p>
                          <a 
                            href={product.itemLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-primary hover:underline text-sm"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Ver producto en línea</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Total price summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Estimado:</span>
                      <span className="text-lg font-bold text-blue-800">
                        ${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Single product display (backward compatibility)
                <div>
                  <div>
                    <p className="font-medium text-lg">{pkg.item_description}</p>
                    <p className="text-muted-foreground">Descripción del artículo solicitado</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Precio Estimado</p>
                        <p className="text-sm text-muted-foreground">${pkg.estimated_price}</p>
                      </div>
                    </div>
                  </div>

                  {pkg.item_link && (
                    <div>
                      <p className="text-sm font-medium mb-2">Link del Producto:</p>
                      <a 
                        href={pkg.item_link}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Ver producto en línea</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Additional package details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha Límite</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
                    </p>
                  </div>
                </div>

                {pkg.package_destination && (
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Destino</p>
                      <p className="text-sm text-muted-foreground">{pkg.package_destination}</p>
                    </div>
                  </div>
                )}

                {pkg.purchase_origin && (
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Origen de compra</p>
                      <p className="text-sm text-muted-foreground">{pkg.purchase_origin}</p>
                    </div>
                  </div>
                )}

                {pkg.delivery_method && (
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Método de entrega en Guatemala</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.delivery_method === 'pickup' ? '🏢 Recojo en zona 14' : '🚚 Envío a domicilio (+Q25)'}
                      </p>
                    </div>
                  </div>
                )}

                {pkg.delivery_method === 'delivery' && pkg.confirmed_delivery_address && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-sm font-medium text-blue-800 mb-2">📍 Dirección de entrega:</p>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Dirección:</strong> {pkg.confirmed_delivery_address.streetAddress}</p>
                      <p><strong>Ciudad/Municipio:</strong> {pkg.confirmed_delivery_address.cityArea}</p>
                      <p><strong>Teléfono:</strong> {pkg.confirmed_delivery_address.contactNumber}</p>
                      {pkg.confirmed_delivery_address.hotelAirbnbName && (
                        <p><strong>Edificio/Condominio:</strong> {pkg.confirmed_delivery_address.hotelAirbnbName}</p>
                      )}
                    </div>
                  </div>
                )}

                {pkg.delivery_method === 'delivery' && !pkg.confirmed_delivery_address && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                    <p className="text-sm font-medium text-amber-800">⚠️ Dirección de entrega no completada</p>
                    <p className="text-sm text-amber-700">El cliente seleccionó envío a domicilio pero no completó la información de dirección.</p>
                  </div>
                )}

                {/* Información de envío del viajero (guardada permanentemente) */}
                {pkg.traveler_address && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <p className="text-sm font-medium text-green-800 mb-2">📦 Información de envío del viajero:</p>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Destinatario:</strong> {pkg.traveler_address.recipientName || 'No especificado'}</p>
                      <p><strong>Dirección:</strong> {pkg.traveler_address.streetAddress}</p>
                      {pkg.traveler_address.streetAddress2 && (
                        <p><strong>Dirección 2:</strong> {pkg.traveler_address.streetAddress2}</p>
                      )}
                      <p><strong>Ciudad/Área:</strong> {pkg.traveler_address.cityArea}</p>
                      {pkg.traveler_address.postalCode && (
                        <p><strong>Código Postal:</strong> {pkg.traveler_address.postalCode}</p>
                      )}
                      <p><strong>Teléfono:</strong> {pkg.traveler_address.contactNumber}</p>
                      {pkg.traveler_address.hotelAirbnbName && pkg.traveler_address.hotelAirbnbName !== '-' && (
                        <p><strong>Hotel/Airbnb:</strong> {pkg.traveler_address.hotelAirbnbName}</p>
                      )}
                      <p><strong>Tipo de alojamiento:</strong> {pkg.traveler_address.accommodationType || 'No especificado'}</p>
                    </div>
                  </div>
                )}

                {/* Fechas importantes del viaje (guardadas permanentemente) */}
                {pkg.matched_trip_dates && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-sm font-medium text-blue-800 mb-2">📅 Fechas importantes del viaje:</p>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Primer día para recibir paquetes:</strong> {new Date(pkg.matched_trip_dates.first_day_packages).toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p><strong>Último día para recibir paquetes:</strong> {new Date(pkg.matched_trip_dates.last_day_packages).toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p><strong>Fecha de entrega en Guatemala:</strong> {new Date(pkg.matched_trip_dates.delivery_date).toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                )}
              </div>

              {pkg.additional_notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notas Adicionales:</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {pkg.additional_notes}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Solicitud creada el {new Date(pkg.created_at).toLocaleDateString('es-GT')} a las {new Date(pkg.created_at).toLocaleTimeString('es-GT')}
              </div>
            </CardContent>
          </Card>

          {/* Financial Information / Invoice Section */}
          {pkg.quote && pkg.quote.totalPrice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  <span>Desglose Financiero</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Total */}
                  <div className="flex justify-between items-center py-2 border-b bg-muted/20 px-3 rounded">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-lg">Q{parseFloat(pkg.quote.totalPrice).toFixed(2)}</span>
                  </div>
                  
                  {/* Desglose simple */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Viajero:</span>
                      <span>Q{parseFloat(pkg.quote.price || 0).toFixed(2)}</span>
                    </div>
                    
                    {pkg.quote.serviceFee && parseFloat(pkg.quote.serviceFee) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fee:</span>
                        <span>Q{parseFloat(pkg.quote.serviceFee).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Favorón:</span>
                      <span>Q{(
                        parseFloat(pkg.quote.totalPrice) - 
                        parseFloat(pkg.quote.price || 0) - 
                        parseFloat(pkg.quote.serviceFee || 0)
                      ).toFixed(2)}</span>
                    </div>
                    
                    {pkg.delivery_method === 'delivery' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Envío:</span>
                        <span>Q25.00</span>
                      </div>
                    )}
                  </div>
                  
                  {pkg.quote.message && (
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      <strong>Nota:</strong> {pkg.quote.message}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Package Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Calendar className="h-4 w-4" />
                <span>Hitos del Paquete</span>
              </CardTitle>
              <CardDescription>
                Seguimiento completo del estado del paquete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Package Created */}
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">📦 Paquete creado</p>
                      <p className="text-xs text-muted-foreground">Solicitud enviada por el shopper</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(pkg.created_at).toLocaleDateString('es-GT')} {new Date(pkg.created_at).toLocaleTimeString('es-GT')}
                    </p>
                  </div>
                </div>

                {/* Package Approved */}
                {['approved', 'matched', 'quote_sent', 'payment_pending', 'payment_confirmed', 'in_transit', 'delivered_to_office', 'received_by_traveler', 'out_for_delivery', 'completed'].includes(pkg.status) && (
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">✅ Paquete aprobado</p>
                        <p className="text-xs text-muted-foreground">Aprobado por el administrador</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(pkg.updated_at).toLocaleDateString('es-GT')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Match Made */}
                {pkg.matched_trip_id && (
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">🔗 Match realizado</p>
                        <p className="text-xs text-muted-foreground">Emparejado con viajero</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pkg.matched_trip_dates ? new Date(pkg.matched_trip_dates).toLocaleDateString('es-GT') : 'Completado'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quote Sent */}
                {['quote_sent', 'payment_pending', 'payment_confirmed', 'in_transit', 'delivered_to_office', 'received_by_traveler', 'out_for_delivery', 'completed'].includes(pkg.status) && (
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">💬 Cotización enviada</p>
                        <p className="text-xs text-muted-foreground">
                          {pkg.quote ? `Q${(parseFloat(pkg.quote.price || 0) + parseFloat(pkg.quote.serviceFee || 0)).toFixed(2)}` : 'Precio por definir'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pkg.quote ? 'Completado' : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Confirmed */}
                {['payment_confirmed', 'in_transit', 'delivered_to_office', 'received_by_traveler', 'out_for_delivery', 'completed'].includes(pkg.status) && (
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">💳 Pago confirmado</p>
                        <p className="text-xs text-muted-foreground">
                          {pkg.payment_receipt ? 'Recibo de pago verificado' : 'Pago procesado'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Verificado
                      </p>
                    </div>
                  </div>
                )}

                {/* In Transit */}
                {['in_transit', 'delivered_to_office', 'received_by_traveler', 'out_for_delivery', 'completed'].includes(pkg.status) && (
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">🚚 En tránsito</p>
                        <p className="text-xs text-muted-foreground">
                          {pkg.tracking_info ? 'Con información de seguimiento' : 'Producto enviado'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        En proceso
                      </p>
                    </div>
                  </div>
                )}

                {/* Delivered to Office */}
                {['delivered_to_office', 'received_by_traveler', 'out_for_delivery', 'completed'].includes(pkg.status) && (
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">🏢 Entregado en oficina</p>
                        <p className="text-xs text-muted-foreground">
                          {pkg.confirmed_delivery_address ? 'Preparado para entrega a domicilio' : 'Esperando recojo del shopper'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pkg.office_delivery ? new Date(pkg.office_delivery.timestamp || new Date()).toLocaleDateString('es-GT') : 'Completado'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Out for Delivery */}
                {['out_for_delivery', 'completed'].includes(pkg.status) && (
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">🚚 En reparto en {pkg.package_destination}</p>
                        <p className="text-xs text-muted-foreground">Entrega a domicilio en progreso</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        En camino
                      </p>
                    </div>
                  </div>
                )}

                {/* Received by Traveler */}
                {['received_by_traveler', 'completed'].includes(pkg.status) && (
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">👤 Recibido por viajero</p>
                        <p className="text-xs text-muted-foreground">
                          {pkg.traveler_confirmation ? 'Confirmado por el viajero' : 'Entregado al viajero'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Confirmado
                      </p>
                    </div>
                  </div>
                )}

                {/* Process Completed */}
                {pkg.status === 'completed' && (
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">🎉 Proceso completado</p>
                        <p className="text-xs text-muted-foreground">Paquete entregado exitosamente</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Finalizado
                      </p>
                    </div>
                  </div>
                )}

                {/* Current Status (if not completed) */}
                {!['completed', 'rejected', 'quote_rejected'].includes(pkg.status) && (
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full flex-shrink-0 animate-pulse"></div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-700">
                          {pkg.status === 'pending_approval' ? '⏳ Pendiente de aprobación' :
                           pkg.status === 'approved' ? '✅ Aprobado, buscando match' :
                           pkg.status === 'matched' ? '🔗 Match realizado, preparando cotización' :
                           pkg.status === 'quote_sent' ? '💬 Cotización enviada' :
                           pkg.status === 'payment_pending' ? '💳 Esperando pago' :
                           pkg.status === 'payment_confirmed' ? '✅ Pago confirmado' :
                           pkg.status === 'in_transit' ? '🚚 En tránsito' :
                           pkg.status === 'delivered_to_office' ? '🏢 En oficina' :
                           pkg.status === 'out_for_delivery' ? '🚚 En reparto' :
                           pkg.status === 'received_by_traveler' ? '👤 Con viajero' :
                           `Estado: ${pkg.status}`}
                        </p>
                        <p className="text-xs text-muted-foreground">Estado actual del paquete</p>
                      </div>
                      <p className="text-xs text-yellow-600">En progreso</p>
                    </div>
                  </div>
                )}

                {/* Rejected Status */}
                {['rejected', 'quote_rejected'].includes(pkg.status) && (
                  <div className="flex items-center space-x-4">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-700">
                          ❌ {pkg.status === 'quote_rejected' ? 'Cotización rechazada' : 'Solicitud rechazada'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pkg.rejectionReason && typeof pkg.rejectionReason === 'string' ? pkg.rejectionReason :
                           pkg.rejectionReason && typeof pkg.rejectionReason === 'object' && pkg.rejectionReason.value ? pkg.rejectionReason.value :
                           'Razón no especificada'}
                        </p>
                      </div>
                      <p className="text-xs text-red-600">Finalizado</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Receipt Section */}
          {pkg.payment_receipt && (
            <PaymentReceiptViewer 
              paymentReceipt={pkg.payment_receipt} 
              packageId={pkg.id}
              quote={pkg.quote}
              estimatedPrice={pkg.estimated_price}
            />
          )}

          {/* Purchase Confirmation Section */}
          {pkg.purchase_confirmation && (
            <PurchaseConfirmationViewer
              purchaseConfirmation={pkg.purchase_confirmation}
              packageId={pkg.id}
            />
          )}

          {/* Tracking Info Section */}
          {pkg.tracking_info && (
            <TrackingInfoViewer trackingInfo={pkg.tracking_info} />
          )}

          {/* Traveler Confirmation Section */}
          <TravelerConfirmationDisplay pkg={pkg} />

          {/* Rejection Information */}
          {['rejected', 'quote_rejected'].includes(pkg.status) && pkg.rejectionReason && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg text-red-700">
                  <XCircle className="h-4 w-4" />
                  <span>Información del Rechazo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    {pkg.status === 'quote_rejected' ? 'Razón del rechazo de cotización:' : 'Razón del rechazo por el shopper:'}
                  </p>
                  <p className="text-sm text-red-700">
                    {typeof pkg.rejectionReason === 'string' 
                      ? pkg.rejectionReason 
                      : pkg.rejectionReason?.value || 'No especificada'
                    }
                  </p>
                  <div className="text-xs text-red-600 mt-2">
                    Rechazado el {new Date(pkg.rejectedAt || pkg.updated_at).toLocaleDateString('es-GT')} a las {new Date(pkg.rejectedAt || pkg.updated_at).toLocaleTimeString('es-GT')}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Show rejection reason if package was rejected */}
          {['rejected', 'quote_rejected'].includes(pkg.status) && pkg.rejection_reason && (
            <RejectionReasonDisplay 
              rejectionReason={pkg.rejection_reason}
              wantsRequote={pkg.wants_requote}
              additionalComments={pkg.additional_notes}
              className="mb-4"
            />
          )}

          {/* Show rejection debug for any rejected package without structured reason */}
          {['rejected', 'quote_rejected'].includes(pkg.status) && !pkg.rejection_reason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Debug: Paquete rechazado sin razón estructurada</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Este paquete está marcado como rechazado pero no tiene rejection_reason estructurada.</p>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
                  Status: {pkg.status}
                  Rejection Reason: {pkg.rejection_reason || 'null'}
                  Wants Requote: {pkg.wants_requote || 'null'}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {pkg.status === 'pending_approval' && (
            <div className="flex space-x-2 pt-4 border-t">
              <Button 
                onClick={() => onApprove(pkg.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar Solicitud
              </Button>
              <Button 
                variant="destructive"
                onClick={() => onReject(pkg.id)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar Solicitud
              </Button>
            </div>
          )}

          {/* Approve Payment Button */}
          {pkg.status === 'payment_pending_approval' && pkg.payment_receipt && (
            <div className="flex space-x-2 pt-4 border-t">
              <Button 
                onClick={() => onApprove(pkg.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar Pago y Compartir Dirección
              </Button>
              <Button 
                variant="destructive"
                onClick={() => onReject(pkg.id)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar Pago
              </Button>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageDetailModal;
