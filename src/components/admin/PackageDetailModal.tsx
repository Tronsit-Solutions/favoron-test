import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Phone, Package, ExternalLink, Calendar, DollarSign, CheckCircle, XCircle, FileText, Receipt, Truck, Home, MapPin, Camera, CheckCircle2, Edit2, Save, X, Star } from "lucide-react";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import PaymentReceiptViewer from "./PaymentReceiptViewer";
import PurchaseConfirmationViewer from "./PurchaseConfirmationViewer";
import TrackingInfoViewer from "./TrackingInfoViewer";
import { TravelerConfirmationDisplay } from "@/components/dashboard/TravelerConfirmationDisplay";
import RejectionReasonDisplay from "./RejectionReasonDisplay";
import RejectionReasonModal from "./RejectionReasonModal";
import { useModalState } from "@/contexts/ModalStateContext";
import { useAuth } from "@/hooks/useAuth";
import { useSignedUrl } from "@/hooks/useSignedUrl";
interface PackageDetailModalProps {
  modalId: string;
  trips: any[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onUpdatePackage?: (id: string, updates: any) => void;
}

const PackageDetailModal = ({ modalId, trips, onApprove, onReject, onUpdatePackage }: PackageDetailModalProps) => {
  const { isModalOpen, closeModal, getModalData } = useModalState();
  const { user, userRole } = useAuth();
  const pkg = getModalData(modalId);
  const isOpen = isModalOpen(modalId);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{url: string, title: string, filename: string} | null>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    item_description: '',
    item_link: '',
    estimated_price: '',
    additional_notes: '',
    purchase_origin: '',
    package_destination: ''
  });

  // Resolve traveler confirmation photo (handles storage paths and signed URLs)
  // Must call this hook before any early returns to follow Rules of Hooks
  const rawTravelerPhoto = pkg?.traveler_confirmation?.photo || pkg?.traveler_confirmation?.photoUrl;
  const { url: resolvedTravelerPhotoUrl } = useSignedUrl(rawTravelerPhoto);

  // Initialize edit form when package data changes
  useEffect(() => {
    if (pkg) {
      setEditForm({
        item_description: pkg.item_description || '',
        item_link: pkg.item_link || '',
        estimated_price: pkg.estimated_price?.toString() || '',
        additional_notes: pkg.additional_notes || '',
        purchase_origin: pkg.purchase_origin || '',
        package_destination: pkg.package_destination || ''
      });
    }
  }, [pkg]);

  // Security: Only allow admin access
  if (!user || userRole?.role !== 'admin') {
    console.warn('🔒 Unauthorized access to PackageDetailModal:', { 
      userId: user?.id, 
      role: userRole?.role 
    });
    return null;
  }

  console.log('PackageDetailModal render:', { pkg, trips, isOpen, modalId });
  console.log('🛒 Shopper profile data:', pkg?.profiles);

  if (!pkg) {
    console.log('No package provided to PackageDetailModal');
    return null;
  }

  // Safe date formatting function
  const formatSafeDate = (dateValue: any): string => {
    if (!dateValue) return 'No especificada';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-GT');
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return 'Error en fecha';
    }
  };

  const formatSafeDateTime = (dateValue: any): string => {
    if (!dateValue) return 'No especificada';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return `${date.toLocaleDateString('es-GT')} a las ${date.toLocaleTimeString('es-GT')}`;
    } catch (error) {
      console.error('Error formatting datetime:', error, dateValue);
      return 'Error en fecha';
    }
  };

  // Handle approve action with modal closure
  const handleApprove = async (id: string) => {
    await onApprove(id);
    closeModal(modalId);
  };

  // Handle reject action with reason
  const handleReject = (reason: string) => {
    onReject(pkg.id, reason);
    closeModal(modalId);
  };

  // Open rejection modal
  const handleRejectClick = () => {
    setRejectionModalOpen(true);
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (editMode) {
      // Reset form to current package data when canceling
      setEditForm({
        item_description: pkg.item_description || '',
        item_link: pkg.item_link || '',
        estimated_price: pkg.estimated_price?.toString() || '',
        additional_notes: pkg.additional_notes || '',
        purchase_origin: pkg.purchase_origin || '',
        package_destination: pkg.package_destination || ''
      });
    }
    setEditMode(!editMode);
  };

  // Handle save changes
  const handleSaveChanges = () => {
    if (onUpdatePackage) {
      // Sync edits to products_data for consistent UI (both single and multiple products)
      let products_data: any | undefined = undefined;
      
      if (Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
        if (pkg.products_data.length === 1) {
          // Single product: sync all fields including additional_notes
          const p0 = pkg.products_data[0] || {};
          products_data = [
            {
              ...p0,
              itemDescription: editForm.item_description || p0.itemDescription,
              itemLink: editForm.item_link || p0.itemLink || null,
              estimatedPrice: editForm.estimated_price || p0.estimatedPrice,
              quantity: p0.quantity || '1',
              additionalNotes: editForm.additional_notes || p0.additionalNotes || null,
            },
          ];
        } else {
          // Multiple products: sync additional_notes to all products
          products_data = pkg.products_data.map((product: any) => ({
            ...product,
            additionalNotes: editForm.additional_notes || product.additionalNotes || null,
          }));
        }
      }

      const updates = {
        item_description: editForm.item_description,
        item_link: editForm.item_link || null,
        estimated_price: parseFloat(editForm.estimated_price) || null,
        additional_notes: editForm.additional_notes || null,
        purchase_origin: editForm.purchase_origin,
        package_destination: editForm.package_destination,
        ...(products_data ? { products_data } : {}),
      };
      onUpdatePackage(pkg.id, updates);
    }
    setEditMode(false);
    // Close to reflect latest data from list
    closeModal(modalId);
  };

  // Handle form field changes
  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Centralized rejection reason translation function
  const translateRejectionReason = (reason: any): string => {
    if (!reason) return 'Razón no especificada';
    
    const reasonText = typeof reason === 'string' ? reason : reason?.value;
    if (!reasonText) return 'Razón no especificada';
    
    // First check if it's a known enum key from constants
    const REJECTION_REASONS = {
      no_longer_want: 'Ya no quiero el paquete',
      too_expensive: 'La cotización fue muy cara',
      wrong_delivery_time: 'El tiempo de entrega no es el que quería',
      other: 'Otra razón'
    };
    
    if (REJECTION_REASONS[reasonText as keyof typeof REJECTION_REASONS]) {
      return REJECTION_REASONS[reasonText as keyof typeof REJECTION_REASONS];
    }
    
    // Then translate common English rejection reasons
    const translations: Record<string, string> = {
      'Product not available': 'Producto no disponible',
      'Price too high': 'Precio muy alto',
      'Delivery time too long': 'Tiempo de entrega muy largo',
      'Cannot deliver to location': 'No se puede entregar en esa ubicación',
      'Product restrictions': 'Restricciones del producto',
      'Size/weight limitations': 'Limitaciones de tamaño/peso',
      'Other': 'Otro',
      'Item unavailable': 'Artículo no disponible',
      'Too expensive': 'Muy caro',
      'Wrong size': 'Tamaño incorrecto',
      'Wrong color': 'Color incorrecto',
      'Shipping restrictions': 'Restricciones de envío',
      'Quality issues': 'Problemas de calidad',
      'Changed mind': 'Cambié de opinión'
    };
    
    return translations[reasonText] || reasonText;
  };

  // Get traveler information from trips_with_user data passed via trips prop
  const matchedTrip = trips?.find(trip => trip.id === pkg.matched_trip_id) || null;

  console.log('Matched trip found:', matchedTrip);
  console.log('📅 Delivery date from trips:', matchedTrip?.delivery_date);

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

  // Check which documents exist
  const hasPaymentReceipt = pkg.payment_receipt && (pkg.payment_receipt.receipt_url || pkg.payment_receipt.filePath);
  const hasPurchaseConfirmation = pkg.purchase_confirmation && (pkg.purchase_confirmation.receipt_url || pkg.purchase_confirmation.filePath || pkg.purchase_confirmation.filename);
  const hasTrackingInfo = pkg.tracking_info && (pkg.tracking_info.tracking_number || pkg.tracking_info.trackingNumber);
  const hasTravelerConfirmation = pkg.traveler_confirmation && (pkg.traveler_confirmation.confirmedAt || pkg.traveler_confirmation.confirmed_at);
  const hasAnyDocuments = hasPaymentReceipt || hasPurchaseConfirmation || hasTrackingInfo;
  
  // Enhanced product information processing
  const getDetailedProductInfo = () => {
    if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
      return pkg.products_data.map((product: any, index: number) => ({
        id: index + 1,
        description: product.itemDescription || 'Sin descripción',
        price: parseFloat(product.estimatedPrice || '0'),
        quantity: parseInt(product.quantity || '1'),
        link: product.itemLink,
        adminTip: product.adminAssignedTip ? parseFloat(product.adminAssignedTip) : 0,
        subtotal: parseFloat(product.estimatedPrice || '0') * parseInt(product.quantity || '1')
      }));
    } else {
      // Legacy single product format
      return [{
        id: 1,
        description: pkg.item_description || 'Sin descripción',
        price: parseFloat(pkg.estimated_price?.toString() || '0'),
        quantity: 1,
        link: pkg.item_link,
        adminTip: pkg.admin_assigned_tip ? parseFloat(pkg.admin_assigned_tip.toString()) : 0,
        subtotal: parseFloat(pkg.estimated_price?.toString() || '0')
      }];
    }
  };

  const detailedProducts = getDetailedProductInfo();
  const totalOrderValue = detailedProducts.reduce((sum, product) => sum + product.subtotal, 0);
  const totalAdminTips = detailedProducts.reduce((sum, product) => sum + product.adminTip, 0);

  return (
    <Dialog open={isOpen} onOpenChange={() => closeModal(modalId)}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Detalles de Solicitud #{pkg.id}</span>
            </div>
            <div className="flex items-center space-x-2">
              {editMode ? (
                <>
                  <Button onClick={handleSaveChanges} size="sm" className="text-xs">
                    <Save className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                  <Button onClick={handleEditToggle} variant="outline" size="sm" className="text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={handleEditToggle} variant="outline" size="sm" className="text-xs">
                  <Edit2 className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Información completa de la solicitud y del usuario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        {pkg.profiles ? `${pkg.profiles.first_name || ''} ${pkg.profiles.last_name || ''}`.trim() || pkg.profiles.username || 'Sin nombre' : 'Sin información'}
                        {pkg.profiles && (pkg.profiles.trust_level === 'prime' || (pkg.profiles.prime_expires_at && new Date(pkg.profiles.prime_expires_at) > new Date())) && (
                          <span title="Usuario Prime">
                            <Star className="h-3 w-3 text-purple-500 fill-purple-500" />
                          </span>
                        )}
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
                        {pkg.profiles?.email || 'Sin email registrado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.profiles?.phone_number || 'Sin teléfono registrado'}
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
                           {matchedTrip ? `${matchedTrip.first_name || ''} ${matchedTrip.last_name || ''}`.trim() || matchedTrip.username || 'Sin nombre' : 'Sin información'}
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex items-center space-x-2">
                       <User className="h-4 w-4 text-muted-foreground" />
                       <div>
                         <p className="text-sm font-medium">Usuario</p>
                         <p className="text-sm text-muted-foreground">
                           @{matchedTrip?.username || 'Sin usuario'}
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex items-center space-x-2">
                       <Mail className="h-4 w-4 text-muted-foreground" />
                       <div>
                         <p className="text-sm font-medium">Email</p>
                         <p className="text-sm text-muted-foreground">
                           {matchedTrip?.email || 'Sin email registrado'}
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex items-center space-x-2">
                       <Phone className="h-4 w-4 text-muted-foreground" />
                       <div>
                         <p className="text-sm font-medium">Teléfono</p>
                         <p className="text-sm text-muted-foreground">
                           {matchedTrip?.phone_number || 'Sin teléfono registrado'}
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex items-center space-x-2">
                       <Package className="h-4 w-4 text-muted-foreground" />
                       <div>
                         <p className="text-sm font-medium">Usuario ID</p>
                         <p className="text-sm text-muted-foreground">
                           {matchedTrip?.user_id}
                         </p>
                       </div>
                     </div>

                      <Accordion type="single" collapsible className="border border-blue-200 rounded-lg">
                        <AccordionItem value="trip-info" className="border-none">
                          <AccordionTrigger className="px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-t-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-blue-800">📍 Información del Viaje</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3">
                            <div className="text-sm text-blue-700 space-y-1">
                               <p><strong>Ruta:</strong> {matchedTrip?.from_city} → {matchedTrip?.to_city}</p>
                               <p><strong>Llegada:</strong> {formatSafeDate(matchedTrip?.arrival_date)}</p>
                                <p><strong>Entrega:</strong> {formatSafeDate(matchedTrip?.delivery_date)}</p>
                              <p><strong>Primer día paquetes:</strong> {formatSafeDate(matchedTrip?.first_day_packages)}</p>
                              <p><strong>Último día paquetes:</strong> {formatSafeDate(matchedTrip?.last_day_packages)}</p>
                              
                              {matchedTrip?.package_receiving_address && (
                                <div className="mt-2 pt-2 border-t border-blue-300">
                                  <p className="font-medium">Dirección de recepción:</p>
                                  <div className="space-y-1 text-sm">
                                    {matchedTrip.package_receiving_address.recipientName && (
                                      <p><strong>Destinatario:</strong> {matchedTrip.package_receiving_address.recipientName}</p>
                                    )}
                                    <div>
                                      {matchedTrip.package_receiving_address.streetAddress && (
                                        <p>{matchedTrip.package_receiving_address.streetAddress}</p>
                                      )}
                                      {matchedTrip.package_receiving_address.streetAddress2 && (
                                        <p>{matchedTrip.package_receiving_address.streetAddress2}</p>
                                      )}
                                      <p>
                                        {matchedTrip.package_receiving_address.cityArea}
                                        {matchedTrip.package_receiving_address.postalCode && `, ${matchedTrip.package_receiving_address.postalCode}`}
                                      </p>
                                    </div>
                                    {matchedTrip.package_receiving_address.accommodationType && matchedTrip.package_receiving_address.hotelAirbnbName && (
                                      <p><strong>{matchedTrip.package_receiving_address.accommodationType}:</strong> {matchedTrip.package_receiving_address.hotelAirbnbName}</p>
                                    )}
                                    {matchedTrip.package_receiving_address.contactNumber && (
                                      <p><strong>Contacto:</strong> {matchedTrip.package_receiving_address.contactNumber}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enhanced Package Information with Detailed Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Package className="h-4 w-4" />
                <span>Detalles del Pedido</span>
                {!editMode && <Badge variant="outline">{detailedProducts.length} producto{detailedProducts.length !== 1 ? 's' : ''}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Traveler Rejection Info - Show when traveler rejected the assignment */}
              {pkg.traveler_rejection && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <XCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-semibold text-orange-900 mb-1">Viajero Rechazó la Asignación</h4>
                        <p className="text-sm text-orange-800">
                          <span className="font-medium">Motivo: </span>
                          {translateRejectionReason((pkg.traveler_rejection as any)?.reason)}
                        </p>
                      </div>
                      
                      {(pkg.traveler_rejection as any)?.additional_comments && (
                        <div className="bg-orange-100 rounded-md p-3">
                          <p className="text-xs font-medium text-orange-900 mb-1">Comentarios del viajero:</p>
                          <p className="text-xs text-orange-800">
                            {(pkg.traveler_rejection as any).additional_comments}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-orange-300">
                        <div className="flex items-center space-x-2">
                          {(pkg.traveler_rejection as any)?.wants_requote ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                              ✓ Solicita nueva cotización
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                              No solicita nueva cotización
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-orange-700">
                          Rechazado el {formatSafeDateTime((pkg.traveler_rejection as any)?.rejected_at || pkg.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quote Rejection Info - Show when quote was rejected */}
              {pkg.quote_rejection && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-semibold text-red-900 mb-1">Cotización Rechazada por el Shopper</h4>
                        <p className="text-sm text-red-800">
                          <span className="font-medium">Motivo: </span>
                          {translateRejectionReason((pkg.quote_rejection as any)?.reason)}
                        </p>
                      </div>
                      
                      {(pkg.quote_rejection as any)?.additional_notes && (
                        <div className="bg-red-100 rounded-md p-3">
                          <p className="text-xs font-medium text-red-900 mb-1">Comentarios adicionales:</p>
                          <p className="text-xs text-red-800">
                            {(pkg.quote_rejection as any).additional_notes}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-red-300">
                        <div className="flex items-center space-x-2">
                          {(pkg.quote_rejection as any)?.wants_requote ? (
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                              ✓ Solicita nueva cotización
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                              No solicita nueva cotización
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-red-700">
                          Rechazado el {formatSafeDateTime((pkg.quote_rejection as any)?.rejected_at || pkg.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editMode ? (
                /* Edit Mode - Form Fields */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Descripción del producto</label>
                      <Textarea
                        value={editForm.item_description}
                        onChange={(e) => handleFormChange('item_description', e.target.value)}
                        placeholder="Describe el producto que necesitas..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Link del producto</label>
                      <Input
                        type="url"
                        value={editForm.item_link}
                        onChange={(e) => handleFormChange('item_link', e.target.value)}
                        placeholder="https://ejemplo.com/producto"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Precio estimado (USD)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.estimated_price}
                        onChange={(e) => handleFormChange('estimated_price', e.target.value)}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Notas adicionales</label>
                      <Textarea
                        value={editForm.additional_notes}
                        onChange={(e) => handleFormChange('additional_notes', e.target.value)}
                        placeholder="Notas adicionales..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">País de compra</label>
                      <Input
                        value={editForm.purchase_origin}
                        onChange={(e) => handleFormChange('purchase_origin', e.target.value)}
                        placeholder="País donde se comprará"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Destino del paquete</label>
                      <Input
                        value={editForm.package_destination}
                        onChange={(e) => handleFormChange('package_destination', e.target.value)}
                        placeholder="Ciudad de destino"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* View Mode - Product Details */
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Productos Solicitados:</h4>
                  {detailedProducts.map((product) => (
                    <Card key={product.id} className="border-l-4 border-l-primary/30 bg-muted/20">
                      <CardContent className="p-2">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-1 mb-1">
                              <Badge variant="outline" className="text-xs">
                                Producto #{product.id}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                Cantidad: {product.quantity}
                              </Badge>
                            </div>
                            <h5 className="font-medium text-sm">{product.description}</h5>
                          </div>
                          <div className="text-right ml-3">
                            <p className="text-base font-bold text-primary">${product.price.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">c/u</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-1 text-xs">
                          <div>
                            <p className="font-medium text-muted-foreground">Precio Unitario</p>
                            <p className="font-medium">${product.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Cantidad</p>
                            <p className="font-medium">{product.quantity} unidad{product.quantity !== 1 ? 'es' : ''}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Subtotal</p>
                            <p className="font-bold text-primary">${product.subtotal.toFixed(2)}</p>
                          </div>
                          {product.adminTip > 0 && (
                            <div>
                              <p className="font-medium text-muted-foreground">Tip Asignado</p>
                              <p className="font-bold text-green-600">Q{product.adminTip.toFixed(2)}</p>
                            </div>
                          )}
                          {product.link && (
                            <div>
                              <p className="font-medium text-muted-foreground">Link</p>
                              <a 
                                href={product.link}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-primary hover:underline text-xs"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                <span>Ver producto</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Order Summary */}
              <div className="border-t pt-3">
                <h4 className="font-medium text-sm mb-2">Resumen del Pedido:</h4>
                <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="text-center">
                      <p className="font-medium text-muted-foreground">Total Productos</p>
                      <p className="text-base font-bold">{detailedProducts.reduce((sum, p) => sum + p.quantity, 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-muted-foreground">Valor Total</p>
                      <p className="text-base font-bold text-primary">${totalOrderValue.toFixed(2)}</p>
                    </div>
                    {totalAdminTips > 0 && (
                      <div className="text-center">
                        <p className="font-medium text-muted-foreground">Tips Asignados</p>
                        <p className="text-base font-bold text-green-600">Q{totalAdminTips.toFixed(2)}</p>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="font-medium text-muted-foreground">Método de Entrega</p>
                      <p className="text-xs font-medium">
                        {pkg.office_delivery ? "Recoger en Z14" : "Pickup"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-muted-foreground">Fecha Límite</p>
                      <p className="text-xs font-medium">
                        {formatSafeDate(pkg.delivery_deadline)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Additional Notes from Shopper */}
                  {pkg.additional_notes && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <h5 className="font-medium text-xs text-muted-foreground mb-2">Notas Adicionales del Shopper:</h5>
                      <p className="text-xs text-foreground bg-muted/30 p-2 rounded">{pkg.additional_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmed Delivery Address */}
              {pkg.confirmed_delivery_address && pkg.delivery_method === 'delivery' && (
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                      <Home className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-semibold text-base text-foreground">Dirección de Entrega Confirmada</h4>
              </div>

              {/* Additional Notes from Shopper */}
              {pkg.additional_notes && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
                    Notas Adicionales del Shopper:
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{pkg.additional_notes}</p>
                </div>
              )}
                  
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-primary/15 rounded-full mt-0.5 flex-shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-background/80 rounded-lg p-3 shadow-sm">
                          <p className="font-semibold text-foreground text-sm leading-relaxed">
                            {pkg.confirmed_delivery_address.streetAddress}
                          </p>
                          <p className="text-muted-foreground text-sm mt-1">
                            {pkg.confirmed_delivery_address.cityArea}
                          </p>
                        </div>
                        
                        {pkg.confirmed_delivery_address.hotelAirbnbName && (
                          <div className="bg-secondary/50 rounded-lg p-3 border border-secondary/20">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-secondary rounded-full"></div>
                              <p className="font-medium text-secondary-foreground text-sm">
                                {pkg.confirmed_delivery_address.hotelAirbnbName}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-background/80 rounded-lg p-3 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-primary" />
                            <p className="font-medium text-foreground text-sm">
                              {pkg.confirmed_delivery_address.contactNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Solicitud creada el {formatSafeDateTime(pkg.created_at)}
              </div>
            </CardContent>
          </Card>

          {/* Quote Information */}
          {pkg.quote && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <DollarSign className="h-4 w-4" />
                  <span>Cotización Enviada al Shopper</span>
                </CardTitle>
                <CardDescription>
                  Detalles de la cotización que recibió el cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Propina del Viajero</p>
                      <p className="text-sm text-muted-foreground">Q{pkg.quote.price || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Service Fee ({pkg.profiles?.trust_level === 'prime' ? '20%' : '40%'})</p>
                      <p className="text-sm text-muted-foreground">Q{(pkg.quote.serviceFee || ((pkg.quote.price || 0) * (pkg.profiles?.trust_level === 'prime' ? 0.20 : 0.40))).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Delivery Fee</p>
                      <p className="text-sm text-muted-foreground">Q{(pkg.quote.deliveryFee || (pkg.delivery_method === 'delivery' && pkg.profiles?.trust_level !== 'prime' ? 25 : 0)).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Total a Pagar</p>
                      <p className="text-lg font-bold text-primary">Q{(() => {
                        const travelerTip = parseFloat(pkg.quote.price || '0');
                        const serviceFee = parseFloat(pkg.quote.serviceFee || '0') || (travelerTip * (pkg.profiles?.trust_level === 'prime' ? 0.20 : 0.40));
                        const deliveryFee = pkg.quote.deliveryFee || (pkg.delivery_method === 'delivery' && pkg.profiles?.trust_level !== 'prime' ? 25 : 0);
                        return (travelerTip + serviceFee + deliveryFee).toFixed(2);
                      })()}</p>
                    </div>
                  </div>
                </div>

                {pkg.quote.message && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Mensaje del Viajero:</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {pkg.quote.message}
                    </p>
                  </div>
                )}

                {pkg.quote_expires_at && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-1">Expiración de la Cotización:</p>
                    <p className="text-sm text-muted-foreground">
                      {formatSafeDateTime(pkg.quote_expires_at)}
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium text-blue-800 mb-1">Estado de la Cotización:</p>
                  <p className="text-blue-700">
                    {pkg.status === 'quote_sent' && 'Enviada - Esperando respuesta del shopper'}
                    {pkg.status === 'payment_pending' && 'Aceptada - Pago pendiente'}
                    {pkg.status === 'pending_purchase' && 'Pagada - Compra pendiente'}
                    {pkg.status === 'quote_rejected' && 'Rechazada por el shopper'}
                    {pkg.status === 'quote_expired' && 'Expirada'}
                    {!['quote_sent', 'payment_pending', 'pending_purchase', 'quote_rejected', 'quote_expired'].includes(pkg.status) && 'Cotización enviada'}
                  </p>
                </div>

                {/* Shopper Quote Rejection Details */}
                {(pkg.status === 'quote_rejected' && pkg.quote_rejection) && (
                  <div className="border-t pt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                        <p className="text-sm font-medium text-red-800">Motivo del Rechazo por Shopper:</p>
                      </div>
                      <p className="text-sm text-red-700 mb-2">
                        {translateRejectionReason((pkg.quote_rejection as any)?.reason)}
                      </p>
                      
                      {(pkg.quote_rejection as any)?.additional_notes && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-red-800 mb-1">Comentarios adicionales:</p>
                          <p className="text-xs text-red-700 bg-red-100 p-2 rounded">
                            {(pkg.quote_rejection as any).additional_notes}
                          </p>
                        </div>
                      )}
                      
                      {(pkg.quote_rejection as any)?.wants_requote && (
                        <div className="mt-2 flex items-center space-x-2">
                          <div className="h-1.5 w-1.5 bg-orange-500 rounded-full"></div>
                          <p className="text-xs text-orange-700 font-medium">
                            ⚠️ El shopper solicita nueva cotización
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Package Reception Confirmation */}
          {hasTravelerConfirmation && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>✅ Paquete Recibido por el Viajero</span>
                </CardTitle>
                <CardDescription className="text-green-700">
                  El viajero ha confirmado la recepción del paquete
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Confirmado el {formatSafeDateTime(pkg.traveler_confirmation.confirmed_at || pkg.traveler_confirmation.confirmedAt)}
                    </span>
                  </div>
                </div>
                
                {(pkg.traveler_confirmation.photo || pkg.traveler_confirmation.photoUrl) && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Camera className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Foto de confirmación:</span>
                    </div>
                    <div className="relative">
                      <img 
                        src={resolvedTravelerPhotoUrl || rawTravelerPhoto} 
                        alt="Confirmación de recepción"
                        className="max-w-full h-auto max-h-64 rounded-lg border border-green-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onError={(e) => {
                          console.error('Error loading confirmation photo:', e);
                          console.error('Photo URL:', rawTravelerPhoto);
                          e.currentTarget.style.display = 'none';
                        }}
                        onClick={() => {
                          setSelectedImage({
                            url: rawTravelerPhoto,
                            title: "Confirmación de recepción",
                            filename: `confirmacion_${pkg.id}_${new Date().toISOString().split('T')[0]}.jpg`
                          });
                          setImageViewerOpen(true);
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents Section */}
          {hasAnyDocuments && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <FileText className="h-4 w-4" />
                  <span>Documentos Subidos</span>
                </CardTitle>
                <CardDescription>
                  Documentos relacionados con este paquete
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Payment Receipt */}
                  {hasPaymentReceipt && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        Comprobante de Pago
                      </h4>
                      <PaymentReceiptViewer 
                        paymentReceipt={pkg.payment_receipt}
                        packageId={pkg.id}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Purchase Confirmation */}
                  {hasPurchaseConfirmation && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Comprobante de Compra
                      </h4>
                      <PurchaseConfirmationViewer 
                        purchaseConfirmation={pkg.purchase_confirmation}
                        packageId={pkg.id}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Tracking Information */}
                  {hasTrackingInfo && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Información de Seguimiento
                      </h4>
                      <TrackingInfoViewer 
                        trackingInfo={pkg.tracking_info}
                        className="w-full"
                      />
                    </div>
                  )}

                </div>

                {/* Office Delivery Information */}
                {pkg.office_delivery && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4" />
                      Información de Entrega en Oficina
                    </h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                      {pkg.office_delivery.traveler_declaration && (
                        <div>
                          <p className="text-sm font-medium text-blue-800">Declaración del Viajero:</p>
                          <p className="text-sm text-blue-700">
                            Confirmado el {formatSafeDateTime(pkg.office_delivery.traveler_declaration.delivered_at)}
                          </p>
                          {pkg.office_delivery.traveler_declaration.notes && (
                            <p className="text-sm text-blue-700 mt-1">
                              <strong>Notas:</strong> {pkg.office_delivery.traveler_declaration.notes}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {pkg.office_delivery.admin_confirmation && (
                        <div>
                          <p className="text-sm font-medium text-green-800">Confirmación Administrativa:</p>
                          <p className="text-sm text-green-700">
                            Confirmado el {formatSafeDateTime(pkg.office_delivery.admin_confirmation.confirmed_at)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {(() => {
                  const reason = (pkg?.quote_rejection as any)?.reason 
                    || (pkg?.admin_rejection as any)?.reason 
                    || (typeof pkg?.rejection_reason === 'string' 
                        ? pkg.rejection_reason 
                        : (pkg?.rejection_reason as any)?.value);
                  if (!reason) return null;
                  const wantsRequote = (pkg?.quote_rejection as any)?.wants_requote 
                    ?? (pkg as any)?.wants_requote 
                    ?? (pkg?.rejection_reason as any)?.wantsRequote;
                  const additionalComments = (pkg?.quote_rejection as any)?.additional_notes 
                    ?? (pkg as any)?.additional_notes 
                    ?? (pkg?.rejection_reason as any)?.additionalComments;
                  return (
                    <div className="mt-4 pt-4 border-t">
                      <RejectionReasonDisplay 
                        rejectionReason={reason}
                        wantsRequote={wantsRequote}
                        additionalComments={additionalComments}
                      />
                    </div>
                  );
                })()}

              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {pkg.status === 'pending_approval' && (
            <div className="flex space-x-2 pt-4 border-t">
              <Button 
                onClick={() => handleApprove(pkg.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar Solicitud
              </Button>
               <Button 
                variant="destructive"
                onClick={handleRejectClick}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar Solicitud
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewerModal
          isOpen={imageViewerOpen}
          onClose={() => {
            setImageViewerOpen(false);
            setSelectedImage(null);
          }}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          filename={selectedImage.filename}
         />
      )}
      
      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        onConfirm={handleReject}
        type="package"
        itemName={pkg?.item_description || 'Solicitud'}
      />
    </Dialog>
  );
};

export default PackageDetailModal;
