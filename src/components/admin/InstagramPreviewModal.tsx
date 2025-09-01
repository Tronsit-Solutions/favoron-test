import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import { InstagramPostGenerator } from "./InstagramPostGenerator";

interface Trip {
  id: string;
  from_city: string;
  to_city: string;
  arrival_date: string;
}

interface InstagramPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  onDownload?: (daysLimit: number) => void;
}

export const InstagramPreviewModal = ({ 
  isOpen, 
  onClose, 
  trips, 
  onDownload 
}: InstagramPreviewModalProps) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Split trips into chunks of 10
  const generatePages = () => {
    const tripChunks = [];
    for (let i = 0; i < trips.length; i += 10) {
      tripChunks.push(trips.slice(i, i + 10));
    }
    return tripChunks;
  };

  const pages = generatePages();
  const totalPages = pages.length;

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(30); // Default to 30 days
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-4">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800">
            Vista Previa - Posts de Instagram
          </DialogTitle>
          <div className="flex items-center gap-2">
            {onDownload && (
              <Button
                onClick={handleDownload}
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Todo
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          {/* Preview Container */}
          <div className="w-full max-w-md aspect-square bg-white rounded-lg shadow-lg overflow-hidden border">
            {pages.length > 0 && pages[currentPage] && (
              <div className="w-full h-full transform scale-75 origin-top-left">
                <InstagramPostGenerator
                  trips={pages[currentPage]}
                  pageNumber={currentPage + 1}
                  totalPages={totalPages}
                />
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={totalPages <= 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Página</span>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        i === currentPage
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <span>de {totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={totalPages <= 1}
                className="flex items-center gap-2"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Stats */}
          <div className="text-center text-sm text-gray-600 space-y-1">
            <p>
              <strong>{trips.length}</strong> viajes en total
            </p>
            <p>
              Se generarán <strong>{totalPages}</strong> imagen{totalPages !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};