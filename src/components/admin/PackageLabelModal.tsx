import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PackageLabel } from './PackageLabel';
import { Download, Printer, X, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import jsPDF from 'jspdf';
import { drawLabelToPDF, preloadLabelAssets } from '@/lib/pdfLabelDrawer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PackageLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg?: any;
  packages?: any[];
}

export const PackageLabelModal = ({ isOpen, onClose, pkg, packages }: PackageLabelModalProps) => {
  const labelRef = useRef<HTMLDivElement>(null);
  const [currentPackageIndex, setCurrentPackageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [customDescriptions, setCustomDescriptions] = useState<{ [packageIndex: number]: { [productIndex: number]: string } }>({});
  const [labelNumbers, setLabelNumbers] = useState<{ [packageIndex: number]: number }>({});
  const [isGeneratingLabels, setIsGeneratingLabels] = useState(false);
  const { toast } = useToast();
  
  const packageList = packages && packages.length > 0 ? packages : (pkg ? [pkg] : []);
  const currentPackage = packageList[currentPackageIndex];

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLabelNumbers({});
    }
  }, [isOpen]);
  
  // Don't render if no packages - MUST be after all hooks
  if (!isOpen || packageList.length === 0) {
    return null;
  }

  const generateLabelNumbers = async () => {
    setIsGeneratingLabels(true);
    console.log('🏷️ Processing label numbers for', packageList.length, 'packages');
    const newLabelNumbers: { [packageIndex: number]: number } = {};
    
    for (let i = 0; i < packageList.length; i++) {
      const p = packageList[i];
      try {
        // Reuse existing label number if present
        if (p.label_number) {
          console.log('✅ Package already has label number:', p.label_number);
          newLabelNumbers[i] = p.label_number;
          continue;
        }

        // Generate a new label number only if missing
        const { data, error } = await supabase.rpc('get_next_label_number');
        if (error || data === null) {
          console.error('Error getting label number:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo obtener el número de etiqueta"
          });
          continue;
        }

        // Persist the label number to the package
        const { error: updateError } = await supabase
          .from('packages')
          .update({ label_number: data })
          .eq('id', p.id);

        if (updateError) {
          console.error('Error saving label number:', updateError);
        } else {
          // Update local reference so subsequent calls reuse it
          p.label_number = data;
        }

        console.log('🆕 Assigned label number for package', p.id, ':', data);
        newLabelNumbers[i] = data;
      } catch (error) {
        console.error('Error generating/saving label number:', error);
      }
    }
    
    console.log('📋 All label numbers:', newLabelNumbers);
    setLabelNumbers(newLabelNumbers);
    setIsGeneratingLabels(false);
    return newLabelNumbers;
  };

  // Get or set custom descriptions for current package
  const getCurrentCustomDescriptions = () => customDescriptions[currentPackageIndex] || {};
  
  const updateProductDescription = (productIndex: number, description: string) => {
    setCustomDescriptions(prev => ({
      ...prev,
      [currentPackageIndex]: {
        ...prev[currentPackageIndex],
        [productIndex]: description
      }
    }));
  };

  // Get initial descriptions for editing
  const getInitialDescriptions = () => {
    if (currentPackage.products_data && Array.isArray(currentPackage.products_data)) {
      return currentPackage.products_data.map((product, index) => 
        getCurrentCustomDescriptions()[index] || product.itemDescription || ''
      );
    }
    return [getCurrentCustomDescriptions()[0] || currentPackage.item_description || ''];
  };

  const generatePDF = async () => {
    if (!packageList || packageList.length === 0) return;

    try {
      setIsGeneratingLabels(true);
      // Generate label numbers only when actually downloading
      console.log('🏷️ Generating label numbers for PDF download...');
      const newLabelNumbers = await generateLabelNumbers();
      
      toast({
        title: "Números asignados",
        description: `Se asignaron ${packageList.length} número(s) de etiqueta`,
      });

      // Create PDF with letter size (8.5" x 11") - 612x792 points at 72 DPI
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });

      // Label dimensions (4x6 inches = 288x432 points)
      const labelWidth = 288;
      const labelHeight = 432;
      
      let isFirstPage = true;

      for (let i = 0; i < packageList.length; i++) {
        const packageItem = packageList[i];
        
        // Add new page for each label (except the first one)
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Calculate position to center the label on the page
        const x = (612 - labelWidth) / 2; // Center horizontally
        const y = (792 - labelHeight) / 2; // Center vertically

        // Create a temporary container for rendering (hidden off-screen)
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = `${labelWidth}px`;
        tempContainer.style.height = `${labelHeight}px`;
        tempContainer.style.backgroundColor = '#ffffff';
        document.body.appendChild(tempContainer);

        // Create a new PackageLabel component for this package
        const tempLabelContainer = document.createElement('div');
        tempLabelContainer.style.width = `${labelWidth}px`;
        tempLabelContainer.style.height = `${labelHeight}px`;
        tempContainer.appendChild(tempLabelContainer);

        // Render PackageLabel component with correct index
        const root = ReactDOM.createRoot(tempLabelContainer);
        await new Promise<void>((resolve) => {
          root.render(React.createElement(PackageLabel, { 
            pkg: packageItem, 
            customDescriptions: customDescriptions[i],
            labelNumber: newLabelNumbers[i]
          }));
          setTimeout(resolve, 100);
        });

        // Use html2canvas to capture the element
        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: labelWidth,
          height: labelHeight,
          windowWidth: labelWidth,
          windowHeight: labelHeight
        });

        // Clean up temporary element
        root.unmount();
        document.body.removeChild(tempContainer);

        // Convert canvas to image and add to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', x, y, labelWidth, labelHeight);
      }

      // Generate filename and save
      const fileName = packageList.length === 1 
        ? `etiqueta_${packageList[0].id ? packageList[0].id.substring(0, 8) : 'package'}_${new Date().toISOString().split('T')[0]}.pdf`
        : `etiquetas_unificadas_${packageList.length}_paquetes_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  };

  const handlePrint = async () => {
    if (!labelRef.current || !currentPackage) return;

    setIsGeneratingLabels(true);
    // Generate label numbers only when actually printing
    console.log('🏷️ Generating label numbers for printing...');
    const newLabelNumbers = await generateLabelNumbers();
    
    toast({
      title: "Número asignado",
      description: "Se asignó número de etiqueta para impresión",
    });

    // Wait a moment for state to update
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsGeneratingLabels(false);

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
           <div className="flex justify-center bg-gray-50 p-2 rounded-lg relative">
             {isGeneratingLabels && (
               <div className="absolute inset-0 bg-gray-100/80 flex items-center justify-center z-10 rounded-lg">
                 <div className="text-center">
                   <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                   <p className="text-sm font-medium text-gray-700">Asignando números...</p>
                 </div>
               </div>
             )}
              <div 
                ref={labelRef} 
                className="transform scale-40 origin-center"
                style={{ transformOrigin: 'center center' }}
              >
                 <PackageLabel 
                   pkg={currentPackage} 
                   customDescriptions={getCurrentCustomDescriptions()}
                   labelNumber={labelNumbers[currentPackageIndex] ?? currentPackage?.label_number ?? (currentPackageIndex + 1)}
                 />
               </div>
                {!(labelNumbers[currentPackageIndex] ?? currentPackage?.label_number) && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Vista previa - Número se asignará al descargar/imprimir
                  </div>
                )}
            </div>

           {/* Edit Mode */}
           {isEditing && (
             <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
               <h4 className="font-medium text-sm">Editar descripciones:</h4>
               {getInitialDescriptions().map((description, index) => (
                 <div key={index} className="space-y-1">
                   <label className="text-xs font-medium">
                     {currentPackage.products_data && Array.isArray(currentPackage.products_data) 
                       ? `Producto ${index + 1}:` 
                       : 'Descripción:'}
                   </label>
                   <Textarea
                     value={description}
                     onChange={(e) => updateProductDescription(index, e.target.value)}
                     placeholder="Descripción del producto..."
                     className="text-xs h-16 resize-none"
                   />
                 </div>
               ))}
               <div className="flex space-x-2">
                 <Button size="sm" onClick={() => setIsEditing(false)}>
                   Aplicar cambios
                 </Button>
                 <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                   Cancelar
                 </Button>
               </div>
             </div>
           )}

           {/* Package Info */}
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Pedido:</strong> {currentPackage.item_description}</div>
            <div><strong>ID:</strong> {currentPackage.id ? currentPackage.id.substring(0, 8) : 'N/A'}</div>
            <div><strong>Estado:</strong> {currentPackage.status}</div>
            <div>
              <strong>Etiqueta:</strong>{' '}
              {(labelNumbers[currentPackageIndex] ?? currentPackage?.label_number) != null
                ? <span className="text-green-600 font-medium">#{String((labelNumbers[currentPackageIndex] ?? currentPackage?.label_number) as number).padStart(4, '0')} (Asignado)</span>
                : <span className="text-blue-600 font-medium">P{String(currentPackageIndex + 1).padStart(3, '0')} (Preview - se asignará número real al descargar)</span>}
            </div>
          </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button 
                onClick={() => setIsEditing(!isEditing)} 
                variant="outline" 
                size="sm"
                className="flex-none"
                disabled={isGeneratingLabels}
              >
                <Edit className="h-4 w-4 mr-1" />
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
              <Button onClick={generatePDF} className="flex-1" disabled={isGeneratingLabels}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
              <Button onClick={handlePrint} variant="outline" className="flex-1" disabled={isGeneratingLabels}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};