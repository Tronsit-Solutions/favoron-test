import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PackageLabel } from './PackageLabel';
import { Download, Printer, X } from 'lucide-react';
import jsPDF from 'jspdf';

interface PackageLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: any;
}

export const PackageLabelModal = ({ isOpen, onClose, pkg }: PackageLabelModalProps) => {
  const labelRef = useRef<HTMLDivElement>(null);

  const generatePDF = () => {
    if (!labelRef.current) return;

    // Create PDF with letter size (8.5x11 inches = 612x792 points at 72 DPI)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter'
    });

    // Get the hidden label element for PDF (full size, no scaling)
    const hiddenLabelElement = document.getElementById('hidden-pdf-label');
    if (!hiddenLabelElement) return;
    
    // Calculate position to center 4x6" label (288x432 pt) on letter paper (612x792 pt)
    const centerX = (612 - 288) / 2; // 162 pt
    const centerY = (792 - 432) / 2; // 180 pt
    
    // Temporarily move the element to visible area for capture
    const originalStyle = hiddenLabelElement.style.cssText;
    hiddenLabelElement.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 9999; background: white;';
    
    // Wait a bit for rendering, then capture
    setTimeout(() => {
      pdf.html(hiddenLabelElement, {
        callback: function (doc) {
          // Restore original positioning
          hiddenLabelElement.style.cssText = originalStyle;
          
          const packageId = pkg.id ? pkg.id.substring(0, 8) : 'package';
          const fileName = `etiqueta_${packageId}_${new Date().toISOString().split('T')[0]}.pdf`;
          doc.save(fileName);
        },
        x: centerX,
        y: centerY,
        width: 288,
        windowWidth: 288,
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: true
        }
      });
    }, 100);
  };

  const handlePrint = () => {
    if (!labelRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelHTML = labelRef.current.outerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta - ${pkg.id ? pkg.id.substring(0, 8) : 'Package'}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: monospace;
              background: white;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .label { page-break-after: always; }
            }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${labelHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Vista Previa - Etiqueta PDF</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Preview */}
          <div className="flex justify-center bg-gray-50 p-2 rounded-lg">
            <div 
              ref={labelRef} 
              className="transform scale-40 origin-center"
              style={{ transformOrigin: 'center center' }}
            >
              <PackageLabel pkg={pkg} />
            </div>
          </div>

          {/* Hidden element for PDF generation - full size, not scaled */}
          <div 
            id="hidden-pdf-label" 
            className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none"
            style={{ width: '288px', height: '432px' }}
          >
            <PackageLabel pkg={pkg} />
          </div>

          {/* Package Info */}
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Pedido:</strong> {pkg.item_description}</div>
            <div><strong>ID:</strong> {pkg.id ? pkg.id.substring(0, 8) : 'N/A'}</div>
            <div><strong>Estado:</strong> {pkg.status}</div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button onClick={generatePDF} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};