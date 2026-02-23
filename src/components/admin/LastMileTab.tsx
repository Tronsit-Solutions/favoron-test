import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, CheckCircle, Package, User, MapPin, Calendar, Eye, Tag, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PackageLabel } from './PackageLabel';
import { PackageLabelModal } from './PackageLabelModal';
import { TripDetailModal } from '../dashboard/TripDetailModal';
import PhoneMigrationPanel from './PhoneMigrationPanel';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { formatDateUTC } from "@/lib/formatters";

// Helper function to check if delivery is overdue
const isDeliveryOverdue = (deliveryDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  return delivery < today;
};

// Eligible statuses for last mile processing
const ELIGIBLE_TRIP_STATUSES = ['approved', 'active'];
const ELIGIBLE_PACKAGE_STATUSES = [
  'paid', 
  'pending_purchase', 
  'shipped',
  'in_transit', 
  'received_by_traveler',
  'pending_office_confirmation', 
  'delivered_to_office', 
  'out_for_delivery', 
  'completed'
];

interface LastMileTabProps {
  trips: any[];
  packages: any[]; // Now receiving packages from Dashboard
  getStatusBadge: (status: string) => JSX.Element;
}

const LastMileTab = ({ trips, packages, getStatusBadge }: LastMileTabProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [previewPackage, setPreviewPackage] = useState<any>(null);
  const [selectedTripDetail, setSelectedTripDetail] = useState<any>(null);
  const [deliveredTrips, setDeliveredTrips] = useState<Set<string>>(new Set());

  // Process trips with packages in memory - NO database queries needed!
  const tripsWithPackages = useMemo(() => {
    return trips
      .filter(trip => ELIGIBLE_TRIP_STATUSES.includes(trip.status) && !trip.last_mile_delivered)
      .map(trip => {
        // Filter packages that belong to this trip
        const tripPackages = packages.filter(pkg => 
          pkg.matched_trip_id === trip.id && 
          ELIGIBLE_PACKAGE_STATUSES.includes(pkg.status)
        ).map(pkg => ({
          ...pkg,
          profiles: pkg.profiles || { 
            first_name: pkg.shopper_first_name, 
            last_name: pkg.shopper_last_name 
          }
        }));
        
        if (tripPackages.length === 0) return null;
        
        return {
          ...trip,
          packages: tripPackages,
          packageCount: tripPackages.length,
          // Profile data comes from the trip's profiles relation
          travelerProfile: trip.profiles || null
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a!.arrival_date).getTime() - new Date(b!.arrival_date).getTime());
  }, [trips, packages]);

  const handleMarkAsDelivered = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ last_mile_delivered: true })
        .eq('id', tripId);

      if (error) {
        console.error('Error marking trip as delivered:', error);
        toast({ title: 'Error', description: 'Error al marcar como entregado. Inténtalo de nuevo.', variant: 'destructive' });
        return;
      }

      // Track locally which trips have been marked as delivered (optimistic update)
      setDeliveredTrips(prev => new Set([...prev, tripId]));
      toast({ title: 'Éxito', description: 'Viaje marcado como entregado' });
    } catch (error) {
      console.error('Error marking trip as delivered:', error);
      toast({ title: 'Error', description: 'Error al marcar como entregado. Inténtalo de nuevo.', variant: 'destructive' });
    }
  };


  const generateTripLabels = async (trip: any) => {
    if (!trip.packages || trip.packages.length === 0) return;

    try {
      setGeneratingPDF(trip.id);
      
      // Get or generate label numbers for all packages
      console.log('🏷️ Processing label numbers for trip', trip.id, 'with', trip.packages.length, 'packages');
      const labelNumbers: number[] = [];
      
      for (let i = 0; i < trip.packages.length; i++) {
        const pkg = trip.packages[i];
        
        // Check if package already has a label number
        if (pkg.label_number) {
          console.log('✅ Package', i, 'already has label number:', pkg.label_number);
          labelNumbers.push(pkg.label_number);
        } else {
          // Generate new label number
          try {
            const { data, error } = await supabase.rpc('get_next_label_number');
            if (error) {
              console.error('Error getting label number:', error);
              labelNumbers.push(0); // fallback
            } else {
              console.log('🆕 Generated new label number', i, ':', data);
              labelNumbers.push(data);
              
              // Save the label number to the package
              const { error: updateError } = await supabase
                .from('packages')
                .update({ label_number: data })
                .eq('id', pkg.id);
              
              if (updateError) {
                console.error('Error saving label number:', updateError);
              } else {
                console.log('💾 Saved label number to package', pkg.id);
              }
            }
          } catch (error) {
            console.error('Error generating label number:', error);
            labelNumbers.push(0); // fallback
          }
        }
      }
      console.log('📋 All label numbers for trip:', labelNumbers);
      
      // Import React and ReactDOM for rendering
      const React = await import('react');
      const ReactDOM = await import('react-dom/client');
      
      // Create PDF with letter size (8.5" x 11") - 612x792 points at 72 DPI
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });

      for (let i = 0; i < trip.packages.length; i++) {
        const pkg = trip.packages[i];
        const labelNumber = labelNumbers[i];
        
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

        // Create and render the PackageLabel component
        const root = ReactDOM.createRoot(reactContainer);
        await new Promise<void>((resolve) => {
          root.render(React.createElement(PackageLabel, { pkg, trip, labelNumber }));
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

      const tripId = trip.id ? trip.id.substring(0, 8) : 'viaje';
      const fileName = `etiquetas_ultima_milla_${tripId}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating labels PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setGeneratingPDF(null);
    }
  };

  // Filter out trips that have been locally marked as delivered
  const filteredTrips = tripsWithPackages.filter(trip => !deliveredTrips.has(trip.id));

  // No loading state needed - data comes from props!

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Última Milla - Entrega en Oficina</span>
              </CardTitle>
              <CardDescription>
                Viajes con paquetes asignados listos para procesamiento en oficina
              </CardDescription>
            </div>
            
          </div>
        </CardHeader>
        <CardContent>
          {filteredTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay viajes con paquetes pendientes de entrega</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTrips.map(trip => (
                <Card 
                  key={trip.id} 
                  className={`border-l-4 ${
                    isDeliveryOverdue(trip.delivery_date)
                      ? 'border-l-red-600 bg-gradient-to-r from-red-50 to-red-100/30 border-red-200'
                      : 'border-l-primary bg-gradient-to-r from-primary/5 to-transparent'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-semibold text-lg">
                            {trip.travelerProfile ? 
                              `${trip.travelerProfile.first_name} ${trip.travelerProfile.last_name}` : 
                              'Sin información del viajero'
                            }
                          </h4>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium text-primary">
                            {trip.from_city} → {trip.to_city}
                          </span>
                         </div>
                         
                         <div className="flex items-center gap-2">
                           <div className="text-sm">
                              <span className={`font-medium ${
                                isDeliveryOverdue(trip.delivery_date)
                                  ? 'text-red-600 font-bold'
                                  : 'text-primary'
                              }`}>
                                Entrega en oficina: {formatDateUTC(trip.delivery_date)}
                              </span>
                           </div>
                           {isDeliveryOverdue(trip.delivery_date) && (
                             <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                               <AlertTriangle className="h-3 w-3" />
                               ATRASADO
                             </span>
                           )}
                         </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Llegada: {formatDateUTC(trip.arrival_date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Package className="h-4 w-4" />
                            <span className="font-medium text-primary">
                              {trip.packageCount} paquete{trip.packageCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {trip.travelerProfile?.email && (
                          <div className="text-sm text-muted-foreground">
                            <span>Email: {trip.travelerProfile.email}</span>
                          </div>
                        )}

                        {trip.travelerProfile?.phone_number && (
                          <div className="text-sm text-muted-foreground">
                            <span>Teléfono: {trip.travelerProfile.phone_number}</span>
                          </div>
                        )}


                        {trip.available_space && (
                          <div className="text-sm text-muted-foreground">
                            <span>Espacio disponible: {trip.available_space}kg</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTripDetail(trip)}
                        className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <User className="h-4 w-4" />
                        <span>Ver Detalles</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewPackage(trip.packages)}
                        className="flex items-center space-x-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Vista Previa Etiquetas ({trip.packageCount})</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateTripLabels(trip)}
                        disabled={generatingPDF === trip.id}
                        className="flex items-center space-x-2"
                      >
                        <Printer className="h-4 w-4" />
                        <span>
                          {generatingPDF === trip.id ? 'Generando...' : 'Imprimir Todas las Etiquetas'}
                        </span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleMarkAsDelivered(trip.id)}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Marcar como Entregado</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Package Label Preview Modal */}
      {previewPackage && (
        <PackageLabelModal 
          isOpen={true}
          onClose={() => setPreviewPackage(null)}
          packages={Array.isArray(previewPackage) ? previewPackage : [previewPackage]}
        />
      )}

      {/* Trip Detail Modal */}
      {selectedTripDetail && (
        <TripDetailModal
          isOpen={true}
          onClose={() => setSelectedTripDetail(null)}
          trip={selectedTripDetail}
          getStatusBadge={getStatusBadge}
          packages={selectedTripDetail.packages}
        />
      )}

      {/* Phone Number Migration Panel */}
      <PhoneMigrationPanel />
    </div>
  );
};

export default LastMileTab;