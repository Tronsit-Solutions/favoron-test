import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PackageLabel } from './PackageLabel';
import { Download, Printer, X, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PackageLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg?: any;
  packages?: any[];
}

export const PackageLabelModal = ({ isOpen, onClose, pkg, packages }: PackageLabelModalProps) => {
  const labelRef = useRef<HTMLDivElement>(null);
  const [currentPackageIndex, setCurrentPackageIndex] = useState(0);
  
  const packageList = packages || (pkg ? [pkg] : []);
  const currentPackage = packageList[currentPackageIndex] || pkg;

  const generatePDF = async () => {
    if (!labelRef.current || !currentPackage) return;

    try {
      // Create a temporary container for rendering (hidden off-screen)
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '288px';
      tempContainer.style.height = '432px';
      tempContainer.style.backgroundColor = '#ffffff';
      document.body.appendChild(tempContainer);

      // Clone the label and force it to render at actual size (no scaling)
      const labelClone = labelRef.current.cloneNode(true) as HTMLElement;
      labelClone.style.transform = 'none';
      labelClone.style.transformOrigin = 'initial';
      labelClone.style.width = '288px';
      labelClone.style.height = '432px';
      tempContainer.appendChild(labelClone);

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

      // Clean up temporary element
      document.body.removeChild(tempContainer);

      // Create PDF with letter size (8.5" x 11") - 612x792 points at 72 DPI
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });

      // Calculate position to center 4x6" label (288x432 points) on letter page
      const centerX = (612 - 288) / 2; // 162 points
      const centerY = (792 - 432) / 2; // 180 points

      // Convert canvas to image and add to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', centerX, centerY, 288, 432);

      // Generate filename and save
      const packageId = currentPackage.id ? currentPackage.id.substring(0, 8) : 'package';
      const fileName = `etiqueta_${packageId}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  };

  const handlePrint = () => {
    if (!labelRef.current || !currentPackage) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelHTML = labelRef.current.outerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta - ${currentPackage.id ? currentPackage.id.substring(0, 8) : 'Package'}</title>
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
            <span>Vista Previa - Etiqueta PDF {packageList.length > 1 && `(${currentPackageIndex + 1}/${packageList.length})`}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Navigation for multiple packages */}
          {packageList.length > 1 && (
            <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPackageIndex(Math.max(0, currentPackageIndex - 1))}
                disabled={currentPackageIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm font-medium">
                Paquete {currentPackageIndex + 1} de {packageList.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPackageIndex(Math.min(packageList.length - 1, currentPackageIndex + 1))}
                disabled={currentPackageIndex === packageList.length - 1}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
          {/* Preview */}
          <div className="flex justify-center bg-gray-50 p-2 rounded-lg">
            <div 
              ref={labelRef} 
              className="transform scale-40 origin-center"
              style={{ transformOrigin: 'center center' }}
            >
              <PackageLabel pkg={currentPackage} />
            </div>
          </div>

          {/* Package Info */}
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Pedido:</strong> {currentPackage.item_description}</div>
            <div><strong>ID:</strong> {currentPackage.id ? currentPackage.id.substring(0, 8) : 'N/A'}</div>
            <div><strong>Estado:</strong> {currentPackage.status}</div>
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