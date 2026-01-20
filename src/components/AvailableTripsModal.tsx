import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plane, Calendar, Download, Eye, X } from "lucide-react";
import { usePublicTrips } from "@/hooks/usePublicTrips";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import html2canvas from "html2canvas";
import { InstagramTripPreview } from "./InstagramTripPreview";

interface AvailableTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AvailableTripsModal = ({ isOpen, onClose }: AvailableTripsModalProps) => {
  const { trips, loading } = usePublicTrips();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentCapturePage, setCurrentCapturePage] = useState<number>(1);
  const modalRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  React.useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
          
        if (!error && data) {
          setUserRoles(data);
        }
      } catch (error) {
        console.error('Error fetching user roles:', error);
      }
    };
    
    fetchUserRoles();
  }, [user]);

  const isAdmin = userRoles.some(role => role.role === 'admin');

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

  const generatePreview = () => {
    setShowPreview(true);
  };

  const handleDownloadJPEG = async () => {
    if (!captureRef.current) return;
    
    setIsGenerating(true);
    
    try {
      const TRIPS_PER_PAGE = 7;
      const totalPages = Math.ceil(filteredTrips.length / TRIPS_PER_PAGE);
      
      // Precargar fuentes explícitamente con pesos específicos
      try {
        await Promise.all([
          document.fonts.load('700 52px "Bricolage Grotesque"'),
          document.fonts.load('700 42px "Bricolage Grotesque"'),
          document.fonts.load('600 18px "Inter"'),
          document.fonts.load('600 16px "Inter"'),
        ]);
        console.log('Fonts preloaded successfully');
      } catch (e) {
        console.log('Font preload warning:', e);
      }
      
      // Esperar a que las fuentes estén listas
      await document.fonts?.ready;
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        setCurrentCapturePage(pageNumber);
        
        // Esperar a que React renderice la nueva página
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const element = captureRef.current;
        
        // Hacer visible para captura usando visibility
        element.style.visibility = 'visible';
        element.style.position = 'fixed';
        element.style.left = '-9999px';
        element.style.top = '0';
        element.style.zIndex = '9999';
        
        // Esperar a que se apliquen los estilos
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const canvas = await html2canvas(element, {
          backgroundColor: '#f5f5f5',
          scale: 3,
          useCORS: true,
          allowTaint: false,
          logging: true,
          width: 1080,
          height: 1350,
          windowWidth: 1080,
          windowHeight: 1350,
          scrollX: 0,
          scrollY: 0,
          imageTimeout: 0,
          foreignObjectRendering: false,
          removeContainer: false,
          onclone: (clonedDoc, clonedElement) => {
            // Forzar visibilidad completa en el clon
            clonedElement.style.visibility = 'visible';
            clonedElement.style.opacity = '1';
            clonedElement.style.position = 'static';
            clonedElement.style.left = 'auto';
            clonedElement.style.top = 'auto';
            clonedElement.style.display = 'block';
            
            // Forzar antialiasing en todos los elementos de texto
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.style) {
                (htmlEl.style as any).webkitFontSmoothing = 'antialiased';
                (htmlEl.style as any).mozOsxFontSmoothing = 'grayscale';
                htmlEl.style.textRendering = 'optimizeLegibility';
              }
            });
          }
        });
        
        // Restaurar elemento oculto
        element.style.visibility = 'hidden';
        element.style.position = 'fixed';
        element.style.left = '-9999px';
        element.style.top = '0';
        
        // Asegurar que la imagen final sea exactamente 1080x1350
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = 1080;
        finalCanvas.height = 1350;
        const ctx = finalCanvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 1080, 1350);
        }
        
        // Convertir canvas a data URL y descargar
        const dataURL = finalCanvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        const fileName = totalPages > 1 
          ? `favoron-hub-viajes-${new Date().toISOString().split('T')[0]}-pagina-${pageNumber}.png`
          : `favoron-hub-viajes-${new Date().toISOString().split('T')[0]}.png`;
        link.download = fileName;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Delay entre descargas
        if (pageNumber < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setShowPreview(false);
      setCurrentCapturePage(1);
    } catch (error) {
      console.error('Error generating PNG:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col bg-gradient-to-br from-teal-500/5 via-cyan-400/5 to-emerald-500/5 p-3 sm:p-6">
        <DialogHeader className="bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-500 -mx-3 sm:-mx-6 -mt-3 sm:-mt-6 px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-1 sm:gap-2 text-white text-base sm:text-xl">
              <span className="text-sm sm:text-xl">🌍</span>
              <span className="truncate">Hub de Viajes</span>
            </DialogTitle>
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generatePreview}
                disabled={isGenerating}
                className="ml-4 bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Eye className="h-4 w-4 mr-2" />
                {isGenerating ? "Generando..." : "Generar para Instagram"}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div ref={modalRef} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-shrink-0 space-y-2 sm:space-y-4 mt-2 sm:mt-4">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-teal-600 h-3 w-3 sm:h-4 sm:w-4" />
              <Input
                placeholder="Buscar por origen o destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 pr-2 border-teal-300 focus:border-teal-500 focus:ring-teal-500 h-9 sm:h-11 text-sm sm:text-base"
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {filteredTrips.length} viaje{filteredTrips.length !== 1 ? 's' : ''} disponible{filteredTrips.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pb-2">
            {loading ? (
              <LoadingState message="Cargando viajes disponibles..." />
            ) : filteredTrips.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Plane className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No hay viajes disponibles</h3>
                <p className="text-sm text-muted-foreground px-4">
                  {searchTerm ? "No se encontraron viajes que coincidan con tu búsqueda." : "No hay viajes aprobados en este momento."}
                </p>
              </div>
            ) : (
              filteredTrips.map((trip, index) => (
                <div
                  key={trip.id}
                  className="border border-teal-200 rounded-lg p-2 sm:p-4 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-md animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                    {/* Route section - always stacked on mobile */}
                    <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 text-xs sm:text-sm font-medium overflow-hidden">
                      <span className="text-sm sm:text-base flex-shrink-0">🛫</span>
                      <span className="text-foreground font-semibold truncate max-w-[60px] sm:max-w-[120px]" title={trip.from_city}>
                        {trip.from_city}
                      </span>
                      <span className="text-teal-500 font-bold flex-shrink-0">→</span>
                      <span className="text-foreground font-semibold truncate max-w-[60px] sm:max-w-[120px]" title={trip.to_city}>
                        {trip.to_city}
                      </span>
                      <span className="text-sm sm:text-base flex-shrink-0">🛬</span>
                    </div>
                    
                    {/* Date and badge section - separate row on mobile */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 text-teal-600 flex-shrink-0" />
                      <span className="font-medium truncate">{formatDate(trip.arrival_date)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Hidden element for capture - positioned off-screen */}
        <div 
          ref={captureRef}
          style={{
            visibility: 'hidden',
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '1080px',
            height: '1350px',
            backgroundColor: '#f5f5f5',
            overflow: 'hidden',
            boxSizing: 'border-box',
            zIndex: -1,
            pointerEvents: 'none'
          }}
        >
          <InstagramTripPreview 
            trips={trips} 
            searchTerm={searchTerm} 
            forCapture={true}
            currentPage={currentCapturePage}
          />
        </div>
      </DialogContent>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-screen w-[90vw] h-[95vh] overflow-auto p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bricolage">Preview para Instagram</DialogTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={handleDownloadJPEG}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bricolage"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generando..." : "Descargar para Instagram"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="mt-6 flex flex-col items-center">
            <div className="space-y-4">
              <div className="w-full max-w-[700px]" style={{ backgroundColor: '#f5f5f5' }}>
                <div className="w-full" style={{ aspectRatio: '4 / 5' }}>
                  <InstagramTripPreview trips={trips} searchTerm={searchTerm} forCapture={false} />
                </div>
              </div>
              <div className="text-center bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
                <p className="text-lg font-bricolage font-semibold text-gray-800 mb-1">
                  🎨 Diseño optimizado para Instagram
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  Formato portrait 1080x1350px (4:5) • Bricolage Grotesque + Inter
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default AvailableTripsModal;
