import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Download, Eye, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FavoronPaymentReceiptViewerProps {
  receiptUrl?: string;
  receiptFilename?: string;
  paymentOrderId: string;
  amount: number;
  className?: string;
  onDelete?: () => void;
}

const FavoronPaymentReceiptViewer = ({ 
  receiptUrl, 
  receiptFilename, 
  paymentOrderId, 
  amount,
  className,
  onDelete 
}: FavoronPaymentReceiptViewerProps) => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isImage = receiptFilename?.match(/\.(jpg|jpeg|png|gif)$/i);
  const isPDF = receiptFilename?.match(/\.pdf$/i);

  // Generate signed URL for private files
  useEffect(() => {
    const getSignedUrl = async () => {
      if (!receiptUrl) return;

      try {
        setLoading(true);
        
        let actualFilePath = receiptUrl;
        
        // If it's a full URL, extract the file path
        if (receiptUrl.startsWith('http')) {
          const url = new URL(receiptUrl);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.findIndex(part => part === 'payment-receipts');
          
          if (bucketIndex === -1) return;
          
          actualFilePath = pathParts.slice(bucketIndex + 1).join('/');
        }

        // Create signed URL for viewing (valid for 1 hour)
        const { data, error } = await supabase.storage
          .from('payment-receipts')
          .createSignedUrl(actualFilePath, 3600);

        if (!error && data.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error creating signed URL:', error);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [receiptUrl]);

  // Load PDF as blob when modal opens
  useEffect(() => {
    if (showModal && isPDF && !pdfBlobUrl) {
      loadPdfAsBlob();
    }
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, isPDF]);

  const loadPdfAsBlob = async () => {
    if (!receiptUrl) return;

    setLoadingPdf(true);
    try {
      let actualFilePath = receiptUrl;
      
      if (receiptUrl.startsWith('http')) {
        const url = new URL(receiptUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(part => part === 'payment-receipts');
        if (bucketIndex === -1) return;
        actualFilePath = pathParts.slice(bucketIndex + 1).join('/');
      }

      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .download(actualFilePath);

      if (!error && data) {
        // Ensure the blob has the correct MIME type for PDF rendering
        const pdfBlob = data instanceof Blob && data.type === 'application/pdf'
          ? data
          : new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        setPdfBlobUrl(url);
        console.log('PDF blob URL created');
      }
    } catch (error) {
      console.error('Error loading PDF as blob:', error);
    } finally {
      setLoadingPdf(false);
    }
  };

  if (!receiptUrl) {
    return (
      <Card className={`border-gray-200 bg-gray-50 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center mb-3">
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Sin comprobante de pago de Favorón</p>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-800 mb-2">Información del Pago</p>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Monto a pagar al viajero:</span>
                <span className="font-medium">Q{amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }


  const handleDownload = async () => {
    if (!receiptUrl) return;

    try {
      let actualFilePath = receiptUrl;
      
      // If it's a full URL, extract the file path
      if (receiptUrl.startsWith('http')) {
        const url = new URL(receiptUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(part => part === 'payment-receipts');
        
        if (bucketIndex === -1) {
          toast.error("Error en la URL del archivo");
          return;
        }
        
        actualFilePath = pathParts.slice(bucketIndex + 1).join('/');
      }

      // Download the file using Supabase client
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .download(actualFilePath);

      if (error) {
        console.error('Error downloading file:', error);
        toast.error("Error al descargar el archivo");
        return;
      }

      // Create a blob URL and download
      const blob = new Blob([data], { type: data.type });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = receiptFilename || `comprobante_favoron_${paymentOrderId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      toast.success("Archivo descargado exitosamente");
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error("Error al descargar el archivo");
    }
  };

  return (
    <>
      <Card className={`border-purple-200 bg-purple-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-medium text-purple-800">Comprobante de Pago de Favorón</p>
            </div>
          </div>
          
          <div className="text-xs text-purple-600 space-y-1 mb-3">
            <p><strong>Archivo:</strong> {receiptFilename}</p>
            <p><strong>Monto pagado:</strong> Q{amount.toFixed(2)}</p>
          </div>

          {/* Preview thumbnail for images */}
          {isImage && (
            <div className="mb-3">
              {loading ? (
                <div className="w-full h-32 bg-gray-200 rounded border flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Cargando imagen...</p>
                </div>
              ) : signedUrl ? (
                <img 
                  src={signedUrl} 
                  alt="Comprobante de pago de Favorón"
                  className="w-full h-32 object-cover rounded border cursor-pointer"
                  onClick={() => setShowModal(true)}
                />
              ) : (
                <div className="w-full h-32 bg-gray-200 rounded border flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Error al cargar imagen</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowModal(true)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-1" />
              Descargar
            </Button>
            {onDelete && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading || deleting}
                className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal for full-size view */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Comprobante de pago de Favorón - {receiptFilename}</span>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {isImage ? (
              signedUrl ? (
                <img 
                  src={signedUrl} 
                  alt="Comprobante de pago de Favorón"
                  className="w-full h-auto max-h-[70vh] object-contain rounded border"
                />
              ) : (
                <div className="bg-gray-100 p-8 text-center rounded">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-700 mb-4">Cargando imagen...</p>
                </div>
              )
            ) : isPDF ? (
              loadingPdf ? (
                <div className="w-full h-[70vh] bg-gray-100 rounded-lg border flex items-center justify-center">
                  <p className="text-gray-500">Cargando PDF...</p>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="Comprobante de pago de Favorón"
                  className="w-full h-[70vh] rounded-lg border"
                />
              ) : (
                <div className="w-full h-[70vh] bg-gray-100 rounded-lg border flex flex-col items-center justify-center">
                  <FileText className="h-16 w-16 mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-4">No se pudo cargar el PDF</p>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" /> Descargar
                  </Button>
                </div>
              )
            ) : (
              <div className="bg-gray-100 p-8 text-center rounded">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-700 mb-4">Vista previa no disponible</p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar archivo
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comprobante de pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El comprobante de pago de Favorón será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setDeleting(true);
                try {
                  if (onDelete) {
                    await onDelete();
                  }
                  setShowDeleteDialog(false);
                } finally {
                  setDeleting(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FavoronPaymentReceiptViewer;
