import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, CheckCircle, Package, User, MapPin, Calendar, Eye, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PackageLabel } from './PackageLabel';
import { PackageLabelModal } from './PackageLabelModal';
import { TripDetailModal } from '../dashboard/TripDetailModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';

interface LastMileTabProps {
  trips: any[];
  getStatusBadge: (status: string) => JSX.Element;
}

const LastMileTab = ({ trips, getStatusBadge }: LastMileTabProps) => {
  const [tripsWithPackages, setTripsWithPackages] = useState<any[]>([]);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewPackage, setPreviewPackage] = useState<any>(null);
  const [selectedTripDetail, setSelectedTripDetail] = useState<any>(null);

  useEffect(() => {
    fetchTripsWithPackages();
  }, [trips]);

  const fetchTripsWithPackages = async () => {
    try {
      setLoading(true);
      
      // Fetch trips with last_mile_delivered field from database
      const { data: tripsFromDB, error: tripsError } = await supabase
        .from('trips')
        .select('*, last_mile_delivered')
        .in('status', ['approved', 'active']);

      if (tripsError) {
        console.error('Error fetching trips:', tripsError);
        setLoading(false);
        return;
      }

      const eligibleTrips = tripsFromDB || [];

      const tripsData = await Promise.all(
        eligibleTrips.map(async (trip) => {
          // Get traveler profile information
          const { data: travelerProfile, error: travelerError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, phone_number')
            .eq('id', trip.user_id)
            .single();

          if (travelerError) {
            console.error('Error fetching traveler profile:', travelerError);
          }

          // Get packages for this trip that can generate labels (same conditions as matches area)
          const { data: packages, error } = await supabase
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
            .in('status', [
              'paid', 
              'pending_purchase', 
              'purchased',
              'shipped',
              'in_transit', 
              'received_by_traveler', 
              'delivered_to_office', 
              'out_for_delivery', 
              'completed'
            ]);

          if (error) {
            console.error('Error fetching packages:', error);
            return null;
          }

          if (packages && packages.length > 0) {
            return {
              ...trip,
              packages,
              packageCount: packages.length,
              travelerProfile: travelerProfile || null
            };
          }

          return null;
        })
      );

      // Filter out null results and sort by arrival date
      const validTrips = tripsData
        .filter(trip => trip !== null)
        .sort((a, b) => new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime());

      setTripsWithPackages(validTrips);
    } catch (error) {
      console.error('Error fetching trips with packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDelivered = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ last_mile_delivered: true })
        .eq('id', tripId);

      if (error) {
        console.error('Error marking trip as delivered:', error);
        alert('Error al marcar como entregado. Inténtalo de nuevo.');
        return;
      }

      // Update local state to immediately hide the trip
      setTripsWithPackages(prev => 
        prev.map(trip => 
          trip.id === tripId 
            ? { ...trip, last_mile_delivered: true }
            : trip
        )
      );
    } catch (error) {
      console.error('Error marking trip as delivered:', error);
      alert('Error al marcar como entregado. Inténtalo de nuevo.');
    }
  };

  const generateTripLabels = async (trip: any) => {
    if (!trip.packages || trip.packages.length === 0) return;

    try {
      setGeneratingPDF(trip.id);
      
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
          root.render(React.createElement(PackageLabel, { pkg, trip }));
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

  const filteredTrips = tripsWithPackages.filter(trip => !trip.last_mile_delivered);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Cargando viajes con paquetes...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Última Milla - Entrega en Oficina</span>
          </CardTitle>
          <CardDescription>
            Viajes con paquetes asignados listos para procesamiento en oficina
          </CardDescription>
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
                <Card key={trip.id} className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
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
                          {getStatusBadge(trip.status)}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium text-primary">
                            {trip.from_city} → {trip.to_city}
                          </span>
                         </div>
                         
                         {trip.delivery_date && (
                           <div className="text-sm">
                             <span className="font-medium text-primary">
                               Entrega en oficina: {new Date(trip.delivery_date).toLocaleDateString('es-ES', {
                                 year: 'numeric',
                                 month: 'long', 
                                 day: 'numeric'
                               })}
                             </span>
                           </div>
                         )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Llegada: {new Date(trip.arrival_date).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
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
    </div>
  );
};

export default LastMileTab;