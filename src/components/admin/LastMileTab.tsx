import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, CheckCircle, Package, User, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PackageLabel } from './PackageLabel';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';

interface LastMileTabProps {
  trips: any[];
  getStatusBadge: (status: string) => JSX.Element;
}

const LastMileTab = ({ trips, getStatusBadge }: LastMileTabProps) => {
  const [tripsWithPackages, setTripsWithPackages] = useState<any[]>([]);
  const [deliveredTrips, setDeliveredTrips] = useState<Set<string>>(new Set());
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTripsWithPackages();
  }, [trips]);

  const fetchTripsWithPackages = async () => {
    try {
      setLoading(true);
      
      // Filter trips that could have packages (approved, active, completed)
      const eligibleTrips = trips.filter(trip => 
        ['approved', 'active', 'completed'].includes(trip.status)
      );

      const tripsData = await Promise.all(
        eligibleTrips.map(async (trip) => {
          // Get packages for this trip that are assigned and confirmed
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
              'matched', 
              'quote_sent', 
              'payment_pending', 
              'pending_purchase', 
              'purchased', 
              'in_transit', 
              'received_by_traveler',
              'pending_office_confirmation'
            ]);

          if (error) {
            console.error('Error fetching packages:', error);
            return null;
          }

          if (packages && packages.length > 0) {
            return {
              ...trip,
              packages,
              packageCount: packages.length
            };
          }

          return null;
        })
      );

      // Filter out null results and sort by arrival date
      const validTrips = tripsData
        .filter(trip => trip !== null)
        .sort((a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime());

      setTripsWithPackages(validTrips);
    } catch (error) {
      console.error('Error fetching trips with packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDelivered = (tripId: string) => {
    setDeliveredTrips(prev => new Set(prev).add(tripId));
  };

  const generateTripLabels = async (trip: any) => {
    if (!trip.packages || trip.packages.length === 0) return;

    try {
      setGeneratingPDF(trip.id);
      
      const pdf = new jsPDF();
      let isFirstPage = true;

      for (const pkg of trip.packages) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Create temporary container for React component
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '288px';
        tempContainer.style.height = '432px';
        document.body.appendChild(tempContainer);

        const reactContainer = document.createElement('div');
        tempContainer.appendChild(reactContainer);

        // Create and render the PackageLabel component
        const root = ReactDOM.createRoot(reactContainer);
        await new Promise<void>((resolve) => {
          root.render(React.createElement(PackageLabel, { pkg, trip }));
          setTimeout(resolve, 100);
        });

        // Convert to canvas and add to PDF
        const canvas = await html2canvas(reactContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        // Cleanup
        root.unmount();
        document.body.removeChild(tempContainer);

        // Calculate position to center label
        const centerX = (612 - 288) / 2;
        const centerY = (792 - 432) / 2;

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

  const filteredTrips = tripsWithPackages.filter(trip => !deliveredTrips.has(trip.id));

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
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-semibold text-lg">
                            {trip.fromCity} → {trip.toCity}
                          </h4>
                          {getStatusBadge(trip.status)}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Llegada: {new Date(trip.arrivalDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>Viajero: {trip.userId}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Package className="h-4 w-4" />
                            <span className="font-medium text-primary">
                              {trip.packageCount} paquete{trip.packageCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {trip.deliveryDate && (
                          <div className="text-sm">
                            <span className="font-medium text-primary">
                              Entrega en oficina: {new Date(trip.deliveryDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateTripLabels(trip)}
                        disabled={generatingPDF === trip.id}
                        className="flex items-center space-x-2"
                      >
                        <Printer className="h-4 w-4" />
                        <span>
                          {generatingPDF === trip.id ? 'Generando...' : 'Imprimir Etiquetas'}
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
    </div>
  );
};

export default LastMileTab;