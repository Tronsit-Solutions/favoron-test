import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Eye, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentReceiptViewerProps {
  paymentReceipt?: {
    filename?: string;
    fileUrl?: string;
    filePath?: string;
    uploadedAt?: string;
  };
  packageId: string;
  className?: string;
  quote?: {
    price: number;
    serviceFee: number;
    totalPrice: number;
    message?: string;
  };
  estimatedPrice?: number;
}

const PaymentReceiptViewer = ({ paymentReceipt, packageId, className, quote, estimatedPrice }: PaymentReceiptViewerProps) => {
  const [showModal, setShowModal] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate signed URL for private files
  useEffect(() => {
    const getSignedUrl = async () => {
      const filePath = paymentReceipt?.filePath || paymentReceipt?.fileUrl;
      if (!filePath) return;

      try {
        setLoading(true);
        
        let actualFilePath = filePath;
        
        // If it's a full URL, extract the file path
        if (filePath.startsWith('http')) {
          const url = new URL(filePath);
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
  }, [paymentReceipt?.filePath, paymentReceipt?.fileUrl]);

  if (!paymentReceipt?.filePath && !paymentReceipt?.fileUrl) {
    return (
      <Card className={`border-gray-200 bg-gray-50 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center mb-3">
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Sin comprobante de pago</p>
          </div>
          
          {/* Quote Information */}
          {quote && (
            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm font-medium text-gray-800 mb-2">Desglose del Pago</p>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Precio del producto (GMV):</span>
                  <span className="font-medium">${estimatedPrice ? estimatedPrice.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tip del viajero:</span>
                  <span className="font-medium">Q{quote.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cuota Favorón (40%):</span>
                  <span className="font-medium">Q{(quote.price * 0.4).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold">
                  <span>Total a pagar:</span>
                  <span>Q{quote.totalPrice.toFixed(2)}</span>
                </div>
                {quote.message && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs"><strong>Mensaje:</strong> {quote.message}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const isImage = paymentReceipt.filename?.match(/\.(jpg|jpeg|png|gif)$/i);
  const isPDF = paymentReceipt.filename?.match(/\.pdf$/i);

  const handleDownload = async () => {
    const filePath = paymentReceipt.filePath || paymentReceipt.fileUrl;
    if (!filePath) return;

    try {
      let actualFilePath = filePath;
      
      // If it's a full URL, extract the file path
      if (filePath.startsWith('http')) {
        const url = new URL(filePath);
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
      link.download = paymentReceipt.filename || `comprobante_${packageId}`;
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
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-800">Comprobante de pago</p>
            </div>
          </div>
          
          <div className="text-xs text-green-600 space-y-1 mb-3">
            <p><strong>Archivo:</strong> {paymentReceipt.filename}</p>
            {paymentReceipt.uploadedAt && (
              <p><strong>Subido:</strong> {new Date(paymentReceipt.uploadedAt).toLocaleDateString('es-GT')}</p>
            )}
          </div>

          {/* Quote Information */}
          {quote && (
            <div className="border-t border-green-200 pt-3 mb-3">
              <p className="text-sm font-medium text-green-800 mb-2">Desglose del Pago</p>
              <div className="text-xs text-green-600 space-y-1">
                <div className="flex justify-between">
                  <span>Precio del producto (GMV):</span>
                  <span className="font-medium">${estimatedPrice ? estimatedPrice.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tip del viajero:</span>
                  <span className="font-medium">Q{quote.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cuota Favorón (40%):</span>
                  <span className="font-medium">Q{(quote.price * 0.4).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-green-200 pt-1 font-semibold">
                  <span>Total a pagar:</span>
                  <span>Q{quote.totalPrice.toFixed(2)}</span>
                </div>
                {quote.message && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <p className="text-xs"><strong>Mensaje:</strong> {quote.message}</p>
                  </div>
                )}
              </div>
            </div>
          )}

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
                  alt="Comprobante de pago"
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
          </div>
        </CardContent>
      </Card>

      {/* Modal for full-size view */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Comprobante de pago - {paymentReceipt.filename}</span>
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
                  alt="Comprobante de pago"
                  className="w-full h-auto max-h-[70vh] object-contain rounded border"
                />
              ) : (
                <div className="bg-gray-100 p-8 text-center rounded">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-700 mb-4">Cargando imagen...</p>
                </div>
              )
            ) : isPDF ? (
              <div className="bg-gray-100 p-8 text-center rounded">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-700 mb-4">Vista previa de PDF no disponible</p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
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
    </>
  );
};

export default PaymentReceiptViewer;