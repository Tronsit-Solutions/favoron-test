import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tag, Printer, Trash2, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { LabelCartItem } from '@/hooks/useOperationsData';
import { PackageLabel } from '@/components/admin/PackageLabel';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface LabelCartBarProps {
  items: LabelCartItem[];
  onClear: () => void;
  onRemoveItem: (id: string) => void;
}

const LABELS_PER_PAGE = 4;

const LabelCartBar = ({ items, onClear, onRemoveItem }: LabelCartBarProps) => {
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(items.length / LABELS_PER_PAGE);

  const currentPageItems = useMemo(() => {
    const start = currentPage * LABELS_PER_PAGE;
    return items.slice(start, start + LABELS_PER_PAGE);
  }, [items, currentPage]);

  // Reset page if items change and current page is out of bounds
  if (currentPage >= totalPages && totalPages > 0) {
    setCurrentPage(totalPages - 1);
  }

  if (items.length === 0) {
    if (previewOpen) setPreviewOpen(false);
    return null;
  }

  const buildLabelData = (item: LabelCartItem) => {
    const tripData = {
      id: '',
      from_city: item.trip_from_city || '',
      to_city: item.trip_to_city || '',
      arrival_date: '',
      delivery_date: '',
      first_name: item.traveler_name?.split(' ')[0] || '',
      last_name: item.traveler_name?.split(' ').slice(1).join(' ') || '',
    };

    const pkgData = {
      id: item.id,
      item_description: item.item_description,
      products_data: item.products_data,
      confirmed_delivery_address: item.confirmed_delivery_address,
      delivery_method: item.delivery_method,
      shopper_name: item.shopper_name,
      estimated_price: item.estimated_price,
      created_at: item.created_at,
      __compact: true,
    };

    return { tripData, pkgData, labelNumber: item.label_number ?? undefined };
  };

  const handleDownloadPDF = async () => {
    if (items.length === 0) return;

    try {
      setGenerating(true);

      const React = await import('react');
      const ReactDOM = await import('react-dom/client');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter',
      });

      // Compact label size
      const labelW = 252;
      const labelH = 360;

      // 4 positions on a letter page (612x792)
      const positions = [
        { x: 18, y: 18 },
        { x: 342, y: 18 },
        { x: 18, y: 414 },
        { x: 342, y: 414 },
      ];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const posIndex = i % LABELS_PER_PAGE;

        if (i > 0 && posIndex === 0) {
          pdf.addPage();
        }

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = `${labelW}px`;
        tempContainer.style.height = `${labelH}px`;
        tempContainer.style.backgroundColor = '#ffffff';
        document.body.appendChild(tempContainer);

        const reactContainer = document.createElement('div');
        tempContainer.appendChild(reactContainer);

        const { tripData, pkgData, labelNumber } = buildLabelData(item);

        const root = ReactDOM.createRoot(reactContainer);
        await new Promise<void>((resolve) => {
          root.render(
            React.createElement(PackageLabel, {
              pkg: pkgData,
              trip: tripData,
              labelNumber,
            })
          );
          setTimeout(resolve, 100);
        });

        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: labelW,
          height: labelH,
          windowWidth: labelW,
          windowHeight: labelH,
        });

        root.unmount();
        document.body.removeChild(tempContainer);

        const pos = positions[posIndex];
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', pos.x, pos.y, labelW, labelH);
      }

      const fileName = `etiquetas_recepcion_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success(`${items.length} etiqueta${items.length !== 1 ? 's' : ''} generada${items.length !== 1 ? 's' : ''}`);
      setPreviewOpen(false);
      onClear();
    } catch (error) {
      console.error('Error generating labels PDF:', error);
      toast.error('Error al generar el PDF. Inténtalo de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRemoveFromPreview = (id: string) => {
    onRemoveItem(id);
  };

  return (
    <>
      {/* Floating bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-primary text-primary-foreground shadow-lg border-t border-primary/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5" />
              <span className="font-medium">
                {items.length} etiqueta{items.length !== 1 ? 's' : ''} lista{items.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={onClear}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Vaciar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setCurrentPage(0); setPreviewOpen(true); }}
                className="bg-white text-primary hover:bg-white/90"
              >
                <Printer className="h-4 w-4 mr-1" />
                Imprimir {items.length} etiqueta{items.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Vista previa de etiquetas
            </DialogTitle>
          </DialogHeader>

          {/* Page simulation */}
          <div className="bg-muted/50 rounded-lg p-4 flex justify-center">
            <div
              className="bg-white border shadow-sm rounded grid grid-cols-2 gap-2 p-3"
              style={{ width: '540px' }}
            >
              {currentPageItems.map((item) => {
                const { tripData, pkgData, labelNumber } = buildLabelData(item);
                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => handleRemoveFromPreview(item.id)}
                      className="absolute -top-1 -right-1 z-10 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
                      <PackageLabel
                        pkg={pkgData}
                        trip={tripData}
                        labelNumber={labelNumber}
                      />
                    </div>
                  </div>
                );
              })}
              {/* Fill empty slots with placeholder */}
              {Array.from({ length: LABELS_PER_PAGE - currentPageItems.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="border-2 border-dashed border-muted-foreground/20 rounded flex items-center justify-center"
                  style={{ width: '252px', height: '360px' }}
                >
                  <span className="text-muted-foreground/40 text-xs">Vacío</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Hoja {currentPage + 1} de {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <DialogFooter className="flex-row justify-between sm:justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {items.length} etiqueta{items.length !== 1 ? 's' : ''} en {totalPages} hoja{totalPages !== 1 ? 's' : ''}
            </span>
            <Button
              onClick={handleDownloadPDF}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LabelCartBar;
