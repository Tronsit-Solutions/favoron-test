import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Eye, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PurchaseConfirmationViewerProps {
  purchaseConfirmation: {
    filename: string;
    uploadedAt: string;
    type?: string;
    filePath?: string;
  };
  packageId: string;
  className?: string;
}

const PurchaseConfirmationViewer = ({ purchaseConfirmation, packageId, className }: PurchaseConfirmationViewerProps) => {
  const [showModal, setShowModal] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isImage = purchaseConfirmation.filename?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

  const generateSignedUrl = async () => {
    if (signedUrl) return signedUrl;
    
    setLoading(true);
    try {
      // Determine the correct file path
      let filePath: string;
      
      if ('filePath' in purchaseConfirmation && purchaseConfirmation.filePath) {
        // New format: has filePath
        filePath = purchaseConfirmation.filePath;
      } else {
        // Old format: construct path with packageId
        filePath = `${packageId}/${purchaseConfirmation.filename}`;
      }

      console.log('Attempting to access file at path:', filePath);
      
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error generating signed URL:', error);
        toast({
          title: "Error",
          description: "No se pudo generar la URL para mostrar el archivo",
          variant: "destructive",
        });
        return null;
      }

      setSignedUrl(data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la URL para mostrar el archivo",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    const url = await generateSignedUrl();
    if (url) {
      if (isImage) {
        setShowModal(true);
      } else {
        window.open(url, '_blank');
      }
    }
  };

  const handleDownload = async () => {
    const url = await generateSignedUrl();
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = purchaseConfirmation.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Descarga iniciada",
        description: "El comprobante de compra se está descargando",
      });
    }
  };

  return (
    <>
      <Card className={`border-purple-200 bg-purple-50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg text-purple-700">
            <FileText className="h-5 w-5" />
            <span>Comprobante de Compra</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-purple-600">
              <p><strong>Archivo:</strong> {purchaseConfirmation.filename}</p>
              {purchaseConfirmation.uploadedAt && (
                <p><strong>Subido:</strong> {new Date(purchaseConfirmation.uploadedAt).toLocaleDateString('es-GT')}</p>
              )}
            </div>

            {/* Preview thumbnail for images */}
            {isImage && (
              <div className="mt-3">
                <img 
                  src={signedUrl || ''} 
                  alt="Vista previa del comprobante"
                  className="max-w-32 max-h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleView}
                  onLoad={() => generateSignedUrl()}
                />
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleView}
                disabled={loading}
                className="text-purple-600 border-purple-300 hover:bg-purple-100"
              >
                {loading ? (
                  "Cargando..."
                ) : (
                  <>
                    {isImage ? <Eye className="h-4 w-4 mr-1" /> : <ExternalLink className="h-4 w-4 mr-1" />}
                    {isImage ? 'Ver' : 'Abrir'}
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={loading}
                className="text-purple-600 border-purple-300 hover:bg-purple-100"
              >
                <Download className="h-4 w-4 mr-1" />
                Descargar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal for image preview */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Comprobante de Compra - {purchaseConfirmation.filename}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {signedUrl && (
              <img 
                src={signedUrl} 
                alt="Comprobante de compra"
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PurchaseConfirmationViewer;