
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Plane, Calendar, MapPin, Package, Truck, CheckCircle, XCircle, Home, ShoppingBag, Download, Rocket } from "lucide-react";
import { TripHistoryTimeline } from './TripHistoryTimeline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PackageLabel } from './PackageLabel';
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useModalState } from "@/contexts/ModalStateContext";
import { useAuth } from "@/hooks/useAuth";
import RejectionReasonModal from "./RejectionReasonModal";
import EditTripModal from "../EditTripModal";
import { formatDateUTC } from "@/lib/formatters";

interface TripDetailModalProps {
  modalId: string;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onEditTrip?: (id: string, updates: any) => void;
}

const TripDetailModal = ({ modalId, onApprove, onReject, onEditTrip }: TripDetailModalProps) => {
  const { isModalOpen, closeModal, getModalData } = useModalState();
  const { user, userRole } = useAuth();
  const trip = getModalData(modalId);
  const isOpen = isModalOpen(modalId);
  
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [labelNumbers, setLabelNumbers] = useState<number[]>([]);
  const [isGeneratingLabels, setIsGeneratingLabels] = useState(false);
  const { getStatusBadge } = useStatusHelpers();

  // Security: Only allow admin access
  if (!user || userRole?.role !== 'admin') {
    console.warn('🔒 Unauthorized access to TripDetailModal:', { 
      userId: user?.id, 
      role: userRole?.role 
    });
    return null;
  }

  // Fetch packages associated with this trip
  useEffect(() => {
    if (trip?.id && isOpen) {
      setLoadingPackages(true);
      const fetchPackages = async () => {
        try {
          const { data, error } = await supabase
            .from('packages')
            .select(`
              *,
              profiles:user_id (
                first_name,
                last_name,
                email
              )
            `)
            .eq('matched_trip_id', trip.id)
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('Error fetching trip packages:', error);
          } else {
            setPackages(data || []);
          }
        } catch (error) {
          console.error('Error fetching trip packages:', error);
        } finally {
          setLoadingPackages(false);
        }
      };
      
      fetchPackages();
    }
  }, [trip?.id, isOpen]);

  // Reset label numbers when modal closes
  useEffect(() => {
    if (!previewModalOpen) {
      setLabelNumbers([]);
    }
  }, [previewModalOpen]);

  if (!trip) return null;

  // Debug logging to see what data we have
  console.log('Trip data in TripDetailModal:', trip);
  console.log('Available space value:', trip.available_space);
  console.log('All trip keys:', Object.keys(trip));

  const getTripStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente de Aprobación', variant: 'secondary' as const },
      'approved': { label: 'Aprobado', variant: 'default' as const },
      'active': { label: 'Activo', variant: 'default' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDeliveryMethodIcon = (method: string) => {
    return method === 'pickup' ? <Home className="h-4 w-4" /> : <Truck className="h-4 w-4" />;
  };

  // Handle reject action with reason
  const handleReject = (reason: string) => {
    onReject(trip.id, reason);
    closeModal(modalId);
  };

  // Open rejection modal
  const handleRejectClick = () => {
    setRejectionModalOpen(true);
  };

  // Handle edit trip
  const handleEditTrip = (updates: any) => {
    if (onEditTrip) {
      onEditTrip(trip.id, updates);
    }
    setShowEditModal(false);
  };

  // Generate unique label numbers for all packages
  const generateLabelNumbers = async () => {
    if (!packages || packages.length === 0) return;
    
    setIsGeneratingLabels(true);
    try {
      const numbers: number[] = [];
      for (let i = 0; i < packages.length; i++) {
        const p = packages[i];
        try {
          // Reuse if already assigned
          if (p.label_number) {
            numbers.push(p.label_number);
            continue;
          }

          // Generate new if missing
          const { data, error } = await supabase.rpc('get_next_label_number');
          if (error || data === null) {
            console.error('Error getting label number for package', i, error);
            continue;
          }

          // Persist to DB
          const { error: updateError } = await supabase
            .from('packages')
            .update({ label_number: data })
            .eq('id', p.id);
          
          if (updateError) {
            console.error('Error saving label number to package', p.id, updateError);
          } else {
            p.label_number = data; // update local reference
          }

          numbers.push(data);
        } catch (innerErr) {
          console.error('Error processing label number for package', i, innerErr);
        }
      }
      setLabelNumbers(numbers);
      // Trigger UI refresh with updated label_number values
      setPackages([...packages]);
      return numbers;
    } catch (error) {
      console.error('Error generating label numbers:', error);
      return [];
    } finally {
      setIsGeneratingLabels(false);
    }
  };

  // Generate PDF with multiple package labels
  const generateMultipleLabelsPDF = async () => {
    if (!packages.length) {
      alert('No hay paquetes para generar etiquetas.');
      return;
    }

    setGeneratingPDF(true);
    
    try {
      // Generate label numbers only when actually downloading PDF
      console.log('🏷️ Generating label numbers for PDF download...');
      const numbers = await generateLabelNumbers() || [];

      // Import React and ReactDOM for rendering
      const React = await import('react');
      const ReactDOM = await import('react-dom/client');
      
      // Create PDF with letter size (8.5" x 11") - 612x792 points at 72 DPI
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });

      for (let i = 0; i < packages.length; i++) {
        const pkg = packages[i];
        
        // Create a temporary container for rendering (hidden off-screen)
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '288px';
        tempContainer.style.height = '432px';
        tempContainer.style.backgroundColor = '#ffffff';
        document.body.appendChild(tempContainer);

        // Create a div to render the React component
        const reactContainer = document.createElement('div');
        tempContainer.appendChild(reactContainer);

        // Create and render the PackageLabel component with label number
        const root = ReactDOM.createRoot(reactContainer);
        await new Promise<void>((resolve) => {
          root.render(React.createElement(PackageLabel, { 
            pkg, 
            trip,
            labelNumber: numbers[i]
          }));
          // Give React time to render
          setTimeout(resolve, 100);
        });

        // Use html2canvas to capture the element
        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: 288,
          height: 432,
          windowWidth: 288,
          windowHeight: 432
        });

        // Clean up temporary element and React root
        root.unmount();
        document.body.removeChild(tempContainer);

        // Add new page for each label except the first one
        if (i > 0) {
          pdf.addPage();
        }

        // Calculate position to center 4x6" label (288x432 points) on letter page
        const centerX = (612 - 288) / 2; // 162 points
        const centerY = (792 - 432) / 2; // 180 points

        // Convert canvas to image and add to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', centerX, centerY, 288, 432);
      }

      // Generate filename and save
      const tripId = trip.id ? trip.id.substring(0, 8) : 'viaje';
      const fileName = `etiquetas_viaje_${tripId}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating multiple labels PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => closeModal(modalId)}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Plane className="h-5 w-5" />
              <span>Detalles de Viaje #{trip.id}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="ml-auto"
            >
              Editar
            </Button>
          </DialogTitle>
          <DialogDescription>
            Información completa del viaje y del viajero
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Estado actual:</span>
            {getTripStatusBadge(trip.status)}
          </div>

          {/* Traveler Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="h-4 w-4" />
                <span>Información del Viajero</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Nombre</p>
                    <p className="text-sm text-muted-foreground">
                      {trip.first_name && trip.last_name 
                        ? `${trip.first_name} ${trip.last_name}` 
                        : trip.username || 'No disponible'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{trip.email || 'No disponible'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">{trip.phone_number || 'No disponible'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">ID del Viajero</p>
                    <p className="text-sm text-muted-foreground">
                      <code className="font-mono text-xs">{trip.user_id}</code>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Plane className="h-4 w-4" />
                <span>Detalles del Viaje</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Route */}
              <div>
                <p className="font-medium text-lg flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{trip.from_city} → {trip.to_city}</span>
                </p>
                <p className="text-muted-foreground">Ruta de viaje</p>
                {trip.from_country && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">País de origen:</span> {trip.from_country}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha de Llegada</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateUTC(trip.arrival_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Espacio Disponible</p>
                    <p className="text-sm text-muted-foreground">
                      {trip.available_space ? `${trip.available_space} kg` : 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Method - Prominente */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {getDeliveryMethodIcon(trip.delivery_method)}
                  <p className="text-base font-semibold text-blue-800">Método de Entrega</p>
                </div>
                <div className="ml-6">
                  <p className="text-sm text-blue-700">
                    {trip.delivery_method === 'oficina' ? '🏢 Llevar paquetes a la oficina de Favorón' : 
                     trip.delivery_method === 'mensajero' ? '🚚 Un mensajero recogerá los paquetes' : 
                     trip.delivery_method === 'pickup' ? '🏢 Recoger en oficina' : 
                     trip.delivery_method || 'No especificado'}
                  </p>
                  {!trip.delivery_method && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Método de entrega no especificado en este viaje</p>
                  )}
                </div>
              </div>

              {/* Messenger Pickup Information */}
              {trip.delivery_method === 'mensajero' && trip.messenger_pickup_info && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2 mb-3">
                    <Truck className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <p className="text-sm font-medium text-yellow-800">Información de Recolección por Mensajero:</p>
                  </div>
                  <div className="text-sm text-muted-foreground ml-7 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="font-medium text-gray-700">Dirección de recolección:</p>
                        <p>{trip.messenger_pickup_info.streetAddress}</p>
                        <p>{trip.messenger_pickup_info.cityArea}</p>
                      </div>
                      
                      {trip.messenger_pickup_info.accommodationName && (
                        <div>
                          <p className="font-medium text-gray-700">Lugar:</p>
                          <p>{trip.messenger_pickup_info.accommodationName}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="font-medium text-gray-700">Contacto:</p>
                        <p>{trip.messenger_pickup_info.contactNumber}</p>
                      </div>
                      
                      {trip.messenger_pickup_info.preferredTime && (
                        <div>
                          <p className="font-medium text-gray-700">Horario preferido:</p>
                          <p>{trip.messenger_pickup_info.preferredTime}</p>
                        </div>
                      )}
                    </div>
                    
                    {trip.messenger_pickup_info.pickupInstructions && (
                      <div className="mt-3 pt-3 border-t border-yellow-200">
                        <p className="font-medium text-gray-700">Instrucciones adicionales:</p>
                        <p className="mt-1 bg-white p-2 rounded border">{trip.messenger_pickup_info.pickupInstructions}</p>
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-yellow-200">
                      <p className="text-xs text-yellow-700 font-medium">
                        💰 Costo del mensajero (Q25-Q40) será descontado de las ganancias del viajero
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {trip.delivery_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-primary">Fecha de Entrega</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateUTC(trip.delivery_date)}
                      </p>
                    </div>
                  </div>
                )}

                {trip.first_day_packages && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-600">Primer Día Recibir Paquetes</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateUTC(trip.first_day_packages)}
                      </p>
                    </div>
                  </div>
                )}

                {trip.last_day_packages && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-600">Último Día Recibir Paquetes</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateUTC(trip.last_day_packages)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Package Receiving Address */}
              {trip.package_receiving_address && (
                <div className="bg-muted/50 border rounded-lg p-4">
                  <div className="flex items-start space-x-2 mb-3">
                    <Package className="h-5 w-5 text-primary mt-0.5" />
                    <p className="text-sm font-medium text-primary">Dirección para Recibir Paquetes:</p>
                  </div>
                  <div className="text-sm text-muted-foreground ml-7 space-y-2">
                    <div>
                      {typeof trip.package_receiving_address === 'object' ? (
                        <div className="space-y-2">
                          {trip.package_receiving_address?.recipientName && (
                            <div>
                              <p className="font-medium text-gray-700">Nombre del destinatario:</p>
                              <p className="ml-2">{trip.package_receiving_address.recipientName}</p>
                            </div>
                          )}
                          
                          <div>
                            <p className="font-medium text-gray-700">Dirección:</p>
                            <div className="ml-2 space-y-1">
                              <p>{trip.package_receiving_address?.streetAddress || ''}</p>
                              {trip.package_receiving_address?.streetAddress2 && (
                                <p>{trip.package_receiving_address.streetAddress2}</p>
                              )}
                              <p>{trip.package_receiving_address?.cityArea || ''}</p>
                              {trip.package_receiving_address?.postalCode && (
                                <p>Código Postal: {trip.package_receiving_address.postalCode}</p>
                              )}
                            </div>
                          </div>

                          {trip.package_receiving_address?.hotelAirbnbName && (
                            <div>
                              <p className="font-medium text-gray-700">
                                {trip.package_receiving_address?.accommodationType === 'hotel' ? 'Hotel:' : 'Lugar:'}
                              </p>
                              <p className="ml-2">{trip.package_receiving_address.hotelAirbnbName}</p>
                            </div>
                          )}
                          
                          <div>
                            <p className="font-medium text-gray-700">Número de contacto:</p>
                            <p className="ml-2">{trip.package_receiving_address?.contactNumber || ''}</p>
                          </div>
                        </div>
                      ) : (
                        <p>{trip.package_receiving_address}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Address (Guatemala) */}
              {trip.deliveryAddress && (
                <div className="bg-muted/50 border rounded-lg p-3">
                  <div className="flex items-start space-x-2 mb-2">
                    <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm font-medium">Dirección de Entrega en Guatemala:</p>
                  </div>
                  <div className="text-sm text-muted-foreground ml-6">
                    <p>{trip.deliveryAddress.streetAddress}</p>
                    <p>{trip.deliveryAddress.cityArea}</p>
                    {trip.deliveryAddress.hotelAirbnbName && (
                      <p><strong>Hotel/Airbnb:</strong> {trip.deliveryAddress.hotelAirbnbName}</p>
                    )}
                    <p><strong>Contacto:</strong> {trip.deliveryAddress.contactNumber}</p>
                  </div>
                </div>
              )}

              {trip.additionalInfo && (
                <div>
                  <p className="text-sm font-medium mb-1">Información Adicional:</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {trip.additionalInfo}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Viaje registrado el {new Date(trip.created_at).toLocaleDateString('es-GT')} a las {new Date(trip.created_at).toLocaleTimeString('es-GT')}
              </div>
            </CardContent>
          </Card>

          {/* Trip History Timeline */}
          <TripHistoryTimeline historyLog={trip.trip_history_log} />

          {/* Packages Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <ShoppingBag className="h-4 w-4" />
                    <span>Paquetes Asignados ({packages.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Paquetes que lleva este viajero en su viaje
                    {packages.length > 0 && (() => {
                      const eligibleStatuses = ['in_transit', 'pending_office_confirmation', 'delivered_to_office', 'completed'];
                      const packagesInTrip = packages.filter(pkg => 
                        pkg.admin_assigned_tip && eligibleStatuses.includes(pkg.status)
                      );
                      const totalTips = packagesInTrip.reduce((sum, pkg) => {
                        return sum + (pkg.admin_assigned_tip || 0);
                      }, 0);
                      return totalTips > 0 ? (
                        <span className="block mt-1 font-semibold text-foreground">
                          Total de tips en este viaje: Q{totalTips.toFixed(2)}
                        </span>
                      ) : null;
                    })()}
                  </CardDescription>
                </div>
                {packages.length > 0 && (
                  <Button
                    onClick={() => setPreviewModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Vista Previa Etiquetas</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingPackages ? (
                <div className="text-center text-muted-foreground py-4">
                  Cargando paquetes...
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Este viaje no tiene paquetes asignados aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{pkg.item_description}</h4>
                          <p className="text-sm text-muted-foreground">
                            Shopper: {pkg.profiles?.first_name && pkg.profiles?.last_name 
                              ? `${pkg.profiles.first_name} ${pkg.profiles.last_name}`
                              : pkg.profiles?.email || 'No disponible'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(pkg.status, { 
                            packageDestination: pkg.package_destination,
                            pkg: pkg
                          })}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Origen:</p>
                          <p>{pkg.purchase_origin}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Destino:</p>
                          <p>{pkg.package_destination}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Precio estimado:</p>
                          <p className="font-semibold text-green-600">${pkg.estimated_price}</p>
                        </div>
                        {pkg.admin_assigned_tip && (
                          <div>
                            <p className="font-medium text-muted-foreground">Tip asignado:</p>
                            <p className="font-semibold">Q{pkg.admin_assigned_tip}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}</span>
                          <span>ID: {pkg.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {trip.status === 'pending_approval' && (
            <div className="flex space-x-2 pt-4 border-t">
              <Button 
                onClick={() => onApprove(trip.id)}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar Viaje
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejectClick}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar Viaje
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        onConfirm={handleReject}
        type="trip"
        itemName={`${trip?.from_city} → ${trip?.to_city}` || 'Viaje'}
      />

      {/* Edit Trip Modal */}
      {showEditModal && (
        <EditTripModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditTrip}
          tripData={trip}
        />
      )}

      {/* Preview Modal for Multiple Labels */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Vista Previa - Etiquetas del Viaje</span>
              <Button
                onClick={generateMultipleLabelsPDF}
                disabled={generatingPDF}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>{generatingPDF ? 'Generando...' : 'Descargar PDF'}</span>
              </Button>
            </DialogTitle>
            <DialogDescription>
              {packages.length} etiquetas para el viaje {trip?.from_city} → {trip?.to_city}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {packages.map((pkg, index) => (
              <div key={pkg.id} className="border rounded-lg p-6 bg-gray-50">
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-600">
                    Etiqueta {index + 1} de {packages.length} - {pkg.item_description}
                  </span>
                </div>
                <div className="flex justify-center bg-white p-4 rounded-lg shadow-sm">
                  <div className="transform scale-75 origin-center">
                    <PackageLabel pkg={pkg} trip={trip} labelNumber={labelNumbers[index]} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default TripDetailModal;
