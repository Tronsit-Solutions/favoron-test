import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plane, Calendar, Download, Eye } from "lucide-react";
import { usePublicTrips } from "@/hooks/usePublicTrips";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { DownloadConfigModal } from "@/components/admin/DownloadConfigModal";
import { InstagramPostGenerator } from "@/components/admin/InstagramPostGenerator";
import { InstagramPreviewModal } from "@/components/admin/InstagramPreviewModal";

interface AvailableTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AvailableTripsModal = ({ isOpen, onClose }: AvailableTripsModalProps) => {
  const { trips, loading } = usePublicTrips();
  const { user, userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const isAdmin = userRole?.role === 'admin';

  const filteredTrips = trips.filter(trip => 
    trip.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.to_city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFilteredTripsByDate = (daysLimit: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysLimit);
    
    return filteredTrips.filter(trip => {
      const arrivalDate = new Date(trip.arrival_date);
      return arrivalDate <= cutoffDate;
    });
  };

  const handleDownloadConfig = async (daysLimit: number) => {
    setIsDownloading(true);
    
    try {
      const tripsToDownload = getFilteredTripsByDate(daysLimit);
      
      if (tripsToDownload.length === 0) {
        toast({
          title: "Sin viajes",
          description: "No hay viajes disponibles en el rango de fechas seleccionado",
          variant: "destructive",
        });
        return;
      }

      // Split trips into chunks of 10
      const tripChunks = [];
      for (let i = 0; i < tripsToDownload.length; i += 10) {
        tripChunks.push(tripsToDownload.slice(i, i + 10));
      }

      // Generate and download each image
      for (let i = 0; i < tripChunks.length; i++) {
        const postElement = postRefs.current[i];
        if (!postElement) continue;

        // Force browser to render all styles properly
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(postElement, {
          backgroundColor: '#ffffff',
          scale: 1,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: false,
          scrollX: 0,
          scrollY: 0,
          width: 1080,
          height: 1080,
          logging: false,
          imageTimeout: 15000,
          removeContainer: true,
          ignoreElements: (element) => {
            return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
          },
          onclone: (clonedDoc) => {
            // Ensure all styles are properly applied in the cloned document
            const clonedElement = clonedDoc.querySelector('[data-html2canvas-ignore="false"]') || clonedDoc.body.firstChild;
            if (clonedElement && clonedElement instanceof HTMLElement) {
              clonedElement.style.transform = 'none';
              clonedElement.style.position = 'static';
            }
          }
        });

        await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              
              const now = new Date();
              const timestamp = now.toISOString().slice(0, 10);
              const fileName = tripChunks.length > 1 
                ? `hub-viajes-${i + 1}-de-${tripChunks.length}-${timestamp}.jpg`
                : `hub-viajes-${timestamp}.jpg`;
              
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
            resolve();
          }, 'image/jpeg', 0.95);
        });

        // Small delay between downloads
        if (i < tripChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      toast({
        title: "Imágenes descargadas",
        description: `Se generaron ${tripChunks.length} imagen(es) del Hub de Viajes`,
      });

    } catch (error) {
      console.error('Error downloading images:', error);
      toast({
        title: "Error",
        description: "No se pudieron descargar las imágenes",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Generate Instagram posts for preview (hidden)
  const generateInstagramPosts = () => {
    const tripChunks = [];
    for (let i = 0; i < filteredTrips.length; i += 10) {
      tripChunks.push(filteredTrips.slice(i, i + 10));
    }
    return tripChunks;
  };

  const instagramPosts = generateInstagramPosts();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col bg-gradient-to-br from-teal-500/5 via-cyan-400/5 to-emerald-500/5 p-4 sm:p-6">
          <DialogHeader className="bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-500 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <DialogTitle className="flex items-center justify-between text-white text-lg sm:text-xl">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">🌍</span>
                Hub de Viajes
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowPreviewModal(true)}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 h-8 px-3"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Vista Previa
                  </Button>
                  <Button
                    onClick={() => setShowConfigModal(true)}
                    disabled={isDownloading}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 h-8 px-3"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {isDownloading ? "Generando..." : "Descargar"}
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

        <div className="flex-shrink-0 space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600 h-4 w-4" />
            <Input
              placeholder="Buscar por origen o destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-teal-300 focus:border-teal-500 focus:ring-teal-500 h-10 sm:h-11 text-sm sm:text-base"
            />
          </div>
          
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
            <span>
              {filteredTrips.length} viaje{filteredTrips.length !== 1 ? 's' : ''} disponible{filteredTrips.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pb-2">
          {loading ? (
            <LoadingState message="Cargando viajes disponibles..." />
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-8">
              <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No hay viajes disponibles</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron viajes que coincidan con tu búsqueda." : "No hay viajes aprobados en este momento."}
              </p>
            </div>
          ) : (
            filteredTrips.map((trip, index) => (
              <div
                key={trip.id}
                className="border border-teal-200 rounded-lg p-3 sm:p-4 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all duration-300 hover:scale-105 hover:shadow-md animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
                      <span className="text-base sm:text-lg">🛫</span>
                      <span className="text-foreground font-semibold truncate max-w-[80px] sm:max-w-none">{trip.from_city}</span>
                      <span className="text-teal-500 font-bold">→</span>
                      <span className="text-foreground font-semibold truncate max-w-[80px] sm:max-w-none">{trip.to_city}</span>
                      <span className="text-base sm:text-lg">🛬</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:gap-3">
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600" />
                      <span className="font-medium">{formatDate(trip.arrival_date)}</span>
                    </div>
                    <Badge className="text-xs bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 hover:from-teal-600 hover:to-cyan-600 px-2 py-1">
                      ✨ Disponible
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Hidden Instagram Post Generators for image generation */}
    <div className="fixed -top-[10000px] -left-[10000px] pointer-events-none">
      {instagramPosts.map((tripChunk, index) => (
        <InstagramPostGenerator
          key={index}
          ref={(el) => (postRefs.current[index] = el)}
          trips={tripChunk}
          pageNumber={index + 1}
          totalPages={instagramPosts.length}
        />
      ))}
    </div>

    {/* Download Configuration Modal */}
    <DownloadConfigModal
      isOpen={showConfigModal}
      onClose={() => setShowConfigModal(false)}
      onDownload={handleDownloadConfig}
      totalTrips={filteredTrips.length}
    />

    {/* Preview Modal */}
    <InstagramPreviewModal
      isOpen={showPreviewModal}
      onClose={() => setShowPreviewModal(false)}
      trips={filteredTrips}
      onDownload={handleDownloadConfig}
    />
    </>
  );
};

export default AvailableTripsModal;