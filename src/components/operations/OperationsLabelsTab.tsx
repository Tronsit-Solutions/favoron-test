import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tag, Loader2, Printer, MapPin, Calendar, RefreshCw, 
  Package, User, Eye, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { formatDateUTC } from '@/lib/formatters';
import { PackageLabelModal } from '@/components/admin/PackageLabelModal';
import { PackageLabel } from '@/components/admin/PackageLabel';
import { TripDetailModal } from '@/components/dashboard/TripDetailModal';
import { TripWithPackages, LabelBatch } from '@/hooks/useOperationsData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { History } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OperationsLabelsTabProps {
  trips: TripWithPackages[];
  loading: boolean;
  onRefresh: () => void;
  labelHistory: LabelBatch[];
  onRestoreFromHistory: (batchId: string) => void;
  onDeleteFromHistory: (batchId: string) => void;
}

// Helper function to check if delivery is overdue
const isDeliveryOverdue = (deliveryDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  return delivery < today;
};

const OperationsLabelsTab = ({ trips, loading, onRefresh, labelHistory, onRestoreFromHistory, onDeleteFromHistory }: OperationsLabelsTabProps) => {
  const { toast } = useToast();
  const [selectedTrip, setSelectedTrip] = useState<TripWithPackages | null>(null);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedTripDetail, setSelectedTripDetail] = useState<TripWithPackages | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Filter out trips already marked as delivered
  const filteredTrips = trips.filter(trip => !trip.last_mile_delivered);

  const handleOpenLabels = (trip: TripWithPackages) => {
    setSelectedTrip(trip);
    setShowLabelModal(true);
  };

  const handleMarkAsDelivered = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ last_mile_delivered: true })
        .eq('id', tripId);

      if (error) {
        console.error('Error marking trip as delivered:', error);
        toast({
          title: "Error",
          description: "Error al marcar como entregado. Inténtalo de nuevo.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Éxito",
        description: "Viaje marcado como entregado correctamente.",
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error marking trip as delivered:', error);
      toast({
        title: "Error",
        description: "Error al marcar como entregado. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const generateTripLabels = async (trip: TripWithPackages) => {
    if (!trip.packages || trip.packages.length === 0) return;

    try {
      setGeneratingPDF(trip.id);
      
      // Get or generate label numbers for all packages
      const labelNumbers: number[] = [];
      
      for (let i = 0; i < trip.packages.length; i++) {
        const pkg = trip.packages[i];
        
        if (pkg.label_number) {
          labelNumbers.push(pkg.label_number);
        } else {
          try {
            const { data, error } = await supabase.rpc('get_next_label_number');
            if (error) {
              console.error('Error getting label number:', error);
              labelNumbers.push(0);
            } else {
              labelNumbers.push(data);
              
              await supabase
                .from('packages')
                .update({ label_number: data })
                .eq('id', pkg.id);
            }
          } catch (error) {
            console.error('Error generating label number:', error);
            labelNumbers.push(0);
          }
        }
      }
      
      const React = await import('react');
      const ReactDOM = await import('react-dom/client');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });

      for (let i = 0; i < trip.packages.length; i++) {
        const pkg = trip.packages[i];
        const labelNumber = labelNumbers[i];
        
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '288px';
        tempContainer.style.height = '432px';
        tempContainer.style.backgroundColor = '#ffffff';
        document.body.appendChild(tempContainer);

        const reactContainer = document.createElement('div');
        tempContainer.appendChild(reactContainer);

        // Prepare trip data for PackageLabel
        const tripData = {
          id: trip.id,
          from_city: trip.from_city,
          to_city: trip.to_city,
          arrival_date: trip.arrival_date,
          delivery_date: trip.delivery_date,
        };

        const root = ReactDOM.createRoot(reactContainer);
        await new Promise<void>((resolve) => {
          root.render(React.createElement(PackageLabel, { pkg, trip: tripData, labelNumber }));
          setTimeout(resolve, 100);
        });

        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: 288,
          height: 432,
          windowWidth: 288,
          windowHeight: 432
        });

        root.unmount();
        document.body.removeChild(tempContainer);

        if (i > 0) {
          pdf.addPage();
        }

        const centerX = (612 - 288) / 2;
        const centerY = (792 - 432) / 2;

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', centerX, centerY, 288, 432);
      }

      const tripId = trip.id ? trip.id.substring(0, 8) : 'viaje';
      const fileName = `etiquetas_${tripId}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF generado",
        description: `Se generaron ${trip.packages.length} etiquetas correctamente.`,
      });

    } catch (error) {
      console.error('Error generating labels PDF:', error);
      toast({
        title: "Error",
        description: "Error al generar el PDF. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setGeneratingPDF(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      'approved': { label: 'Aprobado', variant: 'default' },
      'active': { label: 'Activo', variant: 'secondary' },
      'pending_approval': { label: 'Pendiente', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Tag className="h-5 w-5" />
                <span>Etiquetas - Entrega en Oficina</span>
              </CardTitle>
              <CardDescription>
                Viajes con paquetes asignados listos para procesamiento en oficina
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {labelHistory.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
                  <History className="h-4 w-4 mr-2" />
                  Historial ({labelHistory.length})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
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
                    trip.delivery_date && isDeliveryOverdue(trip.delivery_date)
                      ? 'border-l-red-600 bg-gradient-to-r from-red-50 to-red-100/30 border-red-200 dark:from-red-950/20 dark:to-red-900/10'
                      : 'border-l-primary bg-gradient-to-r from-primary/5 to-transparent'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-semibold text-lg">
                            {trip.traveler_name || 'Sin información del viajero'}
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
                              trip.delivery_date && isDeliveryOverdue(trip.delivery_date)
                                ? 'text-red-600 font-bold'
                                : 'text-primary'
                            }`}>
                              Entrega en oficina: {trip.delivery_date ? formatDateUTC(trip.delivery_date) : 'No definida'}
                            </span>
                          </div>
                          {trip.delivery_date && isDeliveryOverdue(trip.delivery_date) && (
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
                              {trip.packages.length} paquete{trip.packages.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {trip.traveler_email && (
                          <div className="text-sm text-muted-foreground">
                            <span>Email: {trip.traveler_email}</span>
                          </div>
                        )}

                        {trip.traveler_phone && (
                          <div className="text-sm text-muted-foreground">
                            <span>Teléfono: {trip.traveler_phone}</span>
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
                        className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                      >
                        <User className="h-4 w-4" />
                        <span>Ver Detalles</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenLabels(trip)}
                        className="flex items-center space-x-2 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Vista Previa Etiquetas ({trip.packages.length})</span>
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

      {showLabelModal && selectedTrip && selectedTrip.packages.length > 0 && (
        <PackageLabelModal
          isOpen={showLabelModal}
          onClose={() => {
            setShowLabelModal(false);
            setSelectedTrip(null);
          }}
          packages={selectedTrip.packages}
        />
      )}

      {selectedTripDetail && (
        <TripDetailModal
          isOpen={!!selectedTripDetail}
          onClose={() => setSelectedTripDetail(null)}
          trip={{
            id: selectedTripDetail.id,
            from_city: selectedTripDetail.from_city,
            to_city: selectedTripDetail.to_city,
            arrival_date: selectedTripDetail.arrival_date,
            delivery_date: selectedTripDetail.delivery_date || '',
            first_day_packages: selectedTripDetail.first_day_packages || '',
            last_day_packages: selectedTripDetail.last_day_packages || '',
            status: selectedTripDetail.status,
            user_id: selectedTripDetail.traveler_id,
          }}
          getStatusBadge={getStatusBadge}
          packages={selectedTripDetail.packages}
        />
      )}
      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de lotes
            </DialogTitle>
          </DialogHeader>
          {labelHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay lotes anteriores
            </p>
          ) : (
            <div className="space-y-3">
              {labelHistory.map((batch) => (
                <div key={batch.id} className="p-4 rounded-lg border bg-card space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                        {batch.items.length} etiqueta{batch.items.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(batch.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => { onRestoreFromHistory(batch.id); setHistoryOpen(false); }}>
                        Restaurar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDeleteFromHistory(batch.id)} className="text-destructive hover:text-destructive">
                        <Tag className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 pt-1">
                    {batch.items.map((item) => {
                      const desc = item.products_data?.[0]?.itemDescription || item.item_description || '';
                      return (
                        <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
                          {item.label_number != null && (
                            <span className="font-mono font-medium text-foreground">#{String(item.label_number).padStart(4, '0')}</span>
                          )}
                          <span className="truncate">
                            {item.shopper_name}{desc ? ` — ${desc}` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperationsLabelsTab;
