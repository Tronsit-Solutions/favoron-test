
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, User, Package, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PurchaseConfirmationViewer from "@/components/admin/PurchaseConfirmationViewer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { normalizeConfirmations } from "@/utils/confirmationHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TravelerPackageCardProps {
  pkg: any;
  getStatusBadge: (status: string, packageDestination?: string) => JSX.Element;
  onQuote: (pkg: any, userType: 'traveler' | 'shopper') => void;
}

const TravelerPackageCard = ({ 
  pkg, 
  getStatusBadge, 
  onQuote
}: TravelerPackageCardProps) => {
  const [dismissing, setDismissing] = useState(false);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  const handleDismiss = async () => {
    if (!pkg._assignmentId) return;
    setDismissing(true);
    try {
      const { error } = await supabase
        .from('package_assignments')
        .update({ dismissed_by_traveler: true } as any)
        .eq('id', pkg._assignmentId);
      if (error) throw error;
      toast({ title: "Asignación descartada", description: "Ya no verás este pedido en tu dashboard." });
      setDismissed(true);
    } catch (err) {
      toast({ title: "Error", description: "No se pudo descartar", variant: "destructive" });
    } finally {
      setDismissing(false);
      setShowDismissConfirm(false);
    }
  };

  if (dismissed) return null;
  return (
    <>
    <Card key={pkg.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <span>
                {pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0
                  ? `${pkg.products_data.length > 1 ? `${pkg.products_data.length} productos` : pkg.products_data[0].itemDescription}`
                  : pkg.products && pkg.products.length > 0 
                    ? `${pkg.products.length > 1 ? `${pkg.products.length} productos` : pkg.products[0].itemDescription}`
                    : pkg.itemDescription || pkg.item_description || 'Pedido'
                }
              </span>
            </CardTitle>
            <CardDescription>
              {pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0 ? (
                <>
                  Total estimado: ${pkg.products_data.reduce((sum: number, product: any) => sum + parseFloat(product.estimatedPrice || 0), 0).toFixed(2)}
                  {pkg.products_data.some((p: any) => p.quantity && p.quantity !== '1') && (
                    <> • Cantidades: {pkg.products_data.map((p: any) => p.quantity || '1').join(', ')}</>
                  )}
                  {pkg.delivery_deadline && (
                    <> • Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}</>
                  )}
                </>
              ) : pkg.products && pkg.products.length > 0 ? (
                <>
                  Total estimado: ${pkg.products.reduce((sum: number, product: any) => sum + parseFloat(product.estimatedPrice || 0), 0).toFixed(2)}
                  {pkg.delivery_deadline && (
                    <> • Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}</>
                  )}
                </>
              ) : (
                <>
                  Precio estimado: ${pkg.estimatedPrice || pkg.estimated_price}
                  {pkg.delivery_deadline && (
                    <> • Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}</>
                  )}
                </>
              )}
            </CardDescription>
          </div>
          {['bid_expired', 'bid_lost', 'bid_cancelled'].includes(pkg._assignmentStatus) ? (
            pkg._assignmentStatus === 'bid_expired' ? (
              <Badge variant="warning">⏰ Expirado</Badge>
            ) : pkg._assignmentStatus === 'bid_lost' ? (
              <Badge variant="destructive">❌ No seleccionado</Badge>
            ) : (
              <Badge variant="muted">Cancelado</Badge>
            )
          ) : getStatusBadge(pkg.status, pkg.package_destination)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Package details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2 mb-2">
              <Package className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-sm font-medium text-blue-800">Detalles del pedido:</p>
            </div>
            <div className="text-sm text-blue-700 ml-6 space-y-3">
              <div>
                <p><strong>Origen:</strong> {pkg.purchaseOrigin}</p>
                <p><strong>Destino:</strong> {pkg.packageDestination}</p>
              </div>
              
              {/* Display all products */}
              <div className="space-y-2">
                <p className="font-medium">Productos solicitados:</p>
                {pkg.products ? (
                  pkg.products.map((product: any, index: number) => (
                    <div key={index} className="bg-white/50 border border-blue-100 rounded p-2 space-y-1">
                      <p><strong>Producto {index + 1}:</strong> {product.itemDescription}</p>
                      <p><strong>Precio estimado:</strong> ${product.estimatedPrice}</p>
                      <p><strong>Link:</strong> <a href={product.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">Ver producto</a></p>
                    </div>
                  ))
                ) : (
                  // Fallback for old single-product format
                  <div className="bg-white/50 border border-blue-100 rounded p-2 space-y-1">
                    <p><strong>Producto:</strong> {pkg.itemDescription}</p>
                    <p><strong>Precio estimado:</strong> ${pkg.estimatedPrice}</p>
                    {pkg.itemLink && (
                      <p><strong>Link:</strong> <a href={pkg.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">Ver producto</a></p>
                    )}
                  </div>
                )}
              </div>

              {pkg.additionalNotes && (
                <div>
                  <p><strong>Notas adicionales:</strong> {pkg.additionalNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shopper information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start space-x-2 mb-2">
              <User className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-sm font-medium text-green-800">Información del shopper:</p>
            </div>
            <div className="text-sm text-green-700 ml-6">
              <p>Solicitante: Usuario #{pkg.userId}</p>
              <p>Creado el: {new Date(pkg.createdAt).toLocaleDateString('es-GT')}</p>
            </div>
          </div>

          {/* Show quote information if sent */}
          {pkg.quote && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800 mb-1">Tu cotización enviada:</p>
              <p className="text-sm font-bold text-yellow-800 text-lg">
                Total para el shopper: Q{parseFloat(pkg.quote.totalPrice || 0).toFixed(2)}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Este precio ya incluye todo: servicio Favorón + seguro + compensación al viajero.
              </p>
              {pkg.quote.message && (
                <p className="text-sm text-yellow-600 mt-2">Mensaje: "{pkg.quote.message}"</p>
              )}
              <p className="text-xs text-yellow-600 mt-2">
                Estado: {pkg.status === 'quote_accepted' ? 'Aceptada ✅' : 'Esperando respuesta ⏳'}
              </p>
            </div>
          )}

          {/* Purchase confirmation */}
          {(() => {
            const confs = normalizeConfirmations(pkg.purchase_confirmation);
            return confs.length > 0 && (
              <div className="mb-4 space-y-2">
                {confs.map((conf, index) => (
                  <PurchaseConfirmationViewer 
                    key={index}
                    purchaseConfirmation={conf} 
                    packageId={pkg.id}
                  />
                ))}
              </div>
            );
          })()}

          {/* Delivery address if confirmed */}
          {pkg.confirmedDeliveryAddress && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-start space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-purple-600 mt-0.5" />
                <p className="text-sm font-medium text-purple-800">Dirección de entrega confirmada:</p>
              </div>
              <div className="text-sm text-purple-700 ml-6">
                <p>{pkg.confirmedDeliveryAddress.streetAddress}</p>
                <p>{pkg.confirmedDeliveryAddress.cityArea}</p>
                {pkg.confirmedDeliveryAddress.hotelAirbnbName && (
                  <p>{pkg.confirmedDeliveryAddress.hotelAirbnbName}</p>
                )}
                <p>📞 {pkg.confirmedDeliveryAddress.contactNumber}</p>
              </div>
            </div>
          )}

          {/* Action buttons / status for travelers */}
          <div className="flex flex-wrap gap-2">
            {(pkg.status === 'matched' || ['bid_lost', 'bid_expired', 'bid_cancelled'].includes(pkg._assignmentStatus)) && (
              <>
                {pkg._assignmentStatus === 'bid_submitted' ? (
                  <div className="w-full bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800">✅ Cotización enviada</p>
                    {pkg._assignmentQuote && (
                      <p className="text-sm text-green-700 mt-1">
                        Total cotizado: Q{parseFloat(pkg._assignmentQuote.totalPrice || 0).toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-green-600 mt-1">
                      Esperando que el shopper seleccione un viajero
                    </p>
                  </div>
                ) : pkg._assignmentStatus === 'bid_won' ? (
                  <div className="w-full bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800">🎉 ¡El shopper te eligió!</p>
                    <p className="text-xs text-green-600 mt-1">
                      Esperando confirmación de pago del shopper
                    </p>
                  </div>
                ) : pkg._assignmentStatus === 'bid_lost' ? (
                  <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-800">❌ Otro viajero fue seleccionado</p>
                    <p className="text-xs text-red-600 mt-1">
                      El shopper eligió a otro viajero para este pedido
                    </p>
                    <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setShowDismissConfirm(true)} disabled={dismissing}>
                      <X className="h-3 w-3 mr-1" />
                      {dismissing ? 'Descartando...' : 'Descartar de mi dashboard'}
                    </Button>
                  </div>
                ) : pkg._assignmentStatus === 'bid_expired' ? (
                  <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800">⏰ Asignación expirada</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      El tiempo para esta asignación venció
                    </p>
                    <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setShowDismissConfirm(true)} disabled={dismissing}>
                      <X className="h-3 w-3 mr-1" />
                      {dismissing ? 'Descartando...' : 'Descartar de mi dashboard'}
                    </Button>
                  </div>
                ) : pkg._assignmentStatus === 'bid_cancelled' ? (
                  <div className="w-full bg-muted border border-border rounded-lg p-3">
                    <p className="text-sm font-medium text-muted-foreground">Asignación cancelada</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Esta asignación fue cancelada
                    </p>
                    <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setShowDismissConfirm(true)} disabled={dismissing}>
                      <X className="h-3 w-3 mr-1" />
                      {dismissing ? 'Descartando...' : 'Descartar de mi dashboard'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      let totalTip = 0;
                      if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
                        totalTip = pkg.products_data
                          .filter((product: any) => !product.cancelled)
                          .reduce((sum: number, product: any) => {
                            return sum + parseFloat(product.adminAssignedTip || '0');
                          }, 0);
                      } else {
                        totalTip = parseFloat(pkg.admin_assigned_tip || '0');
                      }
                      return totalTip > 0 
                        ? `Tip asignado por admin: Q${totalTip.toFixed(2)}` 
                        : 'Esperando tip asignado por admin';
                    })()}
                  </div>
                )}
              </>
            )}

            {pkg.status === 'quote_sent' && (
              <div className="text-sm text-muted-foreground">
                Cotización enviada - Esperando respuesta del shopper
              </div>
            )}

            {pkg.status === 'quote_accepted' && (
              <div className="text-sm text-green-600 font-medium">
                ✅ Cotización aceptada - Esperando confirmación de dirección
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    <AlertDialog open={showDismissConfirm} onOpenChange={setShowDismissConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Descartar este paquete?</AlertDialogTitle>
          <AlertDialogDescription>
            Ya no verás este pedido en tu dashboard. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDismiss} 
            disabled={dismissing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {dismissing ? 'Descartando...' : 'Descartar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default TravelerPackageCard;
