import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tag, Printer, Trash2, Loader2, X, ChevronLeft, ChevronRight, History, RotateCcw, Pencil, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { LabelCartItem, LabelBatch } from '@/hooks/useOperationsData';
import { PackageLabel } from '@/components/admin/PackageLabel';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { drawLabelToPDF, preloadLabelAssets } from '@/lib/pdfLabelDrawer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LabelCartBarProps {
  items: LabelCartItem[];
  onClear: () => void;
  onRemoveItem: (id: string) => void;
  labelHistory: LabelBatch[];
  onRestoreFromHistory: (batchId: string) => void;
  onRestoreItemFromHistory: (batchId: string, itemId: string) => void;
  onDeleteFromHistory: (batchId: string) => void;
}

const LABELS_PER_PAGE = 4;

const LabelCartBar = ({ items, onClear, onRemoveItem, labelHistory, onRestoreFromHistory, onRestoreItemFromHistory, onDeleteFromHistory }: LabelCartBarProps) => {
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [customDescriptions, setCustomDescriptions] = useState<{ [packageId: string]: { [productIndex: number]: string } }>({});
  const [tempDescriptions, setTempDescriptions] = useState<{ [productIndex: number]: string }>({});

  const totalPages = Math.ceil(items.length / LABELS_PER_PAGE);

  const currentPageItems = useMemo(() => {
    const start = currentPage * LABELS_PER_PAGE;
    return items.slice(start, start + LABELS_PER_PAGE);
  }, [items, currentPage]);

  // Reset page if items change and current page is out of bounds
  if (currentPage >= totalPages && totalPages > 0) {
    setCurrentPage(totalPages - 1);
  }

  if (items.length === 0 && !historyOpen) {
    return labelHistory.length > 0 ? (
      <>
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <Button
            onClick={() => setHistoryOpen(true)}
            className="shadow-xl rounded-full px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <History className="h-4 w-4 mr-2" />
            Historial de lotes ({labelHistory.length})
          </Button>
        </div>
        <HistoryDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          history={labelHistory}
          onRestore={onRestoreFromHistory}
          onRestoreItem={onRestoreItemFromHistory}
          onDelete={onDeleteFromHistory}
        />
      </>
    ) : null;
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

  const startEditing = (item: LabelCartItem) => {
    setEditingItemId(item.id);
    const existing = customDescriptions[item.id] || {};
    if (item.products_data && Array.isArray(item.products_data)) {
      const descs: { [idx: number]: string } = {};
      item.products_data.forEach((p: any, i: number) => {
        if (!p.cancelled) {
          descs[i] = existing[i] || p.itemDescription || '';
        }
      });
      setTempDescriptions(descs);
    } else {
      setTempDescriptions({ 0: existing[0] || item.item_description || '' });
    }
  };

  const applyEditing = () => {
    if (editingItemId) {
      setCustomDescriptions(prev => ({ ...prev, [editingItemId]: { ...tempDescriptions } }));
      setEditingItemId(null);
    }
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setTempDescriptions({});
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

      const labelW = 252;
      const labelH = 360;

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
              customDescriptions: customDescriptions[item.id],
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
              {labelHistory.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setHistoryOpen(true)}
                >
                  <History className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Historial</span>
                  <span className="ml-1 text-xs">({labelHistory.length})</span>
                </Button>
              )}
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
            <DialogTitle>Vista previa de etiquetas</DialogTitle>
          </DialogHeader>

          <div className="bg-muted/50 rounded-lg p-4 flex justify-center">
            <div
              className="bg-white border shadow-sm rounded grid grid-cols-2 gap-2 p-3"
              style={{ width: '540px' }}
            >
              {currentPageItems.map((item) => {
                const { tripData, pkgData, labelNumber } = buildLabelData(item);
                return (
                  <div key={item.id} className="relative group">
                    <div className="absolute -top-1 -right-1 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(item)}
                        className="bg-primary text-primary-foreground rounded-full p-0.5"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {editingItemId === item.id && (
                      <div className="absolute inset-0 z-10 border-2 border-primary rounded pointer-events-none" />
                    )}
                    <div style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
                      <PackageLabel pkg={pkgData} trip={tripData} labelNumber={labelNumber} customDescriptions={customDescriptions[item.id]} />
                    </div>
                  </div>
                );
              })}
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

          {/* Editing panel */}
          {editingItemId && (() => {
            const editItem = items.find(i => i.id === editingItemId);
            if (!editItem) return null;
            return (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Editando: {editItem.shopper_name} — {editItem.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(tempDescriptions).map(([idx, desc]) => {
                    const productIndex = parseInt(idx);
                    const product = editItem.products_data?.[productIndex];
                    return (
                      <div key={idx}>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Producto {productIndex + 1}{product?.quantity && parseInt(String(product.quantity)) > 1 ? ` (${product.quantity}x)` : ''}
                        </label>
                        <Textarea
                          value={desc}
                          onChange={(e) => setTempDescriptions(prev => ({ ...prev, [productIndex]: e.target.value }))}
                          className="min-h-[40px] text-sm"
                          rows={2}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={cancelEditing}>Cancelar</Button>
                  <Button size="sm" onClick={applyEditing}>
                    <Check className="h-3 w-3 mr-1" />
                    Aplicar
                  </Button>
                </div>
              </div>
            );
          })()}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Hoja {currentPage + 1} de {totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <DialogFooter className="flex-row justify-between sm:justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {items.length} etiqueta{items.length !== 1 ? 's' : ''} en {totalPages} hoja{totalPages !== 1 ? 's' : ''}
            </span>
            <Button onClick={handleDownloadPDF} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
              Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={labelHistory}
        onRestore={(batchId) => {
          onRestoreFromHistory(batchId);
          setHistoryOpen(false);
          setTimeout(() => {
            setCurrentPage(0);
            setPreviewOpen(true);
          }, 100);
        }}
        onRestoreItem={onRestoreItemFromHistory}
        onDelete={onDeleteFromHistory}
      />
    </>
  );
};

// ============= History Dialog =============

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: LabelBatch[];
  onRestore: (batchId: string) => void;
  onRestoreItem: (batchId: string, itemId: string) => void;
  onDelete: (batchId: string) => void;
}

const HistoryDialog = ({ open, onOpenChange, history, onRestore, onRestoreItem, onDelete }: HistoryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de lotes
          </DialogTitle>
        </DialogHeader>

        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay lotes anteriores
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((batch) => (
              <div
                key={batch.id}
                className="p-4 rounded-lg border bg-card space-y-3"
              >
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRestore(batch.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Restaurar todo
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(batch.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {batch.items.map((item) => {
                    const desc = item.products_data?.[0]?.itemDescription || item.item_description || '';
                    return (
                      <div key={item.id} className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 p-2.5">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 text-sm">
                            {item.label_number != null && (
                              <span className="font-mono font-semibold text-foreground">#{String(item.label_number).padStart(4, '0')}</span>
                            )}
                            <span className="font-medium text-foreground">{item.shopper_name}</span>
                          </div>
                          {desc && (
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 shrink-0"
                          onClick={() => onRestoreItem(batch.id, item.id)}
                          title="Restaurar este paquete"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
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
  );
};

export default LabelCartBar;
