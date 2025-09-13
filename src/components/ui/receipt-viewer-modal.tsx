import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, X, AlertCircle, RotateCcw } from "lucide-react";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl?: string;
  filename?: string;
  title?: string;
}

export function ReceiptViewerModal({ 
  isOpen, 
  onClose, 
  receiptUrl, 
  filename, 
  title = "Comprobante de pago" 
}: ReceiptViewerModalProps) {
  const [downloadingFile, setDownloadingFile] = useState(false);
  const { url: signedUrl, loading, error, retryCount } = useSignedUrl(receiptUrl);

  const isImage = filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || receiptUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const displayUrl = signedUrl || receiptUrl;

  const handleDownload = async () => {
    if (!receiptUrl || !filename) return;
    
    setDownloadingFile(true);
    try {
      // Try to download using the signed URL first
      const downloadUrl = signedUrl || receiptUrl;
      
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      toast.success("Archivo descargado exitosamente");
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error("Error al descargar el archivo");
    } finally {
      setDownloadingFile(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title} - {filename}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {loading && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando comprobante...</p>
              {retryCount > 0 && (
                <p className="text-sm text-gray-500 mt-2">Reintento {retryCount}/2</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 rounded-lg p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <p className="text-red-700 mb-4">No se pudo cargar el comprobante</p>
              <p className="text-sm text-red-600 mb-4">URL: {receiptUrl}</p>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(displayUrl || receiptUrl, '_blank')}
                >
                  Abrir en nueva pestaña
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Recargar página
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && displayUrl && (
            <div className="bg-gray-50 rounded-lg p-4">
              {isImage ? (
                <img 
                  src={displayUrl} 
                  alt={title}
                  className="w-full h-auto rounded-lg shadow-sm max-h-[600px] object-contain"
                  onLoad={() => console.log('Imagen cargada exitosamente:', displayUrl)}
                  onError={(e) => {
                    console.error('Error al cargar imagen:', displayUrl);
                    toast.error("Error al cargar la imagen");
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Vista previa no disponible para este tipo de archivo</p>
                  <Button onClick={handleDownload} disabled={downloadingFile}>
                    <Download className="h-4 w-4 mr-2" />
                    {downloadingFile ? "Descargando..." : "Descargar archivo"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleDownload} disabled={downloadingFile || !displayUrl}>
            <Download className="h-4 w-4 mr-2" />
            {downloadingFile ? "Descargando..." : "Descargar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}