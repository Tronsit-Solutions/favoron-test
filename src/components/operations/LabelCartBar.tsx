import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tag, Printer, Trash2, Loader2, X } from 'lucide-react';
import { LabelCartItem } from '@/hooks/useOperationsData';
import { PackageLabel } from '@/components/admin/PackageLabel';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LabelCartBarProps {
  items: LabelCartItem[];
  onClear: () => void;
  onRemoveItem: (id: string) => void;
}

const LabelCartBar = ({ items, onClear, onRemoveItem }: LabelCartBarProps) => {
  const [generating, setGenerating] = useState(false);

  if (items.length === 0) return null;

  const handlePrint = async () => {
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

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

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
        };

        const root = ReactDOM.createRoot(reactContainer);
        await new Promise<void>((resolve) => {
          root.render(
            React.createElement(PackageLabel, {
              pkg: pkgData,
              trip: tripData,
              labelNumber: item.label_number ?? undefined,
            })
          );
          setTimeout(resolve, 100);
        });

        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: 288,
          height: 432,
          windowWidth: 288,
          windowHeight: 432,
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

      const fileName = `etiquetas_recepcion_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success(`${items.length} etiqueta${items.length !== 1 ? 's' : ''} generada${items.length !== 1 ? 's' : ''}`);
      onClear();
    } catch (error) {
      console.error('Error generating labels PDF:', error);
      toast.error('Error al generar el PDF. Inténtalo de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  return (
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
              disabled={generating}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Vaciar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handlePrint}
              disabled={generating}
              className="bg-white text-primary hover:bg-white/90"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-1" />
              )}
              Imprimir {items.length} etiqueta{items.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelCartBar;
