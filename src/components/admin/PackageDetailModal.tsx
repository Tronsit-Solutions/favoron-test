
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Package, ExternalLink, Calendar, DollarSign, CheckCircle, XCircle } from "lucide-react";
import PaymentReceiptViewer from "./PaymentReceiptViewer";
import PurchaseConfirmationViewer from "./PurchaseConfirmationViewer";
import { TravelerConfirmationDisplay } from "@/components/dashboard/TravelerConfirmationDisplay";

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
                      <p className="text-sm text-muted-foreground">{pkg.user.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{pkg.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">{pkg.user.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Historial</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.user.totalRequests} solicitudes | {pkg.user.completedRequests} completadas
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
                          {matchedTrip.user?.name || `Viajero ${matchedTrip.user_id}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {matchedTrip.user?.email || `viajero${matchedTrip.user_id}@email.com`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Teléfono</p>
                        <p className="text-sm text-muted-foreground">
                          {matchedTrip.user?.phone || `+502 ${2000 + matchedTrip.user_id}-1234`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Historial</p>
                        <p className="text-sm text-muted-foreground">
                          {matchedTrip.user?.totalTrips || Math.floor(Math.random() * 8) + 1} viajes | 
                          {matchedTrip.user?.completedDeliveries || Math.floor(Math.random() * 15)} entregas
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
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <DollarSign className="h-4 w-4" />
                  <span>💰 Desglose Financiero</span>
                </CardTitle>
                <CardDescription>
                  Información tipo factura con el desglose de pagos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Total Amount Paid by Shopper */}
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">💳 Total pagado</span>
                      <span className="text-lg font-bold text-green-800">
                        Q{parseFloat(pkg.quote.totalPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-800 border-b pb-1">📊 Desglose:</h4>
                    
                    {/* Traveler Amount */}
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                      <span className="text-blue-800">✈️ Viajero</span>
                      <span className="font-medium text-blue-800">
                        Q{parseFloat(pkg.quote.price || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Service Fee */}
                    {pkg.quote.serviceFee && parseFloat(pkg.quote.serviceFee) > 0 && (
                      <div className="flex items-center justify-between p-2 bg-purple-50 rounded text-xs">
                        <span className="text-purple-800">🛡️ Fee Servicio</span>
                        <span className="font-medium text-purple-800">
                          Q{parseFloat(pkg.quote.serviceFee).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Favorón Commission */}
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded text-xs">
                      <span className="text-orange-800">🏢 Comisión Favorón</span>
                      <span className="font-medium text-orange-800">
                        Q{(
                          parseFloat(pkg.quote.totalPrice) - 
                          parseFloat(pkg.quote.price || 0) - 
                          parseFloat(pkg.quote.serviceFee || 0)
                        ).toFixed(2)}
                      </span>
                    </div>

                    {/* Shipping Fee (if delivery method is delivery) */}
                    {pkg.delivery_method === 'delivery' && (
                      <div className="flex items-center justify-between p-2 bg-yellow-50 rounded text-xs">
                        <span className="text-yellow-800">🚚 Envío</span>
                        <span className="font-medium text-yellow-800">Q25.00</span>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="pt-3 border-t">
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>💡 <strong>Nota:</strong> Los montos mostrados reflejan la distribución final del pago.</p>
                      <p>📅 <strong>Fecha de transacción:</strong> {pkg.payment_receipt ? 'Verificado' : new Date(pkg.updated_at).toLocaleDateString('es-GT')}</p>
                      {pkg.quote.message && (
                        <p>💬 <strong>Mensaje del viajero:</strong> {pkg.quote.message}</p>
                      )}
                    </div>
                  </div>
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
          
          {/* Show rejection debug for any rejected package */}
          {['rejected', 'quote_rejected'].includes(pkg.status) && !pkg.rejectionReason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Debug: Paquete rechazado sin razón</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Este paquete está marcado como rechazado pero no tiene rejectionReason.</p>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
                  {JSON.stringify(pkg, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {pkg.status === 'pending_approval' && (
            <div className="flex space-x-2 pt-4 border-t">
              <Button 
                onClick={() => onApprove(pkg.id)}
                className="flex-1"
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

          {/* Compact Tracking Information - Bottom Section */}
          {pkg.tracking_info && (
            <div className="border-t pt-4">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground mb-2">
                  📦 Información de seguimiento
                </summary>
                <div className="space-y-2 text-sm">
                  {/* Tracking Number */}
                  {pkg.tracking_info.trackingNumber && (
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-xs font-medium">Número de seguimiento:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono">{pkg.tracking_info.trackingNumber}</span>
                        {pkg.tracking_info.trackingUrl && (
                          <a 
                            href={pkg.tracking_info.trackingUrl}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Basic info in compact format */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {pkg.tracking_info.shippingCompany && (
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Empresa:</span>
                        <span>{pkg.tracking_info.shippingCompany}</span>
                      </div>
                    )}
                    {pkg.tracking_info.currentStatus && (
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Estado:</span>
                        <span>{pkg.tracking_info.currentStatus}</span>
                      </div>
                    )}
                    {pkg.tracking_info.currentLocation && (
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Ubicación:</span>
                        <span>{pkg.tracking_info.currentLocation}</span>
                      </div>
                    )}
                    {pkg.tracking_info.estimatedDelivery && (
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Entrega:</span>
                        <span>{new Date(pkg.tracking_info.estimatedDelivery).toLocaleDateString('es-GT')}</span>
                      </div>
                    )}
                  </div>

                  {/* Compact tracking history */}
                  {pkg.tracking_info.trackingHistory && pkg.tracking_info.trackingHistory.length > 0 && (
                    <div className="border-t pt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Historial:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {pkg.tracking_info.trackingHistory.slice(0, 3).map((event: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-xs p-1 bg-gray-50 rounded">
                            <span>{event.status || event.description}</span>
                            <span className="text-muted-foreground">
                              {new Date(event.timestamp || event.date).toLocaleDateString('es-GT')}
                            </span>
                          </div>
                        ))}
                        {pkg.tracking_info.trackingHistory.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            ... y {pkg.tracking_info.trackingHistory.length - 3} eventos más
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* No tracking info - compact message */}
          {!pkg.tracking_info && ['in_transit', 'delivered_to_office', 'received_by_traveler', 'out_for_delivery', 'completed'].includes(pkg.status) && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground text-center">
                📦 No hay información de seguimiento disponible
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageDetailModal;
